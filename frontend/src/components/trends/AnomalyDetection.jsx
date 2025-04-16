import React, { useState, useEffect } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const AnomalyDetection = ({ data, selectedCategories }) => {
  const [filteredData, setFilteredData] = useState(data);
  
  // Effet pour filtrer les données lorsque les catégories sélectionnées changent
  useEffect(() => {
    if (!data) return;
    
    // Si aucune catégorie n'est sélectionnée, afficher toutes les données
    if (!selectedCategories || selectedCategories.length === 0) {
      setFilteredData(data);
      return;
    }
    
    // Filtrer les anomalies en fonction des catégories sélectionnées
    const filtered = data.filter(anomaly => {
      // Récupérer l'ID de la catégorie de l'anomalie
      const categoryId = anomaly.categoryId || 
                         (anomaly.category && (anomaly.category._id || anomaly.category.id));
      
      // Vérifier si la catégorie est dans les catégories sélectionnées
      return selectedCategories.includes(categoryId);
    });
    
    setFilteredData(filtered);
  }, [data, selectedCategories]);
  
  // Vérifier si les données filtrées sont disponibles
  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="anomaly-detection-container">
        <div className="no-data-message">
          {selectedCategories && selectedCategories.length === 0 
            ? "Veuillez sélectionner au moins une catégorie pour voir les anomalies."
            : "Aucune anomalie détectée pour cette période ou ces catégories"}
        </div>
      </div>
    );
  }
  
  // Formater la date avec gestion des erreurs
  const formatDate = (dateString) => {
    // Vérifier si dateString est undefined ou null
    if (!dateString) {
      console.warn('Date invalide (undefined ou null)');
      return 'Date non spécifiée';
    }
    
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
          <span className="count-number">{filteredData.length}</span>
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
        {filteredData.map((anomaly, index) => (
          <div 
            key={index} 
            className={`anomaly-card severity-${getAnomalySeverity(anomaly)}`}
          >
            <div className="anomaly-header">
              <div className="anomaly-date">{formatDate(anomaly.date)}</div>
              <div className="anomaly-category" style={{ color: anomaly.categoryColor || '#808080' }}>
                {anomaly.categoryName || 'Non catégorisé'}
              </div>
            </div>
            
            <div className="anomaly-details">
              <div className="anomaly-amount">{anomaly.amount ? anomaly.amount.toFixed(2) : '0.00'} €</div>
              <div className="anomaly-deviation">
                {anomaly.deviationPercent !== undefined ? 
                  `${anomaly.deviationPercent > 0 ? '+' : ''}${anomaly.deviationPercent.toFixed(2)}% par rapport à la normale` : 
                  'Données insuffisantes pour calculer l\'écart'}
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