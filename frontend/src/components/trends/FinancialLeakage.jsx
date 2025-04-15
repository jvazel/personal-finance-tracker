import React from 'react';

const FinancialLeakage = ({ data }) => {
  // Check if data exists and is an array before using reduce
  if (!data || !Array.isArray(data)) {
    return (
      <div className="financial-leakage-container">
        <div className="no-data-message">Données insuffisantes pour l'analyse des fuites financières</div>
      </div>
    );
  }
  
  // Calculer le total des fuites financières
  const totalLeakage = data.reduce((sum, item) => sum + item.totalAmount, 0);
  
  return (
    <div className="financial-leakage-container">
      <div className="leakage-summary">
        <div className="leakage-total">
          <span className="total-label">Total des fuites financières:</span>
          <span className="total-value">{totalLeakage.toFixed(2)} €</span>
        </div>
        <div className="leakage-explanation">
          <p>
            Les fuites financières sont de petites dépenses récurrentes qui, accumulées sur une période,
            représentent une somme significative. Identifier ces fuites peut vous aider à économiser.
          </p>
        </div>
      </div>
      
      <div className="leakage-list">
        {data.map((leakage, index) => (
          <div key={index} className="leakage-card">
            <div className="leakage-header">
              <div className="leakage-title">
                <span className="leakage-category" style={{ color: leakage.categoryColor }}>
                  {leakage.categoryName}
                </span>
                <span className="leakage-merchant">{leakage.merchant}</span>
              </div>
              <div className="leakage-amount">
                <span className="amount-value">{leakage.totalAmount.toFixed(2)} €</span>
                <span className="amount-frequency">({leakage.frequency} fois)</span>
              </div>
            </div>
            
            <div className="leakage-details">
              <div className="leakage-average">
                <span className="average-label">Moyenne par transaction:</span>
                <span className="average-value">{leakage.averageAmount.toFixed(2)} €</span>
              </div>
              <div className="leakage-impact">
                <span className="impact-label">Impact annuel estimé:</span>
                <span className="impact-value">{leakage.annualImpact.toFixed(2)} €</span>
              </div>
            </div>
            
            <div className="leakage-suggestion">
              <div className="suggestion-icon">💡</div>
              <div className="suggestion-text">{leakage.suggestion}</div>
            </div>
            
            <div className="leakage-actions">
              <button className="action-button">Voir les transactions</button>
              <button className="action-button">Définir un objectif</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinancialLeakage;