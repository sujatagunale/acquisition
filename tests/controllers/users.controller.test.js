import request from 'supertest';
import app from '../../src/app.js';
import { jwttoken } from '../../src/utils/jwt.js';

jest.mock('../../src/services/users.service.js');
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

const usersService = require('../../src/services/users.service.js');

describe('Users Controller', () => {
  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockAdmin = {
    id: 2,
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    created_at: new Date(),
    updated_at: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createAuthCookie = (user) => {
    const token = jwttoken.sign({ id: user.id, email: user.email, role: user.role });
    return `token=${token}`;
  };

  describe('GET /api/users', () => {
    it('should return all users for admin', async () => {
      const users = [mockUser, mockAdmin];
      usersService.getAllUsers.mockResolvedValue(users);
      usersService.getUserById.mockResolvedValue(mockAdmin);

      const response = await request(app)
        .get('/api/users')
        .set('Cookie', createAuthCookie(mockAdmin));

      expect(response.status).toBe(200);
      expect(response.body).toEqual(users);
      expect(usersService.getAllUsers).toHaveBeenCalled();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should return 403 for non-admin users', async () => {
      usersService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should handle service errors', async () => {
      usersService.getUserById.mockResolvedValue(mockAdmin);
      usersService.getAllUsers.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/users')
        .set('Cookie', createAuthCookie(mockAdmin));

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by ID for authenticated user', async () => {
      usersService.getUserById
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockUser);

      const response = await request(app)
        .get('/api/users/1')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
    });

    it('should return 404 when user not found', async () => {
      usersService.getUserById
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/users/999')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/users/1');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should return 400 for invalid user ID', async () => {
      usersService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/invalid')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      usersService.getUserById
        .mockResolvedValueOnce(mockUser)
        .mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/users/1')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('PUT /api/users/:id', () => {
    const updateData = {
      name: 'John Updated',
      email: 'john.updated@example.com'
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateData };
      usersService.getUserById.mockResolvedValue(mockUser);
      usersService.updateUser.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/1')
        .set('Cookie', createAuthCookie(mockUser))
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedUser);
      expect(usersService.updateUser).toHaveBeenCalledWith(1, updateData);
    });

    it('should return 404 when user not found', async () => {
      usersService.getUserById.mockResolvedValue(mockUser);
      usersService.updateUser.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/users/999')
        .set('Cookie', createAuthCookie(mockUser))
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('should return 400 for invalid update data', async () => {
      usersService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .put('/api/users/1')
        .set('Cookie', createAuthCookie(mockUser))
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/users/1')
        .send(updateData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should handle service errors', async () => {
      usersService.getUserById.mockResolvedValue(mockUser);
      usersService.updateUser.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/users/1')
        .set('Cookie', createAuthCookie(mockUser))
        .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user successfully for admin', async () => {
      const deletedUser = { id: 1, email: 'john@example.com' };
      usersService.getUserById.mockResolvedValue(mockAdmin);
      usersService.deleteUser.mockResolvedValue(deletedUser);

      const response = await request(app)
        .delete('/api/users/1')
        .set('Cookie', createAuthCookie(mockAdmin));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'User deleted successfully',
        user: deletedUser
      });
      expect(usersService.deleteUser).toHaveBeenCalledWith(1);
    });

    it('should return 404 when user not found', async () => {
      usersService.getUserById.mockResolvedValue(mockAdmin);
      usersService.deleteUser.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/users/999')
        .set('Cookie', createAuthCookie(mockAdmin));

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete('/api/users/1');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should return 403 for non-admin users', async () => {
      usersService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .delete('/api/users/1')
        .set('Cookie', createAuthCookie(mockUser));

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should return 400 for invalid user ID', async () => {
      usersService.getUserById.mockResolvedValue(mockAdmin);

      const response = await request(app)
        .delete('/api/users/invalid')
        .set('Cookie', createAuthCookie(mockAdmin));

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      usersService.getUserById.mockResolvedValue(mockAdmin);
      usersService.deleteUser.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/users/1')
        .set('Cookie', createAuthCookie(mockAdmin));

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });
});
