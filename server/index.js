const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer'); 
const axios = require('axios');    
const Groq = require("groq-sdk");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// 1. CONFIGURATION & SÉCURITÉ (CORS)
// ==========================================

// Liste des origines autorisées (Frontend Local + Frontend Production)
const allowedOrigins = [
  "http://localhost:5173",                     // Dev Local
  "http://localhost:3000",                     // Dev Local (au cas où)
  "https://badminton-coach-client.onrender.com", // <--- AJOUTE CETTE LIGNE (Ton Frontend)
  "https://badminton-coach-ai.onrender.com"      // Ton Backend (parfois utile pour les auto-appels)
];

app.use(cors({
  origin: function (origin, callback) {
    // Autorise les requêtes sans origine (ex: Postman, App mobile native) ou si l'origine est dans la liste
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("Bloqué par CORS:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

// Augmenter la limite pour supporter les images en Base64 (Avatars)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connecté'))
  .catch(err => console.error('❌ Erreur MongoDB:', err));

// Configuration Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Route de bienvenue (Pour vérifier que le serveur tourne)
app.get('/', (req, res) => {
  res.send('🚀 L\'API du Badminton Coach est en ligne et sécurisée !');
});

// ==========================================
// 2. MODÈLES (SCHEMAS MONGOOSE)
// ==========================================

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, unique: true, sparse: true }, 
  avatar: { type: String, default: "" }, 
  date: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

const TrainingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  theme: String,
  notes: String,
  rating: Number,
  aiFeedback: String
});
const Training = mongoose.model('Training', TrainingSchema);

const PhysicalProgramSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  focus: String,
  content: Object 
});
const PhysicalProgram = mongoose.model('PhysicalProgram', PhysicalProgramSchema);

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
// 3. MIDDLEWARE D'AUTHENTIFICATION
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
// 4. ROUTES API
// ==========================================

// --- A. AUTHENTIFICATION ---
app.post('/api/auth/register', async (req, res) => {
  console.log("1. 📩 Requête inscription reçue !");
  
  // Test 1 : Est-ce que le body arrive ?
  console.log("2. 📦 Données reçues :", req.body);
  if (!req.body) {
    console.error("❌ ERREUR : req.body est vide ! (Problème express.json ?)");
    return res.status(500).json({ msg: "Body vide" });
  }

  const { name, email, password } = req.body;

  // Test 2 : Est-ce que la DB est connectée ?
  // 0: déconnecté, 1: connecté, 2: connexion en cours, 3: déconnexion
  console.log("3. 🔌 État MongoDB :", mongoose.connection.readyState);
  if (mongoose.connection.readyState !== 1) {
    console.error("❌ ERREUR : MongoDB n'est pas connecté !");
    return res.status(500).json({ msg: "Erreur connexion DB" });
  }

  // Test 3 : Est-ce que le secret est chargé ?
  console.log("4. 🔑 JWT_SECRET présent ?", !!process.env.JWT_SECRET);
  if (!process.env.JWT_SECRET) {
    console.error("❌ ERREUR : JWT_SECRET manquant !");
    return res.status(500).json({ msg: "Config serveur manquante" });
  }

  try {
    console.log("5. 🔍 Recherche utilisateur...");
    let user = await User.findOne({ email });
    if (user) {
      console.log("⚠️ Utilisateur existe déjà");
      return res.status(400).json({ msg: "L'utilisateur existe déjà" });
    }

    console.log("6. 🔨 Création utilisateur...");
    user = new User({ name, email, password });

    console.log("7. 🧂 Hashage mot de passe...");
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    console.log("8. 💾 Sauvegarde en BDD...");
    await user.save(); // <--- C'est souvent ici que ça plante si l'IP MongoDB bloque
    console.log("✅ Sauvegarde réussie !");

    console.log("9. 🎫 Génération Token...");
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    console.log("🎉 SUCCÈS TOTAL !");
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, username: user.username, avatar: user.avatar } });

  } catch (err) {
    console.error("❌ CRASH DANS LE TRY/CATCH :", err);
    // On renvoie l'erreur exacte au frontend pour que tu la voies dans l'inspecteur
    res.status(500).json({ msg: 'Erreur interne', details: err.message, stack: err.stack });
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
  } catch (err) { res.status(500).send('Erreur serveur'); }
});

