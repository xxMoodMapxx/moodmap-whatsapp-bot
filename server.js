const express = require('express');
const { MessagingResponse } = require('twilio').twiml;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser les données POST de Twilio
app.use(express.urlencoded({ extended: false }));

// Base de données temporaire (en mémoire pour POC)
let climatheque = new Map(); // Structure: phoneNumber -> [cartes météo]

// Système météorologique émotionnel enrichi
const METEO_SYSTEM = {
  '☀️': {
    nom: 'SOLEIL',
    emoji: '☀️',
    message: 'Cette lumière dorée vient de toi',
    couleur: '#FFD700',
    mots_positifs: ['heureux', 'joie', 'content', 'bien', 'épanoui', 'rayonne', 'sourire', 'bonheur', 'excellent', 'formidable', 'super', 'génial', 'merveilleuse', 'réussi', 'réussir', 'parfait', 'fantastique', 'merveilleux'],
    expressions_positives: ['sans doute', 'j\'ai réussi', 'ça marche', 'c\'est bon', 'top niveau'],
    poids: 3,
    description: 'Joie, bonheur, sérénité, euphorie'
  },
  '☁️': {
    nom: 'NUAGES',
    emoji: '☁️',
    message: 'Les nuages passent, tu demeures',
    couleur: '#B0C4DE',
    mots_positifs: ['ennui', 'morne', 'gris', 'bof', 'moyen', 'ordinaire', 'banal', 'fade', 'monotone', 'routine'],
    expressions_positives: ['ça va', 'c\'est ok', 'comme d\'habitude'],
    poids: 1,
    description: 'Ennui, monotonie, grisaille émotionnelle'
  },
  '🌫️': {
    nom: 'BROUILLARD',
    emoji: '🌫️',
    message: 'Ce brouillard peut aussi être une pause',
    couleur: '#D3D3D3',
    mots_positifs: ['confus', 'perdu', 'flou', 'incertain', 'perplexe', 'hésitant', 'incompréhension', 'brumeux', 'je sais pas', 'compliqué'],
    expressions_positives: ['je comprends pas', 'c\'est flou', 'pas clair'],
    poids: 1,
    description: 'Confusion, incertitude, perplexité'
  },
  '🌧️': {
    nom: 'PLUIE',
    emoji: '🌧️',
    message: 'Chaque goutte nourrit quelque chose en toi',
    couleur: '#4682B4',
    mots_positifs: ['triste', 'déprimé', 'mal', 'mélancolie', 'cafard', 'pleure', 'chagrin', 'peine', 'nostalgie', 'larmes', 'malheureux', 'découragement'],
    expressions_positives: ['j\'ai le blues', 'ça va pas', 'c\'est dur'],
    poids: 2,
    description: 'Tristesse, mélancolie, cafard, déprime'
  },
  '⛈️': {
    nom: 'ORAGE',
    emoji: '⛈️',
    message: 'Les tempêtes intérieures préparent souvent un ciel neuf',
    couleur: '#8B0000',
    mots_positifs: ['énervé', 'colère', 'rage', 'furieux', 'irrité', 'agacé', 'frustré', 'bouillir', 'exploser', 'en colère', 'ras le bol'],
    expressions_positives: ['j\'en ai marre', 'ça m\'énerve', 'je pète un câble'],
    poids: 2,
    description: 'Colère, frustration, énervement, rage'
  },
  '❄️': {
    nom: 'NEIGE',
    emoji: '❄️',
    message: 'Sous la neige, tout se tait… parfois c\'est nécessaire',
    couleur: '#E6E6FA',
    mots_positifs: ['vide', 'engourdi', 'détaché', 'absent', 'indifférent', 'anesthésié', 'déconnecté', 'gelé', 'silence', 'nowhere'],
    expressions_positives: ['j\'ai plus envie', 'je sens rien', 'complètement vide'],
    poids: 2,
    description: 'Dissociation douce, anesthésie émotionnelle, besoin de silence'
  }
};

