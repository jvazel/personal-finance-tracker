// backend/routes/transactionRoutes.js
const express = require('express');
const transactionController = require('../controllers/transactionController');
const router = express.Router();

router.get('/', transactionController.getAllTransactions);
router.get('/reports', transactionController.getReportTransactions); // Nouvelle route pour les rapports
router.post('/', transactionController.createTransaction);
router.get('/:id', transactionController.getTransactionById);
router.put('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;