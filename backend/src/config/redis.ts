import Redis from 'ioredis';
import { config } from './env';
import { logger } from './logger';

let redisClient: Redis | null = null;

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  // For Render's Redis TLS connection
  tls: process.env.NODE_ENV === 'production' ? {} : undefined,
});

export async function initRedis(): Promise<Redis> {
  if (redisClient) return redisClient;

  redisClient = new Redis(config.redis.url, {
    db: config.redis.db,
    enableOfflineQueue: true,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    connectTimeout: 10000,
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected');
  });

  redisClient.on('error', (err) => {
    logger.error('Redis error:', err);
  });

  redisClient.on('close', () => {
    logger.warn('Redis connection closed');
  });

  return redisClient;
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call initRedis() first.');
  }
  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

export default redis;
