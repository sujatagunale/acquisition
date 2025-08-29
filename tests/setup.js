// Test setup file
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.ARCJET_KEY = 'test_key_for_testing';
process.env.ARCJET_ENV = 'development';
