// MoodMap WhatsApp Bot - OPTION 42 🚀
// IA Pure + Fallback Strict + Template Clean
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const axios = require('axios');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;

// Validation des variables d'environnement
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.MISTRAL_API_KEY || !process.env.TWILIO_PHONE_NUMBER) {
  console.error('❌ ERREUR : Variables d\'environnement manquantes !');
  console.log('🔍 Variables requises :');
  console.log(`TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Définie' : '❌ MANQUANTE'}`);
  console.log(`TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? '✅ Définie' : '❌ MANQUANTE'}`);
  console.log(`MISTRAL_API_KEY: ${process.env.MISTRAL_API_KEY ? '✅ Définie' : '❌ MANQUANTE'}`);
  console.log(`TWILIO_PHONE_NUMBER: ${process.env.TWILIO_PHONE_NUMBER ? '✅ Définie' : '❌ MANQUANTE'}`);
  process.exit(1);
}

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.use(bodyParser.urlencoded({ extended: false }));

// Chargement des données utilisateur
let userData = {};
if (fs.existsSync('userData.json')) {
  try {
    userData = JSON.parse(fs.readFileSync('userData.json'));
    const userCount = Object.keys(userData).length;
    const totalCards = Object.values(userData).reduce((sum, user) => sum + (user.cartes?.length || 0), 0);
    console.log('✅ Données utilisateur restaurées depuis userData.json');
    console.log(`📊 ${userCount} utilisateurs rechargés, ${totalCards} cartes totales`);
  } catch (err) {
    console.error('⚠️ Erreur de lecture du fichier userData.json :', err);
  }
}

// Sauvegarde automatique toutes les minutes
setInterval(() => {
  try {
    fs.writeFileSync('userData.json', JSON.stringify(userData, null, 2));
    const userCount = Object.keys(userData).length;
    const totalCards = Object.values(userData).reduce((sum, user) => sum + (user.cartes?.length || 0), 0);
    console.log(`💾 Données sauvegardées: ${userCount} users, ${totalCards} cartes`);
  } catch (err) {
    console.error('❌ Erreur sauvegarde:', err);
  }
}, 60000);

// Système météo simplifié - 3 niveaux seulement
const meteoSimple = {
  joie: [
    { niveau: 1, texte: "Petit rayon", emoji: "🌤️" },
    { niveau: 2, texte: "Soleil", emoji: "☀️" },
    { niveau: 3, texte: "Grand soleil", emoji: "🌞" }
  ],
  tristesse: [
    { niveau: 1, texte: "Nuages légers", emoji: "⛅" },
    { niveau: 2, texte: "Temps gris", emoji: "☁️" },
    { niveau: 3, texte: "Pluie", emoji: "🌧️" }
  ],
  colère: [
    { niveau: 1, texte: "Vent léger", emoji: "🍃" },
    { niveau: 2, texte: "Vent fort", emoji: "💨" },
    { niveau: 3, texte: "Tempête", emoji: "⛈️" }
  ],
  peur: [
    { niveau: 1, texte: "Brume", emoji: "🌫️" },
    { niveau: 2, texte: "Brouillard", emoji: "🌫️" },
    { niveau: 3, texte: "Brouillard épais", emoji: "🌫️" }
  ],
  surprise: [
    { niveau: 1, texte: "Arc-en-ciel timide", emoji: "🌈" },
    { niveau: 2, texte: "Arc-en-ciel", emoji: "🌈" },
    { niveau: 3, texte: "Arc-en-ciel éclatant", emoji: "🌈" }
  ],
  motivation: [
    { niveau: 1, texte: "Brise fraîche", emoji: "🍃" },
    { niveau: 2, texte: "Vent dynamique", emoji: "💨" },
    { niveau: 3, texte: "Énergie pure", emoji: "⚡" }
  ],
  fatigue: [
    { niveau: 1, texte: "Temps calme", emoji: "😶‍🌫️" },
    { niveau: 2, texte: "Ciel lourd", emoji: "☁️" },
    { niveau: 3, texte: "Brouillard dense", emoji: "🌫️" }
  ],
  sérénité: [
    { niveau: 1, texte: "Ciel paisible", emoji: "🌤️" },
    { niveau: 2, texte: "Douceur", emoji: "☁️" },
    { niveau: 3, texte: "Zen total", emoji: "🌅" }
  ]
};

// Fonction d'appel Mistral
async function callMistral(prompt) {
  try {
    const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('❌ Erreur Mistral:', error.response?.data || error.message);
    throw error;
  }
}

