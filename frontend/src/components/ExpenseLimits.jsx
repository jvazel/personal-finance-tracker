import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
        
        // Fetch active expense limits
        const limitsResponse = await axios.get('/api/goals', {
          params: { type: 'expense_limit', isActive: true }
        });
        
        // For each limit, fetch the current month's expenses for that category
        const limitsWithProgress = await Promise.all(
          limitsResponse.data.map(async (limit) => {
            try {
              const expensesResponse = await axios.get('/api/transactions/expenses-by-category', {
                params: { 
                  startDate, 
                  endDate,
                  category: limit.category 
                }
              });
              
              // Find the matching category in the response
              const categoryExpense = expensesResponse.data.find(
                item => item.category === limit.category
              );
              
              const currentAmount = categoryExpense ? categoryExpense.amount : 0;
              const percentage = limit.targetAmount > 0 
                ? Math.min(100, (currentAmount / limit.targetAmount) * 100) 
                : 0;
                
              return {
                ...limit,
                currentAmount,
                percentage,
                isExceeded: currentAmount > limit.targetAmount
              };
            } catch (err) {
              console.error(`Error fetching expenses for category ${limit.category}:`, err);
              return {
                ...limit,
                currentAmount: 0,
                percentage: 0,
                isExceeded: false
              };
            }
          })
        );
        
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