const FinancialProgress = require('../models/FinancialProgress');
const SavedRecommendation = require('../models/SavedRecommendation');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Goal = require('../models/Goal');

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

// Fonction pour analyser les tendances de dépenses
const analyzeSpendingTrends = async (userId, timeframe) => {
  const { start, end } = getDateRange(timeframe);
  
  // Récupérer toutes les transactions pour la période
  const transactions = await Transaction.find({
    user: userId, // CORRECTION: userId -> user: userId
    date: { $gte: start, $lte: end }
  }).sort({ date: 1 });
  
  // Regrouper les transactions par mois et par catégorie
  const monthlySpendingByCategory = {};
  
  transactions.forEach(transaction => {
    const month = format(new Date(transaction.date), 'yyyy-MM');
    const { category, type, amount } = transaction;
    
    if (!monthlySpendingByCategory[month]) {
      monthlySpendingByCategory[month] = {
        total: { income: 0, expense: 0 },
        categories: {}
      };
    }
    
    // Mettre à jour les totaux
    if (type === 'income') {
      monthlySpendingByCategory[month].total.income += amount;
    } else if (type === 'expense') {
      monthlySpendingByCategory[month].total.expense += Math.abs(amount);
      
      // Mettre à jour les catégories
      if (!monthlySpendingByCategory[month].categories[category]) {
        monthlySpendingByCategory[month].categories[category] = 0;
      }
      monthlySpendingByCategory[month].categories[category] += Math.abs(amount);
    }
  });
  
  // Analyser les tendances
  const insights = [];
  const months = Object.keys(monthlySpendingByCategory).sort();
  
  // Pas assez de données pour l'analyse
  if (months.length < 2) {
    return { insights, monthlySpendingByCategory, months };
  }
  
  // Comparer le mois le plus récent avec le mois précédent
  const currentMonth = months[months.length - 1];
  const previousMonth = months[months.length - 2];
  
  if (monthlySpendingByCategory[currentMonth] && monthlySpendingByCategory[previousMonth]) {
    const currentTotal = monthlySpendingByCategory[currentMonth].total.expense;
    const previousTotal = monthlySpendingByCategory[previousMonth].total.expense;
    
    // Analyser la variation des dépenses totales
    const totalDiff = currentTotal - previousTotal;
    const totalDiffPercent = (totalDiff / previousTotal) * 100;
    
    if (Math.abs(totalDiffPercent) > 10) {
      insights.push({
        type: totalDiff > 0 ? 'spending_increase' : 'spending_decrease',
        title: totalDiff > 0 
          ? 'Augmentation significative des dépenses' 
          : 'Diminution significative des dépenses',
        description: totalDiff > 0 
          ? `Vos dépenses ont augmenté de ${Math.abs(totalDiffPercent).toFixed(1)}% par rapport au mois précédent.` 
          : `Vos dépenses ont diminué de ${Math.abs(totalDiffPercent).toFixed(1)}% par rapport au mois précédent.`,
        severity: totalDiff > 0 ? 'medium' : 'low',
        category: 'Dépenses totales',
        impact: totalDiff > 0 ? 'Négatif' : 'Positif'
      });
    }
    
    // Analyser les variations par catégorie
    const currentCategories = monthlySpendingByCategory[currentMonth].categories;
    const previousCategories = monthlySpendingByCategory[previousMonth].categories;
    
    Object.keys(currentCategories).forEach(category => {
      if (previousCategories[category]) {
        const currentAmount = currentCategories[category];
        const previousAmount = previousCategories[category];
        const diff = currentAmount - previousAmount;
        const diffPercent = (diff / previousAmount) * 100;
        
        // Signaler les variations importantes par catégorie
        if (Math.abs(diffPercent) > 20 && Math.abs(diff) > 50) {
          insights.push({
            type: diff > 0 ? 'spending_increase' : 'spending_decrease',
            title: `${diff > 0 ? 'Augmentation' : 'Diminution'} des dépenses en ${category}`,
            description: `Vos dépenses en ${category} ont ${diff > 0 ? 'augmenté' : 'diminué'} de ${Math.abs(diffPercent).toFixed(1)}% (${Math.abs(diff).toFixed(2)} €).`,
            severity: diff > 0 ? 'medium' : 'low',
            category: category,
            impact: diff > 0 ? 'Négatif' : 'Positif'
          });
        }
      } else if (currentCategories[category] > 100) {
        // Nouvelle catégorie de dépenses significative
        insights.push({
          type: 'pattern',
          title: `Nouvelle catégorie de dépenses: ${category}`,
          description: `Vous avez dépensé ${currentCategories[category].toFixed(2)} € en ${category} ce mois-ci, alors que vous n'aviez pas de dépenses dans cette catégorie le mois précédent.`,
          severity: 'low',
          category: category
        });
      }
    });
  }
  
  // Analyser le ratio épargne/revenu
  const savingsRatios = months.map(month => {
    const { income, expense } = monthlySpendingByCategory[month].total;
    return {
      month,
      ratio: income > 0 ? ((income - expense) / income) * 100 : 0
    };
  });
  
  const currentSavingsRatio = savingsRatios[savingsRatios.length - 1].ratio;
  
  if (currentSavingsRatio < 10) {
    insights.push({
      type: 'warning',
      title: 'Taux d\'épargne faible',
      description: `Votre taux d'épargne actuel est de ${currentSavingsRatio.toFixed(1)}%. Un taux d'épargne d'au moins 20% est recommandé pour une bonne santé financière.`,
      severity: 'high',
      category: 'Épargne',
      impact: 'Négatif'
    });
  } else if (currentSavingsRatio > 30) {
    insights.push({
      type: 'achievement',
      title: 'Excellent taux d\'épargne',
      description: `Félicitations! Votre taux d'épargne actuel est de ${currentSavingsRatio.toFixed(1)}%, ce qui est excellent pour votre santé financière à long terme.`,
      severity: 'low',
      category: 'Épargne',
      impact: 'Positif'
    });
  }
  
  // Détecter les dépenses récurrentes élevées
  const recurringHighExpenses = {};
  
  months.forEach(month => {
    const categories = monthlySpendingByCategory[month].categories;
    Object.keys(categories).forEach(category => {
      if (categories[category] > 300) {
        if (!recurringHighExpenses[category]) {
          recurringHighExpenses[category] = 0;
        }
        recurringHighExpenses[category]++;
      }
    });
  });
  
  Object.keys(recurringHighExpenses).forEach(category => {
    if (recurringHighExpenses[category] >= Math.min(3, months.length)) {
      insights.push({
        type: 'pattern',
        title: `Dépenses élevées récurrentes en ${category}`,
        description: `Vous avez des dépenses élevées récurrentes en ${category}. Examinez si vous pouvez optimiser ces dépenses.`,
        severity: 'medium',
        category: category,
        impact: 'Négatif'
      });
    }
  });
  
  return { insights, monthlySpendingByCategory, months };
};

// Fonction pour analyser les objectifs financiers
const analyzeFinancialGoals = async (userId) => {
  // Récupérer les objectifs de l'utilisateur
  const goals = await Goal.find({ user: userId });
  const insights = [];
  
  if (goals.length === 0) {
    insights.push({
      type: 'warning',
      title: 'Aucun objectif financier défini',
      description: 'Définir des objectifs financiers clairs vous aidera à mieux planifier votre avenir financier.',
      severity: 'medium',
      category: 'Objectifs',
      impact: 'Négatif'
    });
  } else {
    // Analyser la progression vers les objectifs
    for (const goal of goals) {
      const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
      
      if (progressPercentage < 25) {
        insights.push({
          type: 'warning',
          title: `Progression lente vers l'objectif: ${goal.title}`,
          description: `Vous avez atteint seulement ${progressPercentage.toFixed(1)}% de votre objectif "${goal.title}". Envisagez d'augmenter vos contributions mensuelles.`, // Changed from goal.name to goal.title
          severity: 'medium',
          category: 'Objectifs',
          impact: 'Négatif'
        });
      } else if (progressPercentage >= 90) {
        insights.push({
          type: 'achievement',
          title: `Objectif presque atteint: ${goal.title}`,
          description: `Félicitations! Vous avez atteint ${progressPercentage.toFixed(1)}% de votre objectif "${goal.title}". Continuez ainsi!`, // Changed from goal.name to goal.title
          severity: 'low',
          category: 'Objectifs',
          impact: 'Positif'
        });
      }
    }
  }
  
  return insights;
};

// Fonction pour générer des recommandations basées sur les insights
const generateRecommendations = (insights, monthlySpendingByCategory, months) => {
  const recommendations = [];
  
  // Pas assez de données
  if (months.length < 2 || insights.length === 0) {
    return recommendations;
  }
  
  // Recommandations basées sur les insights
  insights.forEach(insight => {
    if (insight.type === 'spending_increase' && insight.severity === 'medium') {
      recommendations.push({
        title: `Réduire les dépenses en ${insight.category}`,
        description: `Vos dépenses en ${insight.category} ont augmenté significativement. Considérez les moyens de les réduire.`,
        difficulty: 'Moyenne',
        potentialImpact: 'Élevé',
        steps: [
          `Analysez en détail vos dépenses en ${insight.category}`,
          'Identifiez les dépenses non essentielles',
          'Établissez un budget mensuel pour cette catégorie',
          'Suivez vos progrès régulièrement'
        ]
      });
    }
    
    if (insight.type === 'warning' && insight.category === 'Épargne') {
      recommendations.push({
        title: 'Augmenter votre taux d\'épargne',
        description: 'Un taux d\'épargne plus élevé vous aidera à atteindre vos objectifs financiers et à faire face aux imprévus.',
        difficulty: 'Moyenne',
        potentialImpact: 'Très élevé',
        steps: [
          'Fixez-vous un objectif d\'épargne mensuel',
          'Automatisez vos virements vers un compte d\'épargne',
          'Réduisez vos dépenses non essentielles',
          'Envisagez des sources de revenus supplémentaires'
        ]
      });
    }
    
    if (insight.type === 'pattern' && insight.title.includes('récurrentes')) {
      recommendations.push({
        title: `Optimiser vos dépenses en ${insight.category}`,
        description: `Vos dépenses récurrentes en ${insight.category} sont élevées. Voici comment les optimiser.`,
        difficulty: 'Moyenne',
        potentialImpact: 'Élevé',
        steps: [
          'Comparez les offres des différents fournisseurs',
          'Négociez vos contrats actuels',
          'Envisagez des alternatives moins coûteuses',
          'Éliminez les services que vous n\'utilisez pas pleinement'
        ]
      });
    }
  });
  
  // Recommandations générales basées sur l'analyse des données
  const currentMonth = months[months.length - 1];
  const currentData = monthlySpendingByCategory[currentMonth];
  
  // Recommandation sur la diversification des dépenses
  const categories = Object.keys(currentData.categories);
  const totalExpense = currentData.total.expense;
  
  categories.forEach(category => {
    const categoryAmount = currentData.categories[category];
    const categoryPercentage = (categoryAmount / totalExpense) * 100;
    
    if (categoryPercentage > 40 && categoryAmount > 300) {
      recommendations.push({
        title: `Diversifier vos dépenses en ${category}`,
        description: `${category} représente ${categoryPercentage.toFixed(1)}% de vos dépenses totales. Une telle concentration peut présenter des risques.`,
        difficulty: 'Difficile',
        potentialImpact: 'Moyen',
        steps: [
          'Analysez en détail cette catégorie de dépenses',
          'Identifiez les postes qui peuvent être réduits',
          'Recherchez des alternatives moins coûteuses',
          'Établissez un budget maximum pour cette catégorie'
        ]
      });
    }
  });
  
  // Recommandation sur l'épargne d'urgence
  const monthlyIncome = currentData.total.income;
  if (monthlyIncome > 0) {
    recommendations.push({
      title: 'Constituer un fonds d\'urgence',
      description: 'Un fonds d\'urgence équivalent à 3-6 mois de dépenses est essentiel pour faire face aux imprévus.',
      difficulty: 'Moyenne',
      potentialImpact: 'Très élevé',
      steps: [
        'Déterminez le montant cible (3-6 mois de dépenses)',
        'Ouvrez un compte d\'épargne dédié',
        'Mettez en place un virement automatique mensuel',
        'N\'utilisez ce fonds qu\'en cas d\'urgence véritable'
      ]
    });
  }
  
  // Recommandations basées sur les objectifs
  const goalInsights = insights.filter(insight => insight.category === 'Objectifs');
  
  if (goalInsights.length > 0) {
    const noGoalsInsight = goalInsights.find(insight => 
      insight.title === 'Aucun objectif financier défini'
    );
    
    if (noGoalsInsight) {
      recommendations.push({
        title: 'Définir des objectifs financiers SMART',
        description: 'Des objectifs Spécifiques, Mesurables, Atteignables, Réalistes et Temporels vous aideront à structurer votre plan financier.',
        difficulty: 'Facile',
        potentialImpact: 'Très élevé',
        steps: [
          'Réfléchissez à vos priorités financières (achat immobilier, retraite, etc.)',
          'Fixez un montant précis pour chaque objectif',
          'Établissez une date limite réaliste',
          'Déterminez combien vous devez épargner mensuellement',
          'Suivez régulièrement votre progression'
        ]
      });
    }
    
    const slowProgressInsights = goalInsights.filter(insight => 
      insight.title.includes('Progression lente')
    );
    
    if (slowProgressInsights.length > 0) {
      recommendations.push({
        title: 'Accélérer la progression vers vos objectifs',
        description: 'Plusieurs de vos objectifs progressent lentement. Voici comment accélérer leur réalisation.',
        difficulty: 'Moyenne',
        potentialImpact: 'Élevé',
        steps: [
          'Réévaluez vos dépenses mensuelles pour dégager plus d\'épargne',
          'Automatisez vos virements vers vos comptes d\'épargne dédiés',
          'Envisagez des sources de revenus complémentaires',
          'Ajustez vos objectifs si nécessaire pour qu\'ils restent réalistes'
        ]
      });
    }
  }
  
  return recommendations;
};

