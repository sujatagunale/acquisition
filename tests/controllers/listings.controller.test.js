import request from 'supertest';
import app from '../../src/app.js';
import { jwttoken } from '../../src/utils/jwt.js';

jest.mock('../../src/services/listings.service.js');
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

const listingsService = require('../../src/services/listings.service.js');

describe('Listings Controller', () => {
  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user'
  };

  const mockListing = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    seller_id: 1,
    title: 'Test Listing',
    description: 'Test Description',
    category: 'SaaS',
    asking_price: 50000,
    status: 'listed',
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

  describe('GET /api/listings', () => {
    it('should return all listings', async () => {
      const listings = [mockListing];
      listingsService.getAllListings.mockResolvedValue(listings);

      const response = await request(app)
        .get('/api/listings');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(listings);
      expect(listingsService.getAllListings).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      listingsService.getAllListings.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/listings');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });

    it('should return empty array when no listings exist', async () => {
      listingsService.getAllListings.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/listings');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/listings/my', () => {
    it('should return user listings for authenticated user', async () => {
      const userListings = [mockListing];
      listingsService.getUserById.mockResolvedValue(mockUser);
      listingsService.getListingsBySeller.mockResolvedValue(userListings);

      const response = await request(app)
        .get('/api/listings/my')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(200);
      expect(response.body).toEqual(userListings);
      expect(listingsService.getListingsBySeller).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/listings/my');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should handle service errors', async () => {
      listingsService.getUserById.mockResolvedValue(mockUser);
      listingsService.getListingsBySeller.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/listings/my')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('GET /api/listings/:id', () => {
    it('should return listing by ID', async () => {
      listingsService.getListingById.mockResolvedValue(mockListing);

      const response = await request(app)
        .get('/api/listings/123e4567-e89b-12d3-a456-426614174000');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockListing);
      expect(listingsService.getListingById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should return 404 when listing not found', async () => {
      listingsService.getListingById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/listings/123e4567-e89b-12d3-a456-426614174000');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Listing not found');
    });

    it('should return 400 for invalid listing ID format', async () => {
      const response = await request(app)
        .get('/api/listings/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      listingsService.getListingById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/listings/123e4567-e89b-12d3-a456-426614174000');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('POST /api/listings', () => {
    const validListingData = {
      title: 'New Listing',
      description: 'New Description',
      category: 'E-commerce',
      asking_price: 75000,
      status: 'draft'
    };

    it('should create listing successfully', async () => {
      const createdListing = { ...mockListing, ...validListingData };
      listingsService.getUserById.mockResolvedValue(mockUser);
      listingsService.createListing.mockResolvedValue(createdListing);

      const response = await request(app)
        .post('/api/listings')
        .set('Cookie', createAuthCookie(mockUser))
        .send(validListingData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdListing);
      expect(listingsService.createListing).toHaveBeenCalledWith(mockUser.id, validListingData);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/listings')
        .send(validListingData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should return 400 for invalid listing data', async () => {
      listingsService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/listings')
        .set('Cookie', createAuthCookie(mockUser))
        .send({ title: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      listingsService.getUserById.mockResolvedValue(mockUser);
      listingsService.createListing.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/listings')
        .set('Cookie', createAuthCookie(mockUser))
        .send(validListingData);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });

    it('should create listing with minimal data', async () => {
      const minimalData = { title: 'Minimal Listing' };
      const createdListing = { ...mockListing, ...minimalData };
      listingsService.getUserById.mockResolvedValue(mockUser);
      listingsService.createListing.mockResolvedValue(createdListing);

      const response = await request(app)
        .post('/api/listings')
        .set('Cookie', createAuthCookie(mockUser))
        .send(minimalData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdListing);
    });
  });

  describe('PUT /api/listings/:id', () => {
    const updateData = {
      title: 'Updated Listing',
      description: 'Updated Description',
      status: 'listed'
    };

    it('should update listing successfully', async () => {
      const updatedListing = { ...mockListing, ...updateData };
      listingsService.getUserById.mockResolvedValue(mockUser);
      listingsService.updateListing.mockResolvedValue(updatedListing);

      const response = await request(app)
        .put('/api/listings/123e4567-e89b-12d3-a456-426614174000')
        .set('Cookie', createAuthCookie(mockUser))
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedListing);
      expect(listingsService.updateListing).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', updateData);
    });

    it('should return 404 when listing not found', async () => {
      listingsService.getUserById.mockResolvedValue(mockUser);
      listingsService.updateListing.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/listings/123e4567-e89b-12d3-a456-426614174000')
        .set('Cookie', createAuthCookie(mockUser))
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Listing not found');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/listings/123e4567-e89b-12d3-a456-426614174000')
        .send(updateData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should return 400 for invalid listing ID', async () => {
      listingsService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .put('/api/listings/invalid-uuid')
        .set('Cookie', createAuthCookie(mockUser))
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid update data', async () => {
      listingsService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .put('/api/listings/123e4567-e89b-12d3-a456-426614174000')
        .set('Cookie', createAuthCookie(mockUser))
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      listingsService.getUserById.mockResolvedValue(mockUser);
      listingsService.updateListing.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/listings/123e4567-e89b-12d3-a456-426614174000')
        .set('Cookie', createAuthCookie(mockUser))
        .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('DELETE /api/listings/:id', () => {
    it('should delete listing successfully', async () => {
      const deletedListing = mockListing;
      listingsService.getUserById.mockResolvedValue(mockUser);
      listingsService.deleteListing.mockResolvedValue(deletedListing);

      const response = await request(app)
        .delete('/api/listings/123e4567-e89b-12d3-a456-426614174000')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Listing deleted successfully',
        listing: deletedListing
      });
      expect(listingsService.deleteListing).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should return 404 when listing not found', async () => {
      listingsService.getUserById.mockResolvedValue(mockUser);
      listingsService.deleteListing.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/listings/123e4567-e89b-12d3-a456-426614174000')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Listing not found');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete('/api/listings/123e4567-e89b-12d3-a456-426614174000');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should return 400 for invalid listing ID', async () => {
      listingsService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .delete('/api/listings/invalid-uuid')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      listingsService.getUserById.mockResolvedValue(mockUser);
      listingsService.deleteListing.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/listings/123e4567-e89b-12d3-a456-426614174000')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });
});
