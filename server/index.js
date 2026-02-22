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

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5000",
  "http://127.0.0.1:5173",
  "https://badminton-coach-client.onrender.com", 
  "https://badminton-coach-ai.onrender.com"
];

app.use(cors({
  origin: function (origin, callback) {
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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connecté'))
  .catch(err => console.error('❌ Erreur MongoDB:', err));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.get('/', (req, res) => {
  res.send('🚀 L\'API du Badminton Coach est en ligne et sécurisée !');
});

// ==========================================
// 2. MODÈLES (TOUS REGROUPÉS ICI)
// ==========================================

// 1. USER (DOIT ÊTRE EN PREMIER CAR LES AUTRES LE RÉFÉRENCENT)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, unique: true, sparse: true }, 
  avatar: { type: String, default: "" }, 
  date: { type: Date, default: Date.now },
  role: { 
    type: String, 
    // On autorise 'user' le temps de corriger, et 'joueur' pour les nouveaux
    enum: ['user', 'joueur', 'coach', 'admin'], 
    default: 'joueur' 
  }
});
const User = mongoose.model('User', UserSchema);

// 2. TRAINING
const TrainingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  theme: String,
  notes: String,
  rating: Number,
  aiFeedback: String
});
const Training = mongoose.model('Training', TrainingSchema);

// 3. FEEDBACK
const FeedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['bug', 'feature'], required: true },
  message: { type: String, required: true },
  status: { type: String, default: 'nouveau' }, 
  date: { type: Date, default: Date.now }
});
const Feedback = mongoose.model('Feedback', FeedbackSchema);

// 4. FEATURE (CORRIGÉ : AJOUT DE createdBy)
// --- MODÈLE FEATURE (AMÉLIORÉ) ---
const FeatureSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  startDate: Date,
  endDate: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Nouveaux champs productivité :
  status: { type: String, enum: ['en_attente', 'en_cours', 'termine'], default: 'en_attente' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  date: { type: Date, default: Date.now }
});

const Feature = mongoose.model('Feature', FeatureSchema);

// 5. PHYSICAL PROGRAM
const PhysicalProgramSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  focus: String,
  content: Object 
});
const PhysicalProgram = mongoose.model('PhysicalProgram', PhysicalProgramSchema);

// 6. COMPETITION
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

// --- AUTH ---
app.post('/api/auth/register', async (req, res) => {
  console.log("1. 📩 Requête inscription reçue !");
  if (!req.body) return res.status(500).json({ msg: "Body vide" });
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

  } catch (err) {
    console.error("❌ CRASH :", err);
    res.status(500).json({ msg: 'Erreur interne', details: err.message });
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
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, username: user.username, avatar: user.avatar, role: user.role } });
  } catch (err) { res.status(500).send('Erreur serveur'); }
});

app.post('/become-coach', auth, async (req, res) => {
  const { secretCode } = req.body;
  const COACH_SECRET = "BADMIN2026_"; 
  try {
    if (secretCode !== COACH_SECRET) return res.status(400).json({ msg: "Code incorrect." });
    const user = await User.findById(req.user.id);
    user.role = 'coach';
    await user.save();
    res.json({ msg: "Félicitations, vous êtes maintenant Coach !", user });
  } catch (err) { res.status(500).send('Erreur serveur'); }
});

// --- DASHBOARD ---
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

let dailyMotivation = { text: "Prêt à tout casser aujourd'hui ? 🔥", date: null };
app.get('/api/home/motivation', async (req, res) => {
  const today = new Date().toDateString(); 
  if (dailyMotivation.date === today && dailyMotivation.text) return res.json({ message: dailyMotivation.text });
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "system", content: "Tu es un coach sportif motivant." }, { role: "user", content: "Une phrase courte motivante badminton." }],
      model: "llama-3.3-70b-versatile",
    });
    const newQuote = completion.choices[0].message.content;
    dailyMotivation = { text: newQuote, date: today };
    res.json({ message: newQuote });
  } catch (error) { res.json({ message: "Prêt à dépasser tes limites ?" }); }
});

// --- TRAINING ---
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
        messages: [{ role: "system", content: "Coach badminton concis." }, { role: "user", content: `Séance: ${theme}. Notes: "${notes}". Note: ${rating}/10.` }],
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

app.delete('/api/trainings/:id', auth, async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) return res.status(404).json({ msg: 'Entraînement non trouvé' });
    if (training.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Non autorisé' });
    await training.deleteOne();
    res.json({ msg: 'Entraînement supprimé' });
  } catch (err) { res.status(500).send('Erreur serveur'); }
});

