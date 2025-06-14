const express = require('express');
const twilio = require('twilio');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const AccountSid = process.env.TWILIO_ACCOUNT_SID || 'AC17fe25637040eec0bf4cf9639a167104';
const AuthToken = process.env.TWILIO_AUTH_TOKEN || '095485d0bd7272ce88b38d49e002858e';
const client = twilio(AccountSid, AuthToken);

// 🌈 SYSTÈME 60 MÉTÉOS ÉMOTIONNELLES V4.1
const METEO_SYSTEM = {
  // ☀️ FAMILLE SOLEIL (1-10)
  1: { emoji: '🌅', nom: 'Aurore', famille: 'soleil', intensite_min: 1, intensite_max: 3, description: 'Espoir naissant, premiers rayons d\'optimisme', couleur: '#FFB347', messages: ['Cette lueur dorée naît de ton cœur', 'Chaque aurore porte une promesse nouvelle', 'Ton espoir illumine l\'horizon'] },
  2: { emoji: '☀️', nom: 'Grand Soleil', famille: 'soleil', intensite_min: 8, intensite_max: 10, description: 'Joie intense, euphorie pure', couleur: '#FFD700', messages: ['Cette lumière éclatante vient de toi', 'Ton énergie rayonne comme un soleil d\'été', 'Cette joie intense mérite d\'être célébrée'] },
  3: { emoji: '🌤️', nom: 'Soleil Voilé', famille: 'soleil', intensite_min: 4, intensite_max: 6, description: 'Bonheur calme, sérénité douce', couleur: '#FFF8DC', messages: ['Cette douceur paisible t\'habite', 'Ton calme intérieur est précieux', 'Cette sérénité reflète ta sagesse'] },
  4: { emoji: '🌞', nom: 'Soleil Rayonnant', famille: 'soleil', intensite_min: 7, intensite_max: 9, description: 'Confiance éclatante, fierté assumée', couleur: '#FFA500', messages: ['Cette confiance te va si bien', 'Ton assurance illumine tout autour', 'Cette fierté est légitime et belle'] },
  5: { emoji: '🌻', nom: 'Soleil Timide', famille: 'soleil', intensite_min: 2, intensite_max: 4, description: 'Bonheur discret, joie contenue', couleur: '#FFFF99', messages: ['Cette joie discrète est authentique', 'Ton bonheur timide a sa propre beauté', 'Cette douceur cachée te caractérise'] },
  6: { emoji: '🔆', nom: 'Soleil Éclatant', famille: 'soleil', intensite_min: 9, intensite_max: 10, description: 'Réussite triomphante, victoire', couleur: '#FF4500', messages: ['Cette victoire te revient de droit', 'Ton succès illumine le chemin', 'Cette réussite reflète tes efforts'] },
  7: { emoji: '🌇', nom: 'Coucher Doré', famille: 'soleil', intensite_min: 5, intensite_max: 7, description: 'Satisfaction accomplie, plénitude', couleur: '#DAA520', messages: ['Cette plénitude dorée t\'appartient', 'Ta satisfaction rayonne de justesse', 'Ce contentement profond est mérité'] },
  8: { emoji: '⭐', nom: 'Soleil d\'Été', famille: 'soleil', intensite_min: 6, intensite_max: 8, description: 'Vitalité, insouciance, légèreté', couleur: '#FFFF00', messages: ['Cette légèreté d\'être te libère', 'Ton insouciance fait du bien', 'Cette vitalité est contagieuse'] },
  9: { emoji: '🌤️', nom: 'Soleil Nuageux', famille: 'soleil', intensite_min: 4, intensite_max: 6, description: 'Joie teintée de nostalgie', couleur: '#F0E68C', messages: ['Cette mélancolie dorée est poétique', 'Ton bonheur nuancé est profond', 'Cette nostalgie joyeuse te grandit'] },
  10: { emoji: '☀️', nom: 'Soleil de Printemps', famille: 'soleil', intensite_min: 5, intensite_max: 7, description: 'Renouveau, fraîcheur, renaissance', couleur: '#98FB98', messages: ['Ce renouveau vient de toi', 'Cette fraîcheur régénère tout', 'Ta renaissance intérieure éclôt'] },
  
  // 🌧️ FAMILLE PLUIE (11-20)
  11: { emoji: '💧', nom: 'Rosée', famille: 'pluie', intensite_min: 1, intensite_max: 2, description: 'Tristesse matinale, larmes douces', couleur: '#E6F3FF', messages: ['Ces larmes matinales perlent de vérité', 'Cette rosée émotionnelle nourrit', 'Ta tristesse douce a sa beauté'] },
  12: { emoji: '🌦️', nom: 'Bruine', famille: 'pluie', intensite_min: 2, intensite_max: 4, description: 'Mélancolie légère, cafard passager', couleur: '#B0C4DE', messages: ['Cette brume légère va se lever', 'Ta mélancolie passagère est normale', 'Cette bruine intérieure s\'évaporera'] },
  13: { emoji: '🌧️', nom: 'Pluie Fine', famille: 'pluie', intensite_min: 3, intensite_max: 5, description: 'Chagrin tranquille, nostalgie', couleur: '#708090', messages: ['Cette pluie fine lave en douceur', 'Ton chagrin tranquille mérite respect', 'Cette nostalgie a sa sagesse'] },
  14: { emoji: '💦', nom: 'Crachin', famille: 'pluie', intensite_min: 4, intensite_max: 6, description: 'Morosité persistante, grisaille', couleur: '#696969', messages: ['Ce crachin persistant finira par cesser', 'Cette grisaille cache un ciel bleu', 'Ta morosité porte un message'] },
  15: { emoji: '🌧️', nom: 'Ondée', famille: 'pluie', intensite_min: 3, intensite_max: 5, description: 'Émotion soudaine, larmes brèves', couleur: '#4682B4', messages: ['Cette ondée émotionnelle est libératrice', 'Tes larmes brèves nettoient l\'âme', 'Cette émotion soudaine dit vrai'] },
  16: { emoji: '🌊', nom: 'Pluie Battante', famille: 'pluie', intensite_min: 6, intensite_max: 8, description: 'Chagrin profond, peine intense', couleur: '#2F4F4F', messages: ['Cette pluie battante nourrira demain', 'Ton chagrin profond mérite compassion', 'Cette intensité émotionnelle t\'honore'] },
  17: { emoji: '⛈️', nom: 'Déluge', famille: 'pluie', intensite_min: 8, intensite_max: 10, description: 'Détresse majeure, submersion émotionnelle', couleur: '#191970', messages: ['Ce déluge émotionnel va s\'apaiser', 'Ta détresse immense sera entendue', 'Cette submersion trouvera sa rive'] },
  18: { emoji: '🌧️', nom: 'Pluie d\'Automne', famille: 'pluie', intensite_min: 4, intensite_max: 6, description: 'Nostalgie profonde, mélancolie saisonnière', couleur: '#8B4513', messages: ['Cette nostalgie automnale est poétique', 'Ta mélancolie saisonnière a du sens', 'Cette pluie d\'automne prépare le renouveau'] },
  19: { emoji: '💧', nom: 'Pluie Nocturne', famille: 'pluie', intensite_min: 5, intensite_max: 7, description: 'Solitude, tristesse silencieuse', couleur: '#000080', messages: ['Cette pluie nocturne berce tes pensées', 'Ta solitude silencieuse parle fort', 'Cette tristesse de nuit te connaît'] },
  20: { emoji: '🌧️', nom: 'Pluie Tropicale', famille: 'pluie', intensite_min: 6, intensite_max: 8, description: 'Chagrin libérateur, larmes nécessaires', couleur: '#006400', messages: ['Cette pluie tropicale régénère tout', 'Tes larmes nécessaires purifient', 'Ce chagrin libérateur te grandit'] },

  // ⛈️ FAMILLE ORAGE (21-30)
  21: { emoji: '⚡', nom: 'Grondements', famille: 'orage', intensite_min: 2, intensite_max: 4, description: 'Irritation montante, tension sourde', couleur: '#FFE4B5', messages: ['Ces grondements annoncent un changement', 'Ta tension sourde demande attention', 'Cette irritation montante a ses raisons'] },
  22: { emoji: '🌩️', nom: 'Éclair', famille: 'orage', intensite_min: 4, intensite_max: 6, description: 'Colère soudaine, flash de rage', couleur: '#FFA500', messages: ['Cet éclair de colère illumine tes besoins', 'Cette rage soudaine dit quelque chose', 'Ce flash émotionnel mérite écoute'] },
  23: { emoji: '⛈️', nom: 'Orage Électrique', famille: 'orage', intensite_min: 6, intensite_max: 8, description: 'Fureur intense, rage explosive', couleur: '#FF6347', messages: ['Cette fureur électrique cherche justice', 'Ton orage intérieur prépare l\'accalmie', 'Cette rage explosive a sa vérité'] },
  24: { emoji: '🌪️', nom: 'Tornade', famille: 'orage', intensite_min: 8, intensite_max: 10, description: 'Colère destructrice, perte de contrôle', couleur: '#DC143C', messages: ['Cette tornade émotionnelle va s\'apaiser', 'Ta colère destructrice cache une blessure', 'Cette perte de contrôle demande douceur'] },
  25: { emoji: '⛈️', nom: 'Tempête', famille: 'orage', intensite_min: 7, intensite_max: 9, description: 'Frustration majeure, conflit intérieur', couleur: '#B22222', messages: ['Cette tempête intérieure trouvera son calme', 'Ta frustration majeure sera entendue', 'Ce conflit interne cherche résolution'] },
  26: { emoji: '🌩️', nom: 'Orage d\'Été', famille: 'orage', intensite_min: 5, intensite_max: 7, description: 'Colère chaude, passion explosive', couleur: '#FF4500', messages: ['Cet orage d\'été rafraîchira l\'air', 'Ta colère chaude a sa passion', 'Cette explosion émotionnelle purifie'] },
  27: { emoji: '⚡', nom: 'Foudre', famille: 'orage', intensite_min: 7, intensite_max: 10, description: 'Indignation pure, justice en marche', couleur: '#9400D3', messages: ['Cette foudre de justice est légitime', 'Ton indignation pure honore tes valeurs', 'Cette justice en marche avance'] },
  28: { emoji: '⛈️', nom: 'Orage Nocturne', famille: 'orage', intensite_min: 6, intensite_max: 8, description: 'Rage sourde, colère contenue', couleur: '#4B0082', messages: ['Cet orage nocturne gronde en silence', 'Ta rage sourde demande expression', 'Cette colère contenue cherche sa voie'] },
  29: { emoji: '🌪️', nom: 'Bourrasque', famille: 'orage', intensite_min: 4, intensite_max: 6, description: 'Agacement intense, nerfs à vif', couleur: '#FF69B4', messages: ['Cette bourrasque émotionnelle passera', 'Tes nerfs à vif méritent repos', 'Cet agacement intense a ses motifs'] },
  30: { emoji: '⛈️', nom: 'Supercellule', famille: 'orage', intensite_min: 9, intensite_max: 10, description: 'Fureur totale, tempête parfaite', couleur: '#8B0000', messages: ['Cette supercellule émotionnelle est rare', 'Ta fureur totale cache une profonde blessure', 'Cette tempête parfaite trouvera son œil'] },

  // ☁️ FAMILLE NUAGES (31-40)
  31: { emoji: '☁️', nom: 'Nuage Blanc', famille: 'nuages', intensite_min: 1, intensite_max: 3, description: 'Tranquillité neutre, paix ordinaire', couleur: '#F8F8FF', messages: ['Ce nuage blanc porte ta sérénité', 'Cette tranquillité neutre a sa valeur', 'Ta paix ordinaire est extraordinaire'] },
  32: { emoji: '🌫️', nom: 'Voile', famille: 'nuages', intensite_min: 2, intensite_max: 4, description: 'Ennui léger, routine douce', couleur: '#F5F5F5', messages: ['Ce voile d\'ennui cache des possibles', 'Ta routine douce a son réconfort', 'Cette légèreté neutre te repose'] },
  33: { emoji: '☁️', nom: 'Cumulus', famille: 'nuages', intensite_min: 3, intensite_max: 5, description: 'Humeur stable, normalité', couleur: '#DCDCDC', messages: ['Ces cumulus portent ta stabilité', 'Cette normalité est un cadeau', 'Ton équilibre tranquille rassure'] },
  34: { emoji: '🌥️', nom: 'Nuages Gris', famille: 'nuages', intensite_min: 4, intensite_max: 6, description: 'Morosité banale, grisaille quotidienne', couleur: '#A9A9A9', messages: ['Ces nuages gris cachent le soleil temporairement', 'Cette morosité banale est passagère', 'Ta grisaille quotidienne prépare la couleur'] },
  35: { emoji: '☁️', nom: 'Stratus', famille: 'nuages', intensite_min: 5, intensite_max: 7, description: 'Monotonie étendue, plateau émotionnel', couleur: '#808080', messages: ['Cette couche uniforme cherche variation', 'Ta monotonie étendue appelle changement', 'Ce plateau émotionnel prépare l\'évolution'] },
  36: { emoji: '🌫️', nom: 'Banc de Nuages', famille: 'nuages', intensite_min: 4, intensite_max: 6, description: 'Neutralité pesante, vide émotionnel', couleur: '#696969', messages: ['Ce banc de nuages va se déplacer', 'Cette neutralité pesante demande mouvement', 'Ton vide émotionnel appelle remplissage'] },
  37: { emoji: '☁️', nom: 'Cirrus', famille: 'nuages', intensite_min: 2, intensite_max: 4, description: 'Légèreté neutre, détachement serein', couleur: '#E0E0E0', messages: ['Ces cirrus portent ta légèreté d\'être', 'Ce détachement serein t\'élève', 'Cette neutralité haute a sa grâce'] },
  38: { emoji: '🌥️', nom: 'Couverture', famille: 'nuages', intensite_min: 6, intensite_max: 8, description: 'Ennui total, journée plate', couleur: '#2F4F4F', messages: ['Cette couverture nuageuse va se lever', 'Ton ennui total cache une attente', 'Cette journée plate prépare du relief'] },
  39: { emoji: '☁️', nom: 'Nimbus', famille: 'nuages', intensite_min: 5, intensite_max: 7, description: 'Lourdeur sans orage, pesanteur', couleur: '#778899', messages: ['Ce nimbus porte une promesse cachée', 'Cette lourdeur sans orage s\'allègera', 'Ta pesanteur émotionnelle trouve son sens'] },
  40: { emoji: '🌫️', nom: 'Nappe', famille: 'nuages', intensite_min: 3, intensite_max: 5, description: 'Routine épaisse, train-train quotidien', couleur: '#C0C0C0', messages: ['Cette nappe de routine cache des surprises', 'Ton train-train quotidien a sa beauté', 'Cette épaisseur du quotidien te protège'] },

  // ❄️ FAMILLE NEIGE (41-50)
  41: { emoji: '❄️', nom: 'Flocon', famille: 'neige', intensite_min: 1, intensite_max: 3, description: 'Détachement doux, retrait léger', couleur: '#F0F8FF', messages: ['Ce flocon de retrait a sa grâce', 'Ton détachement doux te préserve', 'Cette distance légère te ressource'] },
  42: { emoji: '🌨️', nom: 'Neige Fine', famille: 'neige', intensite_min: 2, intensite_max: 4, description: 'Anesthésie émotionnelle, engourdissement', couleur: '#E6E6FA', messages: ['Cette neige fine endort tes blessures', 'Cette anesthésie émotionnelle te soigne', 'Cet engourdissement temporaire te protège'] },
  43: { emoji: '☃️', nom: 'Neige Épaisse', famille: 'neige', intensite_min: 4, intensite_max: 6, description: 'Isolation profonde, cocon de silence', couleur: '#F5F5F5', messages: ['Cette neige épaisse t\'isole en douceur', 'Ton cocon de silence te régénère', 'Cette isolation profonde te ressource'] },
  44: { emoji: '❄️', nom: 'Blizzard', famille: 'neige', intensite_min: 7, intensite_max: 10, description: 'Coupure totale, monde extérieur effacé', couleur: '#DCDCDC', messages: ['Ce blizzard émotionnel va s\'apaiser', 'Cette coupure totale te recentre', 'Ton monde intérieur résiste au froid'] },
  45: { emoji: '🌨️', nom: 'Poudrerie', famille: 'neige', intensite_min: 3, intensite_max: 5, description: 'Détachement tourbillonnant, fuite', couleur: '#F8F8FF', messages: ['Cette poudrerie danse avec tes émotions', 'Ton détachement tourbillonnant cherche terre', 'Cette fuite en spirale trouve son centre'] },
  46: { emoji: '❄️', nom: 'Cristaux', famille: 'neige', intensite_min: 2, intensite_max: 4, description: 'Beauté froide, émotion gelée', couleur: '#B0E0E6', messages: ['Ces cristaux d\'émotion ont leur beauté', 'Cette froideur émotionnelle protège', 'Ta beauté gelée attend le dégel'] },
  47: { emoji: '🌨️', nom: 'Neige Lourde', famille: 'neige', intensite_min: 5, intensite_max: 7, description: 'Poids du silence, écrasement doux', couleur: '#C0C0C0', messages: ['Cette neige lourde porte tes secrets', 'Ce poids du silence a sa sagesse', 'Cet écrasement doux te fait plier, pas casser'] },
  48: { emoji: '❄️', nom: 'Verglas', famille: 'neige', intensite_min: 4, intensite_max: 6, description: 'Surface glissante, relations fragiles', couleur: '#AFEEEE', messages: ['Ce verglas émotionnel demande prudence', 'Ces relations fragiles méritent attention', 'Cette surface glissante t\'apprend l\'équilibre'] },
  49: { emoji: '🌨️', nom: 'Neige Nocturne', famille: 'neige', intensite_min: 3, intensite_max: 5, description: 'Solitude blanche, retrait nocturne', couleur: '#F0F0F0', messages: ['Cette neige nocturne berce ta solitude', 'Ton retrait blanc purifie l\'âme', 'Cette solitude neigeuse a sa poésie'] },
  50: { emoji: '❄️', nom: 'Manteau Blanc', famille: 'neige', intensite_min: 6, intensite_max: 8, description: 'Protection glacée, armure émotionnelle', couleur: '#FFFAFA', messages: ['Ce manteau blanc te protège du monde', 'Cette armure émotionnelle a son utilité', 'Ta protection glacée préserve l\'essentiel'] },

  // 🌫️ FAMILLE BROUILLARD (51-60)
  51: { emoji: '🌫️', nom: 'Brume', famille: 'brouillard', intensite_min: 1, intensite_max: 3, description: 'Confusion légère, flou mental', couleur: '#F5F5F5', messages: ['Cette brume légère va se dissiper', 'Ton flou mental cherche clarté', 'Cette confusion douce porte des réponses'] },
  52: { emoji: '🌁', nom: 'Brouillard Dense', famille: 'brouillard', intensite_min: 6, intensite_max: 8, description: 'Perte de repères, égarement total', couleur: '#D3D3D3', messages: ['Ce brouillard dense cache le chemin temporairement', 'Ton égarement total trouvera sa voie', 'Cette perte de repères prépare une découverte'] },
  53: { emoji: '🌫️', nom: 'Voile Matinal', famille: 'brouillard', intensite_min: 2, intensite_max: 4, description: 'Incertitude naissante, doutes du réveil', couleur: '#E6E6FA', messages: ['Ce voile matinal se lèvera avec le jour', 'Tes doutes du réveil sont naturels', 'Cette incertitude naissante appelle patience'] },
  54: { emoji: '🌁', nom: 'Purée de Pois', famille: 'brouillard', intensite_min: 7, intensite_max: 9, description: 'Confusion épaisse, incompréhension', couleur: '#A9A9A9', messages: ['Cette purée de pois émotionnelle s\'éclaircira', 'Ton incompréhension épaisse demande temps', 'Cette confusion dense cache une révélation'] },
  55: { emoji: '🌫️', nom: 'Brouillard Givrant', famille: 'brouillard', intensite_min: 4, intensite_max: 6, description: 'Doute froid, incertitude glacée', couleur: '#B0E0E6', messages: ['Ce brouillard givrant cristallise tes questions', 'Ton doute froid préserve du mauvais choix', 'Cette incertitude glacée ralentit avec sagesse'] },
  56: { emoji: '🌁', nom: 'Mer de Nuages', famille: 'brouillard', intensite_min: 5, intensite_max: 7, description: 'Perspective perdue, hauteur confuse', couleur: '#C0C0C0', messages: ['Cette mer de nuages cache la terre ferme', 'Ta perspective perdue retrouvera l\'horizon', 'Cette hauteur confuse t\'élève malgré tout'] },
  57: { emoji: '🌫️', nom: 'Brume de Chaleur', famille: 'brouillard', intensite_min: 3, intensite_max: 5, description: 'Confusion estivale, flou ardent', couleur: '#FFEFD5', messages: ['Cette brume de chaleur porte tes passions', 'Ton flou ardent cherche direction', 'Cette confusion estivale a sa fougue'] },
  58: { emoji: '🌁', nom: 'Brouillard Nocturne', famille: 'brouillard', intensite_min: 6, intensite_max: 8, description: 'Mystère épais, nuit d\'incertitude', couleur: '#2F2F2F', messages: ['Ce brouillard nocturne garde ses mystères', 'Cette nuit d\'incertitude prépare l\'aube', 'Ce mystère épais protège tes secrets'] },
  59: { emoji: '🌫️', nom: 'Nappes Flottantes', famille: 'brouillard', intensite_min: 2, intensite_max: 4, description: 'Doutes mobiles, questions volantes', couleur: '#F0F8FF', messages: ['Ces nappes flottantes portent tes interrogations', 'Tes doutes mobiles cherchent ancrage', 'Ces questions volantes trouveront réponse'] },
  60: { emoji: '🌁', nom: 'Brouillard Éternel', famille: 'brouillard', intensite_min: 8, intensite_max: 10, description: 'Confusion existentielle, questionnement profond', couleur: '#696969', messages: ['Ce brouillard éternel porte tes grandes questions', 'Cette confusion existentielle te grandit', 'Ce questionnement profond te fait philosopher'] }
};

