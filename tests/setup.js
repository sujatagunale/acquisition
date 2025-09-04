// Test setup file
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
process.env.ARCJET_KEY = 'test_key_for_testing';
process.env.JWT_SECRET = 'test_jwt_secret';
