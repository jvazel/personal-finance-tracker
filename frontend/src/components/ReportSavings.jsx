import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ReportSavings = () => {
  const [monthlySavings, setMonthlySavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReportTransactions = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/transactions/reports');
        const transactions = response.data;
        
        // Calculer les économies mensuelles
        const savingsMap = new Map();
        transactions.forEach(transaction => {
          const monthYear = formatMonthYear(new Date(transaction.date));
          let currentSavings = savingsMap.get(monthYear) || { income: 0, expense: 0 };
          if (transaction.type === 'income') {
            currentSavings.income += transaction.amount;
          } else if (transaction.type === 'expense') {
            currentSavings.expense += transaction.amount;
          }
          savingsMap.set(monthYear, currentSavings);
        });

        const savingsArray = Array.from(savingsMap.entries()).map(([monthYear, savings]) => ({
          monthYear,
          savings: savings.income - Math.abs(savings.expense) // expense is positive in our calculation
        }));
        savingsArray.sort((a, b) => new Date(b.monthYear) - new Date(a.monthYear)); // Sort by date descending
        setMonthlySavings(savingsArray);
      } catch (err) {
        setError(err);
        console.error('Error fetching report transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportTransactions();
  }, []);

  const formatMonthYear = (date) => {
    const month = date.getMonth() + 1; // getMonth() is 0-indexed
    const year = date.getFullYear();
    return `${year}-${month.toString().padStart(2, '0')}-01`; // Format for date comparison
  };

  if (loading) return <div>Loading savings report...</div>;
  if (error) return <div>Error loading savings report: {error.message}</div>;
  if (!monthlySavings || monthlySavings.length === 0) return <div>No savings data available.</div>;

  return (
    <div>
      <h2>Savings Report (Last Year)</h2>
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Month</th>
            <th>Savings</th>
          </tr>
        </thead>
        <tbody>
          {monthlySavings.map(item => (
            <tr key={item.monthYear}>
              <td>{item.monthYear.substring(0, 7)}</td> {/* Display YYYY-MM */}
              <td>${item.savings.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportSavings;