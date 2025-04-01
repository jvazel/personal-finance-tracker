import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Reports from './components/Reports';
import Goals from './components/Goals';
import Settings from './components/Settings';
import Sidebar from './components/Sidebar';
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import fr from 'date-fns/locale/fr';

// Register French locale
registerLocale('fr', fr);
setDefaultLocale('fr');

function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/reports/*" element={<Reports />} />
          <Route path="/goals/*" element={<Goals />} />
          <Route path="/settings/*" element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;