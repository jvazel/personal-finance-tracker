// backend/controllers/categoryController.js
const Category = require('../models/Category');

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const newCategory = new Category(req.body);
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(400).json({ message: 'Error creating category', error: error.message });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching category', error: error.message });
  }
};

// Update category by ID
exports.updateCategory = async (req, res) => {
  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, updatedAt: Date.now() }, 
      { new: true, runValidators: true }
    );
    
    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: 'Error updating category', error: error.message });
  }
};

// Delete category by ID
exports.deleteCategory = async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};

// Initialize default categories if none exist
exports.initializeDefaultCategories = async () => {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      const defaultCategories = [
        { name: 'Alimentation', type: 'expense', color: '#4CAF50', icon: 'shopping-cart' },
        { name: 'Logement', type: 'expense', color: '#2196F3', icon: 'home' },
        { name: 'Transport', type: 'expense', color: '#FF9800', icon: 'car' },
        { name: 'Loisirs', type: 'expense', color: '#9C27B0', icon: 'film' },
        { name: 'Santé', type: 'expense', color: '#F44336', icon: 'heartbeat' },
        { name: 'Éducation', type: 'expense', color: '#3F51B5', icon: 'book' },
        { name: 'Salaire', type: 'income', color: '#4CAF50', icon: 'money-bill' },
        { name: 'Investissements', type: 'income', color: '#673AB7', icon: 'chart-line' },
        { name: 'Cadeaux', type: 'income', color: '#E91E63', icon: 'gift' },
        { name: 'Autres', type: 'both', color: '#607D8B', icon: 'ellipsis-h' }
      ];
      
      await Category.insertMany(defaultCategories);
      console.log('Default categories initialized');
    }
  } catch (error) {
    console.error('Error initializing default categories:', error);
  }
};