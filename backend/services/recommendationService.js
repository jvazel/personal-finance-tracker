// Fonction pour générer des recommandations basées sur les insights
const generateRecommendations = (insights, monthlySpendingByCategory, months) => {
  const recommendations = [];
  
  // Pas assez de données
  if (months.length < 2 || insights.length === 0) {
    return recommendations;
  }
  
  // Recommandations basées sur les insights
  insights.forEach(insight => {
    if (insight.type === 'spending_increase' && insight.severity === 'medium') {
      recommendations.push({
        title: `Réduire les dépenses en ${insight.category}`,
        description: `Vos dépenses en ${insight.category} ont augmenté significativement. Considérez les moyens de les réduire.`,
        difficulty: 'Moyenne',
        potentialImpact: 'Élevé',
        steps: [
          `Analysez en détail vos dépenses en ${insight.category}`,
          'Identifiez les dépenses non essentielles',
          'Établissez un budget mensuel pour cette catégorie',
          'Suivez vos progrès régulièrement'
        ]
      });
    }
    
    if (insight.type === 'warning' && insight.category === 'Épargne') {
      recommendations.push({
        title: 'Augmenter votre taux d\'épargne',
        description: 'Un taux d\'épargne plus élevé vous aidera à atteindre vos objectifs financiers et à faire face aux imprévus.',
        difficulty: 'Moyenne',
        potentialImpact: 'Très élevé',
        steps: [
          'Fixez-vous un objectif d\'épargne mensuel',
          'Automatisez vos virements vers un compte d\'épargne',
          'Réduisez vos dépenses non essentielles',
          'Envisagez des sources de revenus supplémentaires'
        ]
      });
    }
    
    if (insight.type === 'pattern' && insight.title.includes('récurrentes')) {
      recommendations.push({
        title: `Optimiser vos dépenses en ${insight.category}`,
        description: `Vos dépenses récurrentes en ${insight.category} sont élevées. Voici comment les optimiser.`,
        difficulty: 'Moyenne',
        potentialImpact: 'Élevé',
        steps: [
          'Comparez les offres des différents fournisseurs',
          'Négociez vos contrats actuels',
          'Envisagez des alternatives moins coûteuses',
          'Éliminez les services que vous n\'utilisez pas pleinement'
        ]
      });
    }
  });
  
  // Recommandations générales basées sur l'analyse des données
  const currentMonth = months[months.length - 1];
  const currentData = monthlySpendingByCategory[currentMonth];
  
  // Recommandation sur la diversification des dépenses
  const categories = Object.keys(currentData.categories);
  const totalExpense = currentData.total.expense;
  
  categories.forEach(category => {
    const categoryAmount = currentData.categories[category];
    const categoryPercentage = (categoryAmount / totalExpense) * 100;
    
    if (categoryPercentage > 40 && categoryAmount > 300) {
      recommendations.push({
        title: `Diversifier vos dépenses en ${category}`,
        description: `${category} représente ${categoryPercentage.toFixed(1)}% de vos dépenses totales. Une telle concentration peut présenter des risques.`,
        difficulty: 'Difficile',
        potentialImpact: 'Moyen',
        steps: [
          'Analysez en détail cette catégorie de dépenses',
          'Identifiez les postes qui peuvent être réduits',
          'Recherchez des alternatives moins coûteuses',
          'Établissez un budget maximum pour cette catégorie'
        ]
      });
    }
  });
  
  // Recommandation sur l'épargne d'urgence
  const monthlyIncome = currentData.total.income;
  if (monthlyIncome > 0) {
    recommendations.push({
      title: 'Constituer un fonds d\'urgence',
      description: 'Un fonds d\'urgence équivalent à 3-6 mois de dépenses est essentiel pour faire face aux imprévus.',
      difficulty: 'Moyenne',
      potentialImpact: 'Très élevé',
      steps: [
        'Déterminez le montant cible (3-6 mois de dépenses)',
        'Ouvrez un compte d\'épargne dédié',
        'Mettez en place un virement automatique mensuel',
        'N\'utilisez ce fonds qu\'en cas d\'urgence véritable'
      ]
    });
  }
  
  // Recommandations basées sur les objectifs
  const goalInsights = insights.filter(insight => insight.category === 'Objectifs');
  
  if (goalInsights.length > 0) {
    const noGoalsInsight = goalInsights.find(insight => 
      insight.title === 'Aucun objectif financier défini'
    );
    
    if (noGoalsInsight) {
      recommendations.push({
        title: 'Définir des objectifs financiers SMART',
        description: 'Des objectifs Spécifiques, Mesurables, Atteignables, Réalistes et Temporels vous aideront à structurer votre plan financier.',
        difficulty: 'Facile',
        potentialImpact: 'Très élevé',
        steps: [
          'Réfléchissez à vos priorités financières (achat immobilier, retraite, etc.)',
          'Fixez un montant précis pour chaque objectif',
          'Établissez une date limite réaliste',
          'Déterminez combien vous devez épargner mensuellement',
          'Suivez régulièrement votre progression'
        ]
      });
    }
    
    const slowProgressInsights = goalInsights.filter(insight => 
      insight.title.includes('Progression lente')
    );
    
    if (slowProgressInsights.length > 0) {
      recommendations.push({
        title: 'Accélérer la progression vers vos objectifs',
        description: 'Plusieurs de vos objectifs progressent lentement. Voici comment accélérer leur réalisation.',
        difficulty: 'Moyenne',
        potentialImpact: 'Élevé',
        steps: [
          'Réévaluez vos dépenses mensuelles pour dégager plus d\'épargne',
          'Automatisez vos virements vers vos comptes d\'épargne dédiés',
          'Envisagez des sources de revenus complémentaires',
          'Ajustez vos objectifs si nécessaire pour qu\'ils restent réalistes'
        ]
      });
    }
  }
  
  return recommendations;
};

module.exports = {
  generateRecommendations
};