// Analyse émotionnelle Mistral
async function analyzeEmotions(message) {
  console.log('🧠 Analyse émotionnelle Mistral...');
  
  const prompt = `Analyse les émotions dans ce message en français.

Message: "${message}"

IMPORTANT : Réponds UNIQUEMENT avec du JSON pur, sans balises markdown, sans ```json, sans texte autour.

Format JSON exact attendu :
{
  "emotions": [
    {"emotion": "joie", "intensite": 7},
    {"emotion": "gratitude", "intensite": 5}
  ]
}

Règles strictes :
- 1 à 3 émotions maximum
- Intensité entre 1 et 10
- Noms d'émotions simples : joie, tristesse, colère, peur, surprise, motivation, fatigue, sérénité, gratitude, etc.
- INTERDICTION ABSOLUE d'utiliser l'anglais
- JSON pur seulement, pas de markdown
- Pas de texte explicatif avant ou après le JSON`;

  try {
    const response = await callMistral(prompt);
    
    // Nettoyage réponse Mistral (enlever markdown si présent)
    let cleanResponse = response.trim();
    if (cleanResponse.includes('```json')) {
      cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    }
    
    const analysis = JSON.parse(cleanResponse);
    
    // Validation
    if (!analysis.emotions || !Array.isArray(analysis.emotions)) {
      throw new Error('Format JSON invalide');
    }
    
    // Nettoyage et validation des émotions
    analysis.emotions = analysis.emotions.filter(e => 
      e.emotion && 
      typeof e.intensite === 'number' && 
      e.intensite >= 1 && 
      e.intensite <= 10
    ).slice(0, 3); // Max 3 émotions
    
    return analysis;
  } catch (error) {
    console.error('❌ Erreur analyse émotions:', error);
    // Fallback
    return {
      emotions: [{ emotion: "neutre", intensite: 5 }]
    };
  }
}

// Validation stricte des patterns IA
function validatePattern(pattern, insight) {
  // Vérification longueur
  if (!pattern || !insight || pattern.length < 8 || insight.length < 8) return false;
  if (pattern.length > 80 || insight.length > 80) return false;
  
  // Mots interdits (IA qui sait pas quoi dire)
  const forbiddenWords = ['semble', 'peut-être', 'probablement', 'il se pourrait', 'pourrait', 'aucun'];
  const patternLower = pattern.toLowerCase();
  const insightLower = insight.toLowerCase();
  
  if (forbiddenWords.some(word => patternLower.includes(word) || insightLower.includes(word))) {
    return false;
  }
  
  // Validation français plus robuste
  const frenchIndicators = ['tu', 'te', 'ton', 'tes', 'quand', 'avec', 'pour', 'dans', 'sur', 'est', 'sont'];
  const hasFrenchPattern = frenchIndicators.some(word => patternLower.includes(word));
  const hasFrenchInsight = frenchIndicators.some(word => insightLower.includes(word));
  
  if (!hasFrenchPattern || !hasFrenchInsight) return false;
  
  // Vérification anglais (heuristique simple)
  const englishWords = ['you', 'are', 'when', 'with', 'your', 'seem', 'feel', 'the', 'and'];
  const hasEnglish = englishWords.some(word => 
    patternLower.includes(word) || insightLower.includes(word));
  
  return !hasEnglish;
}

// Détection de patterns avec IA + validation stricte
async function detectPatternWithAI(userCards) {
  if (!userCards || userCards.length < 3) {
    console.log(`ℹ️ Pas assez de cartes pour pattern (${userCards?.length || 0}/3 minimum)`);
    return null;
  }
  
  console.log('🔍 Détection pattern IA...');
  
  const recentCards = userCards.slice(-7); // 7 dernières cartes
  console.log(`📊 Analyse de ${recentCards.length} cartes récentes`);
  
  const prompt = `Langue : FRANÇAIS UNIQUEMENT.
Format : EXACTEMENT deux lignes.

Pattern: [observation factuelle, max 12 mots]
Insight: [suggestion constructive, max 12 mots]

Données (derniers messages):
${recentCards.map(c => 
  `"${c.message}" → ${c.emotions.map(e => `${e.emotion}(${e.intensite}/10)`).join(', ')}`
).join('\n')}

Exemples de réponses VALIDES :
Pattern: Tu es joyeux quand tu vois des amis
Insight: Les relations sociales te font du bien

Pattern: Fatigue récurrente les soirs de travail
Insight: Prendre des pauses pourrait t'aider

Pattern: Motivation forte pour le sport malgré obstacles
Insight: Cette détermination est une vraie force

Si tu n'as RIEN de pertinent à dire, réponds :
Pattern: Aucun motif notable pour le moment
Insight: Continue à partager tes émotions

INTERDICTIONS :
- Pas d'anglais
- Pas de "semble", "peut-être", "probablement"
- Pas de psychologie de comptoir
- Sois factuel et constructif`;

  try {
    const response = await callMistral(prompt);
    console.log('🔍 Réponse IA pattern brute:', response);
    
    // Extraction avec regex
    const match = response.match(/Pattern:\s*(.+)\nInsight:\s*(.+)/i);
    if (!match) {
      console.log('❌ Format pattern invalide');
      return null;
    }
    
    const [_, pattern, insight] = match;
    const cleanPattern = pattern.trim();
    const cleanInsight = insight.trim();
    
    console.log(`🔍 Pattern extrait: "${cleanPattern}"`);
    console.log(`🔍 Insight extrait: "${cleanInsight}"`);
    
    // Validation stricte
    if (!validatePattern(cleanPattern, cleanInsight)) {
      console.log('❌ Pattern rejeté par validation');
      return null;
    }
    
    // Vérification "aucun motif"
    if (cleanPattern.toLowerCase().includes("aucun motif") || 
        cleanInsight.toLowerCase().includes("aucun insight")) {
      console.log('ℹ️ Aucun pattern détecté par IA');
      return null;
    }
    
    console.log('✅ Pattern validé et accepté');
    return {
      pattern: cleanPattern,
      insight: cleanInsight
    };
    
  } catch (error) {
    console.error('❌ Erreur détection pattern:', error);
    return null;
  }
}

