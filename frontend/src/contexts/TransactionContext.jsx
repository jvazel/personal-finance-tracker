import React, { createContext, useState, useEffect, useCallback, useReducer } from 'react';
import api from '../utils/api';

export const TransactionContext = createContext();

// Définir un reducer pour gérer les états des transactions
const transactionReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TRANSACTIONS':
      return {
        ...state,
        transactions: action.payload,
        loading: false,
        error: null
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'SET_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

export const TransactionProvider = ({ children }) => {
  const initialState = {
    transactions: [],
    loading: true,
    error: null
  };

  const [state, dispatch] = useReducer(transactionReducer, initialState);
  const { transactions, loading, error } = state;

  // Use useCallback to prevent unnecessary re-renders
  const refreshTransactions = useCallback(async (startDate, endDate) => {
    dispatch({ type: 'SET_LOADING' });
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
      dispatch({ type: 'SET_TRANSACTIONS', payload: response.data });
    } catch (err) {
      console.error('Error fetching transactions:', err);
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Erreur lors du chargement des transactions' });
    }
  }, []);

  useEffect(() => {
    // Initial load with current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    refreshTransactions(startOfMonth, endOfMonth);
  }, [refreshTransactions]);

  // Optimiser les méthodes avec gestion d'erreur améliorée
  const addTransaction = async (transactionData) => {
    try {
      const response = await api.post('/transactions', transactionData);
      // Rafraîchir automatiquement les transactions après ajout
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      await refreshTransactions(startOfMonth, endOfMonth);
      return response.data;
    } catch (err) {
      console.error('Error adding transaction:', err);
      throw new Error(err.response?.data?.message || 'Erreur lors de l\'ajout de la transaction');
    }
  };

  const updateTransaction = async (id, transactionData) => {
    try {
      const response = await api.put(`/transactions/${id}`, transactionData);
      // Rafraîchir automatiquement les transactions après mise à jour
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      await refreshTransactions(startOfMonth, endOfMonth);
      return response.data;
    } catch (err) {
      console.error('Error updating transaction:', err);
      throw new Error(err.response?.data?.message || 'Erreur lors de la mise à jour de la transaction');
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      // Rafraîchir automatiquement les transactions après suppression
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      await refreshTransactions(startOfMonth, endOfMonth);
    } catch (err) {
      console.error('Error deleting transaction:', err);
      throw new Error(err.response?.data?.message || 'Erreur lors de la suppression de la transaction');
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