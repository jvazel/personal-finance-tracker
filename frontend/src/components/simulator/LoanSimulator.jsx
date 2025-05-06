import React, { useState } from 'react';
import { calculateLoan } from '../../api/simulator';
import { Line } from 'react-chartjs-2';

const LoanSimulator = () => {
  const [formData, setFormData] = useState({
    principal: 100000,
    interestRate: 3.5,
    termYears: 20,
    startDate: new Date().toISOString().split('T')[0]
  });
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const data = await calculateLoan(formData);
      setResults(data);
    } catch (err) {
      setError('Erreur lors du calcul du prêt. Veuillez réessayer.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Préparation des données pour le graphique
  const prepareChartData = () => {
    if (!results) return null;
    
    const principalData = [];
    const interestData = [];
    const labels = [];
    
    results.amortizationSchedule.forEach((payment, index) => {
      if (index % 12 === 0) { // Afficher par année pour simplifier
        principalData.push(payment.principalPayment);
        interestData.push(payment.interestPayment);
        labels.push(`Année ${Math.floor(index / 12) + 1}`);
      }
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Principal',
          data: principalData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true
        },
        {
          label: 'Intérêts',
          data: interestData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true
        }
      ]
    };
  };
  
  // Options du graphique
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(75, 85, 99, 0.2)'
        },
        ticks: {
          color: '#e2e8f0'
        }
      },
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)'
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
      }
    }
  };
  
  // Formater les montants en euros
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };
  
  return (
    <div className="loan-simulator">
      <div className="simulator-form">
        <h2 className="simulator-form-title">Simulateur de Prêt</h2>
        <form onSubmit={handleSubmit}>
          <div className="simulator-form-row">
            <div className="simulator-form-group">
              <label htmlFor="principal">Montant du prêt (€)</label>
              <input
                type="number"
                id="principal"
                name="principal"
                value={formData.principal}
                onChange={handleChange}
                min="1000"
                step="1000"
                required
              />
            </div>
            
            <div className="simulator-form-group">
              <label htmlFor="interestRate">Taux d'intérêt annuel (%)</label>
              <input
                type="number"
                id="interestRate"
                name="interestRate"
                value={formData.interestRate}
                onChange={handleChange}
                min="0.1"
                step="0.1"
                required
              />
            </div>
          </div>
          
          <div className="simulator-form-row">
            <div className="simulator-form-group">
              <label htmlFor="termYears">Durée (années)</label>
              <input
                type="number"
                id="termYears"
                name="termYears"
                value={formData.termYears}
                onChange={handleChange}
                min="1"
                max="40"
                required
              />
            </div>
            
            <div className="simulator-form-group">
              <label htmlFor="startDate">Date de début</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <button type="submit" className="simulator-button" disabled={loading}>
            {loading ? 'Calcul en cours...' : 'Calculer'}
          </button>
        </form>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {results && (
        <div className="simulator-results">
          <h2 className="simulator-results-title">Résultats</h2>
          
          <div className="simulator-results-summary">
            <div className="simulator-result-card">
              <h3>Mensualité</h3>
              <p className="simulator-result-value">{formatCurrency(results.monthlyPayment)}</p>
            </div>
            
            <div className="simulator-result-card">
              <h3>Coût total du prêt</h3>
              <p className="simulator-result-value">{formatCurrency(results.totalCost)}</p>
            </div>
            
            <div className="simulator-result-card">
              <h3>Total des intérêts</h3>
              <p className="simulator-result-value">{formatCurrency(results.totalInterest)}</p>
            </div>
            
            <div className="simulator-result-card">
              <h3>Nombre de paiements</h3>
              <p className="simulator-result-value">{results.totalPayments}</p>
            </div>
          </div>
          
          <div className="simulator-chart-container">
            <Line data={prepareChartData()} options={chartOptions} />
          </div>
          
          <div className="amortization-table-container">
            <h3>Tableau d'amortissement</h3>
            <table className="amortization-table">
              <thead>
                <tr>
                  <th>Paiement</th>
                  <th>Montant</th>
                  <th>Principal</th>
                  <th>Intérêts</th>
                  <th>Solde restant</th>
                </tr>
              </thead>
              <tbody>
                {results.amortizationSchedule.map((payment, index) => (
                  // Afficher seulement quelques lignes pour ne pas surcharger
                  index % 12 === 0 && (
                    <tr key={payment.paymentNumber}>
                      <td>{payment.paymentNumber}</td>
                      <td>{formatCurrency(payment.paymentAmount)}</td>
                      <td>{formatCurrency(payment.principalPayment)}</td>
                      <td>{formatCurrency(payment.interestPayment)}</td>
                      <td>{formatCurrency(payment.remainingPrincipal)}</td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanSimulator;