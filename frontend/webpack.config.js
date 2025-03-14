const path = require('path');

module.exports = {
  // Autres configurations webpack...
  
  // Configuration pour ignorer les avertissements de source maps
  ignoreWarnings: [
    {
      // Ignorer les avertissements liés aux source maps manquantes pour react-datepicker
      message: /Failed to parse source map from.*react-datepicker/,
    },
  ],
};