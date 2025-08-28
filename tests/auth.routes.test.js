import request from 'supertest';
import app from '../src/app.js';

const makeAgent = () => request.agent(app);

describe('Auth Routes', () => {
  const uniqueEmail = `user_${Date.now()}@example.com`;
  const adminEmail = `admin_${Date.now()}@example.com`;

  it('POST /api/auth/signup - should register user and set cookie', async () => {
    const res = await makeAgent()
      .post('/api/auth/signup')
      .send({
        name: 'User One',
        email: uniqueEmail,
        password: 'password123',
        role: 'user',
      })
      .expect(201);

    expect(res.body).toHaveProperty('message', 'User registered successfully');
    expect(res.body).toHaveProperty('user');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('POST /api/auth/signup - duplicate email returns 409', async () => {
    await makeAgent()
      .post('/api/auth/signup')
      .send({
        name: 'Dup',
        email: uniqueEmail,
        password: 'password123',
        role: 'user',
      })
      .expect(409);
  });

  it('POST /api/auth/signin - invalid credentials returns 401', async () => {
    const res = await makeAgent()
      .post('/api/auth/signin')
      .send({ email: 'nouser@example.com', password: 'bad' })
      .expect(401);

    expect(res.body).toHaveProperty('error', 'Invalid email or password');
  });

  it('POST /api/auth/signin - should sign in and set cookie', async () => {
    await makeAgent()
      .post('/api/auth/signup')
      .send({
        name: 'Admin',
        email: adminEmail,
        password: 'password123',
        role: 'admin',
      })
      .expect(201);

    const res = await makeAgent()
      .post('/api/auth/signin')
      .send({ email: adminEmail, password: 'password123' })
      .expect(200);

    expect(res.body).toHaveProperty('message', 'Signed in successfully');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('POST /api/auth/signout - clears cookie', async () => {
    const agent = makeAgent();

    await agent
      .post('/api/auth/signup')
      .send({
        name: 'Temp',
        email: `temp_${Date.now()}@example.com`,
        password: 'password123',
      })
      .expect(201);

    const res = await agent.post('/api/auth/signout').expect(200);
    expect(res.body).toHaveProperty('message', 'Signed out successfully');
  });

  it('POST /api/auth/signup - validation error for bad payload', async () => {
    const res = await makeAgent()
      .post('/api/auth/signup')
      .send({ name: 'A', email: 'not-an-email', password: 'x' })
      .expect(400);
    expect(res.body).toHaveProperty('error', 'Validation failed');
    expect(res.body).toHaveProperty('details');
  });
});
