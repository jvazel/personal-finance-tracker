import React from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import ReportTransactionHistory from './ReportTransactionHistory';
import ReportSavings from './ReportSavings';
import '../styles/reports.css';

const Reports = () => {
  return (
    <div className="reports-container">
      <div className="reports-content">
        <Routes>
          <Route path="transactions" element={<ReportTransactionHistory />} />
          <Route path="savings" element={<ReportSavings />} />
          <Route path="/" element={<Navigate to="transactions" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default Reports;