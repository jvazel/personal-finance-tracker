import React, { useState, useContext, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { TransactionContext } from '../../contexts/TransactionContext';
import { registerLocale } from 'react-datepicker';
import fr from 'date-fns/locale/fr';
import api from '../../utils/api';
import { motion } from 'framer-motion';

registerLocale('fr', fr);

const formVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      staggerChildren: 0.05
    }
  }
};

const inputVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

const TransactionForm = ({ transactionToEdit, onClose, selectedMonth }) => {
  const { addTransaction, updateTransaction } = useContext(TransactionContext);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

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
  const [note, setNote] = useState(transactionToEdit ? transactionToEdit.note || '' : '');

  // Initialize category state with ID if available, otherwise use name
  const [category, setCategory] = useState(
    transactionToEdit ?
      (transactionToEdit.category?._id || transactionToEdit.category) :
      ''
  );

  const [formError, setFormError] = useState('');

  // Fetch categories from the database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await api.get('/categories');
        // Ensure we're setting an array to categories
        const categoriesData = Array.isArray(response.data) ? response.data :
          (response.data && Array.isArray(response.data.data) ? response.data.data : []);
        setCategories(categoriesData);

        // Set default category if none is selected yet
        if (!category && categoriesData.length > 0) {
          // Filter categories based on transaction type
          const filteredCategories = categoriesData.filter(
            cat => cat.type === type || cat.type === 'both'
          );

          if (filteredCategories.length > 0) {
            setCategory(filteredCategories[0]._id);
          } else if (categoriesData.length > 0) {
            setCategory(categoriesData[0]._id);
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setFormError('Erreur lors du chargement des catégories');
        setCategories([]); // Set to empty array on error
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Filter categories based on transaction type
  // Ensure categories is an array before filtering
  const filteredCategories = Array.isArray(categories) ?
    categories.filter(cat => cat.type === type || cat.type === 'both') : [];

  // Update category when type changes
  useEffect(() => {
    if (filteredCategories.length > 0) {
      // Check if current category is valid for the selected type
      const categoryExists = filteredCategories.some(cat => cat._id === category);
      if (!categoryExists) {
        setCategory(filteredCategories[0]._id);
      }
    }
  }, [type, filteredCategories, category]);

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
      category,
      note
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
    <motion.form
      className="transaction-form"
      onSubmit={handleSubmit}
      variants={formVariants}
      initial="hidden"
      animate="visible"
    >
      {formError && <div className="form-error">{formError}</div>}

      <motion.div className="form-group" variants={inputVariants}>
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
      </motion.div>

      <motion.div className="form-group" variants={inputVariants}>
        <label htmlFor="description">Description</label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Entrez une description"
        />
      </motion.div>

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
        <div className="type-options">
          <div className="checkbox-container-option">
            <input
              type="radio"
              name="type"
              id="expense"
              value="expense"
              checked={type === 'expense'}
              onChange={() => setType('expense')}
            />
            <label htmlFor="expense">Dépense</label>
          </div>
          <div className="checkbox-container-option">
            <input
              type="radio"
              name="type"
              id="income"
              value="income"
              checked={type === 'income'}
              onChange={() => setType('income')}
            />
            <label htmlFor="income">Revenu</label>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="category">Catégorie</label>
        <select
          id="category"
          value={category}
          onChange={e => setCategory(e.target.value)}
          disabled={loadingCategories}
        >
          {loadingCategories ? (
            <option>Chargement des catégories...</option>
          ) : (
            filteredCategories.map(cat => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="note">Note (optionnelle)</label>
        <textarea
          id="note"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Ajouter une note à cette transaction..."
          rows="3"
          className="form-textarea"
        />
      </div>

      <motion.div
        className="form-actions"
        variants={inputVariants}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <button type="button" className="danger" onClick={onClose}>
          Annuler
        </button>
        <button type="submit" className="submit-button">
          {transactionToEdit ? 'Mettre à jour' : 'Ajouter'}
        </button>
      </motion.div>
    </motion.form>
  );
};

export default TransactionForm;