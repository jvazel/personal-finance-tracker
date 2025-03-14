import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="sidebar">
      <nav>
        <ul className="sidebar-nav">
          <li className={location.pathname === "/" ? 'sidebar-nav-item active' : 'sidebar-nav-item'}>
            <Link to="/">Tableau de bord</Link>
          </li>
          <li className={location.pathname === "/transactions" ? 'sidebar-nav-item active' : 'sidebar-nav-item'}>
            <Link to="/transactions">Transactions</Link>
          </li>
          <li className={location.pathname === "/reports" ? 'sidebar-nav-item active' : 'sidebar-nav-item'}>
            <Link to="/reports">Rapports</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;