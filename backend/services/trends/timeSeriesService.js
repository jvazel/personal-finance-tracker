const Transaction = require('../../models/Transaction');
const mongoose = require('mongoose');
const { getDateRange, getGroupFormat, fillMissingDates } = require('./utils');

/**
 * Get time series data for expenses and income over a specified period
 */
async function getTimeSeriesData(userId, period, startDate, endDate, categories, groupBy) {
    // Calculate date range based on period
    const dateRange = getDateRange(period, startDate, endDate);
    
    // Build query
    const query = {
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: dateRange.start, $lte: dateRange.end }
    };
    
    // Add category filter if provided
    if (categories) {
        const categoryIds = categories.split(',').map(id => new mongoose.Types.ObjectId(id));
        query.category = { $in: categoryIds };
    }
    
    // Determine grouping format based on groupBy parameter
    const groupFormat = getGroupFormat(groupBy);
    
    // Aggregate transactions
    const transactions = await Transaction.aggregate([
        { $match: query },
        {
            $group: {
                _id: {
                    period: { $dateToString: { format: groupFormat, date: "$date" } },
                    type: "$type"
                },
                total: { $sum: "$amount" }
            }
        },
        {
            $group: {
                _id: "$_id.period",
                income: {
                    $sum: {
                        $cond: [{ $eq: ["$_id.type", "income"] }, "$total", 0]
                    }
                },
                expense: {
                    $sum: {
                        $cond: [{ $eq: ["$_id.type", "expense"] }, "$total", 0]
                    }
                }
            }
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                _id: 0,
                date: "$_id",
                income: 1,
                expense: 1,
                balance: { $subtract: ["$income", "$expense"] }
            }
        }
    ]);
    
    // Fill in missing dates in the range
    return fillMissingDates(transactions, dateRange.start, dateRange.end, groupBy);
}

module.exports = {
    getTimeSeriesData
};