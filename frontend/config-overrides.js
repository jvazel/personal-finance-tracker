const { override } = require('customize-cra'); // Removed addWebpackPlugin and webpack as they weren't used in the final merged version
// const webpack = require('webpack'); // Not used in the merged config

// Main Webpack override function
const webpackOverride = override(
  // Customizer for code splitting
  (config) => {
    config.optimization.splitChunks = {
      ...config.optimization.splitChunks, // Preserve existing splitChunks settings if any
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 20000, // Example: set minSize for chunks
      cacheGroups: {
        ...config.optimization.splitChunks?.cacheGroups, // Preserve existing cacheGroups
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            return `npm.${packageName.replace('@', '')}`;
          },
        },
        charts: {
          test: /[\\/]components[\\/]charts[\\/]/, // This path might need verification
          name: 'charts',
          minChunks: 1,
        },
      },
    };
    return config;
  },
  // Customizer for ignoring warnings
  (config) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /react-datepicker/,
        message: /Failed to parse source map/,
      },
      // Add any other warnings to ignore here
    ];
    return config;
  }
);

// Jest override function
const jestOverride = (config) => {
  config.transformIgnorePatterns = [
    '/node_modules/(?!date-fns)/', // Ensure date-fns is transformed
    // You might need to add other exceptions if more libraries cause issues
    // Default CRA pattern is usually: '^.+\\.module\\.(css|sass|scss)$' for CSS modules
    // and node_modules for others. We are overriding the node_modules part.
  ];
  // If you had other Jest modifications, they would go here.
  // For example, to add setup files:
  // config.setupFilesAfterEnv = [...(config.setupFilesAfterEnv || []), '<rootDir>/src/setupTestsSpecificToJestOverrides.js'];
  return config;
};

module.exports = {
  webpack: webpackOverride,
  jest: jestOverride,
  // paths: (paths, env) => { /* ... */ return paths; } // If you need to override paths
};