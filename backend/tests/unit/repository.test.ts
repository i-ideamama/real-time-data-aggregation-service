import { tokenRepository } from '../../src/repositories/token.repository';
import { Token } from '../../src/types/token';
import { getRedisClient } from '../../src/config/redis';

jest.mock('../../src/config/redis');

describe('TokenRepository', () => {
  const mockRedis = {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    pipeline: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getRedisClient as jest.Mock).mockReturnValue(mockRedis);
  });

  describe('getToken', () => {
    it('should return cached token', async () => {
      const mockToken: Token = {
        token_address: 'addr1',
        token_name: 'Test',
        token_ticker: 'TST',
        price_sol: null,
        price_usd: null,
        market_cap_sol: null,
        market_cap_usd: null,
        volume_sol: null,
        volume_usd: 100,
        volume_24h_change: null,
        liquidity_sol: null,
        liquidity_usd: null,
        transaction_count: null,
        transaction_count_24h: null,
        price_1hr_change: null,
        price_24hr_change: null,
        price_7d_change: null,
        holders_count: null,
        protocol: null,
        sources: [],
        image_url: null,
        website_url: null,
        twitter_url: null,
        last_updated: new Date(),
        created_at: new Date(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(mockToken));

      const result = await tokenRepository.getToken('addr1');

      expect(result).toEqual(mockToken);
      expect(mockRedis.get).toHaveBeenCalledWith('token:addr1');
    });

    it('should return null if token not cached', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await tokenRepository.getToken('addr1');

      expect(result).toBeNull();
    });
  });

  describe('saveToken', () => {
    it('should save token to cache', async () => {
      const mockToken: Token = {
        token_address: 'addr1',
        token_name: 'Test',
        token_ticker: 'TST',
        price_sol: null,
        price_usd: null,
        market_cap_sol: null,
        market_cap_usd: null,
        volume_sol: null,
        volume_usd: 100,
        volume_24h_change: null,
        liquidity_sol: null,
        liquidity_usd: null,
        transaction_count: null,
        transaction_count_24h: null,
        price_1hr_change: null,
        price_24hr_change: null,
        price_7d_change: null,
        holders_count: null,
        protocol: null,
        sources: [],
        image_url: null,
        website_url: null,
        twitter_url: null,
        last_updated: new Date(),
        created_at: new Date(),
      };

      mockRedis.setex.mockResolvedValue('OK');

      await tokenRepository.saveToken(mockToken);

      expect(mockRedis.setex).toHaveBeenCalled();
      const callArgs = mockRedis.setex.mock.calls[0];
      expect(callArgs[0]).toContain('addr1');
    });
  });

  describe('invalidateToken', () => {
    it('should delete token from cache', async () => {
      mockRedis.del.mockResolvedValue(1);

      await tokenRepository.invalidateToken('addr1');

      expect(mockRedis.del).toHaveBeenCalledWith('token:addr1');
    });
  });
});