// --- B. DASHBOARD ---
app.get('/api/home/summary', auth, async (req, res) => {
  try {
    const recentTrainings = await Training.find({ userId: req.user.id }).sort({ date: -1 }).limit(3);
    if (recentTrainings.length === 0) return res.json({ summary: "Commence ton journal pour activer le coach !" });
    const trainingsText = recentTrainings.map(t => `- ${t.theme} (Note: ${t.rating}/10, Sensations: "${t.notes}")`).join('\n');
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Coach sportif badminton. Tutoiement. Pas de gras." },
        { role: "user", content: `Analyses ces 3 séances :\n${trainingsText}\nBilan forme (4 phrases) + 1 motivation.` }
      ],
      model: "llama-3.3-70b-versatile",
    });
    res.json({ summary: completion.choices[0].message.content });
  } catch (err) { res.json({ summary: "Analyse momentanément indisponible." }); }
});

// --- SYSTÈME DE MOTIVATION QUOTIDIENNE ---
let dailyMotivation = {
  text: "Prêt à tout casser aujourd'hui ? 🔥",
  date: null
};

app.get('/api/home/motivation', async (req, res) => {
  const today = new Date().toDateString(); // Ex: "Mon Oct 23 2023"

  // Si on a déjà une phrase pour aujourd'hui, on la renvoie direct (pas d'appel IA)
  if (dailyMotivation.date === today && dailyMotivation.text) {
    return res.json({ message: dailyMotivation.text });
  }

  // Sinon, on génère une nouvelle phrase
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Tu es un coach sportif motivant." },
        { role: "user", content: "Génère une seule phrase courte, motivante et percutante (max 15 mots) pour un joueur de badminton. Alterne aléatoirement entre un conseil physique (cardio, vitesse) ou mental/technique. Tutoiement. Pas de guillemets." }
      ],
      model: "llama-3.3-70b-versatile",
    });

    const newQuote = completion.choices[0].message.content;
    
    // On sauvegarde en mémoire
    dailyMotivation = {
      text: newQuote,
      date: today
    };

    res.json({ message: newQuote });

  } catch (error) {
    console.error("Erreur motivation:", error);
    // En cas d'erreur, on renvoie une phrase par défaut
    res.json({ message: "Prêt à dépasser tes limites ?" });
  }
});

// --- C. ENTRAÎNEMENTS ---
app.get('/api/trainings', auth, async (req, res) => {
  try {
    const trainings = await Training.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(trainings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/trainings', auth, async (req, res) => {
  const { theme, notes, rating } = req.body;
  let aiAdvice = "Pas d'analyse.";
  try {
    const completion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: "Coach badminton concis." },
            { role: "user", content: `Séance: ${theme}. Notes: "${notes}". Note: ${rating}/10. Feedback court (3 phrases).` }
        ],
        model: "llama-3.3-70b-versatile",
    });
    aiAdvice = completion.choices[0].message.content;
  } catch (error) {}
  try {
    const newTraining = new Training({ userId: req.user.id, theme, notes, rating, aiFeedback: aiAdvice });
    const saved = await newTraining.save();
    res.status(201).json(saved);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// --- SUPPRIMER UN ENTRAÎNEMENT ---
app.delete('/api/trainings/:id', auth, async (req, res) => {
  try {
    // 1. On cherche l'entraînement
    const training = await Training.findById(req.params.id);

    // 2. S'il n'existe pas
    if (!training) {
      return res.status(404).json({ msg: 'Entraînement non trouvé' });
    }

    // 3. VÉRIFICATION DE SÉCURITÉ : Est-ce bien TA séance ?
    if (training.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Non autorisé' });
    }

    // 4. Suppression
    await training.deleteOne();
    
    res.json({ msg: 'Entraînement supprimé' });
  } catch (err) {
    console.error(err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Entraînement non trouvé' });
    }
    res.status(500).send('Erreur serveur');
  }
});


// --- D. PRÉPA PHYSIQUE (Prompt Amélioré) ---
app.post('/api/prepa', auth, async (req, res) => {
  const { focus } = req.body;
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: `Tu es un expert en préparation physique pour le badminton.
          Tu dois générer une séance complète de 45 minutes structurée en JSON.
          
          RÈGLES STRICTES :
          1. FORMAT JSON UNIQUEMENT : { "warmup": [], "main": [], "cooldown": [] }
          2. WARMUP : Donne 4 exercices d'échauffement progressif (cardio + articulaire).
          3. MAIN (Corps de séance) : Crée un circuit intense de 4 à 6 exercices ou situations. Précise les répétitions ou le temps (ex: "30s effort / 30s repos").
          4. COOLDOWN : Donne 3 exercices de retour au calme ou étirements légers.
          5. Langue : Français.` 
        },
        { 
          role: "user", 
          content: `Génère une séance intense focalisée sur : "${focus}".` 
        }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" } 
    });
    res.json(JSON.parse(completion.choices[0].message.content));
  } catch (error) { 
    console.error("Erreur IA Prepa:", error);
    res.status(500).json({ message: "Erreur lors de la génération." }); 
  }
});

