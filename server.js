// MoodMap WhatsApp Bot V6.0 PRODUCT 🚀
// Clean, Product-Ready, User-Focused
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 10000;

app.use(bodyParser.urlencoded({ extended: false }));

// Configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const mistralApiKey = process.env.MISTRAL_API_KEY;
const client = twilio(accountSid, authToken);

console.log('🚀 MoodMap WhatsApp Bot V6.0 PRODUCT démarré sur port 10000');
console.log('🎯 Focus : UX Clean, Sans Friction, Product-Ready');
console.log('💪 Ready for real users !');

// ===== BASE DE DONNÉES EN MÉMOIRE =====
let userData = {}; // Structure: {userId: {cartes: [], habitudes: [], config: {}}}

// ===== CONFIGURATION UTILISATEUR PAR DÉFAUT =====
const defaultUserConfig = {
  meteo_active: true,
  notifications: {
    rappels_quotidiens: false,
    rappel_hebdo: false,
    alerte_patterns: false,
    heure_rappel: "20:00"
  }
};

// ===== FAMILLES D'ÉMOTIONS =====
const famillesEmotions = {
  joie: ['plaisir', 'fierté', 'amusement', 'gratitude', 'bonheur', 'euphorie'],
  tristesse: ['mélancolie', 'solitude', 'peine', 'chagrin', 'désespoir'],
  colère: ['irritation', 'frustration', 'rage', 'agacement', 'fureur'],
  peur: ['inquiétude', 'anxiété', 'stress', 'angoisse', 'terreur'],
  surprise: ['étonnement', 'choc', 'curiosité', 'stupéfaction'],
  dégoût: ['rejet', 'aversion', 'gêne', 'répulsion'],
  sérénité: ['calme', 'paix', 'soulagement', 'tranquillité'],
  amour: ['tendresse', 'affection', 'passion', 'attachement'],
  fatigue: ['lassitude', 'épuisement', 'surmenage', 'usure'],
  motivation: ['espoir', 'enthousiasme', 'détermination', 'ambition']
};

// ===== MÉTÉOS ÉMOTIONNELLES - SYSTÈME FIGÉ (Familles × Intensité 1-5) =====
// PRINCIPE : Structure fixe par famille d'émotion avec 5 niveaux d'intensité précis
// OBJECTIF : Cohérence, prévisibilité, mapping exact émotion/intensité → météo
// ÉVITER : Génération aléatoire, variabilité, incohérence entre sessions
const meteoEmotionnelle = {
  joie: [
    { niveau: 1, label: "Soleil timide", emoji: "🌤️" },
    { niveau: 2, label: "Soleil doux", emoji: "🌤️" },
    { niveau: 3, label: "Soleil radieux", emoji: "☀️" },
    { niveau: 4, label: "Soleil éclatant", emoji: "☀️" },
    { niveau: 5, label: "Soleil chaleureux", emoji: "🌞" }
  ],
  tristesse: [
    { niveau: 1, label: "Gouttes éparses", emoji: "🌧️" },
    { niveau: 2, label: "Bruine légère", emoji: "🌧️" },
    { niveau: 3, label: "Averse modérée", emoji: "🌧️" },
    { niveau: 4, label: "Pluie battante", emoji: "🌧️" },
    { niveau: 5, label: "Déluge", emoji: "🌧️" }
  ],
  colère: [
    { niveau: 1, label: "Brise légère", emoji: "💨" },
    { niveau: 2, label: "Vent frais", emoji: "💨" },
    { niveau: 3, label: "Vent soutenu", emoji: "💨" },
    { niveau: 4, label: "Bourrasques", emoji: "💨" },
    { niveau: 5, label: "Tempête", emoji: "💨" }
  ],
  peur: [
    { niveau: 1, label: "Légère brume", emoji: "🌫️" },
    { niveau: 2, label: "Brouillard diffus", emoji: "🌫️" },
    { niveau: 3, label: "Brouillard épais", emoji: "🌫️" },
    { niveau: 4, label: "Brouillard dense", emoji: "🌫️" },
    { niveau: 5, label: "Brouillard opaque", emoji: "🌫️" }
  ],
  surprise: [
    { niveau: 1, label: "Ciel menaçant", emoji: "⛈️" },
    { niveau: 2, label: "Premiers grondements", emoji: "⛈️" },
    { niveau: 3, label: "Orage modéré", emoji: "⛈️" },
    { niveau: 4, label: "Orage fort", emoji: "⛈️" },
    { niveau: 5, label: "Orage violent", emoji: "⛈️" }
  ],
  dégoût: [
    { niveau: 1, label: "Flocons épars", emoji: "🌨️" },
    { niveau: 2, label: "Petite neige", emoji: "🌨️" },
    { niveau: 3, label: "Neige modérée", emoji: "🌨️" },
    { niveau: 4, label: "Neige épaisse", emoji: "🌨️" },
    { niveau: 5, label: "Tempête de neige", emoji: "🌨️" }
  ],
  sérénité: [
    { niveau: 1, label: "Arc-en-ciel pâle", emoji: "🌈" },
    { niveau: 2, label: "Arc-en-ciel délicat", emoji: "🌈" },
    { niveau: 3, label: "Arc-en-ciel lumineux", emoji: "🌈" },
    { niveau: 4, label: "Arc-en-ciel vibrant", emoji: "🌈" },
    { niveau: 5, label: "Arc-en-ciel flamboyant", emoji: "🌈" }
  ],
  amour: [
    { niveau: 1, label: "Aurore naissante", emoji: "🌅" },
    { niveau: 2, label: "Aube claire", emoji: "🌅" },
    { niveau: 3, label: "Premier rayon", emoji: "🌅" },
    { niveau: 4, label: "Éclat doré", emoji: "🌅" },
    { niveau: 5, label: "Soleil levé", emoji: "🌅" }
  ],
  fatigue: [
    { niveau: 1, label: "Nuages épars", emoji: "☁️" },
    { niveau: 2, label: "Ciel partiellement couvert", emoji: "☁️" },
    { niveau: 3, label: "Ciel très nuageux", emoji: "☁️" },
    { niveau: 4, label: "Ciel couvert", emoji: "☁️" },
    { niveau: 5, label: "Ciel plombé", emoji: "☁️" }
  ],
  motivation: [
    { niveau: 1, label: "Brise douce", emoji: "🍃" },
    { niveau: 2, label: "Souffle d'élan", emoji: "🍃" },
    { niveau: 3, label: "Vent de face", emoji: "🍃" },
    { niveau: 4, label: "Rafales d'énergie", emoji: "🍃" },
    { niveau: 5, label: "Tempête ascendante", emoji: "🍃" }
  ]
};

// ===== MOTS-CLÉS COMMANDES =====
const commandes = {
  // Navigation principale
  'journal': 'handleJournal',
  'habitudes': 'handleHabitudes', 
  'paramètres': 'handleParametres',
  'parametres': 'handleParametres',
  'aide': 'handleAide',
  'help': 'handleAide',
  
  // Journal spécifique
  'journal semaine': 'handleJournalSemaine',
  'journal mois': 'handleJournalMois',
  'journal stats': 'handleJournalStats',
  'journal soleil': 'handleJournalSoleil',
  'journal joie': 'handleJournalJoie',
  'journal tristesse': 'handleJournalTristesse',
  
  // Habitudes spécifique
  'habitudes temps': 'handleHabitudesTemps',
  'habitudes relations': 'handleHabitudesRelations',
  'habitudes lieux': 'handleHabitudesLieux',
  'habitudes formules': 'handleHabitudesFormules',
  
  // Paramètres
  'météo on': 'handleMeteoOn',
  'météo off': 'handleMeteoOff',
  'meteo on': 'handleMeteoOn',
  'meteo off': 'handleMeteoOff',
  'notifications on': 'handleNotificationsOn',
  'notifications off': 'handleNotificationsOff',
  'export': 'handleExport',
  'reset': 'handleReset',
  
  // Utilitaires
  'annule': 'handleAnnule',
  'annuler': 'handleAnnule'
};

// ===== SALUTATIONS =====
const salutations = ['salut', 'hello', 'bonjour', 'bonsoir', 'coucou', 'hey', 'hi', 'yo', 'cc'];

// ===== MOTS INTERDITS & DÉTECTION =====
const motsInsultes = ['connard', 'putain', 'merde', 'enculé', 'salope', 'fdp'];
const motsSpam = ['test', 'azerty', '123456', 'qwerty'];

// ===== CLASSE DE DÉTECTION D'ENTRÉES =====
// OBJECTIF MVP : Gérer tous les cas particuliers pour UX fluide
// PRINCIPE : Distinguer insultes, spam, charabia pour réponses adaptées
class InputDetector {
  static detectType(message, userId) {
    const msg = message.toLowerCase().trim();
    
    // Message vide
    if (!msg || msg.length === 0) {
      return { type: 'empty' };
    }
    
    // Salutations (UX : accueil chaleureux)
    if (salutations.includes(msg) || salutations.some(s => msg.startsWith(s))) {
      return { type: 'greeting' };
    }
    
    // Commandes (priorité haute pour navigation)
    for (const [cmd, handler] of Object.entries(commandes)) {
      if (msg === cmd || msg.startsWith(cmd + ' ')) {
        return { type: 'command', command: cmd, handler: handler };
      }
    }
    
    // Messages trop courts (sauf commandes)
    if (msg.length < 3) {
      return { type: 'too_short' };
    }
    
    // Messages trop longs (UX : encourager concision)
    if (msg.length > 500) {
      return { type: 'too_long' };
    }
    
    // Insultes (réponse empathique spécifique)
    if (motsInsultes.some(mot => msg.includes(mot))) {
      return { type: 'insulte' };
    }
    
    // Spam/tests techniques
    if (motsSpam.some(mot => msg.includes(mot)) || 
        /^[0-9]+$/.test(msg) || 
        /^[a-z]{1,6}$/.test(msg)) {
      return { type: 'spam' };
    }
    
    // Charabia/incompréhensible (caractères spéciaux, pas de voyelles...)
    if (/^[^aeiouAEIOU\s]{4,}$/.test(msg) || 
        /[^a-zA-Z0-9\s\-\'\.,!?éèàùç]{3,}/.test(msg)) {
      return { type: 'charabia' };
    }
    
    // Doublon (UX : éviter répétition)
    const lastMessage = userData[userId]?.last_message;
    if (lastMessage && lastMessage === msg) {
      return { type: 'duplicate' };
    }
    
    // Message émotionnel valide
    return { type: 'emotion', message: msg };
  }
}

// ===== ANALYSEUR D'ÉMOTIONS =====
async function analyzeEmotionWithMistral(message) {
  console.log('🧠 Analyse émotionnelle Mistral...');
  
  try {
    const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
      model: 'mistral-tiny',
      messages: [{
        role: 'user',
        content: `Analyse ce message émotionnel et réponds UNIQUEMENT avec un objet JSON:

Message: "${message}"

Format JSON requis:
{
  "emotion_principale": "nom de l'émotion principale",
  "famille": "famille d'émotion (joie, tristesse, colère, peur, etc.)",
  "intensite": nombre de 1 à 10,
  "nuance": "nuance spécifique de l'émotion",
  "cause": "résumé court de la cause/situation",
  "emotions_secondaires": [{"emotion": "nom", "intensite": nombre}]
}

Sois précis et factuel.`
      }],
      temperature: 0.3,
      max_tokens: 300
    }, {
      headers: {
        'Authorization': `Bearer ${mistralApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const content = response.data.choices[0].message.content.trim();
    
    // Parser le JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : content;
    const analysis = JSON.parse(jsonString);
    
    return {
      emotion_principale: analysis.emotion_principale || 'neutre',
      famille: analysis.famille || 'sérénité',
      intensite: Math.max(1, Math.min(10, analysis.intensite || 5)),
      nuance: analysis.nuance || '',
      cause: analysis.cause || '',
      emotions_secondaires: analysis.emotions_secondaires || []
    };
    
  } catch (error) {
    console.error('❌ Erreur Mistral:', error.message);
    
    // Fallback simple
    return {
      emotion_principale: 'ressenti',
      famille: 'sérénité',
      intensite: 5,
      nuance: 'expression personnelle',
      cause: 'partage d\'émotion',
      emotions_secondaires: []
    };
  }
}

// ===== GESTIONNAIRE DE COMMANDES =====
class CommandHandler {
  
  static handleJournal(userId) {
    if (!userData[userId] || !userData[userId].cartes || userData[userId].cartes.length === 0) {
      return `📚 TON JOURNAL EST VIDE\n\nCommence par me raconter ce que tu ressens ! 😊`;
    }

    const cartes = userData[userId].cartes.slice(-3); // 3 dernières
    let message = `📅 TON JOURNAL (${cartes.length} dernières cartes)\n\n`;
    
    cartes.reverse().forEach(carte => {
      const date = new Date(carte.timestamp).toLocaleDateString('fr-FR');
      const heure = new Date(carte.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
      
      message += `${date} ${heure} • ${carte.meteo_emoji} ${carte.emotion_principale}\n`;
      message += `"${carte.message_original.substring(0, 50)}..."\n\n`;
    });

    message += `💡 Plus d'options :\n`;
    message += `• "journal semaine" - 7 derniers jours\n`;
    message += `• "journal mois" - 30 derniers jours\n`;
    message += `• "journal stats" - Tes statistiques`;

    return message;
  }

  static handleHabitudes(userId) {
    if (!userData[userId] || !userData[userId].cartes || userData[userId].cartes.length < 5) {
      return `🔄 TES HABITUDES ÉMOTIONNELLES\n\nPas encore assez de données pour détecter tes habitudes.\n\nMinimum 5 messages nécessaires.\nActuel : ${userData[userId]?.cartes?.length || 0} messages.\n\nContinue à partager tes émotions ! 😊`;
    }

    return `🧠 TES HABITUDES ÉMOTIONNELLES\n\nAnalyse en cours...\n\n🔍 Détails disponibles :\n• "habitudes temps" - Rythmes temporels\n• "habitudes relations" - Impact personnes\n• "habitudes lieux" - Influence environnement\n\nPlus de données = plus de révélations ! 💪`;
  }

  static handleParametres(userId) {
    const config = userData[userId]?.config || defaultUserConfig;
    const meteoStatus = config.meteo_active ? 'activée' : 'désactivée';
    const notifsStatus = config.notifications.rappels_quotidiens ? 'activées' : 'désactivées';

    return `⚙️ TES PARAMÈTRES\n\n🌤️ Météo : ${meteoStatus}\n• "météo on/off" - Activer/désactiver\n\n🔔 Notifications : ${notifsStatus}\n• "notifications on/off" - Activer/désactiver\n\n📊 Données :\n• "export" - Exporter tes données\n• "reset" - Tout effacer\n\n❓ "aide" - Guide d'utilisation`;
  }

  static handleAide(userId) {
    return `❓ GUIDE MOODMAP\n\n💬 UTILISATION :\nRaconte-moi simplement ce que tu ressens !\n\n📚 COMMANDES :\n• "journal" - Historique émotions\n• "habitudes" - Tes patterns\n• "paramètres" - Configuration\n\n🔧 UTILE :\n• "annule" - Efface dernière carte\n• "aide journal" - Aide spécifique\n\nJe suis là pour t'aider à mieux te comprendre ! 😊`;
  }

  static handleAnnule(userId) {
    if (!userData[userId] || !userData[userId].cartes || userData[userId].cartes.length === 0) {
      return `❌ Aucune carte à annuler.`;
    }

    userData[userId].cartes.pop();
    return `✅ Dernière carte annulée. Tu peux recommencer ! 😊`;
  }

  static handleMeteoOn(userId) {
    if (!userData[userId].config) userData[userId].config = {...defaultUserConfig};
    userData[userId].config.meteo_active = true;
    return `🌤️ Météo activée ! Tes prochaines cartes auront leur météo émotionnelle.`;
  }

  static handleMeteoOff(userId) {
    if (!userData[userId].config) userData[userId].config = {...defaultUserConfig};
    userData[userId].config.meteo_active = false;
    return `🌤️ Météo désactivée. Tes cartes seront plus simples.`;
  }

  static handleNotificationsOn(userId) {
    if (!userData[userId].config) userData[userId].config = {...defaultUserConfig};
    userData[userId].config.notifications.rappels_quotidiens = true;
    return `🔔 Notifications activées ! (Fonctionnalité en développement)`;
  }

  static handleNotificationsOff(userId) {
    if (!userData[userId].config) userData[userId].config = {...defaultUserConfig};
    userData[userId].config.notifications.rappels_quotidiens = false;
    return `🔔 Notifications désactivées.`;
  }

  static handleExport(userId) {
    return `📊 Export de données (fonctionnalité en développement)\n\nBientôt disponible :\n• Export CSV\n• Export PDF\n• Envoi par email`;
  }

  static handleReset(userId) {
    return `⚠️ ATTENTION - RESET TOTAL\n\nCela effacera TOUTES tes données :\n• Toutes tes cartes émotionnelles\n• Tous tes habitudes\n• Tous tes paramètres\n\nPour confirmer, tape :\nCONFIRMER RESET`;
  }
}

// ===== GÉNÉRATEUR DE CARTES ÉMOTIONNELLES =====
// TEMPLATE MVP : Format validé, simple et efficace
// STRUCTURE : Météo (optionnelle) + Émotions + Résumé + Action annulation
// PRINCIPE : Pas de fioritures, focus sur l'information utile
// MÉTÉO : Système figé familles × intensité (1-5) pour cohérence totale
function generateCarteEmotionnelle(analysis, messageOriginal, userId) {
  const config = userData[userId]?.config || defaultUserConfig;
  const carteId = Date.now().toString();
  
  // Préparer météo si activée
  let meteoLine = '';
  let meteoEmoji = '';
  let meteoNom = '';
  
  if (config.meteo_active) {
    // Convertir intensité 1-10 vers niveau météo 1-5
    // Intensité 1-2 → niveau 1, 3-4 → niveau 2, 5-6 → niveau 3, 7-8 → niveau 4, 9-10 → niveau 5
    const intensiteAnalyse = analysis.intensite || 5; // Fallback niveau 3 (milieu)
    const niveauMeteo = Math.min(5, Math.max(1, Math.ceil(intensiteAnalyse / 2)));
    
    // Récupérer la météo de la famille avec le bon niveau
    const familleMeteos = meteoEmotionnelle[analysis.famille] || meteoEmotionnelle['sérénité'];
    const meteo = familleMeteos[niveauMeteo - 1]; // Index 0-4 pour niveau 1-5
    
    meteoEmoji = meteo.emoji;
    meteoNom = meteo.label;
    meteoLine = `${meteoEmoji} ${meteoNom}\n\n`;
  }
  
  // Construire la carte
  let carte = meteoLine;
  
  carte += `Émotions détectées :\n`;
  carte += `- ${analysis.emotion_principale}`;
  if (analysis.nuance) carte += ` (${analysis.nuance})`;
  carte += ` — Intensité : ${analysis.intensite}/10\n`;
  
  // Émotions secondaires
  if (analysis.emotions_secondaires && analysis.emotions_secondaires.length > 0) {
    analysis.emotions_secondaires.slice(0, 2).forEach(emo => {
      carte += `- ${emo.emotion} — Intensité : ${emo.intensite}/10\n`;
    });
  }
  
  carte += `\nRésumé :\n`;
  carte += analysis.cause || `Tu ressens ${analysis.emotion_principale} à un niveau ${analysis.intensite}/10.`;
  
  carte += `\n\nPour annuler cette carte, réponds : annule (dans la minute).`;
  
  // Stocker la carte avec les nouvelles données météo
  const carteData = {
    id: carteId,
    timestamp: new Date().toISOString(),
    message_original: messageOriginal,
    emotion_principale: analysis.emotion_principale,
    famille: analysis.famille,
    intensite: analysis.intensite,
    nuance: analysis.nuance,
    cause: analysis.cause,
    emotions_secondaires: analysis.emotions_secondaires,
    meteo_emoji: meteoEmoji,
    meteo_nom: meteoNom,
    meteo_niveau: config.meteo_active ? Math.min(5, Math.max(1, Math.ceil((analysis.intensite || 5) / 2))) : null
  };
  
  if (!userData[userId]) {
    userData[userId] = {
      cartes: [],
      config: {...defaultUserConfig},
      last_message: null
    };
  }
  
  userData[userId].cartes.push(carteData);
  userData[userId].last_message = messageOriginal.toLowerCase().trim();
  
  return carte;
}

// ===== GESTIONNAIRE DE RÉPONSES AUTOMATIQUES =====
// PRINCIPE MVP : Réponses adaptées et empathiques pour chaque cas particulier
function handleSpecialCases(inputType, message, userId) {
  switch (inputType.type) {
    case 'empty':
      return `Tu n'as rien écrit… Parle-moi de ton humeur, je suis là pour ça ! 😊`;
      
    case 'greeting':
      return `🌈 Bienvenue sur MoodMap ! Raconte-moi ce que tu ressens ou ce qui t'a traversé aujourd'hui 😊`;
      
    case 'too_short':
      return `Dis-m'en un peu plus sur ce que tu ressens, pour que je puisse l'analyser ! 😊`;
      
    case 'too_long':
      return `C'est un peu long pour moi… Peux-tu résumer ton ressenti principal en une ou deux phrases ? 😊`;
      
    case 'insulte':
      return `Merci, ça me touche ! Mais si tu me disais plutôt pourquoi tu as besoin de t'exprimer ainsi ? 😉`;
      
    case 'spam':
      return `Si tu veux tester, partage-moi une vraie émotion — c'est plus fun 😊`;
      
    case 'charabia':
      return `J'ai un peu de mal à comprendre. Peux-tu reformuler ton émotion ou ton ressenti ? 😊`;
      
    case 'duplicate':
      return `Tu m'as déjà dit ça… Dis-moi si tu veux partager autre chose ! 😊`;
      
    default:
      return null;
  }
}

// ===== INITIALISATION UTILISATEUR =====
function initializeUser(userId) {
  if (!userData[userId]) {
    userData[userId] = {
      cartes: [],
      habitudes: [],
      config: {...defaultUserConfig},
      last_message: null,
      stats: {
        total_messages: 0,
        premiere_utilisation: new Date().toISOString(),
        derniere_activite: new Date().toISOString()
      }
    };
    console.log(`👤 Nouvel utilisateur initialisé: ${userId}`);
  }
  
  userData[userId].stats.derniere_activite = new Date().toISOString();
}

// ===== ROUTE WEBHOOK PRINCIPALE =====
app.post('/webhook', async (req, res) => {
  try {
    const messageBody = req.body.Body;
    const fromNumber = req.body.From;
    
    console.log(`📱 Message reçu de ${fromNumber}: "${messageBody}"`);
    
    // Initialiser utilisateur
    initializeUser(fromNumber);
    
    // Détecter type d'entrée
    const inputType = InputDetector.detectType(messageBody, fromNumber);
    console.log(`🔍 Type détecté: ${inputType.type}`);
    
    let responseMessage;
    
    // Gérer commandes
    if (inputType.type === 'command') {
      const handler = CommandHandler[inputType.handler];
      if (handler) {
        responseMessage = handler(fromNumber);
      } else {
        responseMessage = `❌ Commande non reconnue. Tape "aide" pour voir les commandes disponibles.`;
      }
    }
    // Gérer cas spéciaux
    else if (inputType.type !== 'emotion') {
      responseMessage = handleSpecialCases(inputType, messageBody, fromNumber);
    }
    // Traiter émotion
    else {
      console.log('🔄 Analyse émotionnelle en cours...');
      
      const analysis = await analyzeEmotionWithMistral(messageBody);
      console.log('📊 Analyse complète:', analysis);
      
      responseMessage = generateCarteEmotionnelle(analysis, messageBody, fromNumber);
      
      userData[fromNumber].stats.total_messages += 1;
      console.log(`💾 Carte émotionnelle stockée pour ${fromNumber}`);
    }
    
    // Envoyer réponse
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(responseMessage);
    
    res.type('text/xml').send(twiml.toString());
    console.log('✅ Réponse envoyée avec succès');
    
  } catch (error) {
    console.error('❌ Erreur webhook:', error);
    
    const errorMessage = `🤖 Oups ! Petite erreur technique...\n\nRéessaie dans quelques secondes ou tape "aide" pour le guide d'utilisation.`;
    
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(errorMessage);
    
    res.type('text/xml').send(twiml.toString());
  }
});

// ===== ROUTES SANTÉ =====
app.get('/', (req, res) => {
  const stats = {
    version: "6.0 PRODUCT",
    uptime: process.uptime(),
    users: Object.keys(userData).length,
    total_cartes: Object.values(userData).reduce((sum, user) => sum + (user.cartes?.length || 0), 0),
    features: [
      "UX Clean & Product-Ready",
      "Gestion cas particuliers complète", 
      "Template carte simplifié",
      "Navigation intuitive",
      "Paramètres utilisateur",
      "Système d'aide intégré",
      "Météo système figé (familles × intensité)"
    ]
  };
  
  res.json({
    status: "🚀 MoodMap V6.0 PRODUCT opérationnel !",
    stats: stats
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '6.0'
  });
});

// ===== DÉMARRAGE SERVEUR =====
app.listen(port, () => {
  console.log(`🚀 MoodMap WhatsApp Bot V6.0 PRODUCT démarré sur port ${port}`);
  console.log(`🎯 Focus UX : Clean, Sans Friction, Product-Ready`);
  console.log(`🧠 IA Émotionnelle : Analyse Mistral intégrée`);
  console.log(`🔧 Gestion cas particuliers : Complète`);
  console.log(`📱 Template cartes : Simplifié et efficace`);
  console.log(`⚙️ Paramètres utilisateur : Configurables`);
  console.log(`🌤️ Météo système figé : 10 familles × 5 intensités`);
  console.log(`💪 Ready for real users !`);
});