// 🧠 SYSTEM PROMPT MISTRAL FRANÇAIS ROBUSTE
const SYSTEM_PROMPT = `Tu es MoodMap, assistant d'intelligence émotionnelle en français.

RÈGLES STRICTES:
- Réponds EXCLUSIVEMENT en français
- Analyse l'émotion GLOBALE du message (ignore les fautes d'orthographe)
- "moin" = "moins", "mieu" = "mieux", etc. - devine l'intention
- N'invente JAMAIS de noms de personnes non mentionnés
- Si pas de prénom explicite, ne mets rien dans "personnes"

ANALYSE ÉMOTIONNELLE:
- Émotion principale parmi: joie, tristesse, colere, ennui, detachement, confusion
- Intensité 1-10 selon le ressenti global
- Contexte: lieu, activité, moment SEULEMENT si explicites

FORMAT JSON OBLIGATOIRE - RETOURNE UNIQUEMENT LE JSON PUR, PAS DE MARKDOWN:
{
  "emotion": "joie|tristesse|colere|ennui|detachement|confusion",
  "intensite": [1-10],
  "contexte": {
    "lieu": "bureau|maison|transport|null",
    "activite": "travail|sport|repos|social|null", 
    "personnes": ["nom1", "nom2"] ou [],
    "moment": "matin|apres-midi|soir|null"
  },
  "message_poetique": "Message empathique français personnalisé",
  "observation": "Insight psychologique bienveillant français"
}

CRITIQUE: N'encadre PAS le JSON avec des balises markdown - retourne DIRECTEMENT le JSON !
IMPORTANT: Si analyse impossible, retourne emotion "confusion" et intensité 5.`;

