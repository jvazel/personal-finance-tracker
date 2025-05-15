const { override, addWebpackPlugin } = require('customize-cra');
const webpack = require('webpack');

module.exports = override(
  // Configuration du fractionnement de code
  (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 20000,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            // Obtenir le nom du package à partir du chemin du module
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            // Retourner un nom de chunk pour npm
            return `npm.${packageName.replace('@', '')}`;
          },
        },
        // Séparer les composants de graphiques
        charts: {
          test: /[\\/]components[\\/]charts[\\/]/,
          name: 'charts',
          minChunks: 1,
        },
      },
    };
    return config;
  }
);

module.exports = function override(config, env) {
  // Ignorer les avertissements liés aux source maps manquantes
  config.ignoreWarnings = [
    ...(config.ignoreWarnings || []),
    {
      module: /react-datepicker/,
      message: /Failed to parse source map/,
    },
  ];
  
  return config;
}