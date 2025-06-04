const request = require('supertest');
const { app } = require('../server'); // Correctly destructure app from server exports
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const User = require('../models/User'); // Required for generating tokens for authenticated routes
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let authTokenUser1;
let authTokenUser2;
let userId1;
let userId2;
let categoryId1User1, categoryId2User1, incomeCategoryIdUser1; // Added incomeCategoryIdUser1
let categoryId1User2;

// Helper function to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Create users
  const user1 = await User.create({ username: 'user1', email: 'user1@example.com', password: 'password123' });
  userId1 = user1._id;
  authTokenUser1 = generateToken(userId1);

  const user2 = await User.create({ username: 'user2', email: 'user2@example.com', password: 'password123' });
  userId2 = user2._id;
  authTokenUser2 = generateToken(userId2);

  // Create categories for user1
  const cat1User1 = await Category.create({ name: 'Food', user: userId1, type: 'expense' });
  categoryId1User1 = cat1User1._id;
  const cat2User1 = await Category.create({ name: 'Transport', user: userId1, type: 'expense' });
  categoryId2User1 = cat2User1._id;
  const incomeCatUser1 = await Category.create({ name: 'Salary', user: userId1, type: 'income' }); // Dummy income category
  incomeCategoryIdUser1 = incomeCatUser1._id;

  // Create categories for user2
  const category1User2 = await Category.create({ name: 'Groceries', user: userId2, type: 'expense' });
  categoryId1User2 = category1User2._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear transactions before each test
  await Transaction.deleteMany({});
});