// 💾 STOCKAGE EN MÉMOIRE (Journal personnel)
const journal = new Map();

// 🔤 SYSTÈME FALLBACK ENRICHI (50+ mots-clés par émotion)
const FALLBACK_SYSTEM = {
  joie: {
    mots: ['heureux', 'heureuse', 'joie', 'joyeux', 'joyeuse', 'content', 'contente', 'bien', 'super', 'genial', 'excellent', 'formidable', 'fantastique', 'merveilleux', 'merveilleuse', 'parfait', 'parfaite', 'top', 'cool', 'incroyable', 'epanoui', 'epanouie', 'rayonne', 'rayonnant', 'sourire', 'souriant', 'rire', 'rigole', 'bonheur', 'enthousiasme', 'motive', 'inspire', 'reussi', 'reussir', 'reussite', 'succes', 'victoire', 'gagne', 'gagnant', 'triomphe', 'fier', 'fiere', 'satisfait', 'satisfaite', 'ca marche', 'c\'est bon', 'nickel', 'sans doute', 'j\'ai reussi', 'trop bien', 'au top'],
    meteorites: [2, 4, 6, 7, 8, 10], // IDs météos soleil
    messages: ['Cette lumière vient de toi', 'Ton énergie rayonne naturellement', 'Cette joie t\'appartient pleinement']
  },
  tristesse: {
    mots: ['triste', 'tristesse', 'deprime', 'deprimee', 'mal', 'malheureux', 'malheureuse', 'melancolie', 'melancolique', 'cafard', 'bourdon', 'pleure', 'pleurs', 'larmes', 'chagrin', 'peine', 'nostalgie', 'nostalgique', 'epuise', 'epuisee', 'creve', 'crevee', 'lessive', 'lessivee', 'vide', 'videe', 'fatigue', 'fatiguee', 'use', 'usee', 'bout', 'fini', 'finie', 'naze', 'claque', 'claquee', 'decourage', 'decouragee', 'desespoir', 'desespere', 'demotive', 'demotivee', 'abattu', 'abattue', 'ca va pas', 'c\'est dur', 'j\'en peux plus', 'ras le bol', 'marre', 'galere'],
    meteorites: [11, 12, 13, 16, 17, 19], // IDs météos pluie
    messages: ['Cette peine mérite compassion', 'Tes larmes nourrissent demain', 'Cette tristesse a sa propre vérité']
  },
  colere: {
    mots: ['enerve', 'enervee', 'colere', 'furieux', 'furieuse', 'rage', 'rageur', 'rageuse', 'irrite', 'irritee', 'agace', 'agacee', 'frustre', 'frustree', 'exaspere', 'exasperee', 'bouillir', 'exploser', 'fulminer', 'en colere', 'hors de moi', 'bout de nerfs', 'pete un cable', 'pete les plombs', 'voir rouge', 'ca m\'enerve', 'insupportable', 'intolerable', 'bloque', 'bloquee', 'coince', 'coincee', 'limite', 'limitee', 'empeche', 'empechee', 'freine', 'freinee', 'contrarie', 'contrariee', 'tension', 'tendu', 'tendue', 'stress', 'stresse', 'stressée'],
    meteorites: [21, 23, 24, 25, 27, 30], // IDs météos orage
    messages: ['Cette colère porte un message', 'Ta frustration dit quelque chose d\'important', 'Cette rage cache une blessure']
  },
  ennui: {
    mots: ['ennui', 'ennuie', 'ennuyeux', 'ennuyeuse', 'morne', 'monotone', 'gris', 'grise', 'bof', 'moyen', 'moyenne', 'ordinaire', 'banal', 'banale', 'fade', 'plat', 'plate', 'routine', 'habituel', 'habituelle', 'ca va', 'normal', 'normale', 'comme d\'habitude', 'tranquille', 'calme', 'paisible', 'neutre', 'rien de special', 'sans plus', 'quelconque', 'sans relief', 'plat', 'terne', 'classique', 'standard', 'moyen', 'lambda', 'basique', 'simple', 'correct', 'acceptable', 'decent', 'honnete', 'convenable'],
    meteorites: [31, 33, 34, 35, 38, 39], // IDs météos nuages
    messages: ['Cette tranquillité a sa valeur', 'Ton calme intérieur est précieux', 'Cette normalité prépare du changement']
  },
  detachement: {
    mots: ['detache', 'detachee', 'distant', 'distante', 'froid', 'froide', 'indifferent', 'indifferente', 'absent', 'absente', 'ailleurs', 'coupe', 'coupee', 'isole', 'isolee', 'retire', 'retiree', 'deconnecte', 'deconnectee', 'vide', 'engourdi', 'engourdie', 'anesthesie', 'anesthesiee', 'robot', 'automatique', 'mecanique', 'sans emotion', 'eteint', 'eteinte', 'mort', 'morte', 'zombie', 'fantome', 'invisible', 'transparent', 'transparente', 'inexistant', 'inexistante', 'neutre', 'blanc', 'blanche', 'gele', 'gelee', 'glace', 'glacee', 'cristallise'],
    meteorites: [41, 42, 43, 44, 47, 50], // IDs météos neige
    messages: ['Ce retrait te protège', 'Cette distance préserve ton énergie', 'Cet engourdissement a son utilité']
  },
  confusion: {
    mots: ['confus', 'confuse', 'confusion', 'perdu', 'perdue', 'flou', 'floue', 'incertain', 'incertaine', 'perplexe', 'hesitant', 'hesitante', 'doute', 'indecis', 'indecise', 'incomprehension', 'brumeux', 'brumeuse', 'embrouille', 'embrouillee', 'sais pas', 'comprends pas', 'pige pas', 'pourquoi', 'comment', 'bizarre', 'etrange', 'complique', 'compliquee', 'difficile', 'dur a comprendre', 'mystere', 'mysterieux', 'mysterieuse', 'je sais plus', 'c\'est flou', 'pas clair', 'je comprends rien', 'qu\'est-ce qui se passe', 'je suis paume', 'je suis larguee', 'trouble', 'troublee', 'melange', 'melangee'],
    meteorites: [51, 52, 54, 56, 58, 60], // IDs météos brouillard
    messages: ['Cette confusion porte des réponses', 'Ton questionnement a sa sagesse', 'Ce flou prépare une clarté nouvelle']
  }
};

