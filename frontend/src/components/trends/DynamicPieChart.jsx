import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

const DynamicPieChart = ({ data }) => {
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);
  
  // Vérifier si les données sont disponibles et correctement structurées
  if (!data || !data.periods || !Array.isArray(data.periods) || data.periods.length === 0) {
    return (
      <div className="dynamic-pie-chart-container">
        <div className="no-data-message">Aucune donnée disponible pour cette période</div>
      </div>
    );
  }
  
  // Obtenir les données pour la période sélectionnée
  const selectedPeriod = data.periods[selectedPeriodIndex];
  
  // Vérifier si les catégories existent et sont un tableau
  if (!selectedPeriod.categories || !Array.isArray(selectedPeriod.categories)) {
    return (
      <div className="dynamic-pie-chart-container">
        <div className="no-data-message">Aucune donnée de catégorie disponible pour cette période</div>
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
          {data.periods.map((period, index) => (
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