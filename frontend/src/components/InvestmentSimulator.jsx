import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

// Enregistrement des composants Chart.js nécessaires
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const InvestmentSimulator = () => {
  // États pour les paramètres de simulation
  const [initialInvestment, setInitialInvestment] = useState(1000);
  const [monthlyContribution, setMonthlyContribution] = useState(100);
  const [annualReturnRate, setAnnualReturnRate] = useState(7);
  const [investmentPeriod, setInvestmentPeriod] = useState(10); // en années
  const [simulationResults, setSimulationResults] = useState(null);
  const [comparisonType, setComparisonType] = useState('none'); // 'none', 'savings', 'inflation'
  const [inflationRate, setInflationRate] = useState(2);
  const [savingsRate, setSavingsRate] = useState(1);

  // Calcul des résultats de la simulation
  useEffect(() => {
    const calculateInvestmentGrowth = () => {
      const monthlyRate = annualReturnRate / 100 / 12;
      const totalMonths = investmentPeriod * 12;
      
      let investmentData = [];
      let comparisonData = [];
      let labels = [];
      
      let currentInvestment = initialInvestment;
      let comparisonValue = initialInvestment;
      
      // Calcul pour chaque mois
      for (let month = 0; month <= totalMonths; month++) {
        // Ajouter l'étiquette du mois
        labels.push(`Année ${Math.floor(month / 12)} Mois ${month % 12}`);
        
        // Ajouter la valeur actuelle à l'ensemble de données
        investmentData.push(currentInvestment);
        
        // Calculer la valeur de comparaison
        if (comparisonType === 'savings') {
          const monthlySavingsRate = savingsRate / 100 / 12;
          comparisonValue = month === 0 
            ? initialInvestment 
            : comparisonValue * (1 + monthlySavingsRate) + monthlyContribution;
        } else if (comparisonType === 'inflation') {
          const monthlyInflationRate = inflationRate / 100 / 12;
          comparisonValue = month === 0 
            ? initialInvestment 
            : comparisonValue * (1 + monthlyInflationRate) + monthlyContribution;
        } else {
          comparisonValue = initialInvestment + (monthlyContribution * month);
        }
        
        comparisonData.push(comparisonValue);
        
        // Mettre à jour pour le mois suivant (intérêts composés + contribution mensuelle)
        if (month < totalMonths) {
          currentInvestment = currentInvestment * (1 + monthlyRate) + monthlyContribution;
        }
      }
      
      return {
        labels,
        investmentData,
        comparisonData,
        finalValue: currentInvestment,
        totalContributions: initialInvestment + (monthlyContribution * totalMonths),
        totalInterest: currentInvestment - (initialInvestment + (monthlyContribution * totalMonths))
      };
    };
    
    setSimulationResults(calculateInvestmentGrowth());
  }, [initialInvestment, monthlyContribution, annualReturnRate, investmentPeriod, comparisonType, inflationRate, savingsRate]);

  // Configuration du graphique
  const chartData = {
    labels: simulationResults?.labels.filter((_, i) => i % 12 === 0) || [],
    datasets: [
      {
        label: 'Investissement',
        data: simulationResults?.investmentData.filter((_, i) => i % 12 === 0) || [],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true
      },
      ...(comparisonType !== 'none' ? [
        {
          label: comparisonType === 'savings' ? 'Compte d\'épargne' : 'Ajusté à l\'inflation',
          data: simulationResults?.comparisonData.filter((_, i) => i % 12 === 0) || [],
          borderColor: comparisonType === 'savings' ? '#10b981' : '#ef4444',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.4
        }
      ] : [])
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e2e8f0'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('fr-FR', { 
                style: 'currency', 
                currency: 'EUR' 
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        },
        ticks: {
          color: '#e2e8f0'
        }
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        },
        ticks: {
          color: '#e2e8f0',
          callback: function(value) {
            return new Intl.NumberFormat('fr-FR', { 
              style: 'currency', 
              currency: 'EUR',
              maximumFractionDigits: 0
            }).format(value);
          }
        }
      }
    }
  };

  // Formatage des valeurs monétaires
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(value);
  };

  return (
    <div className="investment-simulator-container">
      <div className="investment-simulator-header">
        <h1>Simulateur d'investissement</h1>
        <p>Visualisez la croissance potentielle de vos investissements au fil du temps</p>
      </div>

      <div className="investment-simulator-content">
        <div className="investment-simulator-controls">
          <div className="control-group">
            <label htmlFor="initialInvestment">Investissement initial</label>
            <div className="input-with-icon">
              <input
                type="number"
                id="initialInvestment"
                value={initialInvestment}
                onChange={(e) => setInitialInvestment(Number(e.target.value))}
                min="0"
              />
              <span className="currency-icon-right">€</span>
            </div>
          </div>

          <div className="control-group">
            <label htmlFor="monthlyContribution">Contribution mensuelle</label>
            <div className="input-with-icon">
              <input
                type="number"
                id="monthlyContribution"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                min="0"
              />
              <span className="currency-icon-right">€</span>
            </div>
          </div>

          <div className="control-group">
            <label htmlFor="annualReturnRate">Taux de rendement annuel (%)</label>
            <div className="input-with-icon">
              <input
                type="number"
                id="annualReturnRate"
                value={annualReturnRate}
                onChange={(e) => setAnnualReturnRate(Number(e.target.value))}
                min="0"
                max="30"
                step="0.1"
              />
              <span className="percentage-icon">%</span>
            </div>
          </div>

          <div className="control-group">
            <label htmlFor="investmentPeriod">Période d'investissement (années)</label>
            <input
              type="range"
              id="investmentPeriod"
              value={investmentPeriod}
              onChange={(e) => setInvestmentPeriod(Number(e.target.value))}
              min="1"
              max="40"
              step="1"
              className="range-slider"
            />
            <div className="range-value">{investmentPeriod} ans</div>
          </div>

          <div className="control-group">
            <label htmlFor="comparisonType">Comparer avec</label>
            <select
              id="comparisonType"
              value={comparisonType}
              onChange={(e) => setComparisonType(e.target.value)}
              className="custom-select"
            >
              <option value="none">Aucune comparaison</option>
              <option value="savings">Compte d'épargne</option>
              <option value="inflation">Ajusté à l'inflation</option>
            </select>
          </div>

          {comparisonType === 'savings' && (
            <div className="control-group">
              <label htmlFor="savingsRate">Taux d'épargne annuel (%)</label>
              <div className="input-with-icon">
                <input
                  type="number"
                  id="savingsRate"
                  value={savingsRate}
                  onChange={(e) => setSavingsRate(Number(e.target.value))}
                  min="0"
                  max="5"
                  step="0.1"
                />
                <span className="percentage-icon">%</span>
              </div>
            </div>
          )}

          {comparisonType === 'inflation' && (
            <div className="control-group">
              <label htmlFor="inflationRate">Taux d'inflation annuel (%)</label>
              <div className="input-with-icon">
                <input
                  type="number"
                  id="inflationRate"
                  value={inflationRate}
                  onChange={(e) => setInflationRate(Number(e.target.value))}
                  min="0"
                  max="10"
                  step="0.1"
                />
                <span className="percentage-icon">%</span>
              </div>
            </div>
          )}
        </div>

        <div className="investment-simulator-results">
          <div className="chart-container">
            <Line data={chartData} options={chartOptions} />
          </div>

          <div className="results-summary">
            <div className="result-card">
              <h3>Valeur finale estimée</h3>
              <p className="result-value">{formatCurrency(simulationResults?.finalValue || 0)}</p>
            </div>
            <div className="result-card">
              <h3>Total des contributions</h3>
              <p className="result-value">{formatCurrency(simulationResults?.totalContributions || 0)}</p>
            </div>
            <div className="result-card">
              <h3>Intérêts gagnés</h3>
              <p className="result-value">{formatCurrency(simulationResults?.totalInterest || 0)}</p>
            </div>
          </div>

          <div className="investment-tips">
            <h3>Conseils d'investissement</h3>
            <ul>
              <li>
                <span className="tip-icon">💡</span>
                <span className="tip-text">Commencez tôt : plus vous investissez longtemps, plus l'intérêt composé travaille pour vous.</span>
              </li>
              <li>
                <span className="tip-icon">💡</span>
                <span className="tip-text">Diversifiez vos investissements pour réduire les risques.</span>
              </li>
              <li>
                <span className="tip-icon">💡</span>
                <span className="tip-text">Investissez régulièrement, même de petits montants, pour profiter du coût moyen d'acquisition.</span>
              </li>
              <li>
                <span className="tip-icon">💡</span>
                <span className="tip-text">Tenez compte de l'inflation dans vos projections à long terme.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentSimulator;