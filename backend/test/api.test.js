const request = require('supertest');
const Server = require('../src/server');

describe('LINEPayUSDT Backend API', () => {
  let server;
  let app;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_INDEXER = 'false'; // Disable indexer for tests
    
    server = new Server();
    app = await server.start();
  });

  afterAll(async () => {
    if (server) {
      await server.shutdown();
    }
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('LINEPayUSDT Backend API');
      expect(response.body.version).toBe('1.0.0');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('healthy');
      expect(response.body.services).toBeDefined();
    });
  });

  describe('GET /api/merchants', () => {
    it('should return list of merchants', async () => {
      const response = await request(app)
        .get('/api/merchants')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/products', () => {
    it('should return list of products', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/payments/stats', () => {
    it('should return payment statistics', async () => {
      const response = await request(app)
        .get('/api/payments/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(typeof response.body.data.totalPayments).toBe('number');
      expect(typeof response.body.data.totalVolume).toBe('number');
    });
  });

  describe('GET /api/merchants/:address', () => {
    it('should return merchant profile for valid address', async () => {
      const validAddress = '0x1234567890123456789012345678901234567890';
      
      const response = await request(app)
        .get(`/api/merchants/${validAddress}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should return 400 for invalid address', async () => {
      const invalidAddress = 'invalid-address';
      
      const response = await request(app)
        .get(`/api/merchants/${invalidAddress}`)
        .expect(400);

      expect(response.body.error).toBe('Invalid Ethereum address format');
    });
  });

  describe('GET /api/payments/payer/:address', () => {
    it('should return payments for valid payer address', async () => {
      const validAddress = '0xBDFF111122223333444455556666777788883D22';
      
      const response = await request(app)
        .get(`/api/payments/payer/${validAddress}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.payments)).toBe(true);
    });
  });

  describe('GET /api/merchants/:address/dashboard', () => {
    it('should return merchant dashboard data', async () => {
      const validAddress = '0x1234567890123456789012345678901234567890';
      
      const response = await request(app)
        .get(`/api/merchants/${validAddress}/dashboard`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.merchant).toBeDefined();
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404);

      expect(response.body.error).toBe('Endpoint not found');
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/payments?limit=invalid')
        .expect(400);

      expect(response.body.error).toContain('Limit must be a number');
    });
  });
});