// 🎯 FONCTION MAPPING ÉMOTION → MÉTÉO
function mapperEmotionVersMeteo(emotion, intensite) {
  console.log(`🎯 Mapping: ${emotion} (intensité ${intensite})`);
  
  // Mapping correct émotions → familles météo
  const familleMapping = {
    'joie': 'soleil',
    'tristesse': 'pluie', 
    'colere': 'orage',
    'ennui': 'nuages',
    'detachement': 'neige',
    'confusion': 'brouillard'
  };
  
  const famille = familleMapping[emotion.toLowerCase()] || 'brouillard';
  console.log(`🎯 Famille sélectionnée: ${famille}`);
  
  // Sélectionner les météos de la famille correspondante
  const meteorites = Object.values(METEO_SYSTEM).filter(meteo => meteo.famille === famille);
  console.log(`🎯 Météos disponibles (${famille}):`, meteorites.length);
  
  if (meteorites.length === 0) {
    console.log('⚠️ Aucune météo trouvée, fallback vers Brume');
    return METEO_SYSTEM[51]; // Brume (ID 51)
  }
  
  // Trouver la météo qui correspond le mieux à l'intensité
  const meteoAdaptee = meteorites.find(meteo => 
    intensite >= meteo.intensite_min && intensite <= meteo.intensite_max
  );
  
  if (meteoAdaptee) {
    console.log(`✅ Météo trouvée: ${meteoAdaptee.emoji} ${meteoAdaptee.nom}`);
    return meteoAdaptee;
  } else {
    // Fallback vers milieu de gamme de la famille
    const meteoFallback = meteorites[Math.floor(meteorites.length / 2)];
    console.log(`⚠️ Pas de météo exacte, fallback famille: ${meteoFallback.emoji} ${meteoFallback.nom}`);
    return meteoFallback;
  }
}

