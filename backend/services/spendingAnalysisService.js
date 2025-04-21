const Transaction = require('../models/Transaction');
const { format } = require('date-fns');
const { getDateRange } = require('./financialUtils');

// Fonction pour analyser les tendances de dépenses
const analyzeSpendingTrends = async (userId, timeframe) => {
  const { start, end } = getDateRange(timeframe);
  
  // Récupérer toutes les transactions pour la période
  const transactions = await Transaction.find({
    user: userId,
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

module.exports = {
  analyzeSpendingTrends
};