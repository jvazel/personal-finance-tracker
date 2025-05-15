import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { TransactionProvider } from './contexts/TransactionContext';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <TransactionProvider>
          <App />
        </TransactionProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
