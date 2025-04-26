// At the top of the file, add the kpiService import
const FinancialProgress = require('../models/FinancialProgress');
const SavedRecommendation = require('../models/SavedRecommendation');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Goal = require('../models/Goal');
const ProgressData = require('../models/ProgressData');
const kpiService = require('../services/kpiService');

const { SeededRandom, getDateRange, replaceIdsWithCategoryNames } = require('../services/financialUtils');
const { analyzeSpendingTrends } = require('../services/spendingAnalysisService');
const { analyzeFinancialGoals } = require('../services/goalAnalysisService');
const { generateRecommendations } = require('../services/recommendationService');
const progressService = require('../services/progressService');

const { 
  startOfMonth, endOfMonth, subMonths, 
  startOfYear, endOfYear, subYears,
  format, parseISO, isAfter, isBefore,
  addMonths
} = require('date-fns');

// Contrôleur pour obtenir les insights et recommandations
exports.getFinancialInsights = async (req, res) => {
  try {
    const { timeframe = '3months' } = req.query;
    const userId = req.user.id;

    // Récupérer toutes les catégories de l'utilisateur pour les avoir disponibles
    const categories = await Category.find({ user: userId });
    const categoriesMap = categories.reduce((map, category) => {
      map[category._id.toString()] = category;
      return map;
    }, {});
    
    // Analyser les tendances de dépenses
    const { insights: spendingInsights, monthlySpendingByCategory, months } = 
      await analyzeSpendingTrends(userId, timeframe);
    
    // Analyser les objectifs financiers
    const goalInsights = await analyzeFinancialGoals(userId);
    
    // Combiner les insights
    let allInsights = [...spendingInsights, ...goalInsights];
    
    // Remplacer les références aux IDs de catégorie par les noms dans les titres et descriptions
    allInsights = allInsights.map(insight => {
      // Si l'insight a une catégorie qui est un ID MongoDB
      if (insight.category && typeof insight.category === 'string' && /^[a-f0-9]{24}$/.test(insight.category)) {
        const categoryId = insight.category;
        if (categoriesMap[categoryId]) {
          insight.category = categoriesMap[categoryId].name;
        }
      }
      
      // Remplacer les IDs dans le titre et la description
      if (insight.title) {
        insight.title = replaceIdsWithCategoryNames(insight.title, categoriesMap);
      }
      
      if (insight.description) {
        insight.description = replaceIdsWithCategoryNames(insight.description, categoriesMap);
      }
      
      return insight;
    });
    
    // Générer des recommandations basées sur tous les insights
    let recommendations = generateRecommendations(allInsights, monthlySpendingByCategory, months);
    
    // Remplacer les références aux IDs de catégorie dans les recommandations
    recommendations = recommendations.map(recommendation => {
      if (recommendation.title) {
        recommendation.title = replaceIdsWithCategoryNames(recommendation.title, categoriesMap);
      }
      
      if (recommendation.description) {
        recommendation.description = replaceIdsWithCategoryNames(recommendation.description, categoriesMap);
      }
      
      return recommendation;
    });
    
    res.json({
      insights: allInsights,
      recommendations
    });
  } catch (error) {
    console.error('Erreur lors de la génération des conseils financiers:', error);
    res.status(500).json({ message: 'Erreur lors de la génération des conseils financiers' });
  }
};

// Récupérer toutes les recommandations sauvegardées
exports.getSavedRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const savedRecommendations = await SavedRecommendation.find({ user: userId })
      .sort({ dateCreated: -1 });
    
    res.json(savedRecommendations);
  } catch (error) {
    console.error('Erreur lors de la récupération des recommandations sauvegardées:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des recommandations sauvegardées' });
  }
};

// Sauvegarder une recommandation
exports.saveRecommendation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, steps } = req.body;
    
    const newRecommendation = new SavedRecommendation({
      user: userId,
      title,
      description,
      steps
    });
    
    const savedRecommendation = await newRecommendation.save();
    
    res.status(201).json(savedRecommendation);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la recommandation:', error);
    res.status(500).json({ message: 'Erreur lors de la sauvegarde de la recommandation' });
  }
};

// Mettre à jour une étape d'une recommandation
exports.updateRecommendationStep = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, stepIndex } = req.params;
    const { completed } = req.body;
    
    // Vérifier que la recommandation appartient à l'utilisateur
    const savedRecommendation = await SavedRecommendation.findOne({
      _id: id,
      user: userId
    });
    
    if (!savedRecommendation) {
      return res.status(404).json({ message: 'Recommandation non trouvée' });
    }
    
    // Vérifier que l'index de l'étape est valide
    if (stepIndex < 0 || stepIndex >= savedRecommendation.steps.length) {
      return res.status(400).json({ message: 'Index d\'étape invalide' });
    }
    
    // Mettre à jour l'étape
    savedRecommendation.steps[stepIndex].completed = completed;
    await savedRecommendation.save();
    
    res.json(savedRecommendation);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'étape:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'étape' });
  }
};

// Supprimer une recommandation sauvegardée
exports.deleteRecommendation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Vérifier que la recommandation appartient à l'utilisateur
    const savedRecommendation = await SavedRecommendation.findOne({
      _id: id,
      user: userId
    });
    
    if (!savedRecommendation) {
      return res.status(404).json({ message: 'Recommandation non trouvée' });
    }
    
    await SavedRecommendation.findByIdAndDelete(id);
    
    res.json({ message: 'Recommandation supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la recommandation:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la recommandation' });
  }
};

// Récupérer les données de progression financière
exports.getFinancialProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeframe = '6months' } = req.query;
    
    const progressData = await progressService.getFinancialProgress(userId, timeframe);
    res.json(progressData);
  } catch (error) {
    console.error('Erreur lors de la récupération des données de progression:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des données de progression' });
  }
};

// Mettre à jour les données de progression financière
exports.updateFinancialProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const progressData = req.body;
    
    const updatedProgress = await progressService.updateFinancialProgress(userId, progressData);
    res.json(updatedProgress);
  } catch (error) {
    console.error('Erreur lors de la mise à jour des données de progression:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour des données de progression' });
  }
};

// Fonction pour récupérer les données de progression
exports.getProgressData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeframe } = req.query;
    
    const progressData = await progressService.getProgressData(userId, timeframe);
    res.status(200).json(progressData);
  } catch (error) {
    console.error('Erreur lors de la récupération des données de progression:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la récupération des données de progression', 
      error: error.message,
      stack: error.stack 
    });
  }
};

// Fonction pour enregistrer de nouvelles données de progression
exports.saveProgressData = async (req, res) => {
  try {
    const userId = req.user.id;
    const progressData = req.body;
    
    const newProgressData = await progressService.saveProgressData(userId, progressData);
    res.status(201).json(newProgressData);
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des données de progression:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Fonction pour calculer automatiquement les KPIs
// Update the calculateProgressKPIs function to use the kpiService
exports.calculateProgressKPIs = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Use the KPI service to calculate all KPIs
    const kpis = await kpiService.calculateFinancialKPIs(userId);

    // Save the KPIs to the database
    const newProgressData = await kpiService.saveKPIs(userId, kpis);
    
    res.status(200).json(newProgressData);
  } catch (error) {
    console.error('Error calculating KPIs:', error);
    res.status(500).json({ 
      message: 'Server error while calculating KPIs', 
      error: error.message,
      stack: error.stack 
    });
  }
};