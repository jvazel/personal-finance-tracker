import React, { useContext, useState } from 'react';
import { TransactionContext } from '../contexts/TransactionContext';
import TransactionForm from './TransactionForm';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Modal from './Modal';
import AmountDisplay from './AmountDisplay';

const TransactionList = ({ selectedMonth }) => {
  const { transactions, loading, error, deleteTransaction, refreshTransactions } = useContext(TransactionContext);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      try {
        await deleteTransaction(id);
        // After deletion, refresh with the selected month
        const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
        const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
        refreshTransactions(startOfMonth, endOfMonth);
      } catch (err) {
        console.error("Erreur lors de la suppression de la transaction:", err);
        alert('Échec de la suppression de la transaction.');
      }
    }
  };

  const handleEdit = (transaction) => {
    setTransactionToEdit(transaction);
    setShowEditForm(true);
  };

  const handleCloseForm = () => {
    setShowEditForm(false);
    setTransactionToEdit(null);
    // Refresh with the selected month after edit
    const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
    refreshTransactions(startOfMonth, endOfMonth);
  };

  if (loading) return <div>Chargement des transactions...</div>;
  if (error) return <div>Erreur lors du chargement des transactions : {error.message}</div>;
  if (!transactions || transactions.length === 0) {
    const monthName = selectedMonth.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
    return <div>Aucune transaction enregistrée pour {monthName}.</div>;
  }

  return (
    <div className="transaction-list-container">
      <Modal 
        isOpen={showEditForm} 
        onClose={handleCloseForm} 
        title="Modifier la transaction"
      >
        <TransactionForm 
          transactionToEdit={transactionToEdit} 
          onClose={handleCloseForm} 
          selectedMonth={selectedMonth}
        />
      </Modal>

      <table className="transaction-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Montant</th>
            <th>Type</th>
            <th>Catégorie</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(transaction => (
            <tr key={transaction._id}>
              <td>{format(new Date(transaction.date), 'dd/MM/yyyy', { locale: fr })}</td>
              <td>{transaction.description}</td>
              <td>
                <AmountDisplay 
                  amount={transaction.amount} 
                  type={transaction.type} 
                />
              </td>
              <td>{transaction.type === 'income' ? 'Revenu' : 'Dépense'}</td>
              <td>{transaction.category}</td>
              <td className="transaction-actions">
                <button onClick={() => handleEdit(transaction)}>Modifier</button>
                <button className="delete" onClick={() => handleDelete(transaction._id)}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionList;