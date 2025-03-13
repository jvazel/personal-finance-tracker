import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SavingsChart from './SavingsChart';

// Set axios default base URL
axios.defaults.baseURL = 'http://localhost:5000'; // Adjust this to match your backend URL

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    savings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('/api/dashboard-data');
        setDashboardData(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div>Loading dashboard data...</div>;
  if (error) return <div>Error loading dashboard data: {error.message}</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-summary">
        <div className="dashboard-card">
          <h3>Total Income (This Month)</h3>
          <p>${dashboardData.totalIncome.toFixed(2)}</p>
        </div>
        <div className="dashboard-card">
          <h3>Total Expenses (This Month)</h3>
          <p>${dashboardData.totalExpenses.toFixed(2)}</p>
        </div>
        <div className="dashboard-card">
          <h3>Savings (This Month)</h3>
          <p>${dashboardData.savings.toFixed(2)}</p>
        </div>
      </div>
      
      <div className="dashboard-chart-section">
        <div className="dashboard-card chart-card">
          <SavingsChart />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;