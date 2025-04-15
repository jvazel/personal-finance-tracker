const Transaction = require('../../models/Transaction');
const Category = require('../../models/Category');
const mongoose = require('mongoose');
const { getDateRange, calculateComparison } = require('./utils');

/**
 * Compare financial data between two periods
 * @param {string} userId - User ID
 * @param {Date} period1Start - Start date of first period
 * @param {Date} period1End - End date of first period
 * @param {Date} period2Start - Start date of second period
 * @param {Date} period2End - End date of second period
 * @param {string} categories - Comma-separated list of category IDs
 * @returns {Object} Comparison data between the two periods
 */
async function getPeriodComparison(userId, period1Start, period1End, period2Start, period2End, categories) {
    // Validate dates
    if (!period1Start || !period1End || !period2Start || !period2End) {
        throw new Error('All period dates are required');
    }
    
    // Parse dates if they're strings
    const p1Start = new Date(period1Start);
    const p1End = new Date(period1End);
    const p2Start = new Date(period2Start);
    const p2End = new Date(period2End);
    
    // Validate date objects
    if (isNaN(p1Start) || isNaN(p1End) || isNaN(p2Start) || isNaN(p2End)) {
        throw new Error('Invalid date format');
    }
    
    // Build base query
    const baseQuery = { user: new mongoose.Types.ObjectId(userId) };
    
    // Add category filter if provided
    if (categories) {
        const categoryIds = categories.split(',').map(id => new mongoose.Types.ObjectId(id));
        baseQuery.category = { $in: categoryIds };
    }
    
    // Get all categories for this user
    const userCategories = await Category.find({ 
        user: new mongoose.Types.ObjectId(userId) 
    });
    
    // Create queries for both periods
    const period1Query = {
        ...baseQuery,
        date: { $gte: p1Start, $lte: p1End }
    };
    
    const period2Query = {
        ...baseQuery,
        date: { $gte: p2Start, $lte: p2End }
    };
    
    // Get transactions for period 1
    const period1Transactions = await Transaction.aggregate([
        { $match: period1Query },
        {
            $group: {
                _id: {
                    category: "$category",
                    type: "$type"
                },
                total: { $sum: "$amount" }
            }
        }
    ]);
    
    // Get transactions for period 2
    const period2Transactions = await Transaction.aggregate([
        { $match: period2Query },
        {
            $group: {
                _id: {
                    category: "$category",
                    type: "$type"
                },
                total: { $sum: "$amount" }
            }
        }
    ]);
    
    // Process period 1 data
    const period1Data = {
        income: 0,
        expense: 0,
        balance: 0,
        categoriesData: {}
    };
    
    period1Transactions.forEach(item => {
        if (item._id.type === 'income') {
            period1Data.income += item.total;
        } else if (item._id.type === 'expense') {
            period1Data.expense += item.total;
        }
        
        // Add to category data
        const categoryId = item._id.category ? item._id.category.toString() : 'uncategorized';
        if (!period1Data.categoriesData[categoryId]) {
            period1Data.categoriesData[categoryId] = 0;
        }
        
        if (item._id.type === 'income') {
            period1Data.categoriesData[categoryId] += item.total;
        } else if (item._id.type === 'expense') {
            period1Data.categoriesData[categoryId] += item.total;
        }
    });
    
    period1Data.balance = period1Data.income - period1Data.expense;
    
    // Process period 2 data
    const period2Data = {
        income: 0,
        expense: 0,
        balance: 0,
        categoriesData: {}
    };
    
    period2Transactions.forEach(item => {
        if (item._id.type === 'income') {
            period2Data.income += item.total;
        } else if (item._id.type === 'expense') {
            period2Data.expense += item.total;
        }
        
        // Add to category data
        const categoryId = item._id.category ? item._id.category.toString() : 'uncategorized';
        if (!period2Data.categoriesData[categoryId]) {
            period2Data.categoriesData[categoryId] = 0;
        }
        
        if (item._id.type === 'income') {
            period2Data.categoriesData[categoryId] += item.total;
        } else if (item._id.type === 'expense') {
            period2Data.categoriesData[categoryId] += item.total;
        }
    });
    
    period2Data.balance = period2Data.income - period2Data.expense;
    
    // Calculate comparison metrics
    const comparison = calculateComparison(period1Data, period2Data);
    
    // Format categories for the response
    const formattedCategories = userCategories.map(cat => ({
        id: cat._id.toString(),
        name: cat.name,
        color: cat.color || '#6366f1'
    }));
    
    // Return the comparison data
    return {
        current: period1Data,
        previous: period2Data,
        lastYear: period2Data, // For compatibility with frontend
        comparison,
        categories: formattedCategories,
        period1: {
            start: p1Start,
            end: p1End
        },
        period2: {
            start: p2Start,
            end: p2End
        }
    };
}

module.exports = {
    getPeriodComparison
};