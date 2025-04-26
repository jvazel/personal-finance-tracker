import React, { useState, useEffect, useCallback } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area
} from 'recharts';
import api from '../../services/api';

const ProgressVisualization = () => {
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('6months'); // '3months', '6months', '1year'
  const [dataCache, setDataCache] = useState({}); // Cache pour les réponses API
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'details', 'radar'
  const [calculatingKPIs, setCalculatingKPIs] = useState(false);

  // Mémoriser la fonction de récupération pour assurer un comportement cohérent
  const fetchProgressData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Vérifier si nous avons des données en cache pour ce timeframe
      if (dataCache[timeframe]) {
        setProgressData(dataCache[timeframe]);
        setLoading(false);
        return;
      }
      
      const response = await api.get('/api/financial-advisor/progress', {
        params: { timeframe }
      });
      
      // S'assurer que les données sont correctement triées par date avant traitement
      const sortedData = [...(response.data || [])].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      
      // Normaliser les dates pour assurer un format cohérent
      const normalizedData = sortedData.map(item => ({
        ...item,
        date: new Date(item.date).toISOString().split('T')[0], // Format YYYY-MM-DD
        savingsRate: parseFloat(item.savingsRate) || 0,
        expenseReduction: parseFloat(item.expenseReduction) || 0,
        recommendationsCompleted: parseInt(item.recommendationsCompleted) || 0,
        debtToIncomeRatio: parseFloat(item.debtToIncomeRatio) || 0,
        financialHealthScore: parseFloat(item.financialHealthScore) || 50,
        investmentDiversification: parseFloat(item.investmentDiversification) || 0,
        netWorthChange: parseFloat(item.netWorthChange) || 0,
        emergencyCoverageMonths: parseFloat(item.emergencyCoverageMonths) || 0
      }));
      
      // Mettre en cache les données normalisées
      setDataCache(prev => ({
        ...prev,
        [timeframe]: normalizedData
      }));
      
      setProgressData(normalizedData);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des données de progression:', err);
      setError('Impossible de charger les données de progression');
      setLoading(false);
    }
  }, [timeframe, dataCache]);

  useEffect(() => {
    fetchProgressData();
  }, [fetchProgressData]);

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleCalculateKPIs = async () => {
    try {
      setCalculatingKPIs(true);
      await api.post('/api/financial-advisor/progress/calculate');
      // Rafraîchir les données après le calcul
      setDataCache({}); // Vider le cache pour forcer une nouvelle récupération
      await fetchProgressData();
      setCalculatingKPIs(false);
    } catch (err) {
      console.error('Erreur lors du calcul des KPIs:', err);
      setCalculatingKPIs(false);
    }
  };

  // Calculer le pourcentage de changement correctement
  const calculatePercentageChange = (current, initial) => {
    if (initial === 0) return current > 0 ? 100 : 0; // Gérer la division par zéro
    return ((current - initial) / Math.abs(initial)) * 100;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des données de progression...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Erreur</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (progressData.length === 0) {
    return (
      <div className="progress-visualization-container">
        <h2>Suivi de votre progression</h2>
        <div className="progress-actions">
          <button 
            className="calculate-kpis-button"
            onClick={handleCalculateKPIs}
            disabled={calculatingKPIs}
          >
            {calculatingKPIs ? 'Calcul en cours...' : 'Calculer mes KPIs maintenant'}
          </button>
        </div>
        <p className="no-data-message">
          Pas assez de données pour afficher votre progression. Calculez vos KPIs ou continuez à suivre les recommandations.
        </p>
      </div>
    );
  }

  // Obtenir les premiers et derniers points de données pour les calculs
  const firstDataPoint = progressData[0];
  const lastDataPoint = progressData[progressData.length - 1];
  
  // Calculer les changements
  const savingsRateChange = calculatePercentageChange(
    lastDataPoint.savingsRate,
    firstDataPoint.savingsRate
  );
  
  const expenseReductionChange = calculatePercentageChange(
    lastDataPoint.expenseReduction,
    firstDataPoint.expenseReduction
  );

  const debtToIncomeRatioChange = calculatePercentageChange(
    firstDataPoint.debtToIncomeRatio - lastDataPoint.debtToIncomeRatio, // Inversé car une baisse est positive
    firstDataPoint.debtToIncomeRatio
  );

  const financialHealthScoreChange = calculatePercentageChange(
    lastDataPoint.financialHealthScore,
    firstDataPoint.financialHealthScore
  );

  const investmentDiversificationChange = calculatePercentageChange(
    lastDataPoint.investmentDiversification,
    firstDataPoint.investmentDiversification
  );

  const netWorthChangeTotal = calculatePercentageChange(
    lastDataPoint.netWorthChange,
    firstDataPoint.netWorthChange
  );

  const emergencyCoverageChange = calculatePercentageChange(
    lastDataPoint.emergencyCoverageMonths,
    firstDataPoint.emergencyCoverageMonths
  );

  // Préparer les données pour le graphique radar
  const radarData = [
    {
      subject: 'Santé financière',
      A: lastDataPoint.financialHealthScore,
      fullMark: 100,
    },
    {
      subject: 'Taux d\'épargne',
      A: Math.min(100, lastDataPoint.savingsRate * 2), // Normaliser pour le radar
      fullMark: 100,
    },
    {
      subject: 'Réduction dépenses',
      A: Math.min(100, lastDataPoint.expenseReduction * 2), // Normaliser pour le radar
      fullMark: 100,
    },
    {
      subject: 'Ratio dette/revenu',
      A: Math.max(0, 100 - lastDataPoint.debtToIncomeRatio), // Inversé car plus bas est mieux
      fullMark: 100,
    },
    {
      subject: 'Diversification',
      A: lastDataPoint.investmentDiversification,
      fullMark: 100,
    },
    {
      subject: 'Fonds d\'urgence',
      A: Math.min(100, lastDataPoint.emergencyCoverageMonths * 16.67), // 6 mois = 100%
      fullMark: 100,
    },
  ];

  return (
    <div className="progress-visualization-container">
      <div className="progress-header">
        <h2>Suivi de votre progression</h2>
        
        <div className="progress-actions">
          <button 
            className="calculate-kpis-button"
            onClick={handleCalculateKPIs}
            disabled={calculatingKPIs}
          >
            {calculatingKPIs ? 'Calcul en cours...' : 'Mettre à jour mes KPIs'}
          </button>
        </div>
      </div>
      
      <div className="timeframe-selector small">
        <button 
          className={timeframe === '3months' ? 'active' : ''} 
          onClick={() => handleTimeframeChange('3months')}
        >
          3 mois
        </button>
        <button 
          className={timeframe === '6months' ? 'active' : ''} 
          onClick={() => handleTimeframeChange('6months')}
        >
          6 mois
        </button>
        <button 
          className={timeframe === '1year' ? 'active' : ''} 
          onClick={() => handleTimeframeChange('1year')}
        >
          1 an
        </button>
      </div>

      <div className="progress-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => handleTabChange('overview')}
        >
          Vue d'ensemble
        </button>
        <button 
          className={activeTab === 'details' ? 'active' : ''} 
          onClick={() => handleTabChange('details')}
        >
          Détails
        </button>
        <button 
          className={activeTab === 'radar' ? 'active' : ''} 
          onClick={() => handleTabChange('radar')}
        >
          Radar financier
        </button>
      </div>
      
      {activeTab === 'overview' && (
        <>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={progressData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis 
                  dataKey="date" 
                  stroke="#aaa"
                  tick={{ fill: '#e2e8f0' }}
                />
                <YAxis 
                  stroke="#aaa"
                  tick={{ fill: '#e2e8f0' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#353549', 
                    border: '1px solid #4b5563',
                    color: '#e2e8f0'
                  }}
                />
                <Legend wrapperStyle={{ color: '#e2e8f0' }} />
                <Line 
                  type="monotone" 
                  dataKey="savingsRate" 
                  name="Taux d'épargne (%)" 
                  stroke="#3b82f6" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="expenseReduction" 
                  name="Réduction des dépenses (%)" 
                  stroke="#10b981" 
                />
                <Line 
                  type="monotone" 
                  dataKey="financialHealthScore" 
                  name="Score de santé financière" 
                  stroke="#f59e0b" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="progress-stats">
            <div className="stat-card">
              <h3>Taux d'épargne actuel</h3>
              <p className="stat-value">{lastDataPoint.savingsRate.toFixed(1)}%</p>
              <p className="stat-change">
                {savingsRateChange > 0 ? (
                  <span className="positive">+{savingsRateChange.toFixed(1)}%</span>
                ) : (
                  <span className="negative">{savingsRateChange.toFixed(1)}%</span>
                )}
                {' '}d'évolution depuis le début de la période
              </p>
            </div>
            
            <div className="stat-card">
              <h3>Score de santé financière</h3>
              <p className="stat-value">{lastDataPoint.financialHealthScore.toFixed(0)}/100</p>
              <p className="stat-change">
                {financialHealthScoreChange > 0 ? (
                  <span className="positive">+{financialHealthScoreChange.toFixed(1)}%</span>
                ) : (
                  <span className="negative">{financialHealthScoreChange.toFixed(1)}%</span>
                )}
                {' '}d'évolution depuis le début de la période
              </p>
            </div>
            
            <div className="stat-card">
              <h3>Recommandations complétées</h3>
              <p className="stat-value">{lastDataPoint.recommendationsCompleted}</p>
              <p className="stat-change">
                {lastDataPoint.recommendationsCompleted > firstDataPoint.recommendationsCompleted ? (
                  <span className="positive">+{lastDataPoint.recommendationsCompleted - firstDataPoint.recommendationsCompleted}</span>
                ) : (
                  <span>Aucun changement</span>
                )}
                {' '}depuis le début de la période
              </p>
            </div>
            
            <div className="stat-card">
              <h3>Fonds d'urgence</h3>
              <p className="stat-value">{lastDataPoint.emergencyCoverageMonths.toFixed(1)} mois</p>
              <p className="stat-change">
                {emergencyCoverageChange > 0 ? (
                  <span className="positive">+{emergencyCoverageChange.toFixed(1)}%</span>
                ) : (
                  <span className="negative">{emergencyCoverageChange.toFixed(1)}%</span>
                )}
                {' '}d'évolution depuis le début de la période
              </p>
            </div>
          </div>
        </>
      )}

      {activeTab === 'details' && (
        <>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={progressData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis 
                  dataKey="date" 
                  stroke="#aaa"
                  tick={{ fill: '#e2e8f0' }}
                />
                <YAxis 
                  stroke="#aaa"
                  tick={{ fill: '#e2e8f0' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#353549', 
                    border: '1px solid #4b5563',
                    color: '#e2e8f0'
                  }}
                />
                <Legend wrapperStyle={{ color: '#e2e8f0' }} />
                <Area 
                  type="monotone" 
                  dataKey="debtToIncomeRatio" 
                  name="Ratio dette/revenu (%)" 
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="investmentDiversification" 
                  name="Diversification des investissements (%)" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="netWorthChange" 
                  name="Évolution du patrimoine net (%)" 
                  stroke="#14b8a6" 
                  fill="#14b8a6" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="progress-stats">
            <div className="stat-card">
              <h3>Ratio dette/revenu</h3>
              <p className="stat-value">{lastDataPoint.debtToIncomeRatio.toFixed(1)}%</p>
              <p className="stat-change">
                {debtToIncomeRatioChange > 0 ? (
                  <span className="positive">-{debtToIncomeRatioChange.toFixed(1)}%</span>
                ) : (
                  <span className="negative">+{Math.abs(debtToIncomeRatioChange).toFixed(1)}%</span>
                )}
                {' '}d'évolution depuis le début de la période
              </p>
              <p className="stat-info">
                {lastDataPoint.debtToIncomeRatio <= 36 ? (
                  <span className="positive">Bon ratio (inférieur ou égale à 36%)</span>
                ) : lastDataPoint.debtToIncomeRatio <= 42 ? (
                  <span className="warning">Ratio moyen (inférieur ou égale à 42%)</span>
                ) : (
                  <span className="negative">Ratio élevé (supérieur à 42%)</span>
                )}
              </p>
            </div>
            
            <div className="stat-card">
              <h3>Diversification des investissements</h3>
              <p className="stat-value">{lastDataPoint.investmentDiversification.toFixed(1)}%</p>
              <p className="stat-change">
                {investmentDiversificationChange > 0 ? (
                  <span className="positive">+{investmentDiversificationChange.toFixed(1)}%</span>
                ) : (
                  <span className="negative">{investmentDiversificationChange.toFixed(1)}%</span>
                )}
                {' '}d'évolution depuis le début de la période
              </p>
            </div>
            
            <div className="stat-card">
              <h3>Évolution du patrimoine net</h3>
              <p className="stat-value">{lastDataPoint.netWorthChange.toFixed(1)}%</p>
              <p className="stat-change">
                {netWorthChangeTotal > 0 ? (
                  <span className="positive">+{netWorthChangeTotal.toFixed(1)}%</span>
                ) : (
                  <span className="negative">{netWorthChangeTotal.toFixed(1)}%</span>
                )}
                {' '}d'évolution depuis le début de la période
              </p>
            </div>
            
            <div className="stat-card">
              <h3>Réduction des dépenses</h3>
              <p className="stat-value">{lastDataPoint.expenseReduction.toFixed(1)}%</p>
              <p className="stat-change">
                {expenseReductionChange > 0 ? (
                  <span className="positive">+{expenseReductionChange.toFixed(1)}%</span>
                ) : (
                  <span className="negative">{expenseReductionChange.toFixed(1)}%</span>
                )}
                {' '}d'évolution depuis le début de la période
              </p>
            </div>
          </div>
        </>
      )}

      {activeTab === 'radar' && (
        <>
          <div className="radar-chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart outerRadius={150} data={radarData}>
                <PolarGrid stroke="#444" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: '#e2e8f0' }}
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]} 
                  tick={{ fill: '#e2e8f0' }}
                />
                <Radar 
                  name="Votre profil financier" 
                  dataKey="A" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#353549', 
                    border: '1px solid #4b5563',
                    color: '#e2e8f0'
                  }}
                />
                <Legend wrapperStyle={{ color: '#e2e8f0' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="radar-explanation">
            <h3>Comprendre votre radar financier</h3>
            <p>
              Ce graphique radar représente votre profil financier sur 6 dimensions clés. 
              Plus la surface colorée est grande et équilibrée, meilleure est votre santé financière globale.
            </p>
            <div className="radar-metrics">
              <div className="radar-metric">
                <h4>Santé financière: {lastDataPoint.financialHealthScore.toFixed(0)}/100</h4>
                <p>Score global basé sur plusieurs indicateurs financiers.</p>
              </div>
              <div className="radar-metric">
                <h4>Taux d'épargne: {lastDataPoint.savingsRate.toFixed(1)}%</h4>
                <p>Pourcentage de vos revenus que vous épargnez.</p>
              </div>
              <div className="radar-metric">
                <h4>Réduction dépenses: {lastDataPoint.expenseReduction.toFixed(1)}%</h4>
                <p>Réduction de vos dépenses par rapport à la période précédente.</p>
              </div>
              <div className="radar-metric">
                <h4>Ratio dette/revenu: {lastDataPoint.debtToIncomeRatio.toFixed(1)}%</h4>
                <p>Pourcentage de vos revenus consacré au remboursement de dettes.</p>
              </div>
              <div className="radar-metric">
                <h4>Diversification: {lastDataPoint.investmentDiversification.toFixed(1)}%</h4>
                <p>Niveau de diversification de vos investissements.</p>
              </div>
              <div className="radar-metric">
                <h4>Fonds d'urgence: {lastDataPoint.emergencyCoverageMonths.toFixed(1)} mois</h4>
                <p>Nombre de mois de dépenses couverts par votre épargne d'urgence.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProgressVisualization;