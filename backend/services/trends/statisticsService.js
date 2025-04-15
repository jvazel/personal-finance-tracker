const Transaction = require('../../models/Transaction');
const mongoose = require('mongoose');
const { getDateRange, getAggregatedPeriodData } = require('./utils');

/**
 * Get aggregated statistics for trends
 */
async function getStatistics(userId, period, startDate, endDate) {
    // Calculate date range
    const dateRange = getDateRange(period, startDate, endDate);
    
    // Build query
    const query = {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: dateRange.start, $lte: dateRange.end }
    };
    
    // Get overall statistics
    const overallStats = await getAggregatedPeriodData(query);
    
    // Get top expense categories
    const topExpenseCategories = await Transaction.aggregate([
        { $match: { ...query, type: 'expense' } },
        {
            $group: {
                _id: '$category',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: '_id',
                foreignField: '_id',
                as: 'categoryDetails'
            }
        },
        {
            $project: {
                _id: 0,
                category: '$_id',
                total: 1,
                count: 1,
                categoryName: { $arrayElemAt: ['$categoryDetails.name', 0] },
                categoryColor: { $arrayElemAt: ['$categoryDetails.color', 0] }
            }
        },
        { $sort: { total: -1 } },
        { $limit: 5 }
    ]);
    
    // Get top income categories
    const topIncomeCategories = await Transaction.aggregate([
        { $match: { ...query, type: 'income' } },
        {
            $group: {
                _id: '$category',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: '_id',
                foreignField: '_id',
                as: 'categoryDetails'
            }
        },
        {
            $project: {
                _id: 0,
                category: '$_id',
                total: 1,
                count: 1,
                categoryName: { $arrayElemAt: ['$categoryDetails.name', 0] },
                categoryColor: { $arrayElemAt: ['$categoryDetails.color', 0] }
            }
        },
        { $sort: { total: -1 } },
        { $limit: 5 }
    ]);
    
    // Get monthly trend
    const monthlyTrend = await Transaction.aggregate([
        { $match: query },
        {
            $group: {
                _id: {
                    year: { $year: '$date' },
                    month: { $month: '$date' },
                    type: '$type'
                },
                total: { $sum: '$amount' }
            }
        },
        {
            $group: {
                _id: {
                    year: '$_id.year',
                    month: '$_id.month'
                },
                income: {
                    $sum: {
                        $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0]
                    }
                },
                expense: {
                    $sum: {
                        $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0]
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                year: '$_id.year',
                month: '$_id.month',
                income: 1,
                expense: 1,
                balance: { $subtract: ['$income', '$expense'] }
            }
        },
        { $sort: { year: 1, month: 1 } }
    ]);
    
    // Format monthly trend with month names
    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    const formattedMonthlyTrend = monthlyTrend.map(item => ({
        ...item,
        monthName: monthNames[item.month - 1],
        date: `${item.year}-${item.month.toString().padStart(2, '0')}`
    }));
    
    // Prepare response
    return {
        period: {
            start: dateRange.start,
            end: dateRange.end
        },
        overall: overallStats,
        topExpenseCategories,
        topIncomeCategories,
        monthlyTrend: formattedMonthlyTrend
    };
}

module.exports = {
    getStatistics
};