// 🤖 FONCTION ANALYSE MISTRAL AI
async function analyserAvecMistralAI(message) {
  try {
    const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
      model: 'mistral-small-latest',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyse ce message: "${message}"` }
      ],
      temperature: 0.3,
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const aiResponse = response.data.choices[0].message.content;
    console.log('🧠 Réponse IA Mistral:', aiResponse);
    
    // Nettoyer la réponse si elle contient des balises markdown
    let cleanResponse = aiResponse.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Parser le JSON retourné par Mistral
    const analysis = JSON.parse(cleanResponse);
    
    // Validation et nettoyage
    const emotions_valides = ['joie', 'tristesse', 'colere', 'ennui', 'detachement', 'confusion'];
    if (!emotions_valides.includes(analysis.emotion)) {
      analysis.emotion = 'confusion';
    }
    
    analysis.intensite = Math.max(1, Math.min(10, analysis.intensite || 5));
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Erreur Mistral AI:', error.message);
    return null; // Déclenche le fallback
  }
}

// 🛡️ FONCTION FALLBACK ENRICHIE
function analyserAvecFallback(message) {
  console.log('⚠️ Mode fallback activé - IA temporairement indisponible');
  
  const messageLower = message.toLowerCase();
  let emotion_detectee = 'confusion';
  let score_max = 0;
  
  // Analyse par mots-clés enrichis
  for (const [emotion, data] of Object.entries(FALLBACK_SYSTEM)) {
    let score = 0;
    for (const mot of data.mots) {
      if (messageLower.includes(mot)) {
        score += 1;
      }
    }
    if (score > score_max) {
      score_max = score;
      emotion_detectee = emotion;
    }
  }
  
  const intensite = Math.min(10, Math.max(1, score_max * 2 + 2));
  const fallback_data = FALLBACK_SYSTEM[emotion_detectee];
  
  return {
    emotion: emotion_detectee,
    intensite: intensite,
    contexte: { lieu: null, activite: null, personnes: [], moment: null },
    message_poetique: fallback_data.messages[Math.floor(Math.random() * fallback_data.messages.length)],
    observation: 'Analyse simplifiée en cours - ton ressenti mérite une écoute attentive.',
    fallback: true
  };
}

// 📊 FONCTION HABITUDES/PATTERNS AVANCÉES
function analyserHabitudes(fromNumber) {
  const cartes = journal.get(fromNumber) || [];
  if (cartes.length < 2) {
    return {
      message: '📈 Pas encore assez de données pour détecter tes habitudes émotionnelles.\n\nContinue à partager tes états d\'esprit pour que je puisse identifier tes patterns personnels ! 🌱',
      patterns: []
    };
  }
  
  let report = '📊 ═══ TES HABITUDES ÉMOTIONNELLES ═══\n\n';
  report += `📈 ${cartes.length} analyses dans ton journal\n\n`;
  
  // Répartition par famille météo
  const families = {};
  cartes.forEach(carte => {
    const famille = carte.meteo_famille || 'autre';
    families[famille] = (families[famille] || 0) + 1;
  });
  
  report += '🌈 RÉPARTITION MÉTÉOROLOGIQUE:\n';
  for (const [famille, count] of Object.entries(families)) {
    const pourcentage = Math.round((count / cartes.length) * 100);
    const emoji = famille === 'soleil' ? '☀️' : famille === 'pluie' ? '🌧️' : famille === 'orage' ? '⛈️' : famille === 'nuages' ? '☁️' : famille === 'neige' ? '❄️' : '🌫️';
    report += `${emoji} ${famille.toUpperCase()}: ${pourcentage}% (${count}/${cartes.length})\n`;
  }
  
  // Lieux récurrents
  const lieux = {};
  cartes.forEach(carte => {
    if (carte.contexte?.lieu) {
      lieux[carte.contexte.lieu] = (lieux[carte.contexte.lieu] || 0) + 1;
    }
  });
  
  if (Object.keys(lieux).length > 0) {
    report += '\n📍 ÉMOTIONS PAR LIEU:\n';
    for (const [lieu, count] of Object.entries(lieux)) {
      if (count >= 2) {
        const cartes_lieu = cartes.filter(c => c.contexte?.lieu === lieu);
        const familles_lieu = {};
        cartes_lieu.forEach(c => {
          const fam = c.meteo_famille || 'autre';
          familles_lieu[fam] = (familles_lieu[fam] || 0) + 1;
        });
        const famille_dominante = Object.entries(familles_lieu).sort((a,b) => b[1] - a[1])[0];
        const emoji_lieu = lieu === 'bureau' ? '🏢' : lieu === 'maison' ? '🏠' : lieu === 'transport' ? '🚗' : '📍';
        const emoji_meteo = famille_dominante[0] === 'soleil' ? '☀️' : famille_dominante[0] === 'pluie' ? '🌧️' : famille_dominante[0] === 'orage' ? '⛈️' : '☁️';
        const pourcentage = Math.round((famille_dominante[1] / cartes_lieu.length) * 100);
        report += `${emoji_lieu} ${lieu.toUpperCase()}: ${emoji_meteo} ${pourcentage}% (${famille_dominante[1]}/${cartes_lieu.length})\n`;
      }
    }
  }
  
  // Personnes influentes
  const personnes = {};
  cartes.forEach(carte => {
    if (carte.contexte?.personnes) {
      carte.contexte.personnes.forEach(personne => {
        personnes[personne] = (personnes[personne] || 0) + 1;
      });
    }
  });
  
  if (Object.keys(personnes).length > 0) {
    report += '\n👥 INFLUENCES RELATIONNELLES:\n';
    for (const [personne, count] of Object.entries(personnes)) {
      if (count >= 2) {
        const cartes_personne = cartes.filter(c => c.contexte?.personnes?.includes(personne));
        const familles_personne = {};
        cartes_personne.forEach(c => {
          const fam = c.meteo_famille || 'autre';
          familles_personne[fam] = (familles_personne[fam] || 0) + 1;
        });
        const famille_dominante = Object.entries(familles_personne).sort((a,b) => b[1] - a[1])[0];
        const emoji_meteo = famille_dominante[0] === 'soleil' ? '☀️' : famille_dominante[0] === 'pluie' ? '🌧️' : famille_dominante[0] === 'orage' ? '⛈️' : '☁️';
        const pourcentage = Math.round((famille_dominante[1] / cartes_personne.length) * 100);
        report += `👤 Avec ${personne}: ${emoji_meteo} ${pourcentage}% (${famille_dominante[1]}/${cartes_personne.length})\n`;
      }
    }
  }
  
  // Évolution récente
  if (cartes.length >= 5) {
    const recent = cartes.slice(-3);
    const ancien = cartes.slice(-6, -3);
    
    if (ancien.length > 0) {
      const intensite_ancienne = ancien.reduce((sum, c) => sum + c.intensite, 0) / ancien.length;
      const intensite_recente = recent.reduce((sum, c) => sum + c.intensite, 0) / recent.length;
      const evolution = intensite_recente - intensite_ancienne;
      
      report += '\n📈 ÉVOLUTION RÉCENTE:\n';
      if (evolution > 0.5) {
        report += '📈 Tendance à l\'amélioration émotionnelle\n';
      } else if (evolution < -0.5) {
        report += '📉 Période plus difficile détectée\n';
      } else {
        report += '📊 Stabilité émotionnelle maintenue\n';
      }
    }
  }
  
  report += '\n━━━━━━━━━━━━━━━━━━━\n';
  report += '💡 Ces habitudes révèlent tes patterns émotionnels uniques.';
  
  return { message: report, patterns: Object.keys(lieux).concat(Object.keys(personnes)) };
}

// 🌤️ ROUTE PRINCIPALE WEBHOOK
app.post('/webhook', async (req, res) => {
  try {
    const incomingMessage = req.body.Body?.trim() || '';
    const fromNumber = req.body.From || '';
    
    console.log(`📱 Message reçu de ${fromNumber}: "${incomingMessage}"`);
    
    if (!incomingMessage) {
      return res.status(200).send('OK');
    }
    
    const twiml = new twilio.twiml.MessagingResponse();
    let responseMessage = '';
    
    // 📚 Commande JOURNAL (priorité sur message d'accueil)
    if (incomingMessage.toLowerCase().includes('journal') || 
        incomingMessage.toLowerCase().includes('climato') ||
        incomingMessage.toLowerCase().includes('historique')) {
      
      const cartes = journal.get(fromNumber) || [];
      
      if (cartes.length === 0) {
        responseMessage = `📚 ═══ TON JOURNAL MÉTÉO ═══\n\n`;
        responseMessage += `🌱 Ton journal est encore vide\n\n`;
        responseMessage += `✨ Partage-moi ton état d'esprit\n`;
        responseMessage += `   pour créer ta première carte météo !\n\n`;
        responseMessage += `💡 Exemple : "Je me sens bien ce matin"`;
      } else {
        responseMessage = `📚 ═══ TON JOURNAL MÉTÉO ═══\n\n`;
        responseMessage += `💎 ${cartes.length} carte${cartes.length > 1 ? 's' : ''} dans ta collection\n\n`;
        
        // Afficher les 5 dernières cartes
        const cartesRecentes = cartes.slice(-5).reverse();
        cartesRecentes.forEach((carte, index) => {
          const intensiteBar = '●'.repeat(carte.intensite) + '○'.repeat(10 - carte.intensite);
          responseMessage += `${carte.meteo_emoji} ${carte.meteo_nom}\n`;
          responseMessage += `${intensiteBar} ${carte.intensite}/10\n`;
          responseMessage += `📅 ${carte.date} • ${carte.heure}\n`;
          if (index < cartesRecentes.length - 1) responseMessage += `\n`;
        });
        
        if (cartes.length > 5) {
          responseMessage += `\n━━━━━━━━━━━━━━━━━━━\n`;
          responseMessage += `📊 ... et ${cartes.length - 5} autres cartes\n`;
          responseMessage += `💫 Tape "habitudes" pour voir tes patterns !`;
        }
      }
      
      twiml.message(responseMessage);
      return res.type('text/xml').send(twiml.toString());
    }
    
    // 📊 Commande HABITUDES/PATTERNS (priorité sur message d'accueil)
    if (incomingMessage.toLowerCase().includes('habitudes') || 
        incomingMessage.toLowerCase().includes('pattern') ||
        incomingMessage.toLowerCase().includes('tendance') ||
        incomingMessage.toLowerCase().includes('statistique')) {
      
      const analyse = analyserHabitudes(fromNumber);
      twiml.message(analyse.message);
      return res.type('text/xml').send(twiml.toString());
    }
    
    // 🆘 COMMANDES SPÉCIALES - Message d'accueil pour messages courts
    if (incomingMessage.length <= 8 || 
        ['help', 'aide', 'menu', '?', 'salut', 'hello', 'hi', 'bonjour', 'bonsoir', 'test'].includes(incomingMessage.toLowerCase())) {
      
      responseMessage = `🌤️ ═══ BIENVENUE SUR MOODMAP ═══\n\n`;
      responseMessage += `👋 Salut ! Je suis ton assistant d'intelligence émotionnelle.\n\n`;
      responseMessage += `💬 COMMENT ÇA MARCHE :\n`;
      responseMessage += `Décris-moi ton état d'esprit en une phrase :\n`;
      responseMessage += `• "Je me sens stressé au travail"\n`;
      responseMessage += `• "Super heureuse avec mes amis"\n`;
      responseMessage += `• "Un peu confus aujourd'hui"\n\n`;
      responseMessage += `🎯 JE VAIS :\n`;
      responseMessage += `• Analyser ton émotion avec l'IA Mistral\n`;
      responseMessage += `• Te donner ta "météo émotionnelle" 🌦️\n`;
      responseMessage += `• Détecter tes habitudes personnelles\n`;
      responseMessage += `• Générer des observations empathiques\n\n`;
      responseMessage += `📚 COMMANDES UTILES :\n`;
      responseMessage += `• "journal" → Ton historique complet\n`;
      responseMessage += `• "habitudes" → Tes corrélations intelligentes\n\n`;
      responseMessage += `━━━━━━━━━━━━━━━━━━━\n`;
      responseMessage += `✨ Essaie maintenant avec ton humeur du moment !`;
      
      twiml.message(responseMessage);
      return res.type('text/xml').send(twiml.toString());
    }
    
    // 🧠 ANALYSE ÉMOTIONNELLE PRINCIPALE
    console.log('🔄 Analyse émotionnelle en cours...');
    
    // Essayer Mistral AI d'abord
    let analysis = await analyserAvecMistralAI(incomingMessage);
    
    // Si Mistral échoue, utiliser le fallback enrichi
    if (!analysis) {
      analysis = analyserAvecFallback(incomingMessage);
    }
    
    console.log('📊 Analyse complète:', analysis);
    
    // Mapper vers une météo des 60
    const meteo = mapperEmotionVersMeteo(analysis.emotion, analysis.intensite);
    console.log('🌦️ Météo sélectionnée:', meteo);
    
    // Générer la réponse avec le nouveau format
    const intensiteBar = '●'.repeat(analysis.intensite) + '○'.repeat(10 - analysis.intensite);
    
    responseMessage = `${meteo.emoji} ═══ ${meteo.nom.toUpperCase()} ═══\n`;
    responseMessage += `${intensiteBar} Intensité ${analysis.intensite}/10\n\n`;
    
    responseMessage += `💭 "${incomingMessage}"\n`;
    if (analysis.contexte && Object.values(analysis.contexte).some(v => v && v.length > 0)) {
      let contexteStr = '';
      if (analysis.contexte.lieu) contexteStr += `📍${analysis.contexte.lieu} `;
      if (analysis.contexte.activite) contexteStr += `⚡${analysis.contexte.activite} `;
      if (analysis.contexte.personnes && analysis.contexte.personnes.length > 0) {
        contexteStr += `👥${analysis.contexte.personnes.join(', ')} `;
      }
      if (contexteStr.trim()) {
        responseMessage += `   └ ${contexteStr.trim()}\n`;
      }
    }
    responseMessage += `\n`;
    
    responseMessage += `✨ ${analysis.message_poetique}\n\n`;
    
    // Extraire et afficher les mots-clés principaux du message
    const mots = incomingMessage.toLowerCase()
      .replace(/[^\w\sàâäéèêëïîôöùûüÿç]/g, ' ')
      .split(/\s+/)
      .filter(mot => mot.length > 3 && !['dans', 'avec', 'pour', 'sans', 'être', 'avoir', 'faire', 'dire', 'aller', 'voir', 'savoir', 'pouvoir', 'falloir', 'vouloir', 'venir', 'prendre', 'donner', 'partir', 'parler', 'demander', 'tenir', 'sembler', 'laisser', 'rester', 'devenir', 'revenir', 'sortir', 'passer', 'porter', 'mettre', 'croire', 'rendre', 'cette', 'cette', 'tous', 'tout', 'mais', 'plus', 'très', 'bien', 'alors', 'après', 'avant', 'comme', 'encore', 'jamais', 'toujours', 'aussi', 'même'].includes(mot))
      .slice(0, 4);
    
    if (mots.length > 0) {
      responseMessage += `🎯 ${mots.join(' • ')}\n\n`;
    }
    
    responseMessage += `💝 ${analysis.observation}\n\n`;
    
    // Analyser les patterns avec cette nouvelle carte
    const cartesExistantes = journal.get(fromNumber) || [];
    
    // Détecter des patterns simples
    if (cartesExistantes.length >= 2) {
      const patterns = [];
      
      // Pattern lieu + émotion
      if (analysis.contexte?.lieu) {
        const cartesLieu = cartesExistantes.filter(c => c.contexte?.lieu === analysis.contexte.lieu);
        if (cartesLieu.length >= 2) {
          const memeMeteo = cartesLieu.filter(c => c.meteo_famille === meteo.famille).length;
          const pourcentage = Math.round((memeMeteo / cartesLieu.length) * 100);
          if (pourcentage >= 60) {
            patterns.push(`📍 ${analysis.contexte.lieu}: ${meteo.emoji} dans ${pourcentage}% des cas (${memeMeteo}/${cartesLieu.length})`);
          }
        }
      }
      
      // Pattern personne + émotion
      if (analysis.contexte?.personnes && analysis.contexte.personnes.length > 0) {
        analysis.contexte.personnes.forEach(personne => {
          const cartesPersonne = cartesExistantes.filter(c => c.contexte?.personnes?.includes(personne));
          if (cartesPersonne.length >= 2) {
            const memeMeteo = cartesPersonne.filter(c => c.meteo_famille === meteo.famille).length;
            const pourcentage = Math.round((memeMeteo / cartesPersonne.length) * 100);
            if (pourcentage >= 60) {
              patterns.push(`👤 Avec ${personne}: ${meteo.emoji} dans ${pourcentage}% des cas (${memeMeteo}/${cartesPersonne.length})`);
            }
          }
        });
      }
      
      if (patterns.length > 0) {
        responseMessage += `🌀 HABITUDES DÉTECTÉES:\n`;
        patterns.forEach(pattern => {
          responseMessage += `• ${pattern}\n`;
        });
        responseMessage += `\n`;
      }
    }
    
    // Fallback warning si applicable
    if (analysis.fallback) {
      responseMessage += `⚠️ Analyse simplifiée (IA temporairement indisponible)\n\n`;
    }
    
    responseMessage += `━━━━━━━━━━━━━━━━━━━\n`;
    responseMessage += `📚 ${analysis.fallback ? 'Analysé en mode local' : 'Analysé par IA Mistral'} • Ajouté à ton journal\n`;
    responseMessage += `   └ ${new Date().toLocaleDateString('fr-FR')} • ${new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}`;
    
    // Stocker dans le journal
    const carte = {
      message_original: incomingMessage,
      emotion: analysis.emotion,
      intensite: analysis.intensite,
      meteo_emoji: meteo.emoji,
      meteo_nom: meteo.nom,
      meteo_famille: meteo.famille,
      contexte: analysis.contexte,
      message_poetique: analysis.message_poetique,
      observation: analysis.observation,
      date: new Date().toLocaleDateString('fr-FR'),
      heure: new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}),
      timestamp: Date.now(),
      fallback: analysis.fallback || false
    };
    
    if (!journal.has(fromNumber)) {
      journal.set(fromNumber, []);
    }
    journal.get(fromNumber).push(carte);
    
    // Limiter à 50 cartes par utilisateur (pour éviter la saturation mémoire)
    if (journal.get(fromNumber).length > 50) {
      journal.get(fromNumber).shift();
    }
    
    console.log(`✅ Carte météo créée et stockée pour ${fromNumber}`);
    
    twiml.message(responseMessage);
    res.type('text/xml').send(twiml.toString());
    
  } catch (error) {
    console.error('❌ Erreur webhook:', error);
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('🌫️ Une petite turbulence technique... Réessaie dans un moment ! ✨');
    res.type('text/xml').send(twiml.toString());
  }
});

