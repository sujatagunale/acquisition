import request from 'supertest';
import app from '../../src/app.js';
import { jwttoken } from '../../src/utils/jwt.js';

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

describe('Listings Routes', () => {
  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
  };

  const createAuthCookie = user => {
    const token = jwttoken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    return `token=${token}`;
  };

  describe('Route definitions', () => {
    it('should have GET /api/listings route', async () => {
      const response = await request(app).get('/api/listings');

      expect(response.status).not.toBe(404);
    });

    it('should have GET /api/listings/my route', async () => {
      const response = await request(app).get('/api/listings/my');

      expect(response.status).not.toBe(404);
    });

    it('should have GET /api/listings/:id route', async () => {
      const response = await request(app).get(
        '/api/listings/123e4567-e89b-12d3-a456-426614174000'
      );

      expect(response.status).not.toBe(404);
    });

    it('should have POST /api/listings route', async () => {
      const response = await request(app).post('/api/listings').send({});

      expect(response.status).not.toBe(404);
    });

    it('should have PUT /api/listings/:id route', async () => {
      const response = await request(app)
        .put('/api/listings/123e4567-e89b-12d3-a456-426614174000')
        .send({});

      expect(response.status).not.toBe(404);
    });

    it('should have DELETE /api/listings/:id route', async () => {
      const response = await request(app).delete(
        '/api/listings/123e4567-e89b-12d3-a456-426614174000'
      );

      expect(response.status).not.toBe(404);
    });

    it('should return 404 for non-existent listing routes', async () => {
      const response = await request(app).get(
        '/api/listings/nonexistent/invalid'
      );

      expect(response.status).toBe(404);
    });
  });

  describe('Route authentication middleware', () => {
    it('should not require authentication for GET /api/listings', async () => {
      const response = await request(app).get('/api/listings');

      expect(response.status).not.toBe(401);
    });

    it('should require authentication for GET /api/listings/my', async () => {
      const response = await request(app).get('/api/listings/my');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should not require authentication for GET /api/listings/:id', async () => {
      const response = await request(app).get(
        '/api/listings/123e4567-e89b-12d3-a456-426614174000'
      );

      expect(response.status).not.toBe(401);
    });

    it('should require authentication for POST /api/listings', async () => {
      const response = await request(app)
        .post('/api/listings')
        .send({ title: 'Test Listing' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should require authentication for PUT /api/listings/:id', async () => {
      const response = await request(app)
        .put('/api/listings/123e4567-e89b-12d3-a456-426614174000')
        .send({ title: 'Updated Listing' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should require authentication for DELETE /api/listings/:id', async () => {
      const response = await request(app).delete(
        '/api/listings/123e4567-e89b-12d3-a456-426614174000'
      );

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('Authenticated route access', () => {
    it('should allow authenticated access to GET /api/listings/my', async () => {
      const response = await request(app)
        .get('/api/listings/my')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).not.toBe(401);
    });

    it('should allow authenticated access to POST /api/listings', async () => {
      const response = await request(app)
        .post('/api/listings')
        .set('Cookie', createAuthCookie(mockUser))
        .send({ title: 'Test Listing' });

      expect(response.status).not.toBe(401);
    });

    it('should allow authenticated access to PUT /api/listings/:id', async () => {
      const response = await request(app)
        .put('/api/listings/123e4567-e89b-12d3-a456-426614174000')
        .set('Cookie', createAuthCookie(mockUser))
        .send({ title: 'Updated Listing' });

      expect(response.status).not.toBe(401);
    });

    it('should allow authenticated access to DELETE /api/listings/:id', async () => {
      const response = await request(app)
        .delete('/api/listings/123e4567-e89b-12d3-a456-426614174000')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).not.toBe(401);
    });
  });

  describe('Route content handling', () => {
    it('should accept JSON content type for POST requests', async () => {
      const response = await request(app)
        .post('/api/listings')
        .set('Cookie', createAuthCookie(mockUser))
        .set('Content-Type', 'application/json')
        .send({ title: 'Test Listing' });

      expect(response.status).not.toBe(415);
    });

    it('should accept JSON content type for PUT requests', async () => {
      const response = await request(app)
        .put('/api/listings/123e4567-e89b-12d3-a456-426614174000')
        .set('Cookie', createAuthCookie(mockUser))
        .set('Content-Type', 'application/json')
        .send({ title: 'Updated Listing' });

      expect(response.status).not.toBe(415);
    });

    it('should handle CORS preflight requests', async () => {
      const response = await request(app).options('/api/listings');

      expect(response.status).toBe(200);
    });
  });
});
