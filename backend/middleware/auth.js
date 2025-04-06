const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware pour protéger les routes
exports.protect = async (req, res, next) => {
  let token;

  // Vérifier si le token est présent dans les headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Vérifier si le token existe
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Accès non autorisé'
    });
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ajouter l'utilisateur à la requête
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Accès non autorisé'
    });
  }
};
