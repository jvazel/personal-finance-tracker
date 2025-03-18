import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/sidebar.css';

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
            <Link to="/">Tableau de bord</Link>
          </li>
          <li className={location.pathname === "/transactions" ? 'sidebar-nav-item active' : 'sidebar-nav-item'}>
            <Link to="/transactions">Transactions</Link>
          </li>
          <li className={location.pathname.startsWith("/reports") ? 'sidebar-nav-item active' : 'sidebar-nav-item'}>
            <Link to="/reports" onClick={toggleReportsSubmenu}>Rapports</Link>
          </li>
          
          {showReportsSubmenu && (
            <>
              <li className={location.pathname === "/reports/transactions" ? 'sidebar-nav-item submenu-item active' : 'sidebar-nav-item submenu-item'}>
                <Link to="/reports/transactions">Historique des transactions</Link>
              </li>
              <li className={location.pathname === "/reports/savings" ? 'sidebar-nav-item submenu-item active' : 'sidebar-nav-item submenu-item'}>
                <Link to="/reports/savings">Evolution du solde</Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;