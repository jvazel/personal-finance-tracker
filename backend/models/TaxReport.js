const mongoose = require('mongoose');

const taxReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  taxableIncome: {
    type: Number,
    required: true,
    default: 0
  },
  taxDeductions: {
    type: Number,
    required: true,
    default: 0
  },
  netTaxableIncome: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['generated', 'submitted', 'accepted', 'rejected'],
    default: 'generated'
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  submittedAt: {
    type: Date
  },
  notes: {
    type: String
  }
}, { timestamps: true });

// Index composé pour s'assurer qu'un utilisateur n'a qu'un rapport par année
taxReportSchema.index({ user: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('TaxReport', taxReportSchema);