// --- PHYSICAL PREP ---
app.post('/api/prepa', auth, async (req, res) => {
  const { focus } = req.body;
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: `Tu es un préparateur physique expert badminton. Enoncer d'abord le nombre de série et de répétitions pour chaque exercice. Tu dois répondre STRICTEMENT et UNIQUEMENT au format JSON. Voici la structure exacte attendue : { "warmup": ["échauffement 1", "échauffement 2"], "main": ["exercice 1", "exercice 2", "exercice 3", "exercice 4"], "cooldown": ["étirement 1", "étirement 2"] }. Tout doit être en Français.` 
        },
        { role: "user", content: `Objectif : "${focus}".` }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" } 
    });
    
    // On extrait le texte de la réponse
    const responseText = completion.choices[0].message.content;
    
    // On le parse et on l'envoie au frontend
    res.json(JSON.parse(responseText));

  } catch (error) { 
    // 👇 VOILÀ LE DÉTECTEUR DE MENSONGES :
    console.error("🚨 CRASH API GROQ/LLAMA :", error.message || error);
    if (error.error) console.error("Détails Groq :", error.error);
    
    res.status(500).json({ message: "Erreur génération." }); 
  }
});

app.post('/api/prepa/save', auth, async (req, res) => {
  try {
    const { focus, program } = req.body;
    const newProgram = new PhysicalProgram({ userId: req.user.id, focus: focus || "Séance Physique", content: program });
    const saved = await newProgram.save();
    res.json(saved);
  } catch (err) { res.status(500).send('Erreur serveur lors de la sauvegarde'); }
});

app.get('/api/prepa/history', auth, async (req, res) => {
  try {
    const history = await PhysicalProgram.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(history);
  } catch (err) { res.status(500).json({ message: "Erreur" }); }
});

app.delete('/api/prepa/:id', auth, async (req, res) => {
  try {
    const program = await PhysicalProgram.findById(req.params.id);
    if (!program) return res.status(404).json({ msg: 'Programme non trouvé' });
    if (program.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Non autorisé' });
    await program.deleteOne();
    res.json({ msg: 'Programme supprimé' });
  } catch (err) { res.status(500).send('Erreur serveur'); }
});

// --- COMPETITIONS ---
app.get('/api/competitions', auth, async (req, res) => {
  try { const comps = await Competition.find({ userId: req.user.id }).sort({ date: -1 }); res.json(comps); } 
  catch (error) { res.status(500).json({ error: "Erreur" }); }
});

// --- COMPÉTITIONS ---
app.post('/api/competitions', auth, async (req, res) => {
  try {
    const { category, tableau, result, scores, description, videoUrl } = req.body;

    // 1. Demande d'analyse à l'IA (Groq / Llama)
    let aiFeedback = "";
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: `Tu es un coach de badminton expert. Analyse ce match et réponds STRICTEMENT au format JSON avec ces 3 clés exactes : 
            {
              "resume": "Bref résumé de la physionomie du match",
              "tactique": "Propose une stratégie en fonction de l'analyse du joueur et du résultat",
              "conclusion": "Mot de la fin motivant et axes d'amélioration"
            }.
            Tout doit être en Français, sois concis, direct et encourageant.` 
          },
          { 
            role: "user", 
            content: `Catégorie: ${category}, Tableau: ${tableau}, Résultat: ${result}. 
            Scores: Set 1 (${scores.set1.me}-${scores.set1.opp}), Set 2 (${scores.set2.me}-${scores.set2.opp}), Set 3 (${scores.set3.me}-${scores.set3.opp}). 
            Ressenti du joueur : "${description}"` 
          }
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" } 
      });

      // On récupère le texte JSON renvoyé par l'IA
      aiFeedback = completion.choices[0].message.content;
      
    } catch (aiError) {
      console.error("🚨 ERREUR IA COMPÉTITIONS :", aiError.message);
      // Sécurité : si l'IA plante, on met un message par défaut pour ne pas bloquer l'enregistrement
      aiFeedback = JSON.stringify({
        resume: "Analyse indisponible pour le moment.",
        tactique: "L'IA a eu un petit coup de fatigue.",
        conclusion: "Continue de tout donner sur le terrain !"
      });
    }

    // 2. Sauvegarde du match dans la base de données avec l'analyse IA
    // ATTENTION : Remplace "Competition" par le nom exact de ton modèle Mongoose si différent (ex: Match)
    const newMatch = new Competition({ 
      userId: req.user.id,
      category,
      tableau,
      result,
      scores,
      description,
      videoUrl,
      aiFeedback // 👈 L'analyse 3 blocs est enregistrée ici
    });

    const savedMatch = await newMatch.save();
    res.json(savedMatch);

  } catch (err) {
    console.error("Erreur serveur :", err);
    res.status(500).json({ message: "Erreur lors de la sauvegarde du match" });
  }
});

app.delete('/api/competitions/:id', auth, async (req, res) => {
  try {
    const comp = await Competition.findById(req.params.id);
    if (!comp) return res.status(404).json({ msg: 'Match non trouvé' });
    if (comp.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Non autorisé' });
    await comp.deleteOne();
    res.json({ msg: 'Match supprimé avec succès' });
  } catch (err) { res.status(500).send('Erreur serveur'); }
});

app.post('/api/chat', auth, async (req, res) => {
    try {
        const { message } = req.body;

        // 1. Récupérer les données avec LE BON NOM DE MODÈLE (PhysicalProgram)
        const [trainings, prepas, competitions] = await Promise.all([
            Training.find({ userId: req.user.id }).limit(10).sort({ date: -1 }),
            PhysicalProgram.find({ userId: req.user.id }).limit(5).sort({ date: -1 }), /* 👈 MODIFIÉ ICI */
            Competition.find({ userId: req.user.id }).limit(5).sort({ date: -1 })
        ]);

        // 2. Préparer le contexte pour Llama
        const statsContext = `
            Voici les données récentes du joueur :
            - Entraînements (10 derniers) : ${trainings.map(t => t.theme + " (Note: " + t.rating + "/10)").join(', ')}
            - Prépa physique (5 dernières) : ${prepas.map(p => p.type || p.name || 'Séance').join(', ')}
            - Compétitions (5 dernières) : ${competitions.map(c => c.result + " en " + c.tableau).join(', ')}
        `;

        // 3. Appel à Groq
        const completion = await groq.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: `Tu es un coach de badminton expert. Tu as accès aux données réelles du joueur. 
                    Utilise ces données pour donner des conseils ultra-personnalisés. 
                    Si le joueur te pose une question générale, réponds avec expertise. 
                    Si le joueur te demande où il en est, analyse le contexte suivant : ${statsContext}` 
                },
                { role: "user", content: message }
            ],
            model: "llama-3.3-70b-versatile",
        });

        res.json({ reply: completion.choices[0].message.content });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors de la discussion avec le coach." });
    }
});

// --- USER & PROFILE ---
app.post('/api/user/update-avatar', auth, async (req, res) => {
  try {
    const { avatarUrl } = req.body;
    if (!avatarUrl) return res.status(400).json({ msg: 'Aucun avatar fourni' });
    const user = await User.findById(req.user.id);
    user.avatar = avatarUrl;
    await user.save();
    res.json({ avatarUrl: user.avatar });
  } catch (err) { res.status(500).send("Erreur"); }
});

app.put('/api/user/profile', auth, async (req, res) => {
  const { name, email, username, password, role } = req.body; 
  try {
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'Utilisateur non trouvé' });

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) return res.status(400).json({ msg: 'Cet email est déjà utilisé' });
      user.email = email;
    }
    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) return res.status(400).json({ msg: 'Ce nom d\'utilisateur est déjà pris' });
      user.username = username;
    }
    if (name) user.name = name;
    if (role) user.role = role; 

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    await user.save();
    res.json({ msg: 'Profil mis à jour', user: { id: user.id, name: user.name, email: user.email, username: user.username, avatar: user.avatar, role: user.role } });
  } catch (err) { res.status(500).send('Erreur serveur'); }
});

// ==========================================
// ROUTES ADMIN (CORRIGÉES & SÉCURISÉES)
// ==========================================

// 1. Liste des utilisateurs (Avec Training Count)
// 1. Liste des utilisateurs (Version sécurisée et débuggée)
app.get('/api/admin/users', auth, async (req, res) => {
  try {
    // A. Vérification Admin
    const adminUser = await User.findById(req.user.id);
    if (!adminUser) {
      console.log("❌ Admin non trouvé en BDD");
      return res.status(404).json({ msg: "Utilisateur introuvable" });
    }
    if (adminUser.role !== 'admin') {
      console.log(`⛔ Accès refusé pour ${adminUser.name} (Rôle: ${adminUser.role})`);
      return res.status(403).json({ msg: "Accès refusé. Rôle requis : admin" });
    }

    // B. Récupération des users
    // On utilise .lean() pour la performance et pour manipuler l'objet JSON facilement
    const users = await User.find().select('-password').sort({ date: -1 }).lean();
    
    console.log(`✅ ${users.length} utilisateurs trouvés.`);

    // C. Calcul des stats (avec protection anti-crash)
    const usersWithStats = await Promise.all(users.map(async (u) => {
      try {
        const count = await Training.countDocuments({ userId: u._id });
        return { ...u, trainingCount: count };
      } catch (err) {
        console.error(`⚠️ Erreur comptage pour user ${u._id}:`, err.message);
        return { ...u, trainingCount: 0 }; // En cas d'erreur, on met 0 au lieu de faire planter la requête
      }
    }));

    res.json(usersWithStats);

  } catch (err) { 
    console.error("❌ CRASH Route Admin Users:", err);
    res.status(500).send('Erreur serveur'); 
  }
});

