// MoodMap WhatsApp Bot - OPTION 42 🚀
// IA Pure + Service Externe Images + Template Clean
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

// Gradients couleurs pour les cartes visuelles
const meteoGradients = {
  joie: 'linear-gradient(135deg, #FEF3C7 0%, #FCD34D 50%, #F59E0B 100%)',
  tristesse: 'linear-gradient(135deg, #DBEAFE 0%, #93C5FD 50%, #60A5FA 100%)', 
  colère: 'linear-gradient(135deg, #FCE7F3 0%, #F9A8D4 50%, #EC4899 100%)',
  peur: 'linear-gradient(135deg, #F3F4F6 0%, #D1D5DB 50%, #9CA3AF 100%)',
  surprise: 'linear-gradient(135deg, #EDE9FE 0%, #C4B5FD 50%, #8B5CF6 100%)',
  motivation: 'linear-gradient(135deg, #D1FAE5 0%, #6EE7B7 50%, #10B981 100%)',
  fatigue: 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 50%, #6B7280 100%)',
  sérénité: 'linear-gradient(135deg, #ECFDF5 0%, #A7F3D0 50%, #6EE7B7 100%)'
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

IMPORTANT : Réponds UNIQUEMENT avec du JSON pur, sans balises markdown, sans triple backticks, sans texte autour.

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
  // Vérification longueur - ASSOUPLIE
  if (!pattern || !insight || pattern.length < 8 || insight.length < 8) return false;
  if (pattern.length > 120 || insight.length > 120) return false;
  
  // Mots interdits (IA qui sait pas quoi dire) - VERSION ASSOUPLIE
  const forbiddenWords = ['aucun', 'pas de'];
  const patternLower = pattern.toLowerCase();
  const insightLower = insight.toLowerCase();
  
  if (forbiddenWords.some(word => patternLower.includes(word) || insightLower.includes(word))) {
    return false;
  }
  
  // Validation français plus robuste - ÉLARGIE
  const frenchIndicators = [
    'tu', 'te', 'ton', 'tes', 'ta', 'quand', 'avec', 'pour', 'dans', 'sur', 'est', 'sont',
    'que', 'des', 'les', 'une', 'un', 'le', 'la', 'du', 'de', 'et', 'ou', 'se', 'si',
    'être', 'avoir', 'faire', 'aller', 'voir', 'savoir', 'pouvoir', 'vouloir',
    'sembler', 'pourrait', 'serait', 'devrait', 'il', 'elle', 'nous', 'vous', 'ils', 'elles'
  ];
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

Pattern: [observation factuelle croisant émotions + contexte + timing, max 15 mots]
Insight: [suggestion douce au conditionnel, max 15 mots]

Données récentes avec contexte temporal :
${recentCards.map((c, i) => {
  const date = new Date(c.timestamp);
  const dayName = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][date.getDay()];
  const hour = date.getHours();
  const period = hour < 12 ? 'matin' : hour < 18 ? 'après-midi' : 'soir';
  return `${dayName} ${period} (${hour}h): "${c.message}" → ${c.emotions.map(e => `${e.emotion}(${e.intensite}/10)`).join(', ')}`;
}).join('\n')}

MISSION : Trouve des corrélations subtiles entre émotions, contexte, timing, mots-clés.

Exemples d'insights EXCELLENTS (au conditionnel) :
Pattern: Motivation plus forte le matin quand tu parles de projets
Insight: Planifier tes tâches créatives avant 10h pourrait améliorer ton efficacité

Pattern: Émotions intenses les jours commençant par M  
Insight: Préparer ces journées avec des activités apaisantes pourrait aider

Pattern: Mots positifs doublent quand tu mentionnes des personnes
Insight: Cultiver davantage tes relations sociales pourrait améliorer ton bien-être

INTERDICTIONS :
- Pas de patterns évidents ("tu aimes X car tu dis aimer X")
- Pas d'anglais, pas d'impératif ("évite", "prends", "fais")
- Utilise "pourrait", "semblerait", "il se pourrait que"
- Sois fin, perspicace, utile

