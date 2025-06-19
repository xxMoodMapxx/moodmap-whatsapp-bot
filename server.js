// MoodMap WhatsApp Bot - OPTION 42 MongoDB 🚀
// IA Pure + Service Externe Images + Template Clean + MongoDB Atlas
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const axios = require('axios');
const { MongoClient } = require('mongodb');

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
  console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Définie' : '❌ MANQUANTE'}`);
  process.exit(1);
}

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.use(bodyParser.urlencoded({ extended: false }));

// ===== MONGODB CONFIGURATION =====
let db = null;
let usersCollection = null;

async function connectToMongoDB() {
    try {
        const mongoClient = new MongoClient(process.env.MONGODB_URI);
        await mongoClient.connect();
        db = mongoClient.db('moodmap');
        usersCollection = db.collection('users');
        console.log('✅ Connecté à MongoDB Atlas');
        
        // Migration automatique des données JSON existantes
        await migrateDataIfNeeded();
    } catch (error) {
        console.error('❌ Erreur connexion MongoDB:', error);
        process.exit(1);
    }
}

// Migration des données userData.json vers MongoDB
async function migrateDataIfNeeded() {
    try {
        const fs = require('fs');
        if (fs.existsSync('userData.json')) {
            console.log('📦 Migration des données JSON vers MongoDB...');
            const jsonData = JSON.parse(fs.readFileSync('userData.json', 'utf8'));
            
            for (const [userId, userData] of Object.entries(jsonData)) {
                await usersCollection.replaceOne(
                    { userId: userId },
                    { 
                        userId: userId,
                        cartes: userData.cartes || [],
                        preferences: userData.preferences || {},
                        lastUpdated: new Date()
                    },
                    { upsert: true }
                );
            }
            
            // Backup du fichier JSON puis suppression
            fs.renameSync('userData.json', `userData_backup_${Date.now()}.json`);
            console.log('✅ Migration terminée ! Données sauvées dans MongoDB');
        }
    } catch (error) {
        console.error('⚠️ Erreur migration:', error);
    }
}

// ===== NOUVELLES FONCTIONS MONGODB =====

async function getUserData(userId) {
    try {
        const user = await usersCollection.findOne({ userId: userId });
        return user ? { 
            cartes: user.cartes || [], 
            preferences: user.preferences || {} 
        } : { 
            cartes: [], 
            preferences: {} 
        };
    } catch (error) {
        console.error('❌ Erreur lecture utilisateur:', error);
        return { cartes: [], preferences: {} };
    }
}

async function saveUserData(userId, userData) {
    try {
        await usersCollection.replaceOne(
            { userId: userId },
            { 
                userId: userId,
                cartes: userData.cartes || [],
                preferences: userData.preferences || {},
                lastUpdated: new Date()
            },
            { upsert: true }
        );
        
        // Statistiques
        const totalUsers = await usersCollection.countDocuments();
        const totalCards = await usersCollection.aggregate([
            { $project: { cardCount: { $size: "$cartes" } } },
            { $group: { _id: null, total: { $sum: "$cardCount" } } }
        ]).toArray();
        
        console.log(`💾 Données sauvegardées: ${totalUsers} users, ${totalCards[0]?.total || 0} cartes`);
    } catch (error) {
        console.error('❌ Erreur sauvegarde:', error);
    }
}

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

