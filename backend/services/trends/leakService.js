const Transaction = require('../../models/Transaction');
const { getDateRange } = require('./utils');

/**
 * Identify financial leaks (small recurring expenses that add up)
 */
async function getFinancialLeaks(userId, period, startDate, endDate, threshold) {
    // Calculate date range
    const dateRange = getDateRange(period, startDate, endDate);
    
    // Get all expense transactions for the period
    const transactions = await Transaction.find({
        user: userId,
        type: 'expense',
        date: { $gte: dateRange.start, $lte: dateRange.end }
    }).populate('category').sort({ date: 1 });
    
    // Group similar small transactions
    const smallTransactions = transactions.filter(t => t.amount <= 50); // Focus on small amounts
    
    // Group by similar descriptions
    const groupedTransactions = {};
    
    smallTransactions.forEach(transaction => {
        // Normalize description (lowercase, remove special chars)
        const normalizedDesc = transaction.description
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .trim();
        
        // Skip very short descriptions
        if (normalizedDesc.length < 3) return;
        
        // Find similar group or create new one
        let foundGroup = false;
        
        for (const groupKey in groupedTransactions) {
            // Check for similarity with existing groups
            if (groupKey.includes(normalizedDesc) || normalizedDesc.includes(groupKey)) {
                groupedTransactions[groupKey].transactions.push(transaction);
                groupedTransactions[groupKey].total += transaction.amount;
                foundGroup = true;
                break;
            }
        }
        
        if (!foundGroup) {
            groupedTransactions[normalizedDesc] = {
                description: transaction.description,
                normalizedDesc,
                transactions: [transaction],
                total: transaction.amount,
                category: transaction.category
            };
        }
    });
    
    // Calculate frequency and total impact
    const leaks = [];
    
    for (const key in groupedTransactions) {
        const group = groupedTransactions[key];
        
        // Only consider groups with multiple transactions
        if (group.transactions.length >= parseInt(threshold)) {
            // Calculate average frequency (days between transactions)
            const dates = group.transactions.map(t => new Date(t.date).getTime());
            dates.sort((a, b) => a - b);
            
            let totalGap = 0;
            let gapCount = 0;
            
            for (let i = 1; i < dates.length; i++) {
                const gap = (dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24); // Convert to days
                totalGap += gap;
                gapCount++;
            }
            
            const averageFrequency = gapCount > 0 ? totalGap / gapCount : 0;
            
            // Calculate monthly and yearly impact
            const monthlyImpact = averageFrequency > 0 ? 
                (group.total / group.transactions.length) * (30 / averageFrequency) : 0;
            
            const yearlyImpact = monthlyImpact * 12;
            
            // Add to leaks if significant
            if (yearlyImpact >= 50) { // Only include if yearly impact is at least 50
                leaks.push({
                    description: group.description,
                    category: group.category ? {
                        _id: group.category._id,
                        name: group.category.name,
                        color: group.category.color
                    } : null,
                    transactionCount: group.transactions.length,
                    averageAmount: group.total / group.transactions.length,
                    totalSpent: group.total,
                    averageFrequency: averageFrequency.toFixed(1),
                    monthlyImpact,
                    yearlyImpact,
                    firstTransaction: new Date(Math.min(...dates)),
                    lastTransaction: new Date(Math.max(...dates)),
                    sampleTransactions: group.transactions.slice(0, 3).map(t => ({
                        _id: t._id,
                        date: t.date,
                        amount: t.amount,
                        description: t.description
                    }))
                });
            }
        }
    }
    
    // Sort leaks by yearly impact (highest first)
    leaks.sort((a, b) => b.yearlyImpact - a.yearlyImpact);
    
    return {
        leaks,
        metadata: {
            totalSmallTransactions: smallTransactions.length,
            totalLeaksFound: leaks.length,
            totalYearlyImpact: leaks.reduce((sum, leak) => sum + leak.yearlyImpact, 0),
            period: {
                start: dateRange.start,
                end: dateRange.end
            }
        }
    };
}

module.exports = {
    getFinancialLeaks
};