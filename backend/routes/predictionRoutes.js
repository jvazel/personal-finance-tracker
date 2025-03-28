const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');

// Route pour obtenir les prédictions de flux de trésorerie
router.get('/cash-flow', predictionController.getCashFlowPrediction);

module.exports = router;