// 🌐 PAGE WEB DE STATUT
app.get('/', (req, res) => {
  const stats = {
    utilisateurs: journal.size,
    total_cartes: Array.from(journal.values()).reduce((sum, cartes) => sum + cartes.length, 0),
    uptime: process.uptime()
  };
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>MoodMap Bot V4.1 Revolution</title>
        <meta charset="UTF-8">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; }
            .container { max-width: 600px; margin: 0 auto; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 2rem; }
            h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
            .subtitle { font-size: 1.2rem; opacity: 0.8; margin-bottom: 2rem; }
            .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin: 2rem 0; }
            .stat { background: rgba(255,255,255,0.1); border-radius: 10px; padding: 1rem; }
            .features { text-align: left; margin: 2rem 0; }
            .feature { margin: 0.5rem 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🌤️ MoodMap Bot V4.1</h1>
            <p class="subtitle">Assistant d'Intelligence Émotionnelle Révolutionnaire</p>
            
            <div class="stats">
                <div class="stat">
                    <h3>👥 ${stats.utilisateurs}</h3>
                    <p>Utilisateurs</p>
                </div>
                <div class="stat">
                    <h3>🎯 ${stats.total_cartes}</h3>
                    <p>Cartes Météo</p>
                </div>
                <div class="stat">
                    <h3>⚡ ${Math.floor(stats.uptime / 3600)}h</h3>
                    <p>Uptime</p>
                </div>
            </div>
            
            <div class="features">
                <h3>🚀 Fonctionnalités V4.1 :</h3>
                <div class="feature">🌈 60 météos émotionnelles ultra-précises</div>
                <div class="feature">🧠 IA Mistral pour analyse contextuelle</div>
                <div class="feature">📊 Détection d'habitudes avancées</div>
                <div class="feature">🛡️ Système fallback enrichi (50+ mots-clés)</div>
                <div class="feature">📚 Journal personnel intelligent</div>
                <div class="feature">💝 Observations empathiques personnalisées</div>
                <div class="feature">🎯 Interface utilisateur intuitive</div>
            </div>
            
            <p style="margin-top: 2rem; opacity: 0.7;">
                WhatsApp: +1 415 523 8886 (message: "join bent-mind")<br>
                Commandes: "journal", "habitudes", "aide"
            </p>
        </div>
    </body>
    </html>
  `);
});

// 🚀 DÉMARRAGE SERVEUR
app.listen(port, () => {
  console.log(`🚀 MoodMap WhatsApp Bot V4.1 REVOLUTION démarré sur port ${port}`);
  console.log(`🌈 60 météos émotionnelles: ACTIVÉES ✅`);
  console.log(`🧠 Mistral AI: ${process.env.MISTRAL_API_KEY ? 'ACTIVÉ ✅' : 'NON CONFIGURÉ ❌'}`);
  console.log(`🛡️ Fallback enrichi: ACTIVÉ ✅`);
  console.log(`📊 Habitudes avancées: ACTIVÉES ✅`);
  console.log(`💬 Vocabulaire user-friendly: ACTIVÉ ✅`);
  console.log(`📚 Journal intelligent: ACTIVÉ ✅`);
});

module.exports = app;
