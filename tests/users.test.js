import request from 'supertest';
import app from '../src/app.js';

describe('User Endpoints', () => {
  let userCookie;
  let adminCookie;
  let testUserId;
  let testAdminId;

  const testUser = {
    name: 'Test User',
    email: 'usertest@example.com',
    password: 'password123',
  };

  const testAdmin = {
    name: 'Test Admin',
    email: 'admintest@example.com',
    password: 'admin123',
    role: 'admin',
  };

  beforeAll(async () => {
    const userResponse = await request(app)
      .post('/api/auth/signup')
      .send(testUser);
    
    userCookie = userResponse.headers['set-cookie'];
    testUserId = userResponse.body.user.id;

    const adminResponse = await request(app)
      .post('/api/auth/signup')
      .send(testAdmin);
    
    adminCookie = adminResponse.headers['set-cookie'];
    testAdminId = adminResponse.body.user.id;
  });

  describe('GET /api/users', () => {
    it('should allow admin to get all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Users retrieved successfully');
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
    });

    it('should reject regular user from getting all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Cookie', userCookie)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Insufficient permissions');
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should allow user to get their own data', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}`)
        .set('Cookie', userCookie)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User retrieved successfully');
      expect(response.body.user).toHaveProperty('id', testUserId);
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should allow admin to get any user data', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}`)
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.user).toHaveProperty('id', testUserId);
      expect(response.body.user).toHaveProperty('email', testUser.email);
    });

    it('should reject user from accessing other user data', async () => {
      const response = await request(app)
        .get(`/api/users/${testAdminId}`)
        .set('Cookie', userCookie)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/99999')
        .set('Cookie', adminCookie)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should reject invalid user ID', async () => {
      const response = await request(app)
        .get('/api/users/invalid')
        .set('Cookie', adminCookie)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid user ID');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should allow user to update their own data', async () => {
      const updates = {
        name: 'Updated User Name',
        email: 'updated@example.com',
      };

      const response = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Cookie', userCookie)
        .send(updates)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User updated successfully');
      expect(response.body.user).toHaveProperty('name', updates.name);
      expect(response.body.user).toHaveProperty('email', updates.email);
    });

    it('should reject user from changing their role', async () => {
      const response = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Cookie', userCookie)
        .send({ role: 'admin' })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Only admins can change user roles');
    });

    it('should allow admin to change user role', async () => {
      const response = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Cookie', adminCookie)
        .send({ role: 'admin' })
        .expect(200);

      expect(response.body.user).toHaveProperty('role', 'admin');
    });

    it('should reject user from updating other user data', async () => {
      const response = await request(app)
        .put(`/api/users/${testAdminId}`)
        .set('Cookie', userCookie)
        .send({ name: 'Hacked Name' })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should reject invalid updates', async () => {
      const response = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Cookie', userCookie)
        .send({ name: 'a' }) // Too short
        .expect(400);

      expect(response.body).toHaveProperty('error', 'No valid updates provided');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should allow admin to delete users', async () => {
      const userToDelete = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Delete Me',
          email: 'deleteme@example.com',
          password: 'password123',
        });

      const response = await request(app)
        .delete(`/api/users/${userToDelete.body.user.id}`)
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User deleted successfully');
      expect(response.body.deletedUser).toHaveProperty('id', userToDelete.body.user.id);
    });

    it('should reject regular user from deleting users', async () => {
      const response = await request(app)
        .delete(`/api/users/${testAdminId}`)
        .set('Cookie', userCookie)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Insufficient permissions');
    });

    it('should prevent admin from deleting themselves', async () => {
      const response = await request(app)
        .delete(`/api/users/${testAdminId}`)
        .set('Cookie', adminCookie)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Cannot delete your own account');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/users/99999')
        .set('Cookie', adminCookie)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });
});
