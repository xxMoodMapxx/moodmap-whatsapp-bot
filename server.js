// MoodMap WhatsApp Bot - OPTION 42 🚀
// IA Pure + Cartes Visuelles + Template Clean
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const axios = require('axios');
const fs = require('fs');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

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
app.use('/images', express.static('temp_images')); // Servir les images temporaires

// Créer dossier pour images temporaires
if (!fs.existsSync('temp_images')) {
  fs.mkdirSync('temp_images');
}

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
  joie: { start: '#FEF3C7', middle: '#FCD34D', end: '#F59E0B' }, // Jaune chaud
  tristesse: { start: '#DBEAFE', middle: '#93C5FD', end: '#60A5FA' }, // Bleu doux  
  colère: { start: '#FCE7F3', middle: '#F9A8D4', end: '#EC4899' }, // Rose-rouge
  peur: { start: '#F3F4F6', middle: '#D1D5DB', end: '#9CA3AF' }, // Gris 
  surprise: { start: '#EDE9FE', middle: '#C4B5FD', end: '#8B5CF6' }, // Violet
  motivation: { start: '#D1FAE5', middle: '#6EE7B7', end: '#10B981' }, // Vert énergique
  fatigue: { start: '#E5E7EB', middle: '#D1D5DB', end: '#6B7280' }, // Gris terne
  sérénité: { start: '#ECFDF5', middle: '#A7F3D0', end: '#6EE7B7' } // Vert zen
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
  
  // PRIORITÉ 2 : Émotion dominante normale
  const emotionDominante = emotions.reduce((prev, current) => 
    current.intensite > prev.intensite ? current : prev
  );
  
  const familleMeteo = meteoSimple[emotionDominante.emotion] || meteoSimple.sérénité;
  
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

// Fonction utilitaire pour créer un gradient
function createGradient(ctx, width, height, colors) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, colors.start);
  gradient.addColorStop(0.5, colors.middle);
  gradient.addColorStop(1, colors.end);
  return gradient;
}

// Fonction utilitaire pour wrapper le texte
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

