import React, { Suspense, lazy, useTransition } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import fr from 'date-fns/locale/fr';
import { AuthProvider } from './context/AuthContext';
import { AnimatePresence } from 'framer-motion';

// Components
import LoadingSpinner from './components/common/LoadingSpinner';
import Sidebar from './components/layout/Sidebar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';

// Styles
import './styles/auth.css';

// Lazy load components
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const Transactions = lazy(() => import('./components/transactions/Transactions'));
const Reports = lazy(() => import('./components/reports/Reports'));
const Goals = lazy(() => import('./components/goals/Goals'));
const Settings = lazy(() => import('./components/settings/Settings'));
const FinancialAdvisor = lazy(() => import('./components/financial-advisor/FinancialAdvisor'));
const Trends = lazy(() => import('./components/trends/Trends'));
const TaxDashboard = lazy(() => import('./components/tax/TaxDashboard'));
const TaxReportDetail = lazy(() => import('./components/tax/TaxReportDetail'));
const ImportExport = lazy(() => import('./components/import-export/ImportExport'));

// Register French locale
registerLocale('fr', fr);
setDefaultLocale('fr');

// Wrapper component to handle transitions
const TransitionWrapper = ({ children }) => {
  const [isPending, startTransition] = useTransition();
  
  return (
    <React.Fragment>
      {isPending ? <LoadingSpinner /> : children}
    </React.Fragment>
  );
};

function App() {
  const location = useLocation();
  
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
    
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={
                <Layout>
                  <TransitionWrapper>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Dashboard />
                    </Suspense>
                  </TransitionWrapper>
                </Layout>
              } />
              <Route path="/transactions" element={
                <Layout>
                  <TransitionWrapper>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Transactions />
                    </Suspense>
                  </TransitionWrapper>
                </Layout>
              } />
              <Route path="/reports/*" element={
                <Layout>
                  <TransitionWrapper>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Reports />
                    </Suspense>
                  </TransitionWrapper>
                </Layout>
              } />
              {/* Autres routes */}
              <Route path="/goals/*" element={
                <Layout>
                  <TransitionWrapper>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Goals />
                    </Suspense>
                  </TransitionWrapper>
                </Layout>
              } />
              <Route path="/financial-advisor" element={
                <Layout>
                  <TransitionWrapper>
                    <Suspense fallback={<LoadingSpinner />}>
                      <FinancialAdvisor />
                    </Suspense>
                  </TransitionWrapper>
                </Layout>
              } />
              <Route path="/settings/*" element={
                <Layout>
                  <TransitionWrapper>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Settings />
                    </Suspense>
                  </TransitionWrapper>
                </Layout>
              } />
              <Route path="/tax" element={
                <Layout>
                  <TransitionWrapper>
                    <Suspense fallback={<LoadingSpinner />}>
                      <TaxDashboard />
                    </Suspense>
                  </TransitionWrapper>
                </Layout>
              } />
              <Route path="/tax/reports/:id" element={
                <Layout>
                  <TransitionWrapper>
                    <Suspense fallback={<LoadingSpinner />}>
                      <TaxReportDetail />
                    </Suspense>
                  </TransitionWrapper>
                </Layout>
              } />
              <Route path="/trends" element={
                <Layout>
                  <TransitionWrapper>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Trends />
                    </Suspense>
                  </TransitionWrapper>
                </Layout>
              } />
              <Route path="/import-export" element={
                <Layout>
                  <TransitionWrapper>
                    <Suspense fallback={<LoadingSpinner />}>
                      <ImportExport />
                    </Suspense>
                  </TransitionWrapper>
                </Layout>
              } />
            </Route>
          </Routes>
        </AnimatePresence>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;