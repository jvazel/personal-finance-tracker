import React, { useState, useContext, useEffect } from 'react';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { TransactionContext } from '../contexts/TransactionContext';

const Transactions = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { refreshTransactions } = useContext(TransactionContext);

  // When month changes, refresh transactions for that month
  useEffect(() => {
    const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
    refreshTransactions(startOfMonth, endOfMonth);
  }, [selectedMonth, refreshTransactions]);

  // Custom renderer for the month picker to only show month/year
  const CustomMonthInput = ({ value, onClick }) => (
    <button className="month-selector-button" onClick={onClick}>
      {value}
    </button>
  );

  return (
    <div className="transactions-container">
      <div className="transactions-header">
        <h2>Transactions</h2>
        <div className="transactions-controls">
          <div className="month-selector">
            <span>Month: </span>
            <DatePicker
              selected={selectedMonth}
              onChange={date => setSelectedMonth(date)}
              dateFormat="MMMM yyyy"
              showMonthYearPicker
              customInput={<CustomMonthInput />}
            />
          </div>
          <button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Hide Form' : 'Add Transaction'}
          </button>
        </div>
      </div>
      {showForm && <TransactionForm onClose={() => setShowForm(false)} selectedMonth={selectedMonth} />}
      <TransactionList selectedMonth={selectedMonth} />
    </div>
  );
};

export default Transactions;