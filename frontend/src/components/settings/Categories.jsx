// frontend/src/components/settings/Categories.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import '../../styles/settings.css';
import Modal from '../Modal';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    color: '#3b82f6',
    icon: 'fa-tag'
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
      setCategories(response.data);
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
    } catch (error) {
      console.error('Error saving category:', error);
      setError('Erreur lors de l\'enregistrement de la catégorie');
    }
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon
    });
    setEditingId(category._id);
    setShowModal(true);
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

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'expense',
      color: '#3b82f6',
      icon: 'fa-tag'
    });
    setEditingId(null);
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
    <div className="categories-container">
      <div className="categories-header">
        <h2>Gestion des catégories</h2>
        <button 
          className="add-category-button" 
          onClick={openAddModal}
        >
          +
        </button>
      </div>

      {/* Modal for adding/editing categories */}
      <Modal 
        isOpen={showModal} 
        onClose={closeModal} 
        title={editingId ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
      >
        <div className="modal-body">
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

      {error && <div className="error">{error}</div>}

      <div className="categories-list">
        {categories.length > 0 ? (
          categories.map(category => (
            <div key={category._id} className="category-item">
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
                <button 
                  className="edit-button"
                  onClick={() => handleEdit(category)}
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button 
                  className="delete-button"
                  onClick={() => handleDelete(category._id)}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>Aucune catégorie trouvée. Ajoutez-en une !</p>
        )}
      </div>
    </div>
  );
};

export default Categories;