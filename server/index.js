const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Import du modèle
const Training = require('./models/Training');
const PhysicalProgram = require('./models/PhysicalProgram'); // <--- AJOUTE ÇA

const app = express();
const PORT = process.env.PORT || 5000;

// Config IA
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(express.json());

// Connexion BDD
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connecté'))
  .catch(err => console.error(err));

// --- ROUTES ---

// 1. Récupérer tous les entraînements
app.get('/api/trainings', async (req, res) => {
  try {
    const trainings = await Training.find().sort({ date: -1 });
    res.json(trainings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Ajouter un entraînement + ANALYSE IA
app.post('/api/trainings', async (req, res) => {
  const { theme, notes, rating } = req.body;

  let aiAdvice = "Pas d'analyse disponible.";

  try {
    // Appel à l'IA Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest"});
    
    const prompt = `Tu es un coach de badminton professionnel de haut niveau. 
    Voici les notes de mon entraînement d'aujourd'hui :
    Thème : ${theme}
    Mes sensations/notes : "${notes}"
    Ma note de satisfaction : ${rating}/10.
    
    Donne-moi un feedback court, encourageant mais technique, et 2 points précis d'amélioration pour la prochaine fois. Reste concis (max 3 phrases).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    aiAdvice = response.text();
    
    console.log("🤖 Conseil généré :", aiAdvice);

  } catch (error) {
    console.error("Erreur IA:", error);
    aiAdvice = "L'IA n'a pas pu analyser la séance (Erreur connexion).";
  }

  // Sauvegarde en base de données
  try {
    const newTraining = new Training({
      theme,
      notes,
      rating,
      aiFeedback: aiAdvice // On stocke le conseil ici !
    });
    
    const savedTraining = await newTraining.save();
    res.status(201).json(savedTraining);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ... (tes routes précédentes /api/trainings sont au-dessus) ...

// --- NOUVELLE ROUTE : GÉNÉRATEUR DE PRÉPA ---
app.post('/api/prepa', async (req, res) => {
  const { focus } = req.body; // ex: "Explosivité", "Endurance"...

  try {
    // On utilise le modèle que tu as choisi
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `Agis comme un préparateur physique expert en badminton.
    Crée une séance de 45 minutes axée sur : "${focus}".
    
    IMPORTANT : Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans aucun texte autour (pas de markdown, pas de bonjour).
    Utilise exactement cette structure :
    {
      "warmup": ["exercice 1", "exercice 2"...],
      "main": ["exercice 1", "exercice 2"...],
      "cooldown": ["exercice 1", "exercice 2"...]
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Nettoyage : Parfois l'IA ajoute des "```json", on les enlève pour éviter les bugs
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // On transforme le texte en objet JavaScript
    const program = JSON.parse(text); 
    
    res.json(program);

  } catch (error) {
    console.error("Erreur génération prépa:", error);
    // Si l'IA échoue, on renvoie une erreur propre
    res.status(500).json({ message: "Erreur lors de la génération." });
  }
});

// 4. Sauvegarder un programme généré
app.post('/api/prepa/save', async (req, res) => {
  const { focus, program } = req.body; // On reçoit le programme complet

  try {
    const newProgram = new PhysicalProgram({
      focus,
      content: program
    });
    const saved = await newProgram.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. Récupérer l'historique des prépas
app.get('/api/prepa/history', async (req, res) => {
  try {
    const history = await PhysicalProgram.find().sort({ date: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- DANS SERVER.JS ---

// 1. LE MODÈLE (SCHEMA)
const CompetitionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  category: { type: String, enum: ['Tournoi', 'Interclub'], required: true },
  tableau: { type: String, required: true }, // Simple, Double, Mixte
  result: { type: String, enum: ['Victoire', 'Défaite'], required: true },
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

// 2. LA ROUTE POST (Ajout + Analyse IA)
app.post('/api/competitions', async (req, res) => {
  try {
    const { category, tableau, result, scores, description, videoUrl } = req.body;

    // Configuration de l'IA
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // On formate le score pour que l'IA comprenne
    const scoreStr = `Set 1: ${scores.set1.me}-${scores.set1.opp}, Set 2: ${scores.set2.me}-${scores.set2.opp}, Set 3: ${scores.set3.me}-${scores.set3.opp}`;
    
    // Contexte dynamique : Victoire ou Défaite
    let contextPrompt = "";
    if (result === 'Victoire') {
        contextPrompt = "J'ai GAGNÉ ce match. Félicite-moi brièvement, analyse pourquoi j'ai gagné basé sur ma description et dis-moi ce que je dois conserver.";
    } else {
        contextPrompt = "J'ai PERDU ce match. Sois encourageant, analyse mes erreurs basées sur ma description et donne-moi des pistes de travail.";
    }

    const prompt = `
      Tu es un coach expert de badminton.
      Détails du match : ${category} en ${tableau}.
      Score : ${scoreStr}.
      Mon ressenti : "${description}".
      
      ${contextPrompt}
      
      Réponds de manière concise, structurée et motivante.
    `;

    const aiResponse = await model.generateContent(prompt);
    const feedback = aiResponse.response.text();

    // Sauvegarde en base de données
    const newComp = new Competition({
      category,
      tableau,
      result,
      scores,
      description,
      videoUrl,
      aiFeedback: feedback
    });

    await newComp.save();
    res.json(newComp);

  } catch (error) {
    console.error("Erreur serveur:", error);
    res.status(500).json({ error: "Erreur lors de l'enregistrement" });
  }
});

// 3. LA ROUTE GET (Récupérer l'historique)
app.get('/api/competitions', async (req, res) => {
  try {
    // On trie par date décroissante (le plus récent en haut)
    const comps = await Competition.find().sort({ date: -1 });
    res.json(comps);
  } catch (error) {
    res.status(500).json({ error: "Erreur récupération" });
  }
});

// Lancement serveur

app.listen(PORT, () => console.log(`🚀 Serveur sur port ${PORT}`));