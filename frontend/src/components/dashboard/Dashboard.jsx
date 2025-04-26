import React, { useState, useEffect } from 'react';
import SavingsChart from './SavingsChart';
import ExpensePieChart from './ExpensePieChart';
import IncomeExpenseTrend from './IncomeExpenseTrend';
import TopExpenses from './TopExpenses';
import ExpenseLimits from './ExpenseLimits';
import api from '../../services/api';
import { motion } from 'framer-motion';
import AnimatedCard from '../common/AnimatedCard';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

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
        const response = await api.get('/api/transactions/dashboard');
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

        // Récupérer les dépenses par catégorie pour le mois en cours
        try {
          const categoriesResponse = await api.get('/api/transactions/expenses-by-category', {
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
    <motion.div 
      className="dashboard-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="dashboard-summary" variants={itemVariants}>
        <AnimatedCard className={`dashboard-card ${savings >= 0 ? 'income' : 'expense'}`}>
          <h3>Solde actuel</h3>
          <p>{savings >= 0 ? `${savings.toFixed(2)} €` : `-${Math.abs(savings).toFixed(2)} €`}</p>
        </AnimatedCard>
        <AnimatedCard className="dashboard-card income">
          <h3>Revenus du mois</h3>
          <p>{totalIncome.toFixed(2)} €</p>
        </AnimatedCard>
        <AnimatedCard className="dashboard-card expense">
          <h3>Dépenses du mois</h3>
          <p>{totalExpenses.toFixed(2)} €</p>
        </AnimatedCard>
      </motion.div>

      <motion.div className="dashboard-charts-row" variants={itemVariants}>
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
      </motion.div>

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
    </motion.div>
  );
};

export default Dashboard;
