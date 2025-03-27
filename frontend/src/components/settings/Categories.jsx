// frontend/src/components/settings/Categories.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import '../../styles/settings.css';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'both',
    color: '#3b82f6',
    icon: 'tag'
  });
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    try {
      if (!newCategory.name.trim()) {
        alert('Le nom de la catégorie est requis');
        return;
      }

      const response = await axios.post('/api/categories', newCategory);
      setCategories([...categories, response.data]);
      setNewCategory({
        name: '',
        type: 'both',
        color: '#3b82f6',
        icon: 'tag'
      });
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding category:', err);
      alert('Erreur lors de l\'ajout de la catégorie');
    }
  };

  const handleUpdateCategory = async () => {
    try {
      if (!editingCategory.name.trim()) {
        alert('Le nom de la catégorie est requis');
        return;
      }

      const response = await axios.put(`/api/categories/${editingCategory._id}`, editingCategory);
      setCategories(categories.map(cat => 
        cat._id === editingCategory._id ? response.data : cat
      ));
      setEditingCategory(null);
    } catch (err) {
      console.error('Error updating category:', err);
      alert('Erreur lors de la mise à jour de la catégorie');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/categories/${id}`);
      setCategories(categories.filter(cat => cat._id !== id));
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Erreur lors de la suppression de la catégorie');
    }
  };

  const startEditing = (category) => {
    setEditingCategory({ ...category });
  };

  const cancelEditing = () => {
    setEditingCategory(null);
  };

  const handleInputChange = (e, target) => {
    const { name, value } = e.target;
    
    if (target === 'new') {
      setNewCategory({ ...newCategory, [name]: value });
    } else {
      setEditingCategory({ ...editingCategory, [name]: value });
    }
  };

  if (loading) return <div className="loading">Chargement des catégories...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="categories-container">
      <div className="categories-header">
        <h2>Gestion des catégories</h2>
        <button 
          className="add-category-button"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? <FaTimes /> : <FaPlus />}
        </button>
      </div>

      {showAddForm && (
        <div className="category-form">
          <h3>Ajouter une nouvelle catégorie</h3>
          <div className="form-group">
            <label>Nom</label>
            <input
              type="text"
              name="name"
              value={newCategory.name}
              onChange={(e) => handleInputChange(e, 'new')}
              placeholder="Nom de la catégorie"
            />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select
              name="type"
              value={newCategory.type}
              onChange={(e) => handleInputChange(e, 'new')}
            >
              <option value="income">Revenu</option>
              <option value="expense">Dépense</option>
              <option value="both">Les deux</option>
            </select>
          </div>
          <div className="form-group">
            <label>Couleur</label>
            <input
              type="color"
              name="color"
              value={newCategory.color}
              onChange={(e) => handleInputChange(e, 'new')}
            />
          </div>
          <div className="form-actions">
            <button onClick={() => setShowAddForm(false)}>Annuler</button>
            <button onClick={handleAddCategory} className="primary">Ajouter</button>
          </div>
        </div>
      )}

      <div className="categories-list">
        {categories.length === 0 ? (
          <p>Aucune catégorie trouvée</p>
        ) : (
          categories.map(category => (
            <div key={category._id} className="category-item">
              {editingCategory && editingCategory._id === category._id ? (
                // Edit mode
                <div className="category-edit-form">
                  <div className="form-group">
                    <label>Nom</label>
                    <input
                      type="text"
                      name="name"
                      value={editingCategory.name}
                      onChange={(e) => handleInputChange(e, 'edit')}
                    />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      name="type"
                      value={editingCategory.type}
                      onChange={(e) => handleInputChange(e, 'edit')}
                    >
                      <option value="income">Revenu</option>
                      <option value="expense">Dépense</option>
                      <option value="both">Les deux</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Couleur</label>
                    <input
                      type="color"
                      name="color"
                      value={editingCategory.color}
                      onChange={(e) => handleInputChange(e, 'edit')}
                    />
                  </div>
                  <div className="category-actions">
                    <button onClick={cancelEditing} className="cancel-button">
                      <FaTimes />
                    </button>
                    <button onClick={handleUpdateCategory} className="save-button">
                      <FaCheck />
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <div className="category-color" style={{ backgroundColor: category.color }}></div>
                  <div className="category-details">
                    <span className="category-name">{category.name}</span>
                    <span className="category-type">
                      {category.type === 'income' ? 'Revenu' : 
                       category.type === 'expense' ? 'Dépense' : 'Les deux'}
                    </span>
                  </div>
                  <div className="category-actions">
                    <button onClick={() => startEditing(category)} className="edit-button">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDeleteCategory(category._id)} className="delete-button">
                      <FaTrash />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Categories;