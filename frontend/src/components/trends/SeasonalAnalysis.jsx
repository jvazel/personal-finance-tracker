import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const SeasonalAnalysis = ({ data }) => {
  const [patternType, setPatternType] = useState('monthly'); // 'monthly', 'weekly', 'daily'
  
  // Vérifier si les données sont disponibles
  if (!data || !data[patternType] || data[patternType].length === 0) {
    return (
      <div className="seasonal-analysis-container">
        <div className="pattern-type-selector">
          <button 
            className={`pattern-type-button ${patternType === 'monthly' ? 'active' : ''}`}
            onClick={() => setPatternType('monthly')}
          >
            Mensuel
          </button>
          <button 
            className={`pattern-type-button ${patternType === 'weekly' ? 'active' : ''}`}
            onClick={() => setPatternType('weekly')}
          >
            Hebdomadaire
          </button>
          <button 
            className={`pattern-type-button ${patternType === 'daily' ? 'active' : ''}`}
            onClick={() => setPatternType('daily')}
          >
            Quotidien
          </button>
        </div>
        <div className="no-data-message">Aucune donnée disponible pour cette analyse</div>
      </div>
    );
  }
  
  // Obtenir les données pour le type de pattern sélectionné
  const patternData = data[patternType];
  
  // Formater les valeurs pour le tooltip
  const formatTooltipValue = (value) => {
    return `${value.toFixed(2)} €`;
  };
  
  // Obtenir le titre en fonction du type de pattern
  const getPatternTitle = () => {
    if (patternType === 'monthly') {
      return 'Tendances mensuelles';
    } else if (patternType === 'weekly') {
      return 'Tendances hebdomadaires';
    } else if (patternType === 'daily') {
      return 'Tendances quotidiennes';
    }
    return 'Tendances';
  };
  
  // Obtenir la description en fonction du type de pattern
  const getPatternDescription = () => {
    if (patternType === 'monthly') {
      return 'Ce graphique montre comment vos dépenses varient selon les mois de l\'année.';
    } else if (patternType === 'weekly') {
      return 'Ce graphique montre comment vos dépenses varient selon les jours de la semaine.';
    } else if (patternType === 'daily') {
      return 'Ce graphique montre comment vos dépenses varient selon les heures de la journée.';
    }
    return '';
  };
  
  return (
    <div className="seasonal-analysis-container">
      <div className="pattern-type-selector">
        <button 
          className={`pattern-type-button ${patternType === 'monthly' ? 'active' : ''}`}
          onClick={() => setPatternType('monthly')}
        >
          Mensuel
        </button>
        <button 
          className={`pattern-type-button ${patternType === 'weekly' ? 'active' : ''}`}
          onClick={() => setPatternType('weekly')}
        >
          Hebdomadaire
        </button>
        <button 
          className={`pattern-type-button ${patternType === 'daily' ? 'active' : ''}`}
          onClick={() => setPatternType('daily')}
        >
          Quotidien
        </button>
      </div>
      
      <div className="pattern-description">
        <h3>{getPatternTitle()}</h3>
        <p>{getPatternDescription()}</p>
      </div>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={patternData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="label" 
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
            <Bar 
              dataKey="average" 
              name="Moyenne" 
              fill="#6366f1" 
              barSize={20}
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="max" 
              name="Maximum" 
              fill="#8b5cf6" 
              barSize={20}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="pattern-insights">
        <h3>Insights</h3>
        <ul className="insights-list">
          {data.insights && data.insights[patternType] && data.insights[patternType].map((insight, index) => (
            <li key={index} className="insight-item">
              <div className="insight-icon">💡</div>
              <div className="insight-text">{insight}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SeasonalAnalysis;