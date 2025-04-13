import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register the required Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const ExpensePieChart = ({ expensesByCategory }) => {
  // Default colors for the pie chart
  const backgroundColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#8AC249', '#EA5F89', '#00D8B6', '#FFB6C1'
  ];

  // Prepare data for the pie chart
  const data = {
    labels: expensesByCategory.map(item => {
      // Handle both string categories and category objects
      return typeof item.category === 'object' ? item.category.name : item.category;
    }),
    datasets: [
      {
        data: expensesByCategory.map(item => item.amount),
        backgroundColor: expensesByCategory.map(item => {
          // Use category color if available, otherwise use default colors
          if (typeof item.category === 'object' && item.category.color) {
            return item.category.color;
          }
          return backgroundColors[expensesByCategory.indexOf(item) % backgroundColors.length];
        }),
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value.toFixed(2)} € (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    // Réduire la hauteur du graphique de 300px à 250px
    <div style={{ height: '250px' }}>
      {expensesByCategory.length > 0 ? (
        <Pie data={data} options={options} />
      ) : (
        <div className="no-data-message">Aucune dépense à afficher</div>
      )}
    </div>
  );
};

export default ExpensePieChart;