import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export const TransactionContext = createContext();

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use useCallback to prevent unnecessary re-renders
  const refreshTransactions = useCallback(async (startDate, endDate) => {
    setLoading(true);
    setError(null);
    try {
      // If no dates provided, use current month
      if (!startDate || !endDate) {
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
      
      const response = await api.get('/transactions', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      setTransactions(response.data);
    } catch (err) {
      setError(err);
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load with current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    refreshTransactions(startOfMonth, endOfMonth);
  }, [refreshTransactions]);

  // Rest of the context remains the same
  // Update these methods to use the api utility
  const addTransaction = async (transactionData) => {
    try {
      const response = await api.post('/transactions', transactionData);
      return response.data;
    } catch (err) {
      console.error('Error adding transaction:', err);
      throw err;
    }
  };

  const updateTransaction = async (id, transactionData) => {
    try {
      const response = await api.put(`/transactions/${id}`, transactionData);
      return response.data;
    } catch (err) {
      console.error('Error updating transaction:', err);
      throw err;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
    } catch (err) {
      console.error('Error deleting transaction:', err);
      throw err;
    }
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        loading,
        error,
        refreshTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};