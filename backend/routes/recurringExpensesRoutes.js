const express = require('express');
const router = express.Router();
const recurringExpensesController = require('../controllers/recurringExpensesController');

// Route pour obtenir toutes les dépenses récurrentes
router.get('/', recurringExpensesController.getRecurringExpenses);

// Route pour obtenir les détails d'une dépense récurrente spécifique
router.get('/:payee', recurringExpensesController.getRecurringExpenseDetails);

module.exports = router;