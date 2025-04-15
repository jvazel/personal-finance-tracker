import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

const DynamicPieChart = ({ data, selectedCategories }) => {
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);
  const [filteredData, setFilteredData] = useState(data);
  
  // Logs pour le débogage
  console.log('DynamicPieChart - selectedCategories:', selectedCategories);
  console.log('DynamicPieChart - raw data:', data);
  
  // Effet pour filtrer les données lorsque les catégories sélectionnées changent
  useEffect(() => {
    if (!data || !data.periods || !Array.isArray(data.periods)) return;
    
    console.log('Filtering data with categories:', selectedCategories);
    
    // Créer une copie profonde des données pour éviter de modifier l'original
    const newFilteredData = JSON.parse(JSON.stringify(data));
    
    // Si aucune catégorie n'est sélectionnée ou si toutes sont sélectionnées, afficher toutes les données
    if (!selectedCategories || selectedCategories.length === 0) {
      setFilteredData(data);
      return;
    }
    
    // Filtrer les catégories dans chaque période
    newFilteredData.periods = data.periods.map(period => {
      if (!period.categories || !Array.isArray(period.categories)) return period;
      
      // Log pour voir les catégories disponibles dans cette période
      console.log('Period categories before filtering:', period.categories.map(cat => ({
        name: cat.name,
        id: cat.id || cat._id
      })));
      
      // Filtrer les catégories selon celles qui sont sélectionnées
      const filteredCategories = period.categories.filter(category => {
        // Vérifier si la catégorie est dans la liste des catégories sélectionnées
        const isSelected = 
          selectedCategories.includes(category.id) || 
          selectedCategories.includes(category._id) ||
          selectedCategories.includes(category.categoryId) ||
          selectedCategories.includes(category.name);
        
        console.log(`Category ${category.name}: isSelected=${isSelected}`);
        return isSelected;
      });
      
      console.log('Filtered categories:', filteredCategories);
      
      // Recalculer le total pour cette période
      const newTotal = filteredCategories.reduce((sum, cat) => sum + (cat.amount || 0), 0);
      
      return {
        ...period,
        categories: filteredCategories,
        total: newTotal
      };
    });
    
    setFilteredData(newFilteredData);
  }, [data, selectedCategories]);
  
  // Vérifier si les données sont disponibles et correctement structurées
  if (!filteredData || !filteredData.periods || !Array.isArray(filteredData.periods) || filteredData.periods.length === 0) {
    return (
      <div className="dynamic-pie-chart-container">
        <div className="no-data-message">Aucune donnée disponible pour cette période</div>
      </div>
    );
  }
  
  // Obtenir les données pour la période sélectionnée
  const selectedPeriod = filteredData.periods[selectedPeriodIndex];
  
  // Vérifier si les catégories existent et sont un tableau
  if (!selectedPeriod.categories || !Array.isArray(selectedPeriod.categories) || selectedPeriod.categories.length === 0) {
    return (
      <div className="dynamic-pie-chart-container">
        <div className="no-data-message">Aucune donnée de catégorie disponible pour cette période ou avec les filtres actuels</div>
      </div>
    );
  }
  
  // Préparer les données pour le graphique
  const chartData = selectedPeriod.categories.map(category => ({
    name: category.name,
    value: category.amount,
    color: category.color
  }));
  
  // Formater les valeurs pour le tooltip
  const formatTooltipValue = (value, name, props) => {
    return [`${value.toFixed(2)} €`, name];
  };
  
  // Calculer le pourcentage pour chaque catégorie
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="#ffffff" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  return (
    <div className="dynamic-pie-chart-container">
      <div className="period-selector">
        <div className="period-selector-label">Période:</div>
        <div className="period-selector-buttons">
          {filteredData.periods.map((period, index) => (
            <button
              key={index}
              className={`period-selector-button ${selectedPeriodIndex === index ? 'active' : ''}`}
              onClick={() => setSelectedPeriodIndex(index)}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={formatTooltipValue} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="pie-chart-summary">
        <div className="summary-title">Répartition des dépenses - {selectedPeriod.label}</div>
        <div className="summary-total">Total: {selectedPeriod.total.toFixed(2)} €</div>
      </div>
    </div>
  );
};

export default DynamicPieChart;