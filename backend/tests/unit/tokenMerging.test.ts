import { TokenMergingService } from '../../src/services/tokenMerging.service';
import { Token, JupiterToken, DexScreenerPair } from '../../src/types/token';

describe('TokenMergingService', () => {
  const service = new TokenMergingService();

  describe('mergeTokens', () => {
    it('should merge tokens from multiple sources', () => {
      const jupTokens: JupiterToken[] = [
        {
          id: 'pepe123',
          name: 'Pepe',
          symbol: 'PEPE',
          decimals: 6,
          price_usd: 0.000001,
          mcapUsd: 500000,
        },
      ];

      const dexPairs: DexScreenerPair[] = [
        {
          pairAddress: 'pair123',
          chainId: 'solana',
          dexId: 'raydium',
          baseToken: {
            address: 'pepe123',
            name: 'Pepe',
            symbol: 'PEPE',
          },
          quoteToken: {
            address: 'sol',
            name: 'Solana',
            symbol: 'SOL',
          },
          priceNative: '0.0001',
          priceUsd: '0.000001',
          txns: { h1: { buys: 10, sells: 5 }, h24: { buys: 100, sells: 50 } },
          volume: { h1: '1000', h24: '10000' },
          priceChange: { h1: '5', h24: '10' },
        },
      ];

      const result = service.mergeTokens(jupTokens, dexPairs, 20);

      expect(result).toHaveLength(1);
      expect(result[0].token_ticker).toBe('PEPE');
      expect(result[0].price_usd).toBe(0.000001);
    });

    it('should handle empty arrays', () => {
      const result = service.mergeTokens([], [], 20);
      expect(result).toHaveLength(0);
    });

    it('should calculate price_sol from usd price and sol price', () => {
      const jupTokens: JupiterToken[] = [
        {
          id: 'token123',
          name: 'Test Token',
          symbol: 'TEST',
          decimals: 6,
          price_usd: 20,
        },
      ];

      const result = service.mergeTokens(jupTokens, [], 50);

      expect(result[0].price_sol).toBe(0.4);
    });
  });

  describe('sortTokens', () => {
    const tokens: Token[] = [
      {
        token_address: 'addr1',
        token_name: 'Token 1',
        token_ticker: 'TK1',
        price_sol: null,
        price_usd: null,
        market_cap_sol: null,
        market_cap_usd: 5000,
        volume_sol: null,
        volume_usd: 100,
        volume_24h_change: null,
        liquidity_sol: null,
        liquidity_usd: 50,
        transaction_count: null,
        transaction_count_24h: null,
        price_1hr_change: null,
        price_24hr_change: 10,
        price_7d_change: null,
        holders_count: null,
        protocol: 'test',
        sources: [],
        image_url: null,
        website_url: null,
        twitter_url: null,
        last_updated: new Date(),
        created_at: new Date(),
      },
      {
        token_address: 'addr2',
        token_name: 'Token 2',
        token_ticker: 'TK2',
        price_sol: null,
        price_usd: null,
        market_cap_sol: null,
        market_cap_usd: 10000,
        volume_sol: null,
        volume_usd: 200,
        volume_24h_change: null,
        liquidity_sol: null,
        liquidity_usd: 100,
        transaction_count: null,
        transaction_count_24h: null,
        price_1hr_change: null,
        price_24hr_change: 5,
        price_7d_change: null,
        holders_count: null,
        protocol: 'test',
        sources: [],
        image_url: null,
        website_url: null,
        twitter_url: null,
        last_updated: new Date(),
        created_at: new Date(),
      },
    ];

    it('should sort by volume descending', () => {
      const sorted = service.sortTokens(tokens, 'volume', 'desc');
      expect(sorted[0].volume_usd).toBe(200);
      expect(sorted[1].volume_usd).toBe(100);
    });

    it('should sort by volume ascending', () => {
      const sorted = service.sortTokens(tokens, 'volume', 'asc');
      expect(sorted[0].volume_usd).toBe(100);
      expect(sorted[1].volume_usd).toBe(200);
    });

    it('should sort by marketCap', () => {
      const sorted = service.sortTokens(tokens, 'marketCap', 'desc');
      expect(sorted[0].market_cap_usd).toBe(10000);
    });
  });

  describe('paginateTokens', () => {
    const tokens = Array.from({ length: 100 }, (_, i) => ({
      token_address: `addr${i}`,
      token_name: `Token ${i}`,
      token_ticker: `T${i}`,
      price_sol: null,
      price_usd: null,
      market_cap_sol: null,
      market_cap_usd: null,
      volume_sol: null,
      volume_usd: null,
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
    }));

    it('should paginate with default limit', () => {
      const { tokens: result, nextCursor } = service.paginateTokens(tokens, 30);
      expect(result).toHaveLength(30);
      expect(nextCursor).toBeDefined();
    });

    it('should use cursor for pagination', () => {
      const { tokens: page1, nextCursor: cursor1 } = service.paginateTokens(tokens, 30);
      const { tokens: page2, nextCursor: cursor2 } = service.paginateTokens(tokens, 30, cursor1);

      expect(page2[0].token_address).not.toBe(page1[0].token_address);
      expect(cursor2).toBeDefined();
    });

    it('should not have nextCursor on last page', () => {
      const { nextCursor } = service.paginateTokens(tokens, 100);
      expect(nextCursor).toBeUndefined();
    });
  });

  describe('deduplicateByAddress', () => {
    it('should merge tokens with same address', () => {
      const token1: Token = {
        token_address: 'same',
        token_name: 'Token',
        token_ticker: 'TK',
        price_sol: 1,
        price_usd: 50,
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
        protocol: 'test',
        sources: ['source1'],
        image_url: null,
        website_url: null,
        twitter_url: null,
        last_updated: new Date(),
        created_at: new Date(),
      };

      const token2: Token = {
        ...token1,
        price_sol: null,
        volume_usd: 200,
        sources: ['source2'],
      };

      const result = service.deduplicateByAddress([token1, token2]);

      expect(result).toHaveLength(1);
      expect(result[0].price_sol).toBe(1);
      expect(result[0].volume_usd).toBe(200);
      expect(result[0].sources).toContain('source1');
      expect(result[0].sources).toContain('source2');
    });
  });
});
