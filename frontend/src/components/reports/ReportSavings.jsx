import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import AmountDisplay from '../common/AmountDisplay';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ReportSavings = () => {
  const [monthlySavings, setMonthlySavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' pour descendant (plus récent d'abord)

  useEffect(() => {
    const fetchReportTransactions = async () => {
      setLoading(true);
      try {
        const response = await api.get('/transactions/reports'); // Utiliser api au lieu d'axios
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
          savings: savings.income - Math.abs(savings.expense), // expense is positive in our calculation
          displayDate: formatDisplayDate(new Date(monthYear)) // Ajouter le format d'affichage
        }));
        
        // Tri initial par date (plus récent d'abord)
        sortSavingsArray(savingsArray, 'desc');
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

  // Fonction pour trier le tableau des économies
  const sortSavingsArray = (array, order) => {
    return array.sort((a, b) => {
      const dateA = new Date(a.monthYear);
      const dateB = new Date(b.monthYear);
      return order === 'asc' ? dateA - dateB : dateB - dateA;
    });
  };

  // Fonction pour inverser l'ordre de tri
  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newOrder);
    
    // Créer une copie du tableau pour éviter de modifier l'état directement
    const sortedSavings = [...monthlySavings];
    sortSavingsArray(sortedSavings, newOrder);
    setMonthlySavings(sortedSavings);
  };

  const formatMonthYear = (date) => {
    const month = date.getMonth() + 1; // getMonth() is 0-indexed
    const year = date.getFullYear();
    return `${year}-${month.toString().padStart(2, '0')}-01`; // Format for date comparison
  };

  // Nouvelle fonction pour formater la date d'affichage
  const formatDisplayDate = (date) => {
    return format(date, 'MMMM yyyy', { locale: fr });
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
            <th onClick={toggleSortOrder} style={{ cursor: 'pointer' }}>
              Mois {sortOrder === 'desc' ? '▼' : '▲'}
            </th>
            <th>Solde</th>
          </tr>
        </thead>
        <tbody>
          {monthlySavings.map(item => (
            <tr key={item.monthYear}>
              <td>{item.displayDate ? (item.displayDate.charAt(0).toUpperCase() + item.displayDate.slice(1)) : ''}</td>
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