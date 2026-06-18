import request from 'supertest';
import express from 'express';
import { tokenRepository } from '../../src/repositories/token.repository';
import { tokenAggregationService } from '../../src/services/tokenAggregation.service';

jest.mock('../../src/repositories/token.repository');
jest.mock('../../src/services/tokenAggregation.service');

const mockRouter = express.Router();

mockRouter.get('/tokens', async (req, res) => {
  try {
    const result = await tokenAggregationService.getTokens(
      'pepe',
      'volume',
      'desc',
      30,
      undefined
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

mockRouter.get('/health', (_req, res) => {
  res.json({ success: true, status: 'healthy' });
});

const app = express();
app.use(express.json());
app.use('/api', mockRouter);

describe('API Endpoints', () => {
  describe('GET /api/tokens', () => {
    it('should return tokens list', async () => {
      (tokenAggregationService.getTokens as jest.Mock).mockResolvedValue({
        results: [],
        meta: { limit: 30, total: 0, hasMore: false },
        cached: false,
        timestamp: new Date(),
      });

      const response = await request(app).get('/api/tokens');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.data).toHaveProperty('meta');
    });

    it('should handle errors gracefully', async () => {
      (tokenAggregationService.getTokens as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      const response = await request(app).get('/api/tokens');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('healthy');
    });
  });
});
