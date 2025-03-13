import React from 'react';
import ReportTransactionHistory from './ReportTransactionHistory';
import ReportSavings from './ReportSavings';

const Reports = () => {
  return (
    <div className="reports-container">
      <div className="report-section">
        <ReportTransactionHistory />
      </div>
      <div className="report-section">
        <ReportSavings />
      </div>
    </div>
  );
};

export default Reports;