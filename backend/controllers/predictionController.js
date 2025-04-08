const Transaction = require('../models/Transaction');
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

// Function to identify recurring transactions
const identifyRecurringTransactions = async (userId) => {
  // Retrieve transactions from the last 6 months
  const sixMonthsAgo = addMonths(new Date(), -6);
  const transactions = await Transaction.find({
    date: { $gte: sixMonthsAgo },
    user: userId  // Add user filter here
  }).sort({ date: 1 });
  
  console.log(`Found ${transactions.length} transactions in the last 6 months for user ${userId}`);
  console.log(`Negative transactions: ${transactions.filter(t => t.amount < 0).length}`);
  
  // Regrouper par description et catégorie
  const transactionGroups = {};
  
  transactions.forEach(transaction => {
    const key = `${transaction.description.toLowerCase()}_${transaction.category}`;
    if (!transactionGroups[key]) {
      transactionGroups[key] = [];
    }
    transactionGroups[key].push(transaction);
  });
  
  // Identifier les transactions récurrentes (au moins 2 occurrences)
  const recurringPatterns = [];
  
  for (const [key, group] of Object.entries(transactionGroups)) {
    if (group.length >= 2) {
      // Vérifier si toutes les transactions du groupe ont le même signe
      const allPositive = group.every(t => t.amount > 0);
      const allNegative = group.every(t => t.amount < 0);
      
      // Si le groupe contient des transactions avec des signes différents, on les sépare
      if (!allPositive && !allNegative) {
        const positiveGroup = group.filter(t => t.amount > 0);
        const negativeGroup = group.filter(t => t.amount < 0);
        
        // Traiter chaque sous-groupe séparément s'ils ont au moins 2 transactions
        if (positiveGroup.length >= 2) {
          processTransactionGroup(positiveGroup, recurringPatterns);
        }
        
        if (negativeGroup.length >= 2) {
          processTransactionGroup(negativeGroup, recurringPatterns);
        }
      } else {
        // Groupe homogène, on le traite normalement
        processTransactionGroup(group, recurringPatterns);
      }
    }
  }
  
  console.log(`Identified ${recurringPatterns.length} recurring patterns`);
  console.log(`Negative patterns: ${recurringPatterns.filter(p => p.amount < 0).length}`);
  
  return recurringPatterns;
};

// Fonction auxiliaire pour traiter un groupe de transactions
const processTransactionGroup = (group, recurringPatterns) => {
  // Calculer l'intervalle moyen entre les transactions
  let totalDays = 0;
  let intervals = 0;
  
  for (let i = 1; i < group.length; i++) {
    const daysDiff = Math.abs((new Date(group[i].date) - new Date(group[i-1].date)) / (1000 * 60 * 60 * 24));
    totalDays += daysDiff;
    intervals++;
  }
  
  const avgInterval = Math.round(totalDays / intervals);
  
  // Calculer le montant moyen
  const totalAmount = group.reduce((sum, t) => sum + t.amount, 0);
  const avgAmount = totalAmount / group.length;
  
  // Calculer la variance du montant (pour déterminer si le montant est stable)
  const variance = group.reduce((sum, t) => sum + Math.pow(t.amount - avgAmount, 2), 0) / group.length;
  const stdDev = Math.sqrt(variance);
  
  // Calculer le niveau de confiance basé sur la régularité
  const occurrenceConfidence = Math.min(100, (group.length / 6) * 100); // Max 100% si 6+ occurrences
  const amountConfidence = Math.max(0, 100 - (stdDev / Math.abs(avgAmount) * 100));
  const confidence = Math.round((occurrenceConfidence + amountConfidence) / 2);
  
  // Récupérer le type de la transaction originale
  const transactionType = group[0].type;
  
  recurringPatterns.push({
    description: group[0].description,
    category: group[0].category,
    amount: avgAmount,
    interval: avgInterval, // en jours
    lastDate: group[group.length - 1].date,
    type: transactionType, // Utiliser le type de la transaction originale
    confidence: confidence,
    variance: stdDev
  });
};

// Fonction pour prédire les transactions futures
const predictFutureTransactions = (recurringPatterns, startDate, endDate) => {
  const predictions = [];
  
  recurringPatterns.forEach(pattern => {
    let nextDate = new Date(pattern.lastDate);
    
    // Continuer à ajouter des prédictions tant que la date est dans la plage demandée
    while (isBefore(nextDate, endDate)) {
      nextDate = addDays(nextDate, pattern.interval);
      
      if (isAfter(nextDate, startDate) && isBefore(nextDate, endDate)) {
        predictions.push({
          date: nextDate,
          description: pattern.description,
          category: pattern.category,
          amount: pattern.amount,
          type: pattern.type, // Utiliser le type du pattern récurrent
          confidence: pattern.confidence
        });
      }
    }
  });
  
  console.log(`Generated ${predictions.length} predicted transactions`);
  console.log(`Negative predictions: ${predictions.filter(p => p.amount < 0).length}`);
  
  return predictions;
};

// Fonction pour calculer le solde quotidien prévu
const calculateDailyBalances = async (predictions, months, userId) => {
  // Obtenir le solde actuel
  const currentBalance = await getCurrentBalance(userId);
  
  // Trier les prédictions par date
  predictions.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Créer un tableau de dates pour la période demandée
  const today = new Date();
  const endDate = addMonths(today, parseInt(months));
  
  const dailyData = [];
  let runningBalance = currentBalance;
  let currentDate = today;
  
  while (isBefore(currentDate, endDate)) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayTransactions = predictions.filter(p => 
      format(new Date(p.date), 'yyyy-MM-dd') === dateStr
    );
    
    // S'assurer que chaque transaction a un type
    dayTransactions.forEach(transaction => {
      if (!transaction.hasOwnProperty('type')) {
        // Fallback uniquement si le type n'existe pas
        transaction.type = transaction.amount > 0 ? 'income' : 'expense';
      }
    });
    
    const dayIncome = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const dayExpenses = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    runningBalance += dayIncome - dayExpenses;
    
    dailyData.push({
      date: dateStr,
      balance: runningBalance,
      income: dayIncome,
      expenses: dayExpenses,
      transactions: dayTransactions
    });
    
    currentDate = addDays(currentDate, 1);
  }
  
  return dailyData;
};

// Fonction pour obtenir le solde actuel
const getCurrentBalance = async (userId) => {
  const transactions = await Transaction.find({ user: userId });
  return transactions.reduce((balance, transaction) => balance + transaction.amount, 0);
};

// Fonction pour détecter les risques de découvert
const detectOverdraftRisk = (dailyData) => {
  for (const day of dailyData) {
    if (day.balance < 0) {
      return {
        date: day.date,
        balance: day.balance,
        message: `Un découvert est prévu pour le ${format(new Date(day.date), 'dd/MM/yyyy')} avec un solde de ${day.balance.toFixed(2)} €.`
      };
    }
    
    // Alerte si le solde devient inférieur à 100€
    if (day.balance < 100) {
      return {
        date: day.date,
        balance: day.balance,
        message: `Votre solde devrait descendre en dessous de 100€ le ${format(new Date(day.date), 'dd/MM/yyyy')} (${day.balance.toFixed(2)} €).`
      };
    }
  }
  
  return null;
};

// Contrôleur pour obtenir les prédictions de flux de trésorerie
exports.getCashFlowPrediction = async (req, res) => {
  try {
    const userId = req.user.id;  // Get the current user's ID from the request
    
    // Get the date range for prediction
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date();
    const endDate = req.query.endDate ? new Date(req.query.endDate) : addMonths(new Date(), 3);
    
    // Get recurring patterns for the current user
    const recurringPatterns = await identifyRecurringTransactions(userId);
    
    // Prédire les transactions futures
    const today = new Date();
    const months = req.query.months || 3; // Utiliser la valeur fournie ou 3 mois par défaut
    const predictionEndDate = addMonths(today, parseInt(months));
    const predictedTransactions = predictFutureTransactions(recurringPatterns, today, predictionEndDate);
    
    // Calculer les soldes quotidiens
    const dailyPredictions = await calculateDailyBalances(predictedTransactions, months, userId);
    
    // Détecter les risques de découvert
    const overdraftRisk = detectOverdraftRisk(dailyPredictions);
    
    // Vérifier que les transactions sont bien préservées dans la réponse
    const allTransactions = dailyPredictions.flatMap(day => day.transactions);
    console.log(`Total transactions in response: ${allTransactions.length}`);
    console.log(`Negative transactions in response: ${allTransactions.filter(t => t.amount < 0).length}`);
    
    res.json({
      predictions: dailyPredictions,
      overdraftRisk
    });
  } catch (error) {
    console.error('Error generating cash flow prediction:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating cash flow prediction',
      error: error.message
    });
  }
};