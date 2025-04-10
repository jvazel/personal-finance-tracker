const Transaction = require('../models/Transaction');
const Goal = require('../models/Goal');
const { 
  startOfMonth, endOfMonth, subMonths, 
  startOfYear, endOfYear, subYears,
  format, parseISO, isAfter, isBefore
} = require('date-fns');

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
  
  return recommendations;
};

// Contrôleur pour obtenir les insights et recommandations
exports.getFinancialInsights = async (req, res) => {
  try {
    const { timeframe = '3months' } = req.query;
    const userId = req.user ? req.user.id : '123'; // À remplacer par l'ID réel de l'utilisateur
    
    // Analyser les tendances de dépenses
    const { insights, monthlySpendingByCategory, months } = await analyzeSpendingTrends(userId, timeframe);
    
    // Générer des recommandations basées sur les insights
    const recommendations = generateRecommendations(insights, monthlySpendingByCategory, months);
    
    res.json({
      insights,
      recommendations
    });
  } catch (error) {
    console.error('Erreur lors de la génération des conseils financiers:', error);
    res.status(500).json({ message: 'Erreur lors de la génération des conseils financiers' });
  }
};