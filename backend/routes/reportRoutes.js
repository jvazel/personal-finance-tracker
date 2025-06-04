const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

// Route pour le rapport Revenus et Dépenses
router.get('/income-expense', protect, reportController.getIncomeExpenseReport);

// Route pour le rapport d'évolution des catégories
router.get('/category-evolution', protect, reportController.getCategoryEvolutionReport);

module.exports = router;