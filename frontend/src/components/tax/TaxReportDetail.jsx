import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AmountDisplay from '../common/AmountDisplay';

const TaxReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(20);

  useEffect(() => {
    const fetchReportDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/tax/reports/${id}`);
        setReport(response.data);
        
        // Récupérer les transactions associées à ce rapport
        if (response.data && response.data.year) {
          const startDate = `${response.data.year}-01-01`;
          // Utiliser la date de génération du rapport comme date de fin
          // ou la fin de l'année si la date de génération est ultérieure
          const generatedDate = new Date(response.data.generatedAt);
          const endOfYear = new Date(`${response.data.year}-12-31`);
          
          // Choisir la date la plus ancienne entre la date de génération et la fin de l'année
          const endDate = generatedDate < endOfYear 
            ? format(generatedDate, 'yyyy-MM-dd')
            : `${response.data.year}-12-31`;
          
          const transactionsResponse = await api.get(`/api/transactions`, {
            params: { startDate, endDate }
          });
          setTransactions(transactionsResponse.data);
        }
        
        setError(null);
      } catch (err) {
        console.error('Erreur lors de la récupération des détails du rapport fiscal:', err);
        setError('Impossible de récupérer les détails du rapport fiscal. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetails();
  }, [id]);

  // Pagination
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non disponible';
    const date = new Date(dateString);
    return format(date, 'dd MMMM yyyy à HH:mm', { locale: fr });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      generated: 'status-generated',
      submitted: 'status-submitted',
      accepted: 'status-accepted',
      rejected: 'status-rejected'
    };
    
    const statusLabels = {
      generated: 'Généré',
      submitted: 'Soumis',
      accepted: 'Accepté',
      rejected: 'Rejeté'
    };
    
    return (
      <span className={`status-badge ${statusClasses[status] || ''}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <LoadingSpinner />
        <p>Chargement des détails du rapport fiscal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Erreur</h2>
        <p>{error}</p>
        <button className="tax-action-button" onClick={handleGoBack}>Retour</button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="no-data-container">
        <h2>Rapport non trouvé</h2>
        <p>Le rapport fiscal demandé n'existe pas ou a été supprimé.</p>
        <button className="tax-action-button" onClick={handleGoBack}>Retour</button>
      </div>
    );
  }

  // Modifions la façon dont nous affichons les montants dans le tableau
  return (
    <div className="tax-report-detail-container">
      <div className="tax-report-detail-header">
        <h2>Rapport fiscal {report.year}</h2>
        {getStatusBadge(report.status)}
        <button 
          className="tax-back-button"
          onClick={handleGoBack}
        >
          <span className="back-icon">←</span> Retour
        </button>
      </div>

      <div className="tax-report-detail-content">
        <div className="tax-report-summary">
          <div className="tax-report-summary-item">
            <h3>Revenus imposables</h3>
            <p className="amount">{formatCurrency(report.taxableIncome)}</p>
          </div>
          <div className="tax-report-summary-item">
            <h3>Déductions fiscales</h3>
            <p className="amount">{formatCurrency(report.taxDeductions)}</p>
          </div>
          <div className="tax-report-summary-item">
            <h3>Revenu net imposable</h3>
            <p className="amount">{formatCurrency(report.netTaxableIncome)}</p>
          </div>
        </div>

        <div className="tax-report-dates">
          <div className="tax-report-date-item">
            <h4>Généré le</h4>
            <p>{formatDate(report.generatedAt)}</p>
          </div>
          {report.submittedAt && (
            <div className="tax-report-date-item">
              <h4>Soumis le</h4>
              <p>{formatDate(report.submittedAt)}</p>
            </div>
          )}
        </div>

        {report.notes && (
          <div className="tax-report-notes">
            <h4>Notes</h4>
            <p>{report.notes}</p>
          </div>
        )}
        
        {/* Tableau des transactions */}
        <div className="tax-report-transactions">
          <h3>Transactions de l'année {report.year}</h3>
          
          {transactions.length === 0 ? (
            <p className="no-transactions">Aucune transaction trouvée pour cette période.</p>
          ) : (
            <>
              <div className="tax-transactions-table-container">
                <table className="tax-transactions-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Catégorie</th>
                      <th>Type</th>
                      <th>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTransactions.map(transaction => (
                      <tr key={transaction._id}>
                        <td>{format(new Date(transaction.date), 'dd/MM/yyyy', { locale: fr })}</td>
                        <td>{transaction.description}</td>
                        <td>{transaction.category ? transaction.category.name : 'Non catégorisé'}</td>
                        <td>{transaction.type === 'income' ? 'Revenu' : 'Dépense'}</td>
                        <td className={transaction.type === 'income' ? 'income-amount' : 'expense-amount'}>
                          <span className={transaction.type === 'income' ? 'amount-income' : 'amount-expense'}>
                            {transaction.type === 'income' 
                              ? formatCurrency(transaction.amount)
                              : formatCurrency(-transaction.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    className="pagination-button" 
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Précédent
                  </button>
                  <span className="pagination-info">
                    Page {currentPage} sur {totalPages}
                  </span>
                  <button 
                    className="pagination-button" 
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaxReportDetail;