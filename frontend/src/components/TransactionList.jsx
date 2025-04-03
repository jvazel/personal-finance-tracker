import React, { useContext, useState, useMemo } from 'react';
import { TransactionContext } from '../contexts/TransactionContext';
import TransactionForm from './TransactionForm';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Modal from './Modal';
import AmountDisplay from './AmountDisplay';
import { FaEdit, FaTrash } from 'react-icons/fa'; // Add this import at the top with other imports

const TransactionList = ({ selectedMonth }) => {
  const { transactions, loading, error, deleteTransaction, refreshTransactions } = useContext(TransactionContext);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

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

  // Fonction pour trier les transactions
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Obtenir l'indicateur de direction du tri
  const getSortDirectionIndicator = (key) => {
    if (sortConfig.key !== key) return '';
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  // Filtrer les transactions en fonction du terme de recherche
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    return transactions.filter(transaction => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        transaction.description.toLowerCase().includes(searchTermLower) ||
        transaction.category.toLowerCase().includes(searchTermLower)
      );
    });
  }, [transactions, searchTerm]);

  // Trier les transactions en fonction de la configuration de tri actuelle
  const sortedTransactions = useMemo(() => {
    if (!filteredTransactions) return [];
    
    let sortableTransactions = [...filteredTransactions];
    if (sortConfig.key) {
      sortableTransactions.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Traitement spécial pour les dates
        if (sortConfig.key === 'date') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }
        
        // Traitement pour les valeurs numériques
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
  }, [filteredTransactions, sortConfig]);

  // Calcul des transactions pour la page courante
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = sortedTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);

  // Calcul du nombre total de pages
  const totalPages = Math.ceil(sortedTransactions.length / transactionsPerPage);

  // Fonctions de pagination
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  const firstPage = () => {
    setCurrentPage(1);
  };
  const lastPage = () => {
    setCurrentPage(totalPages);
  };

  // Réinitialiser la page courante lorsque le terme de recherche change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

      {/* Barre de recherche */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Rechercher par description ou catégorie..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button 
            className="search-clear-button"
            onClick={() => setSearchTerm('')}
          >
            ×
          </button>
        )}
      </div>

      {/* Separator between search bar and transaction table */}
      <div className="search-table-separator"></div>

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
            <th></th>
          </tr>
        </thead>
        <tbody>
          {currentTransactions.length > 0 ? (
            currentTransactions.map(transaction => (
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
                  <button 
                    className="edit-button" 
                    onClick={() => handleEdit(transaction)}
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="delete-button" 
                    onClick={() => handleDelete(transaction._id)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center' }}>
                Aucune transaction ne correspond à votre recherche
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={firstPage} 
            disabled={currentPage === 1}
            className="pagination-button"
          >
            &laquo; Première
          </button>
          <button 
            onClick={prevPage} 
            disabled={currentPage === 1}
            className="pagination-button"
          >
            &lt; Précédente
          </button>
          <span className="pagination-info">
            Page {currentPage} sur {totalPages}
          </span>
          <button 
            onClick={nextPage} 
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Suivante &gt;
          </button>
          <button 
            onClick={lastPage} 
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Dernière &raquo;
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionList;