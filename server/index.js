const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// multer n'est plus strictement nécessaire si tu ne fais plus d'upload d'image, 
// mais je le laisse au cas où tu en aurais besoin plus tard.
const multer = require('multer'); 
const axios = require('axios');   
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- CONFIGURATION ---
app.use(cors());
app.use(express.json());

// Configuration Multer (gardée au cas où, mais plus utilisée pour l'avatar)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connecté'))
  .catch(err => console.error('❌ Erreur MongoDB:', err));

// Configuration de l'IA Gemini (Pour le texte)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


// ==========================================
// 1. MODÈLES (SCHEMAS MONGOOSE)
// ==========================================

// --- Utilisateur ---
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, unique: true, sparse: true }, // <--- NOUVEAU : Champ pour le pseudo (sparse permet d'avoir des null/undefined uniques)
  avatar: { type: String, default: "" }, 
  date: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// --- Entraînement ---
const TrainingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  theme: String,
  notes: String,
  rating: Number,
  aiFeedback: String
});
const Training = mongoose.model('Training', TrainingSchema);

// --- Programme Physique ---
const PhysicalProgramSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  focus: String,
  content: Object 
});
const PhysicalProgram = mongoose.model('PhysicalProgram', PhysicalProgramSchema);

// --- Compétition ---
const CompetitionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  category: { type: String, required: true },
  tableau: { type: String, required: true },
  result: { type: String, required: true },
  scores: {
    set1: { me: String, opp: String },
    set2: { me: String, opp: String },
    set3: { me: String, opp: String }
  },
  description: String,
  videoUrl: String,
  aiFeedback: String
});
const Competition = mongoose.model('Competition', CompetitionSchema);


// ==========================================
// 2. MIDDLEWARE D'AUTHENTIFICATION
// ==========================================
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'Pas de token, autorisation refusée' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token invalide' });
  }
};


// ==========================================
// 3. ROUTES API
// ==========================================

// --- A. AUTHENTIFICATION ---

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "L'utilisateur existe déjà" });

    user = new User({ name, email, password });
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    await user.save();

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    // On renvoie aussi les nouveaux champs
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, username: user.username, avatar: user.avatar } });
  } catch (err) {
    res.status(500).send('Erreur serveur');
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Identifiants invalides' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Identifiants invalides' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, username: user.username, avatar: user.avatar } });
  } catch (err) {
    res.status(500).send('Erreur serveur');
  }
});


// --- B. DASHBOARD ---

app.get('/api/home/summary', auth, async (req, res) => {
  try {
    const recentTrainings = await Training.find({ userId: req.user.id }).sort({ date: -1 }).limit(3);

    if (recentTrainings.length === 0) {
      return res.json({ summary: "Commence ton journal pour activer le coach !" });
    }

    const trainingsText = recentTrainings.map(t => 
      `- ${t.theme} (Note: ${t.rating}/10, Sensations: "${t.notes}")`
    ).join('\n');

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
    const prompt = `
      Agis comme un coach sportif personnel. Voici les 3 dernières séances :
      ${trainingsText}
      Analyse la forme actuelle en 4/5 phrases détaillées. Ajoute 1 phrase de motivation intense. Tutoiement. Pas de gras/markdown.
    `;

    const result = await model.generateContent(prompt);
    res.json({ summary: result.response.text() });

  } catch (err) {
    console.error("Erreur résumé:", err);
    res.json({ summary: "Analyse momentanément indisponible." });
  }
});


// --- C. ENTRAÎNEMENTS ---

