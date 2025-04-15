import React from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const AnomalyDetection = ({ data }) => {
  // Vérifier si les données sont disponibles
  if (!data || data.length === 0) {
    return (
      <div className="anomaly-detection-container">
        <div className="no-data-message">Aucune anomalie détectée pour cette période</div>
      </div>
    );
  }
  
  // Formater la date avec gestion des erreurs
  const formatDate = (dateString) => {
    try {
      // Essayer de parser la date
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      
      // Vérifier si la date est valide
      if (!isValid(date)) {
        console.warn('Date invalide:', dateString);
        return 'Date invalide';
      }
      
      return format(date, 'dd MMMM yyyy', { locale: fr });
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error, dateString);
      return 'Date invalide';
    }
  };
  
  // Calculer le niveau de sévérité de l'anomalie
  const getAnomalySeverity = (anomaly) => {
    const deviation = Math.abs(anomaly.deviationPercent);
    
    if (deviation >= 100) {
      return 'high';
    } else if (deviation >= 50) {
      return 'medium';
    } else {
      return 'low';
    }
  };
  
  return (
    <div className="anomaly-detection-container">
      <div className="anomaly-summary">
        <div className="anomaly-count">
          <span className="count-number">{data.length}</span>
          <span className="count-label">anomalies détectées</span>
        </div>
        
        <div className="anomaly-explanation">
          <p>
            Les anomalies sont des transactions qui s'écartent significativement de vos habitudes de dépenses.
            Elles peuvent indiquer des erreurs, des fraudes ou simplement des dépenses exceptionnelles.
          </p>
        </div>
      </div>
      
      <div className="anomaly-list">
        {data.map((anomaly, index) => (
          <div 
            key={index} 
            className={`anomaly-card severity-${getAnomalySeverity(anomaly)}`}
          >
            <div className="anomaly-header">
              <div className="anomaly-date">{formatDate(anomaly.date)}</div>
              <div className="anomaly-category" style={{ color: anomaly.categoryColor }}>
                {anomaly.categoryName}
              </div>
            </div>
            
            <div className="anomaly-details">
              <div className="anomaly-amount">{anomaly.amount.toFixed(2)} €</div>
              <div className="anomaly-deviation">
                {anomaly.deviationPercent > 0 ? '+' : ''}{anomaly.deviationPercent.toFixed(2)}% par rapport à la normale
              </div>
            </div>
            
            <div className="anomaly-description">
              <p>{anomaly.description}</p>
            </div>
            
            <div className="anomaly-actions">
              <button className="action-button">Marquer comme normal</button>
              <button className="action-button">Voir les détails</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnomalyDetection;