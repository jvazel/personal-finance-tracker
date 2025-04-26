import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configuration d'Axios avec le token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Vérifier si l'utilisateur est connecté au chargement
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/me`);
        setCurrentUser(res.data.user);
      } catch (err) {
        console.error('Error loading user:', err);
        setToken(null);
        setError('Session expirée. Veuillez vous reconnecter.');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Fonction de connexion
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        email,
        password
      });
      
      setToken(res.data.token);
      setCurrentUser(res.data.user);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fonction d'inscription
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/register`, userData);
      
      setToken(res.data.token);
      setCurrentUser(res.data.user);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur d\'inscription');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    setToken(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!currentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};