app.get('/api/trainings', auth, async (req, res) => {
  try {
    const trainings = await Training.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(trainings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/trainings', auth, async (req, res) => {
  const { theme, notes, rating } = req.body;
  let aiAdvice = "Pas d'analyse disponible.";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Coach badminton. Séance: ${theme}. Notes: "${notes}". Note: ${rating}/10. Feedback court et technique (max 3 phrases).`;
    const result = await model.generateContent(prompt);
    aiAdvice = result.response.text();
  } catch (error) {
    console.error("Erreur IA Training:", error.message);
  }

  try {
    const newTraining = new Training({
      userId: req.user.id,
      theme, notes, rating,
      aiFeedback: aiAdvice
    });
    const saved = await newTraining.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/trainings/:id', auth, async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) return res.status(404).json({ msg: 'Non trouvé' });
    if (training.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Non autorisé' });

    await Training.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Supprimé' });
  } catch (err) {
    res.status(500).send('Erreur serveur');
  }
});


// --- D. PRÉPA PHYSIQUE ---

app.post('/api/prepa', auth, async (req, res) => {
  const { focus } = req.body;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      Coach physique expert. Séance 45 min : "${focus}".
      RÉPONSE: UNIQUEMENT un JSON valide. Pas de texte avant/après.
      Structure: { "warmup": ["..."], "main": ["..."], "cooldown": ["..."] }
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const program = JSON.parse(text);
    res.json(program);
  } catch (error) {
    console.error("Erreur IA Prépa:", error);
    res.status(500).json({ message: "Erreur format IA." });
  }
});

app.post('/api/prepa/save', auth, async (req, res) => {
  const { focus, program } = req.body;
  try {
    const newProgram = new PhysicalProgram({
      userId: req.user.id,
      focus,
      content: program
    });
    const saved = await newProgram.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: "Erreur sauvegarde" });
  }
});

app.get('/api/prepa/history', auth, async (req, res) => {
  try {
    const history = await PhysicalProgram.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Erreur historique" });
  }
});

app.delete('/api/prepa/:id', auth, async (req, res) => {
  try {
    const prog = await PhysicalProgram.findById(req.params.id);
    if (!prog) return res.status(404).json({ msg: 'Non trouvé' });
    if (prog.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Non autorisé' });

    await PhysicalProgram.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Supprimé' });
  } catch (err) {
    res.status(500).send('Erreur serveur');
  }
});


// --- E. COMPÉTITIONS ---

app.get('/api/competitions', auth, async (req, res) => {
  try {
    const comps = await Competition.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(comps);
  } catch (error) {
    res.status(500).json({ error: "Erreur récupération" });
  }
});

app.post('/api/competitions', auth, async (req, res) => {
  try {
    const { category, tableau, result, scores, description, videoUrl } = req.body;
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const scoreStr = `Set 1: ${scores.set1.me}-${scores.set1.opp}, Set 2: ${scores.set2.me}-${scores.set2.opp}`;
    const prompt = `Coach badminton. Match: ${category} ${tableau}. Score: ${scoreStr}. Résultat: ${result}. Ressenti: "${description}". Analyse et conseil court.`;
    
    let feedback = "";
    try {
        const aiRes = await model.generateContent(prompt);
        feedback = aiRes.response.text();
    } catch (e) { console.log("IA indisponible pour match"); }

    const newComp = new Competition({
      userId: req.user.id,
      category, tableau, result, scores, description, videoUrl,
      aiFeedback: feedback
    });

    await newComp.save();
    res.json(newComp);
  } catch (error) {
    res.status(500).json({ error: "Erreur enregistrement" });
  }
});

app.delete('/api/competitions/:id', auth, async (req, res) => {
  try {
    const match = await Competition.findById(req.params.id);
    if (!match) return res.status(404).json({ msg: 'Non trouvé' });
    if (match.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Non autorisé' });

    await Competition.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Supprimé' });
  } catch (err) {
    res.status(500).json({ message: "Erreur suppression" });
  }
});


// =================================================================
// F. UTILISATEUR & PROFIL (NOUVELLE SECTION)
// =================================================================

// @route   POST api/user/generate-avatar
// NOUVEAU : On n'utilise plus upload.single('image') car c'est du text-to-image
app.post('/api/user/generate-avatar', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ msg: 'Le prompt est manquant' });
    }

    console.log("🎨 Demande de génération d'avatar avec le prompt :", prompt);

    // --- SIMULATION DE GÉNÉRATION (Text-to-Image) ---
    // Tu remplaceras ceci par l'appel à ton API (DALL-E, Banana, etc.)
    const randomSeed = Math.floor(Math.random() * 99999); 
    const newAvatarUrl = `https://api.dicebear.com/7.x/micah/svg?seed=${randomSeed}&backgroundColor=transparent`;
    
    // 2. Mise à jour en Base de Données
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'Utilisateur non trouvé' });

    user.avatar = newAvatarUrl;
    await user.save();

    console.log("✅ Avatar mis à jour :", newAvatarUrl);
    res.json({ avatarUrl: newAvatarUrl });

  } catch (err) {
    console.error("Erreur Avatar:", err);
    res.status(500).send('Erreur lors de la génération de l\'avatar');
  }
});

// @route   PUT api/user/profile
// NOUVEAU : Route pour mettre à jour les infos du profil
app.put('/api/user/profile', auth, async (req, res) => {
  const { name, email, username, password } = req.body;

  try {
    // 1. On cherche l'utilisateur actuel
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'Utilisateur non trouvé' });

    // 2. Vérification si l'email ou le pseudo est déjà pris par un AUTRE utilisateur
    if (email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) return res.status(400).json({ msg: 'Cet email est déjà utilisé' });
    }
    
    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) return res.status(400).json({ msg: 'Ce nom d\'utilisateur est déjà pris' });
    }

    // 3. Mise à jour des champs basiques
    if (name) user.name = name;
    if (email) user.email = email;
    if (username !== undefined) user.username = username; // Permet d'enregistrer une chaîne vide

    // 4. Mise à jour du mot de passe (si fourni)
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    // 5. On renvoie les infos mises à jour (sans le mot de passe bien sûr)
    res.json({
      msg: 'Profil mis à jour avec succès',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: user.avatar
      }
    });

  } catch (err) {
    console.error("Erreur mise à jour profil:", err);
    res.status(500).send('Erreur serveur lors de la mise à jour');
  }
});


// ==========================================
// 4. DÉMARRAGE SERVEUR
// ==========================================
app.listen(PORT, () => console.log(`🚀 Serveur lancé sur le port ${PORT}`));