import {
  authenticateToken,
  requireRole,
  requireAdmin,
} from '../../src/middlewares/auth.middleware.js';
import { jwttoken } from '../../src/utils/jwt.js';

jest.mock('../../src/services/users.service.js');
jest.mock('../../src/utils/jwt.js');
jest.mock('../../src/config/logger.js', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

import { getUserById } from '../../src/services/users.service.js';

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      cookies: {},
      user: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    const mockUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
    };

    it('should authenticate user with valid token', async () => {
      const token = 'valid-token';
      const decoded = { id: 1, email: 'john@example.com', role: 'user' };

      req.cookies.token = token;
      jwttoken.verify.mockReturnValue(decoded);
      getUserById.mockResolvedValue(mockUser);

      await authenticateToken(req, res, next);

      expect(jwttoken.verify).toHaveBeenCalledWith(token);
      expect(getUserById).toHaveBeenCalledWith(decoded.id);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 when no token provided', async () => {
      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', async () => {
      const token = 'invalid-token';
      req.cookies.token = token;
      jwttoken.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user not found', async () => {
      const token = 'valid-token';
      const decoded = {
        id: 999,
        email: 'nonexistent@example.com',
        role: 'user',
      };

      req.cookies.token = token;
      jwttoken.verify.mockReturnValue(decoded);
      getUserById.mockResolvedValue(null);

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const token = 'valid-token';
      const decoded = { id: 1, email: 'john@example.com', role: 'user' };

      req.cookies.token = token;
      jwttoken.verify.mockReturnValue(decoded);
      getUserById.mockRejectedValue(new Error('Database error'));

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle JWT verification errors', async () => {
      const token = 'expired-token';
      req.cookies.token = token;
      jwttoken.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    const mockUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
    };

    it('should allow access for user with correct role', () => {
      req.user = mockUser;
      const middleware = requireRole('user');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access for user with role in array', () => {
      req.user = mockUser;
      const middleware = requireRole(['user', 'admin']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access for user with incorrect role', () => {
      req.user = mockUser;
      const middleware = requireRole('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access when user not authenticated', () => {
      const middleware = requireRole('user');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle single role as string', () => {
      req.user = { ...mockUser, role: 'admin' };
      const middleware = requireRole('admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle multiple roles as array', () => {
      req.user = { ...mockUser, role: 'admin' };
      const middleware = requireRole(['user', 'admin', 'moderator']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access when role not in allowed array', () => {
      req.user = mockUser;
      const middleware = requireRole(['admin', 'moderator']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should allow access for admin user', () => {
      req.user = {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      };

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access for non-admin user', () => {
      req.user = {
        id: 1,
        name: 'Regular User',
        email: 'user@example.com',
        role: 'user',
      };

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access when user not authenticated', () => {
      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
