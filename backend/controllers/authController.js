const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Category = require('../models/Category');
const logger = require('../utils/logger');

// Générer un token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Enregistrer un nouvel utilisateur
exports.register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email ou ce nom d\'utilisateur existe déjà'
      });
    }

    // Créer un nouvel utilisateur
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName
    });

    // Créer des catégories par défaut pour le nouvel utilisateur
    await createDefaultCategories(user._id);

    // Générer un token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    logger.error('Erreur lors de l\'enregistrement:', { 
      error: error.message, 
      stack: error.stack,
      username: req.body.username,
      email: req.body.email
    });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement',
      error: error.message
    });
  }
};

// Connexion d'un utilisateur
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'email et le mot de passe sont fournis
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir un email et un mot de passe'
      });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Vérifier si le mot de passe correspond
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Générer un token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    logger.error('Erreur lors de la connexion:', { 
      error: error.message, 
      stack: error.stack,
      email: req.body.email
    });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
};

// Obtenir les informations de l'utilisateur actuel
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations utilisateur',
      error: error.message
    });
  }
};

// Fonction pour créer des catégories par défaut pour un nouvel utilisateur
const createDefaultCategories = async (userId) => {
  const defaultCategories = [
    { name: 'Salaire', type: 'income', color: '#10b981', icon: 'cash', user: userId },
    { name: 'Investissements', type: 'income', color: '#3b82f6', icon: 'trending-up', user: userId },
    { name: 'Cadeaux', type: 'income', color: '#8b5cf6', icon: 'gift', user: userId },
    { name: 'Alimentation', type: 'expense', color: '#ef4444', icon: 'restaurant', user: userId },
    { name: 'Transport', type: 'expense', color: '#f59e0b', icon: 'car', user: userId },
    { name: 'Logement', type: 'expense', color: '#6366f1', icon: 'home', user: userId },
    { name: 'Loisirs', type: 'expense', color: '#ec4899', icon: 'film', user: userId },
    { name: 'Santé', type: 'expense', color: '#14b8a6', icon: 'medical', user: userId },
    { name: 'Éducation', type: 'expense', color: '#8b5cf6', icon: 'school', user: userId },
    { name: 'Autres', type: 'both', color: '#9ca3af', icon: 'ellipsis-horizontal', user: userId }
  ];

  await Category.insertMany(defaultCategories);
};