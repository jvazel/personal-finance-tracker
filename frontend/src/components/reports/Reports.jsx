import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ReportTransactionHistory from './ReportTransactionHistory';
import ReportSavings from './ReportSavings';
import ReportRecurringBills from './ReportRecurringBills'; 
import ReportCashFlowPrediction from './ReportCashFlowPrediction';
import ReportExpenses from './ReportExpenses';
import RecurringExpenses from './RecurringExpenses';
import CategoryEvolutionReport from './CategoryEvolutionReport'; // Import the new report

const Reports = () => {
  return (
    <div className="reports-container">
      {/* TODO: Consider if a sub-navigation or menu for reports should be here */}
      {/* For now, it only acts as a router outlet based on its previous structure */}
      <div className="reports-content">
        <Routes>
          <Route path="transactions" element={<ReportTransactionHistory />} />
          <Route path="savings" element={<ReportSavings />} />
          <Route path="recurring-bills" element={<ReportRecurringBills />} />
          <Route path="cash-flow-prediction" element={<ReportCashFlowPrediction />} />
          <Route path="expenses" element={<ReportExpenses />} />
          <Route path="recurring-expenses" element={<RecurringExpenses />} />
          <Route path="category-evolution" element={<CategoryEvolutionReport />} /> {/* Add new route */}
          <Route path="/" element={<Navigate to="transactions" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default Reports;