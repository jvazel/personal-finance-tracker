import React, { useState, useContext, useEffect } from 'react';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { TransactionContext } from '../contexts/TransactionContext';
import Modal from './Modal';
import { format, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

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

  // Navigation functions for month selector
  const goToPreviousMonth = () => {
    setSelectedMonth(prevDate => subMonths(prevDate, 1));
  };

  const goToNextMonth = () => {
    setSelectedMonth(prevDate => addMonths(prevDate, 1));
  };

  // Custom renderer for the month picker to only show month/year
  const CustomMonthInput = ({ value, onClick }) => (
    <div className="month-selector-custom">
      <button className="month-nav-button" onClick={goToPreviousMonth}>
        <span>&#9664;</span>
      </button>
      <button className="month-display-button" onClick={onClick}>
        {value}
      </button>
      <button className="month-nav-button" onClick={goToNextMonth}>
        <span>&#9654;</span>
      </button>
    </div>
  );

  // Fonction pour gérer la fermeture du formulaire et rafraîchir les données
  const handleFormClose = () => {
    setShowForm(false);
    // Rafraîchir les transactions après la fermeture du formulaire
    const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
    refreshTransactions(startOfMonth, endOfMonth);
  };

  return (
    <div className="transactions-container">
      <div className="transactions-header">
        <h2>Transactions</h2>
        <div className="transactions-controls">
          <div className="month-selector">
            <span className="month-label">Mois : </span>
            <DatePicker
              selected={selectedMonth}
              onChange={date => setSelectedMonth(date)}
              dateFormat="MMMM yyyy"
              showMonthYearPicker
              locale="fr"
              customInput={<CustomMonthInput />}
            />
          </div>
          <button onClick={() => setShowForm(true)}>Ajouter une transaction</button>
        </div>
      </div>

      <TransactionList selectedMonth={selectedMonth} />

      <Modal 
        isOpen={showForm} 
        onClose={handleFormClose} 
        title="Ajouter une nouvelle transaction"
      >
        <TransactionForm 
          onClose={handleFormClose} 
          selectedMonth={selectedMonth} 
        />
      </Modal>
    </div>
  );
};

export default Transactions;