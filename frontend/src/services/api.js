import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors (token expired, etc.)
    if (error.response && error.response.status === 401) {
      // Redirect to login or refresh token
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/*
// Ajouter un intercepteur pour logger les requêtes
api.interceptors.request.use(config => {
  console.log('Requête API envoyée:', config.method.toUpperCase(), config.url);
  console.log('Headers d\'authentification:', config.headers.Authorization);
  return config;
});

// Ajouter un intercepteur pour logger les réponses
api.interceptors.response.use(
  response => {
    console.log('Réponse API reçue:', response.status, response.config.url);
    return response;
  },
  error => {
    console.error('Erreur API:', error.response ? error.response.status : 'Pas de réponse', 
                 error.config ? error.config.url : 'URL inconnue');
    return Promise.reject(error);
  }
);
*/

export default api;