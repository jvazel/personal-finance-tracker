import React, { useState, useEffect } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import Modal from '../common/Modal';

const AnomalyDetection = ({ data, selectedCategories }) => {
  const [filteredData, setFilteredData] = useState(data);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
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
  
  // Fonction pour afficher les détails d'une anomalie
  const handleViewDetails = (anomaly) => {
    setSelectedAnomaly(anomaly);
    setShowDetailsModal(true);
  };

  // Fonction pour fermer le modal
  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedAnomaly(null);
  };
  
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
              <p>{anomaly.description || 'Aucune description disponible'}</p>
            </div>
            
            <div className="anomaly-actions">
              <button 
                className="action-button" 
                onClick={() => handleViewDetails(anomaly)}
              >
                Voir plus de détails
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal pour afficher les détails de l'anomalie */}
      {showDetailsModal && selectedAnomaly && (
        <Modal 
          isOpen={showDetailsModal} 
          onClose={handleCloseModal} 
          title="Détails de l'anomalie"
        >
          <div className="anomaly-details-modal">
            <div className="modal-section">
              <h3>Informations générales</h3>
              <div className="detail-row">
                <span className="detail-label">Date:</span>
                <span className="detail-value">{formatDate(selectedAnomaly.date)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Montant:</span>
                <span className="detail-value">{selectedAnomaly.amount ? selectedAnomaly.amount.toFixed(2) : '0.00'} €</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Catégorie:</span>
                <span className="detail-value" style={{ color: selectedAnomaly.categoryColor || '#808080' }}>
                  {selectedAnomaly.categoryName || 'Non catégorisé'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Description:</span>
                <span className="detail-value">{selectedAnomaly.description || 'Aucune description disponible'}</span>
              </div>
            </div>
    
            <div className="modal-section">
              <h3>Analyse statistique</h3>
              <div className="detail-row">
                <span className="detail-label">Écart:</span>
                <span className="detail-value">
                  {selectedAnomaly.deviationPercent !== undefined ? 
                    `${selectedAnomaly.deviationPercent > 0 ? '+' : ''}${selectedAnomaly.deviationPercent.toFixed(2)}%` : 
                    'Non disponible'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Z-Score:</span>
                <span className="detail-value">
                  {selectedAnomaly.zScore !== undefined ? selectedAnomaly.zScore.toFixed(2) : 'Non disponible'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Moyenne de la catégorie:</span>
                <span className="detail-value">
                  {selectedAnomaly.mean !== undefined ? selectedAnomaly.mean.toFixed(2) : 'Non disponible'} €
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Écart-type:</span>
                <span className="detail-value">
                  {selectedAnomaly.stdDev !== undefined ? selectedAnomaly.stdDev.toFixed(2) : 'Non disponible'} €
                </span>
              </div>
            </div>
    
            <div className="modal-section">
              <h3>Recommandations</h3>
              <p>
                Cette transaction s'écarte significativement de vos habitudes de dépenses dans cette catégorie.
                {selectedAnomaly.deviationPercent > 100 ? 
                  " Il s'agit d'une anomalie majeure qui mérite votre attention." : 
                  " Vérifiez si cette dépense était prévue ou si elle nécessite une action de votre part."}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AnomalyDetection;