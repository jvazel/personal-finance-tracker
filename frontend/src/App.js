import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Reports from './components/Reports';
import Goals from './components/Goals';
import Settings from './components/Settings';
import FinancialAdvisor from './components/FinancialAdvisor';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import fr from 'date-fns/locale/fr';
import './styles/auth.css';

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
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;