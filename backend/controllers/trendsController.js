const NodeCache = require('node-cache');

// Import services
const timeSeriesService = require('../services/trends/timeSeriesService');
const comparisonService = require('../services/trends/comparisonService');
const categoryEvolutionService = require('../services/trends/categoryEvolutionService');
const heatmapService = require('../services/trends/heatmapService');
const outlierService = require('../services/trends/outlierService');
const seasonalService = require('../services/trends/seasonalService');
const leakService = require('../services/trends/leakService');
const statisticsService = require('../services/trends/statisticsService');

// Cache configuration with 10 minute TTL (time to live)
const trendsCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

/**
 * Get time series data for expenses and income over a specified period
 */
exports.getTimeSeriesData = async (req, res) => {
    try {
        const { period = 'month', startDate, endDate, categories, groupBy = 'day' } = req.query;
        const userId = req.user.id;
        
        // Generate cache key based on request parameters
        const cacheKey = `timeseries_${userId}_${period}_${startDate}_${endDate}_${categories}_${groupBy}`;
        
        // Check if data exists in cache
        const cachedData = trendsCache.get(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }
        
        const data = await timeSeriesService.getTimeSeriesData(
            userId, period, startDate, endDate, categories, groupBy
        );
        
        // Store in cache
        trendsCache.set(cacheKey, data);
        
        res.json(data);
    } catch (error) {
        console.error('Error fetching time series data:', error);
        res.status(500).json({ message: 'Error fetching time series data', error: error.message });
    }
};

/**
 * Compare financial data between two periods
 */
exports.getPeriodComparison = async (req, res) => {
    try {
        const { timeframe = 'month', date, categories, period1Start, period1End, period2Start, period2End } = req.query;
        const userId = req.user.id;
        
        // If explicit period dates are provided, use them
        let p1Start = period1Start ? new Date(period1Start) : null;
        let p1End = period1End ? new Date(period1End) : null;
        let p2Start = period2Start ? new Date(period2Start) : null;
        let p2End = period2End ? new Date(period2End) : null;
        
        // If not all period dates are provided, calculate them based on timeframe and date
        if (!p1Start || !p1End || !p2Start || !p2End) {
            const selectedDate = date ? new Date(date) : new Date();
            
            if (timeframe === 'month') {
                // Current period: current month
                p1Start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
                p1End = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
                
                // Previous period: previous month
                p2Start = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
                p2End = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 0);
            } 
            else if (timeframe === 'quarter') {
                const currentQuarter = Math.floor(selectedDate.getMonth() / 3);
                
                // Current period: current quarter
                p1Start = new Date(selectedDate.getFullYear(), currentQuarter * 3, 1);
                p1End = new Date(selectedDate.getFullYear(), (currentQuarter + 1) * 3, 0);
                
                // Previous period: previous quarter
                p2Start = new Date(selectedDate.getFullYear(), (currentQuarter - 1) * 3, 1);
                p2End = new Date(selectedDate.getFullYear(), currentQuarter * 3, 0);
            }
            else if (timeframe === 'year') {
                // Current period: current year
                p1Start = new Date(selectedDate.getFullYear(), 0, 1);
                p1End = new Date(selectedDate.getFullYear(), 11, 31);
                
                // Previous period: previous year
                p2Start = new Date(selectedDate.getFullYear() - 1, 0, 1);
                p2End = new Date(selectedDate.getFullYear() - 1, 11, 31);
            }
            else if (timeframe === 'week') {
                // Get the first day of the week (Monday)
                const day = selectedDate.getDay();
                const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1);
                
                // Current period: current week
                p1Start = new Date(selectedDate.setDate(diff));
                p1End = new Date(new Date(p1Start).setDate(p1Start.getDate() + 6));
                
                // Previous period: previous week
                p2Start = new Date(new Date(p1Start).setDate(p1Start.getDate() - 7));
                p2End = new Date(new Date(p2Start).setDate(p2Start.getDate() + 6));
            }
            else {
                // Default to month
                p1Start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
                p1End = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
                p2Start = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
                p2End = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 0);
            }
        }
        
        // Generate cache key
        const cacheKey = `comparison_${userId}_${p1Start.toISOString()}_${p1End.toISOString()}_${p2Start.toISOString()}_${p2End.toISOString()}_${categories}`;
        
        // Check cache
        const cachedData = trendsCache.get(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }
        
        const data = await comparisonService.getPeriodComparison(
            userId, p1Start, p1End, p2Start, p2End, categories
        );
        
        // Store in cache
        trendsCache.set(cacheKey, data);
        
        res.json(data);
    } catch (error) {
        console.error('Error comparing periods:', error);
        res.status(500).json({ message: 'Error comparing periods', error: error.message });
    }
};

