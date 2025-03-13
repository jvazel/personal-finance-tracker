import React, { useContext, useState } from 'react';
import { TransactionContext } from '../contexts/TransactionContext';
import TransactionForm from './TransactionForm';
import { format } from 'date-fns';

const TransactionList = ({ selectedMonth }) => {
  const { transactions, loading, error, deleteTransaction, refreshTransactions } = useContext(TransactionContext);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id);
        // After deletion, refresh with the selected month
        const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
        const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
        refreshTransactions(startOfMonth, endOfMonth);
      } catch (err) {
        console.error("Error deleting transaction:", err);
        alert('Failed to delete transaction.');
      }
    }
  };

  const handleEdit = (transaction) => {
    setTransactionToEdit(transaction);
    setShowEditForm(true);
  };

  const handleCloseForm = () => {
    setShowEditForm(false);
    // Refresh with the selected month after edit
    const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
    refreshTransactions(startOfMonth, endOfMonth);
  };

  if (loading) return <div>Loading transactions...</div>;
  if (error) return <div>Error loading transactions: {error.message}</div>;
  if (!transactions || transactions.length === 0) {
    const monthName = selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    return <div>No transactions recorded for {monthName}.</div>;
  }

  return (
    <div className="transaction-list-container">
      {showEditForm && <TransactionForm 
        transactionToEdit={transactionToEdit} 
        onClose={handleCloseForm} 
        selectedMonth={selectedMonth}
      />}

      <table className="transaction-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Type</th>
            <th>Category</th>
            <th>Actions</th>
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
              <td className="transaction-actions">
                <button onClick={() => handleEdit(transaction)}>Edit</button>
                <button className="delete" onClick={() => handleDelete(transaction._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionList;