const Transaction = require('../../models/Transaction');
const mongoose = require('mongoose');
const { getDateRange } = require('./utils');
const { ObjectId } = require('mongodb');

/**
 * Get heatmap data showing spending patterns by day/hour
 */
async function getHeatmapData(userId, period, startDate, endDate, type) {
    // Calculate date range
    const dateRange = getDateRange(period, startDate, endDate);
    
    // Build query
    const query = {
        user: new mongoose.Types.ObjectId(userId), // Add 'new' keyword here
        date: { $gte: dateRange.start, $lte: dateRange.end },
        type: 'expense' // Focus on expenses for heatmap
    };
    
    let heatmapData;
    
    if (type === 'day-of-week') {
        // Aggregate by day of week and month
        heatmapData = await Transaction.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        month: { $month: "$date" },
                        dayOfWeek: { $dayOfWeek: "$date" } // 1 for Sunday, 2 for Monday, etc.
                    },
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.month": 1, "_id.dayOfWeek": 1 } }
        ]);
        
        // Process for visualization (adjust day of week to match JS convention: 0 = Sunday, 6 = Saturday)
        heatmapData = heatmapData.map(item => ({
            month: item._id.month,
            dayOfWeek: item._id.dayOfWeek - 1, // Adjust to 0-6 range
            total: item.total,
            count: item.count,
            average: item.total / item.count
        }));
    } else if (type === 'day-of-month') {
        // Aggregate by day of month
        heatmapData = await Transaction.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        month: { $month: "$date" },
                        dayOfMonth: { $dayOfMonth: "$date" }
                    },
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.month": 1, "_id.dayOfMonth": 1 } }
        ]);
        
        // Process for visualization
        heatmapData = heatmapData.map(item => ({
            month: item._id.month,
            dayOfMonth: item._id.dayOfMonth,
            total: item.total,
            count: item.count,
            average: item.total / item.count
        }));
    }
    
    // Add month names
    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    // Add day names
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    
    return {
        data: heatmapData,
        metadata: {
            monthNames,
            dayNames,
            type
        }
    };
}

module.exports = {
    getHeatmapData
};