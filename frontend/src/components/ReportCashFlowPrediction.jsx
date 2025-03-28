import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { format, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TransactionContext } from '../contexts/TransactionContext';
import { Line } from 'recharts';
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Area } from 'recharts';

const ReportCashFlowPrediction = () => {
  const [predictionData, setPredictionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [predictionPeriod, setPredictionPeriod] = useState('3'); // Default: 3 months
  const [overdraftRisk, setOverdraftRisk] = useState(null);
  const { refreshTransactions } = useContext(TransactionContext);

  useEffect(() => {
    fetchPredictionData(predictionPeriod);
  }, [predictionPeriod]);

  const fetchPredictionData = async (months) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/predictions/cash-flow?months=${months}`);
      setPredictionData(response.data.predictions);
      setOverdraftRisk(response.data.overdraftRisk);
    } catch (err) {
      console.error('Error fetching prediction data:', err);
      setError('Impossible de charger les prédictions. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (e) => {
    setPredictionPeriod(e.target.value);
  };

  // Format data for chart
  const chartData = predictionData.map(item => ({
    date: format(new Date(item.date), 'dd MMM', { locale: fr }),
    solde: item.balance,
    revenus: item.income,
    dépenses: item.expenses
  }));

  // Calculate min and max values for Y axis
  const allValues = chartData.flatMap(item => [item.solde, item.revenus, item.dépenses]);
  const minValue = Math.min(...allValues) * 0.9;
  const maxValue = Math.max(...allValues) * 1.1;

  return (
    <div className="report-section">
      <h2>Prédiction de Flux de Trésorerie</h2>
      
      <div className="report-filters">
        <div className="report-filter-group">
          <label htmlFor="predictionPeriod">Période de prédiction:</label>
          <select 
            id="predictionPeriod" 
            value={predictionPeriod} 
            onChange={handlePeriodChange}
            className="form-select"
          >
            <option value="1">1 mois</option>
            <option value="3">3 mois</option>
            <option value="6">6 mois</option>
            <option value="12">12 mois</option>
          </select>
        </div>
      </div>

      {overdraftRisk && (
        <div className="overdraft-alert">
          <div className="alert alert-danger">
            <strong>Alerte de découvert!</strong> {overdraftRisk.message}
            <p>Date prévue: {format(new Date(overdraftRisk.date), 'dd MMMM yyyy', { locale: fr })}</p>
            <p>Solde prévu: {overdraftRisk.balance.toFixed(2)} €</p>
          </div>
        </div>
      )}

      <div className="report-summary-cards">
        <div className="report-card">
          <h3>Solde prévu (fin de période)</h3>
          <p>{loading ? '...' : `${predictionData[predictionData.length - 1]?.balance.toFixed(2)} €`}</p>
        </div>
        <div className="report-card income">
          <h3>Revenus prévus (total)</h3>
          <p>{loading ? '...' : `${predictionData.reduce((sum, item) => sum + item.income, 0).toFixed(2)} €`}</p>
        </div>
        <div className="report-card expense">
          <h3>Dépenses prévues (total)</h3>
          <p>{loading ? '...' : `${predictionData.reduce((sum, item) => sum + item.expenses, 0).toFixed(2)} €`}</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-indicator">Chargement des prédictions...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="report-chart-container">
          <h3 className="report-chart-title">Évolution prévue du solde</h3>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#e2e8f0' }}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis 
                domain={[minValue, maxValue]} 
                tick={{ fill: '#e2e8f0' }}
                tickFormatter={(value) => `${value.toFixed(0)} €`}
              />
              <Tooltip 
                formatter={(value) => [`${value.toFixed(2)} €`, undefined]}
                contentStyle={{ backgroundColor: '#353549', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend wrapperStyle={{ color: '#e2e8f0' }} />
              <Line 
                type="monotone" 
                dataKey="solde" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#3b82f6' }}
                activeDot={{ r: 6 }}
              />
              <Area 
                type="monotone" 
                dataKey="revenus" 
                fill="rgba(16, 185, 129, 0.2)" 
                stroke="#10b981" 
                className="recharts-area-income"
              />
              <Area 
                type="monotone" 
                dataKey="dépenses" 
                fill="rgba(239, 68, 68, 0.2)" 
                stroke="#ef4444"
                className="recharts-area-expense"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="prediction-details">
        <h3>Transactions récurrentes prévues</h3>
        <table className="transaction-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Catégorie</th>
              <th>Montant</th>
              <th>Type</th>
              <th>Confiance</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="loading-cell">Chargement...</td>
              </tr>
            ) : predictionData.flatMap(day => day.transactions).length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-cell">Aucune transaction récurrente prévue</td>
              </tr>
            ) : (
              predictionData.flatMap(day => 
                day.transactions.map((transaction, index) => (
                  <tr key={`${day.date}-${index}`}>
                    <td>{format(new Date(day.date), 'dd/MM/yyyy')}</td>
                    <td>{transaction.description}</td>
                    <td>{transaction.category}</td>
                    <td className={transaction.amount > 0 ? 'amount-income' : 'amount-expense'}>
                      {transaction.amount.toFixed(2)} €
                    </td>
                    <td>{transaction.amount > 0 ? 'Revenu' : 'Dépense'}</td>
                    <td>
                      <div className="confidence-bar">
                        <div 
                          className="confidence-level" 
                          style={{ width: `${transaction.confidence}%`, backgroundColor: getConfidenceColor(transaction.confidence) }}
                        ></div>
                      </div>
                      {transaction.confidence}%
                    </td>
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Fonction utilitaire pour déterminer la couleur en fonction du niveau de confiance
const getConfidenceColor = (confidence) => {
  if (confidence >= 80) return '#10b981'; // Vert pour haute confiance
  if (confidence >= 50) return '#f59e0b'; // Orange pour confiance moyenne
  return '#ef4444'; // Rouge pour faible confiance
};

export default ReportCashFlowPrediction;