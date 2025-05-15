/**
 * Contrôleur pour les fonctionnalités de simulation financière
 */
const logger = require('../utils/logger');

// Calcul de prêt (mensualités, intérêts totaux, etc.)
exports.calculateLoan = (req, res) => {
  try {
    const { principal, interestRate, termYears, startDate } = req.body;
    
    // Validation des entrées
    if (!principal || !interestRate || !termYears) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    
    // Conversion du taux d'intérêt annuel en taux mensuel
    const monthlyRate = interestRate / 100 / 12;
    
    // Nombre total de paiements
    const totalPayments = termYears * 12;
    
    // Calcul de la mensualité (formule de prêt standard)
    const monthlyPayment = principal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments) / 
                          (Math.pow(1 + monthlyRate, totalPayments) - 1);
    
    // Calcul du coût total du prêt
    const totalCost = monthlyPayment * totalPayments;
    
    // Calcul des intérêts totaux
    const totalInterest = totalCost - principal;
    
    // Génération du tableau d'amortissement
    const amortizationSchedule = [];
    let remainingPrincipal = principal;
    
    for (let i = 1; i <= totalPayments; i++) {
      const interestPayment = remainingPrincipal * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingPrincipal -= principalPayment;
      
      amortizationSchedule.push({
        paymentNumber: i,
        paymentAmount: monthlyPayment,
        principalPayment: principalPayment,
        interestPayment: interestPayment,
        remainingPrincipal: remainingPrincipal > 0 ? remainingPrincipal : 0
      });
    }
    
    res.json({
      monthlyPayment,
      totalPayments,
      totalCost,
      totalInterest,
      amortizationSchedule
    });
  } catch (error) {
    logger.error('Erreur lors du calcul du prêt:', { 
      error: error.message, 
      stack: error.stack,
      userId: req.user.id,
      loanData: req.body
    });
    res.status(500).json({ error: 'Erreur lors du calcul du prêt' });
  }
};

// Calcul d'investissement (croissance, rendement, etc.)
exports.calculateInvestment = (req, res) => {
  try {
    const { 
      initialInvestment, 
      monthlyContribution, 
      annualReturnRate, 
      investmentYears,
      compoundingFrequency = 12 // Mensuel par défaut
    } = req.body;
    
    // Validation des entrées
    if (!initialInvestment || !annualReturnRate || !investmentYears) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    
    // Conversion du taux annuel en taux par période
    const ratePerPeriod = annualReturnRate / 100 / compoundingFrequency;
    
    // Nombre total de périodes
    const totalPeriods = investmentYears * compoundingFrequency;
    
    // Tableau de croissance de l'investissement
    const growthData = [];
    let currentValue = initialInvestment;
    
    for (let i = 1; i <= totalPeriods; i++) {
      // Ajout de la contribution mensuelle
      currentValue += monthlyContribution;
      
      // Application du rendement pour cette période
      const interestEarned = currentValue * ratePerPeriod;
      currentValue += interestEarned;
      
      // Ajout au tableau de croissance (par année)
      if (i % compoundingFrequency === 0) {
        growthData.push({
          year: i / compoundingFrequency,
          value: currentValue,
          totalContributions: initialInvestment + (monthlyContribution * i),
          totalInterest: currentValue - initialInvestment - (monthlyContribution * i)
        });
      }
    }
    
    // Calcul des résultats finaux
    const finalValue = currentValue;
    const totalContributions = initialInvestment + (monthlyContribution * totalPeriods);
    const totalInterest = finalValue - totalContributions;
    
    res.json({
      finalValue,
      totalContributions,
      totalInterest,
      growthData
    });
  } catch (error) {
    logger.error('Erreur lors du calcul de l\'investissement:', { 
      error: error.message, 
      stack: error.stack,
      userId: req.user.id,
      investmentData: req.body
    });
    res.status(500).json({ error: 'Erreur lors du calcul de l\'investissement' });
  }
};

// Calcul de retraite (épargne nécessaire, projections, etc.)
exports.calculateRetirement = (req, res) => {
  try {
    const {
      currentAge,
      retirementAge,
      lifeExpectancy,
      currentSavings,
      monthlyContribution,
      annualReturnRate,
      annualReturnRatePostRetirement,
      desiredMonthlyIncome,
      expectedInflationRate
    } = req.body;
    
    // Validation des entrées
    if (!currentAge || !retirementAge || !lifeExpectancy || !desiredMonthlyIncome) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    
    // Années jusqu'à la retraite
    const yearsToRetirement = retirementAge - currentAge;
    
    // Années de retraite
    const retirementYears = lifeExpectancy - retirementAge;
    
    // Taux mensuels
    const monthlyReturnRate = annualReturnRate / 100 / 12;
    const monthlyReturnRatePostRetirement = annualReturnRatePostRetirement / 100 / 12;
    const monthlyInflationRate = expectedInflationRate / 100 / 12;
    
    // Calcul de l'épargne à la retraite
    let retirementSavings = currentSavings;
    const savingsGrowth = [];
    
    // Simulation de la croissance de l'épargne jusqu'à la retraite
    for (let year = 1; year <= yearsToRetirement; year++) {
      for (let month = 1; month <= 12; month++) {
        retirementSavings += monthlyContribution;
        retirementSavings *= (1 + monthlyReturnRate);
      }
      
      savingsGrowth.push({
        age: currentAge + year,
        savings: retirementSavings
      });
    }
    
    // Calcul du revenu mensuel ajusté à l'inflation au moment de la retraite
    const inflationAdjustedIncome = desiredMonthlyIncome * 
                                   Math.pow(1 + monthlyInflationRate, yearsToRetirement * 12);
    
    // Calcul du capital nécessaire pour la retraite
    // Formule simplifiée: capital = revenu mensuel * 12 * années de retraite
    // (en réalité, il faudrait tenir compte du rendement pendant la retraite)
    const requiredCapital = inflationAdjustedIncome * 12 * retirementYears;
    
    // Simulation de la phase de retraite (décaissement)
    const retirementPhase = [];
    let remainingSavings = retirementSavings;
    
    for (let year = 1; year <= retirementYears; year++) {
      const currentAge = retirementAge + year;
      const yearlyWithdrawal = inflationAdjustedIncome * 12 * 
                              Math.pow(1 + monthlyInflationRate, year * 12);
      
      remainingSavings = remainingSavings * Math.pow(1 + monthlyReturnRatePostRetirement, 12) - yearlyWithdrawal;
      
      retirementPhase.push({
        age: currentAge,
        withdrawal: yearlyWithdrawal,
        remainingSavings: remainingSavings > 0 ? remainingSavings : 0
      });
    }
    
    // Déterminer si l'épargne est suffisante
    const isSavingsSufficient = remainingSavings > 0;
    
    // Calcul du déficit ou surplus
    const savingGapAmount = isSavingsSufficient ? remainingSavings : Math.abs(remainingSavings);
    
    res.json({
      retirementSavings,
      inflationAdjustedIncome,
      requiredCapital,
      isSavingsSufficient,
      savingGapAmount,
      savingsGrowth,
      retirementPhase
    });
  } catch (error) {
    logger.error('Erreur lors du calcul de la retraite:', { 
      error: error.message, 
      stack: error.stack,
      userId: req.user.id,
      retirementData: req.body
    });
    res.status(500).json({ error: 'Erreur lors du calcul de la retraite' });
  }
};