import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // En production, vous pourriez envoyer l'erreur à un service de suivi
    if (process.env.REACT_APP_ENV !== 'production') {
      console.error('Erreur capturée par ErrorBoundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Une erreur est survenue</h2>
          <p>Nous sommes désolés pour ce désagrément. Veuillez rafraîchir la page ou contacter le support si le problème persiste.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;