import React, { useState, useEffect } from 'react';

const HeatmapChart = ({ data, metadata, timeframe, selectedCategories }) => {
  const [metric, setMetric] = useState('expense'); // 'expense', 'count', 'average'
  const [filteredData, setFilteredData] = useState(data);
  
  // Effet pour filtrer les données lorsque les catégories sélectionnées changent
  useEffect(() => {
    if (!data) return;
    
    // Si aucune catégorie n'est sélectionnée ou si toutes sont sélectionnées, afficher toutes les données
    if (!selectedCategories || selectedCategories.length === 0) {
      setFilteredData(data);
      return;
    }
    
    // Filtrer les données en fonction des catégories sélectionnées
    const filtered = data.filter(item => {
      // Si l'item a une propriété category, vérifier si elle est dans les catégories sélectionnées
      if (item.category) {
        return selectedCategories.includes(item.category);
      }
      // Si l'item n'a pas de catégorie mais a des transactions, vérifier chaque transaction
      if (item.transactions) {
        return item.transactions.some(transaction => 
          selectedCategories.includes(transaction.category)
        );
      }
      return true; // Si pas d'info de catégorie, garder l'item par défaut
    });
    
    setFilteredData(filtered);
  }, [data, selectedCategories]);
  
  // Fonction pour déterminer la couleur en fonction de la valeur
  const getColorIntensity = (value, max) => {
    if (!value || !max || max === 0) return '#4b5563'; // Couleur par défaut
    
    const intensity = Math.min(value / max, 1); // Normaliser entre 0 et 1
    
    // Palette de couleurs pour les dépenses (rouge)
    if (metric === 'expense') {
      if (intensity < 0.2) return '#fecaca'; // Rouge très clair
      if (intensity < 0.4) return '#fca5a5'; // Rouge clair
      if (intensity < 0.6) return '#f87171'; // Rouge moyen
      if (intensity < 0.8) return '#ef4444'; // Rouge
      return '#dc2626'; // Rouge foncé
    }
    
    // Palette de couleurs pour le nombre de transactions (bleu)
    if (metric === 'count') {
      if (intensity < 0.2) return '#bfdbfe'; // Bleu très clair
      if (intensity < 0.4) return '#93c5fd'; // Bleu clair
      if (intensity < 0.6) return '#60a5fa'; // Bleu moyen
      if (intensity < 0.8) return '#3b82f6'; // Bleu
      return '#2563eb'; // Bleu foncé
    }
    
    // Palette de couleurs pour la moyenne (violet)
    if (intensity < 0.2) return '#e9d5ff'; // Violet très clair
    if (intensity < 0.4) return '#d8b4fe'; // Violet clair
    if (intensity < 0.6) return '#c084fc'; // Violet moyen
    if (intensity < 0.8) return '#a855f7'; // Violet
    return '#9333ea'; // Violet foncé
  };
  
  // Fonction pour formater la date
  const formatDate = (item) => {
    // Si formattedDate existe déjà, l'utiliser directement
    if (item.formattedDate) {
      return item.formattedDate;
    }
    
    // Sinon, utiliser les propriétés monthName et dayName
    if (item.dayName && item.monthName) {
      return `${item.dayName}, ${item.monthName}`;
    }
    
    // Fallback si aucune information n'est disponible
    return "Date inconnue";
  };
  
  // Fonction pour formater la valeur affichée
  const formatValue = (item) => {
    if (metric === 'expense') {
      return `${item.expense.toFixed(2)} €`;
    } else if (metric === 'count') {
      return `${item.count} transaction${item.count > 1 ? 's' : ''}`;
    } else if (metric === 'average') {
      return `Moy: ${item.average.toFixed(2)} €`;
    }
  };
  
  // Trouver la valeur maximale pour normaliser les couleurs
  const getMaxValue = () => {
    if (!filteredData || filteredData.length === 0) return 0;
    
    if (metric === 'expense') {
      return Math.max(...filteredData.map(item => item.expense || 0));
    } else if (metric === 'count') {
      return Math.max(...filteredData.map(item => item.count || 0));
    } else if (metric === 'average') {
      return Math.max(...filteredData.map(item => item.average || 0));
    }
    
    return 0;
  };
  
  const maxValue = getMaxValue();
  
  return (
    <div className="heatmap-chart-container">
      <div className="chart-controls">
        <div className="metric-selector">
          <button 
            className={`metric-button ${metric === 'expense' ? 'active' : ''}`}
            onClick={() => setMetric('expense')}
          >
            Montant
          </button>
          <button 
            className={`metric-button ${metric === 'count' ? 'active' : ''}`}
            onClick={() => setMetric('count')}
          >
            Fréquence
          </button>
          <button 
            className={`metric-button ${metric === 'average' ? 'active' : ''}`}
            onClick={() => setMetric('average')}
          >
            Moyenne
          </button>
        </div>
      </div>
      
      {filteredData && filteredData.length > 0 ? (
        <div className="heatmap-grid">
          {filteredData.map((item, index) => (
            <div 
              key={index}
              className="heatmap-cell"
              style={{ backgroundColor: getColorIntensity(item[metric], maxValue) }}
            >
              <div className="cell-date">{formatDate(item)}</div>
              <div className="cell-value">{formatValue(item)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-data-message">
          Aucune donnée disponible pour cette période ou ces catégories
        </div>
      )}
    </div>
  );
};

export default HeatmapChart;