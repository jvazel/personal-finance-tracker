module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./tests/setup.js'], // Path to your setup file
  // Option to force Jest to exit after tests complete, useful for MongoDB connections
  forceExit: true,
  // Option to detect open handles, which can help diagnose issues with tests not exiting
  detectOpenHandles: true,
};
