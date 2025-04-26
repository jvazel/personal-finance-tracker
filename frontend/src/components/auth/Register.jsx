import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaUserPlus } from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  const { register, error, currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

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
    
    // Effacer les erreurs spécifiques au champ modifié
    if (validationErrors[e.target.name]) {
      setValidationErrors({
        ...validationErrors,
        [e.target.name]: ''
      });
    }
    
    // Effacer l'erreur générale
    setFormError('');
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;
    
    // Validation du nom d'utilisateur
    if (!formData.username.trim()) {
      errors.username = 'Le nom d\'utilisateur est requis';
      isValid = false;
    } else if (formData.username.length < 3) {
      errors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
      isValid = false;
    }
    
    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'L\'email est requis';
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Veuillez entrer une adresse email valide';
      isValid = false;
    }
    
    // Validation du mot de passe
    if (!formData.password) {
      errors.password = 'Le mot de passe est requis';
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      isValid = false;
    }
    
    // Validation de la confirmation du mot de passe
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
      isValid = false;
    }
    
    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Envoyer les données sans confirmPassword
    const userData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName
    };

    try {
      const success = await register(userData);
      if (success) {
        navigate('/');
      }
    } catch (err) {
      console.error('Erreur d\'inscription:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Inscription</h2>
        
        {formError && (
          <div className="auth-error">
            {formError}
          </div>
        )}
        
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">
                <FaUser className="input-icon" />
                Prénom
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Votre prénom"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName">
                <FaUser className="input-icon" />
                Nom
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Votre nom"
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="username">
              <FaUser className="input-icon" />
              Nom d'utilisateur*
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choisissez un nom d'utilisateur"
              required
              disabled={isSubmitting}
            />
            {validationErrors.username && (
              <div className="input-error">{validationErrors.username}</div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="email">
              <FaEnvelope className="input-icon" />
              Email*
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Votre email"
              required
              disabled={isSubmitting}
              autoComplete="email"
            />
            {validationErrors.email && (
              <div className="input-error">{validationErrors.email}</div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">
              <FaLock className="input-icon" />
              Mot de passe*
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Choisissez un mot de passe"
              required
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            {validationErrors.password && (
              <div className="input-error">{validationErrors.password}</div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">
              <FaLock className="input-icon" />
              Confirmer le mot de passe*
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirmez votre mot de passe"
              required
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            {validationErrors.confirmPassword && (
              <div className="input-error">{validationErrors.confirmPassword}</div>
            )}
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Inscription en cours...' : (
              <>
                <FaUserPlus className="button-icon" />
                S'inscrire
              </>
            )}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            Vous avez déjà un compte ?{' '}
            <Link to="/login" className="auth-link">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;