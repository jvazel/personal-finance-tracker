import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, error, currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Rediriger si déjà connecté
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Effacer les erreurs lors de la saisie
    setFormError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setFormError('Veuillez remplir tous les champs');
      return false;
    }
    
    // Validation simple de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Veuillez entrer une adresse email valide');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      const success = await login(formData.email, formData.password);
      if (success) {
        // Rediriger vers la page précédente ou la page d'accueil
        const from = location.state?.from?.pathname || '/';
        navigate(from);
      }
    } catch (err) {
      console.error('Erreur de connexion:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="app-logo-header">
        <h1>FinaTrack</h1>
        <p className="app-tagline">Votre assistant de finances personnelles</p>
      </div>
      
      <div className="auth-card">
        <h2>Connexion</h2>
        
        {(formError || error) && (
          <div className="auth-error">
            {formError || error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">
              <FaEnvelope className="input-icon" />
              <span className="label-text">Email</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Votre email"
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">
              <FaLock className="input-icon" />
              <span className="label-text">Mot de passe</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Votre mot de passe"
              disabled={isSubmitting}
              autoComplete="current-password"
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Connexion en cours...' : (
              <>
                <FaSignInAlt className="button-icon" />
                <span className="button-text">Se connecter</span>
              </>
            )}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            Vous n'avez pas de compte ?{' '}
            <Link to="/register" className="auth-link">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;