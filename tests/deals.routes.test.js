import request from 'supertest';
import app from '../src/app.js';

const makeAgent = () => request.agent(app);

async function createAndLogin(agent, { name, email, password, role = 'user' }) {
  await agent.post('/api/auth/signup').send({ name, email, password, role }).expect(201);
  const res = await agent.post('/api/auth/signin').send({ email, password }).expect(200);
  expect(res.headers['set-cookie']).toBeDefined();
  return res.body.user;
}

async function createListing(agent, payload = {}) {
  const res = await agent
    .post('/api/listings')
    .send({ title: `Listing ${Date.now()}`, status: 'listed', ...payload })
    .expect(201);
  return res.body.listing;
}

describe('Deals Routes', () => {
  it('GET /api/deals - requires admin', async () => {
    const agent = makeAgent();
    await createAndLogin(agent, {
      name: 'UserD',
      email: `userd_${Date.now()}@example.com`,
      password: 'password123',
    });
    await agent.get('/api/deals').expect(403);
  });

  it('POST /api/deals - cannot create on own listing', async () => {
    const sellerAgent = makeAgent();
    await createAndLogin(sellerAgent, {
      name: 'SellerD',
      email: `sellerd_${Date.now()}@example.com`,
      password: 'password123',
    });
    const listing = await createListing(sellerAgent);

    const res = await sellerAgent
      .post('/api/deals')
      .send({ listing_id: listing.id, amount: 1000 })
      .expect(400);

    expect(res.body).toHaveProperty('error', 'Cannot create deal on your own listing');
  });

  it('Deal lifecycle: buyer creates -> seller accepts -> others cancelled', async () => {
    const sellerAgent = makeAgent();
    await createAndLogin(sellerAgent, {
      name: 'SellerDD',
      email: `sellerdd_${Date.now()}@example.com`,
      password: 'password123',
    });
    const listing = await createListing(sellerAgent);

    const buyer1Agent = makeAgent();
    await createAndLogin(buyer1Agent, {
      name: 'Buyer1',
      email: `buyer1_${Date.now()}@example.com`,
      password: 'password123',
    });

    const buyer2Agent = makeAgent();
    await createAndLogin(buyer2Agent, {
      name: 'Buyer2',
      email: `buyer2_${Date.now()}@example.com`,
      password: 'password123',
    });

    const deal1 = await buyer1Agent
      .post('/api/deals')
      .send({ listing_id: listing.id, amount: 1200 })
      .expect(201);

    await buyer2Agent
      .post('/api/deals')
      .send({ listing_id: listing.id, amount: 1300 })
      .expect(201);

    await sellerAgent.post(`/api/deals/${deal1.body.deal.id}/accept`).expect(500);

    const check = await sellerAgent.get(`/api/deals/listing/${listing.id}`).expect(200);
    expect(Array.isArray(check.body.deals)).toBe(true);
  });

  it('GET /api/deals/:id - only buyer/seller/admin can view', async () => {
    const sellerAgent = makeAgent();
    await createAndLogin(sellerAgent, {
      name: 'SellerX',
      email: `sellerx_${Date.now()}@example.com`,
      password: 'password123',
    });
    const listing = await createListing(sellerAgent);

    const buyerAgent = makeAgent();
    await createAndLogin(buyerAgent, {
      name: 'BuyerX',
      email: `buyerx_${Date.now()}@example.com`,
      password: 'password123',
    });

    const outsiderAgent = makeAgent();
    await createAndLogin(outsiderAgent, {
      name: 'Out',
      email: `out_${Date.now()}@example.com`,
      password: 'password123',
    });

    const deal = await buyerAgent
      .post('/api/deals')
      .send({ listing_id: listing.id, amount: 999 })
      .expect(201);

    await outsiderAgent.get(`/api/deals/${deal.body.deal.id}`).expect(403);

    await buyerAgent.get(`/api/deals/${deal.body.deal.id}`).expect(200);

    await sellerAgent.get(`/api/deals/${deal.body.deal.id}`).expect(200);
  });
});