// Fonction de détection météorologique sophistiquée avec scoring pondéré
function detecterMeteo(message) {
  const texte = message.toLowerCase();
  const scores = {};
  
  // Initialiser les scores
  for (const emoji of Object.keys(METEO_SYSTEM)) {
    scores[emoji] = 0;
  }
  
  // Analyser chaque météo
  for (const [emoji, meteo] of Object.entries(METEO_SYSTEM)) {
    // Scorer les mots individuels
    for (const mot of meteo.mots_positifs) {
      if (texte.includes(mot)) {
        scores[emoji] += meteo.poids;
      }
    }
    
    // Scorer les expressions complètes (plus de poids)
    for (const expression of meteo.expressions_positives) {
      if (texte.includes(expression)) {
        scores[emoji] += meteo.poids * 2; // Double poids pour les expressions
      }
    }
  }
  
  // Gestion spéciale d'expressions idiomatiques positives
  if (texte.includes('sans doute') && (texte.includes('réussi') || texte.includes('marche') || texte.includes('bien'))) {
    scores['☀️'] += 4; // Boost soleil pour "sans doute réussi"
  }
  
  // Trouver la météo avec le score le plus élevé
  const meteoDetectee = Object.keys(scores).reduce((a, b) => 
    scores[a] > scores[b] ? a : b
  );
  
  // Si aucun score positif, retourner brouillard par défaut
  return scores[meteoDetectee] > 0 ? meteoDetectee : '🌫️';
}

// Fonction d'extraction des bulles émotionnelles améliorée
function extraireBulles(message) {
  const motsvides = [
    'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'des',
    'avec', 'dans', 'sur', 'pour', 'par', 'sans', 'sous', 'vers', 'chez',
    'et', 'ou', 'mais', 'donc', 'car', 'que', 'qui', 'quoi', 'où', 'quand', 'comment', 'pourquoi',
    'ce', 'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
    'avoir', 'être', 'fait', 'faire', 'dit', 'dire', 'voir', 'aller', 'venir',
    'très', 'plus', 'moins', 'aussi', 'encore', 'déjà', 'toujours', 'jamais',
    'aujourd', 'hier', 'demain', 'maintenant', 'alors', 'après', 'avant'
  ];
  
  const mots = message.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(mot => 
      mot.length > 4 && 
      !motsvides.includes(mot) && 
      !mot.match(/^\d+$/) // Exclure les nombres
    )
    .slice(0, 4); // Limiter à 4 mots-clés max
  
  return mots;
}

// Fonction de génération de carte météo avec design amélioré
function genererCarte(message, phoneNumber) {
  const meteo = detecterMeteo(message);
  const meteoInfo = METEO_SYSTEM[meteo];
  const bulles = extraireBulles(message);
  const timestamp = new Date();
  
  const carte = {
    id: Date.now(),
    timestamp: timestamp,
    date: timestamp.toLocaleDateString('fr-FR'),
    heure: timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    message_original: message,
    meteo: meteo,
    nom_meteo: meteoInfo.nom,
    message_poetique: meteoInfo.message,
    couleur: meteoInfo.couleur,
    bulles: bulles,
    insight_empathique: genererInsight(meteo, bulles)
  };
  
  // Ajouter à la climatothèque
  if (!climatheque.has(phoneNumber)) {
    climatheque.set(phoneNumber, []);
  }
  climatheque.get(phoneNumber).push(carte);
  
  return carte;
}

