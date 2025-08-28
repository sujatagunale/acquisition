import * as dealsService from '../../src/services/deals.service.js';

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


describe('Deals Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllDeals', () => {
    it('should return all deals successfully', async () => {
      const deals = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          listing_id: '987fcdeb-51a2-43d1-9f12-123456789abc',
          buyer_id: 1,
          seller_id: 2,
          amount: 50000,
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      db.select.mockReturnValue({
        from: jest.fn().mockResolvedValue(deals)
      });

      const result = await dealsService.getAllDeals();

      expect(result).toEqual(deals);
      expect(db.select).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await expect(dealsService.getAllDeals()).rejects.toThrow('Database error');
    });

    it('should return empty array when no deals exist', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockResolvedValue([])
      });

      const result = await dealsService.getAllDeals();

      expect(result).toEqual([]);
    });
  });

  describe('getDealById', () => {
    const dealId = '123e4567-e89b-12d3-a456-426614174000';
    const deal = {
      id: dealId,
      listing_id: '987fcdeb-51a2-43d1-9f12-123456789abc',
      buyer_id: 1,
      seller_id: 2,
      amount: 50000,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };

    it('should return deal by ID successfully', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([deal])
          })
        })
      });

      const result = await dealsService.getDealById(dealId);

      expect(result).toEqual(deal);
    });

    it('should return null when deal not found', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });

      const result = await dealsService.getDealById(dealId);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(new Error('Database error'))
          })
        })
      });

      await expect(dealsService.getDealById(dealId)).rejects.toThrow('Database error');
    });
  });

  describe('createDeal', () => {
    const buyerId = 1;
    const dealData = {
      listing_id: '987fcdeb-51a2-43d1-9f12-123456789abc',
      amount: 50000
    };
    const listing = {
      id: '987fcdeb-51a2-43d1-9f12-123456789abc',
      seller_id: 2,
      title: 'Test Listing',
      status: 'listed'
    };
    const createdDeal = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      listing_id: dealData.listing_id,
      buyer_id: buyerId,
      seller_id: listing.seller_id,
      amount: dealData.amount,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };

    it('should create deal successfully', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([listing])
          })
        })
      });

      db.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdDeal])
        })
      });

      const result = await dealsService.createDeal(buyerId, dealData);

      expect(result).toEqual(createdDeal);
    });

    it('should include buyer_id, seller_id, and updated_at in deal data', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([listing])
          })
        })
      });

      const valuesMock = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([createdDeal])
      });

      db.insert.mockReturnValue({
        values: valuesMock
      });

      await dealsService.createDeal(buyerId, dealData);

      expect(valuesMock).toHaveBeenCalledWith({
        ...dealData,
        buyer_id: buyerId,
        seller_id: listing.seller_id,
        updated_at: expect.any(Date)
      });
    });

    it('should throw error when listing not found', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });

      await expect(dealsService.createDeal(buyerId, dealData)).rejects.toThrow('Listing not found');
    });

    it('should handle database errors', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(new Error('Database error'))
          })
        })
      });

      await expect(dealsService.createDeal(buyerId, dealData)).rejects.toThrow('Database error');
    });
  });

  describe('updateDeal', () => {
    const dealId = '123e4567-e89b-12d3-a456-426614174000';
    const updates = {
      amount: 75000,
      status: 'in_escrow'
    };
    const updatedDeal = {
      id: dealId,
      listing_id: '987fcdeb-51a2-43d1-9f12-123456789abc',
      buyer_id: 1,
      seller_id: 2,
      ...updates,
      created_at: new Date(),
      updated_at: new Date()
    };

    it('should update deal successfully', async () => {
      db.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedDeal])
          })
        })
      });

      const result = await dealsService.updateDeal(dealId, updates);

      expect(result).toEqual(updatedDeal);
    });

    it('should include updated_at timestamp in update data', async () => {
      const setMock = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([updatedDeal])
        })
      });

      db.update.mockReturnValue({
        set: setMock
      });

      await dealsService.updateDeal(dealId, updates);

      expect(setMock).toHaveBeenCalledWith({
        ...updates,
        updated_at: expect.any(Date)
      });
    });

    it('should return null when deal not found', async () => {
      db.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([])
          })
        })
      });

      const result = await dealsService.updateDeal(dealId, updates);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      db.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockRejectedValue(new Error('Database error'))
          })
        })
      });

      await expect(dealsService.updateDeal(dealId, updates)).rejects.toThrow('Database error');
    });
  });

  describe('deleteDeal', () => {
    const dealId = '123e4567-e89b-12d3-a456-426614174000';
    const deletedDeal = {
      id: dealId,
      listing_id: '987fcdeb-51a2-43d1-9f12-123456789abc',
      buyer_id: 1,
      seller_id: 2,
      amount: 50000,
      status: 'cancelled',
      created_at: new Date(),
      updated_at: new Date()
    };

    it('should delete deal successfully', async () => {
      db.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([deletedDeal])
        })
      });

      const result = await dealsService.deleteDeal(dealId);

      expect(result).toEqual(deletedDeal);
    });

    it('should return null when deal not found', async () => {
      db.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([])
        })
      });

      const result = await dealsService.deleteDeal(dealId);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      db.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      });

      await expect(dealsService.deleteDeal(dealId)).rejects.toThrow('Database error');
    });
  });

  describe('getDealsByListing', () => {
    const listingId = '987fcdeb-51a2-43d1-9f12-123456789abc';
    const listingDeals = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        buyer: {
          id: 1,
          name: 'John Buyer',
          email: 'buyer@example.com'
        },
        seller: {
          id: 2,
          name: 'Jane Seller',
          email: 'seller@example.com'
        },
        amount: 50000,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    it('should return deals by listing successfully', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(listingDeals)
            })
          })
        })
      });

      const result = await dealsService.getDealsByListing(listingId);

      expect(result).toEqual(listingDeals);
    });

    it('should return empty array when listing has no deals', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([])
            })
          })
        })
      });

      const result = await dealsService.getDealsByListing(listingId);

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockRejectedValue(new Error('Database error'))
            })
          })
        })
      });

      await expect(dealsService.getDealsByListing(listingId)).rejects.toThrow('Database error');
    });
  });

  describe('acceptDeal', () => {
    const dealId = '123e4567-e89b-12d3-a456-426614174000';
    const sellerId = 2;
    const dealToAccept = {
      id: dealId,
      listing_id: '987fcdeb-51a2-43d1-9f12-123456789abc',
      buyer_id: 1,
      seller_id: sellerId,
      amount: 50000,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };
    const acceptedDeal = {
      ...dealToAccept,
      status: 'in_escrow',
      updated_at: new Date()
    };

    it('should accept deal successfully', async () => {
      const txMock = {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([dealToAccept])
            })
          })
        }),
        update: jest.fn()
          .mockReturnValueOnce({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([acceptedDeal])
              })
            })
          })
          .mockReturnValueOnce({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue()
            })
          })
      };

      db.transaction.mockImplementation(callback => callback(txMock));

      const result = await dealsService.acceptDeal(dealId, sellerId);

      expect(result).toEqual(acceptedDeal);
      expect(db.transaction).toHaveBeenCalled();
    });

    it('should throw error when deal not found', async () => {
      const txMock = {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      };

      db.transaction.mockImplementation(callback => callback(txMock));

      await expect(dealsService.acceptDeal(dealId, sellerId)).rejects.toThrow('Deal not found');
    });

    it('should throw error when seller does not own the deal', async () => {
      const wrongSellerId = 999;
      const txMock = {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([dealToAccept])
            })
          })
        })
      };

      db.transaction.mockImplementation(callback => callback(txMock));

      await expect(dealsService.acceptDeal(dealId, wrongSellerId)).rejects.toThrow('Access denied');
    });

    it('should throw error when deal is not in pending status', async () => {
      const nonPendingDeal = { ...dealToAccept, status: 'completed' };
      const txMock = {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([nonPendingDeal])
            })
          })
        })
      };

      db.transaction.mockImplementation(callback => callback(txMock));

      await expect(dealsService.acceptDeal(dealId, sellerId)).rejects.toThrow('Deal is not in pending status');
    });

    it('should cancel other pending deals for the same listing', async () => {
      const txMock = {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([dealToAccept])
            })
          })
        }),
        update: jest.fn()
          .mockReturnValueOnce({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([acceptedDeal])
              })
            })
          })
          .mockReturnValueOnce({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue()
            })
          })
      };

      db.transaction.mockImplementation(callback => callback(txMock));

      await dealsService.acceptDeal(dealId, sellerId);

      expect(txMock.update).toHaveBeenCalledTimes(2);
    });

    it('should handle database errors in transaction', async () => {
      db.transaction.mockRejectedValue(new Error('Transaction error'));

      await expect(dealsService.acceptDeal(dealId, sellerId)).rejects.toThrow('Transaction error');
    });
  });
});