/**
 * Get category evolution over time
 */
exports.getCategoryEvolution = async (req, res) => {
    try {
        const { period = 'year', startDate, endDate, groupBy = 'month' } = req.query;
        const userId = req.user.id;
        
        // Generate cache key
        const cacheKey = `category_evolution_${userId}_${period}_${startDate}_${endDate}_${groupBy}`;
        
        // Check cache
        const cachedData = trendsCache.get(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }
        
        const data = await categoryEvolutionService.getCategoryEvolution(
            userId, period, startDate, endDate, groupBy
        );
        
        // Store in cache
        trendsCache.set(cacheKey, data);
        
        res.json(data);
    } catch (error) {
        console.error('Error fetching category evolution:', error);
        res.status(500).json({ message: 'Error fetching category evolution', error: error.message });
    }
};

/**
 * Get heatmap data showing spending patterns by day/hour
 */
exports.getHeatmapData = async (req, res) => {
    try {
        const { period = 'year', startDate, endDate, type = 'day-of-week' } = req.query;
        const userId = req.user.id;
        
        // Generate cache key
        const cacheKey = `heatmap_${userId}_${period}_${startDate}_${endDate}_${type}`;
        
        // Check cache
        const cachedData = trendsCache.get(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }
        
        console.log('Fetching heatmap data with params:', { userId, period, startDate, endDate, type });
        
        const data = await heatmapService.getHeatmapData(
            userId, period, startDate, endDate, type
        );
        
        // Store in cache
        trendsCache.set(cacheKey, data);
        
        res.json(data);
    } catch (error) {
        console.error('Error fetching heatmap data:', error);
        // More detailed error logging
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            message: 'Error fetching heatmap data', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Detect outliers in transaction data
 */
exports.getOutliers = async (req, res) => {
    try {
        const { period = 'year', startDate, endDate, threshold = 2 } = req.query;
        const userId = req.user.id;
        
        // Generate cache key
        const cacheKey = `outliers_${userId}_${period}_${startDate}_${endDate}_${threshold}`;
        
        // Check cache
        const cachedData = trendsCache.get(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }
        
        const data = await outlierService.getOutliers(
            userId, period, startDate, endDate, threshold
        );
        
        // Store in cache
        trendsCache.set(cacheKey, data);
        
        res.json(data);
    } catch (error) {
        console.error('Error detecting outliers:', error);
        res.status(500).json({ message: 'Error detecting outliers', error: error.message });
    }
};

/**
 * Detect seasonal patterns in spending
 */
exports.getSeasonalPatterns = async (req, res) => {
    try {
        const { years = 1, categories } = req.query;
        const userId = req.user.id;
        
        // Generate cache key
        const cacheKey = `seasonal_${userId}_${years}_${categories}`;
        
        // Check cache
        const cachedData = trendsCache.get(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }
        
        const data = await seasonalService.getSeasonalPatterns(
            userId, years, categories
        );
        
        // Store in cache
        trendsCache.set(cacheKey, data);
        
        res.json(data);
    } catch (error) {
        console.error('Error detecting seasonal patterns:', error);
        res.status(500).json({ message: 'Error detecting seasonal patterns', error: error.message });
    }
};

/**
 * Identify financial leaks (small recurring expenses that add up)
 */
exports.getFinancialLeaks = async (req, res) => {
    try {
        const { period = 'year', startDate, endDate, threshold = 5 } = req.query;
        const userId = req.user.id;
        
        // Generate cache key
        const cacheKey = `leaks_${userId}_${period}_${startDate}_${endDate}_${threshold}`;
        
        // Check cache
        const cachedData = trendsCache.get(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }
        
        const data = await leakService.getFinancialLeaks(
            userId, period, startDate, endDate, threshold
        );
        
        // Store in cache
        trendsCache.set(cacheKey, data);
        
        res.json(data);
    } catch (error) {
        console.error('Error identifying financial leaks:', error);
        res.status(500).json({ message: 'Error identifying financial leaks', error: error.message });
    }
};

/**
 * Get aggregated statistics for trends
 */
exports.getStatistics = async (req, res) => {
    try {
        const { period = 'year', startDate, endDate } = req.query;
        const userId = req.user.id;
        
        // Generate cache key
        const cacheKey = `stats_${userId}_${period}_${startDate}_${endDate}`;
        
        // Check cache
        const cachedData = trendsCache.get(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }
        
        const data = await statisticsService.getStatistics(
            userId, period, startDate, endDate
        );
        
        // Store in cache
        trendsCache.set(cacheKey, data);
        
        res.json(data);
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ message: 'Error fetching statistics', error: error.message });
    }
};