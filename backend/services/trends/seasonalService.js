const Transaction = require('../../models/Transaction');
const mongoose = require('mongoose');

/**
 * Detect seasonal patterns in spending
 */
async function getSeasonalPatterns(userId, years, categories) {
    // Calculate date range (last N years)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - parseInt(years));
    
    // Build query
    const query = {
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
        type: 'expense' // Focus on expenses for seasonal patterns
    };
    
    // Add category filter if provided
    if (categories) {
        const categoryIds = categories.split(',').map(id => new mongoose.Types.ObjectId(id));
        query.category = { $in: categoryIds };
    }
    
    // Aggregate by month across years
    const monthlyData = await Transaction.aggregate([
        { $match: query },
        {
            $group: {
                _id: {
                    year: { $year: "$date" },
                    month: { $month: "$date" }
                },
                total: { $sum: "$amount" },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    
    // Process data to detect seasonal patterns
    const monthlyAverages = Array(12).fill(0).map(() => ({ total: 0, count: 0 }));
    
    monthlyData.forEach(item => {
        const monthIndex = item._id.month - 1; // Convert to 0-based index
        monthlyAverages[monthIndex].total += item.total;
        monthlyAverages[monthIndex].count += 1;
    });
    
    // Calculate averages and detect peaks/troughs
    const processedData = monthlyAverages.map((data, index) => {
        const average = data.count > 0 ? data.total / data.count : 0;
        return {
            month: index + 1,
            monthName: [
                'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
            ][index],
            average,
            yearsOfData: data.count
        };
    });
    
    // Calculate overall average to detect peaks and troughs
    const overallAverage = processedData.reduce((sum, item) => sum + item.average, 0) / processedData.filter(item => item.average > 0).length;
    
    // Mark peaks and troughs (20% above or below average)
    processedData.forEach(item => {
        item.isPeak = item.average > overallAverage * 1.2;
        item.isTrough = item.average < overallAverage * 0.8 && item.average > 0;
        item.percentageFromAverage = overallAverage > 0 ? ((item.average - overallAverage) / overallAverage) * 100 : 0;
    });
    
    return processedData;
}

module.exports = {
    getSeasonalPatterns
};