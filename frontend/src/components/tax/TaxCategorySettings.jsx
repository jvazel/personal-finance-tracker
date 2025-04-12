import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const TaxCategorySettings = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/categories');
      setCategories(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la récupération des catégories:', err);
      setError('Impossible de récupérer les catégories. Veuillez réessayer plus tard.');
      // Initialize with empty array on error
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (id, updates) => {
    try {
      const response = await api.put(`/api/categories/${id}`, updates);
      setCategories(categories.map(cat => cat._id === id ? response.data : cat));
      setSuccessMessage('Catégorie mise à jour avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la catégorie:', err);
      setError('Erreur lors de la mise à jour de la catégorie. Veuillez réessayer.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleTaxableChange = (id, checked) => {
    updateCategory(id, { taxable: checked });
  };

  const handleDeductibleChange = (id, checked) => {
    updateCategory(id, { taxDeductible: checked });
  };

  const handleTaxCategoryChange = (id, value) => {
    updateCategory(id, { taxCategory: value });
  };

  const getTaxCategoryDescription = (taxCategory) => {
    switch (taxCategory) {
      case 'income':
        return 'Revenus imposables (salaires, dividendes, etc.)';
      case 'deduction':
        return 'Dépenses déductibles des impôts';
      case 'donation':
        return 'Dons à des organismes caritatifs';
      case 'investment':
        return 'Investissements avec avantages fiscaux';
      default:
        return 'Aucune implication fiscale particulière';
    }
  };

  const bulkUpdateCategories = async (type, updates) => {
    try {
      setLoading(true);
      const categoriesToUpdate = categories.filter(cat => cat.type === type);
      
      for (const category of categoriesToUpdate) {
        await api.put(`/api/categories/${category._id}`, updates);
      }
      
      await fetchCategories();
      setSuccessMessage(`Toutes les catégories de type ${type === 'income' ? 'revenu' : 'dépense'} ont été mises à jour`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Erreur lors de la mise à jour groupée des catégories:', err);
      setError('Erreur lors de la mise à jour groupée. Veuillez réessayer.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des catégories...</p>
      </div>
    );
  }

  return (
    <div className="tax-category-settings">
      <h3>Configuration fiscale des catégories</h3>
      <p className="tax-settings-info">
        Configurez les propriétés fiscales de vos catégories pour une meilleure gestion de vos impôts.
        Les catégories marquées comme imposables ou déductibles seront prises en compte dans vos rapports fiscaux.
      </p>

      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="tax-settings-actions">
        <div className="tax-settings-action-group">
          <h4>Actions groupées</h4>
          <div className="tax-settings-buttons">
            <button 
              className="tax-action-button"
              onClick={() => bulkUpdateCategories('income', { taxable: true })}
              disabled={loading}
            >
              Marquer tous les revenus comme imposables
            </button>
            <button 
              className="tax-action-button"
              onClick={() => bulkUpdateCategories('expense', { taxDeductible: true })}
              disabled={loading}
            >
              Marquer toutes les dépenses comme déductibles
            </button>
            <button 
              className="tax-action-button secondary"
              onClick={() => bulkUpdateCategories('income', { taxable: false })}
              disabled={loading}
            >
              Réinitialiser les revenus
            </button>
            <button 
              className="tax-action-button secondary"
              onClick={() => bulkUpdateCategories('expense', { taxDeductible: false })}
              disabled={loading}
            >
              Réinitialiser les dépenses
            </button>
          </div>
        </div>
      </div>

      <div className="tax-categories-table-container">
        <table className="tax-categories-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Type</th>
              <th>Imposable</th>
              <th>Déductible</th>
              <th>Catégorie fiscale</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(categories) && categories.length > 0 ? (
              categories.map(category => (
                <tr key={category._id}>
                  <td>
                    <div className="category-name">
                      <span className="category-color" style={{ backgroundColor: category.color }}></span>
                      {category.name}
                    </div>
                  </td>
                  <td>{category.type === 'income' ? 'Revenu' : 'Dépense'}</td>
                  // Remplaçons les cellules de case à cocher par cette version améliorée
                  <td>
                    <div className="tax-category-checkbox-group">
                      <input 
                        type="checkbox" 
                        id={`taxable-${category._id}`}
                        checked={category.taxable || false}
                        onChange={(e) => handleTaxableChange(category._id, e.target.checked)}
                        disabled={category.type === 'expense'}
                      />
                      <label htmlFor={`taxable-${category._id}`}>Imposable</label>
                    </div>
                  </td>
                  
                  <td>
                    <div className="tax-category-checkbox-group">
                      <input 
                        type="checkbox" 
                        id={`deductible-${category._id}`}
                        checked={category.taxDeductible || false}
                        onChange={(e) => handleDeductibleChange(category._id, e.target.checked)}
                        disabled={category.type === 'income'}
                      />
                      <label htmlFor={`deductible-${category._id}`}>Dépense déductible</label>
                    </div>
                  </td>
                  <td>
                    <select 
                      value={category.taxCategory || 'none'}
                      onChange={(e) => handleTaxCategoryChange(category._id, e.target.value)}
                      className="tax-category-select"
                    >
                      <option value="none">Aucune</option>
                      {category.type === 'income' && (
                        <option value="income">Revenu imposable</option>
                      )}
                      {category.type === 'expense' && (
                        <>
                          <option value="deduction">Déduction standard</option>
                          <option value="donation">Don caritatif</option>
                          <option value="investment">Investissement</option>
                        </>
                      )}
                    </select>
                  </td>
                  <td>
                    <span className="tax-category-description">
                      {getTaxCategoryDescription(category.taxCategory)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data-message">
                  Aucune catégorie disponible. Veuillez créer des catégories dans les paramètres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="tax-settings-help">
        <h4>Aide sur les catégories fiscales</h4>
        <ul>
          <li><strong>Revenu imposable</strong> - Revenus qui doivent être déclarés aux impôts (salaires, dividendes, etc.)</li>
          <li><strong>Déduction standard</strong> - Dépenses qui peuvent être déduites de vos impôts (frais professionnels, etc.)</li>
          <li><strong>Don caritatif</strong> - Dons à des organismes reconnus qui peuvent donner droit à des réductions d'impôts</li>
          <li><strong>Investissement</strong> - Placements avec avantages fiscaux (PEA, assurance-vie, etc.)</li>
        </ul>
        <p>
          Configurez correctement ces paramètres pour obtenir des rapports fiscaux précis et identifier les opportunités d'optimisation fiscale.
        </p>
      </div>
    </div>
  );
};

export default TaxCategorySettings;