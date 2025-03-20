import React, { useState, useContext, useEffect } from 'react';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { TransactionContext } from '../contexts/TransactionContext';
import Modal from './Modal';
import { addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaPlus } from 'react-icons/fa'; // Import the plus icon
import axios from 'axios'; // Add axios import

const Transactions = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { refreshTransactions } = useContext(TransactionContext);
  // Add new state variables for financial summary
  const [financialSummary, setFinancialSummary] = useState({
    savings: 0,
    totalIncome: 0,
    totalExpenses: 0
  });
  const [summaryLoading, setSummaryLoading] = useState(true);

  // When month changes, refresh transactions for that month
  useEffect(() => {
    const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
    refreshTransactions(startOfMonth, endOfMonth);
    
    // Fetch financial summary for the selected month
    fetchFinancialSummary(startOfMonth, endOfMonth);
  }, [selectedMonth, refreshTransactions]);

  // Function to fetch financial summary for the selected month
  const fetchFinancialSummary = async (startDate, endDate) => {
    setSummaryLoading(true);
    try {
      // Format dates for API (YYYY-MM-DD)
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      console.log('Fetching summary for:', { formattedStartDate, formattedEndDate });
      
      // Utilisez l'URL complète avec le protocole et le domaine
      const response = await axios.get('/api/transactions/monthly-summary', {
        params: { startDate: formattedStartDate, endDate: formattedEndDate }
      });
      
      console.log('Summary response:', response.data);
      
      setFinancialSummary({
        savings: response.data.savings || 0,
        totalIncome: response.data.totalIncome || 0,
        totalExpenses: response.data.totalExpenses || 0
      });
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      // En cas d'erreur, définir des valeurs par défaut
      setFinancialSummary({
        savings: 0,
        totalIncome: 0,
        totalExpenses: 0
      });
    } finally {
      setSummaryLoading(false);
    }
  };

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
    fetchFinancialSummary(startOfMonth, endOfMonth);
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
          
          {/* Add financial summary section */}
          <div className="transactions-summary">
            <div className={`summary-item ${financialSummary.savings >= 0 ? 'income' : 'expense'}`}>
              <span className="summary-label">Solde</span>
              <span className="summary-value">
                {summaryLoading ? '...' : 
                  `${financialSummary.savings >= 0 ? 
                    financialSummary.savings.toFixed(2) : 
                    `-${Math.abs(financialSummary.savings).toFixed(2)}`} €`}
              </span>
            </div>
            <div className="summary-item income">
              <span className="summary-label">Revenus</span>
              <span className="summary-value">
                {summaryLoading ? '...' : `${financialSummary.totalIncome.toFixed(2)} €`}
              </span>
            </div>
            <div className="summary-item expense">
              <span className="summary-label">Dépenses</span>
              <span className="summary-value">
                {summaryLoading ? '...' : `${financialSummary.totalExpenses.toFixed(2)} €`}
              </span>
            </div>
          </div>
          
          <div 
            className="add-transaction-button" 
            onClick={() => setShowForm(true)}
            title="Ajouter une transaction"
          >
            <FaPlus />
          </div>
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