// Contrôleur pour obtenir les insights et recommandations
exports.getFinancialInsights = async (req, res) => {
  try {
    const { timeframe = '3months' } = req.query;
    const userId = req.user.id;

    // Récupérer toutes les catégories de l'utilisateur pour les avoir disponibles
    const categories = await Category.find({ user: userId });
    const categoriesMap = categories.reduce((map, category) => {
      map[category._id.toString()] = category;
      return map;
    }, {});
    
    // Analyser les tendances de dépenses
    const { insights: spendingInsights, monthlySpendingByCategory, months } = 
      await analyzeSpendingTrends(userId, timeframe);
    
    // Analyser les objectifs financiers
    const goalInsights = await analyzeFinancialGoals(userId);
    
    // Combiner les insights
    let allInsights = [...spendingInsights, ...goalInsights];
    
    // Remplacer les références aux IDs de catégorie par les noms dans les titres et descriptions
    allInsights = allInsights.map(insight => {
      // Si l'insight a une catégorie qui est un ID MongoDB
      if (insight.category && typeof insight.category === 'string' && /^[a-f0-9]{24}$/.test(insight.category)) {
        const categoryId = insight.category;
        if (categoriesMap[categoryId]) {
          insight.category = categoriesMap[categoryId].name;
        }
      }
      
      // Remplacer les IDs dans le titre et la description
      if (insight.title) {
        insight.title = replaceIdsWithCategoryNames(insight.title, categoriesMap);
      }
      
      if (insight.description) {
        insight.description = replaceIdsWithCategoryNames(insight.description, categoriesMap);
      }
      
      return insight;
    });
    
    // Générer des recommandations basées sur tous les insights
    let recommendations = generateRecommendations(allInsights, monthlySpendingByCategory, months);
    
    // Remplacer les références aux IDs de catégorie dans les recommandations
    recommendations = recommendations.map(recommendation => {
      if (recommendation.title) {
        recommendation.title = replaceIdsWithCategoryNames(recommendation.title, categoriesMap);
      }
      
      if (recommendation.description) {
        recommendation.description = replaceIdsWithCategoryNames(recommendation.description, categoriesMap);
      }
      
      return recommendation;
    });
    
    res.json({
      insights: allInsights,
      recommendations
    });
  } catch (error) {
    console.error('Erreur lors de la génération des conseils financiers:', error);
    res.status(500).json({ message: 'Erreur lors de la génération des conseils financiers' });
  }
};

// Fonction utilitaire pour remplacer les IDs par les noms de catégorie dans un texte
function replaceIdsWithCategoryNames(text, categoriesMap) {
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
}

// Récupérer toutes les recommandations sauvegardées
exports.getSavedRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const savedRecommendations = await SavedRecommendation.find({ user: userId })
      .sort({ dateCreated: -1 });
    
    res.json(savedRecommendations);
  } catch (error) {
    console.error('Erreur lors de la récupération des recommandations sauvegardées:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des recommandations sauvegardées' });
  }
};

// Sauvegarder une recommandation
exports.saveRecommendation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, steps } = req.body;
    
    const newRecommendation = new SavedRecommendation({
      user: userId,
      title,
      description,
      steps
    });
    
    const savedRecommendation = await newRecommendation.save();
    
    res.status(201).json(savedRecommendation);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la recommandation:', error);
    res.status(500).json({ message: 'Erreur lors de la sauvegarde de la recommandation' });
  }
};

// Mettre à jour une étape d'une recommandation
exports.updateRecommendationStep = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, stepIndex } = req.params;
    const { completed } = req.body;
    
    // Vérifier que la recommandation appartient à l'utilisateur
    const savedRecommendation = await SavedRecommendation.findOne({
      _id: id,
      user: userId
    });
    
    if (!savedRecommendation) {
      return res.status(404).json({ message: 'Recommandation non trouvée' });
    }
    
    // Vérifier que l'index de l'étape est valide
    if (stepIndex < 0 || stepIndex >= savedRecommendation.steps.length) {
      return res.status(400).json({ message: 'Index d\'étape invalide' });
    }
    
    // Mettre à jour l'étape
    savedRecommendation.steps[stepIndex].completed = completed;
    await savedRecommendation.save();
    
    res.json(savedRecommendation);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'étape:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'étape' });
  }
};

// Supprimer une recommandation sauvegardée
exports.deleteRecommendation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Vérifier que la recommandation appartient à l'utilisateur
    const savedRecommendation = await SavedRecommendation.findOne({
      _id: id,
      user: userId
    });
    
    if (!savedRecommendation) {
      return res.status(404).json({ message: 'Recommandation non trouvée' });
    }
    
    await SavedRecommendation.findByIdAndDelete(id);
    
    res.json({ message: 'Recommandation supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la recommandation:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la recommandation' });
  }
};

// Récupérer les données de progression financière
exports.getFinancialProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeframe = '6months' } = req.query;
    
    // Déterminer la plage de dates en fonction du timeframe
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '3months':
        startDate = subMonths(now, 3);
        break;
      case '1year':
        startDate = subYears(now, 1);
        break;
      case '6months':
      default:
        startDate = subMonths(now, 6);
        break;
    }
    
    // Récupérer les données de progression existantes
    const progressData = await FinancialProgress.find({
      user: userId,
      date: { $gte: startDate, $lte: now }
    }).sort({ date: 1 });
    
    // Si aucune donnée n'existe, générer des données de démonstration
    if (progressData.length === 0) {
      // Créer une seed basée sur l'ID utilisateur et la plage de dates
      const seedString = `${userId}-${startDate.getTime()}-${now.getTime()}`;
      const seed = Array.from(seedString).reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const random = new SeededRandom(seed);
      
      // Pour la démo, générer des données fictives pour les derniers mois
      const demoData = [];
      let currentDate = startDate;
      
      while (currentDate <= now) {
        // Générer des valeurs déterministes mais réalistes pour la démo
        const savingsRate = 10 + random.nextInRange(0, 20); // Entre 10% et 30%
        const expenseReduction = 5 + random.nextInRange(0, 15); // Entre 5% et 20%
        const recommendationsCompleted = Math.floor(random.nextInRange(0, 5)); // Entre 0 et 4
        
        demoData.push({
          date: format(currentDate, 'yyyy-MM-dd'),
          savingsRate: parseFloat(savingsRate.toFixed(1)),
          expenseReduction: parseFloat(expenseReduction.toFixed(1)),
          recommendationsCompleted: recommendationsCompleted
        });
        
        currentDate = addMonths(currentDate, 1);
      }
      
      return res.json(demoData);
    }
    
    // Formater les données pour le frontend
    const formattedData = progressData.map(entry => ({
      date: format(new Date(entry.date), 'yyyy-MM-dd'),
      savingsRate: entry.savingsRate,
      expenseReduction: entry.expenseReduction,
      recommendationsCompleted: entry.recommendationsCompleted
    }));
    
    res.json(formattedData);
  } catch (error) {
    console.error('Erreur lors de la récupération des données de progression:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des données de progression' });
  }
};

// Mettre à jour les données de progression financière
exports.updateFinancialProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { savingsRate, expenseReduction, recommendationsCompleted } = req.body;
    
    // Utiliser la date actuelle ou celle fournie
    const date = req.body.date ? new Date(req.body.date) : new Date();
    
    // Vérifier si une entrée existe déjà pour ce mois
    const startOfCurrentMonth = startOfMonth(date);
    const endOfCurrentMonth = endOfMonth(date);
    
    let progressEntry = await FinancialProgress.findOne({
      user: userId,
      date: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth }
    });
    
    if (progressEntry) {
      // Mettre à jour l'entrée existante
      progressEntry.savingsRate = savingsRate || progressEntry.savingsRate;
      progressEntry.expenseReduction = expenseReduction !== undefined ? expenseReduction : progressEntry.expenseReduction;
      progressEntry.recommendationsCompleted = recommendationsCompleted !== undefined ? recommendationsCompleted : progressEntry.recommendationsCompleted;
      
      await progressEntry.save();
    } else {
      // Créer une nouvelle entrée
      progressEntry = new FinancialProgress({
        user: userId,
        date,
        savingsRate,
        expenseReduction: expenseReduction || 0,
        recommendationsCompleted: recommendationsCompleted || 0
      });
      
      await progressEntry.save();
    }
    
    res.json(progressEntry);
  } catch (error) {
    console.error('Erreur lors de la mise à jour des données de progression:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour des données de progression' });
  }
};
