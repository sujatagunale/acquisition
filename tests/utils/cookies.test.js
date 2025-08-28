import { cookies } from '../../src/utils/cookies.js';

const mockFn = () => {
  const fn = (...args) => fn.mock.results[fn.mock.calls.length - 1]?.value;
  fn.mock = { calls: [], results: [] };
  fn.mockReturnValue = (value) => { fn.mock.results.push({ value }); return fn; };
  fn.mockReturnThis = () => fn.mockReturnValue(fn);
  return fn;
};

describe('Cookies Utils', () => {
  let mockRes;
  let mockReq;

  beforeEach(() => {
    mockRes = {
      cookie: mockFn(),
      clearCookie: mockFn(),
    };
    mockReq = {
      cookies: {
        token: 'test-token',
        session: 'test-session',
      },
    };
  });

  describe('getOptions', () => {
    it('should return default cookie options for development', () => {
      process.env.NODE_ENV = 'development';
      const options = cookies.getOptions();
      
      expect(options).toEqual({
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      });
    });

    it('should return secure cookie options for production', () => {
      process.env.NODE_ENV = 'production';
      const options = cookies.getOptions();
      
      expect(options).toEqual({
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      });
    });
  });

  describe('set', () => {
    it('should set cookie with default options', () => {
      cookies.set(mockRes, 'token', 'test-value');
      
      expect(mockRes.cookie.mock.calls).toContainEqual(['token', 'test-value', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      }]);
    });

    it('should set cookie with custom options', () => {
      const customOptions = { maxAge: 30 * 60 * 1000 };
      cookies.set(mockRes, 'token', 'test-value', customOptions);
      
      expect(mockRes.cookie.mock.calls).toContainEqual(['token', 'test-value', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 30 * 60 * 1000,
      }]);
    });
  });

  describe('clear', () => {
    it('should clear cookie with default options', () => {
      cookies.clear(mockRes, 'token');
      
      expect(mockRes.clearCookie.mock.calls).toContainEqual(['token', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      }]);
    });

    it('should clear cookie with custom options', () => {
      const customOptions = { path: '/api' };
      cookies.clear(mockRes, 'token', customOptions);
      
      expect(mockRes.clearCookie.mock.calls).toContainEqual(['token', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
        path: '/api',
      }]);
    });
  });

  describe('get', () => {
    it('should get cookie value from request', () => {
      const value = cookies.get(mockReq, 'token');
      expect(value).toBe('test-token');
    });

    it('should return undefined for non-existent cookie', () => {
      const value = cookies.get(mockReq, 'nonexistent');
      expect(value).toBeUndefined();
    });
  });
});
