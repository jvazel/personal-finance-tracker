import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/dashboard/Dashboard';
import Transactions from './components/transactions/Transactions';
import Reports from './components/reports/Reports';
import Goals from './components/goals/Goals';
import Settings from './components/settings/Settings';
import FinancialAdvisor from './components/financial-advisor/FinancialAdvisor';
import Trends from './components/trends/Trends';
import Sidebar from './components/layout/Sidebar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/common/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import fr from 'date-fns/locale/fr';
import './styles/auth.css';
import TaxDashboard from './components/tax/TaxDashboard';

// Register French locale
registerLocale('fr', fr);
setDefaultLocale('fr');

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={
            <div className="app-container">
              <Sidebar />
              <div className="main-content">
                <Dashboard />
              </div>
            </div>
          } />
          <Route path="/transactions" element={
            <div className="app-container">
              <Sidebar />
              <div className="main-content">
                <Transactions />
              </div>
            </div>
          } />
          <Route path="/reports/*" element={
            <div className="app-container">
              <Sidebar />
              <div className="main-content">
                <Reports />
              </div>
            </div>
          } />
          <Route path="/goals/*" element={
            <div className="app-container">
              <Sidebar />
              <div className="main-content">
                <Goals />
              </div>
            </div>
          } />
          <Route path="/financial-advisor" element={
            <div className="app-container">
              <Sidebar />
              <div className="main-content">
                <FinancialAdvisor />
              </div>
            </div>
          } />
          <Route path="/settings/*" element={
            <div className="app-container">
              <Sidebar />
              <div className="main-content">
                <Settings />
              </div>
            </div>
          } />
          <Route path="/tax" element={
            <div className="app-container">
              <Sidebar />
              <div className="main-content">
                <TaxDashboard />
              </div>
            </div>
          } />
          <Route path="/trends" element={
            <div className="app-container">
              <Sidebar />
              <div className="main-content">
                <Trends />
              </div>
            </div>
          } />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;