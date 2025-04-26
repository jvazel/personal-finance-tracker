const FinancialProgress = require('../models/FinancialProgress');
const ProgressData = require('../models/ProgressData');
const Transaction = require('../models/Transaction');
const Goal = require('../models/Goal');
const SavedRecommendation = require('../models/SavedRecommendation');
const { format, addMonths, subMonths, subYears, startOfMonth, endOfMonth } = require('date-fns');
const { SeededRandom } = require('./financialUtils');
const dateService = require('./dateService');

// Récupérer les données de progression financière
const getFinancialProgress = async (userId, timeframe) => {
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
    
    return demoData;
  }
  
  // Formater les données pour le frontend
  return progressData.map(entry => ({
    date: format(new Date(entry.date), 'yyyy-MM-dd'),
    savingsRate: entry.savingsRate,
    expenseReduction: entry.expenseReduction,
    recommendationsCompleted: entry.recommendationsCompleted
  }));
};

// Mettre à jour les données de progression financière
const updateFinancialProgress = async (userId, progressData) => {
  const { savingsRate, expenseReduction, recommendationsCompleted, date: inputDate } = progressData;
  
  // Utiliser la date actuelle ou celle fournie
  const date = inputDate ? new Date(inputDate) : new Date();
  
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
  
  return progressEntry;
};

