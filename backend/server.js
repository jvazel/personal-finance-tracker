// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const transactionRoutes = require('./routes/transactionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const goalRoutes = require('./routes/goalRoutes');
const financialAdvisorRoutes = require('./routes/financialAdvisorRoutes');
const authRoutes = require('./routes/authRoutes');
const { protect } = require('./middleware/auth');
const taxRoutes = require('./routes/taxRoutes');
const trendsRoutes = require('./routes/trendsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('MongoDB Connected');
})
.catch(err => console.error('MongoDB Connection Error:', err));

// Routes publiques
app.use('/api/auth', authRoutes);

// Routes protégées
app.use('/api/transactions', protect, transactionRoutes);
app.use('/api/categories', protect, categoryRoutes);
app.use('/api/predictions', protect, predictionRoutes);
app.use('/api/goals', protect, goalRoutes);
app.use('/api/financial-advisor', financialAdvisorRoutes);
app.use('/api/tax', protect, taxRoutes);
app.use('/api/trends', protect, trendsRoutes);
app.get('/api/dashboard-data', protect, require('./controllers/transactionController').getDashboardData);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});