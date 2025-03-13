// backend/controllers/transactionController.js
const Transaction = require('../models/Transaction');

// Get all transactions
exports.getAllTransactions = async (req, res) => {
    try {
        let query = {};
        
        // Filtrer par date si les paramètres sont fournis
        if (req.query.startDate && req.query.endDate) {
            query.date = { 
                $gte: new Date(req.query.startDate), 
                $lte: new Date(req.query.endDate) 
            };
        }
        
        const transactions = await Transaction.find(query).sort({ date: -1 }); // Sort by date descending
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching transactions', error: error.message });
    }
};

// Get transactions for reports (last year)
exports.getReportTransactions = async (req, res) => {
    try {
        // Calculer la date d'il y a un an
        const now = new Date();
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        
        const transactions = await Transaction.find({
            date: { $gte: oneYearAgo }
        }).sort({ date: -1 }); // Tri par date décroissante
        
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching report transactions', error: error.message });
    }
};

// Create a new transaction
exports.createTransaction = async (req, res) => {
    try {
        const newTransaction = new Transaction(req.body);
        const savedTransaction = await newTransaction.save();
        res.status(201).json(savedTransaction);
    } catch (error) {
        res.status(400).json({ message: 'Error creating transaction', error: error.message });
    }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching transaction', error: error.message });
    }
};

// Update transaction by ID
exports.updateTransaction = async (req, res) => {
    try {
        const updatedTransaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedTransaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        res.json(updatedTransaction);
    } catch (error) {
        res.status(400).json({ message: 'Error updating transaction', error: error.message });
    }
};

// Delete transaction by ID
exports.deleteTransaction = async (req, res) => {
    try {
        const deletedTransaction = await Transaction.findByIdAndDelete(req.params.id);
        if (!deletedTransaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting transaction', error: error.message });
    }
};

// Get Dashboard Data (Current Month Summary)
exports.getDashboardData = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const transactions = await Transaction.find({
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        let totalIncome = 0;
        let totalExpenses = 0;

        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                totalIncome += transaction.amount;
            } else if (transaction.type === 'expense') {
                totalExpenses += transaction.amount;
            }
        });

        const savings = totalIncome - Math.abs(totalExpenses); // Ensure expenses are positive for savings calculation

        res.json({
            totalIncome,
            totalExpenses: Math.abs(totalExpenses), // Return expenses as positive
            savings,
        });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
    }
};