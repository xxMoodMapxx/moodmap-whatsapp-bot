// MoodMap WhatsApp Bot V5.1 RÉVOLUTIONNAIRE 🚀
// SEULEMENT les changements structure + français, MÉTÉOS V5.0 PRÉSERVÉES
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const axios = require('axios');
// const { createCanvas, loadImage } = require('canvas'); // Canvas V5.2

const app = express();
const port = process.env.PORT || 10000;

app.use(bodyParser.urlencoded({ extended: false }));

// ===== BASE DE DONNÉES EN MÉMOIRE ULTRA-SOPHISTIQUÉE =====
let userData = {}; // Structure: {userId: {cartes: [], patterns: [], stats: {}, config: {}}}
let globalPatterns = []; // Patterns cross-users pour insights collectifs

// ===== MÉTÉOS ÉMOTIONNELLES (60 TYPES) - V5.0 PRÉSERVÉES =====
const meteos = {
  // FAMILLE SOLEIL (Joie, bonheur, euphorie)
  soleil: [
    { emoji: '🌞', nom: 'Soleil Rayonnant', intensite_min: 7, intensite_max: 9, description: 'Confiance éclatante, fierté assumée', couleur: '#FFA500', messages: ['Cette confiance te va si bien', 'Ton assurance illumine tout autour', 'Cette fierté est légitime et belle'] },
    { emoji: '☀️', nom: 'Soleil Éclatant', intensite_min: 8, intensite_max: 10, description: 'Euphorie pure, bonheur débordant', couleur: '#FFD700', messages: ['Tu rayonnes de bonheur !', 'Cette joie est contagieuse', 'Profite de cet éclat magnifique'] },
    { emoji: '🌅', nom: 'Soleil Levant', intensite_min: 5, intensite_max: 7, description: 'Espoir naissant, optimisme doux', couleur: '#FF6347', messages: ['Un nouveau jour se lève en toi', 'Cet espoir grandit doucement', 'Laisse cette lumière t\'envahir'] },
    { emoji: '🔆', nom: 'Soleil Brillant', intensite_min: 6, intensite_max: 8, description: 'Énergie positive, dynamisme', couleur: '#FF8C00', messages: ['Cette énergie te porte !', 'Ton dynamisme inspire', 'Continue sur cette lancée'] },
    { emoji: '🌟', nom: 'Soleil Stellaire', intensite_min: 9, intensite_max: 10, description: 'Moment magique, transcendance', couleur: '#FFD700', messages: ['Tu touches les étoiles', 'Ce moment est précieux', 'Garde cette magie en toi'] },
    { emoji: '🌤️', nom: 'Soleil Tendre', intensite_min: 4, intensite_max: 6, description: 'Douceur paisible, contentement', couleur: '#F0E68C', messages: ['Cette douceur fait du bien', 'Un moment de paix simple', 'Savoure cette tendresse'] },
    { emoji: '🌈', nom: 'Soleil Arc-en-ciel', intensite_min: 7, intensite_max: 9, description: 'Joie colorée, diversité émotionnelle', couleur: '#FF69B4', messages: ['Toutes les couleurs en toi', 'Ta richesse émotionnelle', 'Cette palette est magnifique'] },
    { emoji: '✨', nom: 'Soleil Scintillant', intensite_min: 6, intensite_max: 8, description: 'Émerveillement, découverte', couleur: '#DDA0DD', messages: ['Tes yeux brillent de curiosité', 'Cette découverte t\'illumine', 'Garde cette étincelle'] },
    { emoji: '🔥', nom: 'Soleil Ardent', intensite_min: 8, intensite_max: 10, description: 'Passion dévorante, intensité', couleur: '#DC143C', messages: ['Cette flamme brûle en toi', 'Ta passion est admirable', 'Laisse ce feu te guider'] },
    { emoji: '💫', nom: 'Soleil Cosmique', intensite_min: 7, intensite_max: 9, description: 'Plénitude universelle, connexion', couleur: '#9370DB', messages: ['Tu es connecté à l\'univers', 'Cette plénitude est rare', 'Tu fais partie du grand tout'] }
  ],

  // FAMILLE NUAGES (États neutres, réflexion, transition)
  nuages: [
    { emoji: '☁️', nom: 'Nuages Blancs', intensite_min: 4, intensite_max: 6, description: 'Tranquillité douce, pensées flottantes', couleur: '#F5F5F5', messages: ['Tes pensées flottent librement', 'Cette tranquillité fait du bien', 'Laisse-toi porter par cette douceur'] },
    { emoji: '⛅', nom: 'Nuages Flottants', intensite_min: 5, intensite_max: 7, description: 'Équilibre délicat, entre deux eaux', couleur: '#D3D3D3', messages: ['Tu navigues entre les émotions', 'Cet équilibre est fragile mais beau', 'Tu cherches ton chemin, c\'est normal'] },
    { emoji: '🌫️', nom: 'Nuages Brumeux', intensite_min: 3, intensite_max: 5, description: 'Confusion douce, introspection', couleur: '#C0C0C0', messages: ['La brume cache parfois la beauté', 'Cette confusion passera', 'Prends le temps de voir clair'] },
    { emoji: '☁️', nom: 'Nuages Gris', intensite_min: 3, intensite_max: 5, description: 'Mélancolie légère, nostalgie', couleur: '#808080', messages: ['Cette mélancolie a sa beauté', 'Les souvenirs te visitent', 'Laisse cette nostalgie s\'écouler'] },
    { emoji: '🌥️', nom: 'Nuages Voilés', intensite_min: 4, intensite_max: 6, description: 'Émotions en sourdine, retenue', couleur: '#A9A9A9', messages: ['Tes émotions sont en sourdine', 'Cette retenue te protège', 'Il est ok de rester discret'] },
    { emoji: '⛈️', nom: 'Nuages Électriques', intensite_min: 6, intensite_max: 8, description: 'Tension créative, énergie contenue', couleur: '#4B0082', messages: ['Cette tension peut créer', 'L\'énergie se concentre en toi', 'Quelque chose se prépare'] },
    { emoji: '🌦️', nom: 'Nuages Variables', intensite_min: 4, intensite_max: 7, description: 'Changement d\'humeur, imprévisibilité', couleur: '#6495ED', messages: ['Tes humeurs changent, c\'est humain', 'Cette variabilité te rend unique', 'Accepte ces oscillations'] },
    { emoji: '🌁', nom: 'Nuages Mystiques', intensite_min: 5, intensite_max: 7, description: 'Mystère intérieur, spiritualité', couleur: '#9932CC', messages: ['Tu explores ton mystère intérieur', 'Cette spiritualité t\'élève', 'Écoute cette voix profonde'] },
    { emoji: '☁️', nom: 'Nuages Cotonneux', intensite_min: 6, intensite_max: 8, description: 'Douceur enveloppante, cocooning', couleur: '#F0F8FF', messages: ['Cette douceur t\'enveloppe', 'Tu as besoin de cocooning', 'Prends soin de toi'] },
    { emoji: '🌊', nom: 'Nuages Océaniques', intensite_min: 5, intensite_max: 7, description: 'Fluidité émotionnelle, vagues intérieures', couleur: '#20B2AA', messages: ['Tes émotions ondulent comme l\'océan', 'Laisse ces vagues t\'emporter', 'Cette fluidité est naturelle'] }
  ],

  // FAMILLE PLUIE (Tristesse, mélancolie, introspection)
  pluie: [
    { emoji: '🌧️', nom: 'Pluie Douce', intensite_min: 3, intensite_max: 5, description: 'Tristesse apaisante, larmes libératrices', couleur: '#4682B4', messages: ['Ces larmes lavent ton âme', 'Pleure, cela fait du bien', 'Cette tristesse est nécessaire'] },
    { emoji: '☔', nom: 'Pluie Battante', intensite_min: 5, intensite_max: 7, description: 'Chagrin intense, besoin de réconfort', couleur: '#191970', messages: ['Ce chagrin est profond mais passager', 'Tu as le droit d\'être triste', 'Laisse couler, puis relève-toi'] },
    { emoji: '🌦️', nom: 'Pluie d\'Été', intensite_min: 4, intensite_max: 6, description: 'Mélancolie nostalgique, douceur-amère', couleur: '#6A5ACD', messages: ['Cette nostalgie a un goût doux-amer', 'Les souvenirs remontent', 'Cette mélancolie passera'] },
    { emoji: '🌧️', nom: 'Pluie Nocturne', intensite_min: 4, intensite_max: 6, description: 'Solitude contemplative, introspection', couleur: '#2F4F4F', messages: ['La nuit révèle tes pensées profondes', 'Cette solitude est riche', 'Dialogue avec toi-même'] },
    { emoji: '💧', nom: 'Pluie de Larmes', intensite_min: 2, intensite_max: 4, description: 'Émotion pure, vulnérabilité', couleur: '#5F9EA0', messages: ['Tes larmes sont précieuses', 'Cette vulnérabilité est courageuse', 'Laisse sortir cette émotion'] },
    { emoji: '🌧️', nom: 'Pluie Purifiante', intensite_min: 3, intensite_max: 5, description: 'Nettoyage émotionnel, renaissance', couleur: '#008B8B', messages: ['Cette pluie lave tes blessures', 'Tu renais après chaque larme', 'Cette purification est nécessaire'] },
    { emoji: '⛈️', nom: 'Pluie d\'Orage', intensite_min: 6, intensite_max: 8, description: 'Tristesse mêlée de colère', couleur: '#483D8B', messages: ['Colère et tristesse se mélangent', 'Ces émotions sont légitimes', 'L\'orage passera, garde espoir'] },
    { emoji: '🌧️', nom: 'Pluie Mélancolique', intensite_min: 2, intensite_max: 4, description: 'Vague à l\'âme, spleen', couleur: '#696969', messages: ['Ce spleen fait partie de toi', 'Cette vague à l\'âme passera', 'Tu n\'es pas seul dans cette brume'] },
    { emoji: '🌦️', nom: 'Pluie Arc-en-ciel', intensite_min: 4, intensite_max: 6, description: 'Espoir dans la tristesse', couleur: '#9370DB', messages: ['Un arc-en-ciel après la pluie', 'L\'espoir renaît doucement', 'Cette beauté dans la peine'] },
    { emoji: '💧', nom: 'Pluie Cristalline', intensite_min: 3, intensite_max: 5, description: 'Pureté dans la souffrance', couleur: '#87CEEB', messages: ['Tes larmes sont cristallines', 'Cette pureté dans la douleur', 'Tu ressors plus fort de l\'épreuve'] }
  ],

  // FAMILLE ORAGE (Colère, irritation, conflit)
  orage: [
    { emoji: '⛈️', nom: 'Orage Grondant', intensite_min: 6, intensite_max: 8, description: 'Colère qui monte, tension électrique', couleur: '#8B0000', messages: ['Cette colère gronde en toi', 'Laisse passer cet orage', 'Ta tempête intérieure s\'apaisera'] },
    { emoji: '🌩️', nom: 'Orage Électrique', intensite_min: 7, intensite_max: 9, description: 'Rage pure, décharge émotionnelle', couleur: '#DC143C', messages: ['Cette rage a besoin de sortir', 'Évacue cette électricité', 'Channel cette énergie ailleurs'] },
    { emoji: '⚡', nom: 'Orage Foudroyant', intensite_min: 8, intensite_max: 10, description: 'Colère explosive, rupture', couleur: '#B22222', messages: ['Cette foudre te traverse', 'Attention à ne pas tout casser', 'Cette colère cache une blessure'] },
    { emoji: '🌪️', nom: 'Orage Tornarde', intensite_min: 7, intensite_max: 9, description: 'Chaos émotionnel, perte de contrôle', couleur: '#800000', messages: ['Cette tornade t\'emporte', 'Trouve ton centre dans le chaos', 'Cet ouragan passera'] },
    { emoji: '🔥', nom: 'Orage de Feu', intensite_min: 8, intensite_max: 10, description: 'Fureur ardente, destruction créatrice', couleur: '#FF4500', messages: ['Cette fureur brûle tout', 'Du feu peut naître du nouveau', 'Channel cette flamme'] },
    { emoji: '⛈️', nom: 'Orage Noir', intensite_min: 6, intensite_max: 8, description: 'Colère sourde, rancœur', couleur: '#2F2F2F', messages: ['Cette colère couve en silence', 'N\'entretiens pas cette rancœur', 'Libère-toi de ce poids'] },
    { emoji: '🌩️', nom: 'Orage Volcanique', intensite_min: 7, intensite_max: 9, description: 'Éruption émotionnelle, longtemps contenue', couleur: '#A0522D', messages: ['Trop longtemps contenu, ça explose', 'Cette éruption était inévitable', 'Laisse sortir cette lave'] },
    { emoji: '⚡', nom: 'Orage Stroboscopique', intensite_min: 6, intensite_max: 8, description: 'Colère intermittente, flashs d\'irritation', couleur: '#FF6347', messages: ['Ces flashs de colère te surprennent', 'Observe ces pics d\'irritation', 'Trouve le pattern de ta colère'] },
    { emoji: '🌪️', nom: 'Orage Cyclonique', intensite_min: 8, intensite_max: 10, description: 'Rage totale, destruction massive', couleur: '#8B008B', messages: ['Ce cyclone détruit tout sur son passage', 'Protège ce qui t\'est cher', 'Cette tempête finira par s\'épuiser'] },
    { emoji: '⛈️', nom: 'Orage Purificateur', intensite_min: 5, intensite_max: 7, description: 'Colère saine, nettoyage nécessaire', couleur: '#4169E1', messages: ['Cette colère est juste et nécessaire', 'Elle nettoie ce qui doit partir', 'Après l\'orage, l\'air est plus pur'] }
  ],

  // FAMILLE BROUILLARD (Confusion, incertitude, flou)
  brouillard: [
    { emoji: '🌫️', nom: 'Brouillard Épais', intensite_min: 3, intensite_max: 5, description: 'Confusion totale, perte de repères', couleur: '#708090', messages: ['Ce brouillard cache le chemin', 'Avance doucement, la vue reviendra', 'Cette confusion est temporaire'] },
    { emoji: '🌁', nom: 'Brouillard Matinal', intensite_min: 4, intensite_max: 6, description: 'Incertitude douce, réveil progressif', couleur: '#B0C4DE', messages: ['Comme au petit matin, tout s\'éclaircit', 'Laisse-toi le temps de voir clair', 'Cette brume se lèvera'] },
    { emoji: '🌫️', nom: 'Brouillard Mystique', intensite_min: 5, intensite_max: 7, description: 'Mystère fascinant, exploration', couleur: '#9370DB', messages: ['Ce mystère t\'intrigue', 'Explore cette zone d\'ombre', 'Parfois le flou révèle l\'essentiel'] },
    { emoji: '☁️', nom: 'Brouillard Mental', intensite_min: 2, intensite_max: 4, description: 'Fatigue cognitive, surcharge', couleur: '#A9A9A9', messages: ['Ton esprit a besoin de repos', 'Cette surcharge va passer', 'Fais une pause, respire'] },
    { emoji: '🌁', nom: 'Brouillard Océanique', intensite_min: 4, intensite_max: 6, description: 'Fluidité incertaine, navigation à vue', couleur: '#4682B4', messages: ['Tu navigues à vue', 'Fais confiance à ton instinct', 'L\'océan révélera sa route'] },
    { emoji: '🌫️', nom: 'Brouillard Doré', intensite_min: 5, intensite_max: 7, description: 'Confusion créative, gestation', couleur: '#DAA520', messages: ['Dans ce flou, quelque chose germe', 'Cette confusion est créative', 'Laisse mûrir cette idée floue'] },
    { emoji: '☁️', nom: 'Brouillard Léger', intensite_min: 6, intensite_max: 8, description: 'Doute passager, questionnement', couleur: '#E6E6FA', messages: ['Ce doute passager t\'enrichit', 'Questionner est sain', 'Cette incertitude mène à la sagesse'] },
    { emoji: '🌁', nom: 'Brouillard Profond', intensite_min: 2, intensite_max: 4, description: 'Perte de sens, désorientation', couleur: '#2F4F4F', messages: ['Tu cherches ton sens', 'Cette désorientation passera', 'Parfois se perdre aide à se trouver'] },
    { emoji: '🌫️', nom: 'Brouillard Soyeux', intensite_min: 5, intensite_max: 7, description: 'Rêverie douce, pensée flottante', couleur: '#F0F8FF', messages: ['Tes pensées flottent comme de la soie', 'Cette rêverie fait du bien', 'Laisse-toi porter par cette douceur'] },
    { emoji: '☁️', nom: 'Brouillard Irisé', intensite_min: 6, intensite_max: 8, description: 'Confusion multicolore, richesse du flou', couleur: '#DDA0DD', messages: ['Ce flou révèle mille nuances', 'Ta confusion est riche en possibles', 'Dans ce brouillard, tout est possible'] }
  ],

  // FAMILLE NEIGE (Calme, pureté, silence intérieur)
  neige: [
    { emoji: '❄️', nom: 'Neige Cristalline', intensite_min: 7, intensite_max: 9, description: 'Pureté absolue, clarté parfaite', couleur: '#F0F8FF', messages: ['Cette pureté te ressource', 'Ton cœur est cristallin', 'Cette clarté illumine tout'] },
    { emoji: '🌨️', nom: 'Neige Dansante', intensite_min: 6, intensite_max: 8, description: 'Légèreté joyeuse, magie hivernale', couleur: '#FFFAFA', messages: ['Ces flocons dansent en toi', 'Cette légèreté t\'élève', 'La magie opère doucement'] },
    { emoji: '☃️', nom: 'Neige Playful', intensite_min: 6, intensite_max: 8, description: 'Joie enfantine, innocence retrouvée', couleur: '#F5F5F5', messages: ['Ton âme d\'enfant ressort', 'Cette innocence te fait du bien', 'Joue avec cette légèreté'] },
    { emoji: '🏔️', nom: 'Neige Majestueuse', intensite_min: 8, intensite_max: 10, description: 'Grandeur sereine, élévation spirituelle', couleur: '#E0E0E0', messages: ['Cette grandeur t\'habite', 'Tu touches les sommets', 'Cette élévation est méritée'] },
    { emoji: '❄️', nom: 'Neige Silencieuse', intensite_min: 7, intensite_max: 9, description: 'Paix profonde, silence intérieur', couleur: '#F8F8FF', messages: ['Ce silence est précieux', 'Ton âme trouve sa paix', 'Dans ce calme, tout s\'apaise'] },
    { emoji: '🌨️', nom: 'Neige Poudrée', intensite_min: 5, intensite_max: 7, description: 'Douceur veloutée, cocooning ultime', couleur: '#FFFEF7', messages: ['Cette douceur t\'enveloppe', 'Tu es dans un cocon de bien-être', 'Savoure cette tendresse'] },
    { emoji: '❄️', nom: 'Neige Étincelante', intensite_min: 8, intensite_max: 10, description: 'Beauté éblouissante, perfection', couleur: '#F0FFFF', messages: ['Tu étincelles de beauté', 'Cette perfection te ressemble', 'Ton éclat illumine le monde'] },
    { emoji: '🌨️', nom: 'Neige Hypnotique', intensite_min: 6, intensite_max: 8, description: 'Méditation naturelle, transe douce', couleur: '#FAFAFA', messages: ['Tu entres en méditation', 'Cette transe apaise tout', 'Laisse-toi hypnotiser par la beauté'] },
    { emoji: '☃️', nom: 'Neige Complice', intensite_min: 7, intensite_max: 9, description: 'Complicité chaleureuse, intimité', couleur: '#F7F7F7', messages: ['Cette complicité réchauffe', 'L\'intimité naît dans le froid', 'Vous vous comprenez sans mots'] },
    { emoji: '❄️', nom: 'Neige Éternelle', intensite_min: 9, intensite_max: 10, description: 'Sérénité infinie, temps suspendu', couleur: '#FFFFF0', messages: ['Le temps s\'arrête pour toi', 'Cette sérénité est infinie', 'Tu touches l\'éternité'] }
  ]
};

