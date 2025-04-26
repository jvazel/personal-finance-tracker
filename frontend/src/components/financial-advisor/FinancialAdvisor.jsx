import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FaLightbulb, FaChartLine, FaExclamationTriangle, FaCheckCircle, FaArrowUp, FaArrowDown, FaFilter, FaBookmark } from 'react-icons/fa';
import RecommendationTracker from './RecommendationTracker';
import ProgressVisualization from './ProgressVisualization';

const FinancialAdvisor = () => {
  const [insights, setInsights] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('3months'); // '1month', '3months', '6months', '1year'
  const [difficultyFilter, setDifficultyFilter] = useState('all'); // 'all', 'Facile', 'Moyenne', 'Difficile'
  const [impactFilter, setImpactFilter] = useState('all'); // 'all', 'Moyen', 'Élevé', 'Très élevé'
  const [showFilters, setShowFilters] = useState(false);
  const [showTracker, setShowTracker] = useState(false);

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

  // Dans la fonction getInsightIcon, il pourrait y avoir des références à des catégories
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

  // Fonction pour filtrer les recommandations
  const filteredRecommendations = recommendations.filter(rec => {
    const matchesDifficulty = difficultyFilter === 'all' || rec.difficulty === difficultyFilter;
    const matchesImpact = impactFilter === 'all' || rec.potentialImpact === impactFilter;
    return matchesDifficulty && matchesImpact;
  });

  const saveRecommendation = async (recommendation) => {
    try {
      await api.post('/api/financial-advisor/saved-recommendations', {
        title: recommendation.title,
        description: recommendation.description,
        steps: recommendation.steps.map(step => ({
          text: step,
          completed: false
        }))
      });
      
      // Afficher un message de succès
      alert('Recommandation sauvegardée avec succès!');
      
      // Afficher automatiquement le tracker après la sauvegarde
      setShowTracker(true);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de la recommandation:', err);
      alert('Erreur lors de la sauvegarde de la recommandation');
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
        
        <div className="advisor-controls">
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
          
          <button 
            className="tracker-toggle-button"
            onClick={() => setShowTracker(!showTracker)}
          >
            {showTracker ? 'Masquer mes recommandations' : 'Voir mes recommandations sauvegardées'}
          </button>
        </div>
      </div>
      
      {showTracker && <RecommendationTracker />}
      
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
                  <h3>{formatCategoryReferences(insight.title, insight)}</h3>
                </div>
                <div className="insight-card-content">
                  <p>{formatCategoryReferences(insight.description, insight)}</p>
                  <div className="insight-card-footer">
                    <span className="category-chip">
                      {/* Afficher le nom de la catégorie au lieu de l'objet catégorie */}
                      {insight.category && typeof insight.category === 'object' 
                        ? insight.category.name 
                        : (insight.categoryName || insight.category || 'Non catégorisé')}
                    </span>
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
      
      <ProgressVisualization />

      <div className="recommendations-section">
        <div className="recommendations-header">
          <h2>Recommandations personnalisées</h2>
          <button 
            className="filter-toggle-button"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter /> Filtrer
          </button>
        </div>
        
        {showFilters && (
          <div className="recommendations-filters">
            <div className="filter-group">
              <label>Difficulté:</label>
              <select 
                value={difficultyFilter} 
                onChange={(e) => setDifficultyFilter(e.target.value)}
              >
                <option value="all">Toutes</option>
                <option value="Facile">Facile</option>
                <option value="Moyenne">Moyenne</option>
                <option value="Difficile">Difficile</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Impact potentiel:</label>
              <select 
                value={impactFilter} 
                onChange={(e) => setImpactFilter(e.target.value)}
              >
                <option value="all">Tous</option>
                <option value="Moyen">Moyen</option>
                <option value="Élevé">Élevé</option>
                <option value="Très élevé">Très élevé</option>
              </select>
            </div>
          </div>
        )}
        
        {recommendations.length === 0 ? (
          <p className="no-data-message">
            Pas assez de données pour générer des recommandations.
          </p>
        ) : filteredRecommendations.length === 0 ? (
          <p className="no-data-message">
            Aucune recommandation ne correspond aux filtres sélectionnés.
          </p>
        ) : (
          <div className="recommendations-grid">
            {filteredRecommendations.map((recommendation, index) => (
              <div key={index} className="recommendation-card">
                <div className="recommendation-card-header">
                  <div className="icon"><FaLightbulb style={{ color: '#3b82f6' }} /></div>
                  <h3>{formatCategoryReferences(recommendation.title, recommendation)}</h3>
                </div>
                <div className="recommendation-card-content">
                  <p>{formatCategoryReferences(recommendation.description, recommendation)}</p>
                  <div className="recommendation-metadata">
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
                  <button 
                    className="save-recommendation-button"
                    onClick={() => saveRecommendation(recommendation)}
                  >
                    <FaBookmark /> Sauvegarder cette recommandation
                  </button>
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

// Ajoutons une fonction utilitaire pour formater les titres et descriptions qui pourraient contenir des IDs de catégorie
const formatCategoryReferences = (text, insight) => {
  if (!text || typeof text !== 'string') return text;
  
  // Recherche des IDs MongoDB (format: 24 caractères hexadécimaux)
  return text.replace(/\b([a-f0-9]{24})\b/g, (match) => {
    // Vérifier si l'insight a une propriété category qui est un objet
    if (insight.category && typeof insight.category === 'object' && insight.category._id === match) {
      return insight.category.name;
    }
    // Vérifier si l'insight a une propriété relatedCategories
    else if (insight.relatedCategories && Array.isArray(insight.relatedCategories)) {
      const category = insight.relatedCategories.find(cat => cat._id === match || (typeof cat === 'object' && cat._id === match));
      if (category) {
        return typeof category === 'object' ? category.name : category;
      }
    }
    // Si nous ne trouvons pas de correspondance, retourner l'ID tel quel
    return match;
  });
};