Si RIEN de subtil à dire, réponds :
Pattern: Données insuffisantes pour pattern fin
Insight: Continuer à partager pourrait révéler de nouveaux motifs`;

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

// Génération météo avec priorité stress/fatigue ≥7
function generateMeteo(emotions) {
  if (!emotions || emotions.length === 0) {
    return { emoji: "☁️", texte: "Temps neutre", famille: "sérénité" };
  }
  
  // PRIORITÉ 1 : Stress/fatigue intense (≥7) force la météo
  const stressIntense = emotions.find(e => e.emotion === 'stress' && e.intensite >= 7);
  if (stressIntense) {
    return { emoji: "⛈️", texte: "Tempête", famille: "colère" };
  }
  
  const fatigueIntense = emotions.find(e => e.emotion === 'fatigue' && e.intensite >= 7);
  if (fatigueIntense) {
    return { emoji: "🌫️", texte: "Brouillard dense", famille: "fatigue" };
  }
  
  const anxieteIntense = emotions.find(e => e.emotion === 'anxiété' && e.intensite >= 7);
  if (anxieteIntense) {
    return { emoji: "🌫️", texte: "Brouillard épais", famille: "peur" };
  }
  
  // PRIORITÉ 2 : Émotion dominante avec mapping intelligent
  const emotionDominante = emotions.reduce((prev, current) => 
    current.intensite > prev.intensite ? current : prev
  );
  
  // Mapping intelligent des émotions vers familles météo
  let familleMeteo = meteoSimple[emotionDominante.emotion];
  
  // Si émotion inconnue, mapping intelligent
  if (!familleMeteo) {
    const emotionLower = emotionDominante.emotion.toLowerCase();
    
    // Émotions négatives → colère
    if (emotionLower.includes('frustration') || emotionLower.includes('frustré') || 
        emotionLower.includes('agacement') || emotionLower.includes('irritation') ||
        emotionLower.includes('énervement')) {
      familleMeteo = meteoSimple.colère;
    }
    // Émotions tristes → tristesse  
    else if (emotionLower.includes('nostalgie') || emotionLower.includes('mélancolie') ||
             emotionLower.includes('déception') || emotionLower.includes('déçu')) {
      familleMeteo = meteoSimple.tristesse;
    }
    // Émotions anxieuses → peur
    else if (emotionLower.includes('anxiété') || emotionLower.includes('anxieux') ||
             emotionLower.includes('inquiétude') || emotionLower.includes('inquiet')) {
      familleMeteo = meteoSimple.peur;
    }
    // Émotions positives → joie
    else if (emotionLower.includes('gratitude') || emotionLower.includes('reconnaissance') ||
             emotionLower.includes('satisfaction') || emotionLower.includes('fierté')) {
      familleMeteo = meteoSimple.joie;
    }
    // Fallback sécurisé
    else {
      familleMeteo = meteoSimple.sérénité;
    }
  }
  
  let niveau = 1;
  if (emotionDominante.intensite >= 7) niveau = 3;
  else if (emotionDominante.intensite >= 4) niveau = 2;
  
  const meteo = familleMeteo[niveau - 1];
  return {
    emoji: meteo.emoji,
    texte: meteo.texte,
    famille: emotionDominante.emotion
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

// FONCTION PRINCIPALE : Génération HTML pour la carte visuelle
function generateMoodHTML(analysis, message, meteo, pattern, timestamp) {
  // Date formatée en français
  const date = new Date(timestamp);
  const options = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  };
  const formattedDate = date.toLocaleDateString('fr-FR', options);
  const finalDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  // Gradient selon la météo
  const gradient = meteoGradients[meteo.famille] || meteoGradients.sérénité;

  // Construction du HTML
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MoodMap Carte</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            width: 540px;
            height: 680px;
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
        
        .card {
            width: 540px;
            height: 680px;
            background: ${gradient};
            border-radius: 30px;
            padding: 50px;
            margin: 0;
            position: relative;
            box-sizing: border-box;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        
        .weather-header {
            color: #374151;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 30px;
        }
        
        .quote-box {
            background: rgba(255, 255, 255, 0.8);
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 30px;
            font-style: italic;
            color: #374151;
            font-size: 18px;
            line-height: 1.4;
            min-height: 80px;
            display: flex;
            align-items: center;
        }
        
        .emotions-box {
            background: rgba(255, 255, 255, 0.6);
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
            color: #374151;
        }
        
        .emotion-item {
            font-size: 20px;
            margin-bottom: 10px;
            font-weight: 500;
        }
        
        .emotion-item:last-child {
            margin-bottom: 0;
        }
        
        .pattern-box {
            background: rgba(255, 255, 255, 0.6);
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
            color: #374151;
        }
        
        .badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 12px;
            padding: 8px 16px;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #374151;
        }
        
        .pattern-text {
            font-size: 16px;
            line-height: 1.4;
            margin-bottom: 15px;
        }
        
        .insight-text {
            font-size: 16px;
            line-height: 1.4;
        }
        
        .date-footer {
            position: absolute;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            color: #6B7280;
            font-size: 16px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="weather-header">
            ${meteo.emoji} ${meteo.texte}
        </div>
        
        <div class="quote-box">
            "${message}"
        </div>
        
        <div class="emotions-box">
            ${analysis.emotions.map(emotion => {
              const emoji = getEmotionEmoji(emotion.emotion);
              const emotionText = emotion.emotion.charAt(0).toUpperCase() + emotion.emotion.slice(1);
              return `<div class="emotion-item">${emoji} ${emotionText} : ${emotion.intensite}/10</div>`;
            }).join('')}
        </div>
        
        ${pattern ? `
        <div class="pattern-box">
            <div class="badge">📊 TENDANCE</div>
            <div class="pattern-text">${pattern.pattern}</div>
            
            <div class="badge">🧭 PISTE</div>
            <div class="insight-text">${pattern.insight}</div>
        </div>
        ` : ''}
        
        <div class="date-footer">
            ${finalDate}
        </div>
    </div>
</body>
</html>`;

  return html;
}

