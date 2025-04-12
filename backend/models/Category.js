// backend/models/Category.js
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['income', 'expense', 'both'],
    default: 'both'
  },
  color: {
    type: String,
    default: '#3b82f6' // Default blue color
  },
  icon: {
    type: String,
    default: 'tag' // Default icon name
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taxable: {
    type: Boolean,
    default: false
  },
  taxDeductible: {
    type: Boolean,
    default: false
  },
  taxCategory: {
    type: String,
    enum: ['none', 'income', 'deduction', 'donation', 'investment'],
    default: 'none'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Clé composée pour garantir l'unicité du nom de catégorie par utilisateur
CategorySchema.index({ name: 1, user: 1 }, { unique: true });

// Update the updatedAt timestamp before saving
CategorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Category', CategorySchema);