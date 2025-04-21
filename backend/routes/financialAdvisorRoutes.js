const express = require('express');
const router = express.Router();
const financialAdvisorController = require('../controllers/financialAdvisorController');
// Supprimé: const { protect } = require('../middleware/auth');

// Routes pour les insights et recommandations
router.get('/insights', financialAdvisorController.getFinancialInsights);

// Routes pour les recommandations sauvegardées
router.get('/saved-recommendations', financialAdvisorController.getSavedRecommendations);
router.post('/saved-recommendations', financialAdvisorController.saveRecommendation);
router.patch('/saved-recommendations/:id/steps/:stepIndex', financialAdvisorController.updateRecommendationStep);
router.delete('/saved-recommendations/:id', financialAdvisorController.deleteRecommendation);

// Routes pour les données de progression
router.get('/progress', financialAdvisorController.getProgressData);
router.post('/progress', financialAdvisorController.saveProgressData);
router.post('/progress/calculate', financialAdvisorController.calculateProgressKPIs);

module.exports = router;