// Fonction pour récupérer les données de progression
const getProgressData = async (userId, timeframe) => {
  // Déterminer la date de début en fonction du timeframe
  const endDate = new Date(); // Date actuelle pour la fin
  let startDate = new Date(); // Initialiser startDate
  
  // Utiliser les fonctions de date-fns pour une manipulation plus précise des dates
  if (timeframe === '3months') {
    startDate = subMonths(endDate, 3);
  } else if (timeframe === '6months') {
    startDate = subMonths(endDate, 6);
  } else if (timeframe === '1year') {
    startDate = subYears(endDate, 1);
  } else {
    // Par défaut, 6 mois
    startDate = subMonths(endDate, 6);
  }
  
  // Requête pour obtenir les données de progression dans la plage de dates
  return await ProgressData.find({
    userId: userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};

// Fonction pour enregistrer de nouvelles données de progression
const saveProgressData = async (userId, progressData) => {
  const {
    savingsRate,
    expenseReduction,
    recommendationsCompleted,
    debtToIncomeRatio,
    financialHealthScore,
    investmentDiversification,
    netWorthChange,
    emergencyCoverageMonths
  } = progressData;
  
  // Créer une nouvelle entrée de progression
  const newProgressData = new ProgressData({
    userId,
    date: new Date(),
    savingsRate,
    expenseReduction,
    recommendationsCompleted,
    debtToIncomeRatio,
    financialHealthScore,
    investmentDiversification,
    netWorthChange,
    emergencyCoverageMonths
  });
  
  await newProgressData.save();
  return newProgressData;
};

// Fonction pour calculer automatiquement les KPIs
const calculateProgressKPIs = async (userId) => {
  // Récupérer les données nécessaires pour calculer les KPIs
  const transactions = await Transaction.find({ user: userId }).sort({ date: -1 }).limit(100);
  const goals = await Goal.find({ user: userId });
  
  // Utiliser SavedRecommendation au lieu de Recommendation
  let recommendations = [];
  try {
    recommendations = await SavedRecommendation.find({ user: userId });
  } catch (error) {
  }
  
  // Calculer le taux d'épargne
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const monthlyTransactions = transactions.filter(t => 
    new Date(t.date) >= lastMonth
  );
  
  const income = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  
  // Calculer la réduction des dépenses (par rapport au mois précédent)
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  
  const previousMonthTransactions = transactions.filter(t => 
    new Date(t.date) >= twoMonthsAgo && new Date(t.date) < lastMonth
  );
  
  const previousMonthExpenses = previousMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenseReduction = previousMonthExpenses > 0 
    ? ((previousMonthExpenses - expenses) / previousMonthExpenses) * 100 
    : 0;
  
  // Calculer le nombre de recommandations complétées
  const recommendationsCompleted = recommendations.filter(r => {
    // Vérifier si toutes les étapes sont complétées
    return r.steps && r.steps.length > 0 && r.steps.every(step => step.completed);
  }).length;
  
  // Calculer le ratio dette/revenu en utilisant les transactions
  // Identifier les transactions liées à des dettes (prêts, crédits)
  const debtCategories = ['Prêt', 'Crédit', 'Hypothèque', 'Dette'];
  const debtTransactions = monthlyTransactions.filter(t => 
    t.type === 'expense' && 
    t.category && 
    debtCategories.some(cat => 
      t.categoryName?.includes(cat) || 
      (typeof t.category === 'object' && t.category.name?.includes(cat))
    )
  );
  
  const monthlyDebtPayments = debtTransactions.reduce((sum, t) => sum + t.amount, 0);
  const debtToIncomeRatio = income > 0 ? (monthlyDebtPayments / income) * 100 : 0;
  
  // Calculer le score de santé financière (algorithme simplifié)
  let financialHealthScore = 50; // Score de base
  
  // Ajuster en fonction du taux d'épargne
  if (savingsRate > 20) financialHealthScore += 10;
  else if (savingsRate > 10) financialHealthScore += 5;
  else if (savingsRate < 0) financialHealthScore -= 10;
  
  // Ajuster en fonction du ratio dette/revenu
  if (debtToIncomeRatio < 36) financialHealthScore += 10;
  else if (debtToIncomeRatio > 50) financialHealthScore -= 10;
  
  // Ajuster en fonction des objectifs atteints
  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;
  const totalGoals = goals.length;
  if (totalGoals > 0) {
    const goalCompletionRate = (completedGoals / totalGoals) * 100;
    if (goalCompletionRate > 50) financialHealthScore += 10;
    else if (goalCompletionRate > 25) financialHealthScore += 5;
  }
  
  // Limiter le score entre 0 et 100
  financialHealthScore = Math.max(0, Math.min(100, financialHealthScore));
  
  // Calculer la diversification des investissements en utilisant les catégories de transactions
  const investmentCategories = ['Investissement', 'Bourse', 'Actions', 'Obligations', 'SCPI', 'Assurance-vie'];
  const investmentTransactions = transactions.filter(t => 
    t.type === 'expense' && 
    t.category && 
    investmentCategories.some(cat => 
      t.categoryName?.includes(cat) || 
      (typeof t.category === 'object' && t.category.name?.includes(cat))
    )
  );
  
  // Extraire les types d'investissement uniques
  const investmentTypes = new Set();
  investmentTransactions.forEach(t => {
    const categoryName = t.categoryName || (typeof t.category === 'object' ? t.category.name : '');
    investmentTypes.add(categoryName);
  });
  
  const investmentDiversification = investmentTransactions.length > 0 
    ? Math.min(100, (investmentTypes.size / 5) * 100) // 5 types différents = 100%
    : 0;
  
  // Calculer l'évolution de la valeur nette
  // Comparer les 3 derniers mois avec les 3 mois précédents
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const recentTransactions = transactions.filter(t => 
    new Date(t.date) >= threeMonthsAgo
  );
  
  const olderTransactions = transactions.filter(t => 
    new Date(t.date) >= sixMonthsAgo && new Date(t.date) < threeMonthsAgo
  );
  
  const recentIncome = recentTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const recentExpenses = recentTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const olderIncome = olderTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const olderExpenses = olderTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const recentNetWorth = recentIncome - recentExpenses;
  const olderNetWorth = olderIncome - olderExpenses;
  
  const netWorthChange = olderNetWorth !== 0 
    ? ((recentNetWorth - olderNetWorth) / Math.abs(olderNetWorth)) * 100 
    : (recentNetWorth > 0 ? 100 : 0);
  
  // Calculer la couverture d'urgence
  // Identifier les comptes d'épargne d'urgence via les transactions
  const emergencyCategories = ['Épargne', 'Urgence', 'Sécurité'];
  const emergencySavingsTransactions = transactions.filter(t => 
    t.type === 'income' && 
    t.category && 
    emergencyCategories.some(cat => 
      t.categoryName?.includes(cat) || 
      (typeof t.category === 'object' && t.category.name?.includes(cat))
    )
  );
  
  const emergencyFunds = emergencySavingsTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  // Calculer les dépenses mensuelles moyennes sur les 3 derniers mois
  const averageMonthlyExpenses = recentExpenses / 3;
  
  const emergencyCoverageMonths = averageMonthlyExpenses > 0 
    ? emergencyFunds / averageMonthlyExpenses 
    : 0;
  
  // Retourner tous les KPIs calculés
  return {
    savingsRate,
    expenseReduction,
    recommendationsCompleted,
    debtToIncomeRatio,
    financialHealthScore,
    investmentDiversification,
    netWorthChange,
    emergencyCoverageMonths
  };
};

module.exports = {
  getFinancialProgress,
  updateFinancialProgress,
  getProgressData,
  saveProgressData,
  calculateProgressKPIs
};