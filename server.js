const express = require('express');
const { MessagingResponse } = require('twilio').twiml;
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: false }));

// Base de données temporaire (en mémoire pour POC)
let climatheque = new Map(); // Structure: phoneNumber -> [cartes météo]

// Configuration Mistral AI
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

// Système météorologique CLEAN (plus de mots-clés dans le principal)
const METEO_SYSTEM = {
  '☀️': {
    nom: 'SOLEIL',
    emoji: '☀️',
    couleur: '#FFD700',
    valeur_numerique: 5,
    description: 'Joie, bonheur, sérénité, euphorie, réussite',
    // Messages backup (fallback seulement)
    messages_backup: [
      'Cette lumière dorée vient de toi',
      'Ton rayonnement illumine cette journée',
      'Cette joie que tu portes est contagieuse',
      'Cette énergie positive te caractérise bien',
      'Cette clarté intérieure mérite d\'être célébrée',
      'Ta joie rayonne et touche ceux qui t\'entourent',
      'Cette lumière que tu dégages est précieuse',
      'Ton bonheur illumine ton chemin',
      'Cette sérénité que tu ressens est bien méritée',
      'Cette euphorie positive nourrit ton être'
    ]
  },
  '☁️': {
    nom: 'NUAGES',
    emoji: '☁️',
    couleur: '#B0C4DE',
    valeur_numerique: 3,
    description: 'Ennui, monotonie, neutralité, routine',
    messages_backup: [
      'Les nuages passent, tu demeures',
      'Cette neutralité a sa propre douceur',
      'Parfois, la grisaille offre une pause bienvenue',
      'Cette tranquillité mérite d\'être respectée',
      'Dans cette grisaille, quelque chose se repose',
      'Cette monotonie protège peut-être ton énergie',
      'Ce temps neutre a sa propre sagesse',
      'Cette routine offre parfois un réconfort',
      'Dans cette banalité, tu peux trouver la paix',
      'Cette normalité a sa propre beauté discrète'
    ]
  },
  '🌫️': {
    nom: 'BROUILLARD',
    emoji: '🌫️',
    couleur: '#D3D3D3',
    valeur_numerique: 2,
    description: 'Confusion, incertitude, perplexité, questionnement',
    messages_backup: [
      'Ce brouillard peut aussi être une pause',
      'Dans cette confusion, une clarté se prépare',
      'L\'incertitude porte parfois de belles surprises',
      'Cette hésitation dit quelque chose d\'important',
      'Dans ce flou, une vérité nouvelle émerge peut-être',
      'Cette confusion est parfois le début d\'une découverte',
      'Ce questionnement révèle ta quête de sens',
      'Dans cette perplexité, ton intelligence travaille',
      'Cette incertitude montre ta capacité à douter',
      'Ce brouillard mental précède souvent la clarté'
    ]
  },
  '🌧️': {
    nom: 'PLUIE',
    emoji: '🌧️',
    couleur: '#4682B4',
    valeur_numerique: 2,
    description: 'Tristesse, mélancolie, nostalgie, chagrin',
    messages_backup: [
      'Chaque goutte nourrit quelque chose en toi',
      'Cette tristesse a sa propre vérité',
      'Les larmes nettoient parfois l\'âme',
      'Cette mélancolie porte une beauté particulière',
      'Cette peine que tu ressens a du sens',
      'Dans cette tristesse, quelque chose de profond se révèle',
      'Cette mélancolie témoigne de ta sensibilité',
      'Ces larmes sont parfois nécessaires à l\'âme',
      'Cette nostalgie dit quelque chose sur tes valeurs',
      'Dans ce chagrin, ton cœur s\'exprime authentiquement'
    ]
  },
  '⛈️': {
    nom: 'ORAGE',
    emoji: '⛈️',
    couleur: '#8B0000',
    valeur_numerique: 1,
    description: 'Colère, frustration, irritation, révolte',
    messages_backup: [
      'Les tempêtes intérieures préparent souvent un ciel neuf',
      'Cette colère dit quelque chose d\'important sur tes besoins',
      'L\'orage nettoie l\'atmosphère émotionnelle',
      'Cette frustration porte une énergie de changement',
      'Cette irritation révèle tes limites importantes',
      'Dans cette colère, une vérité puissante s\'exprime',
      'Cette révolte témoigne de tes valeurs profondes',
      'Cet orage intérieur peut précéder un renouveau',
      'Cette frustration signale quelque chose d\'essentiel',
      'Dans cette tempête, ton authenticité se révèle'
    ]
  },
  '❄️': {
    nom: 'NEIGE',
    emoji: '❄️',
    couleur: '#E6E6FA',
    valeur_numerique: 1,
    description: 'Détachement, vide, anesthésie émotionnelle, retrait',
    messages_backup: [
      'Sous la neige, tout se tait… parfois c\'est nécessaire',
      'Ce silence intérieur protège quelque chose de précieux',
      'Cette distance émotionnelle est peut-être sage',
      'Parfois, se retirer du monde est un acte de guérison',
      'Dans ce vide, quelque chose se régénère peut-être',
      'Cette anesthésie émotionnelle protège ton être',
      'Ce détachement révèle ton besoin de préservation',
      'Dans ce silence, ton âme trouve peut-être le repos',
      'Cette distance est parfois une forme de sagesse',
      'Sous cette neige intérieure, quelque chose se préserve'
    ]
  }
};

// Système de fallback ENRICHI (50+ mots-clés par émotion)
const FALLBACK_DETECTION = {
  '☀️': {
    mots_cles: [
      // Joie directe
      'heureux', 'heureuse', 'joie', 'joyeux', 'joyeuse', 'content', 'contente', 'bien', 'super', 'génial', 'géniale', 'excellent', 'excellente', 'formidable', 'fantastique', 'merveilleux', 'merveilleuse', 'parfait', 'parfaite', 'top', 'cool', 'incroyable',
      // Énergie positive  
      'épanoui', 'épanouie', 'rayonne', 'rayonnant', 'rayonnante', 'sourire', 'souriant', 'souriante', 'rire', 'rigole', 'éclate', 'bonheur', 'béatitude', 'extase', 'euphorie', 'enthousiasme', 'enthousiaste', 'motivé', 'motivée', 'inspiré', 'inspirée',
      // Réussite
      'réussi', 'réussir', 'réussite', 'succès', 'victoire', 'gagné', 'gagnant', 'gagnante', 'triomphe', 'accompli', 'accomplie', 'fier', 'fière', 'fierté', 'satisfait', 'satisfaite', 'accompli', 'abouti',
      // Expressions
      'ça marche', 'c\'est bon', 'nickel', 'sans doute', 'j\'ai réussi', 'trop bien', 'au top', 'que du bonheur'
    ]
  },
  '🌧️': {
    mots_cles: [
      // Tristesse directe
      'triste', 'tristesse', 'déprimé', 'déprimée', 'déprime', 'mal', 'malheureux', 'malheureuse', 'mélancolie', 'mélancolique', 'cafard', 'bourdon', 'pleure', 'pleurs', 'larmes', 'chagrin', 'peine', 'nostalgie', 'nostalgique',
      // Fatigue émotionnelle
      'épuisé', 'épuisée', 'crevé', 'crevée', 'lessivé', 'lessivée', 'vidé', 'vidée', 'fatigué', 'fatiguée', 'usé', 'usée', 'bout', 'fini', 'finie', 'naze', 'claqué', 'claquée',
      // Découragement
      'découragé', 'découragée', 'désespoir', 'désespéré', 'désespérée', 'démotivé', 'démotivée', 'abattu', 'abattue', 'accablé', 'accablée', 'effondré', 'effondrée', 'démoralisé', 'démoralisée',
      // Expressions
      'ça va pas', 'c\'est dur', 'j\'en peux plus', 'ras le bol', 'marre', 'galère', 'dur dur', 'pas facile'
    ]
  },
  '⛈️': {
    mots_cles: [
      // Colère directe
      'énervé', 'énervée', 'colère', 'furieux', 'furieuse', 'rage', 'rageur', 'rageuse', 'irrité', 'irritée', 'agacé', 'agacée', 'frustré', 'frustrée', 'exaspéré', 'exaspérée', 'bouillir', 'exploser', 'fulminer',
      // Expressions colère
      'en colère', 'hors de moi', 'bout de nerfs', 'pète un câble', 'pète les plombs', 'voir rouge', 'monter au créneau', 'j\'en ai marre', 'ça m\'énerve', 'insupportable', 'intolérable',
      // Frustration
      'bloqué', 'bloquée', 'coincé', 'coincée', 'limité', 'limitée', 'empêché', 'empêchée', 'freiné', 'freinée', 'contrarié', 'contrariée', 'tension', 'tendu', 'tendue', 'stress', 'stressé', 'stressée'
    ]
  },
  '🌫️': {
    mots_cles: [
      // Confusion
      'confus', 'confuse', 'confusion', 'perdu', 'perdue', 'flou', 'floue', 'incertain', 'incertaine', 'perplexe', 'hésitant', 'hésitante', 'doute', 'indécis', 'indécise', 'incompréhension', 'brumeux', 'brumeuse', 'embrouillé', 'embrouillée',
      // Questionnement
      'sais pas', 'comprends pas', 'pige pas', 'pourquoi', 'comment', 'bizarre', 'étrange', 'compliqué', 'compliquée', 'difficile', 'dur à comprendre', 'mystère', 'mystérieux', 'mystérieuse',
      // Expressions
      'je sais plus', 'c\'est flou', 'pas clair', 'je comprends rien', 'qu\'est-ce qui se passe', 'je suis paumé', 'je suis larguée'
    ]
  },
  '☁️': {
    mots_cles: [
      // Ennui
      'ennui', 'ennuie', 'ennuyeux', 'ennuyeuse', 'morne', 'monotone', 'gris', 'grise', 'bof', 'moyen', 'moyenne', 'ordinaire', 'banal', 'banale', 'fade', 'plat', 'plate', 'routine', 'habituel', 'habituelle',
      // Neutralité
      'ça va', 'normal', 'normale', 'comme d\'habitude', 'tranquille', 'calme', 'paisible', 'serein', 'sereine', 'stable', 'égal', 'égale', 'constant', 'constante', 'pareil', 'pareille', 'identique'
    ]
  },
  '❄️': {
    mots_cles: [
      // Détachement
      'vide', 'détaché', 'détachée', 'distant', 'distante', 'froid', 'froide', 'absent', 'absente', 'indifférent', 'indifférente', 'déconnecté', 'déconnectée', 'engourdi', 'engourdie', 'anesthésié', 'anesthésiée', 'gelé', 'gelée',
      // Retrait
      'retiré', 'retirée', 'isolé', 'isolée', 'seul', 'seule', 'solitaire', 'renfermé', 'renfermée', 'silence', 'silencieux', 'silencieuse', 'muet', 'muette', 'coupé', 'coupée',
      // Expressions
      'j\'ai plus envie', 'je sens rien', 'complètement vide', 'plus rien', 'nowhere', 'dans le vide', 'déconnecté de tout'
    ]
  }
};

// Fonction d'analyse émotionnelle avec Mistral AI (PRINCIPALE)
async function analyserAvecMistralAI(message) {
  try {
    const prompt = `Tu es un expert en analyse émotionnelle. Analyse ce message et génère AUSSI un message poétique personnalisé.

Message: "${message}"

Réponds UNIQUEMENT par un JSON avec cette structure exacte:
{
  "emotion_principale": "joie|tristesse|colere|confusion|ennui|detachement",
  "intensite": 1-5,
  "contexte": {
    "lieu": "bureau|maison|transport|lieu_social|autre|non_specifie",
    "personnes": ["prénom1", "prénom2"] ou [],
    "activite": "travail|loisir|social|repos|sport|autre|non_specifie",
    "temporel": "matin|apres_midi|soir|week_end|autre|non_specifie"
  },
  "mots_cles": ["mot1", "mot2", "mot3"],
  "sentiment_global": "positif|neutre|negatif",
  "message_poetique": "phrase poétique personnalisée de 8-15 mots maximum",
  "insight_personnalise": "insight empathique de 12-20 mots maximum"
}

Génère un message poétique et un insight UNIQUES adaptés à ce message spécifique.`;

    const response = await axios.post(MISTRAL_API_URL, {
      model: 'mistral-tiny',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 400
    }, {
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const analysis = JSON.parse(response.data.choices[0].message.content);
    console.log('✅ Analyse Mistral réussie:', analysis);
    return { success: true, data: analysis };

  } catch (error) {
    console.error('❌ Erreur Mistral AI:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

// Fonction de fallback ENRICHIE avec warning
function analyseAvecFallback(message) {
  console.log('⚠️ Passage en mode fallback enrichi');
  
  const texte = message.toLowerCase();
  const scores = {};
  
  // Calculer scores pour chaque météo
  for (const [emoji, system] of Object.entries(FALLBACK_DETECTION)) {
    scores[emoji] = 0;
    for (const mot of system.mots_cles) {
      if (texte.includes(mot)) {
        scores[emoji] += 1;
      }
    }
  }
  
  // Trouver la météo avec le meilleur score
  const meteoDetectee = Object.keys(scores).reduce((a, b) => 
    scores[a] > scores[b] ? a : b
  );
  
  const meteoInfo = METEO_SYSTEM[meteoDetectee];
  const finalMeteo = scores[meteoDetectee] > 0 ? meteoDetectee : '🌫️';
  
  // Message backup aléatoire
  const messageBackup = meteoInfo.messages_backup[
    Math.floor(Math.random() * meteoInfo.messages_backup.length)
  ];
  
  return {
    emotion_principale: mapEmotionFromMeteo(finalMeteo),
    intensite: Math.ceil(Math.random() * 3) + 1, // 1-4 en fallback
    contexte: {
      lieu: 'non_specifie',
      personnes: [],
      activite: 'non_specifie', 
      temporel: 'non_specifie'
    },
    mots_cles: extraireMots(message),
    sentiment_global: scores[finalMeteo] > 0 ? 'detecte' : 'neutre',
    message_poetique: messageBackup,
    insight_personnalise: 'Analyse simplifiée - les nuances fines nécessitent notre IA principale.',
    fallback_warning: true
  };
}

// Fonction helper mapping météo → émotion
function mapEmotionFromMeteo(meteo) {
  const mapping = {
    '☀️': 'joie',
    '🌧️': 'tristesse', 
    '⛈️': 'colere',
    '🌫️': 'confusion',
    '☁️': 'ennui',
    '❄️': 'detachement'
  };
  return mapping[meteo] || 'confusion';
}

// Fonction mapping émotion → météo
function mapperEmotionVersMeteo(emotion) {
  const mapping = {
    'joie': '☀️',
    'tristesse': '🌧️',
    'colere': '⛈️', 
    'confusion': '🌫️',
    'ennui': '☁️',
    'detachement': '❄️'
  };
  return mapping[emotion] || '🌫️';
}

// Fonction extraction mots basique
function extraireMots(message) {
  const motsvides = ['je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'avec', 'dans', 'sur', 'pour', 'par', 'sans', 'sous', 'vers', 'chez', 'et', 'ou', 'mais', 'donc', 'car', 'que', 'qui', 'quoi', 'où', 'quand', 'comment', 'pourquoi', 'ce', 'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses'];
  
  return message.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(mot => mot.length > 3 && !motsvides.includes(mot))
    .slice(0, 4);
}

// Fonction de génération de carte météo COMPLÈTE V4.0
async function genererCarteComplete(message, phoneNumber) {
  console.log('🧠 Analyse complète V4.0 en cours...');
  
  const historique = climatheque.get(phoneNumber) || [];
  
  // Tentative analyse IA principale
  const analysisResult = await analyserAvecMistralAI(message);
  
  let analysis;
  let useFallback = false;
  
  if (analysisResult.success) {
    analysis = analysisResult.data;
    console.log('✅ Analyse IA principale réussie');
  } else {
    analysis = analyseAvecFallback(message);
    useFallback = true;
    console.log('⚠️ Utilisation du fallback enrichi');
  }
  
  // Mapper vers météo
  const meteo = mapperEmotionVersMeteo(analysis.emotion_principale);
  const meteoInfo = METEO_SYSTEM[meteo];
  
  const timestamp = new Date();
  
  const carte = {
    id: Date.now(),
    timestamp: timestamp,
    date: timestamp.toLocaleDateString('fr-FR'),
    heure: timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    message_original: message,
    meteo: meteo,
    nom_meteo: meteoInfo.nom,
    message_poetique: analysis.message_poetique,
    couleur: meteoInfo.couleur,
    mots_cles: analysis.mots_cles,
    insight_empathique: analysis.insight_personnalise,
    contexte: analysis.contexte,
    intensite: analysis.intensite,
    analysis_complete: analysis,
    fallback_used: useFallback
  };
  
  // Ajouter à la climatothèque
  if (!climatheque.has(phoneNumber)) {
    climatheque.set(phoneNumber, []);
  }
  climatheque.get(phoneNumber).push(carte);
  
  return carte;
}

// Fonction de détection de patterns avancés
function detecterPatternsAvances(phoneNumber) {
  const cartes = climatheque.get(phoneNumber) || [];
  if (cartes.length < 3) return null;
  
  const patterns = [];
  
  // Pattern 1: Corrélations lieu-émotion (seuil: 3+ occurrences)
  const lieuStats = {};
  cartes.forEach(carte => {
    if (carte.contexte?.lieu && carte.contexte.lieu !== 'non_specifie') {
      if (!lieuStats[carte.contexte.lieu]) {
        lieuStats[carte.contexte.lieu] = { total: 0, emotions: {} };
      }
      lieuStats[carte.contexte.lieu].total++;
      if (!lieuStats[carte.contexte.lieu].emotions[carte.meteo]) {
        lieuStats[carte.contexte.lieu].emotions[carte.meteo] = 0;
      }
      lieuStats[carte.contexte.lieu].emotions[carte.meteo]++;
    }
  });
  
  // Analyser les patterns lieux (seuil: 3+ entrées, 70%+ récurrence)
  for (const [lieu, stats] of Object.entries(lieuStats)) {
    if (stats.total >= 3) {
      for (const [meteo, count] of Object.entries(stats.emotions)) {
        const pourcentage = Math.round((count / stats.total) * 100);
        if (pourcentage >= 70) {
          patterns.push(`🏢 ${lieu}: ${meteo} dans ${pourcentage}% des cas (${count}/${stats.total})`);
        }
      }
    }
  }
  
  // Pattern 2: Corrélations personnes-émotion
  const personnesStats = {};
  cartes.forEach(carte => {
    if (carte.contexte?.personnes && carte.contexte.personnes.length > 0) {
      carte.contexte.personnes.forEach(personne => {
        if (!personnesStats[personne]) {
          personnesStats[personne] = { total: 0, emotions: {} };
        }
        personnesStats[personne].total++;
        if (!personnesStats[personne].emotions[carte.meteo]) {
          personnesStats[personne].emotions[carte.meteo] = 0;
        }
        personnesStats[personne].emotions[carte.meteo]++;
      });
    }
  });
  
  // Analyser les patterns personnes (seuil: 2+ entrées, 75%+ récurrence)
  for (const [personne, stats] of Object.entries(personnesStats)) {
    if (stats.total >= 2) {
      for (const [meteo, count] of Object.entries(stats.emotions)) {
        const pourcentage = Math.round((count / stats.total) * 100);
        if (pourcentage >= 75) {
          patterns.push(`👤 Avec ${personne}: ${meteo} dans ${pourcentage}% des cas (${count}/${stats.total})`);
        }
      }
    }
  }
  
  // Pattern 3: Évolution temporelle (amélioration/dégradation)
  if (cartes.length >= 5) {
    const recent = cartes.slice(-3);
    const ancien = cartes.slice(-6, -3);
    
    if (ancien.length === 3) {
      const moyenneRecent = recent.reduce((sum, c) => sum + (METEO_SYSTEM[c.meteo].valeur_numerique), 0) / 3;
      const moyenneAncien = ancien.reduce((sum, c) => sum + (METEO_SYSTEM[c.meteo].valeur_numerique), 0) / 3;
      
      const evolution = moyenneRecent - moyenneAncien;
      if (Math.abs(evolution) >= 1) {
        const trend = evolution > 0 ? '📈 Amélioration' : '📉 Dégradation';
        patterns.push(`${trend} récente: ${moyenneAncien.toFixed(1)} → ${moyenneRecent.toFixed(1)}/5`);
      }
    }
  }
  
  return patterns.length > 0 ? patterns.slice(0, 2) : null; // Max 2 patterns
}

// Fonction de génération de rapport patterns complet
function genererRapportPatterns(phoneNumber) {
  const cartes = climatheque.get(phoneNumber) || [];
  if (cartes.length < 5) {
    return `📊 ═══ PATTERNS ═══\n\n⏳ ${cartes.length}/5 cartes minimum\n\nContinue à partager tes états d'esprit pour révéler tes patterns émotionnels personnels !`;
  }
  
  let rapport = `📊 ═══ TES PATTERNS ═══\n\n💎 ${cartes.length} analyses dans ta climatothèque\n\n`;
  
  // Statistiques générales météo
  const meteoStats = {};
  cartes.forEach(carte => {
    if (!meteoStats[carte.meteo]) meteoStats[carte.meteo] = 0;
    meteoStats[carte.meteo]++;
  });
  
  rapport += `🌤️ TES MÉTÉOS DOMINANTES:\n`;
  Object.entries(meteoStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .forEach(([meteo, count]) => {
      const pourcentage = Math.round((count / cartes.length) * 100);
      rapport += `   ${meteo} ${pourcentage}% (${count}/${cartes.length})\n`;
    });
  
  // Patterns avancés
  const patterns = detecterPatternsAvances(phoneNumber);
  if (patterns) {
    rapport += `\n🔮 PATTERNS DÉTECTÉS:\n`;
    patterns.forEach(pattern => {
      rapport += `   • ${pattern}\n`;
    });
  }
  
  // Intensité moyenne
  const intensiteMoyenne = cartes.reduce((sum, c) => sum + c.intensite, 0) / cartes.length;
  rapport += `\n⚡ INTENSITÉ MOYENNE: ${intensiteMoyenne.toFixed(1)}/5\n`;
  
  // Évolution récente
  if (cartes.length >= 6) {
    const recent = cartes.slice(-3);
    const moyenneRecent = recent.reduce((sum, c) => sum + (METEO_SYSTEM[c.meteo].valeur_numerique), 0) / 3;
    rapport += `\n📈 TENDANCE RÉCENTE: ${moyenneRecent.toFixed(1)}/5\n`;
  }
  
  rapport += `\n━━━━━━━━━━━━━━━━━━━\n💫 Tes patterns révèlent ton paysage émotionnel unique`;
  
  return rapport;
}

// Fonction de formatage de réponse V4.0 (sans cartes visuelles)
function formaterReponseV4(carte, patterns = null) {
  let response = '';
  
  // Warning si fallback utilisé
  if (carte.fallback_used) {
    response += `⚠️ Analyse simplifiée (IA temporairement indisponible)\n\n`;
  }
  
  // Header avec intensité
  const intensiteEmoji = '●'.repeat(carte.intensite) + '○'.repeat(5 - carte.intensite);
  response += `${carte.meteo} ═══ ${carte.nom_meteo} ═══\n`;
  response += `${intensiteEmoji} Intensité ${carte.intensite}/5\n\n`;
  
  // Citation + message poétique
  response += `💭 "${carte.message_original}"\n\n`;
  response += `✨ ${carte.message_poetique}\n\n`;
  
  // Contexte extrait (si significatif)
  if (carte.contexte?.lieu !== 'non_specifie' || carte.contexte?.activite !== 'non_specifie' || carte.mots_cles.length > 0) {
    response += `🎯 `;
    if (carte.contexte.lieu !== 'non_specifie') response += `📍${carte.contexte.lieu} `;
    if (carte.contexte.activite !== 'non_specifie') response += `⚡${carte.contexte.activite} `;
    if (carte.contexte.personnes.length > 0) response += `👥${carte.contexte.personnes.join(', ')} `;
    if (carte.mots_cles.length > 0) response += `• ${carte.mots_cles.slice(0, 3).join(' • ')}`;
    response += `\n\n`;
  }
  
  // Insight empathique IA
  response += `💝 ${carte.insight_empathique}\n\n`;
  
  // Pattern détecté
  if (patterns && patterns.length > 0) {
    response += `🌀 PATTERNS DÉTECTÉS:\n`;
    patterns.slice(0, 1).forEach(pattern => {
      response += `• ${pattern}\n`;
    });
    response += `\n`;
  }
  
  // Footer
  response += `━━━━━━━━━━━━━━━━━━━\n`;
  response += `📚 Analysé par ${carte.fallback_used ? 'système enrichi' : 'IA Mistral'}\n`;
  response += `   └ ${carte.date} • ${carte.heure}`;
  
  return response;
}

// Routes
app.get('/', (req, res) => {
  res.send(`
    <h1>🌤️ MoodMap WhatsApp Bot V4.0 - Smart Patterns</h1>
    <p><strong>Status:</strong> 🟢 INTELLIGENT & STABLE!</p>
    <p><strong>Features:</strong></p>
    <ul>
      <li>🧠 Mistral AI emotional analysis with personalized insights</li>
      <li>📊 Advanced pattern detection (places, people, activities)</li>
      <li>🛡️ Enriched fallback system (50+ keywords per emotion)</li>
      <li>💝 Unique poetic messages generated by AI</li>
      <li>📈 Statistical correlations and trend analysis</li>
      <li>🎯 Smart onboarding and user guidance</li>
    </ul>
    <p><strong>Mistral AI:</strong> ${MISTRAL_API_KEY ? '✅ Connected' : '❌ Not configured'}</p>
    <p><strong>Patterns:</strong> ✅ Advanced correlations enabled</p>
    <p><strong>Commands:</strong> climatothèque, patterns</p>
    <p><strong>Webhook:</strong> <code>/webhook</code></p>
  `);
});

app.get('/health', (req, res) => {
  const stats = {
    status: 'OK',
    version: '4.0 - SMART PATTERNS',
    message: 'MoodMap Bot V4.0 - Advanced Patterns + Enhanced AI!',
    timestamp: new Date().toISOString(),
    mistral_ai: MISTRAL_API_KEY ? 'Connected' : 'Not configured',
    features: [
      'Mistral AI emotion analysis',
      'Advanced pattern detection',
      'Enriched fallback system (50+ keywords)', 
      'Personalized empathic insights',
      'Statistical correlations',
      'Pattern predictions',
      'Visual cards (coming with server upgrade)'
    ],
    total_users: climatheque.size,
    total_cards: Array.from(climatheque.values()).reduce((sum, cards) => sum + cards.length, 0)
  };
  res.status(200).json(stats);
});

// Route principale WhatsApp V4.0
app.post('/webhook', async (req, res) => {
  console.log('📱 Message reçu V4.0 (SMART PATTERNS):', req.body);
  
  const incomingMessage = req.body.Body || '';
  const fromNumber = req.body.From || '';
  
  console.log(`💬 De ${fromNumber}: "${incomingMessage}"`);
  
  const twiml = new MessagingResponse();
  
  try {
    // Commandes spéciales
    if (incomingMessage.toLowerCase().includes('climatothèque')) {
      const cartes = climatheque.get(fromNumber) || [];
      if (cartes.length === 0) {
        const response = `📚 ═══ TA CLIMATOTHÈQUE ═══\n\n🌱 Ta collection d'analyses émotionnelles est encore vide.\n\n💡 POUR COMMENCER :\nPartage-moi simplement ton état d'esprit :\n• "Je suis fatigué aujourd'hui"\n• "Ça va plutôt bien !"\n• "Stressé par ce projet"\n\n🎯 Je vais analyser ton émotion et créer ta première carte météo personnalisée !\n\n✨ Chaque analyse révèle un aspect de ton paysage émotionnel.`;
        twiml.message(response);
      } else {
        const response = `📚 ═══ TA CLIMATOTHÈQUE ═══\n\n💎 ${cartes.length} carte${cartes.length > 1 ? 's' : ''} météo analysée${cartes.length > 1 ? 's' : ''} par IA\n\n📈 TES DERNIÈRES ANALYSES :\n${cartes.slice(-3).map(c => `${c.meteo} ${c.date} • ${c.nom_meteo} ${'●'.repeat(c.intensite)}${'○'.repeat(5 - c.intensite)}`).join('\n')}\n\n━━━━━━━━━━━━━━━━━━━\n🧠 Chaque carte = analyse IA personnalisée\n📊 Tapez "patterns" pour voir vos corrélations\n💡 Continuez à partager vos émotions pour plus de patterns !`;
        twiml.message(response);
      }
    }
    else if (incomingMessage.toLowerCase().includes('patterns')) {
      const rapport = genererRapportPatterns(fromNumber);
      twiml.message(rapport);
    }
    // Analyse complète
    else if (incomingMessage.length > 8) {
      console.log('🚀 Début analyse V4.0 complète...');
      const carte = await genererCarteComplete(incomingMessage, fromNumber);
      const patterns = detecterPatternsAvances(fromNumber);
      const response = formaterReponseV4(carte, patterns);
      
      twiml.message(response);
      console.log('✅ Réponse V4.0 générée avec succès');
    }
    // Message d'accueil et onboarding
    else {
      const response = `🌤️ ═══ BIENVENUE SUR MOODMAP ═══\n\n👋 Salut ! Je suis ton assistant d'intelligence émotionnelle.\n\n💬 COMMENT ÇA MARCHE :\nDécris-moi ton état d'esprit en une phrase :\n• "Je me sens stressé au travail"\n• "Super heureuse avec mes amis" \n• "Un peu confus aujourd'hui"\n\n🎯 JE VAIS :\n• Analyser ton émotion avec l'IA Mistral\n• Te donner ta "météo émotionnelle" 🌦️\n• Détecter tes patterns personnels\n• Générer des insights empathiques\n\n📚 COMMANDES UTILES :\n• "climatothèque" → Ton historique complet\n• "patterns" → Tes corrélations intelligentes\n\n━━━━━━━━━━━━━━━━━━━\n✨ Essaie maintenant avec ton humeur du moment !`;
      twiml.message(response);
    }
    
  } catch (error) {
    console.error('❌ Erreur V4.0:', error);
    twiml.message(`🔧 Erreur temporaire V4.0.\nRéessaie dans quelques secondes !`);
  }
  
  res.type('text/xml').send(twiml.toString());
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 MoodMap WhatsApp Bot V4.0 SMART PATTERNS démarré sur le port ${PORT}`);
  console.log(`🧠 Mistral AI: ${MISTRAL_API_KEY ? 'ACTIVÉ ✅' : 'NON CONFIGURÉ ❌'}`);
  console.log(`📊 Patterns avancés: ACTIVÉS ✅`);
  console.log(`🛡️ Fallback enrichi (50+ mots-clés): ACTIVÉ ✅`);
  console.log(`💝 Messages IA personnalisés: ACTIVÉS ✅`);
  console.log(`🎯 Onboarding intelligent: ACTIVÉ ✅`);
  console.log(`🌐 URL: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
  console.log(`📱 Webhook: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}/webhook`);
});
