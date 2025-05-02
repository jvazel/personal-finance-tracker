import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ExpenseLimits = () => {
  const [expenseLimits, setExpenseLimits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExpenseLimits = async () => {
      try {
        setLoading(true);
        
        // Get current month dates
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        // Format dates for API (YYYY-MM-DD)
        const startDate = firstDayOfMonth.toISOString().split('T')[0];
        const endDate = lastDayOfMonth.toISOString().split('T')[0];
        
        // Fetch active expense limits AND savings goals
        const limitsResponse = await api.get('/api/goals', {
          params: { type: ['expense_limit', 'savings'], isActive: true }
        });
        
        // Check if the response has data property or is an array directly
        const limitsData = limitsResponse.data.data || limitsResponse.data;
        
        // Fetch all expenses by category for the current month in a single request
        const allExpensesResponse = await api.get('/api/transactions/expenses-by-category', {
          params: { startDate, endDate }
        });
        
        // Check if the response has data property or is an array directly
        const expensesData = allExpensesResponse.data.data || allExpensesResponse.data;
        
        // Map expenses by category for easier lookup
        const expensesByCategory = {};
        expensesData.forEach(item => {
          expensesByCategory[item.category] = item.amount;
        });
        
        // For each limit or savings goal, find the corresponding expense amount or use currentAmount
        const limitsWithProgress = limitsData.map(limit => {
          // For expense limits, use expenses by category
          if (limit.type === 'expense_limit') {
            const currentAmount = expensesByCategory[limit.category] || 0;
            const percentage = limit.targetAmount > 0 
              ? Math.min(100, (currentAmount / limit.targetAmount) * 100) 
              : 0;
              
            return {
              ...limit,
              currentAmount,
              percentage,
              isExceeded: currentAmount > limit.targetAmount
            };
          } 
          // For savings goals, use the currentAmount from the goal itself
          else if (limit.type === 'savings') {
            const percentage = limit.targetAmount > 0 
              ? Math.min(100, (limit.currentAmount / limit.targetAmount) * 100) 
              : 0;
              
            return {
              ...limit,
              percentage,
              isExceeded: false
            };
          }
        });
        
        setExpenseLimits(limitsWithProgress);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching expense limits:', err);
        setError('Échec du chargement des limites de dépenses');
        setLoading(false);
      }
    };

    fetchExpenseLimits();
  }, []);

  if (loading) return <div>Chargement des limites de dépenses...</div>;
  if (error) return <div>Erreur: {error}</div>;
  if (expenseLimits.length === 0) return <div>Aucune limite de dépense définie</div>;

  return (
    <div className="expense-limits-container">
      {expenseLimits.map((limit) => (
        <div 
          key={limit._id} 
          className={`expense-limit-item ${limit.isExceeded ? 'exceeded' : ''}`}
        >
          <div className="expense-limit-header">
            <div className="expense-limit-title">{limit.title}</div>
            <div className="expense-limit-category">{limit.category}</div>
          </div>
          
          <div className="expense-limit-progress-container">
            <div className="expense-limit-progress-bar">
              <div 
                className="expense-limit-progress" 
                style={{ width: `${limit.percentage}%` }}
              ></div>
            </div>
            <div className="expense-limit-amounts">
              <span className={limit.isExceeded ? 'amount-expense' : ''}>
                {limit.currentAmount.toFixed(2)} €
              </span>
              <span> / {limit.targetAmount.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExpenseLimits;