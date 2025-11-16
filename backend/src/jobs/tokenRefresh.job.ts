import Queue from 'bull';
import { getRedisClient } from '../config/redis';
import { tokenAggregationService } from '../services/tokenAggregation.service';
import { logger } from '../config/logger';
import { config } from '../config/env';
import { emitTokenNew, emitTokenUpdate } from '../config/socket';

export const tokenFetchQueue = new Queue('token:fetch', config.redis.url);

tokenFetchQueue.process('refresh-tokens', async (job) => {
  logger.info('Processing token refresh job');

  try {
    const tokens = await tokenAggregationService.refreshTokenData();
    logger.info(`Token refresh completed: ${tokens.length} tokens`);
    return { success: true, count: tokens.length };
  } catch (error) {
    logger.error('Token refresh job failed', error);
    throw error;
  }
});

tokenFetchQueue.on('failed', (job, err) => {
  logger.error(`Job failed: ${job.id}`, err);
});

tokenFetchQueue.on('completed', (job) => {
  logger.debug(`Job completed: ${job.id}`);
});

export async function scheduleTokenRefresh(): Promise<void> {
  const job = await tokenFetchQueue.add(
    'refresh-tokens',
    {},
    {
      repeat: {
        every: config.jobs.fetchInterval,
      },
      attempts: config.jobs.retryAttempts,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
    }
  );

  logger.info(`Scheduled token refresh job with ID: ${job.id}`);
}

export async function closeQueue(): Promise<void> {
  await tokenFetchQueue.close();
}
