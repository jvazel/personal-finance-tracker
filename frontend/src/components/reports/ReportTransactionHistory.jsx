import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AmountDisplay from '../common/AmountDisplay';

const ReportTransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [selectedPeriod, setSelectedPeriod] = useState('1year');
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');

  // Définition des périodes disponibles
  const periods = [
    { value: '1month', label: '1 mois' },
    { value: '3months', label: '3 mois' },
    { value: '6months', label: '6 mois' },
    { value: '1year', label: '1 an' },
    { value: '3years', label: '3 ans' },
    { value: '10years', label: '10 ans' },
  ];

  // Fonction pour calculer la date de début en fonction de la période sélectionnée
  const calculateStartDate = (period) => {
    const now = new Date();
    const startDate = new Date(now);
    
    switch(period) {
      case '1month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case '3years':
        startDate.setFullYear(now.getFullYear() - 3);
        break;
      case '10years':
        startDate.setFullYear(now.getFullYear() - 10);
        break;
      default:
        startDate.setFullYear(now.getFullYear() - 1); // Par défaut: 1 an
    }
    
    return startDate;
  };

  useEffect(() => {
    const fetchReportTransactions = async () => {
      setLoading(true);
      try {
        const startDate = calculateStartDate(selectedPeriod);
        const endDate = new Date(); // Date actuelle
        
        // Formater les dates pour l'API (YYYY-MM-DD)
        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedEndDate = endDate.toISOString().split('T')[0];
        
        const response = await api.get('/transactions/reports', {
          params: {
            startDate: formattedStartDate,
            endDate: formattedEndDate
          }
        });
        
        setTransactions(response.data);
      } catch (err) {
        setError(err);
        console.error('Erreur lors du chargement des transactions du rapport:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportTransactions();
    // Réinitialiser la page courante à 1 quand la période change
    setCurrentPage(1);
  }, [selectedPeriod]); // Recharger les données quand la période change

  // Fonction pour gérer le changement de période
  const handlePeriodChange = (e) => {
    setSelectedPeriod(e.target.value);
  };

  // Fonction pour gérer le changement dans la barre de recherche
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Réinitialiser à la première page lors d'une recherche
  };

  // Filtrer les transactions en fonction du terme de recherche
  const filteredTransactions = React.useMemo(() => {
    if (!searchTerm.trim()) return transactions;
    
    return transactions.filter(transaction => {
      const searchTermLower = searchTerm.toLowerCase();
      const descriptionMatch = transaction.description.toLowerCase().includes(searchTermLower);
      const typeMatch = 
        (transaction.type === 'income' && 'revenu'.includes(searchTermLower)) || 
        (transaction.type === 'expense' && 'dépense'.includes(searchTermLower));
      const categoryMatch = transaction.category.toLowerCase().includes(searchTermLower);
      
      return descriptionMatch || typeMatch || categoryMatch;
    });
  }, [transactions, searchTerm]);

  // Sort transactions based on current sortConfig
  const sortedTransactions = React.useMemo(() => {
    let sortableTransactions = [...filteredTransactions];
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
  }, [filteredTransactions, sortConfig]);

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

  // Calcul des transactions pour la page courante
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = sortedTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);

  // Calcul du nombre total de pages
  const totalPages = Math.ceil(sortedTransactions.length / transactionsPerPage);

  // Fonction pour changer de page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Fonction pour aller à la page suivante
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Fonction pour aller à la page précédente
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Fonction pour aller à la première page
  const firstPage = () => {
    setCurrentPage(1);
  };

  // Fonction pour aller à la dernière page
  const lastPage = () => {
    setCurrentPage(totalPages);
  };

  if (loading) return <div>Chargement de l'historique des transactions...</div>;
  if (error) return <div>Erreur lors du chargement de l'historique des transactions : {error.message}</div>;
  if (!transactions || transactions.length === 0) return <div>Aucune transaction à afficher pour la période sélectionnée.</div>;

  // Obtenir le nom de la période pour l'affichage
  const getPeriodLabel = () => {
    const period = periods.find(p => p.value === selectedPeriod);
    return period ? period.label : '1 an';
  };

  return (
    <div>
      <h2>Rapport d'historique des transactions</h2>
      
      <div className="report-controls">
        {/* Filtre de période */}
        <div className="period-filter">
          <label htmlFor="period-select">Période : </label>
          <select 
            id="period-select" 
            value={selectedPeriod} 
            onChange={handlePeriodChange}
            className="period-select"
          >
            {periods.map(period => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Barre de recherche */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Rechercher par description, type ou catégorie..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search" 
              onClick={() => setSearchTerm('')}
              title="Effacer la recherche"
            >
              ×
            </button>
          )}
        </div>
      </div>
      
      {/* Séparateur horizontal */}
      <hr className="report-divider" />
      
      {sortedTransactions.length === 0 ? (
        <div>Aucune transaction ne correspond à votre recherche.</div>
      ) : (
        <>
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
              {currentTransactions.map(transaction => (
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
        </>
      )}
    </div>
  );
};

export default ReportTransactionHistory;