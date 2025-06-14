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
    mots_cles: ['heureux', 'joie', 'content', 'bien', 'épanoui', 'rayonne', 'sourire', 'bonheur', 'excellent', 'formidable', 'super', 'génial'],
    description: 'Joie, bonheur, sérénité, euphorie'
  },
  '☁️': {
    nom: 'NUAGES',
    emoji: '☁️',
    message: 'Les nuages passent, tu demeures',
    couleur: '#B0C4DE',
    mots_cles: ['ennui', 'morne', 'gris', 'bof', 'moyen', 'ordinaire', 'banal', 'fade', 'monotone'],
    description: 'Ennui, monotonie, grisaille émotionnelle'
  },
  '🌫️': {
    nom: 'BROUILLARD',
    emoji: '🌫️',
    message: 'Ce brouillard peut aussi être une pause',
    couleur: '#D3D3D3',
    mots_cles: ['confus', 'perdu', 'flou', 'incertain', 'perplexe', 'hésitant', 'doute', 'incompréhension', 'brumeux'],
    description: 'Confusion, incertitude, perplexité'
  },
  '🌧️': {
    nom: 'PLUIE',
    emoji: '🌧️',
    message: 'Chaque goutte nourrit quelque chose en toi',
    couleur: '#4682B4',
    mots_cles: ['triste', 'déprimé', 'mal', 'mélancolie', 'cafard', 'pleure', 'chagrin', 'peine', 'nostalgie', 'larmes'],
    description: 'Tristesse, mélancolie, cafard, déprime'
  },
  '⛈️': {
    nom: 'ORAGE',
    emoji: '⛈️',
    message: 'Les tempêtes intérieures préparent souvent un ciel neuf',
    couleur: '#8B0000',
    mots_cles: ['énervé', 'colère', 'rage', 'furieux', 'irrité', 'agacé', 'frustré', 'bouillir', 'exploser'],
    description: 'Colère, frustration, énervement, rage'
  },
  '❄️': {
    nom: 'NEIGE',
    emoji: '❄️',
    message: 'Sous la neige, tout se tait… parfois c\'est nécessaire',
    couleur: '#E6E6FA',
    mots_cles: ['vide', 'engourdi', 'détaché', 'absent', 'indifférent', 'anesthésié', 'déconnecté', 'gelé', 'silence'],
    description: 'Dissociation douce, anesthésie émotionnelle, besoin de silence'
  }
};

// Fonction de détection météorologique sophistiquée
function detecterMeteo(message) {
  const texte = message.toLowerCase();
  const scores = {};
  
  // Calculer le score pour chaque météo
  for (const [emoji, meteo] of Object.entries(METEO_SYSTEM)) {
    scores[emoji] = 0;
    
    for (const mot of meteo.mots_cles) {
      if (texte.includes(mot)) {
        scores[emoji] += 1;
      }
    }
  }
  
  // Trouver la météo avec le score le plus élevé
  const meteoDetectee = Object.keys(scores).reduce((a, b) => 
    scores[a] > scores[b] ? a : b
  );
  
  // Si aucun mot-clé détecté, retourner brouillard par défaut
  return scores[meteoDetectee] > 0 ? meteoDetectee : '🌫️';
}

// Fonction d'extraction des bulles émotionnelles
function extraireBulles(message) {
  const motsvides = ['je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'avec', 'dans', 'sur', 'pour', 'par', 'sans', 'sous', 'vers', 'chez', 'et', 'ou', 'mais', 'donc', 'car', 'que', 'qui', 'quoi', 'où', 'quand', 'comment', 'pourquoi'];
  
  const mots = message.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(mot => mot.length > 3 && !motsvides.includes(mot));
  
  // Retourner les mots significatifs comme bulles
  return mots.slice(0, 5); // Limiter à 5 bulles max
}

// Fonction de génération de carte météo
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
      'Ton rayonnement aujourd\'hui est une gift pour le monde.',
      'Cette joie que tu ressens, elle t\'appartient pleinement.'
    ],
    '☁️': [
      'Ce gris peut aussi être une pause bienvenue.',
      'Parfois, les nuages nous offrent une douceur particulière.',
      'Cette neutralité que tu ressens a sa propre sagesse.'
    ],
    '🌫️': [
      'Ce brouillard a peut-être quelque chose à dire.',
      'Dans cette confusion, une clarté nouvelle se prépare.',
      'Parfois, ne pas voir loin permet de mieux voir près.'
    ],
    '🌧️': [
      'Ces gouttes nourrissent quelque chose de profond en toi.',
      'Cette tristesse que tu ressens, elle a sa propre vérité.',
      'Chaque larme porte une part de guérison.'
    ],
    '⛈️': [
      'Cette tempête intérieure prépare peut-être un renouveau.',
      'Ta colère dit quelque chose d\'important sur tes besoins.',
      'L\'orage passe, et souvent il nettoie l\'atmosphère.'
    ],
    '❄️': [
      'Ce silence intérieur est peut-être nécessaire maintenant.',
      'Sous cette neige émotionnelle, quelque chose se repose.',
      'Parfois, se retirer du monde est un acte de sagesse.'
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
        return `Tu évoques un climat ${carteActuelle.nom_meteo.toLowerCase()} aujourd'hui, comme il y a ${joursEcoules} jour${joursEcoules > 1 ? 's' : ''}.`;
      }
    }
  }
  
  return null;
}

