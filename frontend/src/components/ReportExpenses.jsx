import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
        
        const response = await axios.get('/api/transactions/expense-report', {
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
  const formatCurrency = (value) => {
    return `${value.toFixed(2)} €`;
  };
  
  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-category">{data.category}</p>
          <p className="tooltip-amount">{formatCurrency(data.amount)}</p>
          <p className="tooltip-percent">{`${(data.amount / expenseData.totalExpenses * 100).toFixed(1)}%`}</p>
        </div>
      );
    }
    return null;
  };
  
  if (loading) return <div>Chargement du rapport de dépenses...</div>;
  if (error) return <div>Erreur: {error}</div>;
  if (!expenseData) return <div>Aucune donnée disponible</div>;
  
  return (
    <div className="report-section">
      <h2>Evolution des dépenses</h2>
      
      {/* Month selector */}
      <div className="month-selector">
        <button onClick={goToPreviousMonth} className="month-nav-button">
          <FaChevronLeft />
        </button>
        <h3>{format(currentMonth, 'MMMM yyyy', { locale: fr })}</h3>
        <button onClick={goToNextMonth} className="month-nav-button">
          <FaChevronRight />
        </button>
      </div>
      
      {/* Summary cards */}
      <div className="expense-summary-cards">
        <div className="report-card">
          <h3>Total des dépenses</h3>
          <p className="amount-expense">{formatCurrency(expenseData.totalExpenses)}</p>
        </div>
        <div className="report-card">
          <h3>Dépense moyenne par jour</h3>
          <p className="amount-expense">{formatCurrency(expenseData.averageDailyExpense)}</p>
        </div>
      </div>
      
      {/* Main charts section */}
      <div className="expense-charts-container">
        {/* Expenses by category pie chart */}
        <div className="chart-card">
          <h3>Répartition des dépenses par catégorie</h3>
          <div style={{ height: '300px' }}>
            {expenseData.expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData.expensesByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                    nameKey="category"
                    label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {expenseData.expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data-message">Aucune dépense pour ce mois</div>
            )}
          </div>
        </div>
        
        {/* Top 5 expenses bar chart */}
        <div className="chart-card">
          <h3>Top 5 des dépenses</h3>
          <div style={{ height: '300px' }}>
            {expenseData.topExpenses.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={expenseData.topExpenses.map(expense => ({
                    description: expense.description.length > 20 
                      ? expense.description.substring(0, 20) + '...' 
                      : expense.description,
                    amount: Math.abs(expense.amount),
                    category: expense.category,
                    fullDescription: expense.description
                  }))}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis type="number" stroke="#aaa" />
                  <YAxis 
                    dataKey="description" 
                    type="category" 
                    stroke="#aaa" 
                    width={100}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Montant']}
                    labelFormatter={(label) => {
                      const item = expenseData.topExpenses.find(item => 
                        item.description.includes(label) || label.includes(item.description)
                      );
                      return item ? item.description : label;
                    }}
                    contentStyle={{ backgroundColor: '#333', border: '1px solid #666', color: 'white' }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="amount" 
                    fill="#ef4444" 
                    name="Montant" 
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data-message">Aucune dépense pour ce mois</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Daily expense trend line chart */}
      <div className="chart-card">
        <h3>Évolution des dépenses quotidiennes</h3>
        <div style={{ height: '300px' }}>
          {expenseData.dailyExpenseTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={expenseData.dailyExpenseTrend}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis 
                  dataKey="date" 
                  stroke="#aaa"
                  tickFormatter={(date) => format(new Date(date), 'dd/MM')}
                />
                <YAxis stroke="#aaa" />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Dépenses']}
                  labelFormatter={(date) => format(new Date(date), 'dd MMMM yyyy', { locale: fr })}
                  contentStyle={{ backgroundColor: '#333', border: '1px solid #666', color: 'white' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#ef4444" 
                  name="Dépenses" 
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#ef4444' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data-message">Aucune dépense pour ce mois</div>
          )}
        </div>
      </div>
      
      {/* Expenses by category breakdown */}
      <div className="chart-card">
        <h3>Détail des dépenses par catégorie</h3>
        <div className="expense-category-table">
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Montant</th>
                <th>Pourcentage</th>
                <th>Nombre de transactions</th>
              </tr>
            </thead>
            <tbody>
              {expenseData.expensesByCategory.map((category, index) => (
                <tr key={index}>
                  <td>{category.category}</td>
                  <td className="amount-expense">{formatCurrency(category.amount)}</td>
                  <td>{((category.amount / expenseData.totalExpenses) * 100).toFixed(1)}%</td>
                  <td>{category.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportExpenses;