// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const transactionRoutes = require('./routes/transactionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const categoryController = require('./controllers/categoryController');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // for parsing application/json

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('MongoDB Connected');
    // Initialize default categories after successful connection
    categoryController.initializeDefaultCategories();
})
.catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.get('/api/dashboard-data', require('./controllers/transactionController').getDashboardData); // Dashboard data route

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});