// Génération météo selon émotion dominante
function generateMeteo(emotions) {
  if (!emotions || emotions.length === 0) {
    return { emoji: "☁️", texte: "Temps neutre" };
  }
  
  // Émotion la plus intense
  const emotionDominante = emotions.reduce((prev, current) => 
    current.intensite > prev.intensite ? current : prev
  );
  
  const familleMeteo = meteoSimple[emotionDominante.emotion] || meteoSimple.sérénité;
  
  // Niveau selon intensité (1-3 selon 1-10)
  let niveau = 1;
  if (emotionDominante.intensite >= 7) niveau = 3;
  else if (emotionDominante.intensite >= 4) niveau = 2;
  
  const meteo = familleMeteo[niveau - 1];
  return {
    emoji: meteo.emoji,
    texte: meteo.texte
  };
}

// Génération carte Option 42
async function generateOption42Card(analysis, messageOriginal, userId) {
  const meteo = generateMeteo(analysis.emotions);
  console.log(`🌤️ Météo générée: ${meteo.emoji} ${meteo.texte}`);
  
  // Détection pattern IA
  const userCards = userData[userId]?.cartes || [];
  console.log(`📊 Utilisateur ${userId} a ${userCards.length} cartes`);
  
  const pattern = await detectPatternWithAI(userCards);
  console.log(`🔍 Pattern détecté: ${pattern ? 'OUI' : 'NON'}`);
  
  // Template Option 42 clean
  let card = `${meteo.emoji} ${meteo.texte}\n\n`;
  
  // Émotions avec intensité sur 10
  analysis.emotions.forEach(emotion => {
    const emotionEmoji = getEmotionEmoji(emotion.emotion);
    card += `${emotionEmoji} ${emotion.emotion}: ${emotion.intensite}/10\n`;
  });
  
  // Pattern/Insight si détecté
  if (pattern) {
    card += `\n💡 ${pattern.pattern}`;
    card += `\n✨ ${pattern.insight}`;
    console.log(`✅ Pattern ajouté à la carte`);
  } else {
    console.log(`ℹ️ Aucun pattern ajouté à la carte`);
  }
  
  card += `\n\nPour annuler : annule`;
  
  return {
    card,
    meteoEmoji: meteo.emoji,
    meteoTexte: meteo.texte,
    hasPattern: !!pattern,
    patternData: pattern
  };
}

// Emojis émotions
function getEmotionEmoji(emotion) {
  const emojis = {
    joie: "😊",
    tristesse: "😔",
    colère: "😠",
    peur: "😰",
    surprise: "😮",
    motivation: "💪",
    fatigue: "😴",
    sérénité: "😌",
    gratitude: "🙏",
    amour: "❤️",
    espoir: "🌟",
    déception: "😞",
    fierté: "😊",
    inquiétude: "😟",
    excitation: "🤩",
    calme: "😌",
    stress: "😰",
    satisfaction: "😌",
    nostalgie: "😌",
    neutre: "😐"
  };
  return emojis[emotion] || "😐";
}

// Stockage carte
function stockerCarte(userId, carteData, analysis, messageOriginal) {
  if (!userData[userId]) {
    userData[userId] = { cartes: [], preferences: {} };
  }
  
  const carte = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    message: messageOriginal,
    emotions: analysis.emotions,
    meteoEmoji: carteData.meteoEmoji,
    meteoTexte: carteData.meteoTexte,
    hasPattern: carteData.hasPattern,
    patternData: carteData.patternData
  };
  
  userData[userId].cartes.push(carte);
  
  // Limite à 100 cartes par utilisateur
  if (userData[userId].cartes.length > 100) {
    userData[userId].cartes = userData[userId].cartes.slice(-100);
  }
  
  console.log(`💾 Carte émotionnelle stockée pour ${userId}`);
}

