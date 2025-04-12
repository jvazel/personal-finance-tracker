import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const TaxReportsList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/tax/reports');
      setReports(response.data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la récupération des rapports fiscaux:', err);
      setError('Impossible de récupérer les rapports fiscaux. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  // Ajout des fonctions manquantes
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const viewReport = (reportId) => {
    // Rediriger vers la page de détail du rapport
    window.location.href = `/tax/reports/${reportId}`;
  };

  const submitReport = async (reportId) => {
    try {
      await api.put(`/api/tax/reports/${reportId}/submit`);
      fetchReports(); // Rafraîchir la liste après soumission
    } catch (err) {
      console.error('Erreur lors de la soumission du rapport fiscal:', err);
      setError('Impossible de soumettre le rapport fiscal. Veuillez réessayer plus tard.');
    }
  };

  const deleteReport = async (reportId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rapport fiscal ? Cette action est irréversible.')) {
      try {
        await api.delete(`/api/tax/reports/${reportId}`);
        fetchReports(); // Rafraîchir la liste après suppression
      } catch (err) {
        console.error('Erreur lors de la suppression du rapport fiscal:', err);
        setError('Impossible de supprimer le rapport fiscal. Veuillez réessayer plus tard.');
      }
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'generated': return 'Généré';
      case 'submitted': return 'Soumis';
      case 'accepted': return 'Accepté';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  };

  const getStatusClass = (status) => {
    return `status-${status}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des rapports fiscaux...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (reports.length === 0) {
    return (
      <div className="no-reports-message">
        <p>Aucun rapport fiscal n'a été généré.</p>
        <p>Utilisez le bouton "Générer un rapport fiscal" pour créer votre premier rapport.</p>
      </div>
    );
  }

  // Assurez-vous que ces fonctions sont utilisées dans le rendu du composant
  return (
    <div className="tax-reports-list">
      <h3>Rapports fiscaux générés</h3>
      <div className="tax-reports-table-container">
        <table className="tax-reports-table">
          <thead>
            <tr>
              <th>Année</th>
              <th>Statut</th>
              <th>Revenu imposable</th>
              <th>Déductions</th>
              <th>Date de génération</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.length > 0 ? (
              reports.map(report => (
                <tr key={report._id}>
                  <td>{report.year}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(report.status)}`}>
                      {getStatusLabel(report.status)}
                    </span>
                  </td>
                  <td>{formatCurrency(report.taxableIncome)}</td>
                  <td>{formatCurrency(report.taxDeductions)}</td>
                  <td>{formatDate(report.createdAt)}</td>
                  <td>
                    <div className="report-actions">
                      <button 
                        className="report-action-button view"
                        onClick={() => viewReport(report._id)}
                      >
                        Voir
                      </button>
                      {report.status === 'generated' && (
                        <button 
                          className="report-action-button submit"
                          onClick={() => submitReport(report._id)}
                        >
                          Soumettre
                        </button>
                      )}
                      <button 
                        className="report-action-button delete"
                        onClick={() => deleteReport(report._id)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">
                  <div className="no-reports-message">
                    <p>Aucun rapport fiscal n'a été généré.</p>
                    <p>Utilisez le bouton "Générer un rapport" dans le tableau de bord fiscal pour créer un rapport.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaxReportsList;