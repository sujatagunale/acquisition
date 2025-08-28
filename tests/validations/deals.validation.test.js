import { createDealSchema, updateDealSchema, dealIdSchema, acceptDealSchema } from '../../src/validations/deals.validation.js';

describe('Deals Validations', () => {
  describe('createDealSchema', () => {
    const validDealData = {
      listing_id: '123e4567-e89b-12d3-a456-426614174000',
      amount: 50000
    };

    it('should validate correct deal data', () => {
      const result = createDealSchema.safeParse(validDealData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validDealData);
    });

    describe('listing_id validation', () => {
      it('should accept valid UUID for listing_id', () => {
        const data = { ...validDealData, listing_id: '987fcdeb-51a2-43d1-9f12-123456789abc' };
        const result = createDealSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.listing_id).toBe('987fcdeb-51a2-43d1-9f12-123456789abc');
      });

      it('should reject invalid UUID format for listing_id', () => {
        const data = { ...validDealData, listing_id: 'invalid-uuid' };
        const result = createDealSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toContain('Invalid input');
      });

      it('should reject numeric listing_id', () => {
        const data = { ...validDealData, listing_id: 123 };
        const result = createDealSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toContain('Invalid input');
      });

      it('should require listing_id field', () => {
        const data = { amount: 50000 };
        const result = createDealSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('amount validation', () => {
      it('should accept positive number for amount', () => {
        const data = { ...validDealData, amount: 100000 };
        const result = createDealSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.amount).toBe(100000);
      });

      it('should accept decimal number for amount', () => {
        const data = { ...validDealData, amount: 50000.50 };
        const result = createDealSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.amount).toBe(50000.50);
      });

      it('should accept zero for amount', () => {
        const data = { ...validDealData, amount: 0 };
        const result = createDealSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.amount).toBe(0);
      });

      it('should accept negative number for amount', () => {
        const data = { ...validDealData, amount: -1000 };
        const result = createDealSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.amount).toBe(-1000);
      });

      it('should require amount field', () => {
        const data = { listing_id: '123e4567-e89b-12d3-a456-426614174000' };
        const result = createDealSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject string amount', () => {
        const data = { ...validDealData, amount: 'fifty thousand' };
        const result = createDealSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('updateDealSchema', () => {
    it('should validate update data with amount only', () => {
      const data = { amount: 75000 };
      const result = updateDealSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });

    it('should validate update data with status only', () => {
      const data = { status: 'in_escrow' };
      const result = updateDealSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });

    it('should validate update data with both fields', () => {
      const data = { amount: 75000, status: 'completed' };
      const result = updateDealSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });

    it('should reject empty update data', () => {
      const result = updateDealSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe('At least one field must be provided for update');
    });

    describe('amount validation in updates', () => {
      it('should accept positive number for amount', () => {
        const data = { amount: 100000 };
        const result = updateDealSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.amount).toBe(100000);
      });

      it('should accept decimal number for amount', () => {
        const data = { amount: 75000.75 };
        const result = updateDealSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.amount).toBe(75000.75);
      });

      it('should reject string amount', () => {
        const data = { amount: 'seventy five thousand' };
        const result = updateDealSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('status validation in updates', () => {
      it('should accept pending status', () => {
        const data = { status: 'pending' };
        const result = updateDealSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.status).toBe('pending');
      });

      it('should accept in_escrow status', () => {
        const data = { status: 'in_escrow' };
        const result = updateDealSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.status).toBe('in_escrow');
      });

      it('should accept completed status', () => {
        const data = { status: 'completed' };
        const result = updateDealSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.status).toBe('completed');
      });

      it('should accept cancelled status', () => {
        const data = { status: 'cancelled' };
        const result = updateDealSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.status).toBe('cancelled');
      });

      it('should reject invalid status', () => {
        const data = { status: 'invalid' };
        const result = updateDealSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('dealIdSchema', () => {
    it('should validate valid UUID', () => {
      const data = { id: '123e4567-e89b-12d3-a456-426614174000' };
      const result = dealIdSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should reject invalid UUID format', () => {
      const data = { id: 'invalid-uuid' };
      const result = dealIdSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('Invalid input');
    });

    it('should reject numeric ID', () => {
      const data = { id: 123 };
      const result = dealIdSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('Invalid input');
    });

    it('should reject empty string', () => {
      const data = { id: '' };
      const result = dealIdSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('Invalid input');
    });

    it('should require id field', () => {
      const data = {};
      const result = dealIdSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('acceptDealSchema', () => {
    it('should validate valid UUID', () => {
      const data = { id: '123e4567-e89b-12d3-a456-426614174000' };
      const result = acceptDealSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should reject invalid UUID format', () => {
      const data = { id: 'invalid-uuid' };
      const result = acceptDealSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('Invalid input');
    });

    it('should reject numeric ID', () => {
      const data = { id: 123 };
      const result = acceptDealSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('Invalid input');
    });

    it('should require id field', () => {
      const data = {};
      const result = acceptDealSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