// ===== CONFIGURATION UTILISATEUR PAR DÉFAUT =====
const defaultUserConfig = {
  notifications: {
    nouveaux_patterns: true,
    resumes_hebdo: true,
    insights_contextuels: true,
    frequence_max: 2 // par semaine
  },
  seuils_patterns: {
    min_occurrences: 5,
    min_confidence: 80, // pourcentage
    types_actifs: ['temporels', 'relationnels', 'contextuels', 'multi_dimensionnels']
  },
  preferences: {
    ton_reponses: 'empathique', // empathique, analytique, motivant
    longueur_messages: 'normal' // court, normal, detaille
  }
};

// ===== SYSTÈME DE PATTERNS ULTRA-SOPHISTIQUÉ =====
class PatternDetector {
  constructor() {
    this.patterns = {
      temporels: [],
      relationnels: [],
      contextuels: [],
      multi_dimensionnels: []
    };
  }

  // Détection patterns temporels (jour, heure, période)
  detectTemporalPatterns(cartes, userId) {
    const patterns = [];
    
    // Patterns par jour de la semaine
    const joursData = {};
    cartes.forEach(carte => {
      const jour = this.getJourSemaine(carte.timestamp);
      if (!joursData[jour]) joursData[jour] = [];
      joursData[jour].push(carte);
    });

    Object.keys(joursData).forEach(jour => {
      const cartesJour = joursData[jour];
      if (cartesJour.length >= 5) {
        const emotionsPositives = cartesJour.filter(c => c.intensite >= 7).length;
        const pourcentagePositif = (emotionsPositives / cartesJour.length) * 100;
        
        patterns.push({
          type: 'temporel',
          dimension: 'jour_semaine',
          valeur: jour,
          occurrences: cartesJour.length,
          confidence: Math.min(95, (cartesJour.length / 10) * 100),
          revelation: `${jour} : ${Math.round(pourcentagePositif)}% émotions positives`,
          impact: pourcentagePositif < 40 ? 'négatif' : pourcentagePositif > 70 ? 'positif' : 'neutre',
          actionnable: pourcentagePositif < 40 ? `Évite les décisions importantes le ${jour}` : `Profite de ta bonne énergie du ${jour}`
        });
      }
    });

    // Patterns par tranche horaire
    const heuresData = {};
    cartes.forEach(carte => {
      const heure = this.getTrancheheure(carte.timestamp);
      if (!heuresData[heure]) heuresData[heure] = [];
      heuresData[heure].push(carte);
    });

    Object.keys(heuresData).forEach(tranche => {
      const cartesHeure = heuresData[tranche];
      if (cartesHeure.length >= 5) {
        const emotionsPositives = cartesHeure.filter(c => c.intensite >= 7).length;
        const pourcentagePositif = (emotionsPositives / cartesHeure.length) * 100;
        
        patterns.push({
          type: 'temporel',
          dimension: 'tranche_heure',
          valeur: tranche,
          occurrences: cartesHeure.length,
          confidence: Math.min(95, (cartesHeure.length / 8) * 100),
          revelation: `${tranche} : ${Math.round(pourcentagePositif)}% émotions positives`,
          impact: pourcentagePositif < 40 ? 'négatif' : pourcentagePositif > 70 ? 'positif' : 'neutre'
        });
      }
    });

    return patterns;
  }

  // Détection patterns relationnels
  detectRelationalPatterns(cartes, userId) {
    const patterns = [];
    const personnesData = {};

    cartes.forEach(carte => {
      if (carte.contexte.personnes && carte.contexte.personnes.length > 0) {
        carte.contexte.personnes.forEach(personne => {
          if (!personnesData[personne]) personnesData[personne] = [];
          personnesData[personne].push(carte);
        });
      }
    });

    Object.keys(personnesData).forEach(personne => {
      const cartesPersonne = personnesData[personne];
      if (cartesPersonne.length >= 5) {
        const intensiteMoyenne = cartesPersonne.reduce((sum, c) => sum + c.intensite, 0) / cartesPersonne.length;
        const emotionsNegatives = cartesPersonne.filter(c => c.intensite <= 4).length;
        const pourcentageNegatif = (emotionsNegatives / cartesPersonne.length) * 100;
        
        const impact = pourcentageNegatif > 60 ? 'toxique' : pourcentageNegatif < 20 ? 'energisant' : 'neutre';
        
        patterns.push({
          type: 'relationnel',
          dimension: 'personne',
          valeur: personne,
          occurrences: cartesPersonne.length,
          confidence: Math.min(95, (cartesPersonne.length / 8) * 100),
          revelation: `${personne} : ${impact === 'toxique' ? 'Impact négatif' : impact === 'energisant' ? 'Impact positif' : 'Impact neutre'} (${Math.round(pourcentageNegatif)}% émotions négatives)`,
          impact: impact,
          intensite_moyenne: Math.round(intensiteMoyenne * 10) / 10,
          actionnable: impact === 'toxique' ? `Limite le temps avec ${personne}` : impact === 'energisant' ? `Passe plus de temps avec ${personne}` : null
        });
      }
    });

    return patterns;
  }

  // Détection patterns contextuels (lieux, activités)
  detectContextualPatterns(cartes, userId) {
    const patterns = [];
    
    // Patterns par lieu
    const lieuxData = {};
    cartes.forEach(carte => {
      if (carte.contexte.lieu) {
        if (!lieuxData[carte.contexte.lieu]) lieuxData[carte.contexte.lieu] = [];
        lieuxData[carte.contexte.lieu].push(carte);
      }
    });

    Object.keys(lieuxData).forEach(lieu => {
      const cartesLieu = lieuxData[lieu];
      if (cartesLieu.length >= 5) {
        const emotionsPositives = cartesLieu.filter(c => c.intensite >= 7).length;
        const pourcentagePositif = (emotionsPositives / cartesLieu.length) * 100;
        
        patterns.push({
          type: 'contextuel',
          dimension: 'lieu',
          valeur: lieu,
          occurrences: cartesLieu.length,
          confidence: Math.min(95, (cartesLieu.length / 8) * 100),
          revelation: `${lieu} : ${Math.round(pourcentagePositif)}% émotions positives`,
          impact: pourcentagePositif < 40 ? 'négatif' : pourcentagePositif > 70 ? 'positif' : 'neutre',
          actionnable: pourcentagePositif > 80 ? `Passe plus de temps ${lieu}` : pourcentagePositif < 30 ? `Évite ${lieu} quand possible` : null
        });
      }
    });

    return patterns;
  }

  // Détection patterns multi-dimensionnels (corrélations complexes)
  detectMultiDimensionalPatterns(cartes, userId) {
    const patterns = [];
    const combinaisons = {};

    cartes.forEach(carte => {
      const jour = this.getJourSemaine(carte.timestamp);
      const heure = this.getTrancheheure(carte.timestamp);
      const lieu = carte.contexte.lieu || 'non_specifie';
      const personnes = carte.contexte.personnes || [];

      // Combinaisons jour + lieu
      const combJourLieu = `${jour}+${lieu}`;
      if (!combinaisons[combJourLieu]) combinaisons[combJourLieu] = [];
      combinaisons[combJourLieu].push(carte);

      // Combinaisons jour + heure + lieu (si plus de 3 cartes)
      if (cartes.length > 15) {
        const combComplexe = `${jour}+${heure}+${lieu}`;
        if (!combinaisons[combComplexe]) combinaisons[combComplexe] = [];
        combinaisons[combComplexe].push(carte);
      }

      // Combinaisons avec personnes
      personnes.forEach(personne => {
        const combPersonneLieu = `${personne}+${lieu}`;
        if (!combinaisons[combPersonneLieu]) combinaisons[combPersonneLieu] = [];
        combinaisons[combPersonneLieu].push(carte);

        const combPersonneJour = `${personne}+${jour}`;
        if (!combinaisons[combPersonneJour]) combinaisons[combPersonneJour] = [];
        combinaisons[combPersonneJour].push(carte);
      });
    });

    Object.keys(combinaisons).forEach(combo => {
      const cartesCombo = combinaisons[combo];
      if (cartesCombo.length >= 5) {
        const intensiteMoyenne = cartesCombo.reduce((sum, c) => sum + c.intensite, 0) / cartesCombo.length;
        const emotionsExtreme = cartesCombo.filter(c => c.intensite <= 3 || c.intensite >= 8).length;
        const pourcentageExtreme = (emotionsExtreme / cartesCombo.length) * 100;
        
        if (pourcentageExtreme > 70) { // Pattern significatif
          patterns.push({
            type: 'multi_dimensionnel',
            dimension: 'combinaison',
            valeur: combo,
            occurrences: cartesCombo.length,
            confidence: Math.min(95, (cartesCombo.length / 6) * 100),
            revelation: this.generateMultiDimensionalRevelation(combo, intensiteMoyenne, cartesCombo),
            impact: intensiteMoyenne < 4 ? 'négatif' : intensiteMoyenne > 7 ? 'positif' : 'neutre',
            intensite_moyenne: Math.round(intensiteMoyenne * 10) / 10,
            formule: combo.replace(/\+/g, ' + ')
          });
        }
      }
    });

    return patterns.sort((a, b) => b.confidence - a.confidence).slice(0, 5); // Top 5 patterns
  }

  generateMultiDimensionalRevelation(combo, intensite, cartes) {
    const elements = combo.split('+');
    const confidence = Math.round((cartes.length / 6) * 100);
    
    if (intensite >= 8) {
      return `FORMULE BONHEUR : ${elements.join(' + ')} = Euphorie niveau ${Math.round(intensite)} (${cartes.length}/${cartes.length} occurrences • ${Math.min(95, confidence)}% fiabilité)`;
    } else if (intensite <= 3) {
      return `FORMULE TOXIQUE : ${elements.join(' + ')} = Stress niveau ${Math.round(intensite)} (${cartes.length}/${cartes.length} occurrences • ${Math.min(95, confidence)}% fiabilité)`;
    } else {
      return `Habitude détectée : ${elements.join(' + ')} = Émotion niveau ${Math.round(intensite)} (${cartes.length} occurrences)`;
    }
  }

  getJourSemaine(timestamp) {
    const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return jours[new Date(timestamp).getDay()];
  }

  getTrancheheure(timestamp) {
    const heure = new Date(timestamp).getHours();
    if (heure >= 6 && heure < 12) return 'Matin (6h-12h)';
    if (heure >= 12 && heure < 18) return 'Après-midi (12h-18h)';
    if (heure >= 18 && heure < 23) return 'Soir (18h-23h)';
    return 'Nuit (23h-6h)';
  }

  // Méthode principale de détection
  detectAllPatterns(userId) {
    if (!userData[userId] || !userData[userId].cartes) return;
    
    const cartes = userData[userId].cartes;
    if (cartes.length < 5) return; // Pas assez de données

    console.log(`🔍 Détection habitudes pour ${userId} avec ${cartes.length} cartes`);

    const patterns = {
      temporels: this.detectTemporalPatterns(cartes, userId),
      relationnels: this.detectRelationalPatterns(cartes, userId),
      contextuels: this.detectContextualPatterns(cartes, userId),
      multi_dimensionnels: this.detectMultiDimensionalPatterns(cartes, userId)
    };

    // Stocker les nouveaux patterns
    const anciensPatterns = userData[userId].habitudes || [];
    const nouveauxPatterns = [];

    Object.keys(patterns).forEach(type => {
      patterns[type].forEach(pattern => {
        // Vérifier si ce pattern existe déjà
        const existeDejaPattern = anciensPatterns.find(ap => 
          ap.type === pattern.type && 
          ap.dimension === pattern.dimension && 
          ap.valeur === pattern.valeur
        );

        if (!existeDejaPattern && pattern.confidence >= (userData[userId].config?.seuils_patterns?.min_confidence || 80)) {
          nouveauxPatterns.push({
            ...pattern,
            detecte_le: new Date().toISOString(),
            notifie: false
          });
        }
      });
    });

    if (!userData[userId].habitudes) userData[userId].habitudes = [];
    userData[userId].habitudes.push(...nouveauxPatterns);

    console.log(`📊 ${nouveauxPatterns.length} nouvelles habitudes détectées`);
    
    return patterns;
  }
}

// Instance globale du détecteur de patterns
const patternDetector = new PatternDetector();

// ===== SYSTÈME DE NAVIGATION INTELLIGENT =====
class NavigationManager {
  constructor() {
    this.userStates = {}; // État de navigation par utilisateur
  }

  processCommand(userId, message) {
    const command = message.toLowerCase().trim();
    
    // Commandes principales
    if (command === 'journal') return this.handleJournal(userId);
    if (command === 'habitudes') return this.handleHabitudes(userId);
    if (command === 'paramètres' || command === 'parametres') return this.handleParametres(userId);
    if (command === 'aide') return this.handleAide(userId);
    if (command === 'menu') return this.handleMenu(userId);
    
    // Commandes journal
    if (command.startsWith('journal ')) return this.handleJournalSpecific(userId, command);
    
    // Commandes habitudes
    if (command.startsWith('habitudes ')) return this.handleHabitudesSpecific(userId, command);
    
    // Commandes paramètres
    if (command.startsWith('paramètres ') || command.startsWith('parametres ')) return this.handleParametresSpecific(userId, command);
    
    // Mots courts = reset
    if (command.length < 7 && command !== 'bonjour' && command !== 'salut') {
      return this.handleMenu(userId);
    }
    
    return null; // Pas une commande
  }

  handleMenu(userId) {
    return `🌈 MOODMAP - MENU PRINCIPAL

💬 UTILISATION :
Écris naturellement tes émotions pour créer ta météo émotionnelle

📚 CONSULTATION :
• "journal" - Ton historique émotionnel
• "habitudes" - Tes habitudes découvertes

⚙️ PERSONNALISATION :
• "paramètres" - Configure tes notifications  
• "aide" - Guide complet

🎯 Essaie : "journal semaine" ou "habitudes temps"`;
  }

