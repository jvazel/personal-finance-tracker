const express = require('express');
const router = express.Router();
const financialAdvisorController = require('../controllers/financialAdvisorController');

// Routes pour le conseiller financier
router.get('/insights', financialAdvisorController.getFinancialInsights);

module.exports = router;