// Fonction de génération d'insights empathiques
function genererInsight(meteo, bulles) {
  const insights = {
    '☀️': [
      'Cette lumière intérieure mérite d\'être célébrée.',
      'Ton rayonnement aujourd\'hui est un cadeau pour le monde.',
      'Cette joie que tu ressens, elle t\'appartient pleinement.',
      'Ce succès que tu vis, il reflète ta persévérance.'
    ],
    '☁️': [
      'Ce gris peut aussi être une pause bienvenue.',
      'Parfois, les nuages nous offrent une douceur particulière.',
      'Cette neutralité que tu ressens a sa propre sagesse.',
      'Dans cette monotonie, quelque chose se repose.'
    ],
    '🌫️': [
      'Ce brouillard a peut-être quelque chose à dire.',
      'Dans cette confusion, une clarté nouvelle se prépare.',
      'Parfois, ne pas voir loin permet de mieux voir près.',
      'Cette incertitude porte peut-être une vérité cachée.'
    ],
    '🌧️': [
      'Ces gouttes nourrissent quelque chose de profond en toi.',
      'Cette tristesse que tu ressens, elle a sa propre vérité.',
      'Chaque larme porte une part de guérison.',
      'Cette mélancolie dit quelque chose d\'important sur ton cœur.'
    ],
    '⛈️': [
      'Cette tempête intérieure prépare peut-être un renouveau.',
      'Ta colère dit quelque chose d\'important sur tes besoins.',
      'L\'orage passe, et souvent il nettoie l\'atmosphère.',
      'Cette frustration porte une énergie de changement.'
    ],
    '❄️': [
      'Ce silence intérieur est peut-être nécessaire maintenant.',
      'Sous cette neige émotionnelle, quelque chose se repose.',
      'Parfois, se retirer du monde est un acte de sagesse.',
      'Cette distance que tu ressens protège peut-être quelque chose de précieux.'
    ]
  };
  
  const optionsInsight = insights[meteo] || insights['🌫️'];
  return optionsInsight[Math.floor(Math.random() * optionsInsight.length)];
}

// Fonction de détection de patterns temporels
function detecterPatterns(phoneNumber) {
  const cartes = climatheque.get(phoneNumber) || [];
  if (cartes.length < 2) return null;
  
  const carteActuelle = cartes[cartes.length - 1];
  const cartesPassees = cartes.slice(0, -1);
  
  // Chercher des patterns de météo similaire
  for (let i = cartesPassees.length - 1; i >= 0; i--) {
    const cartePassee = cartesPassees[i];
    if (cartePassee.meteo === carteActuelle.meteo) {
      const joursEcoules = Math.floor((carteActuelle.timestamp - cartePassee.timestamp) / (1000 * 60 * 60 * 24));
      if (joursEcoules > 0 && joursEcoules < 30) {
        return `${carteActuelle.meteo} Pattern détecté: même climat qu'il y a ${joursEcoules} jour${joursEcoules > 1 ? 's' : ''}.`;
      }
    }
  }
  
  return null;
}

// Fonction de formatage du message avec design élégant
function formaterReponse(carte, pattern = null) {
  let response = '';
  
  // Header avec design élégant
  response += `${carte.meteo} ═══ ${carte.nom_meteo} ═══\n\n`;
  
  // Citation du message original
  response += `💭 "${carte.message_original}"\n\n`;
  
  // Message poétique avec séparateur
  response += `✨ ${carte.message_poetique}\n\n`;
  
  // Mots-clés extraits (seulement s'il y en a)
  if (carte.bulles.length > 0) {
    response += `🎯 ${carte.bulles.join(' • ')}\n\n`;
  }
  
  // Insight empathique
  response += `💝 ${carte.insight_empathique}\n\n`;
  
  // Pattern détecté (si applicable)
  if (pattern) {
    response += `🌀 ${pattern}\n\n`;
  }
  
  // Footer avec climatothèque
  response += `━━━━━━━━━━━━━━━━━━━\n`;
  response += `📚 Ajouté à ta climatothèque\n`;
  response += `   └ ${carte.date} • ${carte.heure}`;
  
  return response;
}

// Routes
app.get('/', (req, res) => {
  res.send(`
    <h1>🌤️ MoodMap WhatsApp Bot V2.0</h1>
    <p><strong>Status:</strong> 🟢 LIVE & READY!</p>
    <p><strong>Features:</strong> Intelligent emotion detection + Beautiful design</p>
    <p><strong>Webhook:</strong> <code>/webhook</code></p>
    <p><strong>Health:</strong> <a href="/health">/health</a></p>
  `);
});

app.get('/health', (req, res) => {
  const stats = {
    status: 'OK',
    version: '2.0',
    message: 'MoodMap Bot V2.0 - Intelligent & Beautiful!',
    timestamp: new Date().toISOString(),
    features: ['Smart emotion detection', 'Elegant message design', 'Pattern recognition', 'Climatothèque storage'],
    total_users: climatheque.size,
    total_cards: Array.from(climatheque.values()).reduce((sum, cards) => sum + cards.length, 0)
  };
  res.status(200).json(stats);
});

// Route principale WhatsApp
app.post('/webhook', (req, res) => {
  console.log('📱 Message reçu V2.0:', req.body);
  
  const incomingMessage = req.body.Body || '';
  const fromNumber = req.body.From || '';
  
  console.log(`💬 De ${fromNumber}: "${incomingMessage}"`);
  
  const twiml = new MessagingResponse();
  let responseMessage = '';
  
  // Commandes spéciales
  if (incomingMessage.toLowerCase().includes('climatothèque')) {
    const cartes = climatheque.get(fromNumber) || [];
    if (cartes.length === 0) {
      responseMessage = `📚 ═══ CLIMATOTHÈQUE ═══\n\n`;
      responseMessage += `🌱 Ta collection est encore vide\n\n`;
      responseMessage += `✨ Partage-moi ton état d'esprit\n`;
      responseMessage += `   pour créer ta première carte météo !`;
    } else {
      responseMessage = `📚 ═══ CLIMATOTHÈQUE ═══\n\n`;
      responseMessage += `💎 ${cartes.length} carte${cartes.length > 1 ? 's' : ''} météo dans ta collection\n\n`;
      
      cartes.slice(-3).forEach((carte, index) => {
        responseMessage += `${carte.meteo} ${carte.date} • ${carte.nom_meteo}\n`;
      });
      
      responseMessage += `\n━━━━━━━━━━━━━━━━━━━\n`;
      responseMessage += `💫 Chaque carte raconte un moment\n`;
      responseMessage += `   de ton voyage émotionnel`;
    }
  } 
  // Détection et génération de carte météo
  else if (incomingMessage.length > 8) {
    const carte = genererCarte(incomingMessage, fromNumber);
    const pattern = detecterPatterns(fromNumber);
    responseMessage = formaterReponse(carte, pattern);
  } 
  // Message d'accueil
  else {
    responseMessage = `🌤️ ═══ MOODMAP BOT ═══\n\n`;
    responseMessage += `✨ Intelligence Émotionnelle Poétique\n\n`;
    responseMessage += `💬 Décris-moi ton humeur:\n`;
    responseMessage += `   "Je me sens fatigué au travail"\n`;
    responseMessage += `   "Journée géniale avec mes amis"\n\n`;
    responseMessage += `🎨 Six météos disponibles:\n`;
    responseMessage += `   ☀️ Soleil • ☁️ Nuages • 🌫️ Brouillard\n`;
    responseMessage += `   🌧️ Pluie • ⛈️ Orage • ❄️ Neige\n\n`;
    responseMessage += `━━━━━━━━━━━━━━━━━━━\n`;
    responseMessage += `📚 Tape "climatothèque" pour ton historique`;
  }
  
  twiml.message(responseMessage);
  res.type('text/xml').send(twiml.toString());
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 MoodMap WhatsApp Bot V2.0 démarré sur le port ${PORT}`);
  console.log(`🧠 Algorithme intelligent: Scoring pondéré + expressions idiomatiques`);
  console.log(`🎨 Design élégant: Mise en page structurée + séparateurs`);
  console.log(`🌐 URL: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
  console.log(`📱 Webhook: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}/webhook`);
});
