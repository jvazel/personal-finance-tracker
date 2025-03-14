import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ReportTransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <div>Chargement de l'historique des transactions...</div>;
  if (error) return <div>Erreur lors du chargement de l'historique des transactions : {error.message}</div>;
  if (!transactions || transactions.length === 0) return <div>Aucune transaction à afficher.</div>;

  return (
    <div>
      <h2>Rapport d'historique des transactions (Dernière année)</h2>
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Montant</th>
            <th>Type</th>
            <th>Catégorie</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(transaction => (
            <tr key={transaction._id}>
              <td>{format(new Date(transaction.date), 'dd/MM/yyyy', { locale: fr })}</td>
              <td>{transaction.description}</td>
              <td>{transaction.amount.toFixed(2)} €</td>
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