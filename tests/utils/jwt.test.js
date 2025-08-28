import { jwttoken } from '../../src/utils/jwt.js';

describe('JWT Utils', () => {
  const mockPayload = { id: 1, email: 'test@example.com', role: 'user' };

  describe('sign', () => {
    it('should sign a JWT token with payload', () => {
      const token = jwttoken.sign(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should throw error for invalid payload', () => {
      expect(() => jwttoken.sign(null)).toThrow('Token signing failed');
    });
  });

  describe('verify', () => {
    it('should verify a valid JWT token', () => {
      const token = jwttoken.sign(mockPayload);
      const decoded = jwttoken.verify(token);

      expect(decoded.id).toBe(mockPayload.id);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    it('should throw error for invalid token', () => {
      expect(() => jwttoken.verify('invalid-token')).toThrow(
        'Token verification failed'
      );
    });

    it('should throw error for expired token', () => {
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0.invalid';
      expect(() => jwttoken.verify(expiredToken)).toThrow(
        'Token verification failed'
      );
    });

    it('should throw error for malformed token', () => {
      expect(() => jwttoken.verify('malformed.token')).toThrow(
        'Token verification failed'
      );
    });
  });
});
