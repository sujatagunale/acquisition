import request from 'supertest';
import app from '../src/app.js';

describe('Authentication Endpoints', () => {
  let userCookie; // eslint-disable-line no-unused-vars
  let adminCookie; // eslint-disable-line no-unused-vars
  
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  const testAdmin = {
    name: 'Test Admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
  };

  describe('POST /api/auth/signup', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('name', testUser.name);
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).toHaveProperty('role', 'user');
      expect(response.body.user).not.toHaveProperty('password_hash');
      
      expect(response.headers['set-cookie']).toBeDefined();
      const cookies = response.headers['set-cookie'];
      expect(cookies.some(cookie => cookie.startsWith('token='))).toBe(true);
    });

    it('should register an admin user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send(testAdmin)
        .expect(201);

      expect(response.body.user).toHaveProperty('role', 'admin');
      
      adminCookie = response.headers['set-cookie'];
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body.details).toContain('Valid email is required');
    });

    it('should reject registration with short password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test2@example.com',
          password: '123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body.details).toContain('Password must be at least 6 characters long');
    });

    it('should reject registration with duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send(testUser)
        .expect(409);

      expect(response.body).toHaveProperty('error', 'User with this email already exists');
    });
  });

  describe('POST /api/auth/signin', () => {
    it('should sign in user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Signed in successfully');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).not.toHaveProperty('password_hash');
      
      userCookie = response.headers['set-cookie'];
    });

    it('should reject sign in with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid email or password');
    });

    it('should reject sign in with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid email or password');
    });

    it('should reject sign in with malformed email', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'invalid-email',
          password: testUser.password,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('POST /api/auth/signout', () => {
    it('should sign out user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/signout')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Signed out successfully');
      
      expect(response.headers['set-cookie']).toBeDefined();
      const cookies = response.headers['set-cookie'];
      expect(cookies.some(cookie => cookie.includes('token=;'))).toBe(true);
    });
  });

  describe('Authentication Middleware', () => {
    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    it('should accept requests with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      const cookies = response.headers['set-cookie'];
      
      const protectedResponse = await request(app)
        .get(`/api/users/${response.body.user.id}`)
        .set('Cookie', cookies)
        .expect(200);

      expect(protectedResponse.body.user).toHaveProperty('email', testUser.email);
    });
  });
});
