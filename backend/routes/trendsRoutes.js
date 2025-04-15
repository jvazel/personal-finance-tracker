const express = require('express');
const router = express.Router();
const trendsController = require('../controllers/trendsController');

// Routes pour les analyses de tendances
router.get('/time-series', trendsController.getTimeSeriesData);
router.get('/period-comparison', trendsController.getPeriodComparison);
router.get('/category-evolution', trendsController.getCategoryEvolution);
router.get('/heatmap', trendsController.getHeatmapData);
router.get('/outliers', trendsController.getOutliers);
router.get('/seasonal-patterns', trendsController.getSeasonalPatterns);
router.get('/financial-leakage', trendsController.getFinancialLeaks);
router.get('/statistics', trendsController.getStatistics);
router.get('/anomalies', trendsController.getOutliers);

module.exports = router;