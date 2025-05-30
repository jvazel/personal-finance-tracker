import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { fr } from 'date-fns/locale';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';

// Enregistrer les composants Chart.js nécessaires
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  TimeScale
);

const RecurringExpenses = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseDetails, setExpenseDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const fetchRecurringExpenses = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await api.get('/recurring-expenses');
        
        setRecurringExpenses(response.data.recurringExpenses);
        setStatistics(response.data.statistics);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la récupération des dépenses récurrentes:', err);
        setError('Impossible de charger les dépenses récurrentes. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };

    fetchRecurringExpenses();
  }, []);

  const fetchExpenseDetails = async (payee) => {
    try {
      setDetailsLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get(`/recurring-expenses/${encodeURIComponent(payee)}`);
      
      setExpenseDetails(response.data);
      setDetailsLoading(false);
    } catch (err) {
      console.error('Erreur lors de la récupération des détails:', err);
      setError('Impossible de charger les détails. Veuillez réessayer plus tard.');
      setDetailsLoading(false);
    }
  };

  const handleExpenseSelect = (expense) => {
    setSelectedExpense(expense);
    fetchExpenseDetails(expense.payee);
  };

  // Fonction pour formater les dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Date non disponible';
    
    const date = new Date(dateString);
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return 'Date invalide';
    }
    
    // Formater la date en français
    return new Intl.DateTimeFormat('fr', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Fonction pour rendre la date du prochain paiement
  const renderNextPaymentDate = (expense) => {
    const nextDate = expense.nextPaymentDate;
    if (!nextDate || !(new Date(nextDate) instanceof Date) || isNaN(new Date(nextDate).getTime())) {
      return 'Date inconnue';
    }
    return formatDate(new Date(nextDate));
  };

  const getConfidenceColor = (score) => {
    if (score > 90) return '#10b981'; // Vert
    if (score > 75) return '#3b82f6'; // Bleu
    if (score > 60) return '#f59e0b'; // Orange
    return '#ef4444'; // Rouge
  };

  const renderAmountHistoryChart = () => {
    if (!expenseDetails || !expenseDetails.amountHistory || expenseDetails.amountHistory.length < 2) {
      return <p>Données insuffisantes pour afficher le graphique</p>;
    }

    const data = {
      datasets: [
        {
          label: 'Montant',
          data: expenseDetails.amountHistory.map(item => ({
            x: new Date(item.date),
            y: item.amount
          })),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          tension: 0.3
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'month',
            tooltipFormat: 'dd MMM yyyy',
            displayFormats: {
              month: 'MMM yyyy'
            }
          },
          adapters: {
            date: {
              locale: fr
            }
          },
          title: {
            display: true,
            text: 'Date',
            color: '#e2e8f0'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#e2e8f0'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Montant (€)',
            color: '#e2e8f0'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#e2e8f0'
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: '#e2e8f0'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Montant: ${context.parsed.y.toFixed(2)} €`;
            }
          }
        }
      }
    };

    return (
      <div style={{ width: '100%', height: '400px' }}>
        <Line data={data} options={options} />
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Chargement des dépenses récurrentes...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="recurring-expenses-container">
      <h2>Suivi des dépenses récurrentes</h2>
      <div className="bill-statistics">
        <div className="report-card">
          <h3>Dépenses récurrentes identifiées</h3>
          <p className="stat-value">{statistics.totalRecurringExpenses}</p>
        </div>
        <div className="report-card">
          <h3>Budget mensuel estimé</h3>
          <p className="stat-value">{statistics.estimatedMonthlyBudget} €</p>
        </div>
        <div className="report-card">
          <h3>Total mensuel</h3>
          <p className="stat-value">{statistics.totalMonthlyRecurring} €</p>
        </div>
        <div className="report-card">
          <h3>Total trimestriel</h3>
          <p className="stat-value">{statistics.totalQuarterlyRecurring} €</p>
        </div>
      </div>

      <div className="recurring-expenses-content">
        <div className="recurring-bills-list">
          <h3>Dépenses récurrentes détectées</h3>
          {recurringExpenses.length === 0 ? (
            <p className="empty-cell">Aucune dépense récurrente détectée</p>
          ) : (
            <div className="transaction-table-container">
              <table className="transaction-table">
                <thead>
                  <tr>
                    <th>Bénéficiaire</th>
                    <th>Montant moyen</th>
                    <th>Fréquence</th>
                    <th>Prochain paiement</th>
                    <th>Fiabilité</th>
                  </tr>
                </thead>
                <tbody>
                  {recurringExpenses.map((expense) => (
                    <tr 
                      key={expense.payee} 
                      onClick={() => handleExpenseSelect(expense)}
                      className={selectedExpense && selectedExpense.payee === expense.payee ? 'selected-row' : ''}
                    >
                      <td>{expense.payee}</td>
                      <td className="amount-expense">{expense.avgAmount.toFixed(2)} €</td>
                      <td>{expense.frequency}</td>
                      <td>{renderNextPaymentDate(expense)}</td>
                      <td>
                        <div className="confidence-bar">
                          <div 
                            className="confidence-level" 
                            style={{ 
                              width: `${expense.confidenceScore}%`,
                              backgroundColor: getConfidenceColor(expense.confidenceScore)
                            }}
                          ></div>
                        </div>
                        {expense.confidenceScore.toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedExpense && (
          <div className="recurring-bill-details">
            <h3>Détails: {selectedExpense.payee}</h3>
            
            {detailsLoading ? (
              <div className="loading-cell">Chargement des détails...</div>
            ) : expenseDetails ? (
              <>
                <div className="bill-statistics">
                  <div className="report-card">
                    <h3>Montant moyen</h3>
                    <p className="stat-value">{expenseDetails.statistics.avgAmount.toFixed(2)} €</p>
                  </div>
                  <div className="report-card">
                    <h3>Total dépensé</h3>
                    <p className="stat-value">{expenseDetails.statistics.totalSpent.toFixed(2)} €</p>
                  </div>
                  <div className="report-card">
                    <h3>Nombre de paiements</h3>
                    <p className="stat-value">{expenseDetails.statistics.count || 'Non disponible'}</p>
                  </div>
                  <div className="report-card">
                    <h3>Premier paiement</h3>
                    <p className="stat-value">
                      {expenseDetails.transactions && expenseDetails.transactions.length > 0 
                        ? formatDate(expenseDetails.transactions[expenseDetails.transactions.length - 1].date)
                        : 'Non disponible'}
                    </p>
                  </div>
                </div>

                <div className="report-section">
                  <h2>Suivi des dépenses récurrentes</h2>
                  
                  <div className="chart-container">
                    <h3>Historique des montants</h3>
                    {renderAmountHistoryChart()}
                  </div>

                  <h3>Historique des transactions</h3>
                  <div className="transaction-table-container">
                    <table className="transaction-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Montant</th>
                          <th>Catégorie</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenseDetails.transactions.map((transaction) => (
                          <tr key={transaction._id}>
                            <td>{formatDate(transaction.date)}</td>
                            <td className="amount-expense">{transaction.amount.toFixed(2)} €</td>
                            <td>
                              <div className="category-name">
                                <div 
                                  className="category-color" 
                                  style={{ 
                                    backgroundColor: typeof transaction.category === 'object' ? transaction.category.color : '#cccccc'
                                  }}
                                ></div>
                                {typeof transaction.category === 'object' ? transaction.category.name : transaction.category}
                              </div>
                            </td>
                            <td>{transaction.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="error-cell">Impossible de charger les détails</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecurringExpenses;