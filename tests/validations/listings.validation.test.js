import {
  createListingSchema,
  updateListingSchema,
  listingIdSchema,
} from '../../src/validations/listings.validation.js';

describe('Listings Validations', () => {
  describe('createListingSchema', () => {
    const validListingData = {
      title: 'Test Listing',
      description: 'A test listing description',
      category: 'SaaS',
      tech_stack: ['React', 'Node.js'],
      asking_price: 50000,
      revenue_monthly: 5000,
      profit_monthly: 3000,
      status: 'listed',
    };

    it('should validate correct listing data', () => {
      const result = createListingSchema.safeParse(validListingData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validListingData);
    });

    it('should default status to draft when not provided', () => {
      const data = { ...validListingData };
      delete data.status;
      const result = createListingSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('draft');
    });

    it('should validate with only required title field', () => {
      const data = { title: 'Minimal Listing' };
      const result = createListingSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Minimal Listing');
      expect(result.data.status).toBe('draft');
    });

    it('should trim title', () => {
      const data = { title: '  Test Listing  ' };
      const result = createListingSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Test Listing');
    });

    describe('title validation', () => {
      it('should reject empty title', () => {
        const data = { title: '' };
        const result = createListingSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toBe('Title is required');
      });

      it('should reject title longer than 255 characters', () => {
        const data = { title: 'a'.repeat(256) };
        const result = createListingSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toBe(
          'Title must not exceed 255 characters'
        );
      });

      it('should accept title with exactly 255 characters', () => {
        const data = { title: 'a'.repeat(255) };
        const result = createListingSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should require title field', () => {
        const data = { description: 'Test' };
        const result = createListingSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('optional fields validation', () => {
      it('should accept undefined description', () => {
        const data = { title: 'Test' };
        const result = createListingSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.description).toBeUndefined();
      });

      it('should accept string description', () => {
        const data = { title: 'Test', description: 'Test description' };
        const result = createListingSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.description).toBe('Test description');
      });

      it('should accept undefined category', () => {
        const data = { title: 'Test' };
        const result = createListingSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.category).toBeUndefined();
      });

      it('should accept string category', () => {
        const data = { title: 'Test', category: 'E-commerce' };
        const result = createListingSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.category).toBe('E-commerce');
      });

      it('should accept undefined tech_stack', () => {
        const data = { title: 'Test' };
        const result = createListingSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.tech_stack).toBeUndefined();
      });

      it('should accept array of strings for tech_stack', () => {
        const data = {
          title: 'Test',
          tech_stack: ['React', 'Node.js', 'PostgreSQL'],
        };
        const result = createListingSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.tech_stack).toEqual([
          'React',
          'Node.js',
          'PostgreSQL',
        ]);
      });

      it('should accept empty array for tech_stack', () => {
        const data = { title: 'Test', tech_stack: [] };
        const result = createListingSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.tech_stack).toEqual([]);
      });
    });

    describe('numeric fields validation', () => {
      it('should accept undefined asking_price', () => {
        const data = { title: 'Test' };
        const result = createListingSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.asking_price).toBeUndefined();
      });

      it('should accept number asking_price', () => {
        const data = { title: 'Test', asking_price: 100000 };
        const result = createListingSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.asking_price).toBe(100000);
      });

      it('should accept undefined revenue_monthly', () => {
        const data = { title: 'Test' };
        const result = createListingSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.revenue_monthly).toBeUndefined();
      });

      it('should accept number revenue_monthly', () => {
        const data = { title: 'Test', revenue_monthly: 10000 };
        const result = createListingSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.revenue_monthly).toBe(10000);
      });

      it('should accept undefined profit_monthly', () => {
        const data = { title: 'Test' };
        const result = createListingSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.profit_monthly).toBeUndefined();
      });

      it('should accept number profit_monthly', () => {
        const data = { title: 'Test', profit_monthly: 5000 };
        const result = createListingSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.profit_monthly).toBe(5000);
      });
    });

    describe('status validation', () => {
      it('should accept draft status', () => {
        const data = { title: 'Test', status: 'draft' };
        const result = createListingSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.status).toBe('draft');
      });

      it('should accept listed status', () => {
        const data = { title: 'Test', status: 'listed' };
        const result = createListingSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.status).toBe('listed');
      });

      it('should accept sold status', () => {
        const data = { title: 'Test', status: 'sold' };
        const result = createListingSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.status).toBe('sold');
      });

      it('should accept withdrawn status', () => {
        const data = { title: 'Test', status: 'withdrawn' };
        const result = createListingSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.status).toBe('withdrawn');
      });

      it('should reject invalid status', () => {
        const data = { title: 'Test', status: 'invalid' };
        const result = createListingSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('updateListingSchema', () => {
    it('should validate update data with all fields', () => {
      const data = {
        title: 'Updated Listing',
        description: 'Updated description',
        category: 'Updated category',
        tech_stack: ['Vue.js'],
        asking_price: 75000,
        revenue_monthly: 7500,
        profit_monthly: 4500,
        status: 'listed',
      };
      const result = updateListingSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });

    it('should validate update data with only title', () => {
      const data = { title: 'Updated Title' };
      const result = updateListingSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });

    it('should trim title', () => {
      const data = { title: '  Updated Title  ' };
      const result = updateListingSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Updated Title');
    });

    it('should reject empty update data', () => {
      const result = updateListingSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'At least one field must be provided for update'
      );
    });

    describe('title validation in updates', () => {
      it('should reject empty title in updates', () => {
        const data = { title: '' };
        const result = updateListingSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toBe('Title is required');
      });

      it('should reject title longer than 255 characters in updates', () => {
        const data = { title: 'a'.repeat(256) };
        const result = updateListingSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toBe(
          'Title must not exceed 255 characters'
        );
      });
    });

    describe('status validation in updates', () => {
      it('should accept all valid statuses in updates', () => {
        const validStatuses = ['draft', 'listed', 'sold', 'withdrawn'];

        validStatuses.forEach(status => {
          const data = { status };
          const result = updateListingSchema.safeParse(data);
          expect(result.success).toBe(true);
          expect(result.data.status).toBe(status);
        });
      });

      it('should reject invalid status in updates', () => {
        const data = { status: 'invalid' };
        const result = updateListingSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('listingIdSchema', () => {
    it('should validate valid UUID', () => {
      const data = { id: '123e4567-e89b-12d3-a456-426614174000' };
      const result = listingIdSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should reject invalid UUID format', () => {
      const data = { id: 'invalid-uuid' };
      const result = listingIdSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('Invalid input');
    });

    it('should reject numeric ID', () => {
      const data = { id: 123 };
      const result = listingIdSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('Invalid input');
    });

    it('should reject empty string', () => {
      const data = { id: '' };
      const result = listingIdSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('Invalid input');
    });

    it('should require id field', () => {
      const data = {};
      const result = listingIdSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
