// backend/controllers/transactionController.js
const Transaction = require('../models/Transaction');

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    let query = {};

    // Filtrer par date si les paramètres sont fournis
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const transactions = await Transaction.find(query).sort({ date: -1 }); // Sort by date descending
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
};

// Get transactions for reports (with date range)
exports.getReportTransactions = async (req, res) => {
  try {
    let query = {};
    
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

    const transactions = await Transaction.find(query).sort({ date: -1 }); // Tri par date décroissante

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching report transactions', error: error.message });
  }
};

// Create a new transaction
exports.createTransaction = async (req, res) => {
  try {
    const newTransaction = new Transaction(req.body);
    const savedTransaction = await newTransaction.save();
    res.status(201).json(savedTransaction);
  } catch (error) {
    res.status(400).json({ message: 'Error creating transaction', error: error.message });
  }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
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
    const updatedTransaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
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
    const deletedTransaction = await Transaction.findByIdAndDelete(req.params.id);
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

    console.log('Période du tableau de bord:', {
      startOfMonth: startOfMonth.toISOString(),
      endOfMonth: endOfMonth.toISOString(),
      currentDate: now.toISOString()
    });

    const transactions = await Transaction.find({
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    console.log('Nombre de transactions trouvées:', transactions.length);

    // Afficher quelques transactions pour vérification
    if (transactions.length > 0) {
      console.log('Exemple de transaction:', transactions[0]);
    }

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

    console.log('Résultat du tableau de bord:', result);

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

    console.log('Expenses by category request received:', { startDate, endDate });

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

    console.log('Date range for query:', { start, end });

    // Aggregate expenses by category
    const expensesByCategory = await Transaction.aggregate([
      {
        $match: {
          type: 'expense',
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          amount: 1
        }
      },
      {
        $sort: { amount: -1 }
      }
    ]);

    console.log('Expenses by category results:', expensesByCategory);
    res.status(200).json(expensesByCategory);
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

    console.log('Top expenses request received:', { startDate, endDate, limit });

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
      type: 'expense',
      date: { $gte: start, $lte: end }
    })
      .sort({ amount: -1 }) // Sort by amount descending
      .limit(limitInt);

    console.log(`Found ${topExpenses.length} top expenses`);
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
      type: 'expense',
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
    
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
      
      potentialRecurringBills[normalizedDesc].push({
        id: transaction._id,
        date: transaction.date,
        amount: transaction.amount,
        category: transaction.category
      });
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
          category: occurrences[0].category // Utiliser la catégorie de la première occurrence
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
    
    console.log('Fetching monthly summary for period:', { startDate, endDate });
    
    const transactions = await Transaction.find({
      date: { $gte: start, $lte: end }
    });
    
    console.log(`Found ${transactions.length} transactions for the period`);
    
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
    
    console.log('Monthly summary calculated:', { totalIncome, totalExpenses, savings });
    
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