// FONCTION PRINCIPALE : Génération carte visuelle
async function generateMoodImage(analysis, message, meteo, pattern, timestamp) {
  const width = 540;
  const height = 680;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fond gradient selon la météo
  const gradientColors = meteoGradients[meteo.famille] || meteoGradients.sérénité;
  const bgGradient = createGradient(ctx, width, height, gradientColors);
  
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Coins arrondis pour la carte
  ctx.beginPath();
  ctx.roundRect(20, 20, width - 40, height - 40, 30);
  ctx.clip();
  ctx.fillRect(0, 0, width, height);

  // Reset clip pour les éléments suivants
  ctx.restore();
  ctx.save();

  // Header météo
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillText(`${meteo.emoji} ${meteo.texte}`, 50, 80);

  // Citation utilisateur (encadré blanc)
  const quoteX = 50;
  const quoteY = 120;
  const quoteWidth = width - 100;
  const quoteHeight = 80;

  // Fond blanc translucide pour la citation
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.roundRect(quoteX, quoteY, quoteWidth, quoteHeight, 15);
  ctx.fill();

  // Texte de la citation
  ctx.fillStyle = '#374151';
  ctx.font = 'italic 16px Arial, sans-serif';
  const quotedMessage = `"${message}"`;
  const quoteLines = wrapText(ctx, quotedMessage, quoteWidth - 40);
  
  quoteLines.forEach((line, index) => {
    ctx.fillText(line, quoteX + 20, quoteY + 30 + (index * 20));
  });

  // Émotions (encadré blanc)
  const emotionsX = 50;
  const emotionsY = 230;
  const emotionsWidth = width - 100;
  const emotionsHeight = analysis.emotions.length * 35 + 20;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.roundRect(emotionsX, emotionsY, emotionsWidth, emotionsHeight, 15);
  ctx.fill();

  // Texte des émotions
  ctx.fillStyle = '#374151';
  ctx.font = '18px Arial, sans-serif';
  
  analysis.emotions.forEach((emotion, index) => {
    const emoji = getEmotionEmoji(emotion.emotion);
    const emotionText = emotion.emotion.charAt(0).toUpperCase() + emotion.emotion.slice(1);
    const text = `${emoji} ${emotionText} : ${emotion.intensite}/10`;
    ctx.fillText(text, emotionsX + 20, emotionsY + 35 + (index * 35));
  });

  // Pattern & Insight (si présent)
  if (pattern) {
    const patternY = emotionsY + emotionsHeight + 20;
    const patternHeight = 120;

    // Fond blanc translucide pour pattern/insight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.roundRect(50, patternY, width - 100, patternHeight, 15);
    ctx.fill();

    // Badge "TENDANCE"
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.roundRect(70, patternY + 15, 120, 25, 12);
    ctx.fill();

    ctx.fillStyle = '#374151';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillText('📊 TENDANCE', 80, patternY + 32);

    // Texte pattern
    ctx.font = '14px Arial, sans-serif';
    const patternLines = wrapText(ctx, pattern.pattern, width - 140);
    patternLines.forEach((line, index) => {
      ctx.fillText(line, 70, patternY + 55 + (index * 16));
    });

    // Badge "PISTE"
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.roundRect(70, patternY + 75, 100, 25, 12);
    ctx.fill();

    ctx.fillStyle = '#374151';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillText('🧭 PISTE', 80, patternY + 92);

    // Texte insight
    ctx.font = '14px Arial, sans-serif';
    const insightLines = wrapText(ctx, pattern.insight, width - 140);
    insightLines.forEach((line, index) => {
      ctx.fillText(line, 70, patternY + 115 + (index * 16));
    });
  }

  // Date en bas
  const date = new Date(timestamp);
  const options = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  };
  const formattedDate = date.toLocaleDateString('fr-FR', options);
  const finalDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  ctx.fillStyle = '#6B7280';
  ctx.font = '14px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(finalDate, width / 2, height - 40);

  // Sauvegarder l'image
  const filename = `mood_card_${Date.now()}.png`;
  const filepath = path.join('temp_images', filename);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filepath, buffer);

  console.log(`🎨 Carte générée: ${filename}`);
  return {
    filepath,
    filename,
    url: `${process.env.BASE_URL || 'https://your-app.onrender.com'}/images/${filename}`
  };
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
  
  // Générer l'image
  const imageData = await generateMoodImage(
    analysis, 
    messageOriginal, 
    meteo, 
    pattern, 
    new Date().toISOString()
  );
  
  return {
    imageData,
    meteoEmoji: meteo.emoji,
    meteoTexte: meteo.texte,
    hasPattern: !!pattern,
    patternData: pattern
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
    imageFilename: carteData.imageData.filename
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

// Nettoyage périodique des images temporaires (garde seulement les 50 dernières)
setInterval(() => {
  try {
    const files = fs.readdirSync('temp_images')
      .filter(file => file.endsWith('.png'))
      .map(file => ({
        name: file,
        time: fs.statSync(path.join('temp_images', file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 50) {
      const filesToDelete = files.slice(50);
      filesToDelete.forEach(file => {
        fs.unlinkSync(path.join('temp_images', file.name));
      });
      console.log(`🧹 Nettoyage: ${filesToDelete.length} images supprimées`);
    }
  } catch (err) {
    console.error('❌ Erreur nettoyage images:', err);
  }
}, 60000 * 10); // Toutes les 10 minutes

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
        body: '🌈 Bienvenue sur MoodMap Option 42 ! Raconte-moi ce que tu ressens ou ce qui t\'a traversé aujourd\'hui 😊',
        from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
        to: from
      });
      console.log('✅ APRÈS ENVOI hello');
      res.writeHead(200, {'Content-Type': 'text/xml'});
      res.end('<Response></Response>');
      return;
    }
    
    // [Autres commandes restent identiques...]
    
    // Analyse émotionnelle principale
    const analysis = await analyzeEmotions(message);
    const carteData = await generateOption42Card(analysis, message, userId);
    
    // Stockage
    stockerCarte(userId, carteData, analysis, message);
    
    // Envoi IMAGE au lieu de texte
    console.log('🔧 AVANT ENVOI carte visuelle');
    await client.messages.create({
      mediaUrl: [carteData.imageData.url],
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: from
    });
    console.log('✅ APRÈS ENVOI carte visuelle');
    
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end('<Response></Response>');
    
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
    
    res.writeHead(500, {'Content-Type': 'text/xml'});
    res.end('<Response></Response>');
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
    version: 'Option 42 V2.0 - Cartes Visuelles',
    users: userCount,
    cards: totalCards,
    timestamp: new Date().toISOString()
  });
});

// Démarrage serveur
app.listen(port, () => {
  console.log('🚀 MoodMap WhatsApp Bot - OPTION 42 V2.0 démarré sur port', port);
  console.log('🎨 Génération cartes visuelles activée');
  console.log('🎯 IA Pure avec validation stricte');
  console.log('⚡ 2 appels Mistral par carte seulement');
  console.log('🧠 Patterns intelligents automatiques');
  console.log('🛡️ Fallback robuste intégré');
  console.log('🌈 Cartes pastels modernes pour WhatsApp');
  console.log('💪 Ready for visual revolution !');
});
