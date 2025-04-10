const mongoose = require('mongoose');

const FinancialProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  savingsRate: {
    type: Number,
    required: true
  },
  expenseReduction: {
    type: Number,
    default: 0
  },
  recommendationsCompleted: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FinancialProgress', FinancialProgressSchema);