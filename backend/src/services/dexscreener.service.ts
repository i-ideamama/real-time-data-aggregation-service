import { httpClient, withRetry } from '../utils/httpClient';
import { config } from '../config/env';
import { logger } from '../config/logger';
import { DexScreenerPair } from '../types/token';

export class DexScreenerService {
  private baseUrl = config.apis.dexscreener;

  async searchTokens(query: string): Promise<DexScreenerPair[]> {
    return withRetry(
      async () => {
        const response = await httpClient.get(
          `${this.baseUrl}/latest/dex/search?q=${encodeURIComponent(query)}`
        );
        const pairs = response.data?.pairs || [];
        logger.debug(`DexScreener found ${pairs.length} pairs for "${query}"`);
        return pairs;
      },
      'DexScreener search'
    );
  }

  async getPairByAddress(chainId: string, pairAddress: string): Promise<DexScreenerPair | null> {
    return withRetry(
      async () => {
        const response = await httpClient.get(
          `${this.baseUrl}/latest/dex/pairs/${chainId}/${pairAddress}`
        );
        const pair = response.data?.pairs?.[0];
        return pair || null;
      },
      `DexScreener getPair ${pairAddress}`
    );
  }
}

export const dexScreenerService = new DexScreenerService();
