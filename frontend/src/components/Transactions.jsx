import React, { useState, useContext, useEffect } from 'react';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { TransactionContext } from '../contexts/TransactionContext';
import Modal from './Modal';
import { addMonths, subMonths } from 'date-fns';
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
  // Update the CustomMonthInput component
  // Material Design inspired month selector
  const MaterialMonthInput = ({ value, onClick }) => (
    <div className="month-picker-container">
      <button className="month-display-button material" onClick={onClick}>
        <span className="month-text">{value}</span>
        <span className="dropdown-icon">▾</span>
      </button>
    </div>
  );
  
  // Custom input component that capitalizes the first letter of the month
  const CustomMonthInput = ({ value, onClick }) => {
    // Capitalize the first letter of the month
    const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1);
    
    return (
      <div className="month-selector-custom">
        <div className="month-nav-button" onClick={goToPreviousMonth} title="Mois précédent">
          <span>&#10094;</span>
        </div>
        <div className="month-display-button" onClick={onClick}>
          {capitalizedValue}
        </div>
        <div className="month-nav-button" onClick={goToNextMonth} title="Mois suivant">
          <span>&#10095;</span>
        </div>
      </div>
    );
  };

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
        <div className="transactions-controls">
          <div className="month-selector">
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