// frontend/src/components/Sidebar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaChartPie, FaExchangeAlt, FaChartLine, FaHistory, FaBalanceScale, FaFileInvoiceDollar, FaCog, FaTags, FaFlag, FaPiggyBank, FaLightbulb } from 'react-icons/fa';
import '../styles/sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const [showReportsSubmenu, setShowReportsSubmenu] = useState(false);
  const [showSettingsSubmenu, setShowSettingsSubmenu] = useState(false);
  const [showGoalsSubmenu, setShowGoalsSubmenu] = useState(false);

  const toggleReportsSubmenu = (e) => {
    e.preventDefault();
    setShowReportsSubmenu(!showReportsSubmenu);
  };

  const toggleSettingsSubmenu = (e) => {
    e.preventDefault();
    setShowSettingsSubmenu(!showSettingsSubmenu);
  };

  const toggleGoalsSubmenu = (e) => {
    e.preventDefault();
    setShowGoalsSubmenu(!showGoalsSubmenu);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-title">
        <h1>FinaTrack</h1>
      </div>
      <nav>
        <ul className="sidebar-nav">
          <li className={location.pathname === "/" ? 'sidebar-nav-item active' : 'sidebar-nav-item'}>
            <Link to="/"><FaChartPie className="sidebar-icon" /> Tableau de bord</Link>
          </li>
          <li className={location.pathname === "/transactions" ? 'sidebar-nav-item active' : 'sidebar-nav-item'}>
            <Link to="/transactions"><FaExchangeAlt className="sidebar-icon" /> Transactions</Link>
          </li>
          <li className={location.pathname.startsWith("/goals") ? 'sidebar-nav-item active' : 'sidebar-nav-item'}>
            <Link to="/goals" onClick={toggleGoalsSubmenu}><FaFlag className="sidebar-icon" /> Objectifs</Link>
          </li>
          
          {showGoalsSubmenu && (
            <>
              <li className={location.pathname === "/goals/savings" ? 'sidebar-nav-item submenu-item active' : 'sidebar-nav-item submenu-item'}>
                <Link to="/goals/savings"><FaPiggyBank className="sidebar-icon" /> Epargne et suivi des progrès</Link>
              </li>
            </>
          )}
          
          <li className={location.pathname === "/financial-advisor" ? 'sidebar-nav-item active' : 'sidebar-nav-item'}>
            <Link to="/financial-advisor"><FaLightbulb className="sidebar-icon" /> Conseiller financier</Link>
          </li>
          
          <li className={location.pathname.startsWith("/reports") ? 'sidebar-nav-item active' : 'sidebar-nav-item'}>
            <Link to="/reports" onClick={toggleReportsSubmenu}><FaChartLine className="sidebar-icon" /> Rapports</Link>
          </li>
          
          {showReportsSubmenu && (
            <>
              <li className={location.pathname === "/reports/transactions" ? 'sidebar-nav-item submenu-item active' : 'sidebar-nav-item submenu-item'}>
                <Link to="/reports/transactions"><FaHistory className="sidebar-icon" /> Historique des transactions</Link>
              </li>
              <li className={location.pathname === "/reports/savings" ? 'sidebar-nav-item submenu-item active' : 'sidebar-nav-item submenu-item'}>
                <Link to="/reports/savings"><FaBalanceScale className="sidebar-icon" /> Evolution du solde</Link>
              </li>
              <li className={location.pathname === "/reports/recurring-bills" ? 'sidebar-nav-item submenu-item active' : 'sidebar-nav-item submenu-item'}>
                <Link to="/reports/recurring-bills"><FaFileInvoiceDollar className="sidebar-icon" /> Factures récurrentes</Link>
              </li>
              <li className={location.pathname === "/reports/cash-flow-prediction" ? 'sidebar-nav-item submenu-item active' : 'sidebar-nav-item submenu-item'}>
                <Link to="/reports/cash-flow-prediction"><FaChartLine className="sidebar-icon" /> Prédiction de flux de trésorerie</Link>
              </li>
            </>
          )}
          
          <li className={location.pathname.startsWith("/settings") ? 'sidebar-nav-item active' : 'sidebar-nav-item'}>
            <Link to="/settings" onClick={toggleSettingsSubmenu}><FaCog className="sidebar-icon" /> Paramètres</Link>
          </li>
          
          {showSettingsSubmenu && (
            <>
              <li className={location.pathname === "/settings/categories" ? 'sidebar-nav-item submenu-item active' : 'sidebar-nav-item submenu-item'}>
                <Link to="/settings/categories"><FaTags className="sidebar-icon" /> Liste des catégories</Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
