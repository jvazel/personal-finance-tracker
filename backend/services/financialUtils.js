const { 
  startOfMonth, endOfMonth, subMonths, 
  startOfYear, endOfYear, subYears,
  format, parseISO, isAfter, isBefore,
  addMonths
} = require('date-fns');

// Générateur de nombres aléatoires avec seed
class SeededRandom {
  constructor(seed) {
    this.seed = seed;
  }
  
  // Algorithme simple de génération pseudo-aléatoire
  next() {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
  
  // Génère un nombre entre min et max
  nextInRange(min, max) {
    return min + this.next() * (max - min);
  }
}

// Fonction pour obtenir la plage de dates en fonction du timeframe
const getDateRange = (timeframe) => {
  const now = new Date();
  
  switch (timeframe) {
    case '1month':
      return { start: subMonths(startOfMonth(now), 1), end: now };
    case '3months':
      return { start: subMonths(now, 3), end: now };
    case '6months':
      return { start: subMonths(now, 6), end: now };
    case '1year':
      return { start: subYears(now, 1), end: now };
    default:
      return { start: subMonths(now, 3), end: now };
  }
};

// Fonction utilitaire pour remplacer les IDs par les noms de catégorie dans un texte
const replaceIdsWithCategoryNames = (text, categoriesMap) => {
  if (!text || typeof text !== 'string') return text;
  
  // Recherche des IDs MongoDB (format: 24 caractères hexadécimaux)
  return text.replace(/\b([a-f0-9]{24})\b/g, (match) => {
    // Vérifier si l'ID correspond à une catégorie
    if (categoriesMap[match]) {
      return categoriesMap[match].name;
    }
    // Si nous ne trouvons pas de correspondance, retourner l'ID tel quel
    return match;
  });
};

module.exports = {
  SeededRandom,
  getDateRange,
  replaceIdsWithCategoryNames
};