// Routes
app.get('/', (req, res) => {
  res.send('🌤️ MoodMap WhatsApp Bot is ALIVE! Ready to track your emotional weather!');
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'MoodMap Bot is running!',
    timestamp: new Date().toISOString()
  });
});

// Route principale WhatsApp
app.post('/webhook', (req, res) => {
  console.log('📱 Message reçu:', req.body);
  
  const incomingMessage = req.body.Body || '';
  const fromNumber = req.body.From || '';
  
  console.log(`💬 De ${fromNumber}: "${incomingMessage}"`);
  
  const twiml = new MessagingResponse();
  let responseMessage = '';
  
  // Commandes spéciales
  if (incomingMessage.toLowerCase().includes('climatothèque')) {
    const cartes = climatheque.get(fromNumber) || [];
    if (cartes.length === 0) {
      responseMessage = '📚 Ta climatothèque est encore vide.\n\nPartage-moi ton état d\'esprit pour créer ta première carte météo !';
    } else {
      responseMessage = `📚 Ta climatothèque contient ${cartes.length} carte${cartes.length > 1 ? 's' : ''} météo :\n\n`;
      cartes.slice(-3).forEach(carte => {
        responseMessage += `${carte.meteo} ${carte.date} - ${carte.nom_meteo}\n`;
      });
      responseMessage += '\n💫 Chaque carte raconte un moment de ton voyage émotionnel.';
    }
  } 
  // Détection et génération de carte météo
  else if (incomingMessage.length > 10) {
    const carte = genererCarte(incomingMessage, fromNumber);
    
    // Message principal de réponse
    responseMessage = `${carte.meteo} ${carte.nom_meteo.toUpperCase()} détecté\n\n`;
    responseMessage += `💭 "${carte.message_original}"\n\n`;
    responseMessage += `🎨 ${carte.message_poetique}\n\n`;
    
    if (carte.bulles.length > 0) {
      responseMessage += `🔮 Mots-clés extraits: ${carte.bulles.join(', ')}\n\n`;
    }
    
    responseMessage += `💜 ${carte.insight_empathique}\n\n`;
    responseMessage += `📅 Carte ajoutée à ta climatothèque (${carte.date} à ${carte.heure})`;
    
    // Détecter des patterns temporels
    const pattern = detecterPatterns(fromNumber);
    if (pattern) {
      responseMessage += `\n\n🌀 Pattern détecté: ${pattern}`;
    }
  } 
  // Message d'accueil
  else {
    responseMessage = `🌤️ MoodMap Bot - Intelligence Émotionnelle\n\n`;
    responseMessage += `Je transforme tes états d'esprit en cartes météo poétiques.\n\n`;
    responseMessage += `💫 Décris-moi ton humeur du moment:\n`;
    responseMessage += `"Je me sens fatigué au travail"\n`;
    responseMessage += `"Je suis heureuse avec mes amis"\n\n`;
    responseMessage += `🎨 6 météos disponibles:\n`;
    responseMessage += `☀️ Soleil • ☁️ Nuages • 🌫️ Brouillard\n`;
    responseMessage += `🌧️ Pluie • ⛈️ Orage • ❄️ Neige\n\n`;
    responseMessage += `📚 Écris "climatothèque" pour voir ton historique`;
  }
  
  twiml.message(responseMessage);
  res.type('text/xml').send(twiml.toString());
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 MoodMap WhatsApp Bot démarré sur le port ${PORT}`);
  console.log(`🌐 URL: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
  console.log(`📱 Webhook: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}/webhook`);
});
