import React from 'react';

const AmountDisplay = ({ amount, type }) => {
  // Déterminer la classe CSS en fonction du type de transaction
  const amountClass = type === 'expense' ? 'amount-expense' : 'amount-income';
  
  // Formater le montant avec 2 décimales
  const formattedAmount = parseFloat(amount).toFixed(2);
  
  // Ajouter une flèche selon le type de transaction
  const arrow = type === 'expense' 
    ? <span className="arrow-down">&#9660;</span> 
    : <span className="arrow-up">&#9650;</span>;
  
  return (
    <span className={amountClass}>
      {arrow} {formattedAmount} €
    </span>
  );
};

export default AmountDisplay;