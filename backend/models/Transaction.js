const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Veuillez ajouter une description']
  },
  amount: {
    type: Number,
    required: [true, 'Veuillez ajouter un montant']
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Veuillez spécifier le type de transaction']
  },
  category: {
    type: String,
    required: [true, 'Veuillez spécifier une catégorie']
  },
  date: {
    type: Date,
    default: Date.now
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema);