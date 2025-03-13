// backend/models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: String, required: true }, // Example categories will be handled in the frontend
}, { timestamps: true }); // Optional: Adds createdAt and updatedAt timestamps

module.exports = mongoose.model('Transaction', transactionSchema);