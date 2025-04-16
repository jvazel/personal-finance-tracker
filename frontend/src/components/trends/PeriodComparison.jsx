import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';

// Ajouter selectedCategories aux props
const PeriodComparison = ({ data, timeframe, selectedCategories = [] }) => {
  const [comparisonType, setComparisonType] = useState('previous'); // 'previous', 'lastYear'
  
  // Vérifier si les données sont disponibles
  if (!data || !data.current || !data.previous || !data.lastYear) {
    return (
      <div className="period-comparison-container">
        <div className="no-data-message">Données insuffisantes pour la comparaison des périodes</div>
      </div>
    );
  }
  
  // Préparer les données pour la comparaison
  const prepareComparisonData = () => {
    if (!data || !data.current || !data.previous || !data.lastYear) {
      return [];
    }
    
    const comparisonData = [];
    
    // Déterminer quelle période de comparaison utiliser
    const comparisonPeriod = comparisonType === 'previous' ? data.previous : data.lastYear;
    
    // Créer les données pour les catégories
    if (data.categories && data.categories.length > 0) {
      // Filtrer les catégories en fonction de celles sélectionnées
      let categoriesToUse = data.categories;
      
      // Si des catégories sont sélectionnées, filtrer la liste
      if (selectedCategories && selectedCategories.length > 0) {
        categoriesToUse = data.categories.filter(category => 
          selectedCategories.includes(category.id)
        );
      }
      
      // Ensuite, filtrer davantage pour n'inclure que celles qui ont des données
      const relevantCategories = categoriesToUse.filter(category => {
        const hasCurrentData = data.current.categoriesData && data.current.categoriesData[category.id];
        const hasComparisonData = comparisonPeriod.categoriesData && comparisonPeriod.categoriesData[category.id];
        return hasCurrentData || hasComparisonData;
      });
  
      relevantCategories.forEach(category => {
        const currentValue = data.current.categoriesData[category.id] || 0;
        const comparisonValue = comparisonPeriod.categoriesData[category.id] || 0;
        const difference = currentValue - comparisonValue;
        const percentChange = comparisonValue !== 0 
          ? (difference / comparisonValue) * 100 
          : currentValue > 0 ? 100 : 0;
        
        comparisonData.push({
          name: category.name,
          current: currentValue,
          comparison: comparisonValue,
          difference,
          percentChange,
          color: category.color
        });
      });
    }
    
    // Ajouter le total (utiliser balance au lieu de total)
    comparisonData.push({
      name: 'Total',
      current: data.current.balance || 0,
      comparison: comparisonPeriod.balance || 0,
      difference: (data.current.balance || 0) - (comparisonPeriod.balance || 0),
      percentChange: comparisonPeriod.balance !== 0 
        ? (((data.current.balance || 0) - (comparisonPeriod.balance || 0)) / comparisonPeriod.balance) * 100 
        : (data.current.balance || 0) > 0 ? 100 : 0,
      color: '#6366f1' // Couleur pour le total
    });
    
    return comparisonData;
  };
  
  const comparisonData = prepareComparisonData();
  
  // Obtenir le titre de la période de comparaison
  const getComparisonTitle = () => {
    if (comparisonType === 'previous') {
      if (timeframe === 'week') return 'Semaine précédente';
      if (timeframe === 'month') return 'Mois précédent';
      if (timeframe === 'quarter') return 'Trimestre précédent';
      if (timeframe === 'year') return 'Année précédente';
    } else {
      if (timeframe === 'week') return 'Même semaine l\'année dernière';
      if (timeframe === 'month') return 'Même mois l\'année dernière';
      if (timeframe === 'quarter') return 'Même trimestre l\'année dernière';
      if (timeframe === 'year') return 'Année précédente';
    }
    return 'Période précédente';
  };
  
  // Formater les valeurs pour le tooltip
  const formatTooltipValue = (value) => {
    return `${(value || 0).toFixed(2)} €`;
  };
  
  // Valeurs sécurisées pour les calculs
  const currentTotal = data.current?.balance || 0;
  const previousTotal = data.previous?.balance || 0;
  const lastYearTotal = data.lastYear?.balance || 0;
  const comparisonTotal = comparisonType === 'previous' ? previousTotal : lastYearTotal;
  const difference = currentTotal - comparisonTotal;
  const percentChange = comparisonTotal !== 0 
    ? (difference / comparisonTotal) * 100 
    : currentTotal > 0 ? 100 : 0;
  
  return (
    <div className="period-comparison-container">
      <div className="comparison-controls">
        <div className="comparison-type-buttons">
          <button 
            className={`comparison-type-button ${comparisonType === 'previous' ? 'active' : ''}`}
            onClick={() => setComparisonType('previous')}
          >
            Période précédente
          </button>
          <button 
            className={`comparison-type-button ${comparisonType === 'lastYear' ? 'active' : ''}`}
            onClick={() => setComparisonType('lastYear')}
          >
            Même période l'an dernier
          </button>
        </div>
      </div>
      
      <div className="comparison-summary">
        <div className="comparison-period-titles">
          <div className="current-period-title">Période actuelle</div>
          <div className="vs">vs</div>
          <div className="comparison-period-title">{getComparisonTitle()}</div>
        </div>
        
        <div className="comparison-totals">
          <div className="comparison-total-item">
            <span className="total-label">Total actuel:</span>
            <span className="total-value">{currentTotal.toFixed(2)} €</span>
          </div>
          <div className="comparison-total-item">
            <span className="total-label">Total {comparisonType === 'previous' ? 'précédent' : 'an dernier'}:</span>
            <span className="total-value">
              {comparisonTotal.toFixed(2)} €
            </span>
          </div>
          <div className="comparison-total-item">
            <span className="total-label">Différence:</span>
            <span className={`total-value ${difference > 0 ? 'positive' : 'negative'}`}>
              {difference.toFixed(2)} €
              ({percentChange.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#e2e8f0' }}
            />
            <YAxis 
              tickFormatter={(value) => `${value} €`}
              tick={{ fill: '#e2e8f0' }}
            />
            <Tooltip 
              formatter={formatTooltipValue}
              labelFormatter={(value) => value}
            />
            <Legend />
            <ReferenceLine y={0} stroke="#e2e8f0" />
            <Bar 
              dataKey="current" 
              name="Période actuelle" 
              fill="#6366f1" 
              barSize={20}
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="comparison" 
              name={getComparisonTitle()} 
              fill="#8b5cf6" 
              barSize={20}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="comparison-details">
        <h3>Détails par catégorie</h3>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Catégorie</th>
              <th>Période actuelle</th>
              <th>{getComparisonTitle()}</th>
              <th>Différence</th>
              <th>Variation</th>
            </tr>
          </thead>
          <tbody>
            {comparisonData.map((item, index) => (
              <tr key={index}>
                <td>
                  <div className="category-name">
                    <span className="category-color" style={{ backgroundColor: item.color }}></span>
                    {item.name}
                  </div>
                </td>
                <td>{item.current.toFixed(2)} €</td>
                <td>{item.comparison.toFixed(2)} €</td>
                <td>{item.difference.toFixed(2)} €</td>
                <td className={item.percentChange > 0 ? 'positive' : item.percentChange < 0 ? 'negative' : ''}>
                  {item.percentChange.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PeriodComparison;