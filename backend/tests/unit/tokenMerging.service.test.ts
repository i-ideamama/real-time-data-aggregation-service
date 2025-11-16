import { TokenMergingService } from '../../src/services/tokenMerging.service';
import { Token, JupiterToken, DexScreenerPair } from '../../src/types/token';

describe('TokenMergingService - Comprehensive Unit Tests', () => {
  const service = new TokenMergingService();

  describe('mergeTokens - Happy Path', () => {
    it('should successfully merge tokens from Jupiter and Dex Screener', () => {
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

    it('should include volume data in merged tokens', () => {
      const jupTokens: JupiterToken[] = [
        {
          id: 'doge456',
          name: 'Dogecoin',
          symbol: 'DOGE',
          decimals: 8,
          price_usd: 0.1,
          mcapUsd: 14000000000,
        },
      ];

      const dexPairs: DexScreenerPair[] = [
        {
          pairAddress: 'pair456',
          chainId: 'solana',
          dexId: 'raydium',
          baseToken: { address: 'doge456', name: 'Dogecoin', symbol: 'DOGE' },
          quoteToken: { address: 'sol', name: 'Solana', symbol: 'SOL' },
          priceNative: '0.5',
          priceUsd: '0.1',
          txns: { h1: { buys: 500, sells: 300 }, h24: { buys: 5000, sells: 3000 } },
          volume: { h1: '50000', h24: '500000' },
          priceChange: { h1: '2.5', h24: '15' },
        },
      ];

      const result = service.mergeTokens(jupTokens, dexPairs, 20);

      expect(result[0].volume_usd).toBe(500000);
      expect(result[0].price_24hr_change).toBe(15);
    });

    it('should calculate transaction counts correctly', () => {
      const jupTokens: JupiterToken[] = [
        {
          id: 'shib789',
          name: 'Shiba Inu',
          symbol: 'SHIB',
          decimals: 18,
          price_usd: 0.000008,
          mcapUsd: 5000000000,
        },
      ];

      const dexPairs: DexScreenerPair[] = [
        {
          pairAddress: 'pair789',
          chainId: 'solana',
          dexId: 'raydium',
          baseToken: { address: 'shib789', name: 'Shiba Inu', symbol: 'SHIB' },
          quoteToken: { address: 'sol', name: 'Solana', symbol: 'SOL' },
          priceNative: '0.0001',
          priceUsd: '0.000008',
          txns: { h1: { buys: 100, sells: 80 }, h24: { buys: 1000, sells: 800 } },
          volume: { h1: '10000', h24: '100000' },
          priceChange: { h1: '1', h24: '5' },
        },
      ];

      const result = service.mergeTokens(jupTokens, dexPairs, 20);

      expect(result[0].transaction_count_24h).toBeGreaterThan(0);
      expect(result[0].transaction_count_24h).toBe(1800);
    });
  });

  describe('mergeTokens - Edge Cases', () => {
    it('should handle empty token arrays', () => {
      const result = service.mergeTokens([], [], 20);
      expect(result).toEqual([]);
    });

    it('should handle tokens with missing optional fields', () => {
      const jupTokens: JupiterToken[] = [
        {
          id: 'test123',
          name: 'Test Token',
          symbol: 'TEST',
          decimals: 6,
          price_usd: 0.1,
          mcapUsd: 0,
        },
      ];

      const dexPairs: DexScreenerPair[] = [];

      const result = service.mergeTokens(jupTokens, dexPairs, 20);

      expect(result).toBeDefined();
    });

    it('should prioritize dex data over jupiter data when both available', () => {
      const jupTokens: JupiterToken[] = [
        {
          id: 'test456',
          name: 'Test Token',
          symbol: 'TEST',
          decimals: 6,
          price_usd: 0.5,
          mcapUsd: 1000000,
        },
      ];

      const dexPairs: DexScreenerPair[] = [
        {
          pairAddress: 'pair_test',
          chainId: 'solana',
          dexId: 'raydium',
          baseToken: { address: 'test456', name: 'Test Token', symbol: 'TEST' },
          quoteToken: { address: 'sol', name: 'Solana', symbol: 'SOL' },
          priceNative: '0.1',
          priceUsd: '0.75',
          txns: { h1: { buys: 10, sells: 5 }, h24: { buys: 100, sells: 50 } },
          volume: { h1: '5000', h24: '50000' },
          priceChange: { h1: '1', h24: '10' },
        },
      ];

      const result = service.mergeTokens(jupTokens, dexPairs, 20);

      expect(result[0].price_usd).toBe(0.75);
    });

    it('should handle invalid price strings', () => {
      const jupTokens: JupiterToken[] = [
        {
          id: 'invalid789',
          name: 'Invalid Token',
          symbol: 'INV',
          decimals: 6,
          price_usd: 0.1,
          mcapUsd: 100000,
        },
      ];

      const dexPairs: DexScreenerPair[] = [
        {
          pairAddress: 'pair_invalid',
          chainId: 'solana',
          dexId: 'raydium',
          baseToken: { address: 'invalid789', name: 'Invalid Token', symbol: 'INV' },
          quoteToken: { address: 'sol', name: 'Solana', symbol: 'SOL' },
          priceNative: 'invalid_price',
          priceUsd: 'not_a_number',
          txns: { h1: { buys: 10, sells: 5 }, h24: { buys: 100, sells: 50 } },
          volume: { h1: '5000', h24: '50000' },
          priceChange: { h1: 'invalid', h24: 'invalid' },
        },
      ];

      const result = service.mergeTokens(jupTokens, dexPairs, 20);

      expect(result).toBeDefined();
    });
  });

  describe('sortTokens - Happy Path', () => {
    it('should sort tokens by volume in descending order', () => {
      const tokens: Partial<Token>[] = [
        { token_ticker: 'A', volume_usd: 100 },
        { token_ticker: 'B', volume_usd: 500 },
        { token_ticker: 'C', volume_usd: 300 },
      ];

      const result = service.sortTokens(tokens as Token[], 'volume', 'desc');

      expect(result[0].token_ticker).toBe('B');
      expect(result[1].token_ticker).toBe('C');
      expect(result[2].token_ticker).toBe('A');
    });

    it('should sort tokens by price change ascending order', () => {
      const tokens: Partial<Token>[] = [
        { token_ticker: 'A', price_24hr_change: 100 },
        { token_ticker: 'B', price_24hr_change: 50 },
        { token_ticker: 'C', price_24hr_change: 200 },
      ];

      const result = service.sortTokens(tokens as Token[], 'priceChange', 'asc');

      expect(result[0].token_ticker).toBe('B');
      expect(result[1].token_ticker).toBe('A');
      expect(result[2].token_ticker).toBe('C');
    });

    it('should sort by market cap', () => {
      const tokens: Partial<Token>[] = [
        { token_ticker: 'A', market_cap_usd: 1000 },
        { token_ticker: 'B', market_cap_usd: 5000 },
        { token_ticker: 'C', market_cap_usd: 3000 },
      ];

      const result = service.sortTokens(tokens as Token[], 'marketCap', 'desc');

      expect(result[0].token_ticker).toBe('B');
      expect(result[0].market_cap_usd).toBe(5000);
    });
  });

  describe('sortTokens - Edge Cases', () => {
    it('should handle empty array', () => {
      const result = service.sortTokens([], 'volume', 'desc');
      expect(result).toEqual([]);
    });

    it('should handle single token', () => {
      const tokens: Partial<Token>[] = [{ token_ticker: 'SINGLE', volume_usd: 100 }];
      const result = service.sortTokens(tokens as Token[], 'volume', 'desc');

      expect(result).toHaveLength(1);
      expect(result[0].token_ticker).toBe('SINGLE');
    });

    it('should handle null values in sorting field', () => {
      const tokens: Partial<Token>[] = [
        { token_ticker: 'A', volume_usd: 100 },
        { token_ticker: 'B', volume_usd: null },
        { token_ticker: 'C', volume_usd: 300 },
      ];

      const result = service.sortTokens(tokens as Token[], 'volume', 'desc');

      expect(result).toBeDefined();
      expect(result.length).toBe(3);
    });

    it('should handle invalid sort order gracefully', () => {
      const tokens: Partial<Token>[] = [
        { token_ticker: 'A', volume_usd: 100 },
        { token_ticker: 'B', volume_usd: 500 },
      ];

      const result = service.sortTokens(tokens as Token[], 'volume', 'invalid' as any);

      expect(result).toBeDefined();
    });
  });

  describe('paginateTokens - Happy Path', () => {
    it('should paginate tokens correctly', () => {
      const tokens: Partial<Token>[] = Array.from({ length: 30 }, (_, i) => ({
        token_ticker: `TOKEN_${i}`,
        price_usd: i,
      }));

      const result = service.paginateTokens(tokens as Token[], 10);

      expect(result.tokens).toHaveLength(10);
      expect(result.tokens[0].token_ticker).toBe('TOKEN_0');
      expect(result.nextCursor).toBeDefined();
    });

    it('should handle cursor for pagination', () => {
      const tokens: Partial<Token>[] = Array.from({ length: 30 }, (_, i) => ({
        token_ticker: `TOKEN_${i}`,
        price_usd: i,
      }));

      const firstPage = service.paginateTokens(tokens as Token[], 10);
      expect(firstPage.nextCursor).toBeDefined();

      const secondPage = service.paginateTokens(tokens as Token[], 10, firstPage.nextCursor);

      expect(secondPage.tokens[0].token_ticker).toBe('TOKEN_10');
    });

    it('should not have nextCursor on last page', () => {
      const tokens: Partial<Token>[] = Array.from({ length: 15 }, (_, i) => ({
        token_ticker: `TOKEN_${i}`,
        price_usd: i,
      }));

      const result = service.paginateTokens(tokens as Token[], 20);

      expect(result.tokens).toHaveLength(15);
      expect(result.nextCursor).toBeUndefined();
    });
  });

  describe('paginateTokens - Edge Cases', () => {
    it('should handle empty token array', () => {
      const result = service.paginateTokens([], 10);

      expect(result.tokens).toHaveLength(0);
      expect(result.nextCursor).toBeUndefined();
    });

    it('should handle limit larger than array length', () => {
      const tokens: Partial<Token>[] = Array.from({ length: 5 }, (_, i) => ({
        token_ticker: `TOKEN_${i}`,
        price_usd: i,
      }));

      const result = service.paginateTokens(tokens as Token[], 100);

      expect(result.tokens).toHaveLength(5);
      expect(result.nextCursor).toBeUndefined();
    });

    it('should handle invalid cursor gracefully', () => {
      const tokens: Partial<Token>[] = Array.from({ length: 20 }, (_, i) => ({
        token_ticker: `TOKEN_${i}`,
        price_usd: i,
      }));

      const result = service.paginateTokens(tokens as Token[], 10, 'invalid_cursor');

      expect(result.tokens).toHaveLength(10);
      expect(result.tokens[0].token_ticker).toBe('TOKEN_0');
    });

    it('should handle limit of 1', () => {
      const tokens: Partial<Token>[] = Array.from({ length: 10 }, (_, i) => ({
        token_ticker: `TOKEN_${i}`,
        price_usd: i,
      }));

      const result = service.paginateTokens(tokens as Token[], 1);

      expect(result.tokens).toHaveLength(1);
      expect(result.nextCursor).toBeDefined();
    });
  });
});
