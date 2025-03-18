import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AmountDisplay from './AmountDisplay';

const ReportTransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  useEffect(() => {
    const fetchReportTransactions = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/transactions/reports');
        setTransactions(response.data);
      } catch (err) {
        setError(err);
        console.error('Erreur lors du chargement des transactions du rapport:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportTransactions();
  }, []);

  // Sort transactions based on current sortConfig
  const sortedTransactions = React.useMemo(() => {
    let sortableTransactions = [...transactions];
    if (sortConfig.key) {
      sortableTransactions.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Special handling for date values
        if (sortConfig.key === 'date') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }
        
        // Handle numeric values
        if (sortConfig.key === 'amount') {
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableTransactions;
  }, [transactions, sortConfig]);

  // Request sort on column
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort direction indicator
  const getSortDirectionIndicator = (key) => {
    if (sortConfig.key !== key) return '';
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  if (loading) return <div>Chargement de l'historique des transactions...</div>;
  if (error) return <div>Erreur lors du chargement de l'historique des transactions : {error.message}</div>;
  if (!transactions || transactions.length === 0) return <div>Aucune transaction à afficher.</div>;

  return (
    <div>
      <h2>Rapport d'historique des transactions (Dernière année)</h2>
      <table className="transaction-table">
        <thead>
          <tr>
            <th onClick={() => requestSort('date')} style={{ cursor: 'pointer' }}>
              Date{getSortDirectionIndicator('date')}
            </th>
            <th onClick={() => requestSort('description')} style={{ cursor: 'pointer' }}>
              Description{getSortDirectionIndicator('description')}
            </th>
            <th onClick={() => requestSort('amount')} style={{ cursor: 'pointer' }}>
              Montant{getSortDirectionIndicator('amount')}
            </th>
            <th onClick={() => requestSort('type')} style={{ cursor: 'pointer' }}>
              Type{getSortDirectionIndicator('type')}
            </th>
            <th onClick={() => requestSort('category')} style={{ cursor: 'pointer' }}>
              Catégorie{getSortDirectionIndicator('category')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedTransactions.map(transaction => (
            <tr key={transaction._id}>
              <td>{format(new Date(transaction.date), 'dd/MM/yyyy', { locale: fr })}</td>
              <td>{transaction.description}</td>
              <td className={transaction.type === 'income' ? 'amount-income' : 'amount-expense'}>
                <AmountDisplay amount={transaction.amount} type={transaction.type} />
              </td>
              <td>{transaction.type === 'income' ? 'Revenu' : 'Dépense'}</td>
              <td>{transaction.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportTransactionHistory;