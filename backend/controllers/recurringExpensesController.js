const Transaction = require('../models/Transaction');

// Fonction pour identifier les dépenses récurrentes
exports.getRecurringExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Récupérer toutes les transactions de dépense de l'utilisateur
    const transactions = await Transaction.find({ 
      userId, 
      type: 'expense',
      // Limiter aux 12 derniers mois pour l'analyse
      date: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
    }).sort({ date: 1 });
    
    // Regrouper les transactions par bénéficiaire
    const groupedByPayee = {};
    transactions.forEach(transaction => {
      const payee = transaction.payee || 'Inconnu';
      if (!groupedByPayee[payee]) {
        groupedByPayee[payee] = [];
      }
      groupedByPayee[payee].push(transaction);
    });
    
    // Analyser chaque groupe pour détecter des motifs récurrents
    const recurringExpenses = [];
    
    for (const [payee, payeeTransactions] of Object.entries(groupedByPayee)) {
      // Ignorer les groupes avec moins de 2 transactions
      if (payeeTransactions.length < 2) continue;
      
      // Analyser les intervalles entre les transactions
      const intervals = [];
      for (let i = 1; i < payeeTransactions.length; i++) {
        const daysDiff = Math.round((new Date(payeeTransactions[i].date) - new Date(payeeTransactions[i-1].date)) / (1000 * 60 * 60 * 24));
        intervals.push(daysDiff);
      }
      
      // Calculer l'écart-type des intervalles pour mesurer la régularité
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);
      
      // Déterminer la fréquence probable
      let frequency = 'inconnue';
      let confidenceScore = 0;
      
      if (avgInterval >= 25 && avgInterval <= 35) {
        frequency = 'mensuelle';
        confidenceScore = 100 - (stdDev / avgInterval * 100);
      } else if (avgInterval >= 85 && avgInterval <= 95) {
        frequency = 'trimestrielle';
        confidenceScore = 100 - (stdDev / avgInterval * 100);
      } else if (avgInterval >= 350 && avgInterval <= 380) {
        frequency = 'annuelle';
        confidenceScore = 100 - (stdDev / avgInterval * 100);
      } else if (stdDev < 5 && intervals.length > 2) {
        // Si l'écart-type est faible, c'est probablement récurrent avec une fréquence personnalisée
        frequency = `tous les ${Math.round(avgInterval)} jours`;
        confidenceScore = 100 - (stdDev / avgInterval * 100);
      }
      
      // Ne conserver que les dépenses avec une confiance suffisante
      if (confidenceScore > 60) {
        // Calculer le montant moyen
        const avgAmount = payeeTransactions.reduce((sum, t) => sum + t.amount, 0) / payeeTransactions.length;
        
        // Calculer la date prévue du prochain paiement
        const lastDate = new Date(payeeTransactions[payeeTransactions.length - 1].date);
        const nextPaymentDate = new Date(lastDate);
        
        if (frequency === 'mensuelle') {
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        } else if (frequency === 'trimestrielle') {
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3);
        } else if (frequency === 'annuelle') {
          nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
        } else if (frequency.startsWith('tous les')) {
          nextPaymentDate.setDate(nextPaymentDate.getDate() + Math.round(avgInterval));
        }
        
        recurringExpenses.push({
          payee,
          frequency,
          avgAmount: parseFloat(avgAmount.toFixed(2)),
          avgInterval: Math.round(avgInterval),
          confidenceScore: parseFloat(confidenceScore.toFixed(2)),
          transactions: payeeTransactions.map(t => ({
            id: t._id,
            date: t.date,
            amount: t.amount,
            category: t.category,
            description: t.description
          })),
          lastPaymentDate: lastDate,
          nextPaymentDate,
          totalSpent: parseFloat(payeeTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)),
          count: payeeTransactions.length
        });
      }
    }
    
    // Trier par niveau de confiance décroissant
    recurringExpenses.sort((a, b) => b.confidenceScore - a.confidenceScore);
    
    // Calculer des statistiques globales
    const totalMonthlyRecurring = recurringExpenses
      .filter(exp => exp.frequency === 'mensuelle')
      .reduce((sum, exp) => sum + exp.avgAmount, 0);
      
    const totalQuarterlyRecurring = recurringExpenses
      .filter(exp => exp.frequency === 'trimestrielle')
      .reduce((sum, exp) => sum + exp.avgAmount, 0);
      
    const totalAnnualRecurring = recurringExpenses
      .filter(exp => exp.frequency === 'annuelle')
      .reduce((sum, exp) => sum + exp.avgAmount, 0);
    
    const statistics = {
      totalRecurringExpenses: recurringExpenses.length,
      totalMonthlyRecurring: parseFloat(totalMonthlyRecurring.toFixed(2)),
      totalQuarterlyRecurring: parseFloat(totalQuarterlyRecurring.toFixed(2)),
      totalAnnualRecurring: parseFloat(totalAnnualRecurring.toFixed(2)),
      estimatedMonthlyBudget: parseFloat((totalMonthlyRecurring + (totalQuarterlyRecurring / 3) + (totalAnnualRecurring / 12)).toFixed(2))
    };
    
    res.json({
      recurringExpenses,
      statistics
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'identification des dépenses récurrentes:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'analyse des dépenses récurrentes' });
  }
};

// Fonction pour obtenir les détails d'une dépense récurrente spécifique
exports.getRecurringExpenseDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { payee } = req.params;
    
    // Récupérer toutes les transactions pour ce bénéficiaire
    const transactions = await Transaction.find({ 
      userId, 
      type: 'expense',
      payee
    }).sort({ date: 1 });
    
    if (transactions.length === 0) {
      return res.status(404).json({ message: 'Aucune transaction trouvée pour ce bénéficiaire' });
    }
    
    // Analyser l'historique des montants pour détecter les variations
    const amountHistory = transactions.map(t => ({
      date: t.date,
      amount: t.amount
    }));
    
    // Calculer les statistiques
    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const avgAmount = totalSpent / transactions.length;
    
    res.json({
      payee,
      transactions,
      amountHistory,
      statistics: {
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        avgAmount: parseFloat(avgAmount.toFixed(2)),
        transactionCount: transactions.length,
        firstTransaction: transactions[0].date,
        lastTransaction: transactions[transactions.length - 1].date
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de dépense récurrente:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};