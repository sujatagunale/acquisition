import request from 'supertest';
import app from '../../src/app.js';
import { jwttoken } from '../../src/utils/jwt.js';

jest.mock('../../src/services/auth.service.js');
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

import * as authService from '../../src/services/auth.service.js';

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    const validSignupData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'user',
    };

    it('should create user successfully', async () => {
      const newUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        created_at: new Date(),
      };

      authService.createUser.mockResolvedValue(newUser);

      const response = await request(app)
        .post('/api/auth/signup')
        .send(validSignupData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'User created successfully',
        user: newUser,
      });
      expect(authService.createUser).toHaveBeenCalledWith(validSignupData);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        name: 'J',
        email: 'invalid-email',
        password: '123',
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 when user already exists', async () => {
      authService.createUser.mockRejectedValue(
        new Error('User with this email already exists')
      );

      const response = await request(app)
        .post('/api/auth/signup')
        .send(validSignupData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User with this email already exists');
    });

    it('should handle server errors', async () => {
      authService.createUser.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/signup')
        .send(validSignupData);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });

    it('should require all mandatory fields', async () => {
      const response = await request(app).post('/api/auth/signup').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should trim and lowercase email', async () => {
      const dataWithSpaces = {
        ...validSignupData,
        email: '  JOHN@EXAMPLE.COM  ',
      };
      const newUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        created_at: new Date(),
      };

      authService.createUser.mockResolvedValue(newUser);

      const response = await request(app)
        .post('/api/auth/signup')
        .send(dataWithSpaces);

      expect(response.status).toBe(201);
      expect(authService.createUser).toHaveBeenCalledWith({
        ...validSignupData,
        email: 'john@example.com',
      });
    });
  });

  describe('POST /api/auth/signin', () => {
    const validSigninData = {
      email: 'john@example.com',
      password: 'password123',
    };

    it('should sign in user successfully', async () => {
      const user = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
      };
      const token = 'jwt-token';

      authService.authenticateUser.mockResolvedValue(user);
      jest.spyOn(jwttoken, 'sign').mockReturnValue(token);

      const response = await request(app)
        .post('/api/auth/signin')
        .send(validSigninData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Signed in successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 400 for invalid credentials', async () => {
      authService.authenticateUser.mockRejectedValue(
        new Error('Invalid credentials')
      );

      const response = await request(app)
        .post('/api/auth/signin')
        .send(validSigninData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 400 for invalid data format', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '',
      };

      const response = await request(app)
        .post('/api/auth/signin')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle server errors', async () => {
      authService.authenticateUser.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .post('/api/auth/signin')
        .send(validSigninData);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });

    it('should require email and password', async () => {
      const response = await request(app).post('/api/auth/signin').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/signout', () => {
    it('should sign out user successfully', async () => {
      const response = await request(app).post('/api/auth/signout');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Signed out successfully',
      });
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should clear token cookie', async () => {
      const response = await request(app).post('/api/auth/signout');

      const setCookieHeader = response.headers['set-cookie'];
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader[0]).toContain('token=;');
    });
  });
});
