const express = require('express');
const { MessagingResponse } = require('twilio').twiml;
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser les données POST de Twilio
app.use(express.urlencoded({ extended: false }));

// Base de données temporaire (en mémoire pour POC)
let climatheque = new Map(); // Structure: phoneNumber -> [cartes météo]

// Configuration Mistral AI
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

// Système météorologique émotionnel enrichi
const METEO_SYSTEM = {
  '☀️': {
    nom: 'SOLEIL',
    emoji: '☀️',
    messages: [
      'Cette lumière dorée vient de toi',
      'Ton rayonnement illumine cette journée',
      'Cette joie que tu portes est contagieuse',
      'Cette énergie positive te caractérise bien'
    ],
    couleur: '#FFD700',
    description: 'Joie, bonheur, sérénité, euphorie, réussite'
  },
  '☁️': {
    nom: 'NUAGES',
    emoji: '☁️',
    messages: [
      'Les nuages passent, tu demeures',
      'Cette neutralité a sa propre douceur',
      'Parfois, la grisaille offre une pause bienvenue',
      'Cette tranquillité mérite d\'être respectée'
    ],
    couleur: '#B0C4DE',
    description: 'Ennui, monotonie, neutralité, routine'
  },
  '🌫️': {
    nom: 'BROUILLARD',
    emoji: '🌫️',
    messages: [
      'Ce brouillard peut aussi être une pause',
      'Dans cette confusion, une clarté se prépare',
      'L\'incertitude porte parfois de belles surprises',
      'Cette hésitation dit quelque chose d\'important'
    ],
    couleur: '#D3D3D3',
    description: 'Confusion, incertitude, perplexité, questionnement'
  },
  '🌧️': {
    nom: 'PLUIE',
    emoji: '🌧️',
    messages: [
      'Chaque goutte nourrit quelque chose en toi',
      'Cette tristesse a sa propre vérité',
      'Les larmes nettoient parfois l\'âme',
      'Cette mélancolie porte une beauté particulière'
    ],
    couleur: '#4682B4',
    description: 'Tristesse, mélancolie, nostalgie, chagrin'
  },
  '⛈️': {
    nom: 'ORAGE',
    emoji: '⛈️',
    messages: [
      'Les tempêtes intérieures préparent souvent un ciel neuf',
      'Cette colère dit quelque chose d\'important sur tes besoins',
      'L\'orage nettoie l\'atmosphère émotionnelle',
      'Cette frustration porte une énergie de changement'
    ],
    couleur: '#8B0000',
    description: 'Colère, frustration, irritation, révolte'
  },
  '❄️': {
    nom: 'NEIGE',
    emoji: '❄️',
    messages: [
      'Sous la neige, tout se tait… parfois c\'est nécessaire',
      'Ce silence intérieur protège quelque chose de précieux',
      'Cette distance émotionnelle est peut-être sage',
      'Parfois, se retirer du monde est un acte de guérison'
    ],
    couleur: '#E6E6FA',
    description: 'Détachement, vide, anesthésie émotionnelle, retrait'
  }
};

// Fonction d'analyse émotionnelle avec Mistral AI
async function analyserAvecMistralAI(message) {
  try {
    const prompt = `Tu es un expert en analyse émotionnelle. Analyse ce message et détermine l'émotion principale.

Message à analyser: "${message}"

Réponds UNIQUEMENT par un JSON avec cette structure exacte:
{
  "emotion_principale": "joie|tristesse|colere|confusion|ennui|detachement",
  "intensite": 1-5,
  "contexte": {
    "lieu": "bureau|maison|transport|lieu_social|autre|non_specifie",
    "personnes": ["ami", "famille", "collegue"] ou [],
    "activite": "travail|loisir|social|repos|autre|non_specifie",
    "temporel": "matin|apres_midi|soir|week_end|autre|non_specifie"
  },
  "mots_cles": ["mot1", "mot2", "mot3"],
  "sentiment_global": "positif|neutre|negatif",
  "nuances": "description en une phrase de 10-15 mots"
}

Sois précis et factuel. Ne donne QUE le JSON, rien d'autre.`;

    const response = await axios.post(MISTRAL_API_URL, {
      model: 'mistral-tiny',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 300
    }, {
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const analysis = JSON.parse(response.data.choices[0].message.content);
    return analysis;

  } catch (error) {
    console.error('Erreur Mistral AI:', error.response?.data || error.message);
    
    // Fallback simple en cas d'erreur
    return {
      emotion_principale: 'confusion',
      intensite: 2,
      contexte: {
        lieu: 'non_specifie',
        personnes: [],
        activite: 'non_specifie',
        temporel: 'non_specifie'
      },
      mots_cles: message.toLowerCase().split(' ').slice(0, 3),
      sentiment_global: 'neutre',
      nuances: 'Analyse par défaut (erreur IA)'
    };
  }
}

// Fonction de mapping émotion → météo
function mapperEmotionVersMeteo(emotion, sentiment, intensite) {
  const mapping = {
    'joie': '☀️',
    'tristesse': '🌧️',
    'colere': '⛈️',
    'confusion': '🌫️',
    'ennui': '☁️',
    'detachement': '❄️'
  };

  let meteo = mapping[emotion] || '🌫️';
  
  // Ajustements selon sentiment global et intensité
  if (sentiment === 'positif' && intensite >= 4) {
    meteo = '☀️';
  } else if (sentiment === 'negatif' && intensite >= 4 && emotion === 'tristesse') {
    meteo = '🌧️';
  } else if (sentiment === 'negatif' && intensite >= 4 && emotion === 'colere') {
    meteo = '⛈️';
  }
  
  return meteo;
}

// Fonction de génération d'insight empathique personnalisé
async function genererInsightPersonnalise(analysis, historique) {
  try {
    let contexteHistorique = '';
    if (historique.length > 0) {
      const dernieresCartes = historique.slice(-3);
      contexteHistorique = `Historique récent: ${dernieresCartes.map(c => `${c.nom_meteo} (${c.contexte?.activite || 'activité inconnue'})`).join(', ')}`;
    }

    const prompt = `Tu es un thérapeute empathique et bienveillant. Génère un insight personnalisé de 12-20 mots maximum.

Émotion actuelle: ${analysis.emotion_principale}
Intensité: ${analysis.intensite}/5
Contexte: ${JSON.stringify(analysis.contexte)}
Nuances: ${analysis.nuances}
${contexteHistorique}

Règles STRICTES:
- 12-20 mots maximum
- Aucun conseil ou solution
- Aucun jugement
- Ton empathique et validant
- Pas de questions
- Validation de l'expérience émotionnelle

Exemples de bon style:
"Cette fatigue au travail dit quelque chose d'important sur tes besoins."
"Cette joie avec tes amis révèle la beauté de tes relations."
"Ce silence intérieur protège peut-être quelque chose de précieux."

Génère un insight unique pour cette situation:`;

    const response = await axios.post(MISTRAL_API_URL, {
      model: 'mistral-tiny',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 80
    }, {
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content.trim().replace(/"/g, '');

  } catch (error) {
    console.error('Erreur génération insight:', error);
    
    // Fallback selon l'émotion
    const fallbacks = {
      'joie': 'Cette lumière que tu portes mérite d\'être célébrée.',
      'tristesse': 'Cette peine que tu ressens a sa propre vérité.',
      'colere': 'Cette frustration dit quelque chose d\'important sur tes besoins.',
      'confusion': 'Cette incertitude porte peut-être une clarté nouvelle.',
      'ennui': 'Cette neutralité a sa propre sagesse tranquille.',
      'detachement': 'Ce silence intérieur est peut-être nécessaire maintenant.'
    };
    
    return fallbacks[analysis.emotion_principale] || 'Cette émotion que tu vis mérite d\'être accueillie avec bienveillance.';
  }
}

// Fonction de génération de carte météo avec IA
async function genererCarteAvecIA(message, phoneNumber) {
  console.log('🧠 Analyse IA en cours...');
  
  // Récupérer l'historique
  const historique = climatheque.get(phoneNumber) || [];
  
  // Analyser avec Mistral AI
  const analysis = await analyserAvecMistralAI(message);
  console.log('📊 Analyse IA:', analysis);
  
  // Mapper vers météo
  const meteo = mapperEmotionVersMeteo(analysis.emotion_principale, analysis.sentiment_global, analysis.intensite);
  const meteoInfo = METEO_SYSTEM[meteo];
  
  // Générer insight personnalisé
  const insight = await genererInsightPersonnalise(analysis, historique);
  
  // Sélectionner message poétique adapté
  const messagePoetique = meteoInfo.messages[Math.floor(Math.random() * meteoInfo.messages.length)];
  
  const timestamp = new Date();
  
  const carte = {
    id: Date.now(),
    timestamp: timestamp,
    date: timestamp.toLocaleDateString('fr-FR'),
    heure: timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    message_original: message,
    meteo: meteo,
    nom_meteo: meteoInfo.nom,
    message_poetique: messagePoetique,
    couleur: meteoInfo.couleur,
    mots_cles: analysis.mots_cles,
    insight_empathique: insight,
    contexte: analysis.contexte,
    intensite: analysis.intensite,
    nuances: analysis.nuances,
    analysis_complete: analysis
  };
  
  // Ajouter à la climatothèque
  if (!climatheque.has(phoneNumber)) {
    climatheque.set(phoneNumber, []);
  }
  climatheque.get(phoneNumber).push(carte);
  
  return carte;
}

// Fonction de détection de patterns intelligents
function detecterPatternsIntelligents(phoneNumber) {
  const cartes = climatheque.get(phoneNumber) || [];
  if (cartes.length < 2) return null;
  
  const carteActuelle = cartes[cartes.length - 1];
  const cartesPassees = cartes.slice(0, -1);
  
  // Pattern 1: Même contexte, émotions différentes
  for (let i = cartesPassees.length - 1; i >= Math.max(0, cartesPassees.length - 5); i--) {
    const cartePassee = cartesPassees[i];
    
    // Même lieu, émotion différente
    if (cartePassee.contexte?.lieu === carteActuelle.contexte?.lieu && 
        cartePassee.contexte?.lieu !== 'non_specifie') {
      const joursEcoules = Math.floor((carteActuelle.timestamp - cartePassee.timestamp) / (1000 * 60 * 60 * 24));
      if (joursEcoules <= 7) {
        return `🏢 Même lieu (${cartePassee.contexte.lieu}): ${cartePassee.meteo} il y a ${joursEcoules}j → ${carteActuelle.meteo} aujourd'hui`;
      }
    }
    
    // Même activité, pattern émotionnel
    if (cartePassee.contexte?.activite === carteActuelle.contexte?.activite && 
        cartePassee.contexte?.activite !== 'non_specifie') {
      const joursEcoules = Math.floor((carteActuelle.timestamp - cartePassee.timestamp) / (1000 * 60 * 60 * 24));
      if (joursEcoules <= 14 && cartePassee.meteo === carteActuelle.meteo) {
        return `⚡ Pattern détecté: ${carteActuelle.contexte.activite} → ${carteActuelle.meteo} (récurrent)`;
      }
    }
  }
  
  return null;
}

// Fonction de formatage de réponse élégante V3.0
function formaterReponseV3(carte, pattern = null) {
  let response = '';
  
  // Header avec intensité
  const intensiteEmoji = '●'.repeat(carte.intensite) + '○'.repeat(5 - carte.intensite);
  response += `${carte.meteo} ═══ ${carte.nom_meteo} ═══\n`;
  response += `${intensiteEmoji} Intensité ${carte.intensite}/5\n\n`;
  
  // Citation + nuances
  response += `💭 "${carte.message_original}"\n`;
  response += `   └ ${carte.nuances}\n\n`;
  
  // Message poétique
  response += `✨ ${carte.message_poetique}\n\n`;
  
  // Contexte extrait (si significatif)
  if (carte.contexte?.lieu !== 'non_specifie' || carte.contexte?.activite !== 'non_specifie') {
    response += `🎯 `;
    if (carte.contexte.lieu !== 'non_specifie') response += `📍${carte.contexte.lieu} `;
    if (carte.contexte.activite !== 'non_specifie') response += `⚡${carte.contexte.activite} `;
    if (carte.mots_cles.length > 0) response += `• ${carte.mots_cles.slice(0, 3).join(' • ')}`;
    response += `\n\n`;
  }
  
  // Insight empathique IA
  response += `💝 ${carte.insight_empathique}\n\n`;
  
  // Pattern détecté
  if (pattern) {
    response += `🌀 ${pattern}\n\n`;
  }
  
  // Footer
  response += `━━━━━━━━━━━━━━━━━━━\n`;
  response += `📚 Analysé par IA • Ajouté à ta climatothèque\n`;
  response += `   └ ${carte.date} • ${carte.heure}`;
  
  return response;
}

// Routes
app.get('/', (req, res) => {
  res.send(`
    <h1>🌤️ MoodMap WhatsApp Bot V3.0 - Mistral AI</h1>
    <p><strong>Status:</strong> 🟢 LIVE & POWERED BY AI!</p>
    <p><strong>Features:</strong> Mistral AI emotion analysis + Contextual insights</p>
    <p><strong>API Key:</strong> ${MISTRAL_API_KEY ? '✅ Configured' : '❌ Missing'}</p>
    <p><strong>Webhook:</strong> <code>/webhook</code></p>
    <p><strong>Health:</strong> <a href="/health">/health</a></p>
  `);
});

app.get('/health', (req, res) => {
  const stats = {
    status: 'OK',
    version: '3.0 - Mistral AI',
    message: 'MoodMap Bot V3.0 - Powered by Mistral AI!',
    timestamp: new Date().toISOString(),
    mistral_api: MISTRAL_API_KEY ? 'Connected' : 'Not configured',
    features: [
      'Mistral AI emotion analysis',
      'Advanced context extraction', 
      'Personalized empathic insights',
      'Intelligent pattern detection',
      'Elegant message formatting'
    ],
    total_users: climatheque.size,
    total_cards: Array.from(climatheque.values()).reduce((sum, cards) => sum + cards.length, 0)
  };
  res.status(200).json(stats);
});

// Route principale WhatsApp avec IA
app.post('/webhook', async (req, res) => {
  console.log('📱 Message reçu V3.0 (Mistral AI):', req.body);
  
  const incomingMessage = req.body.Body || '';
  const fromNumber = req.body.From || '';
  
  console.log(`💬 De ${fromNumber}: "${incomingMessage}"`);
  
  const twiml = new MessagingResponse();
  let responseMessage = '';
  
  try {
    // Commandes spéciales
    if (incomingMessage.toLowerCase().includes('climatothèque')) {
      const cartes = climatheque.get(fromNumber) || [];
      if (cartes.length === 0) {
        responseMessage = `📚 ═══ CLIMATOTHÈQUE ═══\n\n`;
        responseMessage += `🌱 Ta collection IA est encore vide\n\n`;
        responseMessage += `🧠 Partage-moi ton état d'esprit\n`;
        responseMessage += `   L'IA Mistral analysera tes émotions !`;
      } else {
        responseMessage = `📚 ═══ CLIMATOTHÈQUE IA ═══\n\n`;
        responseMessage += `💎 ${cartes.length} analyse${cartes.length > 1 ? 's' : ''} émotionnelle${cartes.length > 1 ? 's' : ''}\n\n`;
        
        cartes.slice(-3).forEach((carte) => {
          const intensite = '●'.repeat(carte.intensite || 2);
          responseMessage += `${carte.meteo} ${carte.date} • ${carte.nom_meteo} ${intensite}\n`;
        });
        
        responseMessage += `\n━━━━━━━━━━━━━━━━━━━\n`;
        responseMessage += `🧠 Chaque analyse révèle ton paysage émotionnel`;
      }
    } 
    // Analyse IA du message
    else if (incomingMessage.length > 8) {
      console.log('🧠 Début analyse Mistral AI...');
      const carte = await genererCarteAvecIA(incomingMessage, fromNumber);
      const pattern = detecterPatternsIntelligents(fromNumber);
      responseMessage = formaterReponseV3(carte, pattern);
      console.log('✅ Réponse IA générée');
    } 
    // Message d'accueil
    else {
      responseMessage = `🌤️ ═══ MOODMAP V3.0 ═══\n\n`;
      responseMessage += `🧠 Intelligence Émotionnelle par Mistral AI\n\n`;
      responseMessage += `💬 Décris-moi ton état d'esprit:\n`;
      responseMessage += `   "Épuisé par cette réunion"\n`;
      responseMessage += `   "Radieuse après ce succès"\n\n`;
      responseMessage += `🎨 L'IA analyse:\n`;
      responseMessage += `   • Émotion principale + intensité\n`;
      responseMessage += `   • Contexte (lieu, activité, personnes)\n`;
      responseMessage += `   • Patterns personnalisés\n\n`;
      responseMessage += `━━━━━━━━━━━━━━━━━━━\n`;
      responseMessage += `📚 "climatothèque" → Ton historique IA`;
    }
    
  } catch (error) {
    console.error('Erreur dans webhook:', error);
    responseMessage = `🔧 Erreur technique temporaire.\nEssaie de nouveau dans quelques secondes !`;
  }
  
  twiml.message(responseMessage);
  res.type('text/xml').send(twiml.toString());
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 MoodMap WhatsApp Bot V3.0 démarré sur le port ${PORT}`);
  console.log(`🧠 Mistral AI: ${MISTRAL_API_KEY ? 'ACTIVÉ ✅' : 'NON CONFIGURÉ ❌'}`);
  console.log(`🎯 Fonctionnalités V3.0: Analyse émotionnelle IA + Contexte + Insights personnalisés`);
  console.log(`🌐 URL: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
  console.log(`📱 Webhook: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}/webhook`);
});