describe('GET /api/reports/category-evolution', () => {
  const defaultStartDate = '2023-01-01';
  const defaultEndDate = '2023-03-31';

  test('should return 401 if no token is provided', async () => {
    const response = await request(app)
      .get('/api/reports/category-evolution')
      .query({ startDate: defaultStartDate, endDate: defaultEndDate });
    expect(response.status).toBe(401);
  });

  test('should return 400 if startDate is missing', async () => {
    const response = await request(app)
      .get('/api/reports/category-evolution')
      .set('Authorization', `Bearer ${authTokenUser1}`)
      .query({ endDate: defaultEndDate });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Start date and end date are required');
  });

  test('should return 400 if endDate is missing', async () => {
    const response = await request(app)
      .get('/api/reports/category-evolution')
      .set('Authorization', `Bearer ${authTokenUser1}`)
      .query({ startDate: defaultStartDate });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Start date and end date are required');
  });

  test('should return empty categories for a date range with no transactions', async () => {
    const response = await request(app)
      .get('/api/reports/category-evolution')
      .set('Authorization', `Bearer ${authTokenUser1}`)
      .query({ startDate: '2020-01-01', endDate: '2020-01-31' });

    expect(response.status).toBe(200);
    expect(response.body.categories).toEqual([]);
  });

  test('should return correct category evolution for a single user with data', async () => {
    // Transactions for user1
    await Transaction.create([
      { user: userId1, category: categoryId1User1, amount: 50, date: '2023-01-15', type: 'expense', description: 'Lunch' },
      { user: userId1, category: categoryId1User1, amount: 60, date: '2023-01-20', type: 'expense', description: 'Dinner' },
      { user: userId1, category: categoryId1User1, amount: 70, date: '2023-02-10', type: 'expense', description: 'Groceries' },
      { user: userId1, category: categoryId2User1, amount: 30, date: '2023-01-05', type: 'expense', description: 'Bus fare' },
      { user: userId1, category: categoryId2User1, amount: 40, date: '2023-02-15', type: 'expense', description: 'Metro pass' },
      { user: userId1, category: incomeCategoryIdUser1, amount: 100, date: '2023-01-10', type: 'income', description: 'Salary' }, // Income, assigned to dummy category
    ]);

    // Transactions for user2 (should be ignored in this user's report)
    await Transaction.create([ // Wrapped in array for consistency
      { user: userId2, category: categoryId1User2, amount: 200, date: '2023-01-10', type: 'expense', description: 'User2 Groceries' }
    ]);

    const response = await request(app)
      .get('/api/reports/category-evolution')
      .set('Authorization', `Bearer ${authTokenUser1}`)
      .query({ startDate: defaultStartDate, endDate: defaultEndDate });

    expect(response.status).toBe(200);
    expect(response.body.categories).toHaveLength(2);

    const foodCategory = response.body.categories.find(cat => cat.name === 'Food');
    expect(foodCategory).toBeDefined();
    expect(foodCategory.evolution).toHaveLength(2);
    expect(foodCategory.evolution).toEqual(expect.arrayContaining([
      { month: '2023-01', total: 110 }, // 50 + 60
      { month: '2023-02', total: 70 },
    ]));

    const transportCategory = response.body.categories.find(cat => cat.name === 'Transport');
    expect(transportCategory).toBeDefined();
    expect(transportCategory.evolution).toHaveLength(2);
    expect(transportCategory.evolution).toEqual(expect.arrayContaining([
      { month: '2023-01', total: 30 },
      { month: '2023-02', total: 40 },
    ]));
  });

  test('should ensure data isolation between users', async () => {
    // Transactions for user1
    await Transaction.create([
      { user: userId1, category: categoryId1User1, amount: 50, date: '2023-01-15', type: 'expense', description: 'Lunch User1' },
    ]);

    // Transactions for user2
    await Transaction.create([
      { user: userId2, category: categoryId1User2, amount: 100, date: '2023-01-10', type: 'expense', description: 'Groceries User2' },
      { user: userId2, category: categoryId1User2, amount: 120, date: '2023-02-05', type: 'expense', description: 'More Groceries User2' },
    ]);

    // Fetch report for User1
    let responseUser1 = await request(app)
      .get('/api/reports/category-evolution')
      .set('Authorization', `Bearer ${authTokenUser1}`)
      .query({ startDate: defaultStartDate, endDate: defaultEndDate });

    expect(responseUser1.status).toBe(200);
    expect(responseUser1.body.categories).toHaveLength(1);
    expect(responseUser1.body.categories[0].name).toBe('Food');
    expect(responseUser1.body.categories[0].evolution).toEqual([{ month: '2023-01', total: 50 }]);

    // Fetch report for User2
    let responseUser2 = await request(app)
      .get('/api/reports/category-evolution')
      .set('Authorization', `Bearer ${authTokenUser2}`)
      .query({ startDate: defaultStartDate, endDate: defaultEndDate });

    expect(responseUser2.status).toBe(200);
    expect(responseUser2.body.categories).toHaveLength(1);
    expect(responseUser2.body.categories[0].name).toBe('Groceries');
    expect(responseUser2.body.categories[0].evolution).toEqual(expect.arrayContaining([
      { month: '2023-01', total: 100 },
      { month: '2023-02', total: 120 },
    ]));
  });

  test('should correctly handle transactions at the very start and end of a month/date range', async () => {
    await Transaction.create([
      { user: userId1, category: categoryId1User1, amount: 25, date: '2023-01-01T00:00:00.000Z', type: 'expense', description: 'Early Jan' },
      { user: userId1, category: categoryId1User1, amount: 75, date: '2023-01-31T23:59:59.999Z', type: 'expense', description: 'Late Jan' },
      { user: userId1, category: categoryId1User1, amount: 50, date: '2023-02-01T00:00:00.000Z', type: 'expense', description: 'Early Feb' },
    ]);

    const response = await request(app)
      .get('/api/reports/category-evolution')
      .set('Authorization', `Bearer ${authTokenUser1}`)
      .query({ startDate: '2023-01-01', endDate: '2023-02-28' });

    expect(response.status).toBe(200);
    const foodCategory = response.body.categories.find(cat => cat.name === 'Food');
    expect(foodCategory).toBeDefined();
    expect(foodCategory.evolution).toEqual(expect.arrayContaining([
      { month: '2023-01', total: 100 }, // 25 + 75
      { month: '2023-02', total: 50 },
    ]));
  });

  test('should handle categories with no transactions in some months within the range', async () => {
    await Transaction.create([
      { user: userId1, category: categoryId1User1, amount: 100, date: '2023-01-15', type: 'expense', description: 'Food Jan' },
      // No Food transactions for Feb
      { user: userId1, category: categoryId1User1, amount: 150, date: '2023-03-10', type: 'expense', description: 'Food Mar' },
      { user: userId1, category: categoryId2User1, amount: 30, date: '2023-02-05', type: 'expense', description: 'Transport Feb' },
    ]);

    const response = await request(app)
      .get('/api/reports/category-evolution')
      .set('Authorization', `Bearer ${authTokenUser1}`)
      .query({ startDate: defaultStartDate, endDate: defaultEndDate }); // Jan to Mar

    expect(response.status).toBe(200);
    const foodCategory = response.body.categories.find(cat => cat.name === 'Food');
    expect(foodCategory).toBeDefined();
    // The backend currently only returns months with actual data.
    // If the requirement was to include all months in the range with 0 total, this test would need adjustment.
    expect(foodCategory.evolution).toEqual([
      { month: '2023-01', total: 100 },
      { month: '2023-03', total: 150 },
    ]);
    expect(foodCategory.evolution.find(ev => ev.month === '2023-02')).toBeUndefined();


    const transportCategory = response.body.categories.find(cat => cat.name === 'Transport');
    expect(transportCategory).toBeDefined();
    expect(transportCategory.evolution).toEqual([
      { month: '2023-02', total: 30 },
    ]);
  });

});
