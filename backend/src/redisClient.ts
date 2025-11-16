import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
export const redisClient = createClient({ url: REDIS_URL });
redisClient.on('error', (err) => console.error('Redis Client Error', err));

// try to connect immediately
(async () => {
  try {
    if (!redisClient.isOpen) await redisClient.connect();
    console.log('[redis] connected');
  } catch (e) {
    console.error('[redis] connect error', e);
  }
})();

export default redisClient;
