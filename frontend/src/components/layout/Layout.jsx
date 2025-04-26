import React from 'react';
import Sidebar from './Sidebar';
import PageTransition from '../common/PageTransition';

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
};

export default Layout;