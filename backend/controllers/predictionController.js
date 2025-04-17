const Transaction = require('../models/Transaction');
const Category = require('../models/Category'); // Ajout de l'import du modèle Category
const mongoose = require('mongoose'); // Ajout de l'import de mongoose
const { addDays, addMonths, format, parseISO, isAfter, isBefore, startOfMonth, endOfMonth } = require('date-fns');

// Utility function to group transactions by day
const groupTransactionsByDay = (transactions) => {
  const grouped = {};
  
  transactions.forEach(transaction => {
    const date = format(new Date(transaction.date), 'yyyy-MM-dd');
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(transaction);
  });
  
  return grouped;
};

// Add these utility functions before the getCashFlowPrediction function

// Function to determine if a recurring transaction should occur in a given month
const shouldTransactionOccurInMonth = (recurringTransaction, monthStart, monthEnd) => {
  // Get the frequency of the transaction
  const frequency = recurringTransaction.frequency || 'monthly';
  
  // Check if the transaction should occur based on frequency
  switch (frequency) {
    case 'daily':
      return true; // Daily transactions will occur in any month
    
    case 'weekly':
      // Weekly transactions will occur in any month
      return true;
    
    case 'monthly':
      // Monthly transactions will always occur once per month
      return true;
    
    case 'quarterly':
      // Check if this is a quarter month based on the first occurrence
      const firstDate = new Date(recurringTransaction.firstOccurrence || recurringTransaction.date);
      const monthDiff = (monthStart.getMonth() - firstDate.getMonth()) + 
                        (monthStart.getFullYear() - firstDate.getFullYear()) * 12;
      return monthDiff % 3 === 0;
    
    case 'yearly':
      // Check if this is the same month as the first occurrence
      const firstYearlyDate = new Date(recurringTransaction.firstOccurrence || recurringTransaction.date);
      return monthStart.getMonth() === firstYearlyDate.getMonth();
    
    default:
      return true; // Default to monthly if frequency is unknown
  }
};

// Function to calculate the predicted date for a transaction in a given month
const calculatePredictedDate = (recurringTransaction, monthStart) => {
  // Get the day of month from the first occurrence
  const firstDate = new Date(recurringTransaction.firstOccurrence || recurringTransaction.date);
  const dayOfMonth = firstDate.getDate();
  
  // Create a new date in the target month with the same day
  const predictedDate = new Date(monthStart);
  predictedDate.setDate(Math.min(dayOfMonth, new Date(predictedDate.getFullYear(), predictedDate.getMonth() + 1, 0).getDate()));
  
  return predictedDate;
};

// Modification du code pour s'assurer que les montants sont correctement signés
const normalizeTransactionAmount = (transaction) => {
  // Si c'est une dépense, s'assurer que le montant est négatif
  if (transaction.type === 'expense' && transaction.amount > 0) {
    return -Math.abs(transaction.amount);
  }
  // Si c'est un revenu, s'assurer que le montant est positif
  else if (transaction.type === 'income' && transaction.amount < 0) {
    return Math.abs(transaction.amount);
  }
  return transaction.amount;
};

// Function to identify recurring transactions
const identifyRecurringTransactions = async (userId) => {
  // Get transactions from the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const transactions = await Transaction.find({
    user: userId,
    date: { $gte: sixMonthsAgo }
  }).populate('category');
  
  // Group transactions by description to find recurring ones
  const transactionGroups = {};
  
  transactions.forEach(transaction => {
    const key = transaction.description.toLowerCase().trim();
    if (!transactionGroups[key]) {
      transactionGroups[key] = [];
    }
    transactionGroups[key].push(transaction);
  });
  
  // Filter for recurring transactions (at least 2 occurrences)
  const recurringTransactions = [];
  
  for (const [description, group] of Object.entries(transactionGroups)) {
    if (group.length >= 2) {
      // Sort by date
      group.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Determine frequency
      const frequency = determineFrequency(group);
      
      // Normaliser le montant selon le type de transaction
      const normalizedAmount = normalizeTransactionAmount(group[0]);
      
      // Add to recurring transactions
      recurringTransactions.push({
        description: group[0].description,
        amount: normalizedAmount, // Utiliser le montant normalisé
        type: group[0].type,
        category: group[0].category ? group[0].category._id : null,
        frequency,
        firstOccurrence: group[0].date,
        occurrences: group.map(t => ({ 
          date: t.date, 
          amount: normalizeTransactionAmount(t) // Normaliser les montants des occurrences
        }))
      });
    }
  }
  
  return recurringTransactions;
};

// Function to determine the frequency of recurring transactions
const determineFrequency = (transactions) => {
  if (transactions.length < 2) return 'monthly'; // Default
  
  // Calculate average days between transactions
  let totalDays = 0;
  for (let i = 1; i < transactions.length; i++) {
    const daysDiff = Math.round((new Date(transactions[i].date) - new Date(transactions[i-1].date)) / (1000 * 60 * 60 * 24));
    totalDays += daysDiff;
  }
  
  const avgDays = totalDays / (transactions.length - 1);
  
  // Determine frequency based on average days
  if (avgDays <= 7) return 'weekly';
  if (avgDays <= 35) return 'monthly';
  if (avgDays <= 120) return 'quarterly';
  return 'yearly';
};

// Now your existing getCashFlowPrediction function should work
exports.getCashFlowPrediction = async (req, res) => {
  try {
    const { months = 3 } = req.query;
    const monthsToPredict = parseInt(months, 10);
    
    if (isNaN(monthsToPredict) || monthsToPredict < 1 || monthsToPredict > 12) {
      return res.status(400).json({ message: 'Le nombre de mois doit être entre 1 et 12' });
    }
    
    // Récupérer les transactions récurrentes
    const recurringTransactions = await identifyRecurringTransactions(req.user.id);
    
    // Récupérer toutes les catégories pour créer un mapping
    const categories = await Category.find({});
    const categoriesMap = {};
    categories.forEach(category => {
      categoriesMap[category._id.toString()] = category;
    });
    
    // Générer les prédictions pour les prochains mois
    const today = new Date();
    const predictions = [];
    
    for (let i = 0; i < monthsToPredict; i++) {
      const monthDate = addMonths(today, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      // Prédire les transactions pour ce mois
      const monthTransactions = [];
      
      // Ajouter les transactions récurrentes prévues pour ce mois
      recurringTransactions.forEach(recurring => {
        // Déterminer si cette transaction récurrente devrait apparaître ce mois-ci
        const shouldOccur = shouldTransactionOccurInMonth(recurring, monthStart, monthEnd);
        
        if (shouldOccur) {
          // Calculer la date prévue pour cette transaction
          const predictedDate = calculatePredictedDate(recurring, monthStart);
          
          // Obtenir les informations de catégorie
          const categoryId = recurring.category ? recurring.category.toString() : null;
          const categoryInfo = categoryId && categoriesMap[categoryId] 
            ? categoriesMap[categoryId] 
            : null;
          
          // Créer l'objet de transaction prédit avec les informations de catégorie
          const predictedTransaction = {
            ...recurring,
            date: predictedDate,
            predicted: true,
            categoryName: categoryInfo ? categoryInfo.name : 'Non catégorisé',
            categoryColor: categoryInfo ? categoryInfo.color : '#808080'
          };
          
          monthTransactions.push(predictedTransaction);
        }
      });
      
      // Trier les transactions par date
      monthTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Calculer le solde prévu
      let balance = 0;
      monthTransactions.forEach(transaction => {
        balance += transaction.amount;
      });
      
      // Ajouter les prédictions pour ce mois
      predictions.push({
        month: format(monthDate, 'MMMM yyyy'),
        startDate: monthStart,
        endDate: monthEnd,
        transactions: monthTransactions,
        balance
      });
    }
    
    res.json(predictions);
  } catch (error) {
    console.error('Erreur lors de la génération des prédictions de flux de trésorerie:', error);
    res.status(500).json({ message: 'Erreur lors de la génération des prédictions' });
  }
};