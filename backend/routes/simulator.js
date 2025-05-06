const express = require('express');
const router = express.Router();
const simulatorController = require('../controllers/simulatorController');

// Routes pour les différents types de simulations
router.post('/loan', simulatorController.calculateLoan);
router.post('/investment', simulatorController.calculateInvestment);
router.post('/retirement', simulatorController.calculateRetirement);

module.exports = router;