const Transaction = require('../models/Transaction');
const Goal = require('../models/Goal');
const SavedRecommendation = require('../models/SavedRecommendation');
const ProgressData = require('../models/ProgressData');

/**
 * Calculate financial KPIs for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - Object containing calculated KPIs
 */
exports.calculateFinancialKPIs = async (userId) => {
  // Retrieve necessary data to calculate KPIs
  const transactions = await Transaction.find({ user: userId }).sort({ date: -1 }).limit(100);
  const goals = await Goal.find({ user: userId });
  
  // Use SavedRecommendation instead of Recommendation
  let recommendations = [];
  try {
    recommendations = await SavedRecommendation.find({ user: userId });
  } catch (error) {
  }
  
  // Calculate savings rate
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
  
  // Calculate expense reduction (compared to previous month)
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
  
  // Calculate number of completed recommendations
  const recommendationsCompleted = recommendations.filter(r => {
    // Check if all steps are completed
    return r.steps && r.steps.length > 0 && r.steps.every(step => step.completed);
  }).length;
  
  // Calculate debt-to-income ratio using transactions
  // Identify transactions related to debt (loans, credits)
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
  
  // Calculate financial health score (simplified algorithm)
  let financialHealthScore = 50; // Base score
  
  // Adjust based on savings rate
  if (savingsRate > 20) financialHealthScore += 10;
  else if (savingsRate > 10) financialHealthScore += 5;
  else if (savingsRate < 0) financialHealthScore -= 10;
  
  // Adjust based on debt-to-income ratio
  if (debtToIncomeRatio < 36) financialHealthScore += 10;
  else if (debtToIncomeRatio > 50) financialHealthScore -= 10;
  
  // Adjust based on achieved goals
  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;
  const totalGoals = goals.length;
  if (totalGoals > 0) {
    const goalCompletionRate = (completedGoals / totalGoals) * 100;
    if (goalCompletionRate > 50) financialHealthScore += 10;
    else if (goalCompletionRate > 25) financialHealthScore += 5;
  }
  
  // Limit score between 0 and 100
  financialHealthScore = Math.max(0, Math.min(100, financialHealthScore));
  
  // Calculate investment diversification using transaction categories
  const investmentCategories = ['Investissement', 'Bourse', 'Actions', 'Obligations', 'SCPI', 'Assurance-vie'];
  const investmentTransactions = transactions.filter(t => 
    t.type === 'expense' && 
    t.category && 
    investmentCategories.some(cat => 
      t.categoryName?.includes(cat) || 
      (typeof t.category === 'object' && t.category.name?.includes(cat))
    )
  );
  
  // Extract unique investment types
  const investmentTypes = new Set();
  investmentTransactions.forEach(t => {
    const categoryName = t.categoryName || (typeof t.category === 'object' ? t.category.name : '');
    investmentTypes.add(categoryName);
  });
  
  const investmentDiversification = investmentTransactions.length > 0 
    ? Math.min(100, (investmentTypes.size / 5) * 100) // 5 different types = 100%
    : 0;
  
  // Calculate net worth evolution
  // Compare the last 3 months with the previous 3 months
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
  
  // Calculate emergency coverage
  // Identify emergency savings accounts via transactions
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
  
  // Calculate average monthly expenses over the last 3 months
  const averageMonthlyExpenses = recentExpenses / 3;
  
  const emergencyCoverageMonths = averageMonthlyExpenses > 0 
    ? emergencyFunds / averageMonthlyExpenses 
    : 0;
  
  // Return all calculated KPIs
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

/**
 * Save KPIs to the database
 * @param {string} userId - The user ID
 * @param {Object} kpis - The KPIs to save
 * @returns {Promise<Object>} - The saved progress data
 */
exports.saveKPIs = async (userId, kpis) => {
  const newProgressData = new ProgressData({
    userId,
    date: new Date(),
    ...kpis
  });
  
  await newProgressData.save();
  return newProgressData;
};