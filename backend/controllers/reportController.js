const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { format, parseISO, startOfMonth, endOfMonth, addMonths } = require('date-fns');
const logger = require('../utils/logger');

// Contrôleur pour le rapport Revenus et Dépenses
exports.getIncomeExpenseReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;

    // Validation des dates
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Les dates de début et de fin sont requises' });
    }

    // Récupération de toutes les transactions pour la période
    const transactions = await Transaction.find({
      user: userId,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).populate('category');

    // Récupération des catégories
    const categories = await Category.find({ user: userId });

    // Initialisation des totaux
    let totalIncome = 0;
    let totalExpense = 0;

    // Initialisation des structures pour la répartition
    const incomeBySource = {};
    const expenseByCategory = {};

    // Initialisation des données mensuelles
    const monthlyData = {};

    // Traitement des transactions
    transactions.forEach(transaction => {
      const amount = Math.abs(transaction.amount);
      const categoryName = transaction.category ? transaction.category.name : 'Non catégorisé';
      
      // Utiliser directement le type de transaction au lieu de se baser sur le montant
      const transactionType = transaction.type;
      
      // Formatage de la date pour les données mensuelles (YYYY-MM)
      const transactionDate = new Date(transaction.date);
      const monthKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}-01`;
      
      // Initialisation des données mensuelles si nécessaire
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, income: 0, expense: 0, balance: 0 };
      }

      // Mise à jour des totaux et répartitions
      if (transactionType === 'income') {
        totalIncome += amount;
        monthlyData[monthKey].income += amount;
        
        // Mise à jour de la répartition des revenus
        if (!incomeBySource[categoryName]) {
          incomeBySource[categoryName] = 0;
        }
        incomeBySource[categoryName] += amount;
      } else if (transactionType === 'expense') {
        totalExpense += amount;
        monthlyData[monthKey].expense += amount;
        
        // Mise à jour de la répartition des dépenses
        if (!expenseByCategory[categoryName]) {
          expenseByCategory[categoryName] = 0;
        }
        expenseByCategory[categoryName] += amount;
      }
      
      // Calcul du solde mensuel
      monthlyData[monthKey].balance = monthlyData[monthKey].income - monthlyData[monthKey].expense;
    });

    // Calcul du solde net
    const balance = totalIncome - totalExpense;

    // Conversion des objets en tableaux pour les graphiques
    const incomeBySourceArray = Object.entries(incomeBySource).map(([name, amount]) => ({ name, amount }));
    const expenseByCategoryArray = Object.entries(expenseByCategory).map(([name, amount]) => ({ name, amount }));
    
    // Tri des données mensuelles par date
    const monthlyDataArray = Object.values(monthlyData).sort((a, b) => new Date(a.month) - new Date(b.month));

    // Construction de la réponse
    const response = {
      totals: {
        income: totalIncome,
        expense: totalExpense,
        balance: balance
      },
      incomeBySource: incomeBySourceArray,
      expenseByCategory: expenseByCategoryArray,
      monthlyData: monthlyDataArray
    };

    res.json(response);
  } catch (error) {
    logger.error('Erreur lors de la génération du rapport revenus et dépenses:', { 
      error: error.message, 
      stack: error.stack,
      userId: req.user.id,
      dateRange: { startDate: req.query.startDate, endDate: req.query.endDate }
    });
    res.status(500).json({ message: 'Erreur serveur lors de la génération du rapport' });
  }
};