import { formatValidationError } from '../../src/utils/format.js';

describe('Format Utils', () => {
  describe('formatValidationError', () => {
    it('should return default message for null error', () => {
      const result = formatValidationError(null);
      expect(result).toBe('Validation failed');
    });

    it('should return default message for undefined error', () => {
      const result = formatValidationError(undefined);
      expect(result).toBe('Validation failed');
    });

    it('should return default message for error without issues', () => {
      const error = { message: 'Some error' };
      const result = formatValidationError(error);
      expect(result).toBe('Validation failed');
    });

    it('should format single validation issue', () => {
      const error = {
        issues: [{ message: 'Email is required' }],
      };
      const result = formatValidationError(error);
      expect(result).toBe('Email is required');
    });

    it('should format multiple validation issues', () => {
      const error = {
        issues: [
          { message: 'Email is required' },
          { message: 'Password must be at least 6 characters' },
          { message: 'Name is required' },
        ],
      };
      const result = formatValidationError(error);
      expect(result).toBe(
        'Email is required, Password must be at least 6 characters, Name is required'
      );
    });

    it('should handle empty issues array', () => {
      const error = { issues: [] };
      const result = formatValidationError(error);
      expect(result).toBe('');
    });

    it('should stringify non-array issues', () => {
      const error = { issues: { message: 'Invalid format' } };
      const result = formatValidationError(error);
      expect(result).toBe('{"message":"Invalid format"}');
    });

    it('should handle complex error objects', () => {
      const error = {
        issues: [
          {
            message: 'Invalid email format',
            path: ['email'],
            code: 'invalid_string',
          },
          {
            message: 'Password too short',
            path: ['password'],
            code: 'too_small',
          },
        ],
      };
      const result = formatValidationError(error);
      expect(result).toBe('Invalid email format, Password too short');
    });
  });
});
