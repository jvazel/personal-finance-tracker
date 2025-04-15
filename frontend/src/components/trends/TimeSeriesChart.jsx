import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area
} from 'recharts';

const TimeSeriesChart = ({ data, timeframe }) => {
  const [chartType, setChartType] = useState('line'); // 'line', 'bar', 'area'
  
  // Formater les dates sur l'axe X en fonction du timeframe
  const formatXAxis = (value) => {
    if (!value) return '';
    
    // Extraire la date du format ISO
    const date = new Date(value);
    
    if (timeframe === 'week') {
      // Format jour de la semaine (Lu, Ma, etc.)
      return new Intl.DateTimeFormat('fr', { weekday: 'short' }).format(date);
    } else if (timeframe === 'month') {
      // Format jour du mois (1, 2, ..., 31)
      return date.getDate();
    } else if (timeframe === 'quarter') {
      // Format mois abrégé (Jan, Fév, etc.)
      return new Intl.DateTimeFormat('fr', { month: 'short' }).format(date);
    } else if (timeframe === 'year') {
      // Format mois abrégé (Jan, Fév, etc.)
      return new Intl.DateTimeFormat('fr', { month: 'short' }).format(date);
    }
    
    return value;
  };
  
  // Formater les valeurs pour le tooltip
  const formatTooltipValue = (value) => {
    return `${value.toFixed(2)} €`;
  };
  
  return (
    <div className="time-series-chart-container">
      <div className="chart-controls">
        <div className="chart-type-buttons">
          <button 
            className={`chart-type-button ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => setChartType('line')}
          >
            Ligne
          </button>
          <button 
            className={`chart-type-button ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => setChartType('bar')}
          >
            Histogramme
          </button>
          <button 
            className={`chart-type-button ${chartType === 'area' ? 'active' : ''}`}
            onClick={() => setChartType('area')}
          >
            Aire
          </button>
        </div>
      </div>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis}
              tick={{ fill: '#e2e8f0' }}
            />
            <YAxis 
              tickFormatter={(value) => `${value} €`}
              tick={{ fill: '#e2e8f0' }}
            />
            <Tooltip 
              formatter={formatTooltipValue}
              labelFormatter={(value) => {
                const date = new Date(value);
                return new Intl.DateTimeFormat('fr', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }).format(date);
              }}
            />
            <Legend />
            
            {chartType === 'line' && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  name="Revenus" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expense" 
                  name="Dépenses" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </>
            )}
            
            {chartType === 'bar' && (
              <>
                <Bar 
                  dataKey="income" 
                  name="Revenus" 
                  fill="#10b981" 
                  barSize={20}
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="expense" 
                  name="Dépenses" 
                  fill="#ef4444" 
                  barSize={20}
                  radius={[4, 4, 0, 0]}
                />
              </>
            )}
            
            {chartType === 'area' && (
              <>
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  name="Revenus" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="expense" 
                  name="Dépenses" 
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.3}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TimeSeriesChart;