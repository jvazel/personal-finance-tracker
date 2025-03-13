import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const SavingsChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchYearlyData = async () => {
      setLoading(true);
      try {
        // Utiliser la même route que pour les rapports pour obtenir les données d'un an
        const response = await axios.get('/api/transactions/reports');
        const transactions = response.data;
        
        if (transactions && transactions.length > 0) {
          // Traiter les transactions pour calculer les économies mensuelles
          const monthlySavingsMap = new Map();
          
          transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlySavingsMap.has(monthYear)) {
              monthlySavingsMap.set(monthYear, { income: 0, expense: 0 });
            }
            
            const monthData = monthlySavingsMap.get(monthYear);
            if (transaction.type === 'income') {
              monthData.income += transaction.amount;
            } else if (transaction.type === 'expense') {
              monthData.expense += transaction.amount;
            }
          });
          
          // Convertir la map en tableau trié
          const sortedMonths = Array.from(monthlySavingsMap.keys()).sort();
          const savingsData = sortedMonths.map(month => {
            const { income, expense } = monthlySavingsMap.get(month);
            return income - Math.abs(expense);
          });
          
          // Mettre à jour les données du graphique
          setChartData({
            labels: sortedMonths,
            datasets: [
              {
                label: 'Monthly Savings',
                data: savingsData,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.1,
              },
            ],
          });
        }
      } catch (err) {
        setError(err);
        console.error('Error fetching yearly data for chart:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchYearlyData();
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Savings Evolution Over Last Year',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount ($)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Month',
        },
      },
    },
  };

  if (loading) return <div>Loading chart data...</div>;
  if (error) return <div>Error loading chart data: {error.message}</div>;

  return (
    <div className="chart-container">
      {chartData.labels.length > 0 ? (
        <Line options={options} data={chartData} />
      ) : (
        <p>No transaction data available to display chart.</p>
      )}
    </div>
  );
};

export default SavingsChart;