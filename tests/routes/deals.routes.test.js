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

describe('Deals Routes', () => {
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
    it('should have GET /api/deals route', async () => {
      const response = await request(app).get('/api/deals');

      expect(response.status).not.toBe(404);
    });

    it('should have GET /api/deals/:id route', async () => {
      const response = await request(app).get(
        '/api/deals/123e4567-e89b-12d3-a456-426614174000'
      );

      expect(response.status).not.toBe(404);
    });

    it('should have POST /api/deals route', async () => {
      const response = await request(app).post('/api/deals').send({});

      expect(response.status).not.toBe(404);
    });

    it('should have PUT /api/deals/:id route', async () => {
      const response = await request(app)
        .put('/api/deals/123e4567-e89b-12d3-a456-426614174000')
        .send({});

      expect(response.status).not.toBe(404);
    });

    it('should have DELETE /api/deals/:id route', async () => {
      const response = await request(app).delete(
        '/api/deals/123e4567-e89b-12d3-a456-426614174000'
      );

      expect(response.status).not.toBe(404);
    });

    it('should have POST /api/deals/:id/accept route', async () => {
      const response = await request(app).post(
        '/api/deals/123e4567-e89b-12d3-a456-426614174000/accept'
      );

      expect(response.status).not.toBe(404);
    });

    it('should have GET /api/deals/listing/:listingId route', async () => {
      const response = await request(app).get(
        '/api/deals/listing/987fcdeb-51a2-43d1-9f12-123456789abc'
      );

      expect(response.status).not.toBe(404);
    });

    it('should return 404 for non-existent deal routes', async () => {
      const response = await request(app).get('/api/deals/nonexistent/invalid');

      expect(response.status).toBe(404);
    });
  });

  describe('Route authentication middleware', () => {
    it('should require authentication for GET /api/deals', async () => {
      const response = await request(app).get('/api/deals');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should require authentication for GET /api/deals/:id', async () => {
      const response = await request(app).get(
        '/api/deals/123e4567-e89b-12d3-a456-426614174000'
      );

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should require authentication for POST /api/deals', async () => {
      const response = await request(app).post('/api/deals').send({
        listing_id: '987fcdeb-51a2-43d1-9f12-123456789abc',
        amount: 50000,
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should require authentication for PUT /api/deals/:id', async () => {
      const response = await request(app)
        .put('/api/deals/123e4567-e89b-12d3-a456-426614174000')
        .send({ amount: 75000 });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should require authentication for DELETE /api/deals/:id', async () => {
      const response = await request(app).delete(
        '/api/deals/123e4567-e89b-12d3-a456-426614174000'
      );

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should require authentication for POST /api/deals/:id/accept', async () => {
      const response = await request(app).post(
        '/api/deals/123e4567-e89b-12d3-a456-426614174000/accept'
      );

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should require authentication for GET /api/deals/listing/:listingId', async () => {
      const response = await request(app).get(
        '/api/deals/listing/987fcdeb-51a2-43d1-9f12-123456789abc'
      );

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('Route authorization middleware', () => {
    it('should require admin role for GET /api/deals', async () => {
      const response = await request(app)
        .get('/api/deals')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should allow admin access to GET /api/deals', async () => {
      const response = await request(app)
        .get('/api/deals')
        .set('Cookie', createAuthCookie(mockAdmin));

      expect(response.status).not.toBe(403);
    });

    it('should allow any authenticated user for other deal routes', async () => {
      const routes = [
        {
          method: 'get',
          path: '/api/deals/123e4567-e89b-12d3-a456-426614174000',
        },
        {
          method: 'post',
          path: '/api/deals',
          body: {
            listing_id: '987fcdeb-51a2-43d1-9f12-123456789abc',
            amount: 50000,
          },
        },
        {
          method: 'put',
          path: '/api/deals/123e4567-e89b-12d3-a456-426614174000',
          body: { amount: 75000 },
        },
        {
          method: 'delete',
          path: '/api/deals/123e4567-e89b-12d3-a456-426614174000',
        },
        {
          method: 'post',
          path: '/api/deals/123e4567-e89b-12d3-a456-426614174000/accept',
        },
        {
          method: 'get',
          path: '/api/deals/listing/987fcdeb-51a2-43d1-9f12-123456789abc',
        },
      ];

      for (const route of routes) {
        const response = await request(app)
          [route.method](route.path)
          .set('Cookie', createAuthCookie(mockUser))
          .send(route.body || {});

        expect(response.status).not.toBe(403);
      }
    });
  });

  describe('Route content handling', () => {
    it('should accept JSON content type for POST requests', async () => {
      const response = await request(app)
        .post('/api/deals')
        .set('Cookie', createAuthCookie(mockUser))
        .set('Content-Type', 'application/json')
        .send({
          listing_id: '987fcdeb-51a2-43d1-9f12-123456789abc',
          amount: 50000,
        });

      expect(response.status).not.toBe(415);
    });

    it('should accept JSON content type for PUT requests', async () => {
      const response = await request(app)
        .put('/api/deals/123e4567-e89b-12d3-a456-426614174000')
        .set('Cookie', createAuthCookie(mockUser))
        .set('Content-Type', 'application/json')
        .send({ amount: 75000 });

      expect(response.status).not.toBe(415);
    });

    it('should handle CORS preflight requests', async () => {
      const response = await request(app).options('/api/deals');

      expect(response.status).toBe(200);
    });
  });
});
