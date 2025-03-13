import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

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
        console.error('Error fetching report transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportTransactions();
  }, []);

  if (loading) return <div>Loading transaction history...</div>;
  if (error) return <div>Error loading transaction history: {error.message}</div>;
  if (!transactions || transactions.length === 0) return <div>No transactions to report.</div>;

  return (
    <div>
      <h2>Transaction History Report (Last Year)</h2>
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Type</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(transaction => (
            <tr key={transaction._id}>
              <td>{format(new Date(transaction.date), 'yyyy-MM-dd')}</td>
              <td>{transaction.description}</td>
              <td>${transaction.amount.toFixed(2)}</td>
              <td>{transaction.type}</td>
              <td>{transaction.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportTransactionHistory;