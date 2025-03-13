import React, { useState, useContext } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { TransactionContext } from '../contexts/TransactionContext';

const categories = ["Food", "Transport", "Utilities", "Entertainment", "Salary", "Freelance", "Savings", "Rent", "Other"];

const TransactionForm = ({ transactionToEdit, onClose, selectedMonth }) => {
  const { addTransaction, updateTransaction } = useContext(TransactionContext);
  
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
      date,
      description,
      amount: parseFloat(amount),
      type,
      category
    };

    try {
      if (transactionToEdit) {
        await updateTransaction(transactionToEdit._id, transactionData);
      } else {
        await addTransaction(transactionData);
      }
      onClose(); // Close the form after successful submission
    } catch (error) {
      console.error('Error saving transaction:', error);
      setFormError('Failed to save transaction. Please try again.');
    }
  };

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      {formError && <div className="form-error">{formError}</div>}
      
      <div className="form-group">
        <label htmlFor="date">Date</label>
        <DatePicker
          id="date"
          selected={date}
          onChange={date => setDate(date)}
          dateFormat="yyyy-MM-dd"
          minDate={startOfMonth}
          maxDate={endOfMonth}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Enter description"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="amount">Amount</label>
        <input
          id="amount"
          type="text"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Enter amount"
        />
      </div>
      
      <div className="form-group">
        <label>Type</label>
        <div>
          <label>
            <input
              type="radio"
              name="type"
              value="expense"
              checked={type === 'expense'}
              onChange={() => setType('expense')}
            />
            Expense
          </label>
          <label style={{ marginLeft: '15px' }}>
            <input
              type="radio"
              name="type"
              value="income"
              checked={type === 'income'}
              onChange={() => setType('income')}
            />
            Income
          </label>
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      
      <div className="form-actions">
        <button type="button" className="cancel" onClick={onClose}>Cancel</button>
        <button type="submit">{transactionToEdit ? 'Update' : 'Add'} Transaction</button>
      </div>
    </form>
  );
};

export default TransactionForm;