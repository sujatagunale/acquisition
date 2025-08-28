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

describe('Users Routes', () => {
  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
  };

  const mockAdmin = {
    id: 2,
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
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
    it('should have GET /api/users route', async () => {
      const response = await request(app).get('/api/users');

      expect(response.status).not.toBe(404);
    });

    it('should have GET /api/users/:id route', async () => {
      const response = await request(app).get('/api/users/1');

      expect(response.status).not.toBe(404);
    });

    it('should have PUT /api/users/:id route', async () => {
      const response = await request(app).put('/api/users/1').send({});

      expect(response.status).not.toBe(404);
    });

    it('should have DELETE /api/users/:id route', async () => {
      const response = await request(app).delete('/api/users/1');

      expect(response.status).not.toBe(404);
    });

    it('should return 404 for non-existent user routes', async () => {
      const response = await request(app).get('/api/users/nonexistent/invalid');

      expect(response.status).toBe(404);
    });
  });

  describe('Route authentication middleware', () => {
    it('should require authentication for GET /api/users', async () => {
      const response = await request(app).get('/api/users');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should require authentication for GET /api/users/:id', async () => {
      const response = await request(app).get('/api/users/1');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should require authentication for PUT /api/users/:id', async () => {
      const response = await request(app)
        .put('/api/users/1')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should require authentication for DELETE /api/users/:id', async () => {
      const response = await request(app).delete('/api/users/1');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('Route authorization middleware', () => {
    it('should require admin role for GET /api/users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should allow admin access to GET /api/users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Cookie', createAuthCookie(mockAdmin));

      expect(response.status).not.toBe(403);
    });

    it('should require admin role for DELETE /api/users/:id', async () => {
      const response = await request(app)
        .delete('/api/users/1')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should allow admin access to DELETE /api/users/:id', async () => {
      const response = await request(app)
        .delete('/api/users/1')
        .set('Cookie', createAuthCookie(mockAdmin));

      expect(response.status).not.toBe(403);
    });

    it('should allow any authenticated user for GET /api/users/:id', async () => {
      const response = await request(app)
        .get('/api/users/1')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).not.toBe(403);
    });

    it('should allow any authenticated user for PUT /api/users/:id', async () => {
      const response = await request(app)
        .put('/api/users/1')
        .set('Cookie', createAuthCookie(mockUser))
        .send({ name: 'Updated Name' });

      expect(response.status).not.toBe(403);
    });
  });

  describe('Route content handling', () => {
    it('should accept JSON content type for PUT requests', async () => {
      const response = await request(app)
        .put('/api/users/1')
        .set('Cookie', createAuthCookie(mockUser))
        .set('Content-Type', 'application/json')
        .send({ name: 'Updated Name' });

      expect(response.status).not.toBe(415);
    });

    it('should handle CORS preflight requests', async () => {
      const response = await request(app).options('/api/users');

      expect(response.status).toBe(200);
    });
  });
});
