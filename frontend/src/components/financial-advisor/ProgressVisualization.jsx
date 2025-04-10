import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/financial-advisor/progress', {
          params: { timeframe }
        });
        
        setProgressData(response.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des données de progression:', err);
        setError('Impossible de charger les données de progression');
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [timeframe]);

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
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
          <p className="stat-value">{progressData[progressData.length - 1].savingsRate}%</p>
          <p className="stat-change">
            {progressData[progressData.length - 1].savingsRate > progressData[0].savingsRate ? (
              <span className="positive">+{(progressData[progressData.length - 1].savingsRate - progressData[0].savingsRate).toFixed(1)}%</span>
            ) : (
              <span className="negative">{(progressData[progressData.length - 1].savingsRate - progressData[0].savingsRate).toFixed(1)}%</span>
            )}
            depuis le début de la période
          </p>
        </div>
        
        <div className="stat-card">
          <h3>Recommandations complétées</h3>
          <p className="stat-value">{progressData[progressData.length - 1].recommendationsCompleted}</p>
        </div>
        
        <div className="stat-card">
          <h3>Réduction des dépenses</h3>
          <p className="stat-value">{progressData[progressData.length - 1].expenseReduction}%</p>
        </div>
      </div>
    </div>
  );
};

export default ProgressVisualization;