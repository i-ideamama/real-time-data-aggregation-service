import { httpClient, withRetry } from '../utils/httpClient';
import { dexScreenerService } from './dexscreener.service';
import { jupiterService } from './jupiter.service';
import { tokenMergingService } from './tokenMerging.service';
import { tokenRepository } from '../repositories/token.repository';
import { config } from '../config/env';
import { logger } from '../config/logger';
import { Token, TokensListResponse } from '../types/token';
import { AxiosResponse } from 'axios';

export class TokenAggregationService {
  private solPriceUsd: number | null = null;
  private lastSolPriceUpdate: number = 0;

  async getSolPrice(): Promise<number | null> {
    const now = Date.now();

    if (this.solPriceUsd && now - this.lastSolPriceUpdate < 30000) {
      return this.solPriceUsd;
    }

    try {
      const response: AxiosResponse = await httpClient.get(
        `${config.apis.coingecko}/simple/price?ids=solana&vs_currencies=usd`
      );
      this.solPriceUsd = response.data?.solana?.usd || null;
      this.lastSolPriceUpdate = now;
      return this.solPriceUsd;
    } catch (error) {
      logger.warn('Failed to fetch SOL price', error);
      return this.solPriceUsd;
    }
  }

  async aggregateTokens(query: string): Promise<TokensListResponse> {
    const cacheKey = `${query.toLowerCase()}`;
    const cached = await tokenRepository.getTokensList(cacheKey);

    if (cached) {
      return { ...cached, cached: true };
    }

    const solPrice = await this.getSolPrice();

    const [jupTokens, dexPairs] = await Promise.all([
      jupiterService.searchTokens(query).catch((err) => {
        logger.warn(`Jupiter search failed: ${err.message}`);
        return [];
      }),
      dexScreenerService.searchTokens(query).catch((err) => {
        logger.warn(`DexScreener search failed: ${err.message}`);
        return [];
      }),
    ]);

    const mergedTokens = tokenMergingService.mergeTokens(jupTokens, dexPairs, solPrice);
    const dedupTokens = tokenMergingService.deduplicateByAddress(mergedTokens);
    const sortedTokens = tokenMergingService.sortTokens(dedupTokens, 'volume', 'desc');

    const response: TokensListResponse = {
      sol_price_usd: solPrice,
      merged_count: sortedTokens.length,
      results: sortedTokens,
      cached: false,
      timestamp: new Date(),
    };

    await Promise.all([
      tokenRepository.saveTokens(sortedTokens),
      tokenRepository.saveTokensList(cacheKey, response),
    ]);

    return response;
  }

  async getTokens(
    query: string,
    sortBy: 'volume' | 'priceChange' | 'marketCap' | 'liquidity' = 'volume',
    sortOrder: 'asc' | 'desc' = 'desc',
    limit: number = 30,
    cursor?: string
  ): Promise<{
    results: Token[];
    meta: {
      limit: number;
      cursor?: string;
      nextCursor?: string;
      total: number;
      hasMore: boolean;
    };
    cached: boolean;
    timestamp: Date;
  }> {
    const cacheKey = `${query.toLowerCase()}:${sortBy}:${sortOrder}`;
    const cached = await tokenRepository.getTokensList(cacheKey);

    let tokens: Token[];

    if (cached) {
      tokens = cached.results;
    } else {
      const aggregated = await this.aggregateTokens(query);
      tokens = tokenMergingService.sortTokens(aggregated.results, sortBy, sortOrder);
    }

    const { tokens: paginated, nextCursor } = tokenMergingService.paginateTokens(
      tokens,
      limit,
      cursor
    );

    return {
      results: paginated,
      meta: {
        limit,
        cursor,
        nextCursor,
        total: tokens.length,
        hasMore: !!nextCursor,
      },
      cached: !!cached,
      timestamp: new Date(),
    };
  }

  async getTokenByAddress(address: string): Promise<Token | null> {
    const cached = await tokenRepository.getToken(address);
    if (cached) return cached;

    try {
      const tokens = await this.aggregateTokens('');
      const token = tokens.results.find(
        (t) => t.token_address.toLowerCase() === address.toLowerCase()
      );
      return token || null;
    } catch (error) {
      logger.error(`Failed to get token ${address}`, error);
      return null;
    }
  }

  async refreshTokenData(): Promise<Token[]> {
    logger.info('Starting token data refresh');

    const queries = ['pepe', 'doge', 'shib', 'bonk', 'floki'];
    const allTokens: Token[] = [];

    for (const query of queries) {
      try {
        const aggregated = await this.aggregateTokens(query);
        allTokens.push(...aggregated.results);
      } catch (error) {
        logger.warn(`Failed to refresh tokens for query "${query}"`, error);
      }
    }

    const dedupTokens = tokenMergingService.deduplicateByAddress(allTokens);
    return dedupTokens;
  }
}

export const tokenAggregationService = new TokenAggregationService();
