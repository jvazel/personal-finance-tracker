import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';

const IncomeExpenseTrend = () => {
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/transactions/trends');
        setTrendData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Echec lors du chargement des données liées aux tendances:', err);
        setError('Echec lors du chargement des données liées aux tendances');
        setLoading(false);
      }
    };

    fetchTrendData();
  }, []);

  if (loading) {
    return (
      <Card sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', bgcolor: '#1e1e2e', color: 'white' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
          Tendance des revenus et dépenses
        </Typography>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="month" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip 
                formatter={(value) => [`${value.toFixed(2)} €`, '']}
                labelFormatter={(label) => `${label}`}
                contentStyle={{ backgroundColor: '#333', border: '1px solid #666', color: 'white' }}
              />
              <Legend wrapperStyle={{ color: '#aaa' }} />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#4caf50" 
                name="Revenu" 
                strokeWidth={2}
                dot={{ r: 4, fill: '#4caf50' }}
              />
              <Line 
                type="monotone" 
                dataKey="expense" 
                stroke="#f44336" 
                name="Dépense" 
                strokeWidth={2}
                dot={{ r: 4, fill: '#f44336' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default IncomeExpenseTrend;