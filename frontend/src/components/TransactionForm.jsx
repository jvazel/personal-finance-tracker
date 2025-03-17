import React, { useState, useContext } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { TransactionContext } from '../contexts/TransactionContext';
import { registerLocale } from 'react-datepicker';
import fr from 'date-fns/locale/fr';

registerLocale('fr', fr);

const categories = ["Alimentation", "Assurance", "Cadeau", "Culture", "Divertissement", "Don", "Éducation", "Électricité", "Épargne", "Gaz", "Internet et téléphone", "Loyer", "Salaire", "Santé", "Services", "Transport", "Autre"];

const TransactionForm = ({ transactionToEdit, onClose, selectedMonth }) => {
  const { addTransaction, updateTransaction } = useContext(TransactionContext);
  
  // Calculate the limits of the selected month
  const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
  const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
  
  // Initialize date within the limits of the selected month
  let initialDate = transactionToEdit ? new Date(transactionToEdit.date) : new Date(selectedMonth);
  // Ensure date is within the selected month
  if (initialDate < startOfMonth || initialDate > endOfMonth) {
    initialDate = new Date(selectedMonth);
  }
  
  const [date, setDate] = useState(initialDate);
  const [description, setDescription] = useState(transactionToEdit ? transactionToEdit.description : '');
  const [amount, setAmount] = useState(transactionToEdit ? transactionToEdit.amount : '');
  const [type, setType] = useState(transactionToEdit ? transactionToEdit.type : 'expense');
  const [category, setCategory] = useState(transactionToEdit ? transactionToEdit.category : categories[0]);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!description || !amount || !type || !category) {
      setFormError('Veuillez remplir tous les champs.');
      return;
    }
    if (isNaN(amount)) {
      setFormError('Le montant doit être un nombre.');
      return;
    }

    const transactionData = {
      date,
      description,
      amount: parseFloat(amount),
      type,
      category
    };

    try {
      if (transactionToEdit) {
        await updateTransaction(transactionToEdit._id, transactionData);
      } else {
        await addTransaction(transactionData);
      }
      onClose(); // Close the form after successful submission
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la transaction:', error);
      setFormError('Échec de l\'enregistrement de la transaction. Veuillez réessayer.');
    }
  };

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      {formError && <div className="form-error">{formError}</div>}
      
      <div className="form-group">
        <label htmlFor="date">Date</label>
        <DatePicker
          id="date"
          selected={date}
          onChange={date => setDate(date)}
          dateFormat="dd/MM/yyyy"
          locale="fr"
          minDate={startOfMonth}
          maxDate={endOfMonth}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Entrez une description"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="amount">Montant</label>
        <input
          id="amount"
          type="text"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Entrez un montant"
          className={type ? `amount-${type}` : ''}
        />
      </div>
      
      <div className="form-group">
        <label>Type</label>
        <div>
          <label>
            <input
              type="radio"
              name="type"
              value="expense"
              checked={type === 'expense'}
              onChange={() => setType('expense')}
            />
            Dépense
          </label>
          <label style={{ marginLeft: '15px' }}>
            <input
              type="radio"
              name="type"
              value="income"
              checked={type === 'income'}
              onChange={() => setType('income')}
            />
            Revenu
          </label>
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="category">Catégorie</label>
        <select
          id="category"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      
      <div className="form-actions">
        <button type="button" className="cancel" onClick={onClose}>Annuler</button>
        <button type="submit">{transactionToEdit ? 'Mettre à jour' : 'Ajouter'} la transaction</button>
      </div>
    </form>
  );
};

export default TransactionForm;