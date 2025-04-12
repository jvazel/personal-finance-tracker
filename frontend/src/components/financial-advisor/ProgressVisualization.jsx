import React, { useState, useEffect, useCallback } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import api from '../../services/api';

const ProgressVisualization = () => {
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('6months'); // '3months', '6months', '1year'
  const [dataCache, setDataCache] = useState({}); // Cache for API responses

  // Memoize the fetch function to ensure consistent behavior
  const fetchProgressData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if we have cached data for this timeframe
      if (dataCache[timeframe]) {
        console.log(`Using cached data for timeframe: ${timeframe}`);
        setProgressData(dataCache[timeframe]);
        setLoading(false);
        return;
      }
      
      console.log(`Fetching data for timeframe: ${timeframe}`);
      const response = await api.get('/api/financial-advisor/progress', {
        params: { timeframe }
      });
      
      // Ensure data is properly sorted by date before processing
      const sortedData = [...(response.data || [])].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      
      // Normalize dates to ensure consistent format
      const normalizedData = sortedData.map(item => ({
        ...item,
        date: new Date(item.date).toISOString().split('T')[0], // YYYY-MM-DD format
        savingsRate: parseFloat(item.savingsRate) || 0,
        expenseReduction: parseFloat(item.expenseReduction) || 0,
        recommendationsCompleted: parseInt(item.recommendationsCompleted) || 0
      }));
      
      // Cache the normalized data
      setDataCache(prev => ({
        ...prev,
        [timeframe]: normalizedData
      }));
      
      setProgressData(normalizedData);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des données de progression:', err);
      setError('Impossible de charger les données de progression');
      setLoading(false);
    }
  }, [timeframe, dataCache]);

  useEffect(() => {
    fetchProgressData();
  }, [fetchProgressData]);

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  // Calculate percentage change correctly
  const calculatePercentageChange = (current, initial) => {
    if (initial === 0) return current > 0 ? 100 : 0; // Handle division by zero
    return ((current - initial) / Math.abs(initial)) * 100;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des données de progression...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Erreur</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (progressData.length === 0) {
    return (
      <div className="progress-visualization-container">
        <h2>Suivi de votre progression</h2>
        <p className="no-data-message">
          Pas assez de données pour afficher votre progression. Continuez à suivre les recommandations.
        </p>
      </div>
    );
  }

  // Get first and last data points for calculations
  const firstDataPoint = progressData[0];
  const lastDataPoint = progressData[progressData.length - 1];
  
  // Calculate changes
  const savingsRateChange = calculatePercentageChange(
    lastDataPoint.savingsRate,
    firstDataPoint.savingsRate
  );
  
  const expenseReductionChange = calculatePercentageChange(
    lastDataPoint.expenseReduction,
    firstDataPoint.expenseReduction
  );

  return (
    <div className="progress-visualization-container">
      <h2>Suivi de votre progression</h2>
      
      <div className="timeframe-selector small">
        <button 
          className={timeframe === '3months' ? 'active' : ''} 
          onClick={() => handleTimeframeChange('3months')}
        >
          3 mois
        </button>
        <button 
          className={timeframe === '6months' ? 'active' : ''} 
          onClick={() => handleTimeframeChange('6months')}
        >
          6 mois
        </button>
        <button 
          className={timeframe === '1year' ? 'active' : ''} 
          onClick={() => handleTimeframeChange('1year')}
        >
          1 an
        </button>
      </div>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={progressData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis 
              dataKey="date" 
              stroke="#aaa"
              tick={{ fill: '#e2e8f0' }}
            />
            <YAxis 
              stroke="#aaa"
              tick={{ fill: '#e2e8f0' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#353549', 
                border: '1px solid #4b5563',
                color: '#e2e8f0'
              }}
            />
            <Legend wrapperStyle={{ color: '#e2e8f0' }} />
            <Line 
              type="monotone" 
              dataKey="savingsRate" 
              name="Taux d'épargne (%)" 
              stroke="#3b82f6" 
              activeDot={{ r: 8 }} 
            />
            <Line 
              type="monotone" 
              dataKey="expenseReduction" 
              name="Réduction des dépenses (%)" 
              stroke="#10b981" 
            />
            <Line 
              type="monotone" 
              dataKey="recommendationsCompleted" 
              name="Recommandations complétées" 
              stroke="#f59e0b" 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="progress-stats">
        <div className="stat-card">
          <h3>Taux d'épargne actuel</h3>
          <p className="stat-value">{lastDataPoint.savingsRate.toFixed(1)}%</p>
          <p className="stat-change">
            {savingsRateChange > 0 ? (
              <span className="positive">+{savingsRateChange.toFixed(1)}%</span>
            ) : (
              <span className="negative">{savingsRateChange.toFixed(1)}%</span>
            )}
            {' '}d'évolution depuis le début de la période
          </p>
        </div>
        
        <div className="stat-card">
          <h3>Recommandations complétées</h3>
          <p className="stat-value">{lastDataPoint.recommendationsCompleted}</p>
          <p className="stat-change">
            {lastDataPoint.recommendationsCompleted > firstDataPoint.recommendationsCompleted ? (
              <span className="positive">+{lastDataPoint.recommendationsCompleted - firstDataPoint.recommendationsCompleted}</span>
            ) : (
              <span>Aucun changement</span>
            )}
            {' '}depuis le début de la période
          </p>
        </div>
        
        <div className="stat-card">
          <h3>Réduction des dépenses</h3>
          <p className="stat-value">{lastDataPoint.expenseReduction.toFixed(1)}%</p>
          <p className="stat-change">
            {expenseReductionChange > 0 ? (
              <span className="positive">+{expenseReductionChange.toFixed(1)}%</span>
            ) : (
              <span className="negative">{expenseReductionChange.toFixed(1)}%</span>
            )}
            {' '}d'évolution depuis le début de la période
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProgressVisualization;