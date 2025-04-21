const Goal = require('../models/Goal');

// Fonction pour analyser les objectifs financiers
const analyzeFinancialGoals = async (userId) => {
  // Récupérer les objectifs de l'utilisateur
  const goals = await Goal.find({ user: userId });
  const insights = [];
  
  if (goals.length === 0) {
    insights.push({
      type: 'warning',
      title: 'Aucun objectif financier défini',
      description: 'Définir des objectifs financiers clairs vous aidera à mieux planifier votre avenir financier.',
      severity: 'medium',
      category: 'Objectifs',
      impact: 'Négatif'
    });
  } else {
    // Analyser la progression vers les objectifs
    for (const goal of goals) {
      const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
      
      if (progressPercentage < 25) {
        insights.push({
          type: 'warning',
          title: `Progression lente vers l'objectif: ${goal.title}`,
          description: `Vous avez atteint seulement ${progressPercentage.toFixed(1)}% de votre objectif "${goal.title}". Envisagez d'augmenter vos contributions mensuelles.`,
          severity: 'medium',
          category: 'Objectifs',
          impact: 'Négatif'
        });
      } else if (progressPercentage >= 90) {
        insights.push({
          type: 'achievement',
          title: `Objectif presque atteint: ${goal.title}`,
          description: `Félicitations! Vous avez atteint ${progressPercentage.toFixed(1)}% de votre objectif "${goal.title}". Continuez ainsi!`,
          severity: 'low',
          category: 'Objectifs',
          impact: 'Positif'
        });
      }
    }
  }
  
  return insights;
};

module.exports = {
  analyzeFinancialGoals
};