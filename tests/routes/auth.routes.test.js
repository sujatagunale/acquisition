import request from 'supertest';
import app from '../../src/app.js';

jest.mock('../../src/config/database.js', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
  },
  sql: jest.fn(),
}));

jest.mock('../../src/config/logger.js', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('Auth Routes', () => {
  describe('Route definitions', () => {
    it('should have POST /api/auth/signup route', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({});

      expect(response.status).not.toBe(404);
    });

    it('should have POST /api/auth/signin route', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({});

      expect(response.status).not.toBe(404);
    });

    it('should have POST /api/auth/signout route', async () => {
      const response = await request(app)
        .post('/api/auth/signout');

      expect(response.status).not.toBe(404);
    });

    it('should return 404 for non-existent auth routes', async () => {
      const response = await request(app)
        .get('/api/auth/nonexistent');

      expect(response.status).toBe(404);
    });

    it('should not accept GET requests on signup route', async () => {
      const response = await request(app)
        .get('/api/auth/signup');

      expect(response.status).toBe(404);
    });

    it('should not accept GET requests on signin route', async () => {
      const response = await request(app)
        .get('/api/auth/signin');

      expect(response.status).toBe(404);
    });

    it('should not accept GET requests on signout route', async () => {
      const response = await request(app)
        .get('/api/auth/signout');

      expect(response.status).toBe(404);
    });
  });

  describe('Route middleware', () => {
    it('should accept JSON content type', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .set('Content-Type', 'application/json')
        .send({});

      expect(response.status).not.toBe(415);
    });

    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/auth/signup');

      expect(response.status).toBe(200);
    });
  });
});
