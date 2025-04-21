const mongoose = require('mongoose');

const ProgressDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  // KPIs existants
  savingsRate: {
    type: Number,
    default: 0
  },
  expenseReduction: {
    type: Number,
    default: 0
  },
  recommendationsCompleted: {
    type: Number,
    default: 0
  },
  // Nouveaux KPIs
  debtToIncomeRatio: {
    type: Number,
    default: 0
  },
  financialHealthScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  investmentDiversification: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  netWorthChange: {
    type: Number,
    default: 0
  },
  emergencyCoverageMonths: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('ProgressData', ProgressDataSchema);