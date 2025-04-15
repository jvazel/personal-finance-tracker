const Transaction = require('../../models/Transaction');
const Category = require('../../models/Category');
const mongoose = require('mongoose');
const { getDateRange, getGroupFormat, processEvolutionData } = require('./utils');

/**
 * Get category evolution over time
 */
async function getCategoryEvolution(userId, period, startDate, endDate, groupBy) {
    // Calculate date range
    const dateRange = getDateRange(period, startDate, endDate);
    
    // Determine grouping format
    const groupFormat = getGroupFormat(groupBy);
    
    // Get all categories for the user
    const categories = await Category.find({});
    const categoryMap = {};
    categories.forEach(cat => {
        categoryMap[cat._id.toString()] = {
            id: cat._id,
            name: cat.name,
            color: cat.color || '#808080'
        };
    });
    
    // Aggregate transactions by category and time period
    const transactions = await Transaction.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                date: { $gte: dateRange.start, $lte: dateRange.end },
                type: 'expense' // Focus on expenses for category evolution
            }
        },
        {
            $group: {
                _id: {
                    period: { $dateToString: { format: groupFormat, date: "$date" } },
                    category: "$category"
                },
                total: { $sum: "$amount" }
            }
        },
        { $sort: { "_id.period": 1 } }
    ]);
    
    // Process data for visualization
    return processEvolutionData(transactions, categoryMap, dateRange.start, dateRange.end, groupBy);
}

module.exports = {
    getCategoryEvolution
};