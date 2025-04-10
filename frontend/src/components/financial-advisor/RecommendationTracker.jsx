import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FaCheckCircle, FaRegCircle, FaTrash } from 'react-icons/fa';

const RecommendationTracker = () => {
  const [savedRecommendations, setSavedRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSavedRecommendations = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/financial-advisor/saved-recommendations');
        setSavedRecommendations(response.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des recommandations sauvegardées:', err);
        setError('Impossible de charger les recommandations sauvegardées');
        setLoading(false);
      }
    };

    fetchSavedRecommendations();
  }, []);

  const toggleStepCompletion = async (recommendationId, stepIndex) => {
    try {
      const updatedRecommendations = savedRecommendations.map(rec => {
        if (rec._id === recommendationId) {
          const updatedSteps = [...rec.steps];
          updatedSteps[stepIndex] = {
            ...updatedSteps[stepIndex],
            completed: !updatedSteps[stepIndex].completed
          };
          return { ...rec, steps: updatedSteps };
        }
        return rec;
      });
      
      setSavedRecommendations(updatedRecommendations);
      
      await api.patch(`/api/financial-advisor/saved-recommendations/${recommendationId}/steps/${stepIndex}`, {
        completed: updatedRecommendations.find(r => r._id === recommendationId).steps[stepIndex].completed
      });
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'étape:', err);
      // Recharger les données en cas d'erreur
      const response = await api.get('/api/financial-advisor/saved-recommendations');
      setSavedRecommendations(response.data || []);
    }
  };

  const deleteRecommendation = async (recommendationId) => {
    try {
      await api.delete(`/api/financial-advisor/saved-recommendations/${recommendationId}`);
      setSavedRecommendations(savedRecommendations.filter(rec => rec._id !== recommendationId));
    } catch (err) {
      console.error('Erreur lors de la suppression de la recommandation:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des recommandations sauvegardées...</p>
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
    <div className="recommendation-tracker-container">
      <h2>Suivi de vos recommandations</h2>
      
      {savedRecommendations.length === 0 ? (
        <p className="no-data-message">
          Vous n'avez pas encore sauvegardé de recommandations à suivre.
        </p>
      ) : (
        <div className="saved-recommendations-list">
          {savedRecommendations.map((recommendation) => {
            const completedSteps = recommendation.steps.filter(step => step.completed).length;
            const progress = (completedSteps / recommendation.steps.length) * 100;
            
            return (
              <div key={recommendation._id} className="saved-recommendation-card">
                <div className="saved-recommendation-header">
                  <h3>{recommendation.title}</h3>
                  <button 
                    className="delete-recommendation-button"
                    onClick={() => deleteRecommendation(recommendation._id)}
                  >
                    <FaTrash />
                  </button>
                </div>
                
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                <p className="progress-text">
                  {completedSteps} sur {recommendation.steps.length} étapes complétées
                </p>
                
                <div className="recommendation-steps-list">
                  {recommendation.steps.map((step, index) => (
                    <div 
                      key={index} 
                      className={`recommendation-step ${step.completed ? 'completed' : ''}`}
                      onClick={() => toggleStepCompletion(recommendation._id, index)}
                    >
                      <div className="step-checkbox">
                        {step.completed ? <FaCheckCircle /> : <FaRegCircle />}
                      </div>
                      <p>{step.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecommendationTracker;