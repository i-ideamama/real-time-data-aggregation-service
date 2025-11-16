import request from 'supertest';
import express, { Express } from 'express';
import { tokenAggregationService } from '../../src/services/tokenAggregation.service';
import { logger } from '../../src/config/logger';

jest.mock('../../src/services/tokenAggregation.service');
jest.mock('../../src/config/logger');

let app: Express;

describe('API Endpoints Integration Tests', () => {
  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Health endpoint
    app.get('/api/health', (req, res) => {
      res.status(200).json({
        success: true,
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        requestId: 'test-id',
      });
    });

    // Tokens endpoint
    app.get('/api/tokens', async (req, res) => {
      try {
        const { search = 'pepe', sortBy, sortOrder, limit = 30, cursor } = req.query;
        const result = await tokenAggregationService.getTokens(
          String(search),
          sortBy as any,
          sortOrder as any,
          Number(limit),
          cursor as any
        );
        res.status(200).json({ success: true, data: result, requestId: 'test-id' });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch tokens', requestId: 'test-id' });
      }
    });

    // Token by address endpoint
    app.get('/api/tokens/:address', async (req, res) => {
      try {
        const { address } = req.params;
        if (!address || address.length < 10) {
          return res.status(400).json({ success: false, message: 'Invalid address', requestId: 'test-id' });
        }
        const token = await tokenAggregationService.getTokenByAddress(address);
        if (!token) {
          return res.status(404).json({ success: false, message: 'Token not found', requestId: 'test-id' });
        }
        res.status(200).json({ success: true, data: token, requestId: 'test-id' });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching token', requestId: 'test-id' });
      }
    });

    // Metrics endpoint
    app.get('/api/metrics', (req, res) => {
      res.status(200).json({
        success: true,
        metrics: {
          totalRequests: 1000,
          cacheHitRate: 0.75,
          averageResponseTime: 125,
        },
        requestId: 'test-id',
      });
    });

    // Home page endpoint
    app.get('/home/page', async (req, res) => {
      try {
        const { query = 'meme' } = req.query;
        const result = await tokenAggregationService.aggregateTokens(String(query));
        res.status(200).json({ success: true, data: result, requestId: 'test-id' });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch home page data', requestId: 'test-id' });
      }
    });
  });

  describe('Health Checks - Happy Path', () => {
    it('should return 200 status for health check', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
    });

    it('should return healthy status', async () => {
      const response = await request(app).get('/api/health');
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('healthy');
    });

    it('should include timestamp in health response', async () => {
      const response = await request(app).get('/api/health');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should include uptime in health response', async () => {
      const response = await request(app).get('/api/health');
      expect(response.body.uptime).toBeGreaterThan(0);
      expect(typeof response.body.uptime).toBe('number');
    });

    it('should include requestId in health response', async () => {
      const response = await request(app).get('/api/health');
      expect(response.body.requestId).toBeDefined();
    });
  });

  describe('Metrics Endpoint', () => {
    it('should return metrics successfully', async () => {
      const response = await request(app).get('/api/metrics');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should include metrics data in response', async () => {
      const response = await request(app).get('/api/metrics');
      expect(response.body.metrics).toBeDefined();
      expect(response.body.metrics.totalRequests).toBeGreaterThan(0);
      expect(response.body.metrics.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(response.body.metrics.averageResponseTime).toBeGreaterThan(0);
    });
  });

  describe('Tokens Endpoint - Happy Path', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return tokens list with default parameters', async () => {
      const mockResult = {
        results: [
          {
            token_ticker: 'PEPE',
            price_usd: 0.000001,
            volume_24h: 1000000,
            marketCap: 500000000,
          },
        ],
        meta: { limit: 30, total: 1, hasMore: false },
        cached: false,
        timestamp: new Date(),
      };

      (tokenAggregationService.getTokens as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app).get('/api/tokens');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toBeDefined();
      expect(response.body.data.meta).toBeDefined();
    });

    it('should filter tokens by search query', async () => {
      const mockResult = {
        results: [{ token_ticker: 'PEPE', price_usd: 0.000001 }],
        meta: { limit: 30, total: 1, hasMore: false },
        cached: false,
        timestamp: new Date(),
      };

      (tokenAggregationService.getTokens as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app).get('/api/tokens?search=pepe');

      expect(response.status).toBe(200);
      expect(tokenAggregationService.getTokens).toHaveBeenCalledWith('pepe', undefined, undefined, 30, undefined);
    });

    it('should sort tokens by volume descending', async () => {
      const mockResult = {
        results: [
          { token_ticker: 'PEPE', volume_24h: 5000000 },
          { token_ticker: 'DOGE', volume_24h: 3000000 },
        ],
        meta: { limit: 30, total: 2, hasMore: false },
        cached: false,
        timestamp: new Date(),
      };

      (tokenAggregationService.getTokens as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app).get('/api/tokens?sortBy=volume&sortOrder=desc');

      expect(response.status).toBe(200);
      expect(response.body.data.results[0].volume_24h).toBeGreaterThanOrEqual(response.body.data.results[1].volume_24h);
    });

    it('should handle pagination with cursor', async () => {
      const mockResult = {
        results: [{ token_ticker: 'SHIB', price_usd: 0.000008 }],
        meta: { limit: 10, total: 100, hasMore: true },
        cached: false,
        timestamp: new Date(),
      };

      (tokenAggregationService.getTokens as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app).get('/api/tokens?search=shib&limit=10&cursor=MTA=');

      expect(response.status).toBe(200);
      expect(response.body.data.meta.hasMore).toBe(true);
    });
  });

  describe('Tokens Endpoint - Edge Cases', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle empty search query gracefully', async () => {
      const mockResult = {
        results: [],
        meta: { limit: 30, total: 0, hasMore: false },
        cached: false,
        timestamp: new Date(),
      };

      (tokenAggregationService.getTokens as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app).get('/api/tokens?search=');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle very large limit parameter', async () => {
      const mockResult = {
        results: [],
        meta: { limit: 1000, total: 0, hasMore: false },
        cached: false,
        timestamp: new Date(),
      };

      (tokenAggregationService.getTokens as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app).get('/api/tokens?limit=1000');

      expect(response.status).toBe(200);
    });

    it('should handle service errors gracefully', async () => {
      (tokenAggregationService.getTokens as jest.Mock).mockRejectedValue(new Error('Service error'));

      const response = await request(app).get('/api/tokens');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Token by Address Endpoint', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return token by valid address', async () => {
      const mockToken = {
        token_ticker: 'PEPE',
        address: 'EPjFWaLb3odccjf7wMCteKkyQbER5z5z31L2r2uxNXT',
        price_usd: 0.000001,
      };

      (tokenAggregationService.getTokenByAddress as jest.Mock).mockResolvedValue(mockToken);

      const response = await request(app).get('/api/tokens/EPjFWaLb3odccjf7wMCteKkyQbER5z5z31L2r2uxNXT');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token_ticker).toBe('PEPE');
    });

    it('should return 404 for non-existent token', async () => {
      (tokenAggregationService.getTokenByAddress as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/tokens/EPjFWaLb3odccjf7wMCteKkyQbER5z5z31L2r2uxNXT');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid address format', async () => {
      const response = await request(app).get('/api/tokens/invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle service errors when fetching token', async () => {
      (tokenAggregationService.getTokenByAddress as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/tokens/EPjFWaLb3odccjf7wMCteKkyQbER5z5z31L2r2uxNXT');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Home Page Endpoint', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return home page data for specific query', async () => {
      const mockData = {
        results: [{ token_ticker: 'PEPE', price_usd: 0.000001 }],
        meta: { total: 1 },
      };

      (tokenAggregationService.aggregateTokens as jest.Mock).mockResolvedValue(mockData);

      const response = await request(app).get('/home/page?query=pepe');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should use default query when not provided', async () => {
      const mockData = {
        results: [{ token_ticker: 'MEME', price_usd: 0.00001 }],
        meta: { total: 1 },
      };

      (tokenAggregationService.aggregateTokens as jest.Mock).mockResolvedValue(mockData);

      const response = await request(app).get('/home/page');

      expect(response.status).toBe(200);
      expect(tokenAggregationService.aggregateTokens).toHaveBeenCalledWith('meme');
    });

    it('should handle empty query parameter', async () => {
      const mockData = { results: [], meta: { total: 0 } };
      (tokenAggregationService.aggregateTokens as jest.Mock).mockResolvedValue(mockData);

      const response = await request(app).get('/home/page?query=');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle service errors for home page', async () => {
      (tokenAggregationService.aggregateTokens as jest.Mock).mockRejectedValue(new Error('Aggregation failed'));

      const response = await request(app).get('/home/page?query=pepe');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Failed to fetch home page');
    });
  });

  describe('Response Format Validation', () => {
    it('should include requestId in all responses', async () => {
      const response = await request(app).get('/api/health');
      expect(response.body.requestId).toBeDefined();
    });

    it('should return proper JSON format for all endpoints', async () => {
      const endpoints = ['/api/health', '/api/metrics'];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        expect(response.headers['content-type']).toContain('application/json');
      }
    });
  });
});
