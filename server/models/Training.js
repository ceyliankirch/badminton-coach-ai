const mongoose = require('mongoose');

const TrainingSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  theme: {
    type: String,
    required: true // Le thème est obligatoire
  },
  notes: {
    type: String, // Tes notes personnelles
    default: ""
  },
  rating: {
    type: Number, // Une note sur 10 par exemple
    min: 0,
    max: 10
  },
  aiFeedback: {
    type: String, // C'est ici que l'IA écrira ses conseils plus tard
    default: "En attente d'analyse..."
  }
});

module.exports = mongoose.model('Training', TrainingSchema);