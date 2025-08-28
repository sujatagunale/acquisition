import {
  updateUserSchema,
  userIdSchema,
} from '../../src/validations/users.validation.js';

describe('Users Validations', () => {
  describe('updateUserSchema', () => {
    it('should validate correct update data with all fields', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
      };
      const result = updateUserSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });

    it('should validate update data with only name', () => {
      const data = { name: 'John Doe' };
      const result = updateUserSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });

    it('should validate update data with only email', () => {
      const data = { email: 'john@example.com' };
      const result = updateUserSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });

    it('should validate update data with only role', () => {
      const data = { role: 'admin' };
      const result = updateUserSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });

    it('should trim and lowercase email', () => {
      const data = { email: '  JOHN@EXAMPLE.COM  ' };
      const result = updateUserSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.email).toBe('john@example.com');
    });

    it('should trim name', () => {
      const data = { name: '  John Doe  ' };
      const result = updateUserSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('John Doe');
    });

    it('should reject empty update data', () => {
      const result = updateUserSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'At least one field must be provided for update'
      );
    });

    describe('name validation', () => {
      it('should reject name shorter than 2 characters', () => {
        const data = { name: 'J' };
        const result = updateUserSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toBe(
          'Name must be at least 2 characters long'
        );
      });

      it('should reject name longer than 255 characters', () => {
        const data = { name: 'a'.repeat(256) };
        const result = updateUserSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toBe(
          'Name must not exceed 255 characters'
        );
      });

      it('should accept name with exactly 2 characters', () => {
        const data = { name: 'Jo' };
        const result = updateUserSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept name with exactly 255 characters', () => {
        const data = { name: 'a'.repeat(255) };
        const result = updateUserSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('email validation', () => {
      it('should reject invalid email format', () => {
        const data = { email: 'invalid-email' };
        const result = updateUserSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toBe('Valid email is required');
      });

      it('should reject email longer than 255 characters', () => {
        const longEmail = 'a'.repeat(250) + '@example.com';
        const data = { email: longEmail };
        const result = updateUserSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toBe(
          'Email must not exceed 255 characters'
        );
      });

      it('should accept valid email formats', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.org',
          'user123@test-domain.com',
        ];

        validEmails.forEach(email => {
          const data = { email };
          const result = updateUserSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('role validation', () => {
      it('should accept user role', () => {
        const data = { role: 'user' };
        const result = updateUserSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.role).toBe('user');
      });

      it('should accept admin role', () => {
        const data = { role: 'admin' };
        const result = updateUserSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.role).toBe('admin');
      });

      it('should reject invalid role', () => {
        const data = { role: 'invalid' };
        const result = updateUserSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toBe(
          'Role must be either user or admin'
        );
      });
    });
  });

  describe('userIdSchema', () => {
    it('should validate positive integer ID', () => {
      const data = { id: 123 };
      const result = userIdSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(123);
    });

    it('should coerce string numbers to integers', () => {
      const data = { id: '123' };
      const result = userIdSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(123);
    });

    it('should coerce float numbers to integers', () => {
      const data = { id: 123.7 };
      const result = userIdSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(123);
    });

    it('should reject zero', () => {
      const data = { id: 0 };
      const result = userIdSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe('User ID must be positive');
    });

    it('should reject negative numbers', () => {
      const data = { id: -1 };
      const result = userIdSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe('User ID must be positive');
    });

    it('should reject non-numeric strings', () => {
      const data = { id: 'abc' };
      const result = userIdSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe('User ID must be a number');
    });

    it('should reject null', () => {
      const data = { id: null };
      const result = userIdSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe('User ID must be a number');
    });

    it('should reject undefined', () => {
      const data = {};
      const result = userIdSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept ID 1', () => {
      const data = { id: 1 };
      const result = userIdSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(1);
    });
  });
});
