import request from 'supertest';
import app from '../../src/app.js';
import { jwttoken } from '../../src/utils/jwt.js';

jest.mock('../../src/services/deals.service.js');
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

const dealsService = require('../../src/services/deals.service.js');

describe('Deals Controller', () => {
  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user'
  };

  const mockAdmin = {
    id: 2,
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin'
  };

  const mockDeal = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    listing_id: '987fcdeb-51a2-43d1-9f12-123456789abc',
    buyer_id: 1,
    seller_id: 2,
    amount: 50000,
    status: 'pending',
    created_at: new Date(),
    updated_at: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createAuthCookie = (user) => {
    const token = jwttoken.sign({ id: user.id, email: user.email, role: user.role });
    return `token=${token}`;
  };

  describe('GET /api/deals', () => {
    it('should return all deals for admin', async () => {
      const deals = [mockDeal];
      dealsService.getUserById.mockResolvedValue(mockAdmin);
      dealsService.getAllDeals.mockResolvedValue(deals);

      const response = await request(app)
        .get('/api/deals')
        .set('Cookie', createAuthCookie(mockAdmin));

      expect(response.status).toBe(200);
      expect(response.body).toEqual(deals);
      expect(dealsService.getAllDeals).toHaveBeenCalled();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/deals');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should return 403 for non-admin users', async () => {
      dealsService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/deals')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should handle service errors', async () => {
      dealsService.getUserById.mockResolvedValue(mockAdmin);
      dealsService.getAllDeals.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/deals')
        .set('Cookie', createAuthCookie(mockAdmin));

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('GET /api/deals/:id', () => {
    it('should return deal by ID for authenticated user', async () => {
      dealsService.getUserById.mockResolvedValue(mockUser);
      dealsService.getDealById.mockResolvedValue(mockDeal);

      const response = await request(app)
        .get('/api/deals/123e4567-e89b-12d3-a456-426614174000')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockDeal);
      expect(dealsService.getDealById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should return 404 when deal not found', async () => {
      dealsService.getUserById.mockResolvedValue(mockUser);
      dealsService.getDealById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/deals/123e4567-e89b-12d3-a456-426614174000')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Deal not found');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/deals/123e4567-e89b-12d3-a456-426614174000');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should return 400 for invalid deal ID format', async () => {
      dealsService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/deals/invalid-uuid')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      dealsService.getUserById.mockResolvedValue(mockUser);
      dealsService.getDealById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/deals/123e4567-e89b-12d3-a456-426614174000')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('POST /api/deals', () => {
    const validDealData = {
      listing_id: '987fcdeb-51a2-43d1-9f12-123456789abc',
      amount: 50000
    };

    it('should create deal successfully', async () => {
      const createdDeal = { ...mockDeal, ...validDealData };
      dealsService.getUserById.mockResolvedValue(mockUser);
      dealsService.createDeal.mockResolvedValue(createdDeal);

      const response = await request(app)
        .post('/api/deals')
        .set('Cookie', createAuthCookie(mockUser))
        .send(validDealData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdDeal);
      expect(dealsService.createDeal).toHaveBeenCalledWith(mockUser.id, validDealData);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/deals')
        .send(validDealData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should return 400 for invalid deal data', async () => {
      dealsService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/deals')
        .set('Cookie', createAuthCookie(mockUser))
        .send({ listing_id: 'invalid-uuid' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 when listing not found', async () => {
      dealsService.getUserById.mockResolvedValue(mockUser);
      dealsService.createDeal.mockRejectedValue(new Error('Listing not found'));

      const response = await request(app)
        .post('/api/deals')
        .set('Cookie', createAuthCookie(mockUser))
        .send(validDealData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Listing not found');
    });

    it('should handle service errors', async () => {
      dealsService.getUserById.mockResolvedValue(mockUser);
      dealsService.createDeal.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/deals')
        .set('Cookie', createAuthCookie(mockUser))
        .send(validDealData);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('PUT /api/deals/:id', () => {
    const updateData = {
      amount: 75000,
      status: 'in_escrow'
    };

    it('should update deal successfully', async () => {
      const updatedDeal = { ...mockDeal, ...updateData };
      dealsService.getUserById.mockResolvedValue(mockUser);
      dealsService.updateDeal.mockResolvedValue(updatedDeal);

      const response = await request(app)
        .put('/api/deals/123e4567-e89b-12d3-a456-426614174000')
        .set('Cookie', createAuthCookie(mockUser))
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedDeal);
      expect(dealsService.updateDeal).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', updateData);
    });

    it('should return 404 when deal not found', async () => {
      dealsService.getUserById.mockResolvedValue(mockUser);
      dealsService.updateDeal.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/deals/123e4567-e89b-12d3-a456-426614174000')
        .set('Cookie', createAuthCookie(mockUser))
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Deal not found');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/deals/123e4567-e89b-12d3-a456-426614174000')
        .send(updateData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should return 400 for invalid deal ID', async () => {
      dealsService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .put('/api/deals/invalid-uuid')
        .set('Cookie', createAuthCookie(mockUser))
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid update data', async () => {
      dealsService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .put('/api/deals/123e4567-e89b-12d3-a456-426614174000')
        .set('Cookie', createAuthCookie(mockUser))
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      dealsService.getUserById.mockResolvedValue(mockUser);
      dealsService.updateDeal.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/deals/123e4567-e89b-12d3-a456-426614174000')
        .set('Cookie', createAuthCookie(mockUser))
        .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('DELETE /api/deals/:id', () => {
    it('should delete deal successfully', async () => {
      const deletedDeal = mockDeal;
      dealsService.getUserById.mockResolvedValue(mockUser);
      dealsService.deleteDeal.mockResolvedValue(deletedDeal);

      const response = await request(app)
        .delete('/api/deals/123e4567-e89b-12d3-a456-426614174000')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Deal deleted successfully',
        deal: deletedDeal
      });
      expect(dealsService.deleteDeal).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should return 404 when deal not found', async () => {
      dealsService.getUserById.mockResolvedValue(mockUser);
      dealsService.deleteDeal.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/deals/123e4567-e89b-12d3-a456-426614174000')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Deal not found');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete('/api/deals/123e4567-e89b-12d3-a456-426614174000');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should return 400 for invalid deal ID', async () => {
      dealsService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .delete('/api/deals/invalid-uuid')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      dealsService.getUserById.mockResolvedValue(mockUser);
      dealsService.deleteDeal.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/deals/123e4567-e89b-12d3-a456-426614174000')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('POST /api/deals/:id/accept', () => {
    it('should accept deal successfully', async () => {
      const acceptedDeal = { ...mockDeal, status: 'in_escrow' };
      dealsService.getUserById.mockResolvedValue(mockUser);
      dealsService.acceptDeal.mockResolvedValue(acceptedDeal);

      const response = await request(app)
        .post('/api/deals/123e4567-e89b-12d3-a456-426614174000/accept')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Deal accepted successfully',
        deal: acceptedDeal
      });
      expect(dealsService.acceptDeal).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', mockUser.id);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/deals/123e4567-e89b-12d3-a456-426614174000/accept');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should return 400 for invalid deal ID', async () => {
      dealsService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/deals/invalid-uuid/accept')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 when deal not found', async () => {
      dealsService.getUserById.mockResolvedValue(mockUser);
      dealsService.acceptDeal.mockRejectedValue(new Error('Deal not found'));

      const response = await request(app)
        .post('/api/deals/123e4567-e89b-12d3-a456-426614174000/accept')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Deal not found');
    });

    it('should return 403 when user is not the seller', async () => {
      dealsService.getUserById.mockResolvedValue(mockUser);
      dealsService.acceptDeal.mockRejectedValue(new Error('Access denied'));

      const response = await request(app)
        .post('/api/deals/123e4567-e89b-12d3-a456-426614174000/accept')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Access denied');
    });

    it('should handle service errors', async () => {
      dealsService.getUserById.mockResolvedValue(mockUser);
      dealsService.acceptDeal.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/deals/123e4567-e89b-12d3-a456-426614174000/accept')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('GET /api/deals/listing/:listingId', () => {
    const listingId = '987fcdeb-51a2-43d1-9f12-123456789abc';

    it('should return deals by listing for authenticated user', async () => {
      const listingDeals = [mockDeal];
      dealsService.getUserById.mockResolvedValue(mockUser);
      dealsService.getDealsByListing.mockResolvedValue(listingDeals);

      const response = await request(app)
        .get(`/api/deals/listing/${listingId}`)
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(200);
      expect(response.body).toEqual(listingDeals);
      expect(dealsService.getDealsByListing).toHaveBeenCalledWith(listingId);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/deals/listing/${listingId}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should handle service errors', async () => {
      dealsService.getUserById.mockResolvedValue(mockUser);
      dealsService.getDealsByListing.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get(`/api/deals/listing/${listingId}`)
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });

    it('should return empty array when listing has no deals', async () => {
      dealsService.getUserById.mockResolvedValue(mockUser);
      dealsService.getDealsByListing.mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/deals/listing/${listingId}`)
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
});
