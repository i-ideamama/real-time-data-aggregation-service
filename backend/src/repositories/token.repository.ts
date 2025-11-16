import { getRedisClient } from '../config/redis';
import { Token, TokensListResponse } from '../types/token';
import { config } from '../config/env';
import { logger } from '../config/logger';
import { recordCacheHit, recordCacheMiss } from '../config/socket';

export class TokenRepository {
  private prefix = 'token:';
  private listPrefix = 'tokens:list:';
  private statsPrefix = 'stats:';

  private getRedis() {
    try {
      return getRedisClient();
    } catch {
      return null;
    }
  }

  async getToken(address: string): Promise<Token | null> {
    const redis = this.getRedis();
    if (!redis) return null;

    const key = `${this.prefix}${address.toLowerCase()}`;

    try {
      const cached = await redis.get(key);
      if (cached) {
        recordCacheHit();
        logger.debug(`Cache hit for token ${address}`);
        return JSON.parse(cached);
      }
      recordCacheMiss();
    } catch (error) {
      logger.error(`Redis get error for ${key}`, error);
    }

    return null;
  }

  async saveToken(token: Token, ttl: number = config.cache.ttl): Promise<void> {
    const redis = this.getRedis();
    if (!redis) return;

    const key = `${this.prefix}${token.token_address.toLowerCase()}`;

    try {
      await redis.setex(key, ttl, JSON.stringify(token));
    } catch (error) {
      logger.error(`Redis set error for ${key}`, error);
    }
  }

  async saveTokens(tokens: Token[], ttl: number = config.cache.ttl): Promise<void> {
    const redis = this.getRedis();
    if (!redis) return;

    const pipeline = redis.pipeline();

    tokens.forEach((token) => {
      const key = `${this.prefix}${token.token_address.toLowerCase()}`;
      pipeline.setex(key, ttl, JSON.stringify(token));
    });

    try {
      await pipeline.exec();
    } catch (error) {
      logger.error('Redis pipeline error', error);
    }
  }

  async getTokensList(
    key: string
  ): Promise<TokensListResponse | null> {
    const redis = this.getRedis();
    if (!redis) return null;

    const cacheKey = `${this.listPrefix}${key}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        recordCacheHit();
        logger.debug(`Cache hit for tokens list ${key}`);
        return JSON.parse(cached);
      }
      recordCacheMiss();
    } catch (error) {
      logger.error(`Redis get error for ${cacheKey}`, error);
    }

    return null;
  }

  async saveTokensList(
    key: string,
    data: TokensListResponse,
    ttl: number = config.cache.ttl
  ): Promise<void> {
    const redis = this.getRedis();
    if (!redis) return;

    const cacheKey = `${this.listPrefix}${key}`;

    try {
      await redis.setex(cacheKey, ttl, JSON.stringify(data));
    } catch (error) {
      logger.error(`Redis set error for ${cacheKey}`, error);
    }
  }

  async invalidateToken(address: string): Promise<void> {
    const redis = this.getRedis();
    if (!redis) return;

    const key = `${this.prefix}${address.toLowerCase()}`;

    try {
      await redis.del(key);
    } catch (error) {
      logger.error(`Redis del error for ${key}`, error);
    }
  }

  async invalidateTokensList(pattern: string = '*'): Promise<void> {
    const redis = this.getRedis();
    if (!redis) return;

    try {
      const keys = await redis.keys(`${this.listPrefix}${pattern}`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error('Redis invalidation error', error);
    }
  }

  async getStats(): Promise<{
    cacheHits: number;
    cacheMisses: number;
    cacheHitRate: number;
  }> {
    const redis = this.getRedis();
    if (!redis) {
      return {
        cacheHits: 0,
        cacheMisses: 0,
        cacheHitRate: 0,
      };
    }

    const hitsKey = `${this.statsPrefix}hits`;
    const missesKey = `${this.statsPrefix}misses`;

    try {
      const hitsStr = await redis.get(hitsKey);
      const missesStr = await redis.get(missesKey);

      const hits = parseInt(hitsStr || '0');
      const misses = parseInt(missesStr || '0');
      const total = hits + misses;
      const rate = total > 0 ? (hits / total) * 100 : 0;

      return {
        cacheHits: hits,
        cacheMisses: misses,
        cacheHitRate: rate,
      };
    } catch (error) {
      logger.error('Redis stats error', error);
      return {
        cacheHits: 0,
        cacheMisses: 0,
        cacheHitRate: 0,
      };
    }
  }
}

export const tokenRepository = new TokenRepository();
