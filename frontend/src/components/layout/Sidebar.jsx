import React, { useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { FaChartPie, FaChartLine, FaFileImport } from 'react-icons/fa';
//import '../styles/sidebar.css';

const Sidebar = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const [reportsOpen, setReportsOpen] = useState(false);

  const toggleReports = () => {
    setReportsOpen(!reportsOpen);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="app-title">
          FinaTrack
        </h1>
      </div>
      
      {currentUser && (
        <div className="user-info">
          <div className="user-avatar">
            {currentUser.firstName ? currentUser.firstName.charAt(0) : currentUser.email.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <p className="user-name">{currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : currentUser.email}</p>
            <p className="user-email">{currentUser.email}</p>
          </div>
        </div>
      )}
      
      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} end>
          <span className="nav-icon">📊</span>
          <span className="nav-text">Tableau de bord</span>
        </NavLink>
        
        <NavLink to="/transactions" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">💰</span>
          <span className="nav-text">Transactions</span>
        </NavLink>
        
        <div className={`nav-item-with-submenu ${reportsOpen ? 'open' : ''}`}>
          <div className="nav-link-with-arrow" onClick={toggleReports}>
            <div className="nav-link-content">
              <span className="nav-icon">📈</span>
              <span className="nav-text">Rapports</span>
            </div>
            <span className={`submenu-arrow ${reportsOpen ? 'open' : ''}`}>▼</span>
          </div>
          
          {reportsOpen && (
            <div className="submenu">
              <NavLink to="/reports/transactions" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>
                <span className="submenu-icon">📝</span>
                <span className="submenu-text">Historique des transactions</span>
              </NavLink>
              <NavLink to="/reports/savings" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>
                <span className="submenu-icon">💹</span>
                <span className="submenu-text">Evolution du solde</span>
              </NavLink>
              <NavLink to="/reports/expenses" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>
                <span className="submenu-icon"><FaChartPie /></span>
                <span className="submenu-text">Evolution des dépenses</span>
              </NavLink>
              <NavLink to="/reports/recurring-bills" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>
                <span className="submenu-icon">🔄</span>
                <span className="submenu-text">Factures récurrentes</span>
              </NavLink>
              <NavLink to="/reports/cash-flow-prediction" className={({ isActive }) => isActive ? 'submenu-link active' : 'submenu-link'}>
                <span className="submenu-icon">🔮</span>
                <span className="submenu-text">Prédiction de flux de trésorerie</span>
              </NavLink>
            </div>
          )}
        </div>
        
        <NavLink to="/goals" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">🎯</span>
          <span className="nav-text">Objectifs</span>
        </NavLink>
        
        <NavLink to="/trends" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon"><FaChartLine /></span>
          <span className="nav-text">Tendances</span>
        </NavLink>
        
        <NavLink to="/financial-advisor" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">💡</span>
          <span className="nav-text">Conseiller</span>
        </NavLink>

        <NavLink to="/tax" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">📑</span>
          <span className="nav-text">Services Fiscaux</span>
        </NavLink>
        
        <NavLink to="/import-export" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon"><FaFileImport /></span>
          <span className="nav-text">Import/Export</span>
        </NavLink>
        
        <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <span className="nav-icon">⚙️</span>
          <span className="nav-text">Paramètres</span>
        </NavLink>
      </nav>
      
      <div className="sidebar-footer">
        <button className="logout-button" onClick={logout}>
          <span className="nav-icon">🚪</span>
          <span className="nav-text">Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
