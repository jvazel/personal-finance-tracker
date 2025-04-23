import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ReportTransactionHistory from './ReportTransactionHistory';
import ReportSavings from './ReportSavings';
import ReportRecurringBills from './ReportRecurringBills'; 
import ReportCashFlowPrediction from './ReportCashFlowPrediction';
import ReportExpenses from './ReportExpenses';
import RecurringExpenses from './RecurringExpenses';

const Reports = () => {
  return (
    <div className="reports-container">
      <div className="reports-content">
        <Routes>
          <Route path="transactions" element={<ReportTransactionHistory />} />
          <Route path="savings" element={<ReportSavings />} />
          <Route path="recurring-bills" element={<ReportRecurringBills />} />
          <Route path="cash-flow-prediction" element={<ReportCashFlowPrediction />} />
          <Route path="expenses" element={<ReportExpenses />} />
          <Route path="recurring-expenses" element={<RecurringExpenses />} />
          <Route path="/" element={<Navigate to="transactions" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default Reports;