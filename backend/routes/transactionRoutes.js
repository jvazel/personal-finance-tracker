// backend/routes/transactionRoutes.js
const express = require('express');
const transactionController = require('../controllers/transactionController');
const router = express.Router();

router.get('/', transactionController.getAllTransactions);
router.get('/reports', transactionController.getReportTransactions);
router.get('/dashboard', transactionController.getDashboardData);
router.post('/', transactionController.createTransaction);
router.get('/expenses-by-category', transactionController.getExpensesByCategory);
router.get('/top-expenses', transactionController.getTopExpenses);
router.get('/monthly-summary', transactionController.getMonthlySummary);
router.get('/trends', transactionController.getIncomeExpenseTrends);
router.get('/recurring-bills', transactionController.getRecurringBills);
router.get('/categories', transactionController.getCategories);
router.get('/expense-report', transactionController.getExpenseReport);
router.get('/:id', transactionController.getTransactionById);
router.put('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);
module.exports = router;