// NOUVELLE FONCTION : Double analyse patterns avec contextualisation
async function detectDoublePatternWithAI(userCards, currentMessage, lastInsights = []) {
  if (!userCards || userCards.length < 3) {
    console.log(`ℹ️ Pas assez de cartes pour patterns (${userCards?.length || 0}/3 minimum)`);
    return null;
  }
  
  console.log('🔍 Double détection patterns IA...');
  
  const recentCards = userCards.slice(-7); // 7 dernières cartes
  const allCards = userCards; // Toutes les cartes
  console.log(`📊 Analyse ${recentCards.length} cartes récentes + ${allCards.length} cartes totales`);
  
  // Contexte temporel récent
  const recentContext = recentCards.map((c, i) => {
    const date = new Date(c.timestamp);
    const dayName = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][date.getDay()];
    const hour = date.getHours();
    const period = hour < 12 ? 'matin' : hour < 18 ? 'après-midi' : 'soir';
    return `${dayName} ${period} (${hour}h): "${c.message}" → ${c.emotions.map(e => `${e.emotion}(${e.intensite}/10)`).join(', ')}`;
  }).join('\n');
  
  // Évolution long terme (échantillon)
  const longTermSample = allCards.length > 20 ? 
    [...allCards.slice(0, 5), ...allCards.slice(-10)] : allCards;
  const longTermContext = longTermSample.map((c, i) => {
    const date = new Date(c.timestamp);
    const relativeDate = allCards.length > 20 ? 
      (i < 5 ? `début (${date.toLocaleDateString('fr-FR')})` : `récent (${date.toLocaleDateString('fr-FR')})`) :
      date.toLocaleDateString('fr-FR');
    return `${relativeDate}: "${c.message}" → ${c.emotions.map(e => `${e.emotion}(${e.intensite}/10)`).join(', ')}`;
  }).join('\n');
  
  // Anti-redondance
  const lastInsightsText = lastInsights.length > 0 ? 
    `\nDERNIERS INSIGHTS À ÉVITER (ne pas répéter) :\n${lastInsights.slice(-3).join('\n')}` : '';

  const prompt = `Langue : FRANÇAIS UNIQUEMENT.
MESSAGE ACTUEL : "${currentMessage}"

IMPÉRATIF : Les patterns DOIVENT être liés au message actuel !

Format : EXACTEMENT 4 lignes dans cet ordre.

TENDANCE_PATTERN: [pattern récent lié au message actuel, max 15 mots]
TENDANCE_INSIGHT: [suggestion contextuelle au conditionnel, max 15 mots]
EVOLUTION_PATTERN: [évolution long terme liée au message actuel, max 15 mots]  
EVOLUTION_INSIGHT: [suggestion évolutive au conditionnel, max 15 mots]

DONNÉES RÉCENTES (7 dernières) :
${recentContext}

ÉVOLUTION LONG TERME :
${longTermContext}
${lastInsightsText}

MISSION CONTEXTUELLE :
1. TENDANCE = Corrélation récente (7 cartes) avec le message actuel
2. ÉVOLUTION = Changement long terme observable avec le message actuel
3. Chaque pattern DOIT expliquer ou compléter le message actuel
4. Éviter de répéter les derniers insights

EXEMPLES EXCELLENTS :
Message: "Super café avec Mike"
TENDANCE_PATTERN: Interactions sociales boostent ton moral cette semaine
TENDANCE_INSIGHT: Multiplier ces moments pourrait stabiliser ton humeur  
EVOLUTION_PATTERN: Mike génère plus de joie maintenant qu'au début
EVOLUTION_INSIGHT: Cultiver cette amitié pourrait être bénéfique long terme

Message: "Réunion difficile" 
TENDANCE_PATTERN: Stress professionnel récurrent ces derniers jours
TENDANCE_INSIGHT: Préparer tes réunions pourrait réduire cette anxiété
EVOLUTION_PATTERN: Ton rapport au travail s'est tendu depuis le début  
EVOLUTION_INSIGHT: Réévaluer tes priorités professionnelles pourrait aider

INTERDICTIONS :
- Patterns non liés au message actuel
- Répétition des derniers insights
- Anglais ou impératif ("évite", "prends")
- Utilise "pourrait", "semblerait", "il se pourrait que"

Si IMPOSSIBLE de lier au message actuel :
TENDANCE_PATTERN: Contexte insuffisant pour pattern lié au message
TENDANCE_INSIGHT: Continuer à partager pourrait révéler des connexions`;

  try {
    const response = await callMistral(prompt);
    console.log('🔍 Réponse IA double pattern brute:', response);
    
    // Extraction avec regex améliorée
    const tendanceMatch = response.match(/TENDANCE_PATTERN:\s*(.+)\s*\n\s*TENDANCE_INSIGHT:\s*(.+)/i);
    const evolutionMatch = response.match(/EVOLUTION_PATTERN:\s*(.+)\s*\n\s*EVOLUTION_INSIGHT:\s*(.+)/i);
    
    if (!tendanceMatch && !evolutionMatch) {
      console.log('❌ Format double pattern invalide');
      return null;
    }
    
    let result = {};
    
    // Validation pattern récent
    if (tendanceMatch) {
      const [_, tendancePattern, tendanceInsight] = tendanceMatch;
      const cleanTendancePattern = tendancePattern.trim();
      const cleanTendanceInsight = tendanceInsight.trim();
      
      console.log(`🔍 Tendance pattern: "${cleanTendancePattern}"`);
      console.log(`🔍 Tendance insight: "${cleanTendanceInsight}"`);
      
      if (validatePattern(cleanTendancePattern, cleanTendanceInsight) &&
          !cleanTendancePattern.toLowerCase().includes("contexte insuffisant")) {
        result.recent = {
          pattern: cleanTendancePattern,
          insight: cleanTendanceInsight,
          type: "tendance"
        };
        console.log('✅ Pattern tendance validé');
      }
    }
    
    // Validation pattern évolution
    if (evolutionMatch) {
      const [_, evolutionPattern, evolutionInsight] = evolutionMatch;
      const cleanEvolutionPattern = evolutionPattern.trim();
      const cleanEvolutionInsight = evolutionInsight.trim();
      
      console.log(`🔍 Évolution pattern: "${cleanEvolutionPattern}"`);
      console.log(`🔍 Évolution insight: "${cleanEvolutionInsight}"`);
      
      if (validatePattern(cleanEvolutionPattern, cleanEvolutionInsight) &&
          !cleanEvolutionPattern.toLowerCase().includes("contexte insuffisant")) {
        result.longTerm = {
          pattern: cleanEvolutionPattern,
          insight: cleanEvolutionInsight,
          type: "evolution"
        };
        console.log('✅ Pattern évolution validé');
      }
    }
    
    if (Object.keys(result).length === 0) {
      console.log('❌ Aucun pattern valide détecté');
      return null;
    }
    
    console.log(`✅ Double pattern détecté: ${result.recent ? 'Tendance' : ''}${result.recent && result.longTerm ? ' + ' : ''}${result.longTerm ? 'Évolution' : ''}`);
    return result;
    
  } catch (error) {
    console.error('❌ Erreur détection double pattern:', error);
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

// FONCTION PRINCIPALE : Génération HTML pour la carte visuelle avec double patterns
function generateMoodHTML(analysis, message, meteo, doublePattern, timestamp) {
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

  // Construction patterns HTML
  let patternsHTML = '';
  if (doublePattern) {
    if (doublePattern.recent) {
      patternsHTML += `
        <div class="pattern-box">
            <div class="badge">📊 TENDANCE</div>
            <div class="pattern-text">${doublePattern.recent.pattern}</div>
            
            <div class="badge">🧭 PISTE</div>
            <div class="insight-text">${doublePattern.recent.insight}</div>
        </div>`;
    }
    
    if (doublePattern.longTerm) {
      patternsHTML += `
        <div class="pattern-box">
            <div class="badge">📈 ÉVOLUTION</div>
            <div class="pattern-text">${doublePattern.longTerm.pattern}</div>
            
            <div class="badge">🧭 PISTE</div>
            <div class="insight-text">${doublePattern.longTerm.insight}</div>
        </div>`;
    }
  }

  // Construction du HTML avec carte plus haute pour 2 patterns
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
            height: 780px;
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
        
        .card {
            width: 540px;
            height: 780px;
            background: ${gradient};
            border-radius: 30px;
            padding: 45px;
            margin: 0;
            position: relative;
            box-sizing: border-box;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        
        .weather-header {
            color: #374151;
            font-size: 26px;
            font-weight: bold;
            margin-bottom: 25px;
        }
        
        .quote-box {
            background: rgba(255, 255, 255, 0.8);
            border-radius: 15px;
            padding: 18px;
            margin-bottom: 25px;
            font-style: italic;
            color: #374151;
            font-size: 17px;
            line-height: 1.4;
            min-height: 70px;
            display: flex;
            align-items: center;
        }
        
        .emotions-box {
            background: rgba(255, 255, 255, 0.6);
            border-radius: 15px;
            padding: 18px;
            margin-bottom: 18px;
            color: #374151;
        }
        
        .emotion-item {
            font-size: 18px;
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        .emotion-item:last-child {
            margin-bottom: 0;
        }
        
        .pattern-box {
            background: rgba(255, 255, 255, 0.6);
            border-radius: 15px;
            padding: 16px;
            margin-bottom: 16px;
            color: #374151;
        }
        
        .badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 10px;
            padding: 6px 12px;
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #374151;
        }
        
        .pattern-text {
            font-size: 15px;
            line-height: 1.3;
            margin-bottom: 12px;
        }
        
        .insight-text {
            font-size: 15px;
            line-height: 1.3;
        }
        
        .date-footer {
            position: absolute;
            bottom: 35px;
            left: 50%;
            transform: translateX(-50%);
            color: #6B7280;
            font-size: 15px;
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
        
        ${patternsHTML}
        
        <div class="date-footer">
            ${finalDate}
        </div>
    </div>
</body>
</html>`;

  return html;
}

// Génération image via service externe (mise à jour taille)
async function generateImageFromHTML(html) {
  try {
    console.log('🎨 Génération image via service externe...');
    
    // Configuration pour htmlcsstoimage.com avec nouvelle taille
    const response = await axios.post('https://hcti.io/v1/image', {
      html: html,
      css: '', // CSS inclus dans le HTML
      width: 540,
      height: 780, // Hauteur augmentée pour 2 patterns
      device_scale_factor: 2, // Haute définition
      format: 'png',
      viewport_width: 540,
      viewport_height: 780,
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

// Génération carte Option 42 avec double patterns
async function generateOption42Card(analysis, messageOriginal, userId) {
  const meteo = generateMeteo(analysis.emotions);
  console.log(`🌤️ Météo générée: ${meteo.emoji} ${meteo.texte}`);
  
  // Récupération données utilisateur pour patterns + anti-redondance
  const userData = await getUserData(userId);
  const userCards = userData.cartes || [];
  console.log(`📊 Utilisateur ${userId} a ${userCards.length} cartes`);
  
  // Extraire derniers insights pour anti-redondance
  const lastInsights = userCards
    .filter(c => c.recentInsight || c.longTermInsight)
    .slice(-5) // 5 dernières cartes avec insights
    .flatMap(c => [c.recentInsight, c.longTermInsight])
    .filter(Boolean);
  
  // Double détection patterns avec contextualisation
  const doublePattern = await detectDoublePatternWithAI(userCards, messageOriginal, lastInsights);
  console.log(`🔍 Double pattern détecté: ${doublePattern ? 'OUI' : 'NON'}`);
  if (doublePattern) {
    console.log(`📊 Types: ${doublePattern.recent ? 'Tendance' : ''}${doublePattern.recent && doublePattern.longTerm ? ' + ' : ''}${doublePattern.longTerm ? 'Évolution' : ''}`);
  }
  
  // Générer HTML avec double patterns
  const html = generateMoodHTML(
    analysis, 
    messageOriginal, 
    meteo, 
    doublePattern, 
    new Date().toISOString()
  );
  
  // Générer image
  const imageResult = await generateImageFromHTML(html);
  
  return {
    imageResult,
    meteoEmoji: meteo.emoji,
    meteoTexte: meteo.texte,
    hasPattern: !!doublePattern,
    doublePattern: doublePattern,
    html: html // Pour debug si besoin
  };
}

// Stockage carte avec double patterns
async function stockerCarte(userId, carteData, analysis, messageOriginal) {
  const userData = await getUserData(userId);
  
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
  
  // Stocker les double patterns
  if (carteData.hasPattern && carteData.doublePattern) {
    if (carteData.doublePattern.recent) {
      carte.recentPattern = carteData.doublePattern.recent.pattern;
      carte.recentInsight = carteData.doublePattern.recent.insight;
    }
    if (carteData.doublePattern.longTerm) {
      carte.longTermPattern = carteData.doublePattern.longTerm.pattern;
      carte.longTermInsight = carteData.doublePattern.longTerm.insight;
    }
    // Backward compatibility
    carte.pattern = carteData.doublePattern.recent?.pattern || carteData.doublePattern.longTerm?.pattern;
    carte.insight = carteData.doublePattern.recent?.insight || carteData.doublePattern.longTerm?.insight;
    carte.doublePattern = carteData.doublePattern;
  }
  
  userData.cartes.push(carte);
  
  // Limite à 100 cartes par utilisateur
  if (userData.cartes.length > 100) {
    userData.cartes = userData.cartes.slice(-100);
  }
  
  // Sauvegarder dans MongoDB
  await saveUserData(userId, userData);
  
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
      const userData = await getUserData(userId);
      const userCards = userData.cartes || [];
      
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
        // Chercher la dernière carte avec patterns détectés
        const carteAvecPattern = [...userCards].reverse().find(c => c.hasPattern);
        
        if (carteAvecPattern) {
          let habitudesText = `🧠 TES HABITUDES ÉMOTIONNELLES\n\n`;
          
          if (carteAvecPattern.recentPattern) {
            habitudesText += `📊 TENDANCE\n💡 ${carteAvecPattern.recentPattern}\n✨ ${carteAvecPattern.recentInsight}\n\n`;
          }
          
          if (carteAvecPattern.longTermPattern) {
            habitudesText += `📈 ÉVOLUTION\n💡 ${carteAvecPattern.longTermPattern}\n✨ ${carteAvecPattern.longTermInsight}\n\n`;
          }
          
          // Fallback ancien format si pas de nouveaux champs
          if (!carteAvecPattern.recentPattern && !carteAvecPattern.longTermPattern && carteAvecPattern.pattern) {
            habitudesText += `💡 ${carteAvecPattern.pattern}\n✨ ${carteAvecPattern.insight}\n\n`;
          }
          
          habitudesText += `📅 Détecté aujourd'hui\n\n🔍 Plus de détails :\n• "journal" - Historique complet\n• Nouvelles données = nouvelles révélations ! 💪`;
          
          await client.messages.create({
            body: habitudesText,
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
      const userData = await getUserData(userId);
      const userCards = userData.cartes || [];
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
          
          // Affichage patterns (nouveau format puis fallback ancien)
          if (carte.recentPattern) {
            journalText += `📊 ${carte.recentPattern}\n`;
          }
          if (carte.longTermPattern) {
            journalText += `📈 ${carte.longTermPattern}\n`;
          }
          if (!carte.recentPattern && !carte.longTermPattern && carte.pattern) {
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
      const userData = await getUserData(userId);
      const userCards = userData.cartes || [];
      if (userCards.length > 0) {
        userData.cartes.pop();
        await saveUserData(userId, userData);
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
    await stockerCarte(userId, carteData, analysis, message);
    
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
      // Fallback texte si image échoue - MISE À JOUR DOUBLE PATTERNS
      let fallbackCard = `${carteData.meteoEmoji} ${carteData.meteoTexte}\n\n`;
      
      analysis.emotions.forEach(emotion => {
        const emotionEmoji = getEmotionEmoji(emotion.emotion);
        const emotionText = emotion.emotion.charAt(0).toUpperCase() + emotion.emotion.slice(1);
        fallbackCard += `${emotionEmoji} ${emotionText} : ${emotion.intensite}/10\n`;
      });
      
      if (carteData.hasPattern && carteData.doublePattern) {
        if (carteData.doublePattern.recent) {
          fallbackCard += `\n📊 TENDANCE: ${carteData.doublePattern.recent.pattern}`;
          fallbackCard += `\n🧭 PISTE: ${carteData.doublePattern.recent.insight}`;
        }
        if (carteData.doublePattern.longTerm) {
          fallbackCard += `\n📈 ÉVOLUTION: ${carteData.doublePattern.longTerm.pattern}`;
          fallbackCard += `\n🧭 PISTE: ${carteData.doublePattern.longTerm.insight}`;
        }
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
app.get('/export', async (req, res) => {
  try {
    const allUsers = await usersCollection.find({}).toArray();
    const exportData = {};
    allUsers.forEach(user => {
      exportData[user.userId] = {
        cartes: user.cartes || [],
        preferences: user.preferences || {}
      };
    });
    res.json(exportData);
  } catch (error) {
    console.error('❌ Erreur export:', error);
    res.status(500).json({ error: 'Erreur export données' });
  }
});

// Health check
app.get('/health', async (req, res) => {
  try {
    const userCount = await usersCollection.countDocuments();
    const totalCards = await usersCollection.aggregate([
      { $project: { cardCount: { $size: "$cartes" } } },
      { $group: { _id: null, total: { $sum: "$cardCount" } } }
    ]).toArray();
    
    res.json({
      status: 'OK',
      version: 'Option 42 V2.0 MongoDB - Service Externe Images',
      users: userCount,
      cards: totalCards[0]?.total || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erreur health check:', error);
    res.status(500).json({ error: 'Erreur health check' });
  }
});

// Route d'accueil
app.get('/', (req, res) => {
  res.send(`
    <h1>🌈 MoodMap WhatsApp Bot - MongoDB</h1>
    <p>Status: ✅ Actif avec MongoDB Atlas</p>
    <p>Version: Option 42 V2.0 MongoDB</p>
    <p>Envoie un message WhatsApp à ton numéro configuré !</p>
    <small>Powered by MongoDB Atlas 🍃</small>
  `);
});

// Connexion MongoDB au démarrage
connectToMongoDB().then(() => {
  app.listen(port, () => {
    console.log('🚀 MoodMap WhatsApp Bot - OPTION 42 MongoDB V2.0 démarré sur port', port);
    console.log('🍃 Base de données MongoDB Atlas');
    console.log('🎨 Génération cartes visuelles via service externe');
    console.log('🎯 IA Pure avec validation stricte');
    console.log('⚡ 2 appels Mistral + 1 génération image par carte');
    console.log('🧠 Patterns intelligents automatiques');
    console.log('🛡️ Fallback robuste intégré (texte si image échoue)');
    console.log('🌈 Cartes pastels modernes pour WhatsApp');
    console.log('💾 Données persistantes sur MongoDB Atlas');
    console.log('💪 Ready for visual revolution with MongoDB !');
  });
});
