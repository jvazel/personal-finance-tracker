import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AmountDisplay from '../common/AmountDisplay';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const ReportCashFlowPrediction = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedMonths, setExpandedMonths] = useState({});
  const [months, setMonths] = useState(3); // Default to 3 months

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        setLoading(true);
        // Fix the URL by removing the duplicate 'api/'
        const response = await api.get(`/predictions/cash-flow?months=${months}`);
        setPredictions(response.data);
        
        // Initialize expanded state for all months
        const initialExpandedState = {};
        response.data.forEach((prediction, index) => {
          initialExpandedState[index] = index === 0; // Only expand the first month by default
        });
        setExpandedMonths(initialExpandedState);
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des prédictions:', err);
        setError('Erreur lors du chargement des prédictions de flux de trésorerie');
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [months]);

  const toggleMonth = (index) => {
    setExpandedMonths(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleMonthsChange = (e) => {
    setMonths(parseInt(e.target.value, 10));
  };

  if (loading) {
    return <div className="loading-message">Chargement des prédictions...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!predictions || predictions.length === 0) {
    return <div className="no-data-message">Aucune prédiction disponible</div>;
  }

  return (
    <div className="report-section">
      <h2>Prédictions de Flux de Trésorerie</h2>
      
      <div className="prediction-controls">
        <label htmlFor="months-select">Nombre de mois à prédire:</label>
        <select 
          id="months-select" 
          value={months} 
          onChange={handleMonthsChange}
          className="months-select"
        >
          <option value="1">1 mois</option>
          <option value="3">3 mois</option>
          <option value="6">6 mois</option>
          <option value="12">12 mois</option>
        </select>
      </div>
      
      <div className="prediction-summary">
        <div className="prediction-cards">
          {predictions.map((prediction, index) => (
            <div key={index} className="prediction-month-card">
              <div 
                className="prediction-month-header" 
                onClick={() => toggleMonth(index)}
              >
                <h3>{prediction.month}</h3>
                <div className="prediction-month-balance">
                  <span>Solde prévu: </span>
                  <AmountDisplay 
                    amount={prediction.balance} 
                    type={prediction.balance >= 0 ? 'income' : 'expense'} 
                  />
                </div>
                <button className="expand-button">
                  {expandedMonths[index] ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>
              
              {expandedMonths[index] && (
                <div className="prediction-month-details">
                  <h4>Transactions prévues</h4>
                  {prediction.transactions.length > 0 ? (
                    <table className="transaction-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Catégorie</th>
                          <th>Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prediction.transactions.map((transaction, tIndex) => (
                          <tr key={tIndex} className={transaction.predicted ? 'predicted-row' : ''}>
                            <td>{format(new Date(transaction.date), 'dd/MM/yyyy', { locale: fr })}</td>
                            <td>{transaction.description}</td>
                            <td>{transaction.categoryName || 'Non catégorisé'}</td>
                            <td>
                              <AmountDisplay 
                                amount={transaction.amount} 
                                type={transaction.amount >= 0 ? 'income' : 'expense'} 
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="no-transactions-message">Aucune transaction prévue pour ce mois</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="prediction-disclaimer">
        <p>
          <strong>Note:</strong> Ces prédictions sont basées sur vos transactions récurrentes passées. 
          Les montants réels peuvent varier. Les prédictions deviennent plus précises avec plus de données historiques.
        </p>
      </div>
    </div>
  );
};

export default ReportCashFlowPrediction;