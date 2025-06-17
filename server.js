// MoodMap WhatsApp Bot V6.1 RÉVOLUTIONNAIRE 🚀
// Clean, Product-Ready, User-Focused + Révélations Croisées + Phrase Humaine IA + PERSISTANCE
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const axios = require('axios');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;

app.use(bodyParser.urlencoded({ extended: false }));

// Configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const mistralApiKey = process.env.MISTRAL_API_KEY;

// Vérification variables d'environnement
if (!accountSid || !authToken) {
  console.error('❌ ERREUR : Variables Twilio manquantes !');
  console.error('➡️  TWILIO_ACCOUNT_SID:', accountSid ? 'OK' : 'MANQUANT');
  console.error('➡️  TWILIO_AUTH_TOKEN:', authToken ? 'OK' : 'MANQUANT');
  console.error('🔧 Configure tes variables d\'environnement sur Render !');
  process.exit(1);
}

if (!mistralApiKey) {
  console.error('❌ ERREUR : MISTRAL_API_KEY manquant !');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

console.log('🚀 MoodMap WhatsApp Bot V6.1 RÉVOLUTIONNAIRE démarré sur port 10000');
console.log('🎯 Focus : UX Clean, Sans Friction, Product-Ready');
console.log('💪 Ready for real users !');

// ===== BASE DE DONNÉES EN MÉMOIRE + PERSISTANCE =====
// Charger les données sauvegardées si le fichier existe
let userData = {};
if (fs.existsSync('userData.json')) {
  try {
    userData = JSON.parse(fs.readFileSync('userData.json'));
    console.log('✅ Données utilisateur restaurées depuis userData.json');
    console.log(`📊 ${Object.keys(userData).length} utilisateurs rechargés`);
  } catch (err) {
    console.error('⚠️ Erreur de lecture du fichier userData.json :', err);
    userData = {};
  }
} else {
  console.log('📁 Nouveau fichier userData.json sera créé');
}

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
  joie: ['plaisir', 'fierté', 'amusement', 'gratitude', 'bonheur', 'euphorie', 'satisfaction', 'contentement'],
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

// ===== MÉTÉOS ÉMOTIONNELLES - SYSTÈME FIGÉ AVEC VARIATIONS =====
// PRINCIPE : Structure fixe par famille d'émotion avec 5 niveaux d'intensité précis
// AMÉLIORATION V6.1 : Variations textuelles pour éviter répétitions monotones
// OBJECTIF : Cohérence + diversité pour meilleure UX
const meteoEmotionnelle = {
  joie: [
    { niveau: 1, variants: ["Soleil timide", "Première lueur", "Soleil naissant"], emoji: "🌤️" },
    { niveau: 2, variants: ["Soleil doux", "Chaleur tendre", "Soleil caressant"], emoji: "🌤️" },
    { niveau: 3, variants: ["Soleil radieux", "Soleil lumineux", "Éclat solaire"], emoji: "☀️" },
    { niveau: 4, variants: ["Soleil éclatant", "Soleil triomphant", "Soleil ardent"], emoji: "☀️" },
    { niveau: 5, variants: ["Soleil chaleureux", "Soleil flamboyant", "Brasier solaire"], emoji: "🌞" }
  ],
  tristesse: [
    { niveau: 1, variants: ["Gouttes éparses", "Fine bruine", "Larmes du ciel"], emoji: "🌧️" },
    { niveau: 2, variants: ["Bruine légère", "Pluie douce", "Ondée passagère"], emoji: "🌧️" },
    { niveau: 3, variants: ["Averse modérée", "Pluie soutenue", "Crachin tenace"], emoji: "🌧️" },
    { niveau: 4, variants: ["Pluie battante", "Averse intense", "Forte ondée"], emoji: "🌧️" },
    { niveau: 5, variants: ["Déluge", "Pluie torrentielle", "Cataracte"], emoji: "🌧️" }
  ],
  colère: [
    { niveau: 1, variants: ["Brise légère", "Souffle irrité", "Vent murmure"], emoji: "💨" },
    { niveau: 2, variants: ["Vent frais", "Brise agitée", "Courant d'air"], emoji: "💨" },
    { niveau: 3, variants: ["Vent soutenu", "Bourrasque naissante", "Vent constant"], emoji: "💨" },
    { niveau: 4, variants: ["Bourrasques", "Vent violent", "Rafales puissantes"], emoji: "💨" },
    { niveau: 5, variants: ["Tempête", "Ouragan", "Cyclone"], emoji: "💨" }
  ],
  peur: [
    { niveau: 1, variants: ["Légère brume", "Voile subtil", "Brume matinale"], emoji: "🌫️" },
    { niveau: 2, variants: ["Brouillard diffus", "Nuée légère", "Vapeur floue"], emoji: "🌫️" },
    { niveau: 3, variants: ["Brouillard épais", "Nappe brumeuse", "Voile dense"], emoji: "🌫️" },
    { niveau: 4, variants: ["Brouillard dense", "Brume opaque", "Nuage au sol"], emoji: "🌫️" },
    { niveau: 5, variants: ["Brouillard opaque", "Mur de brume", "Néant blanc"], emoji: "🌫️" }
  ],
  surprise: [
    { niveau: 1, variants: ["Ciel menaçant", "Nuages sombres", "Tension électrique"], emoji: "⛈️" },
    { niveau: 2, variants: ["Premiers grondements", "Tonnerre lointain", "Écho sourd"], emoji: "⛈️" },
    { niveau: 3, variants: ["Orage modéré", "Tonnerre proche", "Éclairs discrets"], emoji: "⛈️" },
    { niveau: 4, variants: ["Orage fort", "Tonnerre puissant", "Éclairs vifs"], emoji: "⛈️" },
    { niveau: 5, variants: ["Orage violent", "Foudre déchaînée", "Tempête électrique"], emoji: "⛈️" }
  ],
  dégoût: [
    { niveau: 1, variants: ["Flocons épars", "Neige timide", "Première neige"], emoji: "🌨️" },
    { niveau: 2, variants: ["Petite neige", "Neige douce", "Flocons dansants"], emoji: "🌨️" },
    { niveau: 3, variants: ["Neige modérée", "Chute continue", "Neige soutenue"], emoji: "🌨️" },
    { niveau: 4, variants: ["Neige épaisse", "Chute dense", "Neige lourde"], emoji: "🌨️" },
    { niveau: 5, variants: ["Tempête de neige", "Blizzard", "Neige aveuglante"], emoji: "🌨️" }
  ],
  sérénité: [
    { niveau: 1, variants: ["Arc-en-ciel pâle", "Lueur colorée", "Spectre délicat"], emoji: "🌈" },
    { niveau: 2, variants: ["Arc-en-ciel délicat", "Prisme tendre", "Couleurs douces"], emoji: "🌈" },
    { niveau: 3, variants: ["Arc-en-ciel lumineux", "Voûte colorée", "Prisme clair"], emoji: "🌈" },
    { niveau: 4, variants: ["Arc-en-ciel vibrant", "Spectre éclatant", "Couleurs vives"], emoji: "🌈" },
    { niveau: 5, variants: ["Arc-en-ciel flamboyant", "Prisme magique", "Éclat multicolore"], emoji: "🌈" }
  ],
  amour: [
    { niveau: 1, variants: ["Aurore naissante", "Première lueur", "Aube timide"], emoji: "🌅" },
    { niveau: 2, variants: ["Aube claire", "Lever doux", "Lumière matinale"], emoji: "🌅" },
    { niveau: 3, variants: ["Premier rayon", "Aurore dorée", "Éclat matinal"], emoji: "🌅" },
    { niveau: 4, variants: ["Éclat doré", "Aurore flamboyante", "Lever triomphant"], emoji: "🌅" },
    { niveau: 5, variants: ["Soleil levé", "Aurore majestueuse", "Embrasement"], emoji: "🌅" }
  ],
  fatigue: [
    { niveau: 1, variants: ["Nuages épars", "Ciel voilé", "Brume légère"], emoji: "☁️" },
    { niveau: 2, variants: ["Ciel partiellement couvert", "Nuages dispersés", "Voile nuageux"], emoji: "☁️" },
    { niveau: 3, variants: ["Ciel très nuageux", "Couverture dense", "Nuages lourds"], emoji: "☁️" },
    { niveau: 4, variants: ["Ciel couvert", "Plafond bas", "Masse nuageuse"], emoji: "☁️" },
    { niveau: 5, variants: ["Ciel plombé", "Chape de plomb", "Obscurité nuageuse"], emoji: "☁️" }
  ],
  motivation: [
    { niveau: 1, variants: ["Brise douce", "Souffle léger", "Vent porteur"], emoji: "🍃" },
    { niveau: 2, variants: ["Souffle d'élan", "Vent encourageant", "Brise vivifiante"], emoji: "🍃" },
    { niveau: 3, variants: ["Vent de face", "Courant porteur", "Souffle puissant"], emoji: "🍃" },
    { niveau: 4, variants: ["Rafales d'énergie", "Vent dynamique", "Bourrasque énergique"], emoji: "🍃" },
    { niveau: 5, variants: ["Tempête ascendante", "Cyclone d'énergie", "Ouragan motivant"], emoji: "🍃" }
  ]
};

// ===== MOTS-CLÉS COMMANDES - AMÉLIORATION V6.1 =====
// FIX : Meilleure détection casse/pluriel + nouvelles commandes révélations
const commandes = {
  // Navigation principale
  'journal': 'handleJournal',
  'habitudes': 'handleHabitudes', 
  'révélations': 'handleRevelations',
  'revelations': 'handleRevelations',
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
  
  // Habitudes spécifique - FIX V6.1
  'habitudes temps': 'handleHabitudesTemps',
  'habitude temps': 'handleHabitudesTemps',
  'habitudes relations': 'handleHabitudesRelations',
  'habitude relations': 'handleHabitudesRelations',
  'habitudes lieux': 'handleHabitudesLieux',
  'habitude lieux': 'handleHabitudesLieux',
  'habitudes formules': 'handleHabitudesFormules',
  'habitude formules': 'handleHabitudesFormules',
  
  // Révélations croisées - NOUVEAU V6.1
  'révélations temps': 'handleRevelationsTemps',
  'revelations temps': 'handleRevelationsTemps',
  'révélations relations': 'handleRevelationsRelations',
  'revelations relations': 'handleRevelationsRelations',
  'révélations lieux': 'handleRevelationsLieux',
  'revelations lieux': 'handleRevelationsLieux',
  
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
    
    // Commandes (priorité haute pour navigation) - AMÉLIORATION V6.1
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

// ===== ANALYSEUR D'ÉMOTIONS - AMÉLIORATION V6.1 =====
// AMÉLIORATION : Prompt plus précis pour meilleur mapping famille d'émotion
async function analyzeEmotionWithMistral(message) {
  console.log('🧠 Analyse émotionnelle Mistral...');
  
  try {
    const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
      model: 'mistral-tiny',
      messages: [{
        role: 'user',
        content: `Analyse ce message émotionnel et réponds UNIQUEMENT avec un objet JSON en FRANÇAIS :

Message: "${message}"

IMPORTANT - Toujours répondre en FRANÇAIS, jamais en anglais.

Mapping des familles d'émotions :
- "espoir", "enthousiasme", "détermination", "ambition" → famille "motivation"
- "satisfaction", "contentement", "fierté", "plaisir" → famille "joie"
- "attachement", "tendresse", "affection" → famille "amour"
- "calme", "paix", "soulagement", "tranquillité" → famille "sérénité"

Format JSON requis (en français uniquement):
{
  "emotion_principale": "nom de l'émotion principale en français",
  "famille": "famille d'émotion (joie, tristesse, colère, peur, surprise, dégoût, sérénité, amour, fatigue, motivation)",
  "intensite": nombre de 1 à 10,
  "nuance": "nuance spécifique de l'émotion en français",
  "cause": "résumé court de la cause/situation en français",
  "emotions_secondaires": [{"emotion": "nom en français", "intensite": nombre}]
}

INTERDICTION ABSOLUE d'utiliser l'anglais. Réponds uniquement en français.

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

// ===== GÉNÉRATEUR RÉSUMÉ CLAIR - NOUVEAU V6.1+ =====
// OBJECTIF : Résumé factuel, synthétique, sans jargon ni paraphrase
async function generateResume(messageOriginal, analysis) {
  console.log('📝 Génération résumé clair...');
  
  try {
    const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
      model: 'mistral-tiny',
      messages: [{
        role: 'user',
        content: `Tu es un assistant qui doit résumer **en une seule phrase** ce que vit la personne, d'un point de vue empathique mais professionnel, sans redire le message initial.

Contraintes :
- 1 seule phrase courte en français
- Ton empathique mais jamais familier (pas de "t'as", "tu vas kiffer")
- Pas de "la personne évoque que…"
- Pas de "semble", "il est possible que…"
- Pas de paraphrase : extrais le sens humain, pas juste les faits
- Style naturel mais respectueux

Tu dois répondre uniquement par le résumé empathique, sans rien autour.

Exemples :
Message : "Je vais courir pour me détendre malgré mes douleurs"
→ Résumé : Besoin de se détendre par la course malgré des douleurs physiques.

Message : "Je vais boire une bière avec Mike et ramener du foie gras"
→ Résumé : Anticipation d'un moment convivial et généreux avec un ami.

Message : "Je suis resté assis toute la journée, j'en peux plus"
→ Résumé : Épuisement dû à une journée sédentaire trop longue.

Message : "J'ai trop de choses à penser, ça m'angoisse"
→ Résumé : Surcharge mentale génératrice d'angoisse.

Message à résumer : "${messageOriginal}"
Émotion principale détectée : ${analysis.emotion_principale}

Résumé empathique :`
      }],
      temperature: 0.2,
      max_tokens: 40
    }, {
      headers: {
        'Authorization': `Bearer ${mistralApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const resume = response.data.choices[0].message.content.trim().replace(/["""]/g, '');
    return resume;
    
  } catch (error) {
    console.error('❌ Erreur génération résumé:', error.message);
    
    // Fallback simple basé sur l'émotion
    const emotion = analysis.emotion_principale.toLowerCase();
    if (emotion.includes('fatigue')) {
      return "Moment de fatigue physique ou mentale.";
    } else if (emotion.includes('joie') || emotion.includes('satisfaction')) {
      return "Vécu positif et satisfaisant.";
    } else if (emotion.includes('stress') || emotion.includes('anxiété')) {
      return "Période de tension ou d'inquiétude.";
    } else {
      return "Partage d'un ressenti personnel.";
    }
  }
}
// ===== GÉNÉRATEUR PHRASE HUMAINE - AMÉLIORATION V6.1+ =====
// OBJECTIF : Phrase empathique, naturelle, sans poésie (comme un ami/coach)
// AMÉLIORATION : Tonalité adaptée selon météo émotionnelle

// Mapping météo → tonalité pour phrases humaines
const tonaliteParMeteo = {
  '🌈': 'enthousiaste et complice',
  '☁️': 'doux, comprehensif et calme', 
  '🍃': 'tonique et encourageant',
  '🌧️': 'reconfortant et sincere',
  '⛈️': 'solennel mais rassurant',
  '🌫️': 'pose et a l\'ecoute',
  '💨': 'direct mais bienveillant',
  '🌨️': 'doux et patient',
  '☀️': 'chaleureux et optimiste',
  '🌞': 'plein d\'energie positive',
  '🌤️': 'leger et encourageant',
  '🌅': 'tendre et connecte'
};

function getTonaliteFromMeteo(meteoEmoji) {
  return tonaliteParMeteo[meteoEmoji] || 'chaleureux et naturel';
}

async function generatePhraseHumaine(analysis, messageOriginal, meteoEmoji) {
  console.log('💬 Génération phrase humaine...');
  
  try {
    const emotionsText = `${analysis.emotion_principale}${analysis.nuance ? ' (' + analysis.nuance + ')' : ''} — ${analysis.intensite}/10`;
    const emotionsSecondaires = analysis.emotions_secondaires?.slice(0, 2).map(emo => `${emo.emotion} — ${emo.intensite}/10`).join('\n');
    const tonalite = getTonaliteFromMeteo(meteoEmoji);
    
    const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
      model: 'mistral-tiny',
      messages: [{
        role: 'user',
        content: `Tu es une IA empathique qui reformule de manière naturelle ce que la personne a vécu, en français uniquement.

Voici le message original de la personne :
"${messageOriginal}"

Voici les émotions détectées, avec leur intensité :
${emotionsText}${emotionsSecondaires ? '\n' + emotionsSecondaires : ''}

Voici le résumé factuel de ce vécu :
${analysis.cause}

Ta tâche :
→ Génère **une seule phrase** courte et naturelle qui reformule ce vécu avec empathie, sans exagération.
→ Tu peux reformuler librement, **sans répéter mot à mot** les éléments du message ou du résumé.
→ Évite les formules de coach, les tournures psychologiques ou les encouragements forcés.
→ Adopte un ton ${tonalite}, naturel et respectueux - comme un ami bienveillant mais pas familier.
→ Ta phrase doit **refléter les émotions détectées**, sans forcer le trait.
→ INTERDICTION ABSOLUE d'utiliser l'anglais. Réponds uniquement en français.

Exemples de ton attendu :
"Tu gardes ta motivation pour cette course, même si c'est inconfortable."
"On sent que ce moment avec ton ami compte vraiment pour toi."
"Cette journée t'a visiblement bien fatigué."

Une seule phrase naturelle en français, sans répétition du message original.`
      }],
      temperature: 0.4,
      max_tokens: 40
    }, {
      headers: {
        'Authorization': `Bearer ${mistralApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const phraseHumaine = response.data.choices[0].message.content.trim().replace(/["""]/g, '');
    return phraseHumaine;
    
  } catch (error) {
    console.error('❌ Erreur génération phrase humaine:', error.message);
    
    // Fallback simple adapté à la tonalité
    const tonalite = getTonaliteFromMeteo(meteoEmoji);
    if (tonalite.includes('encourageant')) {
      return "Tu partages quelque chose d'important, ça se ressent.";
    } else if (tonalite.includes('comprehensif')) {
      return "Je sens que c'est pas evident pour toi en ce moment.";
    } else {
      return "Tu vis quelque chose d'authentique, c'est precieux.";
    }
  }
}

// ===== ANALYSEUR DE RÉVÉLATIONS CROISÉES - NOUVEAU V6.1 =====
// RÉVOLUTIONNAIRE : Analyse patterns multi-dimensionnels émotion×temps×lieu×personne
class RevelationsAnalyzer {
  
  // Analyse croisée complète
  static analyzeRevelationsComplete(userId) {
    const cartes = userData[userId]?.cartes || [];
    if (cartes.length < 3) {
      return "Pas encore assez de données pour des révélations croisées.\n\nMinimum 3 cartes nécessaires.\nContinue à partager tes émotions ! 🔍";
    }

    let revelations = [];
    
    // Pattern émotions × personnes
    const emotionsPersonnes = this.analyzeEmotionsPersonnes(cartes);
    if (emotionsPersonnes) revelations.push(emotionsPersonnes);
    
    // Pattern émotions × temps
    const emotionsTemps = this.analyzeEmotionsTemps(cartes);
    if (emotionsTemps) revelations.push(emotionsTemps);
    
    // Pattern émotions × activités
    const emotionsActivites = this.analyzeEmotionsActivites(cartes);
    if (emotionsActivites) revelations.push(emotionsActivites);
    
    if (revelations.length === 0) {
      return "Pas encore de patterns révélateurs dans tes données.\n\nContinue à partager, les révélations arrivent ! 🔮";
    }
    
    let message = `🔮 TES RÉVÉLATIONS CROISÉES\n\n`;
    revelations.forEach((rev, index) => {
      message += `💡 ${rev}\n\n`;
    });
    
    message += `Plus de cartes = révélations plus précises ! 📊`;
    return message;
  }
  
  // Analyse émotions × personnes
  static analyzeEmotionsPersonnes(cartes) {
    const personnes = {};
    
    cartes.forEach(carte => {
      const message = carte.message_original.toLowerCase();
      const emotions = [carte.emotion_principale, ...(carte.emotions_secondaires?.map(e => e.emotion) || [])];
      
      // Détecter mentions de personnes
      const mentionsPersonnes = message.match(/\b(mike|marie|jean|paul|sophie|emma|louis|claire|thomas|julie|alex|maman|papa|ami|amie|collègue|chef|patron)\b/g);
      
      if (mentionsPersonnes) {
        mentionsPersonnes.forEach(personne => {
          if (!personnes[personne]) personnes[personne] = { emotions: [], total: 0 };
          personnes[personne].emotions.push(...emotions);
          personnes[personne].total++;
        });
      }
    });
    
    // Chercher patterns significatifs
    for (const [personne, data] of Object.entries(personnes)) {
      if (data.total >= 2) {
        const emotionsPositives = data.emotions.filter(e => 
          ['joie', 'bonheur', 'satisfaction', 'contentement', 'amour', 'tendresse'].some(pos => 
            e.toLowerCase().includes(pos)
          )
        ).length;
        
        if (emotionsPositives >= data.total) {
          return `Quand tu parles de ${personne.charAt(0).toUpperCase() + personne.slice(1)}, tes émotions sont systématiquement positives (${emotionsPositives}/${data.total} fois)`;
        }
      }
    }
    
    return null;
  }
  
  // Analyse émotions × temps
  static analyzeEmotionsTemps(cartes) {
    if (cartes.length < 3) return null;
    
    const heures = {};
    
    cartes.forEach(carte => {
      const heure = new Date(carte.timestamp).getHours();
      const tranche = heure < 12 ? 'matin' : (heure < 18 ? 'après-midi' : 'soir');
      
      if (!heures[tranche]) heures[tranche] = { emotions: [], intensites: [] };
      heures[tranche].emotions.push(carte.emotion_principale);
      heures[tranche].intensites.push(carte.intensite);
    });
    
    // Chercher patterns temporels
    for (const [tranche, data] of Object.entries(heures)) {
      if (data.intensites.length >= 2) {
        const moyenneIntensite = data.intensites.reduce((sum, i) => sum + i, 0) / data.intensites.length;
        if (moyenneIntensite >= 7) {
          return `Tes émotions sont particulièrement intenses le ${tranche} (moyenne ${moyenneIntensite.toFixed(1)}/10)`;
        }
      }
    }
    
    return null;
  }
  
  // Analyse émotions × activités  
  static analyzeEmotionsActivites(cartes) {
    const activites = {};
    
    cartes.forEach(carte => {
      const message = carte.message_original.toLowerCase();
      
      // Détecter activités
      const motsCles = {
        'travail': ['travail', 'bureau', 'projet', 'pc', 'ordinateur', 'boulot'],
        'sport': ['courir', 'course', 'sport', 'gym', 'vélo'],
        'social': ['apéro', 'ami', 'amie', 'voir', 'rencontrer', 'sortir'],
        'repos': ['détendre', 'relaxer', 'calme', 'repos', 'dormir']
      };
      
      for (const [activite, mots] of Object.entries(motsCles)) {
        if (mots.some(mot => message.includes(mot))) {
          if (!activites[activite]) activites[activite] = { intensites: [], emotions: [] };
          activites[activite].intensites.push(carte.intensite);
          activites[activite].emotions.push(carte.emotion_principale);
        }
      }
    });
    
    // Chercher corrélations activité-émotion
    for (const [activite, data] of Object.entries(activites)) {
      if (data.intensites.length >= 2) {
        const moyenneIntensite = data.intensites.reduce((sum, i) => sum + i, 0) / data.intensites.length;
        if (moyenneIntensite >= 7) {
          return `L'activité "${activite}" génère chez toi des émotions intenses (moyenne ${moyenneIntensite.toFixed(1)}/10)`;
        }
      }
    }
    
    return null;
  }
}

// ===== GESTIONNAIRE DE COMMANDES - AMÉLIORATION V6.1 =====
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

  // NOUVEAU V6.1 - Révélations croisées
  static handleRevelations(userId) {
    return RevelationsAnalyzer.analyzeRevelationsComplete(userId);
  }

  static handleRevelationsTemps(userId) {
    const cartes = userData[userId]?.cartes || [];
    if (cartes.length < 3) {
      return "Pas encore assez de données pour analyser tes rythmes temporels.\n\nMinimum 3 cartes nécessaires. 🕐";
    }
    
    return RevelationsAnalyzer.analyzeEmotionsTemps(cartes) || 
           "Pas encore de pattern temporel clair dans tes données.\n\nContinue à partager ! ⏰";
  }

  static handleRevelationsRelations(userId) {
    const cartes = userData[userId]?.cartes || [];
    if (cartes.length < 2) {
      return "Pas encore assez de données pour analyser l'impact des relations.\n\nMinimum 2 cartes nécessaires. 👥";
    }
    
    return RevelationsAnalyzer.analyzeEmotionsPersonnes(cartes) || 
           "Pas encore de pattern relationnel clair dans tes données.\n\nContinue à partager ! 💫";
  }

  static handleRevelationsLieux(userId) {
    const cartes = userData[userId]?.cartes || [];
    if (cartes.length < 2) {
      return "Pas encore assez de données pour analyser l'influence des environnements.\n\nMinimum 2 cartes nécessaires. 📍";
    }
    
    return RevelationsAnalyzer.analyzeEmotionsActivites(cartes) || 
           "Pas encore de pattern environnemental clair dans tes données.\n\nContinue à partager ! 🌍";
  }

  // AMÉLIORATIONS V6.1 - Vraies analyses d'habitudes
  static handleHabitudesTemps(userId) {
    const cartes = userData[userId]?.cartes || [];
    if (cartes.length < 3) {
      return "Pas encore assez de données pour tes rythmes temporels.\n\nMinimum 3 cartes nécessaires. 🕐";
    }

    // Analyse simple par tranche horaire
    const tranches = { matin: [], 'après-midi': [], soir: [] };
    
    cartes.forEach(carte => {
      const heure = new Date(carte.timestamp).getHours();
      const tranche = heure < 12 ? 'matin' : (heure < 18 ? 'après-midi' : 'soir');
      tranches[tranche].push(carte.intensite);
    });

    let message = `🕐 TES RYTHMES TEMPORELS\n\n`;
    
    Object.entries(tranches).forEach(([tranche, intensites]) => {
      if (intensites.length > 0) {
        const moyenne = (intensites.reduce((sum, i) => sum + i, 0) / intensites.length).toFixed(1);
        message += `${tranche.charAt(0).toUpperCase() + tranche.slice(1)} : ${moyenne}/10 (${intensites.length} messages)\n`;
      }
    });

    return message + `\n💡 Plus de données = analyse plus précise !`;
  }

  static handleHabitudesRelations(userId) {
    const cartes = userData[userId]?.cartes || [];
    if (cartes.length < 2) {
      return "Pas encore assez de données pour tes habitudes relationnelles.\n\nMinimum 2 cartes nécessaires. 👥";
    }

    let message = `👥 TES HABITUDES RELATIONNELLES\n\n`;
    
    const personnesMentionnees = new Set();
    cartes.forEach(carte => {
      const mentions = carte.message_original.toLowerCase().match(/\b(mike|marie|jean|paul|sophie|emma|ami|amie|collègue)\b/g);
      if (mentions) mentions.forEach(p => personnesMentionnees.add(p));
    });

    if (personnesMentionnees.size > 0) {
      message += `Personnes mentionnées : ${Array.from(personnesMentionnees).join(', ')}\n\n`;
      message += `🔍 Pour des révélations plus poussées : "révélations relations"`;
    } else {
      message += `Aucune personne spécifique mentionnée dans tes messages.\n\nParle de tes relations pour voir les patterns ! 😊`;
    }

    return message;
  }

  static handleHabitudesLieux(userId) {
    const cartes = userData[userId]?.cartes || [];
    if (cartes.length < 2) {
      return "Pas encore assez de données pour tes habitudes de lieux.\n\nMinimum 2 cartes nécessaires. 📍";
    }

    let message = `📍 TES HABITUDES DE LIEUX\n\n`;
    
    const lieuxMentionnes = new Set();
    cartes.forEach(carte => {
      const mentions = carte.message_original.toLowerCase().match(/\b(bureau|maison|pc|ordinateur|dehors|extérieur)\b/g);
      if (mentions) mentions.forEach(l => lieuxMentionnes.add(l));
    });

    if (lieuxMentionnes.size > 0) {
      message += `Environnements mentionnés : ${Array.from(lieuxMentionnes).join(', ')}\n\n`;
      message += `🔍 Pour des révélations plus poussées : "révélations lieux"`;
    } else {
      message += `Aucun lieu spécifique mentionné dans tes messages.\n\nParle de tes environnements pour voir les patterns ! 🏠`;
    }

    return message;
  }

  static handleParametres(userId) {
    const config = userData[userId]?.config || defaultUserConfig;
    const meteoStatus = config.meteo_active ? 'activée' : 'désactivée';
    const notifsStatus = config.notifications.rappels_quotidiens ? 'activées' : 'désactivées';

    return `⚙️ TES PARAMÈTRES\n\n🌤️ Météo : ${meteoStatus}\n• "météo on/off" - Activer/désactiver\n\n🔔 Notifications : ${notifsStatus}\n• "notifications on/off" - Activer/désactiver\n\n📊 Données :\n• "export" - Exporter tes données\n• "reset" - Tout effacer\n\n❓ "aide" - Guide d'utilisation`;
  }

  static handleAide(userId) {
    return `❓ GUIDE MOODMAP V6.1\n\n💬 UTILISATION :\nRaconte-moi simplement ce que tu ressens !\n\n📚 COMMANDES :\n• "journal" - Historique émotions\n• "habitudes" - Tes patterns simples\n• "révélations" - Analyses croisées RÉVOLUTIONNAIRES\n• "paramètres" - Configuration\n\n🔧 UTILE :\n• "annule" - Efface dernière carte\n• "aide journal" - Aide spécifique\n\nJe suis là pour t'aider à mieux te comprendre ! 😊`;
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

// ===== GÉNÉRATEUR DE CARTES ÉMOTIONNELLES - AMÉLIORATION V6.1 =====
// TEMPLATE MVP : Format validé, simple et efficace + phrase humaine IA
// STRUCTURE : Météo (optionnelle) + Émotions + Résumé + Phrase humaine + Action annulation
// MÉTÉO : Système figé familles × intensité (1-5) avec variations pour éviter répétitions
async function generateCarteEmotionnelle(analysis, messageOriginal, userId) {
  const config = userData[userId]?.config || defaultUserConfig;
  const carteId = Date.now().toString();
  
  // Préparer météo si activée
  let meteoLine = '';
  let meteoEmoji = '';
  let meteoNom = '';
  
  if (config.meteo_active) {
    // Convertir intensité 1-10 vers niveau météo 1-5
    const intensiteAnalyse = analysis.intensite || 5;
    const niveauMeteo = Math.min(5, Math.max(1, Math.ceil(intensiteAnalyse / 2)));
    
    // Récupérer la météo de la famille avec le bon niveau
    const familleMeteos = meteoEmotionnelle[analysis.famille] || meteoEmotionnelle['sérénité'];
    const meteoData = familleMeteos[niveauMeteo - 1]; // Index 0-4 pour niveau 1-5
    
    // NOUVEAU V6.1 : Rotation des variants pour éviter répétition
    const userCartes = userData[userId]?.cartes || [];
    const variantIndex = userCartes.length % meteoData.variants.length;
    
    meteoEmoji = meteoData.emoji;
    meteoNom = meteoData.variants[variantIndex];
    meteoLine = `${meteoEmoji} ${meteoNom}\n\n`;
  }
  
  // NOUVEAU V6.1+ : Générer résumé clair et factuel
  console.log('📝 Génération résumé clair...');
  const resumeClair = await generateResume(messageOriginal, analysis);
  console.log('📝 Résumé généré:', resumeClair);
  
  // NOUVEAU V6.1+ : Générer phrase humaine empathique avec tonalité météo
  const phraseHumaine = await generatePhraseHumaine(analysis, messageOriginal, meteoEmoji);
  
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
  carte += resumeClair || `Tu ressens ${analysis.emotion_principale} à un niveau ${analysis.intensite}/10.`;
  
  // NOUVEAU V6.1 : Phrase humaine bonus
  carte += `\n\n✨ ${phraseHumaine}`;
  
  carte += `\n\nPour annuler cette carte, réponds : annule`;
  
  // Stocker la carte avec les nouvelles données météo + résumé clair + phrase humaine
  const carteData = {
    id: carteId,
    timestamp: new Date().toISOString(),
    message_original: messageOriginal,
    emotion_principale: analysis.emotion_principale,
    famille: analysis.famille,
    intensite: analysis.intensite,
    nuance: analysis.nuance,
    cause: analysis.cause, // Résumé original de l'IA
    resume_clair: resumeClair, // Nouveau résumé optimisé
    emotions_secondaires: analysis.emotions_secondaires,
    meteo_emoji: meteoEmoji,
    meteo_nom: meteoNom,
    meteo_niveau: config.meteo_active ? Math.min(5, Math.max(1, Math.ceil((analysis.intensite || 5) / 2))) : null,
    phrase_humaine: phraseHumaine
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
      
      responseMessage = await generateCarteEmotionnelle(analysis, messageBody, fromNumber);
      
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

// ===== ROUTES SANTÉ + EXPORT =====
app.get('/', (req, res) => {
  const stats = {
    version: "6.1+ V7 STABLE CORRIGÉE",
    uptime: process.uptime(),
    users: Object.keys(userData).length,
    total_cartes: Object.values(userData).reduce((sum, user) => sum + (user.cartes?.length || 0), 0),
    features: [
      "UX Clean & Product-Ready",
      "Gestion cas particuliers complète", 
      "Template carte avec résumé empathique + phrase humaine naturelle",
      "Interdiction absolue de l'anglais dans tous les prompts",
      "Tonalité respectueuse mais chaleureuse",
      "Navigation intuitive",
      "Révélations croisées multi-dimensionnelles",
      "Météo système figé avec variations",
      "Analyses d'habitudes réelles",
      "Persistance automatique userData.json"
    ]
  };
  
  res.json({
    status: "🚀 MoodMap V6.1 RÉVOLUTIONNAIRE opérationnel !",
    stats: stats
  });
});

// Route d'export manuel pour backup
app.get('/export', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="moodmap-backup.json"');
  res.json(userData);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '6.1+ V7 CORRIGÉE',
    persistence: 'active'
  });
});

// ===== SAUVEGARDE AUTOMATIQUE =====
// Sauvegarde automatique toutes les minutes pour persistance
setInterval(() => {
  try {
    fs.writeFileSync('userData.json', JSON.stringify(userData, null, 2));
    const totalCartes = Object.values(userData).reduce((sum, user) => sum + (user.cartes?.length || 0), 0);
    console.log(`💾 Données sauvegardées: ${Object.keys(userData).length} users, ${totalCartes} cartes`);
  } catch (err) {
    console.error('❌ Erreur sauvegarde userData.json:', err);
  }
}, 60000); // Sauvegarde toutes les 60 secondes

// ===== DÉMARRAGE SERVEUR =====
app.listen(port, () => {
  console.log(`🚀 MoodMap WhatsApp Bot V6.1+ V7 STABLE CORRIGÉE démarré sur port ${port}`);
  console.log(`🎯 Focus UX : Clean, Sans Friction, Product-Ready`);
  console.log(`🧠 IA Émotionnelle : Analyse Mistral + Résumé empathique + Phrase naturelle`);
  console.log(`🇫🇷 Prompts : 100% français, interdiction absolue de l'anglais`);
  console.log(`💬 Ton : Respectueux mais chaleureux, ni familier ni coach de vie`);
  console.log(`🔧 Gestion cas particuliers : Complète`);
  console.log(`📱 Template cartes : Résumé empathique + phrase naturelle`);
  console.log(`⚙️ Paramètres utilisateur : Configurables`);
  console.log(`🌤️ Météo système figé : 10 familles × 5 intensités + variations`);
  console.log(`🔮 Révélations croisées : Analyses multi-dimensionnelles`);
  console.log(`💾 Persistance : userData.json automatique (60s)`);
  console.log(`📥 Export manuel : ${process.env.RENDER_EXTERNAL_URL || 'http://localhost:' + port}/export`);
  console.log(`💪 Ready for natural French empathy !`);
});
