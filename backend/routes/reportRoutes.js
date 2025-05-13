const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

// Route pour le rapport Revenus et Dépenses
router.get('/income-expense', protect, reportController.getIncomeExpenseReport);

module.exports = router;