const { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
        startOfQuarter, endOfQuarter, startOfYear, endOfYear, 
        subMonths, subYears, subQuarters, format, getDay, getMonth, 
        differenceInDays, isWithinInterval, addDays, addMonths, addYears } = require('date-fns');
const mongoose = require('mongoose');
const Transaction = require('../../models/Transaction');

/**
 * Get date range based on period and optional start/end dates
 */
function getDateRange(period, startDate, endDate) {
    const now = new Date();
    let start, end;
    
    if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
    } else {
        switch (period) {
            case 'week':
                start = startOfWeek(now, { weekStartsOn: 1 }); // Week starts on Monday
                end = endOfWeek(now, { weekStartsOn: 1 });
                break;
            case 'month':
                start = startOfMonth(now);
                end = endOfMonth(now);
                break;
            case 'quarter':
                start = startOfQuarter(now);
                end = endOfQuarter(now);
                break;
            case 'year':
                start = startOfYear(now);
                end = endOfYear(now);
                break;
            case 'last-month':
                start = startOfMonth(subMonths(now, 1));
                end = endOfMonth(subMonths(now, 1));
                break;
            case 'last-quarter':
                start = startOfQuarter(subQuarters(now, 1));
                end = endOfQuarter(subQuarters(now, 1));
                break;
            case 'last-year':
                start = startOfYear(subYears(now, 1));
                end = endOfYear(subYears(now, 1));
                break;
            default:
                start = startOfMonth(now);
                end = endOfMonth(now);
        }
    }
    
    return { start, end };
}

/**
 * Get date format string for MongoDB aggregation based on groupBy parameter
 */
function getGroupFormat(groupBy) {
    switch (groupBy) {
        case 'day':
            return '%Y-%m-%d';
        case 'week':
            return '%G-W%V'; // ISO week year and week number
        case 'month':
            return '%Y-%m';
        case 'quarter':
            return '%Y-Q%q';
        case 'year':
            return '%Y';
        default:
            return '%Y-%m-%d';
    }
}

/**
 * Fill in missing dates in time series data
 */
function fillMissingDates(data, startDate, endDate, groupBy) {
    const result = [...data];
    const dateMap = {};
    
    // Create a map of existing dates
    data.forEach(item => {
        dateMap[item.date] = item;
    });
    
    // Generate all dates in the range based on groupBy
    const allDates = [];
    let current = new Date(startDate);
    
    while (current <= endDate) {
        let dateKey;
        
        switch (groupBy) {
            case 'day':
                dateKey = format(current, 'yyyy-MM-dd');
                current = addDays(current, 1);
                break;
            case 'week':
                dateKey = `${format(current, 'GGGG')}-W${format(current, 'ww')}`;
                current = addDays(current, 7);
                break;
            case 'month':
                dateKey = format(current, 'yyyy-MM');
                current = addMonths(current, 1);
                break;
            case 'quarter':
                const quarter = Math.floor(getMonth(current) / 3) + 1;
                dateKey = `${format(current, 'yyyy')}-Q${quarter}`;
                current = addMonths(current, 3);
                break;
            case 'year':
                dateKey = format(current, 'yyyy');
                current = addYears(current, 1);
                break;
            default:
                dateKey = format(current, 'yyyy-MM-dd');
                current = addDays(current, 1);
        }
        
        allDates.push(dateKey);
    }
    
    // Fill in missing dates
    allDates.forEach(dateKey => {
        if (!dateMap[dateKey]) {
            result.push({
                date: dateKey,
                income: 0,
                expense: 0,
                balance: 0
            });
        }
    });
    
    // Sort by date
    result.sort((a, b) => {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        return 0;
    });
    
    return result;
}

/**
 * Get aggregated data for a period
 */
async function getAggregatedPeriodData(query) {
    const [incomeData, expenseData] = await Promise.all([
        Transaction.aggregate([
            { $match: { ...query, type: 'income' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]),
        Transaction.aggregate([
            { $match: { ...query, type: 'expense' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ])
    ]);
    
    const income = incomeData.length > 0 ? incomeData[0].total : 0;
    const incomeCount = incomeData.length > 0 ? incomeData[0].count : 0;
    const expense = expenseData.length > 0 ? expenseData[0].total : 0;
    const expenseCount = expenseData.length > 0 ? expenseData[0].count : 0;
    
    return {
        income,
        incomeCount,
        expense,
        expenseCount,
        balance: income - expense,
        totalTransactions: incomeCount + expenseCount
    };
}

/**
 * Calculate comparison between two periods
 */
function calculateComparison(period1, period2) {
    return {
        income: {
            difference: period2.income - period1.income,
            percentageChange: period1.income !== 0 ? ((period2.income - period1.income) / period1.income) * 100 : null
        },
        expense: {
            difference: period2.expense - period1.expense,
            percentageChange: period1.expense !== 0 ? ((period2.expense - period1.expense) / period1.expense) * 100 : null
        },
        balance: {
            difference: period2.balance - period1.balance,
            percentageChange: period1.balance !== 0 ? ((period2.balance - period1.balance) / period1.balance) * 100 : null
        }
    };
}

/**
 * Get category breakdown for a period
 */
async function getCategoryBreakdown(query) {
    const categoryData = await Transaction.aggregate([
        { $match: query },
        {
            $group: {
                _id: {
                    category: '$category',
                    type: '$type'
                },
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: '_id.category',
                foreignField: '_id',
                as: 'categoryDetails'
            }
        },
        {
            $project: {
                _id: 0,
                category: '$_id.category',
                type: '$_id.type',
                total: 1,
                count: 1,
                categoryName: { $arrayElemAt: ['$categoryDetails.name', 0] },
                categoryColor: { $arrayElemAt: ['$categoryDetails.color', 0] }
            }
        },
        { $sort: { total: -1 } }
    ]);
    
    return categoryData;
}

/**
 * Process category evolution data
 */
function processEvolutionData(transactions, categoryMap, startDate, endDate, groupBy) {
    // Group transactions by period and category
    const periodCategoryMap = {};
    
    transactions.forEach(transaction => {
        const period = transaction._id.period;
        const categoryId = transaction._id.category ? transaction._id.category.toString() : 'uncategorized';
        
        if (!periodCategoryMap[period]) {
            periodCategoryMap[period] = {};
        }
        
        periodCategoryMap[period][categoryId] = transaction.total;
    });
    
    // Get all unique categories
    const uniqueCategories = new Set();
    transactions.forEach(transaction => {
        const categoryId = transaction._id.category ? transaction._id.category.toString() : 'uncategorized';
        uniqueCategories.add(categoryId);
    });
    
    // Generate all periods in the range
    const allPeriods = [];
    let current = new Date(startDate);
    
    while (current <= endDate) {
        let periodKey;
        
        switch (groupBy) {
            case 'day':
                periodKey = format(current, 'yyyy-MM-dd');
                current = addDays(current, 1);
                break;
            case 'week':
                periodKey = `${format(current, 'GGGG')}-W${format(current, 'ww')}`;
                current = addDays(current, 7);
                break;
            case 'month':
                periodKey = format(current, 'yyyy-MM');
                current = addMonths(current, 1);
                break;
            case 'quarter':
                const quarter = Math.floor(getMonth(current) / 3) + 1;
                periodKey = `${format(current, 'yyyy')}-Q${quarter}`;
                current = addMonths(current, 3);
                break;
            case 'year':
                periodKey = format(current, 'yyyy');
                current = addYears(current, 1);
                break;
            default:
                periodKey = format(current, 'yyyy-MM-dd');
                current = addDays(current, 1);
        }
        
        allPeriods.push(periodKey);
    }
    
    // Create the evolution data structure
    const evolutionData = {
        periods: allPeriods,
        categories: Array.from(uniqueCategories).map(categoryId => {
            const category = categoryMap[categoryId] || { name: 'Non catégorisé', color: '#808080' };
            
            const values = allPeriods.map(period => {
                const periodData = periodCategoryMap[period] || {};
                return periodData[categoryId] || 0;
            });
            
            return {
                id: categoryId,
                name: category.name,
                color: category.color,
                values
            };
        }),
        totals: allPeriods.map(period => {
            const periodData = periodCategoryMap[period] || {};
            return Object.values(periodData).reduce((sum, value) => sum + value, 0);
        })
    };
    
    return evolutionData;
}

module.exports = {
    getDateRange,
    getGroupFormat,
    fillMissingDates,
    getAggregatedPeriodData,
    calculateComparison,
    getCategoryBreakdown,
    processEvolutionData
};