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
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Serveur pro sur le port ${PORT}`));

// ==========================================
// CONFIGURATION
// ==========================================
app.use(cors());

// --- CRUCIAL : Augmenter la limite pour supporter les images en Base64 ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connecté'))
  .catch(err => console.error('❌ Erreur MongoDB:', err));

// Configuration Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ==========================================
// 1. MODÈLES (SCHEMAS MONGOOSE)
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
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, username: user.username, avatar: user.avatar } });
  } catch (err) { res.status(500).send('Erreur serveur'); }
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

// --- C. ENTRAÎNEMENTS ---
app.get('/api/trainings', auth, async (req, res) => {
  try {
    const trainings = await Training.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(trainings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- RÉCUPÉRER L'HISTORIQUE DES SÉANCES PHYSIQUES ---
app.get('/api/prepa/history', auth, async (req, res) => {
  try {
    // On cherche tous les programmes liés à l'ID de l'utilisateur connecté
    const history = await PhysicalProgram.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(history);
  } catch (err) {
    console.error("Erreur historique physique:", err);
    res.status(500).json({ message: "Erreur lors de la récupération de l'historique" });
  }
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

// --- D. PRÉPA PHYSIQUE ---
app.post('/api/prepa', auth, async (req, res) => {
  const { focus } = req.body;
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Coach physique. JSON UNIQUEMENT. { \"warmup\": [], \"main\": [], \"cooldown\": [] }." },
        { role: "user", content: `Séance 45 min focus: "${focus}".` }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" } 
    });
    res.json(JSON.parse(completion.choices[0].message.content));
  } catch (error) { res.status(500).json({ message: "Erreur IA." }); }
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

// ==========================================
// F. UTILISATEUR & PROFIL 
// ==========================================

// --- NOUVELLE ROUTE : Mise à jour de l'avatar depuis la galerie ---
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
// 4. DÉMARRAGE SERVEUR
// ==========================================
app.listen(PORT, () => console.log(`🚀 Serveur lancé sur le port ${PORT}`));