import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FaCalendarAlt } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './ReportStyles.css'; // Assuming a shared style file, or create one

// Define a set of colors for the chart lines
const CATEGORY_COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#8AC249', '#EA5F89', '#00D8B6', '#FFB6C1',
  '#FFD700', '#ADFF2F', '#00FA9A', '#FF69B4', '#7B68EE'
];

const CategoryEvolutionReport = () => {
  const [reportData, setReportData] = useState({ categories: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(subMonths(startOfMonth(new Date()), 5));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!startDate || !endDate) {
        setError('Veuillez sélectionner une date de début et de fin.');
        setLoading(false);
        setReportData({ categories: [] });
        return;
      }

      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');

      const response = await api.get('/api/reports/category-evolution', {
        params: { startDate: formattedStartDate, endDate: formattedEndDate }
      });

      setReportData(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement du rapport d\'évolution des catégories:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des données du rapport.');
      setReportData({ categories: [] });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const CustomTooltipContent = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ backgroundColor: 'rgba(51, 51, 51, 0.9)', padding: '10px', border: '1px solid #666', borderRadius: '4px' }}>
          <p className="label" style={{ margin: '0 0 5px 0', color: '#fff' }}>{`Mois: ${format(parseISO(label), 'MMMM yyyy', { locale: fr })}`}</p>
          {payload.map((pld, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: pld.stroke, marginRight: '5px', display: 'inline-block' }}></span>
              <p style={{ margin: 0, color: pld.stroke }}>
                {`${pld.name}: ${formatCurrency(pld.value)}`}
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Prepare data for the chart
  // Get all unique months present in the data
  const allMonths = [...new Set(reportData.categories.flatMap(cat => cat.evolution.map(ev => ev.month)))]
    .sort((a, b) => new Date(a) - new Date(b));

  const chartData = allMonths.map(month => {
    const monthData = { name: format(new Date(month), 'MMM yy', { locale: fr }) }; // Short month name for X-axis
    reportData.categories.forEach(category => {
      const evolutionForMonth = category.evolution.find(ev => ev.month === month);
      monthData[category.name] = evolutionForMonth ? evolutionForMonth.total : 0;
    });
    return monthData;
  });


  return (
    <div className="report-section category-evolution-report">
      <h2>Évolution des Dépenses par Catégorie</h2>

      <div className="report-controls date-range-picker-container">
        <div className="date-picker-group">
          <label htmlFor="startDatePicker">Date de début:</label>
          <DatePicker
            id="startDatePicker"
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            dateFormat="dd/MM/yyyy"
            locale={fr}
            className="date-picker-input"
            popperPlacement="bottom-start"
          />
          <FaCalendarAlt className="date-picker-icon" />
        </div>
        <div className="date-picker-group">
          <label htmlFor="endDatePicker">Date de fin:</label>
          <DatePicker
            id="endDatePicker"
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            dateFormat="dd/MM/yyyy"
            locale={fr}
            className="date-picker-input"
            popperPlacement="bottom-start"
          />
          <FaCalendarAlt className="date-picker-icon" />
        </div>
        <button onClick={fetchReportData} className="apply-dates-btn primary-button">
          Appliquer
        </button>
      </div>

      {loading && <div className="loading-message">Chargement des données...</div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && !error && reportData.categories.length === 0 && (
        <div className="no-data-message">Aucune donnée d'évolution de catégorie disponible pour la période sélectionnée.</div>
      )}

      {!loading && !error && reportData.categories.length > 0 && (
        <div className="chart-container" style={{ width: '100%', height: 500, marginTop: '20px' }}>
          <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 50 }} // Increased bottom margin for legend
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis
                dataKey="name"
                stroke="#aaa"
                angle={-30}       // Angle labels for better readability
                textAnchor="end"   // Anchor text at the end of the label
                interval="preserveStartEnd" // Show first and last, and some in between
                height={60} // Increase height to accommodate angled labels
              />
              <YAxis stroke="#aaa" tickFormatter={formatCurrency} />
              <Tooltip content={<CustomTooltipContent />} />
              <Legend wrapperStyle={{ paddingTop: '40px' }} />
              {reportData.categories.map((category, index) => (
                <Line
                  key={category.name}
                  type="monotone"
                  dataKey={category.name}
                  stroke={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default CategoryEvolutionReport;
