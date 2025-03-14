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