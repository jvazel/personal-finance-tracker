import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AmountDisplay from './AmountDisplay';

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
        console.error('Erreur lors de la récupération des rapports de transactions:', err);
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

  if (loading) return <div>Chargement du rapport...</div>;
  if (error) return <div>Erreur lors du chargement du rapport: {error.message}</div>;
  if (!monthlySavings || monthlySavings.length === 0) return <div>Aucune donnée disponible.</div>;

  return (
    <div>
      <h2>Rapport sur l'évolution du solde (sur une année)</h2>
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Mois</th>
            <th>Solde</th>
          </tr>
        </thead>
        <tbody>
          {monthlySavings.map(item => (
            <tr key={item.monthYear}>
              <td>{item.monthYear.substring(0, 7)}</td> {/* Display YYYY-MM */}
              <td className={item.savings >= 0 ? 'amount-income' : 'amount-expense'}>
                <AmountDisplay 
                  amount={item.savings} 
                  type={item.savings >= 0 ? 'income' : 'expense'} 
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportSavings;