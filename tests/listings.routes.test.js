import request from 'supertest';
import app from '../src/app.js';

const makeAgent = () => request.agent(app);

async function createAndLogin(agent, { name, email, password, role = 'user' }) {
  await agent.post('/api/auth/signup').send({ name, email, password, role }).expect(201);
  const res = await agent.post('/api/auth/signin').send({ email, password }).expect(200);
  expect(res.headers['set-cookie']).toBeDefined();
  return res.body.user;
}

describe('Listings Routes', () => {
  it('GET /api/listings - public list', async () => {
    const res = await request(app).get('/api/listings').expect(200);
    expect(res.body).toHaveProperty('listings');
    expect(Array.isArray(res.body.listings)).toBe(true);
  });

  it('POST /api/listings - requires auth', async () => {
    await request(app)
      .post('/api/listings')
      .send({ title: 'Unauthed' })
      .expect(401);
  });

  it('POST /api/listings - create listing as user', async () => {
    const sellerAgent = makeAgent();
    const seller = await createAndLogin(sellerAgent, {
      name: 'Seller',
      email: `seller_${Date.now()}@example.com`,
      password: 'password123',
    });

    const res = await sellerAgent
      .post('/api/listings')
      .send({ title: 'My Listing', status: 'listed' })
      .expect(201);

    expect(res.body).toHaveProperty('listing');
    expect(res.body.listing).toHaveProperty('seller_id', seller.id);
  });

  it('PUT /api/listings/:id - only owner or admin can update', async () => {
    const sellerAgent = makeAgent();
    await createAndLogin(sellerAgent, {
      name: 'Seller2',
      email: `seller2_${Date.now()}@example.com`,
      password: 'password123',
    });

    const createRes = await sellerAgent
      .post('/api/listings')
      .send({ title: 'Owned', status: 'listed' })
      .expect(201);

    const listingId = createRes.body.listing.id;

    const otherAgent = makeAgent();
    await createAndLogin(otherAgent, {
      name: 'Other',
      email: `other_${Date.now()}@example.com`,
      password: 'password123',
    });

    const forbidden = await otherAgent
      .put(`/api/listings/${listingId}`)
      .send({ title: 'Hacked' })
      .expect(403);
    expect(forbidden.body).toHaveProperty('error', 'Access denied');

    const adminAgent = makeAgent();
    await createAndLogin(adminAgent, {
      name: 'AdminL',
      email: `adminl_${Date.now()}@example.com`,
      password: 'password123',
      role: 'admin',
    });

    const ok = await adminAgent
      .put(`/api/listings/${listingId}`)
      .send({ title: 'Admin Updated' })
      .expect(200);
    expect(ok.body).toHaveProperty('message', 'Listing updated successfully');
  });

  it('GET /api/listings/my - returns own listings', async () => {
    const agent = makeAgent();
    await createAndLogin(agent, {
      name: 'Mine',
      email: `mine_${Date.now()}@example.com`,
      password: 'password123',
    });

    const res = await agent.get('/api/listings/my').expect(200);
    expect(res.body).toHaveProperty('listings');
    expect(Array.isArray(res.body.listings)).toBe(true);
  });
});
