import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const ReportExpenses = () => {
  const [expenseData, setExpenseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Colors for the pie chart
  const COLORS = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#8AC249', '#EA5F89', '#00D8B6', '#FFB6C1'
  ];

  useEffect(() => {
    const fetchExpenseReport = async () => {
      try {
        setLoading(true);

        // Calculate start and end dates for the selected month
        const firstDay = startOfMonth(currentMonth);
        const lastDay = endOfMonth(currentMonth);

        // Format dates for API (YYYY-MM-DD)
        const startDate = format(firstDay, 'yyyy-MM-dd');
        const endDate = format(lastDay, 'yyyy-MM-dd');

        const response = await api.get('api/transactions/expense-report', {
          params: { startDate, endDate }
        });

        setExpenseData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement du rapport de dépenses:', err);
        setError('Erreur lors du chargement du rapport de dépenses');
        setLoading(false);
      }
    };

    fetchExpenseReport();
  }, [currentMonth]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ backgroundColor: '#333', padding: '10px', border: '1px solid #666' }}>
          <p className="label" style={{ margin: '0', color: '#fff' }}>{`${payload[0].name}: ${formatCurrency(payload[0].value)}`}</p>
          <p className="percent" style={{ margin: '0', color: '#fff' }}>{`(${(payload[0].percent * 100).toFixed(2)}%)`}</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for line chart
  const CustomLineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ backgroundColor: '#333', padding: '10px', border: '1px solid #666' }}>
          <p className="label" style={{ margin: '0', color: '#fff' }}>{`Date: ${label}`}</p>
          <p className="value" style={{ margin: '0', color: '#fff' }}>{`Dépenses: ${formatCurrency(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="loading-message">Chargement du rapport de dépenses...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!expenseData) {
    return <div className="no-data-message">Aucune donnée disponible pour cette période</div>;
  }

  return (
    <div className="report-section">
      <h2>Rapport de Dépenses</h2>

      <div className="month-selector">
        <button onClick={goToPreviousMonth} className="month-nav-button">
          <FaChevronLeft />
        </button>
        <h3>{format(currentMonth, 'MMMM yyyy', { locale: fr })}</h3>
        <button onClick={goToNextMonth} className="month-nav-button">
          <FaChevronRight />
        </button>
      </div>

      <div className="expense-summary-cards">
        <div className="report-card">
          <h3>Total des Dépenses</h3>
          <p>{formatCurrency(expenseData.totalExpenses)}</p>
        </div>
        <div className="report-card">
          <h3>Dépense Moyenne Journalière</h3>
          <p>{formatCurrency(expenseData.averageDailyExpense)}</p>
        </div>
      </div>

      <div className="expense-charts-container">
        {/* Pie Chart for Category Distribution */}
        <div className="expense-chart-card">
          <h3>Répartition par Catégorie</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={expenseData.expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                  nameKey="categoryName" // Utiliser categoryName au lieu de category
                  label={({ categoryName, percent }) => `${categoryName}: ${(percent * 100).toFixed(0)}%`}
                >
                  {expenseData.expensesByCategory.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.categoryColor || COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart for Daily Expense Trend */}
        <div className="expense-chart-card">
          <h3>Évolution Journalière des Dépenses</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart
                data={expenseData.dailyExpenseTrend}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip content={<CustomLineTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#ef4444"
                  activeDot={{ r: 8 }}
                  name="Dépenses"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Expenses Table */}
      <div className="top-expenses-section">
        <h3>Top 5 des Dépenses</h3>
        <table className="transaction-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Catégorie</th>
              <th>Date</th>
              <th>Montant</th>
            </tr>
          </thead>
          <tbody>
            {expenseData.topExpenses.map((expense, index) => (
              <tr key={index}>
                <td>{expense.description}</td>
                <td className="category-cell">
                  <span 
                    className="category-indicator" 
                    style={{ backgroundColor: expense.categoryColor || '#808080' }}
                  ></span>
                  {expense.categoryName || 'Non catégorisé'}
                </td>
                <td>{format(new Date(expense.date), 'dd/MM/yyyy', { locale: fr })}</td>
                <td className="amount-expense">{formatCurrency(Math.abs(expense.amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Category Expenses Table */}
      <div className="expense-category-table">
        <h3>Top Catégories de Dépenses</h3>
        <table className="transaction-table">
          <thead>
            <tr>
              <th>Catégorie</th>
              <th>Montant</th>
              <th>% du total</th>
            </tr>
          </thead>
          <tbody>
            {expenseData.expensesByCategory.slice(0, 5).map((category, index) => (
              <tr key={index}>
                <td className="category-cell">
                  <span 
                    className="category-indicator" 
                    style={{ backgroundColor: category.categoryColor || '#808080' }}
                  ></span>
                  {category.categoryName || 'Non catégorisé'}
                </td>
                <td>{formatCurrency(Math.abs(category.amount))}</td>
                <td>{(category.percentage * 100).toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportExpenses;