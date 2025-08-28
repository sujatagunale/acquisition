import request from 'supertest';
import app from '../src/app.js';

describe('App', () => {
  describe('GET /health', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'OK',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
      });
    });
  });

  describe('GET /api', () => {
    it('should return 200 and API info', async () => {
      const response = await request(app).get('/api');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Acquisition API is running!',
      });
    });
  });

  describe('404 routes', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Route not found',
      });
    });

    it('should return 404 for non-existent API routes', async () => {
      const response = await request(app).get('/api/non-existent');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Route not found',
      });
    });
  });

  describe('CORS handling', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');
      
      expect(response.status).toBe(204);
    });
  });

  describe('JSON parsing', () => {
    it('should parse JSON request bodies', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .set('Content-Type', 'application/json')
        .send({ test: 'data' });
      
      expect(response.status).toBe(400);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');
      
      expect(response.status).toBe(400);
    });
  });
});