// Génération image via service externe
async function generateImageFromHTML(html) {
  try {
    console.log('🎨 Génération image via service externe...');
    
    // Configuration pour htmlcsstoimage.com
    const response = await axios.post('https://hcti.io/v1/image', {
      html: html,
      css: '', // CSS inclus dans le HTML
      width: 540,
      height: 680,
      device_scale_factor: 2, // Haute définition
      format: 'png',
      viewport_width: 540,
      viewport_height: 680,
      ms_delay: 0,
      selector: '.card' // Capture seulement la carte, pas toute la page
    }, {
      auth: {
        username: process.env.HCTI_USER_ID || 'demo',
        password: process.env.HCTI_API_KEY || 'demo'
      },
      timeout: 30000
    });

    console.log('✅ Image générée avec succès');
    return {
      url: response.data.url,
      success: true
    };
    
  } catch (error) {
    console.error('❌ Erreur génération image:', error.response?.data || error.message);
    
    // Fallback: on renvoie un texte si l'image échoue
    return {
      url: null,
      success: false,
      fallback: true
    };
  }
}

// Génération carte Option 42 avec image
async function generateOption42Card(analysis, messageOriginal, userId) {
  const meteo = generateMeteo(analysis.emotions);
  console.log(`🌤️ Météo générée: ${meteo.emoji} ${meteo.texte}`);
  
  // Détection pattern IA
  const userCards = userData[userId]?.cartes || [];
  console.log(`📊 Utilisateur ${userId} a ${userCards.length} cartes`);
  
  const pattern = await detectPatternWithAI(userCards);
  console.log(`🔍 Pattern détecté: ${pattern ? 'OUI' : 'NON'}`);
  
  // Générer HTML
  const html = generateMoodHTML(
    analysis, 
    messageOriginal, 
    meteo, 
    pattern, 
    new Date().toISOString()
  );
  
  // Générer image
  const imageResult = await generateImageFromHTML(html);
  
  return {
    imageResult,
    meteoEmoji: meteo.emoji,
    meteoTexte: meteo.texte,
    hasPattern: !!pattern,
    patternData: pattern,
    html: html // Pour debug si besoin
  };
}

