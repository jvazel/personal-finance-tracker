const express = require('express');
const router = express.Router();
const financialAdvisorController = require('../controllers/financialAdvisorController');
const { protect } = require('../middleware/auth');

// Routes pour les insights et recommandations
router.get('/insights', protect, financialAdvisorController.getFinancialInsights);

// Routes pour les recommandations sauvegardées
router.get('/saved-recommendations', protect, financialAdvisorController.getSavedRecommendations);
router.post('/saved-recommendations', protect, financialAdvisorController.saveRecommendation);
router.patch('/saved-recommendations/:id/steps/:stepIndex', protect, financialAdvisorController.updateRecommendationStep);
router.delete('/saved-recommendations/:id', protect, financialAdvisorController.deleteRecommendation);

// Routes pour les données de progression
router.get('/progress', protect, financialAdvisorController.getFinancialProgress);
router.post('/progress', protect, financialAdvisorController.updateFinancialProgress);

module.exports = router;