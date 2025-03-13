import React, { useState, useContext } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { TransactionContext } from '../contexts/TransactionContext';

const categories = ["Food", "Transport", "Utilities", "Entertainment", "Salary", "Freelance", "Savings", "Rent", "Other"];

const TransactionForm = ({ transactionToEdit, onClose, selectedMonth }) => {
  const { addTransaction, updateTransaction, refreshTransactions } = useContext(TransactionContext);
  
  // Calculate the limits of the selected month
  const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
  const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
  
  // Initialize date within the limits of the selected month
  let initialDate = transactionToEdit ? new Date(transactionToEdit.date) : new Date(selectedMonth);
  // Ensure date is within the selected month
  if (initialDate < startOfMonth || initialDate > endOfMonth) {
    initialDate = new Date(selectedMonth);
  }
  
  const [date, setDate] = useState(initialDate);
  const [description, setDescription] = useState(transactionToEdit ? transactionToEdit.description : '');
  const [amount, setAmount] = useState(transactionToEdit ? transactionToEdit.amount : '');
  const [type, setType] = useState(transactionToEdit ? transactionToEdit.type : 'expense');
  const [category, setCategory] = useState(transactionToEdit ? transactionToEdit.category : categories[0]);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!description || !amount || !type || !category) {
      setFormError('Please fill in all fields.');
      return;
    }
    if (isNaN(amount)) {
      setFormError('Amount must be a number.');
      return;
    }

    const transactionData = {
      date: date,
      description,
      amount: parseFloat(amount),
      type,
      category,
    };

    try {
      if (transactionToEdit) {
        await updateTransaction(transactionToEdit._id, transactionData);
      } else {
        await addTransaction(transactionData);
      }
      // Refresh transactions for the selected month
      refreshTransactions(startOfMonth, endOfMonth);
      onClose(); // Close the form after successful submission
    } catch (error) {
      setFormError('Failed to save transaction.');
      console.error("Error saving transaction:", error);
    }
  };

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      {formError && <p className="error-message">{formError}</p>}

      <div className="form-group">
        <label htmlFor="date">Date:</label>
        <DatePicker
          selected={date}
          onChange={(date) => setDate(date)}
          dateFormat="yyyy-MM-dd"
          minDate={startOfMonth}
          maxDate={endOfMonth}
        />
      </div>
      
      {/* Rest of the form remains the same */}
      <div className="form-group">
        <label htmlFor="description">Description:</label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="amount">Amount:</label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="type">Type:</label>
        <div>
          <label>
            <input
              type="radio"
              name="type"
              value="expense"
              checked={type === 'expense'}
              onChange={(e) => setType(e.target.value)}
            /> Expense
          </label>
          <label>
            <input
              type="radio"
              name="type"
              value="income"
              checked={type === 'income'}
              onChange={(e) => setType(e.target.value)}
            /> Income
          </label>
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="category">Category:</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          {categories.map((cat, index) => (
            <option key={index} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="form-actions">
        <button type="submit">{transactionToEdit ? 'Update Transaction' : 'Add Transaction'}</button>
        <button type="button" className="cancel" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
};

export default TransactionForm;