import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import AmountDisplay from '../common/AmountDisplay';
import api from '../../utils/api';

const ReportRecurringBills = () => {
  const [recurringBills, setRecurringBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('12'); // Par défaut 12 mois
  const [selectedBill, setSelectedBill] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'statistics.count', direction: 'desc' });

  useEffect(() => {
    const fetchRecurringBills = async () => {
      try {
        setLoading(true);
        const response = await api.get('/transactions/recurring-bills', {
          params: { period }
        });
        setRecurringBills(response.data);
        
        // Sélectionner la première facture par défaut s'il y en a
        if (response.data.length > 0 && !selectedBill) {
          setSelectedBill(response.data[0]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des factures récurrentes:', err);
        setError('Erreur lors du chargement des factures récurrentes');
        setLoading(false);
      }
    };

    fetchRecurringBills();
  }, [period]);

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };

  const handleBillSelect = (bill) => {
    setSelectedBill(bill);
  };

  // Fonction pour trier les factures récurrentes
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Obtenir l'indicateur de direction du tri
  const getSortDirectionIndicator = (key) => {
    if (sortConfig.key !== key) return '';
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  // Trier les factures récurrentes
  const sortedBills = React.useMemo(() => {
    if (!recurringBills || recurringBills.length === 0) return [];
    
    let sortableBills = [...recurringBills];
    if (sortConfig.key) {
      sortableBills.sort((a, b) => {
        // Gestion des clés imbriquées (comme statistics.count)
        const keys = sortConfig.key.split('.');
        let aValue = a;
        let bValue = b;
        
        // Parcourir les clés imbriquées
        for (const key of keys) {
          aValue = aValue[key];
          bValue = bValue[key];
        }
        
        // Comparaison des valeurs
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableBills;
  }, [recurringBills, sortConfig]);

  // Préparer les données pour le graphique
  const prepareChartData = (bill) => {
    if (!bill) return [];
    
    return bill.occurrences.map(occurrence => ({
      date: format(new Date(occurrence.date), 'MMM yyyy', { locale: fr }),
      amount: occurrence.amount,
      fullDate: format(new Date(occurrence.date), 'dd/MM/yyyy', { locale: fr })
    }));
  };

  if (loading) {
    return <div>Chargement des factures récurrentes...</div>;
  }

  if (error) {
    return <div>Erreur: {error}</div>;
  }

  return (
    <div className="report-section">
      <h2>Factures Récurrentes</h2>
      
      <div className="report-filters">
        <div className="report-filter-group">
          <label htmlFor="period-select">Période d'analyse:</label>
          <select 
            id="period-select" 
            className="period-select" 
            value={period} 
            onChange={handlePeriodChange}
          >
            <option value="3">3 mois</option>
            <option value="6">6 mois</option>
            <option value="12">12 mois</option>
            <option value="24">24 mois</option>
          </select>
        </div>
      </div>
      
      {sortedBills.length > 0 ? (
        <div className="recurring-bills-container">
          <div className="recurring-bills-list">
            <h3>Liste des factures récurrentes</h3>
            <table className="transaction-table">
              <thead>
                <tr>
                  <th onClick={() => requestSort('description')} style={{ cursor: 'pointer' }}>
                    Description{getSortDirectionIndicator('description')}
                  </th>
                  <th onClick={() => requestSort('category')} style={{ cursor: 'pointer' }}>
                    Catégorie{getSortDirectionIndicator('category')}
                  </th>
                  <th onClick={() => requestSort('statistics.count')} style={{ cursor: 'pointer' }}>
                    Occurrences{getSortDirectionIndicator('statistics.count')}
                  </th>
                  <th onClick={() => requestSort('statistics.average')} style={{ cursor: 'pointer' }}>
                    Montant moyen{getSortDirectionIndicator('statistics.average')}
                  </th>
                  <th onClick={() => requestSort('statistics.trend')} style={{ cursor: 'pointer' }}>
                    Évolution{getSortDirectionIndicator('statistics.trend')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedBills.map((bill, index) => (
                  <tr 
                    key={index} 
                    onClick={() => handleBillSelect(bill)}
                    className={selectedBill && selectedBill.description === bill.description ? 'selected-row' : ''}
                  >
                    <td>{bill.description}</td>
                    <td>{bill.category}</td>
                    <td>{bill.statistics.count}</td>
                    <td>
                      <AmountDisplay 
                        amount={bill.statistics.average} 
                        type="expense" 
                      />
                    </td>
                    <td>
                      <span className={bill.statistics.trend > 0 ? 'amount-expense' : 'amount-income'}>
                        {bill.statistics.trend > 0 ? '+' : ''}{bill.statistics.trend.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {selectedBill && (
            <div className="recurring-bill-details">
              <h3>Évolution de "{selectedBill.description}"</h3>
              
              <div className="bill-statistics">
                <div className="report-card">
                  <h3>Montant minimum</h3>
                  <p><AmountDisplay amount={selectedBill.statistics.min} type="expense" /></p>
                </div>
                <div className="report-card">
                  <h3>Montant moyen</h3>
                  <p><AmountDisplay amount={selectedBill.statistics.average} type="expense" /></p>
                </div>
                <div className="report-card">
                  <h3>Montant maximum</h3>
                  <p><AmountDisplay amount={selectedBill.statistics.max} type="expense" /></p>
                </div>
                <div className="report-card">
                  <h3>Évolution</h3>
                  <p className={selectedBill.statistics.trend > 0 ? 'amount-expense' : 'amount-income'}>
                    {selectedBill.statistics.trend > 0 ? '+' : ''}{selectedBill.statistics.trend.toFixed(2)}%
                  </p>
                </div>
              </div>
              
              <div className="bill-chart" style={{ height: '300px', marginTop: '20px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={prepareChartData(selectedBill)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="date" stroke="#aaa" />
                    <YAxis stroke="#aaa" />
                    <Tooltip 
                      formatter={(value) => [`${value.toFixed(2)} €`, 'Montant']}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{ backgroundColor: '#333', border: '1px solid #666', color: 'white' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#ef4444" 
                      activeDot={{ r: 8 }} 
                      name="Montant"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bill-occurrences" style={{ marginTop: '20px' }}>
                <h3>Détail des occurrences</h3>
                <table className="transaction-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBill.occurrences.map((occurrence, index) => (
                      <tr key={index}>
                        <td>{format(new Date(occurrence.date), 'dd/MM/yyyy', { locale: fr })}</td>
                        <td>
                          <AmountDisplay 
                            amount={occurrence.amount} 
                            type="expense" 
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>Aucune facture récurrente détectée sur la période sélectionnée.</div>
      )}
    </div>
  );
};

export default ReportRecurringBills;