import React, { useState, useEffect } from 'react';
import { format, subMonths, addMonths, subYears, addYears } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '../../services/api';
import TimeSeriesChart from './TimeSeriesChart';
import PeriodComparison from './PeriodComparison';
import HeatmapChart from './HeatmapChart';
import DynamicPieChart from './DynamicPieChart';
import AnomalyDetection from './AnomalyDetection';
import SeasonalAnalysis from './SeasonalAnalysis';
import FinancialLeakage from './FinancialLeakage';
import FilterPanel from './FilterPanel';
import LoadingSpinner from '../common/LoadingSpinner';

const Trends = () => {
  // État pour les filtres et les données
  const [timeframe, setTimeframe] = useState('month'); // 'week', 'month', 'quarter', 'year'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [categories, setCategories] = useState([]); // Make sure this is initialized as an empty array
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // États pour les différentes données d'analyse
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [comparisonData, setComparisonData] = useState({});
  const [heatmapData, setHeatmapData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [seasonalPatterns, setSeasonalPatterns] = useState([]);
  const [financialLeakages, setFinancialLeakages] = useState([]);

  // Fonction pour charger les catégories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/api/categories');
        // Vérifier si la réponse a une structure avec data
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          setCategories(response.data.data);
          setSelectedCategories(response.data.data.map(cat => cat._id));
        } else if (Array.isArray(response.data)) {
          // Fallback au cas où la réponse est directement un tableau
          setCategories(response.data);
          setSelectedCategories(response.data.map(cat => cat._id));
        } else {
          console.error('Les données de catégories ne sont pas dans un format attendu:', response.data);
          setCategories([]);
          setError('Format de données de catégories incorrect');
        }
      } catch (err) {
        console.error('Erreur lors du chargement des catégories:', err);
        setError('Impossible de charger les catégories');
        setCategories([]); // Ensure categories is an array even on error
      }
    };

    fetchCategories();
  }, []);

  // Fonction pour charger les données d'analyse en fonction des filtres
  useEffect(() => {
    const fetchTrendsData = async () => {
      if (selectedCategories.length === 0) return;

      setLoading(true);
      setError(null);

      try {
        // Calculate proper date ranges based on timeframe
        const endDate = new Date(selectedDate);
        let startDate = new Date(selectedDate);

        if (timeframe === 'week') {
          startDate.setDate(startDate.getDate() - 7);
        } else if (timeframe === 'month') {
          startDate.setMonth(startDate.getMonth() - 1);
        } else if (timeframe === 'quarter') {
          startDate.setMonth(startDate.getMonth() - 3);
        } else if (timeframe === 'year') {
          startDate.setFullYear(startDate.getFullYear() - 1);
        }

        // Préparer les paramètres pour l'API
        const params = {
          timeframe,
          date: selectedDate.toISOString(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          categories: selectedCategories.join(',')
        };

        // Charger les données de séries temporelles
        const timeSeriesResponse = await api.get('/api/trends/time-series', { params });
        setTimeSeriesData(timeSeriesResponse.data);

        // Charger les données de comparaison
        const comparisonResponse = await api.get('/api/trends/period-comparison', { params });
        setComparisonData(comparisonResponse.data);

        // Charger les données de heatmap
        const heatmapResponse = await api.get('/api/trends/heatmap', { params });
        console.log('Raw heatmap data:', heatmapResponse.data);

        // Transformer les données pour qu'elles correspondent à ce que HeatmapChart attend
        if (heatmapResponse.data && heatmapResponse.data.data) {
          // Utiliser directement la structure de données fournie par l'API
          const transformedHeatmapData = {
            data: heatmapResponse.data.data.map(item => {
              // Ne pas créer d'objet Date, utiliser simplement les valeurs numériques
              return {
                // Conserver les propriétés originales
                month: item.month,
                dayOfWeek: item.dayOfWeek,
                total: item.total || 0,
                count: item.count || 0,
                average: item.average || 0,
                
                // Ajouter les propriétés nécessaires pour l'affichage
                monthName: heatmapResponse.data.metadata?.monthNames?.[item.month - 1] || '',
                dayName: heatmapResponse.data.metadata?.dayNames?.[item.dayOfWeek] || '',
                
                // Utiliser total comme valeur d'expense pour la heatmap
                expense: item.total || 0,
                
                // Ajouter une chaîne formatée au lieu d'un objet Date
                formattedDate: `${heatmapResponse.data.metadata?.dayNames?.[item.dayOfWeek] || ''}, ${heatmapResponse.data.metadata?.monthNames?.[item.month - 1] || ''}`
              };
            }),
            metadata: heatmapResponse.data.metadata
          };
          
          setHeatmapData(transformedHeatmapData);
          console.log('Transformed heatmap data:', transformedHeatmapData);
        } else {
          setHeatmapData({ data: [], metadata: null });
          console.warn('Données heatmap manquantes ou dans un format inattendu');
        }

        // Charger les données de graphique circulaire dynamique
        const pieChartResponse = await api.get('/api/trends/category-evolution', { params });
        console.log('Raw category evolution data:', pieChartResponse.data);

        // Transform the data to match the expected format for DynamicPieChart
        const rawData = pieChartResponse.data;
        const transformedPieChartData = {
          periods: rawData.periods.map((periodLabel, periodIndex) => {
            return {
              label: periodLabel,
              categories: rawData.categories.map(category => ({
                name: category.name,
                amount: category.values[periodIndex] || 0,
                color: category.color
              })),
              total: rawData.totals[periodIndex] || 0
            };
          })
        };

        console.log('Transformed pie chart data:', transformedPieChartData);
        setPieChartData(transformedPieChartData);

        // Charger les anomalies
        const anomaliesResponse = await api.get('/api/trends/anomalies', { params });  // Ajout du préfixe /api
        setAnomalies(anomaliesResponse.data);

        // Charger les patterns saisonniers
        const seasonalResponse = await api.get('/api/trends/seasonal-patterns', { params });  // Ajout du préfixe /api
        setSeasonalPatterns(seasonalResponse.data);

        // Charger les fuites financières
        const leakageResponse = await api.get('/api/trends/financial-leakage', { params });  // Ajout du préfixe /api
        setFinancialLeakages(leakageResponse.data);

      } catch (err) {
        console.error('Erreur lors du chargement des données de tendances:', err);
        setError('Impossible de charger les données d\'analyse. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendsData();
  }, [timeframe, selectedDate, selectedCategories]);

  // Fonctions de navigation temporelle
  const navigatePrevious = () => {
    if (timeframe === 'week' || timeframe === 'month') {
      setSelectedDate(prevDate => subMonths(prevDate, 1));
    } else if (timeframe === 'quarter') {
      setSelectedDate(prevDate => subMonths(prevDate, 3));
    } else if (timeframe === 'year') {
      setSelectedDate(prevDate => subYears(prevDate, 1));
    }
  };

  const navigateNext = () => {
    if (timeframe === 'week' || timeframe === 'month') {
      setSelectedDate(prevDate => addMonths(prevDate, 1));
    } else if (timeframe === 'quarter') {
      setSelectedDate(prevDate => addMonths(prevDate, 3));
    } else if (timeframe === 'year') {
      setSelectedDate(prevDate => addYears(prevDate, 1));
    }
  };

  // Formater l'affichage de la période
  const formatPeriodDisplay = () => {
    if (timeframe === 'week') {
      return `Semaine du ${format(selectedDate, 'dd MMMM yyyy', { locale: fr })}`;
    } else if (timeframe === 'month') {
      return format(selectedDate, 'MMMM yyyy', { locale: fr });
    } else if (timeframe === 'quarter') {
      const quarter = Math.floor(selectedDate.getMonth() / 3) + 1;
      return `T${quarter} ${selectedDate.getFullYear()}`;
    } else if (timeframe === 'year') {
      return selectedDate.getFullYear().toString();
    }
  };

  // Gérer le changement de catégories sélectionnées
  const handleCategoryChange = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // Sélectionner/désélectionner toutes les catégories
  const toggleAllCategories = () => {
    if (selectedCategories.length === categories.length && categories.length > 0) {
      setSelectedCategories([]);
    } else {
      // Make sure categories is an array before mapping
      if (Array.isArray(categories)) {
        setSelectedCategories(categories.map(cat => cat._id));
      }
    }
  };

  return (
    <div className="trends-container">
      <div className="trends-header">
        <h1>Analyse des Tendances</h1>
        <p>Visualisez et analysez l'évolution de vos finances dans le temps</p>
      </div>

      <div className="trends-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Vue d'ensemble
        </button>
        <button
          className={`tab-button ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          Comparaison
        </button>
        <button
          className={`tab-button ${activeTab === 'patterns' ? 'active' : ''}`}
          onClick={() => setActiveTab('patterns')}
        >
          Patterns
        </button>
        <button
          className={`tab-button ${activeTab === 'anomalies' ? 'active' : ''}`}
          onClick={() => setActiveTab('anomalies')}
        >
          Anomalies
        </button>
      </div>

      <div className="trends-content">
        <div className="trends-sidebar">
          <FilterPanel
            timeframe={timeframe}
            setTimeframe={setTimeframe}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            categories={Array.isArray(categories) ? categories : []} // Ensure categories is always an array
            selectedCategories={selectedCategories}
            handleCategoryChange={handleCategoryChange}
            toggleAllCategories={toggleAllCategories}
          />
        </div>

        <div className="trends-main">
          <div className="trends-period-navigation">
            <button className="period-nav-button" onClick={navigatePrevious}>
              &lt; Précédent
            </button>
            <div className="period-display">{formatPeriodDisplay()}</div>
            <button className="period-nav-button" onClick={navigateNext}>
              Suivant &gt;
            </button>
          </div>

          {loading ? (
            <div className="trends-loading">
              <LoadingSpinner />
              <p>Chargement des données d'analyse...</p>
            </div>
          ) : error ? (
            <div className="trends-error">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Réessayer</button>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="trends-overview">
                  <div className="trends-section">
                    <h2>Évolution Temporelle</h2>
                    <TimeSeriesChart data={Array.isArray(timeSeriesData) ? timeSeriesData : []} timeframe={timeframe} />
                  </div>

                  <div className="trends-section">
                    <h2>Répartition par Catégorie</h2>
                    <DynamicPieChart data={pieChartData || {}} />
                  </div>

                  <div className="trends-section">
                    <h2>Intensité des Dépenses</h2>
                    <HeatmapChart
                      data={heatmapData && heatmapData.data ? heatmapData.data : []}
                      metadata={heatmapData && heatmapData.metadata ? heatmapData.metadata : null}
                      timeframe={timeframe}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'comparison' && (
                <div className="trends-comparison">
                  <div className="trends-section">
                    <h2>Comparaison de Périodes</h2>
                    <PeriodComparison data={comparisonData} timeframe={timeframe} />
                  </div>
                </div>
              )}

              {activeTab === 'patterns' && (
                <div className="trends-patterns">
                  <div className="trends-section">
                    <h2>Analyse Saisonnière</h2>
                    <SeasonalAnalysis data={seasonalPatterns} />
                  </div>

                  <div className="trends-section">
                    <h2>Fuites Financières</h2>
                    <FinancialLeakage data={financialLeakages} />
                  </div>
                </div>
              )}

              {activeTab === 'anomalies' && (
                <div className="trends-anomalies">
                  <div className="trends-section">
                    <h2>Détection d'Anomalies</h2>
                    <AnomalyDetection data={anomalies} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Trends;