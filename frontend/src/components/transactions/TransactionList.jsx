import React, { useContext, useState, useMemo } from 'react';
import { TransactionContext } from '../../contexts/TransactionContext';
import TransactionForm from './TransactionForm';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Modal from '../common/Modal';
import AmountDisplay from '../common/AmountDisplay';
import { FaEdit, FaTrash, FaStickyNote, FaBullseye } from 'react-icons/fa';
import NoteModal from './NoteModal';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api'; // Ajout de l'import manquant

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

const TransactionList = ({ selectedMonth }) => {
  const { transactions, loading, error, deleteTransaction, refreshTransactions } = useContext(TransactionContext);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [loadingSavingsGoals, setLoadingSavingsGoals] = useState(true);

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

  const handleShowNote = (transaction) => {
    setSelectedNote(transaction);
    setShowNoteModal(true);
  };

  const handleCloseNoteModal = () => {
    setShowNoteModal(false);
    setSelectedNote(null);
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
      const categoryName = transaction.category && typeof transaction.category === 'object'
        ? transaction.category.name
        : (transaction.categoryName || transaction.category || '');

      return (
        transaction.description.toLowerCase().includes(searchTermLower) ||
        categoryName.toLowerCase().includes(searchTermLower)
      );
    });
  }, [transactions, searchTerm]);

  // Trier les transactions en fonction de la configuration de tri actuelle
  const sortedTransactions = useMemo(() => {
    if (!filteredTransactions) return [];

    let sortableTransactions = [...filteredTransactions];
    if (sortConfig.key) {
      sortableTransactions.sort((a, b) => {
        // Special handling for category which might be an object
        if (sortConfig.key === 'category') {
          const aCategory = a.category && typeof a.category === 'object'
            ? a.category.name
            : (a.categoryName || a.category || '');

          const bCategory = b.category && typeof b.category === 'object'
            ? b.category.name
            : (b.categoryName || b.category || '');

          if (aCategory < bCategory) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (aCategory > bCategory) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        }

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

  // Charger les objectifs d'épargne pour afficher leurs noms
  React.useEffect(() => {
    const fetchSavingsGoals = async () => {
      try {
        setLoadingSavingsGoals(true);
        const response = await api.get('api/goals/savings-goals');
        
        // Assurer que nous définissons un tableau pour savingsGoals
        const goalsData = Array.isArray(response.data) ? response.data :
          (response.data && Array.isArray(response.data.data) ? response.data.data : []);
        
        setSavingsGoals(goalsData);
      } catch (error) {
        console.error('Erreur lors du chargement des objectifs d\'épargne:', error);
        setSavingsGoals([]); // Définir un tableau vide en cas d'erreur
      } finally {
        setLoadingSavingsGoals(false);
      }
    };

    fetchSavingsGoals();
  }, []);

  // Fonction pour obtenir le nom de l'objectif d'épargne à partir de l'ID
  const getGoalNameById = (goalId) => {
    if (!goalId || !savingsGoals || savingsGoals.length === 0) return null;
    
    const goal = savingsGoals.find(goal => goal._id === goalId);
    return goal ? goal.title : null;
  };

  // Rendu du composant
  return (
    <motion.div 
      className="transaction-list-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="transaction-list-header">
        <div className="search-container">
          <input
            type="text"
            placeholder="Rechercher une transaction..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-message">Chargement des transactions...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : transactions.length === 0 ? (
        <div className="no-transactions-message">
          Aucune transaction pour ce mois. Ajoutez-en une !
        </div>
      ) : (
        <>
          <div className="transaction-table-container">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th onClick={() => requestSort('date')}>
                    Date{getSortDirectionIndicator('date')}
                  </th>
                  <th onClick={() => requestSort('description')}>
                    Description{getSortDirectionIndicator('description')}
                  </th>
                  <th onClick={() => requestSort('category')}>
                    Catégorie{getSortDirectionIndicator('category')}
                  </th>
                  <th onClick={() => requestSort('amount')}>
                    Montant{getSortDirectionIndicator('amount')}
                  </th>
                  <th>Objectif</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {currentTransactions.map((transaction) => (
                    <motion.tr
                      key={transaction._id}
                      variants={itemVariants}
                      exit={{ opacity: 0, y: -10 }}
                      className={transaction.type === 'income' ? 'income-row' : 'expense-row'}
                    >
                      <td>{format(new Date(transaction.date), 'dd/MM/yyyy', { locale: fr })}</td>
                      <td>{transaction.description}</td>
                      <td className="category-cell">
                        {transaction.category && typeof transaction.category === 'object' ? (
                          <>
                            {transaction.category.color && (
                              <span
                                className="category-color-indicator"
                                style={{ backgroundColor: transaction.category.color }}
                              ></span>
                            )}
                            {transaction.category.name}
                          </>
                        ) : (
                          transaction.categoryName || 'Non catégorisé'
                        )}
                      </td>
                      <td>
                        <AmountDisplay amount={transaction.amount} type={transaction.type} />
                      </td>
                      <td>
                        {transaction.goalId && (
                          <div className="goal-indicator">
                            <FaBullseye className="goal-icon" />
                            <span className="goal-name">{getGoalNameById(transaction.goalId) || 'Objectif'}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="transaction-actions">
                          <button
                            className="action-button edit"
                            onClick={() => handleEdit(transaction)}
                            title="Modifier"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="action-button delete"
                            onClick={() => handleDelete(transaction._id)}
                            title="Supprimer"
                          >
                            <FaTrash />
                          </button>
                          {transaction.note && (
                            <button
                              className="action-button note"
                              onClick={() => handleShowNote(transaction)}
                              title="Voir la note"
                            >
                              <FaStickyNote />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-button"
                onClick={firstPage}
                disabled={currentPage === 1}
              >
                &laquo; Première
              </button>
              <button
                className="pagination-button"
                onClick={prevPage}
                disabled={currentPage === 1}
              >
                &lsaquo; Précédent
              </button>
              <span className="pagination-info">
                Page {currentPage} sur {totalPages}
              </span>
              <button
                className="pagination-button"
                onClick={nextPage}
                disabled={currentPage === totalPages}
              >
                Suivant &rsaquo;
              </button>
              <button
                className="pagination-button"
                onClick={lastPage}
                disabled={currentPage === totalPages}
              >
                Dernière &raquo;
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal pour éditer une transaction */}
      <Modal
        isOpen={showEditForm}
        onClose={handleCloseForm}
        title="Modifier la transaction"
      >
        {transactionToEdit && (
          <TransactionForm
            transactionToEdit={transactionToEdit}
            onClose={handleCloseForm}
            selectedMonth={selectedMonth}
          />
        )}
      </Modal>

      {/* Modal pour afficher les notes */}
      <NoteModal
        isOpen={showNoteModal}
        onClose={handleCloseNoteModal}
        transaction={selectedNote}
      />
    </motion.div>
  );
};

export default TransactionList;