  handleJournal(userId) {
    if (!userData[userId] || !userData[userId].cartes || userData[userId].cartes.length === 0) {
      return `📚 TON JOURNAL EST ENCORE VIDE

Commence par partager tes émotions :
"Je me sens bien ce matin"
"Journée stressante au bureau"

Reviens ensuite consulter ton journal ! 😊`;
    }

    const cartes = userData[userId].cartes;
    const cartesRecentes = cartes.slice(-7); // 7 dernières cartes
    
    let message = `📅 TON JOURNAL (${cartesRecentes.length} dernières cartes)\n\n`;
    
    cartesRecentes.reverse().forEach(carte => {
      const date = new Date(carte.timestamp).toLocaleDateString('fr-FR');
      const heure = new Date(carte.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
      const texteCoupe = carte.message_original.length > 40 ? carte.message_original.substring(0, 40) + '...' : carte.message_original;
      
      message += `${date} • ${carte.meteo.emoji} ${carte.meteo.nom} (${heure})\n`;
      message += `"${texteCoupe}"\n\n`;
    });

    // Stats rapides
    const emotionsPositives = cartesRecentes.filter(c => c.intensite >= 7).length;
    const pourcentagePositif = Math.round((emotionsPositives / cartesRecentes.length) * 100);
    
    message += `📊 Cette période : ${pourcentagePositif}% émotions positives\n\n`;
    message += `🔍 Plus de détails :\n`;
    message += `• "journal semaine" - 7 derniers jours\n`;
    message += `• "journal mois" - 30 derniers jours\n`;
    message += `• "journal soleil" - Tous tes moments joyeux\n`;
    message += `• "journal stats" - Données détaillées`;

    return message;
  }

  handleJournalSpecific(userId, command) {
    const parts = command.split(' ');
    const subCommand = parts[1];

    if (!userData[userId] || !userData[userId].cartes) {
      return `📚 Journal vide. Partage d'abord tes émotions ! 😊`;
    }

    const cartes = userData[userId].cartes;

    switch (subCommand) {
      case 'semaine':
        return this.generateJournalSemaine(cartes);
      case 'mois':
        return this.generateJournalMois(cartes);
      case 'stats':
        return this.generateJournalStats(cartes);
      case 'soleil':
        return this.generateJournalByFamily(cartes, 'soleil');
      case 'pluie':
        return this.generateJournalByFamily(cartes, 'pluie');
      case 'orage':
        return this.generateJournalByFamily(cartes, 'orage');
      case 'nuages':
        return this.generateJournalByFamily(cartes, 'nuages');
      default:
        // Recherche par mot-clé
        return this.generateJournalSearch(cartes, subCommand);
    }
  }

  generateJournalSemaine(cartes) {
    const maintenant = new Date();
    const uneSemaine = new Date(maintenant.getTime() - (7 * 24 * 60 * 60 * 1000));
    const cartesRecentes = cartes.filter(c => new Date(c.timestamp) >= uneSemaine);

    if (cartesRecentes.length === 0) {
      return `📅 JOURNAL SEMAINE\n\nAucune carte cette semaine. Partage tes émotions ! 😊`;
    }

    let message = `📅 TA SEMAINE ÉMOTIONNELLE (${cartesRecentes.length} cartes)\n\n`;

    // Grouper par jour
    const parJour = {};
    cartesRecentes.forEach(carte => {
      const jour = new Date(carte.timestamp).toLocaleDateString('fr-FR', {weekday: 'short', day: '2-digit', month: '2-digit'});
      if (!parJour[jour]) parJour[jour] = [];
      parJour[jour].push(carte);
    });

    Object.keys(parJour).forEach(jour => {
      const cartesJour = parJour[jour];
      message += `${jour} :\n`;
      cartesJour.forEach(carte => {
        const heure = new Date(carte.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
        const texte = carte.message_original.length > 35 ? carte.message_original.substring(0, 35) + '...' : carte.message_original;
        message += `  ${heure} • ${carte.meteo.emoji} "${texte}"\n`;
      });
      message += `\n`;
    });

    // Tendance
    const emotionsPositives = cartesRecentes.filter(c => c.intensite >= 7).length;
    const pourcentagePositif = Math.round((emotionsPositives / cartesRecentes.length) * 100);
    message += `📈 Tendance semaine : ${pourcentagePositif}% positif\n\n`;
    message += `🔍 Plus : "journal mois" | "journal stats"`;

    return message;
  }

  generateJournalMois(cartes) {
    const maintenant = new Date();
    const unMois = new Date(maintenant.getTime() - (30 * 24 * 60 * 60 * 1000));
    const cartesMois = cartes.filter(c => new Date(c.timestamp) >= unMois);

    if (cartesMois.length === 0) {
      return `📅 JOURNAL MOIS\n\nAucune carte ce mois. Commence ton parcours ! 😊`;
    }

    let message = `📅 TON MOIS ÉMOTIONNEL (${cartesMois.length} cartes)\n\n`;

    // Évolution par semaine
    const semaines = [];
    for (let i = 3; i >= 0; i--) {
      const debutSemaine = new Date(maintenant.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
      const finSemaine = new Date(maintenant.getTime() - ((i - 1) * 7 * 24 * 60 * 60 * 1000));
      const cartesSemaine = cartesMois.filter(c => {
        const date = new Date(c.timestamp);
        return date >= debutSemaine && date < finSemaine;
      });
      
      if (cartesSemaine.length > 0) {
        const positives = cartesSemaine.filter(c => c.intensite >= 7).length;
        const pourcentage = Math.round((positives / cartesSemaine.length) * 100);
        semaines.push({
          nom: `Semaine ${4 - i}`,
          pourcentage: pourcentage,
          cartes: cartesSemaine.length
        });
      }
    }

    semaines.forEach(semaine => {
      const emoji = semaine.pourcentage >= 70 ? '📈' : semaine.pourcentage >= 40 ? '➡️' : '📉';
      message += `${emoji} ${semaine.nom}: ${semaine.pourcentage}% positif (${semaine.cartes} cartes)\n`;
    });

    // Météo dominante du mois
    const meteosCompte = {};
    cartesMois.forEach(carte => {
      meteosCompte[carte.meteo.famille] = (meteosCompte[carte.meteo.famille] || 0) + 1;
    });
    
    const meteoDominante = Object.keys(meteosCompte).reduce((a, b) => meteosCompte[a] > meteosCompte[b] ? a : b);
    const emojiMeteo = meteoDominante === 'soleil' ? '🌞' : meteoDominante === 'pluie' ? '🌧️' : meteoDominante === 'orage' ? '⛈️' : '⛅';
    
    message += `\n${emojiMeteo} Météo dominante : ${meteoDominante} (${meteosCompte[meteoDominante]} fois)\n\n`;
    message += `🔍 Plus : "habitudes" | "journal stats"`;

    return message;
  }

  generateJournalStats(cartes) {
    if (cartes.length === 0) {
      return `📊 STATISTIQUES\n\nAucune donnée. Commence à partager tes émotions ! 😊`;
    }

    let message = `📊 TES STATISTIQUES (${cartes.length} cartes totales)\n\n`;

    // Répartition par famille de météo
    const meteosCompte = {};
    cartes.forEach(carte => {
      meteosCompte[carte.meteo.famille] = (meteosCompte[carte.meteo.famille] || 0) + 1;
    });

    message += `🌈 RÉPARTITION MÉTÉO :\n`;
    Object.keys(meteosCompte).sort((a, b) => meteosCompte[b] - meteosCompte[a]).forEach(famille => {
      const pourcentage = Math.round((meteosCompte[famille] / cartes.length) * 100);
      const emoji = famille === 'soleil' ? '🌞' : famille === 'pluie' ? '🌧️' : famille === 'orage' ? '⛈️' : famille === 'neige' ? '❄️' : famille === 'brouillard' ? '🌫️' : '⛅';
      message += `• ${emoji} ${famille}: ${pourcentage}% (${meteosCompte[famille]} cartes)\n`;
    });

    // Intensité moyenne
    const intensiteMoyenne = cartes.reduce((sum, c) => sum + c.intensite, 0) / cartes.length;
    message += `\n📊 INTENSITÉ MOYENNE : ${Math.round(intensiteMoyenne * 10) / 10}/10\n`;

    // Fréquence d'usage
    const premiereCarte = new Date(cartes[0].timestamp);
    const derniereCarte = new Date(cartes[cartes.length - 1].timestamp);
    const joursTotal = Math.ceil((derniereCarte - premiereCarte) / (1000 * 60 * 60 * 24)) + 1;
    const frequenceJour = Math.round((cartes.length / joursTotal) * 100) / 100;

    message += `📱 USAGE : ${frequenceJour} cartes/jour sur ${joursTotal} jours\n\n`;
    message += `🔍 Plus : "habitudes" | "journal semaine"`;

    return message;
  }

  generateJournalByFamily(cartes, famille) {
    const cartesFamily = cartes.filter(c => c.meteo.famille === famille);
    
    if (cartesFamily.length === 0) {
      const familleEmoji = famille === 'soleil' ? '🌞' : famille === 'pluie' ? '🌧️' : famille === 'orage' ? '⛈️' : '⛅';
      return `${familleEmoji} JOURNAL ${famille.toUpperCase()}\n\nAucun moment ${famille} encore. Reviens plus tard ! 😊`;
    }

    const familleEmoji = famille === 'soleil' ? '🌞' : famille === 'pluie' ? '🌧️' : famille === 'orage' ? '⛈️' : '⛅';
    let message = `${familleEmoji} TOUS TES MOMENTS ${famille.toUpperCase()} (${cartesFamily.length} cartes)\n\n`;

    // Les 5 plus récents
    const recents = cartesFamily.slice(-5).reverse();
    recents.forEach(carte => {
      const date = new Date(carte.timestamp).toLocaleDateString('fr-FR');
      const heure = new Date(carte.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
      const texte = carte.message_original.length > 45 ? carte.message_original.substring(0, 45) + '...' : carte.message_original;
      
      message += `${date} ${heure} • ${carte.meteo.emoji} ${carte.meteo.nom}\n`;
      message += `"${texte}"\n\n`;
    });

    // Révélations patterns
    if (cartesFamily.length >= 5) {
      const revelations = this.analyzeRevelations(cartesFamily);
      if (revelations.length > 0) {
        message += `💡 Révélations ${famille} :\n${revelations[0]}\n\n`;
      }
    }

    message += `🔍 Voir analyse complète : "habitudes"`;
    return message;
  }

  generateJournalSearch(cartes, motCle) {
    const cartesRecherche = cartes.filter(c => 
      c.message_original.toLowerCase().includes(motCle.toLowerCase()) ||
      c.emotion.toLowerCase().includes(motCle.toLowerCase()) ||
      (c.contexte.lieu && c.contexte.lieu.toLowerCase().includes(motCle.toLowerCase())) ||
      (c.contexte.personnes && c.contexte.personnes.some(p => p.toLowerCase().includes(motCle.toLowerCase())))
    );

    if (cartesRecherche.length === 0) {
      return `🔍 RECHERCHE "${motCle}"\n\nAucun résultat. Essaie un autre terme ! 🤔`;
    }

    let message = `🔍 RECHERCHE "${motCle}" (${cartesRecherche.length} résultats)\n\n`;

    const recents = cartesRecherche.slice(-5).reverse();
    recents.forEach(carte => {
      const date = new Date(carte.timestamp).toLocaleDateString('fr-FR');
      const texte = carte.message_original.length > 50 ? carte.message_original.substring(0, 50) + '...' : carte.message_original;
      message += `${date} • ${carte.meteo.emoji} "${texte}"\n\n`;
    });

    message += `🔍 Plus : "habitudes" pour les révélations`;
    return message;
  }

  analyzeRevelations(cartes) {
    // Analyse simple des révélations pour affichage journal
    const revelations = [];
    
    // Révélation horaire
    const heures = {};
    cartes.forEach(carte => {
      const heure = new Date(carte.timestamp).getHours();
      const tranche = heure < 12 ? 'matin' : heure < 18 ? 'après-midi' : 'soir';
      heures[tranche] = (heures[tranche] || 0) + 1;
    });
    
    const trancheMax = Object.keys(heures).reduce((a, b) => heures[a] > heures[b] ? a : b);
    const pourcentage = Math.round((heures[trancheMax] / cartes.length) * 100);
    
    if (pourcentage > 60) {
      revelations.push(`${pourcentage}% de ces moments arrivent le ${trancheMax}`);
    }

    return revelations;
  }

  handleHabitudes(userId) {
    if (!userData[userId] || !userData[userId].cartes || userData[userId].cartes.length < 5) {
      return `🔄 TES HABITUDES ÉMOTIONNELLES

Pas encore assez de données pour détecter tes habitudes cachées.

Minimum 5 messages nécessaires.
Actuel : ${userData[userId]?.cartes?.length || 0} messages.

Continue à partager tes émotions ! 😊`;
    }

    // Détecter habitudes si pas fait récemment
    const derniereDetection = userData[userId].derniere_detection_patterns;
    const maintenant = new Date();
    
    if (!derniereDetection || (maintenant - new Date(derniereDetection)) > 24 * 60 * 60 * 1000) {
      patternDetector.detectAllPatterns(userId);
      userData[userId].derniere_detection_patterns = maintenant.toISOString();
    }

    const habitudes = userData[userId].habitudes || [];
    const habitudesSignificatives = habitudes.filter(h => h.confidence >= 80).slice(0, 3);

    if (habitudesSignificatives.length === 0) {
      return `🔄 TES HABITUDES ÉMOTIONNELLES

${userData[userId].cartes.length} cartes analysées, mais aucune habitude significative détectée encore.

Continue à partager tes émotions pour révéler tes habitudes cachées !

🔍 Navigation :
• "habitudes temps" - Rythmes temporels
• "habitudes relations" - Impact personnes  
• "habitudes lieux" - Influence environnement`;
    }

    let message = `🧠 TES HABITUDES DÉCOUVERTES\n\n`;
    message += `${userData[userId].cartes.length} cartes analysées • ${habitudes.length} habitudes actives\n\n`;

    message += `🎯 PRINCIPALES RÉVÉLATIONS :\n\n`;
    habitudesSignificatives.forEach((habitude, index) => {
      const emoji = habitude.impact === 'positif' ? '✅' : habitude.impact === 'négatif' ? '⚠️' : '➡️';
      message += `${index + 1}. ${emoji} ${habitude.revelation}\n`;
      if (habitude.actionnable) {
        message += `   💡 ${habitude.actionnable}\n`;
      }
      message += `   🔬 ${Math.round(habitude.confidence)}% fiabilité\n\n`;
    });

    message += `🔍 Détails par catégorie :\n`;
    message += `• "habitudes temps" - Rythmes temporels\n`;
    message += `• "habitudes relations" - Impact personnes\n`;
    message += `• "habitudes lieux" - Influence environnement\n`;
    message += `• "habitudes formules" - Combinaisons complexes`;

    return message;
  }

  handleHabitudesSpecific(userId, command) {
    const parts = command.split(' ');
    const subCommand = parts[1];

    if (!userData[userId] || !userData[userId].habitudes) {
      return `🔄 Pas encore d'habitudes détectées. Partage plus d'émotions ! 😊`;
    }

    const habitudes = userData[userId].habitudes;

    switch (subCommand) {
      case 'temps':
        return this.generateHabitudesTemps(habitudes);
      case 'relations':
        return this.generateHabitudesRelations(habitudes);
      case 'lieux':
        return this.generateHabitudesLieux(habitudes);
      case 'formules':
        return this.generateHabitudesFormules(habitudes);
      case 'evolution':
        return this.generateHabitudesEvolution(userId);
      default:
        return this.handleHabitudes(userId);
    }
  }

  generateHabitudesTemps(habitudes) {
    const habitudesTemporelles = habitudes.filter(h => h.type === 'temporel' && h.confidence >= 75);
    
    if (habitudesTemporelles.length === 0) {
      return `🕐 TES RYTHMES TEMPORELS\n\nPas encore assez de données pour détecter tes cycles émotionnels. Continue ! 😊`;
    }

    let message = `🕐 TES RYTHMES TEMPORELS\n\n`;

    const parJour = habitudesTemporelles.filter(h => h.dimension === 'jour_semaine');
    const parHeure = habitudesTemporelles.filter(h => h.dimension === 'tranche_heure');

    if (parJour.length > 0) {
      message += `📅 PAR JOUR DE LA SEMAINE :\n`;
      parJour.forEach(habitude => {
        const emoji = habitude.impact === 'positif' ? '✅' : habitude.impact === 'négatif' ? '⚠️' : '➡️';
        message += `• ${habitude.valeur} : ${emoji} ${habitude.revelation}\n`;
      });
      message += `\n`;
    }

    if (parHeure.length > 0) {
      message += `⏰ PAR TRANCHE HORAIRE :\n`;
      parHeure.forEach(habitude => {
        const emoji = habitude.impact === 'positif' ? '⭐' : habitude.impact === 'négatif' ? '⚠️' : '➡️';
        message += `• ${habitude.valeur} : ${emoji} ${habitude.revelation}\n`;
      });
      message += `\n`;
    }

    // Recommandation basée sur la meilleure habitude
    const meilleureHabitude = parJour.concat(parHeure).sort((a, b) => b.confidence - a.confidence)[0];
    if (meilleureHabitude && meilleureHabitude.actionnable) {
      message += `💡 RECOMMANDATION :\n${meilleureHabitude.actionnable}\n\n`;
    }

    message += `🔍 Plus : "habitudes relations" | "habitudes formules"`;
    return message;
  }

  generateHabitudesRelations(habitudes) {
    const habitudesRelationnelles = habitudes.filter(h => h.type === 'relationnel' && h.confidence >= 75);
    
    if (habitudesRelationnelles.length === 0) {
      return `👥 TES HABITUDES RELATIONNELLES\n\nPas encore assez de données sur tes interactions. Mentionne les personnes dans tes messages ! 😊`;
    }

    let message = `👥 TES HABITUDES RELATIONNELLES\n\n`;

    const toxiques = habitudesRelationnelles.filter(h => h.impact === 'toxique');
    const energisants = habitudesRelationnelles.filter(h => h.impact === 'energisant');
    const neutres = habitudesRelationnelles.filter(h => h.impact === 'neutre');

    if (toxiques.length > 0) {
      message += `⚠️ PERSONNES ÉNERGIVORES :\n`;
      toxiques.forEach(habitude => {
        message += `• ${habitude.valeur} : Impact négatif (${habitude.occurrences} interactions)\n`;
        if (habitude.actionnable) {
          message += `  💡 ${habitude.actionnable}\n`;
        }
      });
      message += `\n`;
    }

    if (energisants.length > 0) {
      message += `✅ PERSONNES ÉNERGISANTES :\n`;
      energisants.forEach(habitude => {
        message += `• ${habitude.valeur} : Impact positif ⭐ (${habitude.occurrences} interactions)\n`;
        if (habitude.actionnable) {
          message += `  💡 ${habitude.actionnable}\n`;
        }
      });
      message += `\n`;
    }

    if (neutres.length > 0) {
      message += `➡️ RELATIONS NEUTRES :\n`;
      neutres.forEach(habitude => {
        message += `• ${habitude.valeur} : Impact équilibré (${habitude.occurrences} interactions)\n`;
      });
      message += `\n`;
    }

    message += `🔍 Plus : "habitudes temps" | "habitudes lieux"`;
    return message;
  }

  generateHabitudesLieux(habitudes) {
    const habitudesContextuelles = habitudes.filter(h => h.type === 'contextuel' && h.confidence >= 75);
    
    if (habitudesContextuelles.length === 0) {
      return `🗺️ TES HABITUDES DE LIEUX\n\nPas encore assez de données sur tes environnements. Mentionne les lieux ! 😊`;
    }

    let message = `🗺️ TES HABITUDES DE LIEUX\n\n`;

    habitudesContextuelles.forEach(habitude => {
      const emoji = habitude.impact === 'positif' ? '✅' : habitude.impact === 'négatif' ? '⚠️' : '➡️';
      message += `${emoji} ${habitude.valeur.toUpperCase()} (${habitude.occurrences} cartes) :\n`;
      message += `${habitude.revelation}\n`;
      if (habitude.actionnable) {
        message += `💡 ${habitude.actionnable}\n`;
      }
      message += `\n`;
    });

    message += `🔍 Plus : "habitudes relations" | "habitudes formules"`;
    return message;
  }

  generateHabitudesFormules(habitudes) {
    const habitudesMulti = habitudes.filter(h => h.type === 'multi_dimensionnel' && h.confidence >= 80);
    
    if (habitudesMulti.length === 0) {
      return `🔬 TES FORMULES ÉMOTIONNELLES\n\nPas encore assez de données pour détecter des corrélations complexes. Continue ! 💪`;
    }

    let message = `🔬 TES FORMULES ÉMOTIONNELLES\n\n`;

    const formulesBonheur = habitudesMulti.filter(h => h.impact === 'positif');
    const formulesToxiques = habitudesMulti.filter(h => h.impact === 'négatif');

    if (formulesBonheur.length > 0) {
      message += `🌟 FORMULES BONHEUR DÉCOUVERTES :\n\n`;
      formulesBonheur.forEach((habitude, index) => {
        message += `${index + 1}. ⭐ ${habitude.revelation}\n\n`;
      });
    }

    if (formulesToxiques.length > 0) {
      message += `⚠️ FORMULES TOXIQUES IDENTIFIÉES :\n\n`;
      formulesToxiques.forEach((habitude, index) => {
        message += `${index + 1}. 🌩️ ${habitude.revelation}\n\n`;
      });
    }

    message += `💡 RÉVÉLATION RÉVOLUTIONNAIRE :\n`;
    message += `Tu peux PROGRAMMER ton bonheur !\n`;
    message += `• Reproduis formules positives\n`;
    message += `• Évite formules toxiques\n`;
    message += `• Modifie 1 variable = change tout\n\n`;

    message += `🔍 Plus : "habitudes temps" | "habitudes relations"`;
    return message;
  }

  generateHabitudesEvolution(userId) {
    const cartes = userData[userId].cartes || [];
    if (cartes.length < 10) {
      return `📈 TON ÉVOLUTION ÉMOTIONNELLE\n\nPas encore assez de données pour voir ton évolution. Continue ! 💪`;
    }

    // Diviser en périodes pour voir l'évolution
    const maintenant = new Date();
    const deuxSemainesAgo = new Date(maintenant.getTime() - (14 * 24 * 60 * 60 * 1000));

    const cartesAncien = cartes.filter(c => new Date(c.timestamp) < deuxSemainesAgo);
    const cartesRecent = cartes.filter(c => new Date(c.timestamp) >= deuxSemainesAgo);

    if (cartesAncien.length < 3 || cartesRecent.length < 3) {
      return `📈 TON ÉVOLUTION ÉMOTIONNELLE\n\nPas encore assez d'historique pour comparer. Reviens dans quelques jours ! 😊`;
    }

    const positifAncien = cartesAncien.filter(c => c.intensite >= 7).length;
    const positifRecent = cartesRecent.filter(c => c.intensite >= 7).length;
    
    const pourcentageAncien = Math.round((positifAncien / cartesAncien.length) * 100);
    const pourcentageRecent = Math.round((positifRecent / cartesRecent.length) * 100);
    const evolution = pourcentageRecent - pourcentageAncien;

    let message = `📈 TON ÉVOLUTION ÉMOTIONNELLE\n\n`;
    message += `🎯 PROGRESSION GLOBALE :\n`;
    message += `• Il y a 2 semaines : ${pourcentageAncien}% émotions positives\n`;
    message += `• Ces 2 dernières semaines : ${pourcentageRecent}% émotions positives\n`;
    
    if (evolution > 10) {
      message += `🚀 Évolution : +${evolution}% ! Tu progresses ! ⭐\n\n`;
    } else if (evolution > 0) {
      message += `📈 Évolution : +${evolution}% Légère amélioration ! ✅\n\n`;
    } else if (evolution > -10) {
      message += `➡️ Évolution : ${evolution}% Stable\n\n`;
    } else {
      message += `📉 Évolution : ${evolution}% Période difficile, ça va passer 💪\n\n`;
    }

    // Fréquence d'usage
    const joursAvecMessage = new Set(cartesRecent.map(c => new Date(c.timestamp).toDateString())).size;
    message += `📱 USAGE : ${joursAvecMessage}/14 jours utilisés\n`;
    message += `🔄 Fréquence : ${Math.round((cartesRecent.length / 2) * 10) / 10} messages/semaine\n\n`;

    message += `💡 TON SUPER-POUVOIR :\n`;
    message += `L'auto-observation change VRAIMENT ton bien-être !\n`;
    message += `Tu deviens l'architecte de tes émotions. 💪\n\n`;

    message += `🔍 Plus : "habitudes temps" | "habitudes formules"`;
    return message;
  }

  handleParametres(userId) {
    return `⚙️ TES PARAMÈTRES MOODMAP\n\n🔔 NOTIFICATIONS INTELLIGENTES :\n• "paramètres notifications" - Fréquence révélations\n• "paramètres habitudes" - Nouvelles habitudes\n• "paramètres résumés" - Bilans périodiques\n\n📊 ANALYSE AVANCÉE :\n• "paramètres seuils" - Fiabilité habitudes\n• "paramètres données" - Export/suppression\n\n🔍 Choisis une catégorie pour personnaliser`;
  }

  handleParametresSpecific(userId, command) {
    return `⚙️ PARAMÈTRES - Fonctionnalité en développement\n\nActuellement, MoodMap utilise des paramètres optimaux pour ton test.\n\nBientôt disponible :\n• Personnalisation notifications\n• Ajustement seuils habitudes\n• Export données\n\n🔍 Retour : "menu"`;
  }

  handleAide(userId) {
    return `❓ GUIDE MOODMAP COMPLET\n\n🌈 CONCEPT DE BASE :\nMoodMap détecte tes habitudes émotionnelles cachées grâce à l'IA et révèle ce qui influence vraiment ton bien-être.\n\n💬 UTILISATION QUOTIDIENNE :\nÉcris naturellement tes ressentis :\n• "Je me sens stressé"\n• "Super soirée avec Tom hier !"\n• "Lundi difficile au bureau..."\n\n📚 CONSULTATION HISTORIQUE :\n• "journal" - Tes émotions passées\n• "journal semaine/mois" - Périodes\n• "journal soleil/pluie" - Par météo\n\n🔄 DÉCOUVERTE HABITUDES :\n• "habitudes" - Vue générale révélations\n• "habitudes temps" - Rythmes temporels\n• "habitudes relations" - Impact personnes\n• "habitudes lieux" - Influence environnement\n\n💡 PLUS TU ÉCRIS, PLUS JE COMPRENDS !\nMinimum 5 messages pour premières habitudes.`;
  }
}

// Instance globale du gestionnaire de navigation
const navigationManager = new NavigationManager();

// ===== FONCTIONS UTILITAIRES =====
function getMeteoByFamily(famille) {
  return meteos[famille] || [];
}

function selectMeteoByEmotion(emotion, intensite) {
  console.log(`🎯 Sélection météo pour: ${emotion} (intensité ${intensite})`);
  
  let familleSelectionnee;
  
  // Mapping émotions -> familles météo
  const emotionMapping = {
    'joie': 'soleil',
    'bonheur': 'soleil', 
    'euphorie': 'soleil',
    'contentement': 'soleil',
    'fierté': 'soleil',
    'enthousiasme': 'soleil',
    'excitation': 'soleil',
    'plaisir': 'soleil',
    
    'tristesse': 'pluie',
    'mélancolie': 'pluie',
    'chagrin': 'pluie',
    'nostalgie': 'pluie',
    'déception': 'pluie',
    'abattement': 'pluie',
    'désespoir': 'pluie',
    
    'colère': 'orage',
    'rage': 'orage',
    'fureur': 'orage',
    'irritation': 'orage',
    'agacement': 'orage',
    'frustration': 'orage',
    'indignation': 'orage',
    
    'confusion': 'brouillard',
    'perplexité': 'brouillard',
    'incertitude': 'brouillard',
    'doute': 'brouillard',
    'interrogation': 'brouillard',
    'hésitation': 'brouillard',
    
    'calme': 'neige',
    'sérénité': 'neige',
    'paix': 'neige',
    'tranquillité': 'neige',
    'quiétude': 'neige',
    'zénitude': 'neige',
    
    'stress': intensite >= 7 ? 'orage' : 'nuages',
    'anxiété': intensite >= 6 ? 'orage' : 'nuages', 
    'fatigue': 'nuages',
    'ennui': 'nuages',
    'neutralité': 'nuages',
    'indifférence': 'nuages'
  };

  familleSelectionnee = emotionMapping[emotion.toLowerCase()] || 'nuages';
  
  console.log(`🎯 Famille sélectionnée: ${familleSelectionnee}`);
  
  // Obtenir toutes les météos de cette famille
  const meteosDisponibles = getMeteoByFamily(familleSelectionnee);
  console.log(`🎯 Météos disponibles (${familleSelectionnee}): ${meteosDisponibles.length}`);
  
  if (meteosDisponibles.length === 0) {
    console.log('⚠️ Aucune météo trouvée, utilisation météo par défaut');
    return {
      emoji: '☁️',
      nom: 'Nuages Flottants',
      famille: 'nuages',
      description: 'État émotionnel en transition'
    };
  }
  
  // Filtrer par intensité
  const meteosCompatibles = meteosDisponibles.filter(meteo => 
    intensite >= meteo.intensite_min && intensite <= meteo.intensite_max
  );
  
  console.log(`🎯 Météos compatibles intensité ${intensite}: ${meteosCompatibles.length}`);
  
  // Si aucune météo compatible, prendre la plus proche
  let meteoFinale;
  if (meteosCompatibles.length > 0) {
    meteoFinale = meteosCompatibles[Math.floor(Math.random() * meteosCompatibles.length)];
  } else {
    // Prendre la météo la plus proche en intensité
    meteoFinale = meteosDisponibles.reduce((prev, curr) => {
      const diffPrev = Math.abs((prev.intensite_min + prev.intensite_max) / 2 - intensite);
      const diffCurr = Math.abs((curr.intensite_min + curr.intensite_max) / 2 - intensite);
      return diffCurr < diffPrev ? curr : prev;
    });
  }
  
  console.log(`✅ Météo trouvée: ${meteoFinale.emoji} ${meteoFinale.nom}`);
  
  return {
    ...meteoFinale,
    famille: familleSelectionnee
  };
}

async function analyzeEmotionWithMistral(message) {
  console.log('🧠 Analyse émotionnelle avec Mistral IA...');
  
  try {
    const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
      model: 'mistral-tiny',
      messages: [{
        role: 'user',
        content: `Analyse ce message émotionnel et extrait UNIQUEMENT ces informations au format JSON strict:

Message: "${message}"

IMPORTANT: Réponds UNIQUEMENT avec un objet JSON contenant:
{
  "emotion": "émotion principale en français (joie, tristesse, colère, stress, etc.)",
  "intensite": nombre entre 1 et 10,
  "contexte": {
    "lieu": "lieu mentionné ou null (ex: bureau, maison, restaurant)",
    "activite": "activité mentionnée ou null (ex: travail, sport, repas)", 
    "personnes": ["liste EXACTE des prénoms/noms mentionnés - ne PAS confondre avec des mots similaires"],
    "moment": "moment mentionné ou null (ex: matin, soir, weekend)"
  },
  "revelation_principale": "observation psychologique concrète et percutante de 1-2 phrases, focus sur le lien émotion-contexte",
  "justification_meteo": "pourquoi cette émotion correspond à cette intensité (1 phrase courte)",
  "message_poetique_fin": "message encourageant court et naturel (1 phrase) pour finir sur une note positive"
}

RÈGLES CRITIQUES:
- Pour les personnes: extraire UNIQUEMENT les vrais prénoms/noms de personnes mentionnées
- Révélation principale: être concret et psychologiquement pertinent, pas spirituel
- Justification météo: expliquer le choix d'intensité émotionnelle
- Message poétique fin: court, encourageant, naturel (pas planant)`
      }],
      temperature: 0.2,
      max_tokens: 400
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const content = response.data.choices[0].message.content.trim();
    console.log('🧠 Réponse Mistral raw:', content);
    
    // Parser le JSON
    let analysis;
    try {
      // Nettoyer la réponse si elle contient du texte avant/après le JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      analysis = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('❌ Erreur parsing JSON Mistral:', parseError);
      throw new Error('Format JSON invalide de Mistral');
    }
    
    // Validation et nettoyage
    const cleanedAnalysis = {
      emotion: analysis.emotion || 'neutre',
      intensite: Math.max(1, Math.min(10, analysis.intensite || 5)),
      contexte: {
        lieu: analysis.contexte?.lieu || null,
        activite: analysis.contexte?.activite || null,
        personnes: Array.isArray(analysis.contexte?.personnes) ? analysis.contexte.personnes.filter(p => p && p.length > 1) : [],
        moment: analysis.contexte?.moment || null
      },
      revelation_principale: analysis.revelation_principale || "Cette émotion révèle un aspect important de ton état d'esprit actuel.",
      justification_meteo: analysis.justification_meteo || "Intensité émotionnelle détectée dans ton message.",
      message_poetique_fin: analysis.message_poetique_fin || "Cette émotion fait partie de ton parcours."
    };
    
    console.log('🧠 Analyse Mistral nettoyée:', cleanedAnalysis);
    return cleanedAnalysis;
    
  } catch (error) {
    console.error('❌ Erreur Mistral AI:', error.message);
    
    // Fallback avec analyse basique
    return {
      emotion: 'ressenti',
      intensite: 5,
      contexte: {
        lieu: null,
        activite: null,
        personnes: [],
        moment: null
      },
      revelation_principale: "Chaque émotion que tu partages enrichit ta compréhension de toi-même.",
      justification_meteo: "Ressenti émotionnel exprimé naturellement.",
      message_poetique_fin: "Continue à explorer tes émotions."
    };
  }
}

// ===== INITIALISATION UTILISATEUR =====
function initializeUser(userId) {
  if (!userData[userId]) {
    userData[userId] = {
      cartes: [],
      habitudes: [],
      config: JSON.parse(JSON.stringify(defaultUserConfig)),
      stats: {
        total_messages: 0,
        premiere_utilisation: new Date().toISOString(),
        derniere_activite: new Date().toISOString()
      },
      derniere_detection_patterns: null
    };
    console.log(`👤 Nouvel utilisateur initialisé: ${userId}`);
  }
  
  // Mettre à jour dernière activité
  userData[userId].stats.derniere_activite = new Date().toISOString();
}

// ===== FONCTION DÉTECTION DÉCOUVERTE ÉMERGENTE =====
async function detecterDecouverteEmergente(userId, nouvelleCarte) {
  try {
    const cartes = userData[userId].cartes;
    if (cartes.length < 5) return null;
    
    // Vérifier pattern émergent récent
    const cartesRecentes = cartes.slice(-5); // 5 dernières
    
    // Pattern temporel simple
    const maintenant = new Date(nouvelleCarte.timestamp);
    const jour = maintenant.toLocaleDateString('fr-FR', {weekday: 'long'});
    const cartesMemejour = cartes.filter(c => {
      const dateC = new Date(c.timestamp);
      return dateC.toLocaleDateString('fr-FR', {weekday: 'long'}) === jour;
    });
    
    if (cartesMemejour.length >= 3) {
      const emotionsPositives = cartesMemejour.filter(c => c.intensite >= 7).length;
      const pourcentage = Math.round((emotionsPositives / cartesMemejour.length) * 100);
      
      if (pourcentage >= 80) {
        return `Le ${jour} semble être ton jour de forme ! (${pourcentage}% émotions positives sur ${cartesMemejour.length} fois)`;
      } else if (pourcentage <= 20) {
        return `Le ${jour} semble plus challengeant pour toi (${100-pourcentage}% moments difficiles sur ${cartesMemejour.length} fois)`;
      }
    }
    
    // Pattern relationnel
    if (nouvelleCarte.contexte.personnes.length > 0) {
      const personne = nouvelleCarte.contexte.personnes[0];
      const cartesAvecPersonne = cartes.filter(c => 
        c.contexte.personnes && c.contexte.personnes.includes(personne)
      );
      
      if (cartesAvecPersonne.length >= 3) {
        const intensiteMoyenne = cartesAvecPersonne.reduce((sum, c) => sum + c.intensite, 0) / cartesAvecPersonne.length;
        
        if (intensiteMoyenne >= 8) {
          return `${personne} semble avoir un impact très positif sur ton bien-être ! (${cartesAvecPersonne.length} interactions)`;
        } else if (intensiteMoyenne <= 3) {
          return `${personne} semble être associé à des moments difficiles (${cartesAvecPersonne.length} interactions)`;
        }
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Erreur détection découverte émergente:', error);
    return null;
  }
}

// ===== ROUTE PRINCIPALE WEBHOOK =====
app.post('/webhook', async (req, res) => {
  try {
    const messageBody = req.body.Body;
    const fromNumber = req.body.From;
    
    console.log(`📱 Message reçu de ${fromNumber}: "${messageBody}"`);
    
    // Initialiser utilisateur si nécessaire
    initializeUser(fromNumber);
    
    // Vérifier si c'est une commande de navigation
    const commandResponse = navigationManager.processCommand(fromNumber, messageBody);
    if (commandResponse) {
      console.log('🔄 Commande navigation détectée');
      
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message(commandResponse);
      
      res.type('text/xml').send(twiml.toString());
      console.log('✅ Réponse navigation envoyée');
      return;
    }
    
    // Messages d'accueil pour nouveaux utilisateurs
    if (messageBody.toLowerCase().includes('joined') || messageBody.toLowerCase() === 'bonjour' || messageBody.toLowerCase() === 'salut') {
      console.log('🆘 Message d\'accueil détecté');
      
      const welcomeMessage = `🌈 Bienvenue sur MoodMap !

Je suis ton Sherlock Holmes des émotions 🕵️‍♂️

Partage-moi tes ressentis, humeurs, moments... 
Je vais détecter tes habitudes cachées et révéler ce qui influence vraiment ton bien-être.

💡 Exemples :
"Je me sens stressé au bureau"
"Super soirée avec Tom hier !"
"Dimanche soir, un peu mélancolique..."

📋 Commandes disponibles :
• "journal" - Ton historique émotionnel
• "habitudes" - Tes habitudes découvertes  
• "paramètres" - Personnalise tes notifications
• "aide" - Guide complet

🎯 Essaie maintenant : Comment te sens-tu ?`;

      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message(welcomeMessage);
      
      res.type('text/xml').send(twiml.toString());
      console.log('✅ Message d\'accueil envoyé');
      return;
    }
    
    // Traitement message émotionnel standard
    console.log('🔄 Analyse émotionnelle en cours...');
    
    const analysis = await analyzeEmotionWithMistral(messageBody);
    console.log('📊 Analyse complète:', analysis);
    
    // Sélection météo
    const meteo = selectMeteoByEmotion(analysis.emotion, analysis.intensite);
    console.log(`🌦️ Météo sélectionnée: ${meteo.emoji} ${meteo.nom}`);
    
    // Stocker la carte émotionnelle
    const carte = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      message_original: messageBody,
      emotion: analysis.emotion,
      intensite: analysis.intensite,
      contexte: analysis.contexte,
      meteo: meteo,
      revelation_principale: analysis.revelation_principale,
      justification_meteo: analysis.justification_meteo,
      message_poetique_fin: analysis.message_poetique_fin
    };
    
    userData[fromNumber].cartes.push(carte);
    userData[fromNumber].stats.total_messages += 1;
    
    console.log(`💾 Carte stockée pour ${fromNumber}`);
    
    // ===== NOUVELLE STRUCTURE V5.1 OPTIMISÉE =====
    let responseMessage = `${meteo.emoji} ${meteo.nom.toUpperCase()}\n`;
    responseMessage += `${analysis.justification_meteo}\n\n`;
    
    responseMessage += `🔬 ${analysis.revelation_principale}\n\n`;
    
    // Ajouter découverte émergente s'il y en a une
    if (userData[fromNumber].cartes.length >= 5) {
      const découverteEmergente = await detecterDecouverteEmergente(fromNumber, carte);
      if (découverteEmergente) {
        responseMessage += `🧠 DÉCOUVERTE ÉMERGENTE :\n${découverteEmergente}\n\n`;
      }
    }
    
    // Contexte (personnes/lieux) si présent
    if (analysis.contexte.personnes.length > 0 || analysis.contexte.lieu) {
      if (analysis.contexte.personnes.length > 0) {
        responseMessage += `👥 Avec : ${analysis.contexte.personnes.join(', ')}\n`;
      }
      if (analysis.contexte.lieu) {
        responseMessage += `📍 Lieu : ${analysis.contexte.lieu}\n`;
      }
      responseMessage += `\n`;
    }
    
    responseMessage += `✅ Analysé par IA • Ajouté à ton journal\n\n`;
    responseMessage += `✨ ${analysis.message_poetique_fin}`;
    
    // Détecter habitudes si assez de données (de façon asynchrone)
    if (userData[fromNumber].cartes.length >= 5) {
      setTimeout(() => {
        patternDetector.detectAllPatterns(fromNumber);
      }, 1000); // Async pour ne pas ralentir la réponse
    }
    
    // Envoyer réponse
    console.log('📤 Envoi réponse analyse émotionnelle...');
    console.log(`📋 Aperçu message: "${responseMessage.substring(0, 100)}..."`);
    
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(responseMessage);
    
    res.type('text/xml').send(twiml.toString());
    console.log('✅ Réponse analyse émotionnelle envoyée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur webhook:', error);
    
    const errorMessage = `🤖 Oups ! Petite erreur technique...\n\nRéessaie dans quelques secondes ou tape "aide" pour le guide d'utilisation.`;
    
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(errorMessage);
    
    res.type('text/xml').send(twiml.toString());
  }
});

// ===== ROUTES SANTÉ ET DEBUG =====
app.get('/', (req, res) => {
  const stats = {
    version: "5.1 RÉVOLUTIONNAIRE",
    uptime: process.uptime(),
    users: Object.keys(userData).length,
    total_cartes: Object.values(userData).reduce((sum, user) => sum + (user.cartes?.length || 0), 0),
    total_habitudes: Object.values(userData).reduce((sum, user) => sum + (user.habitudes?.length || 0), 0),
    features: [
      "Structure réponse optimisée",
      "60 météos émotionnelles préservées V5.0",
      "Révélations multi-dimensionnelles",
      "Interface 100% français",
      "Navigation journal/habitudes",
      "Découvertes émergentes temps réel"
    ]
  };
  
  res.json({
    status: "🚀 MoodMap V5.1 RÉVOLUTIONNAIRE opérationnel !",
    stats: stats
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '5.1'
  });
});

app.get('/stats', (req, res) => {
  const globalStats = {
    total_users: Object.keys(userData).length,
    total_cartes: Object.values(userData).reduce((sum, user) => sum + (user.cartes?.length || 0), 0),
    total_habitudes: Object.values(userData).reduce((sum, user) => sum + (user.habitudes?.length || 0), 0),
    families_usage: {},
    avg_intensity: 0
  };
  
  // Calculer stats globales
  let totalIntensity = 0;
  let totalCartes = 0;
  
  Object.values(userData).forEach(user => {
    if (user.cartes) {
      user.cartes.forEach(carte => {
        totalIntensity += carte.intensite;
        totalCartes++;
        
        const famille = carte.meteo.famille;
        globalStats.families_usage[famille] = (globalStats.families_usage[famille] || 0) + 1;
      });
    }
  });
  
  if (totalCartes > 0) {
    globalStats.avg_intensity = Math.round((totalIntensity / totalCartes) * 10) / 10;
  }
  
  res.json(globalStats);
});

// ===== DÉMARRAGE SERVEUR =====
app.listen(port, () => {
  console.log(`🚀 MoodMap WhatsApp Bot V5.1 RÉVOLUTIONNAIRE démarré sur port ${port}`);
  console.log(`🌈 60 météos émotionnelles: ACTIVÉES ✅`);
  console.log(`🧠 Mistral AI: ACTIVÉ ✅`);
  console.log(`🔍 Habitudes multi-dimensionnelles: ACTIVÉES ✅`);
  console.log(`📊 Navigation journal/habitudes: ACTIVÉE ✅`);
  console.log(`🔔 Notifications proactives: ACTIVÉES ✅`);
  console.log(`🇫🇷 Interface 100% français: ACTIVÉE ✅`);
  console.log(`🎯 Structure optimisée: ACTIVÉE ✅`);
  console.log(`🕵️‍♂️ Sherlock Holmes des émotions: OPÉRATIONNEL ! 💪`);
});
