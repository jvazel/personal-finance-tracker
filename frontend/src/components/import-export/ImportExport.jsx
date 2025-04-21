import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import fr from 'date-fns/locale/fr';
import api from '../../utils/api';
import { format } from 'date-fns';
import '../../styles/import-export.css';

registerLocale('fr', fr);

const ImportExport = () => {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1)); // 1er janvier de l'année en cours
  const [endDate, setEndDate] = useState(new Date());
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Gérer l'export des transactions
  const handleExport = async () => {
    try {
      setLoading(true);
      setMessage(null);
      setError(null);

      // Formater les dates pour l'API
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');

      // Appeler l'API pour exporter les transactions
      const response = await api.get('/import-export/export', {
        params: {
          startDate: formattedStartDate,
          endDate: formattedEndDate
        },
        responseType: 'blob' // Important pour recevoir le fichier
      });

      // Créer un lien pour télécharger le fichier
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions-${formattedStartDate}-to-${formattedEndDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setMessage('Export réussi ! Le téléchargement devrait commencer automatiquement.');
    } catch (err) {
      console.error('Erreur lors de l\'export des transactions:', err);
      setError('Erreur lors de l\'export des transactions. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Gérer le changement de fichier
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Gérer l'import des transactions
  const handleImport = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Veuillez sélectionner un fichier CSV à importer.');
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      setError(null);

      // Créer un FormData pour envoyer le fichier
      const formData = new FormData();
      formData.append('file', file);

      // Appeler l'API pour importer les transactions
      const response = await api.post('/import-export/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage(response.data.message);
      
      // Réinitialiser le formulaire
      setFile(null);
      document.getElementById('file-upload').value = '';
    } catch (err) {
      console.error('Erreur lors de l\'import des transactions:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'import des transactions. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="import-export-container">
      <h1>Import / Export de Transactions</h1>
      
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      
      <div className="import-export-sections">
        <div className="export-section">
          <h2>Exporter des Transactions</h2>
          <div className="export-form">
            <div className="form-group">
              <label>Date de début:</label>
              <DatePicker
                selected={startDate}
                onChange={date => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                locale="fr"
                dateFormat="dd/MM/yyyy"
                className="date-picker"
              />
            </div>
            
            <div className="form-group">
              <label>Date de fin:</label>
              <DatePicker
                selected={endDate}
                onChange={date => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                locale="fr"
                dateFormat="dd/MM/yyyy"
                className="date-picker"
              />
            </div>
            
            <button 
              className="export-button" 
              onClick={handleExport} 
              disabled={loading}
            >
              {loading ? 'Exportation en cours...' : 'Exporter au format CSV'}
            </button>
          </div>
        </div>
        
        <div className="import-section">
          <h2>Importer des Transactions</h2>
          <form onSubmit={handleImport} className="import-form">
            <div className="form-group">
              <label htmlFor="file-upload">Fichier CSV:</label>
              <input
                type="file"
                id="file-upload"
                accept=".csv"
                onChange={handleFileChange}
                className="file-input"
              />
              <p className="file-format-info">
                Le fichier CSV doit contenir les colonnes suivantes: date, description, amount, type, category (optionnel), notes (optionnel)
              </p>
            </div>
            
            <button 
              type="submit" 
              className="import-button" 
              disabled={loading || !file}
            >
              {loading ? 'Importation en cours...' : 'Importer les transactions'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ImportExport;