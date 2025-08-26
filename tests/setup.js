// Test setup file
require('module-alias/register');
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Mock database connection for tests
jest.mock('../src/config/database', () => ({
  db: {},
  sql: jest.fn(),
}));
