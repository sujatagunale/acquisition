import { jest } from '@jest/globals';

jest.setTimeout(30000);

// Test setup file
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
}
