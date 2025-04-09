import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import api from '../../utils/api'; // Import the API utility instead of axios

// Modification: suppression du paramètre limit dans les props, on utilise une constante
const TopExpenses = () => {
  const [topExpenses, setTopExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Définir une constante pour le nombre de dépenses à afficher
  const EXPENSES_LIMIT = 5;

  useEffect(() => {
    const fetchTopExpenses = async () => {
      try {
        setLoading(true);
        
        // Calculer les dates pour le mois en cours
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        // Formater les dates pour l'API (YYYY-MM-DD)
        const startDate = firstDayOfMonth.toISOString().split('T')[0];
        const endDate = lastDayOfMonth.toISOString().split('T')[0];
        
        // Use the API utility instead of axios directly
        const response = await api.get('/transactions/top-expenses', {
          params: { 
            startDate, 
            endDate,
            limit: EXPENSES_LIMIT // Utiliser la constante au lieu du paramètre
          }
        });
        
        setTopExpenses(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Échec lors du chargement des principales dépenses:', err);
        setError('Échec lors du chargement des principales dépenses');
        setLoading(false);
      }
    };

    fetchTopExpenses();
  }, []); // Suppression de la dépendance limit qui n'existe plus

  if (loading) {
    return <div>Chargement des principales dépenses...</div>;
  }

  if (error) {
    return <div>Erreur: {error}</div>;
  }

  // Préparer les données pour le graphique
  const chartData = topExpenses.map(expense => ({
    description: expense.description.length > 20 
      ? expense.description.substring(0, 20) + '...' 
      : expense.description,
    amount: expense.amount,
    fullDescription: expense.description // Pour l'infobulle
  }));

  return (
    <div style={{ height: '350px', width: '100%', overflow: 'hidden' }}>
      {topExpenses.length > 0 ? (
        <ResponsiveContainer width="99%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 80, bottom: 5 }} // Reduced margins
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis type="number" stroke="#aaa" />
            <YAxis 
              dataKey="description" 
              type="category" 
              stroke="#aaa" 
              width={80} // Reduced from 100 to save space
              tick={{ fontSize: 11 }} // Smaller font size
            />
            <Tooltip 
              formatter={(value) => [`${value.toFixed(2)} €`, 'Montant']}
              labelFormatter={(label) => {
                const item = chartData.find(item => item.description === label);
                return item ? item.fullDescription : label;
              }}
              contentStyle={{ backgroundColor: '#333', border: '1px solid #666', color: 'white' }}
            />
            <Legend wrapperStyle={{ color: '#aaa' }} />
            <Bar 
              dataKey="amount" 
              fill="#f44336" 
              name="Montant" 
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div>Aucune dépense à afficher</div>
      )}
    </div>
  );
};

export default TopExpenses;