const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['savings', 'expense_limit'],
    required: true
  },
  category: {
    type: String,
    required: function() { return this.type === 'expense_limit'; }
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  targetDate: {
    type: Date,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  milestones: [{
    amount: Number,
    date: Date,
    description: String
  }]
}, { timestamps: true });

// Méthode pour calculer le pourcentage de progression
GoalSchema.methods.getProgressPercentage = function() {
  if (this.targetAmount === 0) return 0;
  return Math.min(100, (this.currentAmount / this.targetAmount) * 100);
};

// Méthode pour calculer le montant restant
GoalSchema.methods.getRemainingAmount = function() {
  return Math.max(0, this.targetAmount - this.currentAmount);
};

// Méthode pour calculer le nombre de jours restants
GoalSchema.methods.getRemainingDays = function() {
  const today = new Date();
  const targetDate = new Date(this.targetDate);
  const diffTime = targetDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

module.exports = mongoose.model('Goal', GoalSchema);