// Stockage carte avec patterns complets
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
    imageUrl: carteData.imageResult.url
  };
  
  // Bien stocker le pattern complet
  if (carteData.hasPattern && carteData.patternData) {
    carte.pattern = carteData.patternData.pattern;
    carte.insight = carteData.patternData.insight;
    carte.patternData = carteData.patternData;
  }
  
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
    // Détection des commandes en PREMIER (avant analyse émotionnelle)
    const messageClean = message.toLowerCase().trim();
    
    // Commandes exactes
    if (messageClean === 'hello' || messageClean === 'salut') {
      console.log('🔧 AVANT ENVOI hello');
      await client.messages.create({
        body: '🌈 Bienvenue sur MoodMap !\n\nPartage-moi tes émotions du jour et je crée des cartes visuelles pour mieux te connaître et révéler tes habitudes émotionnelles insoupçonnées ! 😊\n\nTu vas être surpris... 😉✨',
        from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
        to: from
      });
      console.log('✅ APRÈS ENVOI hello');
      return res.sendStatus(200);
    }
    
    // Commandes avec tolérance aux typos
    if (messageClean.includes('habitude') || messageClean === 'habits') {
      const userCards = userData[userId]?.cartes || [];
      
      if (userCards.length === 0) {
        await client.messages.create({
          body: `🧠 TES HABITUDES ÉMOTIONNELLES

Aucune habitude claire détectée pour le moment.

🔍 Détails disponibles :
• "journal" - Historique complet  
• Continue à partager tes émotions ! 💪`,
          from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
          to: from
        });
      } else {
        // Chercher le dernier pattern détecté
        const carteAvecPattern = [...userCards].reverse().find(c => c.hasPattern);
        
        if (carteAvecPattern) {
          await client.messages.create({
            body: `🧠 TES HABITUDES ÉMOTIONNELLES

💡 ${carteAvecPattern.pattern}
✨ ${carteAvecPattern.insight}

📅 Détecté aujourd'hui

🔍 Plus de détails :
• "journal" - Historique complet
• Nouvelles données = nouvelles révélations ! 💪`,
            from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
            to: from
          });
        } else {
          await client.messages.create({
            body: `🧠 TES HABITUDES ÉMOTIONNELLES

Aucune habitude claire détectée pour le moment.

🔍 Détails disponibles :
• "journal" - Historique complet  
• Continue à partager tes émotions ! 💪`,
            from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
            to: from
          });
        }
      }
      return res.sendStatus(200);
    }
    
    if (messageClean === 'aide' || messageClean === 'help') {
      await client.messages.create({
        body: `❓ GUIDE MOODMAP OPTION 42

💬 UTILISATION :
Raconte-moi simplement ce que tu ressens !

📚 COMMANDES :
• "journal" - Historique émotions
• "habitudes" - Tes patterns
• "annule" - Efface dernière carte

🎯 OBJECTIF :
Découvrir tes patterns émotionnels !`,
        from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
        to: from
      });
      return res.sendStatus(200);
    }
    
    if (messageClean === 'journal') {
      const userCards = userData[userId]?.cartes || [];
      if (userCards.length === 0) {
        await client.messages.create({
          body: '📖 Ton journal est vide ! Commence par partager tes émotions.',
          from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
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
            journalText += `💡 ${carte.pattern}\n`;
          }
          journalText += '\n';
        });
        
        await client.messages.create({
          body: journalText,
          from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
          to: from
        });
      }
      return res.sendStatus(200);
    }
    
    if (messageClean === 'annule') {
      const userCards = userData[userId]?.cartes || [];
      if (userCards.length > 0) {
        userData[userId].cartes.pop();
        await client.messages.create({
          body: '✅ Dernière carte supprimée !',
          from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
          to: from
        });
      } else {
        await client.messages.create({
          body: '❌ Aucune carte à supprimer !',
          from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
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
    
    // Envoi IMAGE ou fallback texte
    console.log('🔧 AVANT ENVOI carte');
    
    if (carteData.imageResult.success && carteData.imageResult.url) {
      // Envoi image
      await client.messages.create({
        mediaUrl: [carteData.imageResult.url],
        from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
        to: from
      });
      console.log('✅ APRÈS ENVOI carte visuelle');
    } else {
      // Fallback texte si image échoue
      let fallbackCard = `${carteData.meteoEmoji} ${carteData.meteoTexte}\n\n`;
      
      analysis.emotions.forEach(emotion => {
        const emotionEmoji = getEmotionEmoji(emotion.emotion);
        const emotionText = emotion.emotion.charAt(0).toUpperCase() + emotion.emotion.slice(1);
        fallbackCard += `${emotionEmoji} ${emotionText} : ${emotion.intensite}/10\n`;
      });
      
      if (carteData.hasPattern) {
        fallbackCard += `\n📊 ${carteData.patternData.pattern}`;
        fallbackCard += `\n🧭 ${carteData.patternData.insight}`;
      }
      
      fallbackCard += '\n\nPour annuler : annule';
      
      await client.messages.create({
        body: fallbackCard,
        from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
        to: from
      });
      console.log('✅ APRÈS ENVOI fallback texte');
    }
    
    res.sendStatus(200);
    
  } catch (error) {
    console.error('❌ Erreur traitement message:', error);
    
    try {
      console.log('🚨 AVANT ENVOI erreur');
      await client.messages.create({
        body: '❌ Désolé, je rencontre une difficulté technique. Peux-tu réessayer ?',
        from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
        to: from
      });
      console.log('🚨 APRÈS ENVOI erreur');
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
    version: 'Option 42 V2.0 - Service Externe Images',
    users: userCount,
    cards: totalCards,
    timestamp: new Date().toISOString()
  });
});

// Démarrage serveur
app.listen(port, () => {
  console.log('🚀 MoodMap WhatsApp Bot - OPTION 42 V2.0 démarré sur port', port);
  console.log('🎨 Génération cartes visuelles via service externe');
  console.log('🎯 IA Pure avec validation stricte');
  console.log('⚡ 2 appels Mistral + 1 génération image par carte');
  console.log('🧠 Patterns intelligents automatiques');
  console.log('🛡️ Fallback robuste intégré (texte si image échoue)');
  console.log('🌈 Cartes pastels modernes pour WhatsApp');
  console.log('💪 Ready for visual revolution (service externe) !');
});
