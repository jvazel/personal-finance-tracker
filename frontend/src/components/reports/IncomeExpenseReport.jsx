import React, { useState, useEffect } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '../../utils/api';
import { 
  BarChart, Bar, PieChart, Pie, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, ComposedChart, Area
} from 'recharts';
import DateRangePicker from '../common/DateRangePicker';
import LoadingSpinner from '../common/LoadingSpinner';

const IncomeExpenseReport = () => {
  console.log('Composant IncomeExpenseReport monté');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    totals: { income: 0, expense: 0, balance: 0 },
    incomeBySource: [],
    expenseByCategory: [],
    monthlyData: []
  });
  
  // État pour la période sélectionnée
  const [dateRange, setDateRange] = useState({
    startDate: subMonths(startOfMonth(new Date()), 5),
    endDate: endOfMonth(new Date())
  });

  // Récupération des données
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('Début de l\'appel API avec les paramètres:', {
          startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
          endDate: format(dateRange.endDate, 'yyyy-MM-dd')
        });
        
        const response = await api.get('/reports/income-expense', {
          params: {
            startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
            endDate: format(dateRange.endDate, 'yyyy-MM-dd')
          }
        });
        
        console.log('Réponse API reçue:', response.data);
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Erreur lors de la récupération des données:', err);
        console.error('Détails de l\'erreur:', err.response?.data || err.message);
        setError('Impossible de charger les données du rapport. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  // Fonction pour formater les montants en euros
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  // Fonction pour formater les pourcentages
  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  // Couleurs pour les graphiques
  const incomeColor = '#10b981'; // Vert
  const expenseColor = '#ef4444'; // Rouge
  const balanceColor = '#6366f1'; // Violet
  const pieColors = ['#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#84cc16', '#14b8a6'];

  // Calcul des KPIs
  const savingsRate = data.totals.income > 0 
    ? (data.totals.balance / data.totals.income) * 100 
    : 0;
  
  const expenseToIncomeRatio = data.totals.income > 0 
    ? (data.totals.expense / data.totals.income) * 100 
    : 0;

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="income-expense-report">
      <div className="report-header">
        <h1>Rapport Revenus et Dépenses</h1>
        <p className="report-description">
          Ce rapport vous donne une vue d'ensemble de vos revenus et dépenses, vous permettant de comprendre
          d'où vient votre argent et où il va.
        </p>
        <DateRangePicker 
          startDate={dateRange.startDate} 
          endDate={dateRange.endDate} 
          onChange={setDateRange} 
        />
      </div>

      {/* Section des totaux */}
      <div className="report-section">
        <h2>Totaux sur la Période</h2>
        <div className="summary-cards">
          <div className="summary-card income">
            <h3>Total des Revenus</h3>
            <p className="amount">{formatCurrency(data.totals.income)}</p>
          </div>
          <div className="summary-card expense">
            <h3>Total des Dépenses</h3>
            <p className="amount">{formatCurrency(data.totals.expense)}</p>
          </div>
          <div className="summary-card balance">
            <h3>Solde Net</h3>
            <p className={`amount ${data.totals.balance >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(data.totals.balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Section des KPIs */}
      <div className="report-section">
        <h2>Indicateurs Clés</h2>
        <div className="kpi-cards">
          <div className="kpi-card">
            <h3>Taux d'Épargne</h3>
            <p className="kpi-value">{formatPercentage(savingsRate)}</p>
            <p className="kpi-description">
              Pourcentage de vos revenus que vous avez réussi à épargner
            </p>
          </div>
          <div className="kpi-card">
            <h3>Ratio Dépenses/Revenus</h3>
            <p className="kpi-value">{formatPercentage(expenseToIncomeRatio)}</p>
            <p className="kpi-description">
              Pourcentage de vos revenus consommé par vos dépenses
            </p>
          </div>
        </div>
      </div>

      {/* Section de répartition */}
      <div className="report-section">
        <h2>Répartition</h2>
        <div className="charts-row">
          {/* Graphique de répartition des revenus */}
          <div className="chart-container">
            <h3>D'où vient l'argent ?</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.incomeBySource}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${formatPercentage(percent * 100)}`}
                >
                  {data.incomeBySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Graphique de répartition des dépenses */}
          <div className="chart-container">
            <h3>Où va l'argent ?</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.expenseByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${formatPercentage(percent * 100)}`}
                >
                  {data.expenseByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section de comparaison visuelle */}
      <div className="report-section">
        <h2>Comparaison Visuelle</h2>
        <div className="charts-row">
          {/* Graphique à barres côte à côte */}
          <div className="chart-container">
            <h3>Revenus vs Dépenses</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[{ 
                  name: 'Total', 
                  revenus: data.totals.income, 
                  dépenses: data.totals.expense 
                }]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="revenus" fill={incomeColor} />
                <Bar dataKey="dépenses" fill={expenseColor} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Graphique en cascade (Waterfall) */}
          <div className="chart-container">
            <h3>Flux d'Argent</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart
                data={[
                  { name: 'Revenus', value: data.totals.income, fill: incomeColor },
                  ...data.expenseByCategory.map(cat => ({
                    name: cat.name,
                    value: -cat.amount,
                    fill: expenseColor
                  })),
                  { name: 'Solde', value: data.totals.balance, fill: balanceColor }
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="value" fill={(entry) => entry.fill} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section d'évolution dans le temps */}
      <div className="report-section">
        <h2>Évolution dans le Temps</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={data.monthlyData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tickFormatter={(tick) => {
                try {
                  return format(parseISO(tick), 'MMM yyyy', { locale: fr });
                } catch (e) {
                  return tick;
                }
              }}
            />
            <YAxis />
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              labelFormatter={(label) => {
                try {
                  return format(parseISO(label), 'MMMM yyyy', { locale: fr });
                } catch (e) {
                  return label;
                }
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="income" name="Revenus" stroke={incomeColor} activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="expense" name="Dépenses" stroke={expenseColor} activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="balance" name="Solde Net" stroke={balanceColor} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default IncomeExpenseReport;