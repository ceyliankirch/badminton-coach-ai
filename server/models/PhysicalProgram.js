const mongoose = require('mongoose');

const PhysicalProgramSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  focus: {
    type: String, // ex: "Explosivité"
    required: true
  },
  content: {
    warmup: [String], // Liste des échauffements
    main: [String],   // Liste du corps de séance
    cooldown: [String] // Liste des étirements
  }
});

module.exports = mongoose.model('PhysicalProgram', PhysicalProgramSchema);