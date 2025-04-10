import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FaLightbulb, FaChartLine, FaExclamationTriangle, FaCheckCircle, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const FinancialAdvisor = () => {
  const [insights, setInsights] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('3months'); // '1month', '3months', '6months', '1year'

  useEffect(() => {
    const fetchFinancialAdvice = async () => {
      setLoading(true);
      try {
        const response = await api.get('/api/financial-advisor/insights', {
          params: { timeframe }
        });
        
        setInsights(response.data.insights || []);
        setRecommendations(response.data.recommendations || []);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des conseils financiers:', err);
        setError('Impossible de charger les conseils financiers');
        setLoading(false);
      }
    };

    fetchFinancialAdvice();
  }, [timeframe]);

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'spending_increase':
        return <FaArrowUp style={{ color: '#ef4444' }} />;
      case 'spending_decrease':
        return <FaArrowDown style={{ color: '#10b981' }} />;
      case 'pattern':
        return <FaChartLine style={{ color: '#3b82f6' }} />;
      case 'warning':
        return <FaExclamationTriangle style={{ color: '#f59e0b' }} />;
      case 'achievement':
        return <FaCheckCircle style={{ color: '#10b981' }} />;
      default:
        return <FaLightbulb style={{ color: '#3b82f6' }} />;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des conseils financiers...</p>
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

  return (
    <div className="financial-advisor-container">
      <div className="advisor-header">
        <h1>Conseiller Financier Personnel</h1>
        <p>
          Basé sur l'analyse de vos habitudes financières, voici des conseils personnalisés 
          pour améliorer votre santé financière.
        </p>
        
        <div className="timeframe-selector">
          <button 
            className={timeframe === '1month' ? 'active' : ''} 
            onClick={() => handleTimeframeChange('1month')}
          >
            1 mois
          </button>
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
      </div>
      
      <div className="insights-section">
        <h2>Analyse de vos habitudes financières</h2>
        
        {insights.length === 0 ? (
          <p className="no-data-message">
            Pas assez de données pour générer des analyses. Continuez à enregistrer vos transactions.
          </p>
        ) : (
          <div className="insights-grid">
            {insights.map((insight, index) => (
              <div 
                key={index} 
                className="insight-card"
                style={{ borderLeft: `4px solid ${
                  insight.severity === 'high' ? '#ef4444' : 
                  insight.severity === 'medium' ? '#f59e0b' : '#10b981'
                }` }}
              >
                <div className="insight-card-header">
                  <div className="icon">{getInsightIcon(insight.type)}</div>
                  <h3>{insight.title}</h3>
                </div>
                <div className="insight-card-content">
                  <p>{insight.description}</p>
                  <div className="insight-card-footer">
                    <span className="category-chip">{insight.category}</span>
                    {insight.impact && (
                      <span className={`impact-text ${
                        insight.impact === 'Positif' ? 'impact-positive' : 'impact-negative'
                      }`}>
                        Impact: {insight.impact}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="recommendations-section">
        <h2>Recommandations personnalisées</h2>
        
        {recommendations.length === 0 ? (
          <p className="no-data-message">
            Pas assez de données pour générer des recommandations.
          </p>
        ) : (
          <div className="recommendations-grid">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="recommendation-card">
                <div className="recommendation-card-header">
                  <div className="icon"><FaLightbulb style={{ color: '#3b82f6' }} /></div>
                  <h3>{recommendation.title}</h3>
                </div>
                <div className="recommendation-card-content">
                  <p>{recommendation.description}</p>
                  <div>
                    <span className="recommendation-difficulty">
                      Difficulté: {recommendation.difficulty}
                    </span>
                    <span className="recommendation-impact">
                      Impact potentiel: {recommendation.potentialImpact}
                    </span>
                  </div>
                  {recommendation.steps && (
                    <div className="recommendation-steps">
                      <h4>Comment procéder:</h4>
                      <ul>
                        {recommendation.steps.map((step, stepIndex) => (
                          <li key={stepIndex}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialAdvisor;