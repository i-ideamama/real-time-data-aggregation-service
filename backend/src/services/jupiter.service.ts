import { httpClient, withRetry } from '../utils/httpClient';
import { config } from '../config/env';
import { logger } from '../config/logger';
import { JupiterToken } from '../types/token';
import { AxiosResponse } from 'axios';

export class JupiterService {
  private baseUrl = config.apis.jupiter;

  async searchTokens(query: string): Promise<JupiterToken[]> {
    return withRetry(
      async () => {
        const tokens: JupiterToken[] = [];
        let url: string | null = `${this.baseUrl}/tokens/v2/search?query=${encodeURIComponent(query)}`;

        while (url) {
          const response: AxiosResponse = await httpClient.get(url);
          const results = response.data?.results || [];
          tokens.push(...results);
          url = response.data?.next_url || null;
        }

        logger.debug(`Jupiter found ${tokens.length} tokens for "${query}"`);
        return tokens;
      },
      'Jupiter search'
    );
  }

  async getTokenById(tokenId: string): Promise<JupiterToken | null> {
    return withRetry(
      async () => {
        const response: AxiosResponse = await httpClient.get(
          `${this.baseUrl}/tokens/v2/${tokenId}`
        );
        return response.data || null;
      },
      `Jupiter getToken ${tokenId}`
    );
  }

  async getPrices(tokenIds: string[]): Promise<Record<string, number>> {
    if (tokenIds.length === 0) return {};

    return withRetry(
      async () => {
        const response: AxiosResponse = await httpClient.get(
          `${this.baseUrl}/tokens/v2/prices`,
          { params: { tokens: tokenIds.join(',') } }
        );
        return response.data?.data || {};
      },
      'Jupiter getPrices'
    );
  }
}

export const jupiterService = new JupiterService();
