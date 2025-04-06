const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String
  }
});

const goalSchema = new mongoose.Schema({
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
    required: function() {
      return this.type === 'expense_limit';
    }
  },
  targetAmount: {
    type: Number,
    required: true
  },
  currentAmount: {
    type: Number,
    default: 0
  },
  targetDate: {
    type: Date,
    required: true
  },
  milestones: [milestoneSchema],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Méthodes virtuelles pour calculer les propriétés dérivées
goalSchema.virtual('remainingAmount').get(function() {
  return Math.max(0, this.targetAmount - this.currentAmount);
});

goalSchema.virtual('progressPercentage').get(function() {
  return Math.min(100, (this.currentAmount / this.targetAmount) * 100);
});

goalSchema.virtual('isCompleted').get(function() {
  return this.currentAmount >= this.targetAmount;
});

goalSchema.virtual('remainingDays').get(function() {
  const today = new Date();
  const targetDate = new Date(this.targetDate);
  const diffTime = targetDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Configurer pour inclure les virtuels lors de la conversion en JSON
goalSchema.set('toJSON', { virtuals: true });
goalSchema.set('toObject', { virtuals: true });

const Goal = mongoose.model('Goal', goalSchema);

module.exports = Goal;