// 2. Feedbacks
app.get('/api/admin/feedbacks', auth, async (req, res) => {
  try {
    const feedbacks = await Feedback.find().populate('userId', 'name email').sort({ date: -1 });
    res.json(feedbacks);
  } catch (err) { res.status(500).send('Erreur serveur'); }
});

app.delete('/api/admin/feedbacks/:id', auth, async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') return res.status(403).json({ msg: "Accès refusé" });
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ msg: "Feedback supprimé" });
  } catch (err) { res.status(500).send('Erreur serveur'); }
});

app.delete('/api/admin/users/:id', auth, async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);
    if (adminUser.role !== 'admin') return res.status(403).json({ msg: "Accès refusé" });
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: "Utilisateur supprimé" });
  } catch (err) { res.status(500).send('Erreur serveur'); }
});

// --- WIDGET FEEDBACK ---
app.post('/api/feedback', auth, async (req, res) => {
  try {
    const { type, message } = req.body;
    const newFeedback = new Feedback({ userId: req.user.id, type, message });
    await newFeedback.save();
    res.status(201).json({ msg: 'Retour enregistré', feedback: newFeedback });
  } catch (err) { res.status(500).json({ msg: 'Erreur serveur' }); }
});

// --- ADMIN FEATURES (ROUTES CORRIGÉES) ---
app.get('/api/admin/features', auth, async (req, res) => {
  try {
    // Populate fonctionne maintenant car 'createdBy' est dans le Schéma
    const features = await Feature.find().populate('createdBy', 'name').sort({ startDate: 1 });
    res.json(features);
  } catch (err) { 
    console.error("❌ ERREUR GET FEATURES :", err.message);
    res.status(500).send('Erreur serveur'); 
  }
});

app.post('/api/admin/features', auth, async (req, res) => {
  try {
    const newFeature = new Feature({ ...req.body, createdBy: req.user.id });
    await newFeature.save();
    // On repeuple pour renvoyer le nom direct au front
    const populated = await Feature.findById(newFeature._id).populate('createdBy', 'name');
    res.json(populated);
  } catch (err) { res.status(500).send('Erreur serveur'); }
});

app.put('/api/admin/features/:id', auth, async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);
    if (adminUser.role !== 'admin') return res.status(403).json({ msg: "Accès refusé" });
    const updatedFeature = await Feature.findByIdAndUpdate(
      req.params.id, 
      { $set: req.body }, 
      { new: true }
    ).populate('createdBy', 'name');
    res.json(updatedFeature);
  } catch (err) { res.status(500).send('Erreur serveur'); }
});

app.delete('/api/admin/features/:id', auth, async (req, res) => {
  try {
    await Feature.findByIdAndDelete(req.params.id);
    res.json({ msg: "Feature supprimée" });
  } catch (err) { res.status(500).send('Erreur serveur'); }
});

// ROUTE DE MIGRATION (À utiliser une fois pour réparer la BDD)
app.get('/api/admin/fix-roles', async (req, res) => {
  try {
    // Trouve tous ceux qui sont 'user' et les force en 'joueur'
    const result = await User.updateMany(
      { role: 'user' }, 
      { $set: { role: 'joueur' } }
    );
    res.json({ 
      msg: "Migration terminée !", 
      modified: result.modifiedCount, 
      matched: result.matchedCount 
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// --- ROUTE DE RÉPARATION BDD ---
app.get('/api/repair-roles', async (req, res) => {
  try {
    // 1. Tous ceux qui n'ont PAS de rôle deviennent 'joueur'
    const r1 = await User.updateMany(
      { role: { $exists: false } }, 
      { $set: { role: 'joueur' } }
    );
    
    // 2. Tous ceux qui ont un rôle vide ou 'user' deviennent 'joueur'
    const r2 = await User.updateMany(
      { role: { $in: ['', null, 'user'] } }, 
      { $set: { role: 'joueur' } }
    );

    res.json({ 
      msg: "Réparation terminée !", 
      missingRolesFixed: r1.modifiedCount, 
      oldRolesFixed: r2.modifiedCount 
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ROUTE DE MIGRATION POUR LES CHAMPS MANQUANTS
app.get('/api/fix-missing-roles', async (req, res) => {
  try {
    // La commande magique : $exists: false
    const result = await User.updateMany(
      { role: { $exists: false } }, // Condition : Le champ n'existe pas
      { $set: { role: 'joueur' } }  // Action : On le crée
    );
    
    res.json({ 
      msg: "Mise à jour terminée !", 
      usersUpdated: result.modifiedCount 
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});


// ==========================================
// 5. DÉMARRAGE SERVEUR
// ==========================================
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Serveur pro lancé sur le port ${PORT}`));