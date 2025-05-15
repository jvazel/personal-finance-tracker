import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';
import TransitionWrapper from './components/common/TransitionWrapper';
import ProtectedRoute from './components/common/ProtectedRoute';

// Regroupement logique des imports paresseux
// Pages d'authentification
const Login = lazy(() => import('./components/auth/Login'));
const Register = lazy(() => import('./components/auth/Register'));

// Pages principales
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const Transactions = lazy(() => import('./components/transactions/Transactions'));

// Pages de rapports
const Reports = lazy(() => import('./components/reports/Reports'));
const IncomeExpenseReport = lazy(() => import('./components/reports/IncomeExpenseReport'));
const TaxDashboard = lazy(() => import('./components/tax/TaxDashboard'));
const TaxReportDetail = lazy(() => import('./components/tax/TaxReportDetail'));

// Pages d'analyse et de planification
const Goals = lazy(() => import('./components/goals/Goals'));
const FinancialAdvisor = lazy(() => import('./components/financial-advisor/FinancialAdvisor'));
const Trends = lazy(() => import('./components/trends/Trends'));
const InvestmentSimulator = lazy(() => import('./components/simulator/InvestmentSimulator'));

// Pages utilitaires
const Settings = lazy(() => import('./components/settings/Settings'));
const ImportExport = lazy(() => import('./components/import-export/ImportExport'));

// Composant de route avec Suspense réutilisable
const SuspenseRoute = ({ element }) => (
  <Layout>
    <TransitionWrapper>
      <Suspense fallback={<LoadingSpinner />}>
        {element}
      </Suspense>
    </TransitionWrapper>
  </Layout>
);

function App() {
  const location = useLocation();
  
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public routes */}
            <Route path="/login" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Login />
              </Suspense>
            } />
            <Route path="/register" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Register />
              </Suspense>
            } />
    
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<SuspenseRoute element={<Dashboard />} />} />
              <Route path="/transactions" element={<SuspenseRoute element={<Transactions />} />} />
              <Route path="/reports/*" element={<SuspenseRoute element={<Reports />} />} />
              <Route path="/reports/income-expense" element={<SuspenseRoute element={<IncomeExpenseReport />} />} />
              <Route path="/goals/*" element={<SuspenseRoute element={<Goals />} />} />
              <Route path="/financial-advisor" element={<SuspenseRoute element={<FinancialAdvisor />} />} />
              <Route path="/settings/*" element={<SuspenseRoute element={<Settings />} />} />
              <Route path="/tax" element={<SuspenseRoute element={<TaxDashboard />} />} />
              <Route path="/tax/reports/:id" element={<SuspenseRoute element={<TaxReportDetail />} />} />
              <Route path="/trends" element={<SuspenseRoute element={<Trends />} />} />
              <Route path="/import-export" element={<SuspenseRoute element={<ImportExport />} />} />
              <Route path="/simulateur" element={<SuspenseRoute element={<InvestmentSimulator />} />} />
            </Route>
          </Routes>
        </AnimatePresence>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;