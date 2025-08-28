import * as listingsService from '../../src/services/listings.service.js';

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

describe('Listings Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllListings', () => {
    it('should return all listings successfully', async () => {
      const listings = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          seller_id: 1,
          title: 'Test Listing 1',
          description: 'Description 1',
          status: 'listed',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '987fcdeb-51a2-43d1-9f12-123456789abc',
          seller_id: 2,
          title: 'Test Listing 2',
          description: 'Description 2',
          status: 'draft',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      db.select.mockReturnValue({
        from: jest.fn().mockResolvedValue(listings),
      });

      const result = await listingsService.getAllListings();

      expect(result).toEqual(listings);
      expect(db.select).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(listingsService.getAllListings()).rejects.toThrow(
        'Database error'
      );
    });

    it('should return empty array when no listings exist', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockResolvedValue([]),
      });

      const result = await listingsService.getAllListings();

      expect(result).toEqual([]);
    });
  });

  describe('getListingById', () => {
    const listingId = '123e4567-e89b-12d3-a456-426614174000';
    const listing = {
      id: listingId,
      seller_id: 1,
      title: 'Test Listing',
      description: 'Test Description',
      status: 'listed',
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should return listing by ID successfully', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([listing]),
          }),
        }),
      });

      const result = await listingsService.getListingById(listingId);

      expect(result).toEqual(listing);
    });

    it('should return null when listing not found', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await listingsService.getListingById(listingId);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      });

      await expect(listingsService.getListingById(listingId)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('createListing', () => {
    const sellerId = 1;
    const listingData = {
      title: 'New Listing',
      description: 'New Description',
      category: 'SaaS',
      asking_price: 50000,
      status: 'draft',
    };
    const createdListing = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      seller_id: sellerId,
      ...listingData,
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should create listing successfully', async () => {
      db.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdListing]),
        }),
      });

      const result = await listingsService.createListing(sellerId, listingData);

      expect(result).toEqual(createdListing);
      expect(db.insert).toHaveBeenCalled();
    });

    it('should include seller_id and updated_at in listing data', async () => {
      const valuesMock = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([createdListing]),
      });

      db.insert.mockReturnValue({
        values: valuesMock,
      });

      await listingsService.createListing(sellerId, listingData);

      expect(valuesMock).toHaveBeenCalledWith({
        ...listingData,
        seller_id: sellerId,
        updated_at: expect.any(Date),
      });
    });

    it('should handle database errors', async () => {
      db.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      await expect(
        listingsService.createListing(sellerId, listingData)
      ).rejects.toThrow('Database error');
    });

    it('should handle minimal listing data', async () => {
      const minimalData = { title: 'Minimal Listing' };
      const minimalListing = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        seller_id: sellerId,
        title: 'Minimal Listing',
        created_at: new Date(),
        updated_at: new Date(),
      };

      db.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([minimalListing]),
        }),
      });

      const result = await listingsService.createListing(sellerId, minimalData);

      expect(result).toEqual(minimalListing);
    });
  });

  describe('updateListing', () => {
    const listingId = '123e4567-e89b-12d3-a456-426614174000';
    const updates = {
      title: 'Updated Listing',
      description: 'Updated Description',
      status: 'listed',
    };
    const updatedListing = {
      id: listingId,
      seller_id: 1,
      ...updates,
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should update listing successfully', async () => {
      db.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedListing]),
          }),
        }),
      });

      const result = await listingsService.updateListing(listingId, updates);

      expect(result).toEqual(updatedListing);
      expect(db.update).toHaveBeenCalled();
    });

    it('should include updated_at timestamp in update data', async () => {
      const setMock = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([updatedListing]),
        }),
      });

      db.update.mockReturnValue({
        set: setMock,
      });

      await listingsService.updateListing(listingId, updates);

      expect(setMock).toHaveBeenCalledWith({
        ...updates,
        updated_at: expect.any(Date),
      });
    });

    it('should return null when listing not found', async () => {
      db.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await listingsService.updateListing(listingId, updates);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      db.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      });

      await expect(
        listingsService.updateListing(listingId, updates)
      ).rejects.toThrow('Database error');
    });
  });

  describe('deleteListing', () => {
    const listingId = '123e4567-e89b-12d3-a456-426614174000';
    const deletedListing = {
      id: listingId,
      seller_id: 1,
      title: 'Deleted Listing',
      description: 'Deleted Description',
      status: 'withdrawn',
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should delete listing successfully', async () => {
      db.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([deletedListing]),
        }),
      });

      const result = await listingsService.deleteListing(listingId);

      expect(result).toEqual(deletedListing);
      expect(db.delete).toHaveBeenCalled();
    });

    it('should return null when listing not found', async () => {
      db.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await listingsService.deleteListing(listingId);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      db.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      await expect(listingsService.deleteListing(listingId)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('getListingsBySeller', () => {
    const sellerId = 1;
    const sellerListings = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        seller_id: sellerId,
        title: 'Seller Listing 1',
        status: 'listed',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '987fcdeb-51a2-43d1-9f12-123456789abc',
        seller_id: sellerId,
        title: 'Seller Listing 2',
        status: 'draft',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    it('should return listings by seller successfully', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(sellerListings),
        }),
      });

      const result = await listingsService.getListingsBySeller(sellerId);

      expect(result).toEqual(sellerListings);
    });

    it('should return empty array when seller has no listings', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await listingsService.getListingsBySeller(sellerId);

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      await expect(
        listingsService.getListingsBySeller(sellerId)
      ).rejects.toThrow('Database error');
    });
  });
});
