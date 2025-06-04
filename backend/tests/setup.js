process.env.JWT_SECRET = 'your-test-jwt-secret'; // Use a dummy secret for testing
process.env.NODE_ENV = 'test'; // Set environment to test
// You can add other environment variables needed for your tests here
// For example, if your app uses a specific database connection string for tests:
// process.env.MONGODB_URI = 'mongodb://localhost:27017/your_test_db_name';
// However, for these tests, mongodb-memory-server handles the DB URI.
