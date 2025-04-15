import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const HeatmapChart = ({ data, timeframe }) => {
  const [selectedMetric, setSelectedMetric] = useState('expense'); // 'expense', 'income'
  
  // Fonction pour déterminer la couleur de la cellule en fonction de la valeur
  const getCellColor = (value, maxValue) => {
    if (value === 0) return '#2d3748'; // Couleur de base pour zéro
    
    const intensity = Math.min(value / maxValue, 1);
    
    if (selectedMetric === 'expense') {
      // Dégradé de rouge pour les dépenses
      return `rgba(239, 68, 68, ${0.2 + intensity * 0.8})`;
    } else {
      // Dégradé de vert pour les revenus
      return `rgba(16, 185, 129, ${0.2 + intensity * 0.8})`;
    }
  };
  
  // Trouver la valeur maximale pour l'échelle de couleur
  const findMaxValue = () => {
    if (!data || !Array.isArray(data) || data.length === 0) return 1;
    
    return Math.max(...data.map(item => 
      selectedMetric === 'expense' ? item.expense : item.income
    ));
  };
  
  const maxValue = findMaxValue();
  
  // Formater la date en fonction du timeframe
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    if (timeframe === 'week' || timeframe === 'month') {
      return format(date, 'dd MMM', { locale: fr });
    } else if (timeframe === 'quarter') {
      return format(date, 'MMM', { locale: fr });
    } else if (timeframe === 'year') {
      return format(date, 'MMM', { locale: fr });
    }
    
    return dateString;
  };
  
  return (
    <div className="heatmap-chart-container">
      <div className="heatmap-controls">
        <div className="metric-selector">
          <button 
            className={`metric-button ${selectedMetric === 'expense' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('expense')}
          >
            Dépenses
          </button>
          <button 
            className={`metric-button ${selectedMetric === 'income' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('income')}
          >
            Revenus
          </button>
        </div>
      </div>
      
      <div className="heatmap-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: getCellColor(0, maxValue) }}></div>
          <span>0 €</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: getCellColor(maxValue * 0.25, maxValue) }}></div>
          <span>Faible</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: getCellColor(maxValue * 0.5, maxValue) }}></div>
          <span>Moyen</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: getCellColor(maxValue * 0.75, maxValue) }}></div>
          <span>Élevé</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: getCellColor(maxValue, maxValue) }}></div>
          <span>{maxValue.toFixed(2)} €</span>
        </div>
      </div>
      
      <div className="heatmap-grid">
        {data && data.length > 0 ? (
          data.map((item, index) => (
            <div 
              key={index} 
              className="heatmap-cell"
              style={{ 
                backgroundColor: getCellColor(
                  selectedMetric === 'expense' ? item.expense : item.income, 
                  maxValue
                ) 
              }}
              title={`${formatDate(item.date)}: ${(selectedMetric === 'expense' ? item.expense : item.income).toFixed(2)} €`}
            >
              <div className="cell-date">{formatDate(item.date)}</div>
              <div className="cell-value">{(selectedMetric === 'expense' ? item.expense : item.income).toFixed(2)} €</div>
            </div>
          ))
        ) : (
          <div className="no-data-message">Aucune donnée disponible pour cette période</div>
        )}
      </div>
    </div>
  );
};

export default HeatmapChart;