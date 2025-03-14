import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SavingsChart from './SavingsChart';

// Set axios default base URL
axios.defaults.baseURL = 'http://localhost:5000'; // Adjust this to match your backend URL

const Dashboard = () => {
  // Définir les états pour stocker les données financières
  const [savings, setSavings] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les données financières au chargement du composant
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Récupérer les données du tableau de bord depuis l'API
        const response = await axios.get('/api/transactions/dashboard');
        console.log('Dashboard data received:', response.data);
        
        // Mettre à jour les états avec les données reçues
        setSavings(response.data.savings || 0);
        setTotalIncome(response.data.totalIncome || 0);
        setTotalExpenses(response.data.totalExpenses || 0);
      } catch (err) {
        console.error('Erreur lors du chargement des données du tableau de bord:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div>Chargement du tableau de bord...</div>;
  if (error) return <div>Erreur lors du chargement des données: {error.message}</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-summary">
        <div className="dashboard-card">
          <h3>Solde actuel</h3>
          <p>{savings >= 0 ? `${savings.toFixed(2)} €` : `-${Math.abs(savings).toFixed(2)} €`}</p>
        </div>
        <div className="dashboard-card">
          <h3>Revenus du mois</h3>
          <p>{totalIncome.toFixed(2)} €</p>
        </div>
        <div className="dashboard-card">
          <h3>Dépenses du mois</h3>
          <p>{totalExpenses.toFixed(2)} €</p>
        </div>
      </div>
      
      {/* Reste du composant Dashboard */}
      <div className="dashboard-chart-section">
        <div className="chart-card">
          <h3>Aperçu des dépenses par catégorie</h3>
          {/* Composant de graphique ici */}
        </div>
      </div>
      
      <div className="dashboard-chart-section">
        <div className="chart-card">
          <h3>Tendance des revenus et dépenses</h3>
          {/* Composant de graphique ici */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;