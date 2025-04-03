import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SavingsChart from './SavingsChart';
import ExpensePieChart from './ExpensePieChart';
import IncomeExpenseTrend from './IncomeExpenseTrend';
import TopExpenses from './TopExpenses'; 
import ExpenseLimits from './ExpenseLimits';

// Set axios default base URL
axios.defaults.baseURL = 'http://localhost:5000'; // Adjust this to match your backend URL

const Dashboard = () => {
  // Définir les états pour stocker les données financières
  const [savings, setSavings] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [expensesByCategory, setExpensesByCategory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topExpensesLimit, setTopExpensesLimit] = useState(5); // Nombre de dépenses principales à afficher
  
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
        
        // Calculer les dates pour le mois en cours
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        // Formater les dates pour l'API (YYYY-MM-DD)
        const startDate = firstDayOfMonth.toISOString().split('T')[0];
        const endDate = lastDayOfMonth.toISOString().split('T')[0];
        
        // In your fetchDashboardData function, add more detailed error logging:
        
        // Récupérer les dépenses par catégorie pour le mois en cours
        try {
          const categoriesResponse = await axios.get('/api/transactions/expenses-by-category', {
            params: { startDate, endDate }
          });
          console.log('Categories response:', categoriesResponse.data);
          setExpensesByCategory(categoriesResponse.data || []);
        } catch (err) {
          console.error('Error fetching expenses by category:', err.response ? err.response.data : err.message);
          // Don't set the error state here to prevent the dashboard from showing an error
          // Just set empty categories
          setExpensesByCategory([]);
        }
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
        <div className={`dashboard-card ${savings >= 0 ? 'income' : 'expense'}`}>
          <h3>Solde actuel</h3>
          <p>{savings >= 0 ? `${savings.toFixed(2)} €` : `-${Math.abs(savings).toFixed(2)} €`}</p>
        </div>
        <div className="dashboard-card income">
          <h3>Revenus du mois</h3>
          <p>{totalIncome.toFixed(2)} €</p>
        </div>
        <div className="dashboard-card expense">
          <h3>Dépenses du mois</h3>
          <p>{totalExpenses.toFixed(2)} €</p>
        </div>
      </div>
      
      <div className="dashboard-charts-row">
        <div className="dashboard-chart-section">
          <div className="chart-card">
            <h3>Aperçu des dépenses par catégorie</h3>
            <ExpensePieChart expensesByCategory={expensesByCategory} />
          </div>
        </div>
        
        <div className="dashboard-chart-section">
          <div className="chart-card">
            <h3>Top {topExpensesLimit} des dépenses du mois</h3>
            <div className="limit-selector">
              <label htmlFor="topExpensesLimit">Nombre à afficher: </label>
              <select 
                id="topExpensesLimit" 
                value={topExpensesLimit} 
                onChange={(e) => setTopExpensesLimit(Number(e.target.value))}
              >
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="10">10</option>
              </select>
            </div>
            <TopExpenses limit={topExpensesLimit} />
          </div>
        </div>
      </div>
      
      {/* Nouvelle section pour les limites de dépenses */}
      <div className="dashboard-chart-section">
        <div className="chart-card">
          <h3>Limites de dépenses par catégorie</h3>
          <ExpenseLimits />
        </div>
      </div>
      
      <div className="dashboard-chart-section">
        <div className="chart-card">
          <h3>Tendance des revenus et dépenses</h3>
          <IncomeExpenseTrend />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;