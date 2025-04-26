// frontend/src/components/settings/Categories.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../common/Modal';
import { motion, AnimatePresence } from 'framer-motion';

// Définition des variantes d'animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    color: '#3b82f6',
    icon: 'fa-tag',
    // Ajout des propriétés fiscales
    taxable: false,
    taxDeductible: false,
    taxCategory: 'none'
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/categories');
      setCategories(response.data.data || response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/categories/${editingId}`, formData);
      } else {
        await api.post('/api/categories', formData);
      }
      resetForm();
      fetchCategories();
      setShowModal(false);
      setError(null); // Clear any previous errors on success
    } catch (error) {
      console.error('Error saving category:', error);
      // Extract the error message from the API response if available
      const errorMessage = error.response?.data?.error || 
                          'Erreur lors de l\'enregistrement de la catégorie';
      setError(errorMessage);
      // Keep the modal open to show the error
    }
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
      // Récupération des propriétés fiscales existantes
      taxable: category.taxable || false,
      taxDeductible: category.taxDeductible || false,
      taxCategory: category.taxCategory || 'none'
    });
    setEditingId(category._id);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'expense',
      color: '#3b82f6',
      icon: 'fa-tag',
      // Réinitialisation des propriétés fiscales
      taxable: false,
      taxDeductible: false,
      taxCategory: 'none'
    });
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        await api.delete(`/api/categories/${id}`);
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        setError('Erreur lors de la suppression de la catégorie');
      }
    }
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  if (loading) return <div className="loading">Chargement des catégories...</div>;
  if (error && !categories.length) return <div className="error">{error}</div>;

  return (
    <motion.div 
      className="categories-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="categories-header" variants={itemVariants}>
        <h2>Gestion des catégories</h2>
        <button 
          className="add-category-button" 
          onClick={openAddModal}
        >
          +
        </button>
      </motion.div>

      {/* Modal for adding/editing categories */}
      <AnimatePresence>
        {showModal && (
          <Modal 
            isOpen={showModal} 
            onClose={closeModal} 
            title={editingId ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
          >
            <div className="modal-body">
              {error && (
                <motion.div 
                  className="error-message-box"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </motion.div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Nom</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="type">Type</label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="expense">Dépense</option>
                    <option value="income">Revenu</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="color">Couleur</label>
                  <input
                    type="color"
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="icon">Icône (classe Font Awesome)</label>
                  <input
                    type="text"
                    id="icon"
                    name="icon"
                    value={formData.icon}
                    onChange={handleChange}
                    placeholder="fa-tag"
                  />
                </div>
                
                {/* Ajout des champs pour les propriétés fiscales */}
                <div className="form-divider">Propriétés fiscales</div>
                
                {formData.type === 'income' && (
                  <div className="form-group">
                    <div className="checkbox-container">
                      <label htmlFor="taxable">Revenu imposable</label>
                      <input
                        type="checkbox"
                        id="taxable"
                        name="taxable"
                        checked={formData.taxable}
                        onChange={(e) => setFormData({...formData, taxable: e.target.checked})}
                      />
                    </div>
                    <small>Cochez cette case si ce type de revenu est imposable</small>
                  </div>
                )}
                
                {formData.type === 'expense' && (
                  <div className="form-group">
                    <div className="checkbox-container">
                      <label htmlFor="taxDeductible">Dépense déductible</label>
                      <input
                        type="checkbox"
                        id="taxDeductible"
                        name="taxDeductible"
                        checked={formData.taxDeductible}
                        onChange={(e) => setFormData({...formData, taxDeductible: e.target.checked})}
                      />
                    </div>
                    <small>Cochez cette case si ce type de dépense est déductible des impôts</small>
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="taxCategory">Catégorie fiscale</label>
                  <select
                    id="taxCategory"
                    name="taxCategory"
                    value={formData.taxCategory}
                    onChange={handleChange}
                  >
                    <option value="none">Aucune</option>
                    {formData.type === 'income' && (
                      <option value="income">Revenu imposable</option>
                    )}
                    {formData.type === 'expense' && (
                      <>
                        <option value="deduction">Déduction standard</option>
                        <option value="donation">Don caritatif</option>
                        <option value="investment">Investissement</option>
                      </>
                    )}
                  </select>
                  <small>Sélectionnez la catégorie fiscale appropriée pour ce type de transaction</small>
                </div>
                
                <div className="modal-footer">
                  <button type="button" className="danger" onClick={closeModal}>
                    Annuler
                  </button>
                  <button type="submit" className="primary">
                    {editingId ? 'Mettre à jour' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {error && (
        <motion.div 
          className="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {error}
        </motion.div>
      )}

      <motion.div className="categories-list" variants={itemVariants}>
        {categories.length > 0 ? (
          categories.map(category => (
            <motion.div 
              key={category._id} 
              className="category-item"
              variants={itemVariants}
              whileHover={{ scale: 1.02, boxShadow: "0px 3px 8px rgba(0,0,0,0.1)" }}
              whileTap={{ scale: 0.98 }}
            >
              <div 
                className="category-color" 
                style={{ backgroundColor: category.color }}
              ></div>
              <div className="category-details">
                <span className="category-name">{category.name}</span>
                <span className="category-type">
                  {category.type === 'expense' ? 'Dépense' : 'Revenu'}
                </span>
              </div>
              <div className="category-actions">
                <motion.button 
                  className="edit-button"
                  onClick={() => handleEdit(category)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <i className="fas fa-edit"></i>
                </motion.button>
                <motion.button 
                  className="delete-button"
                  onClick={() => handleDelete(category._id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <i className="fas fa-trash"></i>
                </motion.button>
              </div>
            </motion.div>
          ))
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Aucune catégorie trouvée. Ajoutez-en une !
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Categories;