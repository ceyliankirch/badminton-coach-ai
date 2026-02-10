require('dotenv').config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("❌ Pas de clé API trouvée dans .env");
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.models) {
      console.log("✅ Modèles disponibles pour toi :");
      data.models.forEach(model => {
        // On affiche seulement les modèles qui peuvent "générer du contenu"
        if (model.supportedGenerationMethods.includes("generateContent")) {
          console.log(`- ${model.name.replace('models/', '')}`);
        }
      });
    } else {
      console.log("⚠️ Réponse étrange de Google :", data);
    }
  } catch (error) {
    console.error("❌ Erreur de connexion :", error);
  }
}

listModels();