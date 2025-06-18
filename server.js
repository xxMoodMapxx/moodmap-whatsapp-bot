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
Insight: [conseil actionnable et personnalisé, max 15 mots]

Données récentes avec contexte temporal :
${recentCards.map((c, i) => {
  const date = new Date(c.timestamp);
  const dayName = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][date.getDay()];
  const hour = date.getHours();
  const period = hour < 12 ? 'matin' : hour < 18 ? 'après-midi' : 'soir';
  return `${dayName} ${period} (${hour}h): "${c.message}" → ${c.emotions.map(e => `${e.emotion}(${e.intensite}/10)`).join(', ')}`;
}).join('\n')}

MISSION : Trouve des corrélations subtiles entre émotions, contexte, timing, mots-clés.

Exemples de patterns EXCELLENTS (ne pas recopier) :
Pattern: Motivation plus forte le matin quand tu parles de projets
Insight: Planifie tes tâches créatives avant 10h pour plus d'efficacité

Pattern: Émotions intenses les jours commençant par M
Insight: Prépare ces journées avec des activités apaisantes

Pattern: Mots positifs doublent quand tu mentionnes des personnes  
Insight: Cultive davantage tes relations sociales pour ton bien-être

INTERDICTIONS :
- Pas de patterns évidents ("tu aimes X car tu dis aimer X")
- Pas d'anglais, pas de "semble", "peut-être", "probablement"
- Sois fin, perspicace, utile

Si RIEN de subtil à dire, réponds :
Pattern: Données insuffisantes pour pattern fin
Insight: Continue à partager pour plus de révélations`;

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

// ✅ CORRECTION 1 : Génération météo avec PRIORITÉ stress/fatigue ≥7
function generateMeteo(emotions) {
  if (!emotions || emotions.length === 0) {
    return { emoji: "☁️", texte: "Temps neutre" };
  }
  
  // PRIORITÉ 1 : Stress/fatigue intense (≥7) force la météo
  const stressIntense = emotions.find(e => e.emotion === 'stress' && e.intensite >= 7);
  if (stressIntense) {
    return { emoji: "⛈️", texte: "Tempête" };
  }
  
  const fatigueIntense = emotions.find(e => e.emotion === 'fatigue' && e.intensite >= 7);
  if (fatigueIntense) {
    return { emoji: "🌫️", texte: "Brouillard dense" };
  }
  
  const anxieteIntense = emotions.find(e => e.emotion === 'anxiété' && e.intensite >= 7);
  if (anxieteIntense) {
    return { emoji: "🌫️", texte: "Brouillard épais" };
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

// ✅ CORRECTION 4 : Stockage carte avec patterns complets
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
    hasPattern: carteData.hasPattern
  };
  
  // CORRECTION : Bien stocker le pattern complet
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
    
    // ✅ CORRECTION 3 : Logs détaillés pour debug double "OK"
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
    
    // ✅ CORRECTION 2 : Commande habitudes intelligente
    if (messageClean.includes('habitude') || messageClean === 'habits') {
      const userCards = userData[userId]?.cartes || [];
      
      if (userCards.length < 3) {
        console.log('🔧 AVANT ENVOI habitudes (pas assez données)');
        await client.messages.create({
          body: `🧠 TES HABITUDES ÉMOTIONNELLES

Pas encore assez de données pour analyser tes habitudes.

🔍 Détails disponibles :
• "journal" - Historique complet  
• Continue à partager tes émotions ! 💪`,
          from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
          to: from
        });
        console.log('✅ APRÈS ENVOI habitudes (pas assez données)');
        res.writeHead(200, {'Content-Type': 'text/xml'});
        res.end('<Response></Response>');
        return;
      }
      
      // Chercher le dernier pattern détecté
      const cardsWithPattern = userCards.filter(card => card.hasPattern && card.patternData);
      
      if (cardsWithPattern.length === 0) {
        console.log('🔧 AVANT ENVOI habitudes (aucun pattern)');
        await client.messages.create({
          body: `🧠 TES HABITUDES ÉMOTIONNELLES

Aucune habitude claire détectée pour le moment.

🔍 Détails disponibles :
• "journal" - Historique complet  
• Continue à partager tes émotions ! 💪`,
          from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
          to: from
        });
        console.log('✅ APRÈS ENVOI habitudes (aucun pattern)');
        res.writeHead(200, {'Content-Type': 'text/xml'});
        res.end('<Response></Response>');
        return;
      }
      
      // Prendre le dernier pattern
      const lastPattern = cardsWithPattern[cardsWithPattern.length - 1];
      const daysSince = Math.floor((Date.now() - new Date(lastPattern.timestamp)) / (1000 * 60 * 60 * 24));
      const timeSince = daysSince === 0 ? "aujourd'hui" : `il y a ${daysSince} jour${daysSince > 1 ? 's' : ''}`;
      
      console.log('🔧 AVANT ENVOI habitudes (avec pattern)');
      await client.messages.create({
        body: `🧠 TES HABITUDES ÉMOTIONNELLES

💡 ${lastPattern.patternData.pattern}
✨ ${lastPattern.patternData.insight}

📅 Détecté ${timeSince}

🔍 Plus de détails :
• "journal" - Historique complet
• Nouvelles données = nouvelles révélations ! 💪`,
        from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
        to: from
      });
      console.log('✅ APRÈS ENVOI habitudes (avec pattern)');
      res.writeHead(200, {'Content-Type': 'text/xml'});
      res.end('<Response></Response>');
      return;
    }
    
    if (messageClean === 'aide' || messageClean === 'help') {
      console.log('🔧 AVANT ENVOI aide');
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
      console.log('✅ APRÈS ENVOI aide');
      res.writeHead(200, {'Content-Type': 'text/xml'});
      res.end('<Response></Response>');
      return;
    }
    
    if (messageClean === 'journal') {
      const userCards = userData[userId]?.cartes || [];
      if (userCards.length === 0) {
        console.log('🔧 AVANT ENVOI journal (vide)');
        await client.messages.create({
          body: '📖 Ton journal est vide ! Commence par partager tes émotions.',
          from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
          to: from
        });
        console.log('✅ APRÈS ENVOI journal (vide)');
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
        
        console.log('🔧 AVANT ENVOI journal (avec cartes)');
        await client.messages.create({
          body: journalText,
          from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
          to: from
        });
        console.log('✅ APRÈS ENVOI journal (avec cartes)');
      }
      res.writeHead(200, {'Content-Type': 'text/xml'});
      res.end('<Response></Response>');
      return;
    }
    
    if (messageClean === 'annule') {
      const userCards = userData[userId]?.cartes || [];
      if (userCards.length > 0) {
        userData[userId].cartes.pop();
        console.log('🔧 AVANT ENVOI annule (supprimé)');
        await client.messages.create({
          body: '✅ Dernière carte supprimée !',
          from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
          to: from
        });
        console.log('✅ APRÈS ENVOI annule (supprimé)');
      } else {
        console.log('🔧 AVANT ENVOI annule (rien à supprimer)');
        await client.messages.create({
          body: '❌ Aucune carte à supprimer !',
          from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
          to: from
        });
        console.log('✅ APRÈS ENVOI annule (rien à supprimer)');
      }
      res.writeHead(200, {'Content-Type': 'text/xml'});
      res.end('<Response></Response>');
      return;
    }
    
    // Analyse émotionnelle principale
    const analysis = await analyzeEmotions(message);
    const carteData = await generateOption42Card(analysis, message, userId);
    
    // Stockage
    stockerCarte(userId, carteData, analysis, message);
    
    // Envoi réponse
    console.log('🔧 AVANT ENVOI carte Option 42');
    await client.messages.create({
      body: carteData.card,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: from
    });
    console.log('✅ APRÈS ENVOI carte Option 42');
    
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
  console.log('✅ CORRECTIONS APPLIQUÉES :');
  console.log('   - Météo priorité stress/fatigue ≥7');
  console.log('   - Habitudes intelligentes avec patterns');
  console.log('   - Logs détaillés debug double OK');
  console.log('   - Stockage patterns complet');
  console.log('💪 Ready for revolution !');
});
