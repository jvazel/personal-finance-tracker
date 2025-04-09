import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card, CardContent, Typography, Box, CircularProgress, Chip, Divider, Button } from '@mui/material';
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

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#3b82f6';
    }
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error">
          {error}
        </Typography>
      </Box>
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
          <Button 
            variant={timeframe === '1month' ? 'contained' : 'outlined'} 
            onClick={() => handleTimeframeChange('1month')}
            sx={{ mr: 1 }}
          >
            1 mois
          </Button>
          <Button 
            variant={timeframe === '3months' ? 'contained' : 'outlined'} 
            onClick={() => handleTimeframeChange('3months')}
            sx={{ mr: 1 }}
          >
            3 mois
          </Button>
          <Button 
            variant={timeframe === '6months' ? 'contained' : 'outlined'} 
            onClick={() => handleTimeframeChange('6months')}
            sx={{ mr: 1 }}
          >
            6 mois
          </Button>
          <Button 
            variant={timeframe === '1year' ? 'contained' : 'outlined'} 
            onClick={() => handleTimeframeChange('1year')}
          >
            1 an
          </Button>
        </div>
      </div>
      
      <div className="insights-section">
        <h2>Analyse de vos habitudes financières</h2>
        
        {insights.length === 0 ? (
          <Typography variant="body1" sx={{ mt: 2, mb: 4 }}>
            Pas assez de données pour générer des analyses. Continuez à enregistrer vos transactions.
          </Typography>
        ) : (
          <div className="insights-grid">
            {insights.map((insight, index) => (
              <Card key={index} sx={{ mb: 2, borderLeft: `4px solid ${getSeverityColor(insight.severity)}` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ mr: 1 }}>{getInsightIcon(insight.type)}</Box>
                    <Typography variant="h6">{insight.title}</Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {insight.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip 
                      label={insight.category} 
                      size="small" 
                      sx={{ backgroundColor: '#e5e7eb', color: '#374151' }}
                    />
                    {insight.impact && (
                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                        Impact: {insight.impact}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <Divider sx={{ my: 4 }} />
      
      <div className="recommendations-section">
        <h2>Recommandations personnalisées</h2>
        
        {recommendations.length === 0 ? (
          <Typography variant="body1" sx={{ mt: 2 }}>
            Pas assez de données pour générer des recommandations.
          </Typography>
        ) : (
          <div className="recommendations-grid">
            {recommendations.map((recommendation, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FaLightbulb style={{ color: '#3b82f6', marginRight: '8px' }} />
                    <Typography variant="h6">{recommendation.title}</Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {recommendation.description}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip 
                      label={`Difficulté: ${recommendation.difficulty}`} 
                      size="small" 
                      sx={{ backgroundColor: '#e5e7eb', color: '#374151' }}
                    />
                    <Chip 
                      label={`Impact potentiel: ${recommendation.potentialImpact}`} 
                      size="small" 
                      sx={{ backgroundColor: '#e5e7eb', color: '#374151' }}
                    />
                  </Box>
                  {recommendation.steps && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">Comment procéder:</Typography>
                      <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                        {recommendation.steps.map((step, stepIndex) => (
                          <li key={stepIndex}>{step}</li>
                        ))}
                      </ul>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialAdvisor;