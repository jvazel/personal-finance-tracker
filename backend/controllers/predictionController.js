const Transaction = require('../models/Transaction');
const { addDays, addMonths, format, parseISO, isAfter, isBefore, startOfMonth, endOfMonth } = require('date-fns');

// Fonction utilitaire pour regrouper les transactions par jour
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

// Fonction pour identifier les transactions récurrentes
const identifyRecurringTransactions = async () => {
  // Récupérer les transactions des 6 derniers mois
  const sixMonthsAgo = addMonths(new Date(), -6);
  const transactions = await Transaction.find({
    date: { $gte: sixMonthsAgo }
  }).sort({ date: 1 });
  
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
      // Plus le nombre d'occurrences est élevé et plus la variance est faible, plus la confiance est élevée
      const occurrenceConfidence = Math.min(100, (group.length / 6) * 100); // Max 100% si 6+ occurrences
      const amountConfidence = Math.max(0, 100 - (stdDev / Math.abs(avgAmount) * 100));
      const confidence = Math.round((occurrenceConfidence + amountConfidence) / 2);
      
      recurringPatterns.push({
        description: group[0].description,
        category: group[0].category,
        amount: avgAmount,
        interval: avgInterval, // en jours
        lastDate: group[group.length - 1].date,
        confidence: confidence,
        variance: stdDev
      });
    }
  }
  
  return recurringPatterns;
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
          confidence: pattern.confidence
        });
      }
    }
  });
  
  return predictions;
};

// Fonction pour calculer le solde quotidien prévu
const calculateDailyBalances = async (predictions, months) => {
  // Obtenir le solde actuel
  const currentBalance = await getCurrentBalance();
  
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
    
    const dayIncome = dayTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const dayExpenses = dayTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    // Mettre à jour le solde
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
const getCurrentBalance = async () => {
  const transactions = await Transaction.find();
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
    const { months = 3 } = req.query;
    
    // Identifier les transactions récurrentes
    const recurringPatterns = await identifyRecurringTransactions();
    
    // Prédire les transactions futures
    const today = new Date();
    const endDate = addMonths(today, parseInt(months));
    const predictedTransactions = predictFutureTransactions(recurringPatterns, today, endDate);
    
    // Calculer les soldes quotidiens
    const dailyPredictions = await calculateDailyBalances(predictedTransactions, months);
    
    // Détecter les risques de découvert
    const overdraftRisk = detectOverdraftRisk(dailyPredictions);
    
    res.json({
      predictions: dailyPredictions,
      overdraftRisk
    });
  } catch (error) {
    console.error('Error generating cash flow prediction:', error);
    res.status(500).json({ message: 'Erreur lors de la génération des prédictions de flux de trésorerie' });
  }
};