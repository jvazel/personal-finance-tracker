import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/sidebar.css';
// Import des icônes
import { FaChartPie, FaExchangeAlt, FaChartLine, FaHistory, FaBalanceScale, FaFileInvoiceDollar } from 'react-icons/fa';

const Sidebar = () => {
  const location = useLocation();
  const [showReportsSubmenu, setShowReportsSubmenu] = useState(false);

  const toggleReportsSubmenu = (e) => {
    e.preventDefault();
    setShowReportsSubmenu(!showReportsSubmenu);
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
            </>
          )}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;