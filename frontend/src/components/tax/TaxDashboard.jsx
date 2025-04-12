import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import TaxReportsList from './TaxReportsList';
import TaxCategorySettings from './TaxCategorySettings';
import '../../styles/tax.css';

const TaxDashboard = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchTaxData(currentYear);
  }, [currentYear]);

  const fetchTaxData = async (year) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/tax/data/${year}`);
      setTaxData(response.data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la récupération des données fiscales:', err);
      setError('Impossible de récupérer les données fiscales. Veuillez réessayer plus tard.');
      setTaxData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (e) => {
    setCurrentYear(parseInt(e.target.value));
  };

  const generateTaxReport = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/api/tax/report/${currentYear}`);
      alert(`Rapport fiscal pour ${currentYear} généré avec succès!`);
      setActiveTab('reports');
    } catch (err) {
      console.error('Erreur lors de la génération du rapport fiscal:', err);
      alert('Erreur lors de la génération du rapport fiscal. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const exportTaxData = async (format) => {
    try {
      window.open(`${api.defaults.baseURL}/api/tax/export/${currentYear}/${format}`, '_blank');
    } catch (err) {
      console.error('Erreur lors de l\'exportation des données fiscales:', err);
      alert('Erreur lors de l\'exportation des données fiscales. Veuillez réessayer.');
    }
  };

  return (
    <div className="tax-dashboard-container">
      <div className="tax-dashboard-header">
        <h1>Services Fiscaux</h1>
        <p>Gérez vos données fiscales et préparez vos déclarations d'impôts</p>
      </div>

      <div className="tax-dashboard-controls">
        <div className="year-selector">
          <label htmlFor="taxYear">Année fiscale:</label>
          <select 
            id="taxYear" 
            value={currentYear} 
            onChange={handleYearChange}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="tax-actions">
          <button 
            className="tax-action-button generate"
            onClick={generateTaxReport}
            disabled={loading}
          >
            Générer un rapport fiscal
          </button>
          <button 
            className="tax-action-button export"
            onClick={() => exportTaxData('csv')}
            disabled={loading}
          >
            Exporter en CSV
          </button>
        </div>
      </div>

      <div className="tax-dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Aperçu
        </button>
        <button 
          className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
        <button 
          className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Rapports
        </button>
        <button 
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Paramètres
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des données fiscales...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="tax-dashboard-content">
          {activeTab === 'overview' && taxData && (
            <div className="tax-overview">
              <div className="tax-summary-cards">
                <div className="tax-card">
                  <h3>Revenus imposables</h3>
                  <p className="tax-amount">{taxData.taxableIncome.toFixed(2)} €</p>
                </div>
                <div className="tax-card">
                  <h3>Déductions fiscales</h3>
                  <p className="tax-amount">{taxData.taxDeductions.toFixed(2)} €</p>
                </div>
                <div className="tax-card">
                  <h3>Revenu net imposable</h3>
                  <p className="tax-amount">{taxData.netTaxableIncome.toFixed(2)} €</p>
                </div>
                <div className="tax-card">
                  <h3>Dons déductibles</h3>
                  <p className="tax-amount">{taxData.charitableDonations.toFixed(2)} €</p>
                </div>
              </div>

              <div className="tax-info-section">
                <h3>Informations importantes</h3>
                <p>
                  Ces données sont basées sur vos transactions catégorisées. Pour une déclaration précise, 
                  assurez-vous que toutes vos transactions sont correctement catégorisées et que les 
                  propriétés fiscales des catégories sont bien configurées.
                </p>
                <p>
                  <Link to="/settings/categories" className="tax-link">
                    Configurer les catégories fiscales
                  </Link>
                </p>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && taxData && (
            <div className="tax-transactions">
              <h3>Transactions fiscales pour {currentYear}</h3>
              <div className="tax-transactions-filters">
                <button className="filter-button active">Toutes</button>
                <button className="filter-button">Revenus imposables</button>
                <button className="filter-button">Dépenses déductibles</button>
                <button className="filter-button">Dons</button>
              </div>
              <div className="tax-transactions-table-container">
                <table className="tax-transactions-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Montant</th>
                      <th>Catégorie</th>
                      <th>Type fiscal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxData.transactions.map(transaction => (
                      <tr key={transaction.id}>
                        <td>{new Date(transaction.date).toLocaleDateString()}</td>
                        <td>{transaction.description}</td>
                        <td className={transaction.type === 'income' ? 'income-amount' : 'expense-amount'}>
                          {transaction.type === 'income' ? '+' : '-'}{Math.abs(transaction.amount).toFixed(2)} €
                        </td>
                        <td>{transaction.category}</td>
                        <td>
                          {transaction.isTaxable && 'Imposable'}
                          {transaction.isTaxDeductible && 'Déductible'}
                          {!transaction.isTaxable && !transaction.isTaxDeductible && 'Non fiscal'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <TaxReportsList />
          )}

          {activeTab === 'settings' && (
            <TaxCategorySettings />
          )}
        </div>
      )}
    </div>
  );
};

export default TaxDashboard;