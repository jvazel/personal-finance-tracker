import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Erreur capturée par ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
    
    // Vous pourriez envoyer l'erreur à un service de suivi des erreurs ici
  }

  render() {
    if (this.state.hasError) {
      // Vérifier si l'erreur est liée à une suspension
      const isSuspenseError = this.state.error && 
        this.state.error.message && 
        this.state.error.message.includes('suspended while responding to synchronous input');
      
      if (isSuspenseError) {
        return (
          <div className="error-boundary suspense-error">
            <h2>Chargement en cours...</h2>
            <p>L'application est en train de charger des données. Veuillez patienter.</p>
          </div>
        );
      }
      
      return (
        <div className="error-boundary">
          <h2>Une erreur est survenue</h2>
          <p>Nous sommes désolés, quelque chose s'est mal passé.</p>
          <details>
            <summary>Détails de l'erreur (pour les développeurs)</summary>
            <p>{this.state.error && this.state.error.toString()}</p>
          </details>
          <button 
            className="error-reset-button"
            onClick={() => window.location.reload()}
          >
            Rafraîchir la page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;