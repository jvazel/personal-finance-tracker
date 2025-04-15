const Transaction = require('../../models/Transaction');
const { getDateRange } = require('./utils');

/**
 * Detect outliers in transaction data
 */
async function getOutliers(userId, period, startDate, endDate, threshold) {
    // Calculate date range
    const dateRange = getDateRange(period, startDate, endDate);
    
    // Get all transactions for the period
    const transactions = await Transaction.find({
        user: userId,
        date: { $gte: dateRange.start, $lte: dateRange.end }
    }).populate('category');
    
    // Group transactions by category
    const categorizedTransactions = {};
    transactions.forEach(transaction => {
        const categoryId = transaction.category ? transaction.category._id.toString() : 'uncategorized';
        if (!categorizedTransactions[categoryId]) {
            categorizedTransactions[categoryId] = [];
        }
        categorizedTransactions[categoryId].push(transaction);
    });
    
    // Detect outliers in each category using Z-score
    const outliers = [];
    
    for (const categoryId in categorizedTransactions) {
        const categoryTransactions = categorizedTransactions[categoryId];
        
        // Need at least 5 transactions to detect outliers
        if (categoryTransactions.length < 5) continue;
        
        // Calculate mean and standard deviation
        const amounts = categoryTransactions.map(t => Math.abs(t.amount));
        const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
        const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length;
        const stdDev = Math.sqrt(variance);
        
        // Detect outliers (Z-score > threshold)
        categoryTransactions.forEach(transaction => {
            const zScore = Math.abs((Math.abs(transaction.amount) - mean) / stdDev);
            
            if (zScore > parseFloat(threshold)) {
                outliers.push({
                    transaction: {
                        _id: transaction._id,
                        date: transaction.date,
                        amount: transaction.amount,
                        description: transaction.description,
                        type: transaction.type
                    },
                    category: transaction.category ? {
                        _id: transaction.category._id,
                        name: transaction.category.name,
                        color: transaction.category.color
                    } : null,
                    statistics: {
                        zScore,
                        mean,
                        stdDev,
                        percentageDeviation: ((Math.abs(transaction.amount) - mean) / mean) * 100
                    }
                });
            }
        });
    }
    
    // Sort outliers by Z-score (highest first)
    outliers.sort((a, b) => b.statistics.zScore - a.statistics.zScore);
    
    return outliers;
}

module.exports = {
    getOutliers
};