// backend/server.js
require('dotenv').config({
  path: process.env.NODE_ENV === 'production' 
    ? './.env.production' 
    : './.env'
});
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const transactionRoutes = require('./routes/transactionRoutes');
const recurringExpensesRoutes = require('./routes/recurringExpensesRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const goalRoutes = require('./routes/goalRoutes');
const financialAdvisorRoutes = require('./routes/financialAdvisorRoutes');
const authRoutes = require('./routes/authRoutes');
const { protect } = require('./middleware/auth');
const taxRoutes = require('./routes/taxRoutes');
const trendsRoutes = require('./routes/trendsRoutes');
const importExportRoutes = require('./routes/importExportRoutes');
const simulatorRoutes = require('./routes/simulator');
const reportRoutes = require('./routes/reportRoutes');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Middleware pour logger les requêtes HTTP
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http('Requête HTTP', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB Connected');
  } catch (err) {
    logger.error('Erreur de connexion MongoDB:', { error: err.message, stack: err.stack });
    process.exit(1); // Exit process with failure
  }
};

// Connect to DB only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Ajouter le middleware pour créer le dossier uploads s'il n'existe pas
const fs = require('fs');
const path = require('path');
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Routes publiques
app.use('/api/auth', authRoutes);

// Routes protégées
app.use('/api/transactions', protect, transactionRoutes);
app.use('/api/categories', protect, categoryRoutes);
app.use('/api/predictions', protect, predictionRoutes);
app.use('/api/goals', protect, goalRoutes);
app.use('/api/financial-advisor', protect, financialAdvisorRoutes);
app.use('/api/tax', protect, taxRoutes);
app.use('/api/trends', protect, trendsRoutes);
app.get('/api/dashboard-data', protect, require('./controllers/transactionController').getDashboardData);
app.use('/api/import-export', protect, importExportRoutes);
app.use('/api/recurring-expenses', protect, recurringExpensesRoutes);
app.use('/api/simulator', protect, simulatorRoutes);
app.use('/api/reports', protect, reportRoutes);

// Start server only if not in test environment
// The test environment will start its own server instance
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  });
}

module.exports = { app, mongoose, connectDB, server }; // Export app and mongoose, and server for potential programmatic closing