// --- SAUVEGARDER UN PROGRAMME GÉNÉRÉ ---
app.post('/api/prepa/save', auth, async (req, res) => {
  try {
    const { focus, program } = req.body;

    if (!program) {
      return res.status(400).json({ msg: "Aucun programme à sauvegarder" });
    }

    const newProgram = new PhysicalProgram({
      userId: req.user.id,
      focus: focus || "Séance Physique",
      content: program // On stocke le JSON généré par l'IA
    });

    const saved = await newProgram.save();
    res.json(saved);

  } catch (err) {
    console.error("Erreur sauvegarde prépa:", err);
    res.status(500).send('Erreur serveur lors de la sauvegarde');
  }
});

app.get('/api/prepa/history', auth, async (req, res) => {
  try {
    const history = await PhysicalProgram.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(history);
  } catch (err) {
    console.error("Erreur historique physique:", err);
    res.status(500).json({ message: "Erreur lors de la récupération de l'historique" });
  }
});

// --- E. COMPÉTITIONS ---
app.get('/api/competitions', auth, async (req, res) => {
  try { const comps = await Competition.find({ userId: req.user.id }).sort({ date: -1 }); res.json(comps); } 
  catch (error) { res.status(500).json({ error: "Erreur" }); }
});

app.post('/api/competitions', auth, async (req, res) => {
  try {
    const { category, tableau, result, scores, description, videoUrl } = req.body;
    let feedback = "";
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "Coach de badminton analytique." },
                { role: "user", content: `Match: ${category} ${tableau}. Score: ${JSON.stringify(scores)}. Ressenti: "${description}".` }
            ],
            model: "llama-3.3-70b-versatile",
        });
        feedback = completion.choices[0].message.content;
    } catch (e) {}
    const newComp = new Competition({ userId: req.user.id, category, tableau, result, scores, description, videoUrl, aiFeedback: feedback });
    await newComp.save();
    res.json(newComp);
  } catch (error) { res.status(500).json({ error: "Erreur" }); }
});

// --- SUPPRIMER UNE COMPÉTITION ---
app.delete('/api/competitions/:id', auth, async (req, res) => {
  try {
    const comp = await Competition.findById(req.params.id);
    
    // 1. Vérifie si le match existe
    if (!comp) {
      return res.status(404).json({ msg: 'Match non trouvé' });
    }

    // 2. Vérifie que c'est bien TON match
    if (comp.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Non autorisé' });
    }

    // 3. Supprime
    await comp.deleteOne();
    
    res.json({ msg: 'Match supprimé avec succès' });

  } catch (err) {
    console.error(err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Match non trouvé' });
    }
    res.status(500).send('Erreur serveur');
  }
});

// --- F. UTILISATEUR ---
app.post('/api/user/update-avatar', auth, async (req, res) => {
  try {
    const { avatarUrl } = req.body;
    if (!avatarUrl) return res.status(400).json({ msg: 'Aucun avatar fourni' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    user.avatar = avatarUrl;
    await user.save();
    console.log("✅ Avatar mis à jour en BDD");
    res.json({ avatarUrl: user.avatar });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la mise à jour de l'avatar");
  }
});

app.put('/api/user/profile', auth, async (req, res) => {
  const { name, email, username, password } = req.body;
  try {
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) return res.status(400).json({ msg: 'Cet email est déjà utilisé' });
      user.email = email;
    }
    if (username !== undefined && username !== user.username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) return res.status(400).json({ msg: 'Ce nom d\'utilisateur est déjà pris' });
      user.username = username;
    }
    if (name) user.name = name;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    await user.save();
    res.json({ msg: 'Profil mis à jour', user: { id: user.id, name: user.name, email: user.email, username: user.username, avatar: user.avatar } });
  } catch (err) { res.status(500).send('Erreur serveur'); }
});

// ==========================================
// 5. DÉMARRAGE SERVEUR
// ==========================================
// IMPORTANT : On écoute sur '0.0.0.0' pour Render
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Serveur pro lancé sur le port ${PORT}`));