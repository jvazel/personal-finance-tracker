// backend/controllers/transactionController.js
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const mongoose = require('mongoose');

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    let query = { user: req.user.id }; // Filter by authenticated user

    // Filtrer par date si les paramètres sont fournis
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const transactions = await Transaction.find(query)
      .populate('category', 'name color icon type')
      .sort({ date: -1 }); // Sort by date descending
    
    // Format transactions to maintain backward compatibility
    const formattedTransactions = transactions.map(transaction => {
      const transObj = transaction.toObject();
      // Add category name as a property for backward compatibility
      if (transObj.category && typeof transObj.category === 'object') {
        transObj.categoryName = transObj.category.name;
      }
      return transObj;
    });
    
    res.json(formattedTransactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
};

// Get transactions for reports (with date range)
exports.getReportTransactions = async (req, res) => {
  try {
    let query = { user: req.user.id }; // Filter by authenticated user
    
    // Utiliser les dates fournies ou par défaut utiliser la dernière année
    if (req.query.startDate && req.query.endDate) {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      // Définir endDate à la fin de la journée
      endDate.setHours(23, 59, 59, 999);
      
      query.date = { $gte: startDate, $lte: endDate };
    } else {
      // Comportement par défaut: dernière année
      const now = new Date();
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      
      query.date = { $gte: oneYearAgo };
    }

    const transactions = await Transaction.find(query)
      .populate('category', 'name color icon type')
      .sort({ date: -1 }); // Tri par date décroissante

    // Format transactions to maintain backward compatibility
    const formattedTransactions = transactions.map(transaction => {
      const transObj = transaction.toObject();
      // Add category name as a property for backward compatibility
      if (transObj.category && typeof transObj.category === 'object') {
        transObj.categoryName = transObj.category.name;
      }
      return transObj;
    });

    res.json(formattedTransactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching report transactions', error: error.message });
  }
};

// Create a new transaction
exports.createTransaction = async (req, res) => {
  try {
    // If category is provided as a name, find the category ID
    let categoryId = req.body.category;
    
    // If the category is not a valid ObjectId, try to find it by name
    if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
      const category = await Category.findOne({ 
        name: categoryId,
        user: req.user.id
      });
      
      if (category) {
        categoryId = category._id;
      } else {
        return res.status(400).json({ 
          message: 'Category not found. Please provide a valid category ID or name.' 
        });
      }
    }
    
    const newTransaction = new Transaction({
      ...req.body,
      category: categoryId,
      user: req.user.id // Add user ID to transaction
    });
    
    const savedTransaction = await newTransaction.save();
    
    // Populate the category for the response
    await savedTransaction.populate('category', 'name color icon type');
    
    res.status(201).json(savedTransaction);
  } catch (error) {
    res.status(400).json({ message: 'Error creating transaction', error: error.message });
  }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id // Ensure user can only access their own transactions
    });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transaction', error: error.message });
  }
};

// Update transaction by ID
exports.updateTransaction = async (req, res) => {
  try {
    // If category is provided as a name, find the category ID
    let updateData = { ...req.body };
    
    if (updateData.category && !mongoose.Types.ObjectId.isValid(updateData.category)) {
      const category = await Category.findOne({ 
        name: updateData.category,
        user: req.user.id
      });
      
      if (category) {
        updateData.category = category._id;
      } else {
        return res.status(400).json({ 
          message: 'Category not found. Please provide a valid category ID or name.' 
        });
      }
    }
    
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id }, // Only update user's own transaction
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name color icon type');
    
    if (!updatedTransaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(updatedTransaction);
  } catch (error) {
    res.status(400).json({ message: 'Error updating transaction', error: error.message });
  }
};

// Delete transaction by ID
exports.deleteTransaction = async (req, res) => {
  try {
    const deletedTransaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id // Only delete user's own transaction
    });
    if (!deletedTransaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting transaction', error: error.message });
  }
};

// Get Dashboard Data (Current Month Summary)
exports.getDashboardData = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const transactions = await Transaction.find({
      user: req.user.id, // Filter by authenticated user
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else if (transaction.type === 'expense') {
        totalExpenses += transaction.amount;
      }
    });

    const savings = totalIncome - Math.abs(totalExpenses);

    const result = {
      totalIncome,
      totalExpenses: Math.abs(totalExpenses),
      savings,
    };

    res.json(result);

  } catch (error) {
    console.error('Erreur tableau de bord:', error);
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
};

// Get expenses by category between two dates
exports.getExpensesByCategory = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Les dates de début et de fin sont requises'
      });
    }

    // Format dates for MongoDB query
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Set to end of day

    // Find all expense transactions in the date range
    const transactions = await Transaction.find({
      user: req.user.id,
      type: 'expense',
      date: { $gte: start, $lte: end }
    }).populate('category', 'name color');

    // Group transactions by category
    const expensesByCategory = {};
    
    transactions.forEach(transaction => {
      // Get category name from either the populated category object or fallback to direct property
      const categoryName = transaction.category && typeof transaction.category === 'object' 
        ? transaction.category.name 
        : 'Autre';
      
      // Get category color if available
      const categoryColor = transaction.category && typeof transaction.category === 'object' 
        ? transaction.category.color 
        : null;
      
      if (!expensesByCategory[categoryName]) {
        expensesByCategory[categoryName] = {
          category: categoryName,
          amount: 0,
          color: categoryColor
        };
      }
      
      expensesByCategory[categoryName].amount += Math.abs(transaction.amount);
    });

    // Convert to array and sort by amount
    const result = Object.values(expensesByCategory).sort((a, b) => b.amount - a.amount);

    res.json(result);
  } catch (error) {
    console.error('Error fetching expenses by category:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des dépenses par catégorie',
      error: error.message
    });
  }
};

// Get income and expense trends (monthly data for the last 6 months)
exports.getIncomeExpenseTrends = async (req, res) => {
  try {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 5); // Get 6 months of data (current month + 5 previous)

    // Set to beginning of the month
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const transactions = await Transaction.find({
      user: req.user.id, // Filter by authenticated user
      date: { $gte: sixMonthsAgo }
    }).sort({ date: 1 });

    // Group by month and type (income/expense)
    const monthlyData = {};

    // Initialize the data structure for the last 6 months
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(sixMonthsAgo);
      monthDate.setMonth(sixMonthsAgo.getMonth() + i);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;

      monthlyData[monthKey] = {
        month: monthDate.toLocaleString('default', { month: 'short' }),
        year: monthDate.getFullYear(),
        income: 0,
        expense: 0
      };
    }

    // Aggregate transactions by month
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (monthlyData[monthKey]) {
        if (transaction.type === 'income') {
          monthlyData[monthKey].income += transaction.amount;
        } else if (transaction.type === 'expense') {
          monthlyData[monthKey].expense += transaction.amount;
        }
      }
    });

    // Convert to array and sort by date
    const trendsData = Object.values(monthlyData).sort((a, b) => {
      return new Date(`${a.year}-${a.month}`) - new Date(`${b.year}-${b.month}`);
    });

    res.json(trendsData);
  } catch (error) {
    console.error('Error fetching income/expense trends:', error);
    res.status(500).json({ message: 'Error fetching trends data' });
  }
};

// Get top expenses for a given period
exports.getTopExpenses = async (req, res) => {
  try {
    const { startDate, endDate, limit = 5 } = req.query;

    // Validate date parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Les dates de début et de fin sont requises'
      });
    }

    // Format dates for MongoDB query
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Set to end of day

    // Validate date format
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Format de date invalide. Utilisez YYYY-MM-DD'
      });
    }

    // Parse limit to integer
    const limitInt = parseInt(limit, 10);

    // Get top expenses sorted by amount (highest first)
    const topExpenses = await Transaction.find({
      user: req.user.id, // Filter by authenticated user
      type: 'expense',
      date: { $gte: start, $lte: end }
    })
      .sort({ amount: -1 }) // Sort by amount descending
      .limit(limitInt);

    res.status(200).json(topExpenses);
  } catch (error) {
    console.error('Error fetching top expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des principales dépenses',
      error: error.message
    });
  }
};

// Fonction pour obtenir les factures récurrentes
exports.getRecurringBills = async (req, res) => {
  try {
    const { period = '12' } = req.query; // Période en mois (par défaut 12 mois)
    
    // Calculer la date de début en fonction de la période
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(period));
    
    // Récupérer toutes les transactions de type dépense dans la période
    const transactions = await Transaction.find({
      user: req.user.id, // Filter by authenticated user
      type: 'expense',
      date: { $gte: startDate, $lte: endDate }
    })
    .populate('category', 'name color icon') // Ajouter cette ligne pour récupérer les infos de catégorie
    .sort({ date: 1 });
    
    // Algorithme pour détecter les factures récurrentes
    // Une facture est considérée comme récurrente si:
    // 1. Elle a la même description (ou similaire)
    // 2. Elle apparaît régulièrement (mensuellement, trimestriellement, etc.)
    
    const potentialRecurringBills = {};
    
    transactions.forEach(transaction => {
      // Normaliser la description pour la comparaison
      const normalizedDesc = transaction.description.toLowerCase().trim();
      
      if (!potentialRecurringBills[normalizedDesc]) {
        potentialRecurringBills[normalizedDesc] = [];
      }
      
      // Créer un objet avec les données de transaction, y compris la catégorie
      const transactionData = {
        id: transaction._id,
        date: transaction.date,
        amount: transaction.amount,
        category: transaction.category // Maintenant c'est l'objet catégorie complet
      };
      
      potentialRecurringBills[normalizedDesc].push(transactionData);
    });
    
    // Filtrer pour ne garder que les transactions qui apparaissent au moins 2 fois
    const recurringBills = Object.entries(potentialRecurringBills)
      .filter(([_, occurrences]) => occurrences.length >= 2)
      .map(([description, occurrences]) => {
        // Trier par date
        occurrences.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Calculer les statistiques
        const amounts = occurrences.map(o => o.amount);
        const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
        const min = Math.min(...amounts);
        const max = Math.max(...amounts);
        const trend = occurrences.length > 1 
          ? ((occurrences[occurrences.length - 1].amount - occurrences[0].amount) / occurrences[0].amount) * 100 
          : 0;
        
        // Utiliser la catégorie de la première occurrence (maintenant c'est un objet complet)
        const categoryInfo = occurrences[0].category;
        
        return {
          description,
          occurrences,
          statistics: {
            count: occurrences.length,
            average,
            min,
            max,
            trend // Pourcentage d'évolution entre la première et la dernière occurrence
          },
          category: categoryInfo, // Ceci est maintenant l'objet catégorie complet
          categoryName: categoryInfo && typeof categoryInfo === 'object' ? categoryInfo.name : 'Non catégorisé' // Ajouter le nom de la catégorie directement
        };
      })
      // Trier par nombre d'occurrences (décroissant)
      .sort((a, b) => b.statistics.count - a.statistics.count);
    
    res.json(recurringBills);
  } catch (error) {
    console.error('Erreur lors de la récupération des factures récurrentes:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des factures récurrentes' });
  }
};

