import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

const TaxTransactionsTable = ({ transactions }) => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(20);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // Request sort function
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort direction indicator
  const getSortDirectionIndicator = (key) => {
    if (sortConfig.key !== key) return <FaSort />;
    return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    if (!transactions) return [];
    
    let sortableTransactions = [...transactions];
    if (sortConfig.key) {
      sortableTransactions.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Special handling for dates
        if (sortConfig.key === 'date') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }
        
        // Handling for numeric values
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

  // Calculate pagination
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = sortedTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  
  // Calculate total pages
  const totalPages = Math.ceil(sortedTransactions.length / transactionsPerPage);

  // Pagination functions
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

  return (
    <div>
      <div className="tax-transactions-table-container">
        <table className="tax-transactions-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('date')}>
                Date {getSortDirectionIndicator('date')}
              </th>
              <th onClick={() => requestSort('description')}>
                Description {getSortDirectionIndicator('description')}
              </th>
              <th onClick={() => requestSort('amount')}>
                Montant {getSortDirectionIndicator('amount')}
              </th>
              <th onClick={() => requestSort('type')}>
                Type {getSortDirectionIndicator('type')}
              </th>
              <th onClick={() => requestSort('category')}>
                Catégorie {getSortDirectionIndicator('category')}
              </th>
              <th onClick={() => requestSort('taxable')}>
                Imposable {getSortDirectionIndicator('taxable')}
              </th>
              <th onClick={() => requestSort('taxDeductible')}>
                Déductible {getSortDirectionIndicator('taxDeductible')}
              </th>
            </tr>
          </thead>
          <tbody>
            {currentTransactions.length > 0 ? (
              currentTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{format(new Date(transaction.date), 'dd/MM/yyyy', { locale: fr })}</td>
                  <td>{transaction.description}</td>
                  <td className={transaction.type === 'income' ? 'income-amount' : 'expense-amount'}>
                    {transaction.type === 'income' 
                      ? `+${Math.abs(transaction.amount).toFixed(2)} €` 
                      : `-${Math.abs(transaction.amount).toFixed(2)} €`}
                  </td>
                  <td>{transaction.type === 'income' ? 'Revenu' : 'Dépense'}</td>
                  <td>{transaction.category}</td>
                  <td>{transaction.taxable ? 'Oui' : 'Non'}</td>
                  <td>{transaction.taxDeductible ? 'Oui' : 'Non'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="empty-cell">Aucune transaction trouvée</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {sortedTransactions.length > 0 && (
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
    </div>
  );
};

export default TaxTransactionsTable;