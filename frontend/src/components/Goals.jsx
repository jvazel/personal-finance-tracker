import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GoalsSavings from './GoalsSavings';

const Goals = () => {
  return (
    <div className="goals-container">
      <div className="goals-content">
        <Routes>
          <Route path="savings" element={<GoalsSavings />} />
          <Route path="/" element={<Navigate to="savings" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default Goals;