// Get Monthly Summary (for Transactions page)
exports.getMonthlySummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Start date and end date are required' 
      });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Set to end of day
    
    const transactions = await Transaction.find({
      user: req.user.id, // Filter by authenticated user
      date: { $gte: start, $lte: end }
    });
    
    let totalIncome = 0;
    let totalExpenses = 0;
    
    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else if (transaction.type === 'expense') {
        totalExpenses += transaction.amount;
      }
    });
    
    const savings = totalIncome - totalExpenses;
    
    res.json({
      totalIncome,
      totalExpenses,
      savings
    });
    
  } catch (error) {
    console.error('Error fetching monthly summary:', error);
    res.status(500).json({ 
      message: 'Error fetching monthly summary', 
      error: error.message 
    });
  }
};

// Get expense report data
exports.getExpenseReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;

    // Vérifier que les dates sont valides
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Les dates de début et de fin sont requises' });
    }

    // Récupérer toutes les transactions de dépenses pour la période
    const transactions = await Transaction.find({
      user: userId,
      type: 'expense',
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).populate('category'); // Ajouter populate pour récupérer les détails de la catégorie

    // Si aucune transaction n'est trouvée
    if (transactions.length === 0) {
      return res.json({
        totalExpenses: 0,
        averageDailyExpense: 0,
        expensesByCategory: [],
        topExpenses: [],
        dailyExpenseTrend: []
      });
    }

    // Calculer le total des dépenses
    const totalExpenses = transactions.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

    // Calculer la moyenne journalière
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
    const averageDailyExpense = totalExpenses / days;

    // Regrouper les dépenses par catégorie
    const categoriesMap = new Map();
    transactions.forEach(transaction => {
      const categoryId = transaction.category ? transaction.category._id.toString() : 'uncategorized';
      const categoryName = transaction.category ? transaction.category.name : 'Non catégorisé';
      const categoryColor = transaction.category ? transaction.category.color : '#808080'; // Ajouter la couleur
      
      if (!categoriesMap.has(categoryId)) {
        categoriesMap.set(categoryId, {
          categoryId,
          categoryName,
          categoryColor, // Ajouter la couleur
          amount: 0,
          count: 0
        });
      }
      
      const category = categoriesMap.get(categoryId);
      category.amount += Math.abs(transaction.amount);
      category.count += 1;
    });

    // Convertir en tableau et calculer les pourcentages
    const expensesByCategory = Array.from(categoriesMap.values()).map(category => ({
      ...category,
      percentage: category.amount / totalExpenses
    }));

    // Trier par montant décroissant
    expensesByCategory.sort((a, b) => b.amount - a.amount);

    // Top 5 des dépenses individuelles
    const topExpenses = [...transactions]
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, 5)
      .map(transaction => ({
        description: transaction.description,
        amount: transaction.amount,
        date: transaction.date,
        categoryName: transaction.category ? transaction.category.name : 'Non catégorisé',
        categoryColor: transaction.category ? transaction.category.color : '#808080' // Ajouter la couleur
      }));

    // Tendance journalière des dépenses
    const dailyExpenseMap = new Map();
    transactions.forEach(transaction => {
      const date = transaction.date.toISOString().split('T')[0];
      const currentAmount = dailyExpenseMap.get(date) || 0;
      dailyExpenseMap.set(date, currentAmount + Math.abs(transaction.amount));
    });

    const dailyExpenseTrend = Array.from(dailyExpenseMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      totalExpenses,
      averageDailyExpense,
      expensesByCategory,
      topExpenses,
      dailyExpenseTrend
    });
  } catch (error) {
    console.error('Erreur lors de la génération du rapport de dépenses:', error);
    res.status(500).json({ message: 'Erreur lors de la génération du rapport de dépenses' });
  }
};

// Ajouter cette fonction à votre contrôleur de transactions
exports.getCategories = async (req, res) => {
  try {
    // Récupérer toutes les catégories uniques des transactions de l'utilisateur
    const categories = await Transaction.distinct('category', { user: req.user.id });
    res.json(categories);
  } catch (err) {
    console.error('Erreur lors de la récupération des catégories:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des catégories' });
  }
};
