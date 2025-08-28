import request from 'supertest';
import app from '../src/app.js';

const makeAgent = () => request.agent(app);

async function createAndLogin(agent, { name, email, password, role = 'user' }) {
  await agent.post('/api/auth/signup').send({ name, email, password, role }).expect(201);
  const res = await agent.post('/api/auth/signin').send({ email, password }).expect(200);
  expect(res.headers['set-cookie']).toBeDefined();
  return res.body.user;
}

describe('Users Routes', () => {
  it('GET /api/users - requires admin', async () => {
    const agent = makeAgent();
    await createAndLogin(agent, {
      name: 'Normal',
      email: `normal_${Date.now()}@example.com`,
      password: 'password123',
      role: 'user',
    });

    const res = await agent.get('/api/users').expect(403);
    expect(res.body).toHaveProperty('error', 'Insufficient permissions');
  });

  it('GET /api/users - admin can list users', async () => {
    const agent = makeAgent();
    await createAndLogin(agent, {
      name: 'Admin',
      email: `admin_${Date.now()}@example.com`,
      password: 'password123',
      role: 'admin',
    });

    const res = await agent.get('/api/users').expect(200);
    expect(res.body).toHaveProperty('users');
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body).toHaveProperty('message', 'Users retrieved successfully');
  });

  it('GET /api/users/:id - requires auth', async () => {
    await request(app).get('/api/users/1').expect(401);
  });

  it('GET /api/users/:id - returns 400 for invalid id', async () => {
    const agent = makeAgent();
    await createAndLogin(agent, {
      name: 'User',
      email: `uu_${Date.now()}@example.com`,
      password: 'password123',
    });
    const res = await agent.get('/api/users/not-a-number').expect(400);
    expect(res.body).toHaveProperty('error', 'Invalid user ID');
  });

  it('PUT /api/users/:id - user can update self, not role', async () => {
    const agent = makeAgent();
    const user = await createAndLogin(agent, {
      name: 'Self',
      email: `self_${Date.now()}@example.com`,
      password: 'password123',
    });

    await agent.put(`/api/users/${user.id}`).send({ name: 'Self Updated' }).expect(200);
    await agent.put(`/api/users/${user.id}`).send({ role: 'admin' }).expect(403);
  });

  it('DELETE /api/users/:id - admin cannot delete self, can delete others', async () => {
    const adminAgent = makeAgent();
    const admin = await createAndLogin(adminAgent, {
      name: 'Admin2',
      email: `admin2_${Date.now()}@example.com`,
      password: 'password123',
      role: 'admin',
    });

    const resSelf = await adminAgent.delete(`/api/users/${admin.id}`).expect(400);
    expect(resSelf.body).toHaveProperty('error', 'Cannot delete your own account');

    const userAgent = makeAgent();
    const user = await createAndLogin(userAgent, {
      name: 'Victim',
      email: `victim_${Date.now()}@example.com`,
      password: 'password123',
    });

    const res = await adminAgent.delete(`/api/users/${user.id}`).expect(200);
    expect(res.body).toHaveProperty('message', 'User deleted successfully');
  });
});
