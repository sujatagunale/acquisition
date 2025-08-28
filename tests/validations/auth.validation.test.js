import {
  signupSchema,
  signinSchema,
} from '../../src/validations/auth.validation.js';

describe('Auth Validations', () => {
  describe('signupSchema', () => {
    const validSignupData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'user',
    };

    it('should validate correct signup data', () => {
      const result = signupSchema.safeParse(validSignupData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'user',
      });
    });

    it('should default role to user when not provided', () => {
      const data = { ...validSignupData };
      delete data.role;
      const result = signupSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.role).toBe('user');
    });

    it('should accept email with spaces and uppercase', () => {
      const data = {
        ...validSignupData,
        email: '  JOHN@EXAMPLE.COM  ',
      };
      const result = signupSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should trim name', () => {
      const data = {
        ...validSignupData,
        name: '  John Doe  ',
      };
      const result = signupSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('John Doe');
    });

    describe('name validation', () => {
      it('should reject name shorter than 2 characters', () => {
        const data = { ...validSignupData, name: 'J' };
        const result = signupSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toBe(
          'Name must be at least 2 characters long'
        );
      });

      it('should reject name longer than 255 characters', () => {
        const data = { ...validSignupData, name: 'a'.repeat(256) };
        const result = signupSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toBe(
          'Name must not exceed 255 characters'
        );
      });

      it('should accept name with exactly 2 characters', () => {
        const data = { ...validSignupData, name: 'Jo' };
        const result = signupSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept name with exactly 255 characters', () => {
        const data = { ...validSignupData, name: 'a'.repeat(255) };
        const result = signupSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('email validation', () => {
      it('should reject invalid email format', () => {
        const data = { ...validSignupData, email: 'invalid-email' };
        const result = signupSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toBe('Valid email is required');
      });

      it('should reject email longer than 255 characters', () => {
        const longEmail = 'a'.repeat(250) + '@example.com';
        const data = { ...validSignupData, email: longEmail };
        const result = signupSchema.safeParse(data);
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
          const data = { ...validSignupData, email };
          const result = signupSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('password validation', () => {
      it('should reject password shorter than 6 characters', () => {
        const data = { ...validSignupData, password: '12345' };
        const result = signupSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toBe(
          'Password must be at least 6 characters long'
        );
      });

      it('should reject password longer than 128 characters', () => {
        const data = { ...validSignupData, password: 'a'.repeat(129) };
        const result = signupSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toBe(
          'Password must not exceed 128 characters'
        );
      });

      it('should accept password with exactly 6 characters', () => {
        const data = { ...validSignupData, password: '123456' };
        const result = signupSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept password with exactly 128 characters', () => {
        const data = { ...validSignupData, password: 'a'.repeat(128) };
        const result = signupSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('role validation', () => {
      it('should accept user role', () => {
        const data = { ...validSignupData, role: 'user' };
        const result = signupSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.role).toBe('user');
      });

      it('should accept admin role', () => {
        const data = { ...validSignupData, role: 'admin' };
        const result = signupSchema.safeParse(data);
        expect(result.success).toBe(true);
        expect(result.data.role).toBe('admin');
      });

      it('should reject invalid role', () => {
        const data = { ...validSignupData, role: 'invalid' };
        const result = signupSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toContain('Invalid option');
      });
    });
  });

  describe('signinSchema', () => {
    const validSigninData = {
      email: 'john@example.com',
      password: 'password123',
    };

    it('should validate correct signin data', () => {
      const result = signinSchema.safeParse(validSigninData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validSigninData);
    });

    it('should accept email with spaces and uppercase', () => {
      const data = {
        ...validSigninData,
        email: '  JOHN@EXAMPLE.COM  ',
      };
      const result = signinSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    describe('email validation', () => {
      it('should reject invalid email format', () => {
        const data = { ...validSigninData, email: 'invalid-email' };
        const result = signinSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toBe('Valid email is required');
      });

      it('should require email', () => {
        const data = { password: 'password123' };
        const result = signinSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('password validation', () => {
      it('should reject empty password', () => {
        const data = { ...validSigninData, password: '' };
        const result = signinSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toBe('Password is required');
      });

      it('should require password', () => {
        const data = { email: 'john@example.com' };
        const result = signinSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept any non-empty password', () => {
        const data = { ...validSigninData, password: '1' };
        const result = signinSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });
});