// Routes principales
app.post('/webhook', async (req, res) => {
  const message = req.body.Body?.trim();
  const from = req.body.From;
  
  if (!message || !from) {
    return res.sendStatus(400);
  }
  
  const userId = from;
  console.log(`📱 Message reçu de ${userId}: "${message}"`);
  
  try {
    // Gestion des commandes spéciales
    if (message.toLowerCase() === 'hello' || message.toLowerCase() === 'salut') {
      await client.messages.create({
        body: '🌈 Bienvenue sur MoodMap Option 42 ! Raconte-moi ce que tu ressens ou ce qui t\'a traversé aujourd\'hui 😊',
        from: process.env.TWILIO_PHONE_NUMBER,
        to: from
      });
      return res.sendStatus(200);
    }
    
    if (message.toLowerCase() === 'aide' || message.toLowerCase() === 'help') {
      await client.messages.create({
        body: `❓ GUIDE MOODMAP OPTION 42

💬 UTILISATION :
Raconte-moi simplement ce que tu ressens !

📚 COMMANDES :
• "journal" - Historique émotions
• "annule" - Efface dernière carte

🎯 OBJECTIF :
Découvrir tes patterns émotionnels !`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: from
      });
      return res.sendStatus(200);
    }
    
    if (message.toLowerCase() === 'journal') {
      const userCards = userData[userId]?.cartes || [];
      if (userCards.length === 0) {
        await client.messages.create({
          body: '📖 Ton journal est vide ! Commence par partager tes émotions.',
          from: process.env.TWILIO_PHONE_NUMBER,
          to: from
        });
      } else {
        const lastCards = userCards.slice(-5);
        let journalText = '📖 TES DERNIÈRES ÉMOTIONS :\n\n';
        lastCards.forEach((carte, index) => {
          const date = new Date(carte.timestamp).toLocaleDateString('fr-FR');
          journalText += `${index + 1}. ${date}\n`;
          journalText += `${carte.meteoEmoji} ${carte.meteoTexte}\n`;
          carte.emotions.forEach(e => {
            journalText += `${getEmotionEmoji(e.emotion)} ${e.emotion}: ${e.intensite}/10\n`;
          });
          if (carte.hasPattern) {
            journalText += `💡 ${carte.patternData.pattern}\n`;
          }
          journalText += '\n';
        });
        
        await client.messages.create({
          body: journalText,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: from
        });
      }
      return res.sendStatus(200);
    }
    
    if (message.toLowerCase() === 'annule') {
      const userCards = userData[userId]?.cartes || [];
      if (userCards.length > 0) {
        userData[userId].cartes.pop();
        await client.messages.create({
          body: '✅ Dernière carte supprimée !',
          from: process.env.TWILIO_PHONE_NUMBER,
          to: from
        });
      } else {
        await client.messages.create({
          body: '❌ Aucune carte à supprimer !',
          from: process.env.TWILIO_PHONE_NUMBER,
          to: from
        });
      }
      return res.sendStatus(200);
    }
    
    // Analyse émotionnelle principale
    const analysis = await analyzeEmotions(message);
    const carteData = await generateOption42Card(analysis, message, userId);
    
    // Stockage
    stockerCarte(userId, carteData, analysis, message);
    
    // Envoi réponse
    await client.messages.create({
      body: carteData.card,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: from
    });
    
    res.sendStatus(200);
    
  } catch (error) {
    console.error('❌ Erreur traitement message:', error);
    
    try {
      await client.messages.create({
        body: '❌ Désolé, je rencontre une difficulté technique. Peux-tu réessayer ?',
        from: process.env.TWILIO_PHONE_NUMBER,
        to: from
      });
    } catch (sendError) {
      console.error('❌ Erreur envoi message d\'erreur:', sendError);
    }
    
    res.sendStatus(500);
  }
});

// Route d'export des données
app.get('/export', (req, res) => {
  res.json(userData);
});

// Health check
app.get('/health', (req, res) => {
  const userCount = Object.keys(userData).length;
  const totalCards = Object.values(userData).reduce((sum, user) => sum + (user.cartes?.length || 0), 0);
  
  res.json({
    status: 'OK',
    version: 'Option 42 V1.0',
    users: userCount,
    cards: totalCards,
    timestamp: new Date().toISOString()
  });
});

// Démarrage serveur
app.listen(port, () => {
  console.log('🚀 MoodMap WhatsApp Bot - OPTION 42 démarré sur port', port);
  console.log('🎯 IA Pure avec validation stricte');
  console.log('⚡ 2 appels Mistral par carte seulement');
  console.log('🧠 Patterns intelligents automatiques');
  console.log('🛡️ Fallback robuste intégré');
  console.log('💪 Ready for revolution !');
});
