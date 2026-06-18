import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config/env';
import { logger } from '../config/logger';
import { ServiceUnavailableError } from '../errors/AppError';
import { recordApiCall } from '../config/socket';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function getBackoffDelay(attempt: number, jitter: boolean = true): number {
  let delay = Math.min(
    config.http.maxRetryDelay,
    config.http.baseRetryDelay * Math.pow(2, attempt)
  );

  if (jitter) {
    const rnd = (Math.random() - 0.5) * 0.5;
    delay = Math.max(0, Math.round(delay * (1 + rnd)));
  }

  return delay;
}

function isRetryableError(error: AxiosError): boolean {
  if (!error.response) return true;
  const status = error.response.status;
  return status === 408 || status === 429 || status >= 500;
}

export const httpClient = axios.create({
  timeout: config.http.timeout,
  headers: {
    'User-Agent': 'real-time-crypto-aggregator/1.0',
  },
});

httpClient.interceptors.response.use(
  (response) => {
    recordApiCall();
    return response;
  },
  async (error: AxiosError) => {
    recordApiCall();
    throw error;
  }
);

export async function withRetry<T>(
  fn: () => Promise<T>,
  context: string = 'API call'
): Promise<T> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= config.http.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (attempt === config.http.maxRetries) {
        break;
      }

      if (error.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '1') * 1000;
        logger.warn(`${context}: Rate limited, retrying after ${retryAfter}ms`);
        await sleep(retryAfter);
        continue;
      }

      if (isRetryableError(error)) {
        const delay = getBackoffDelay(attempt);
        logger.debug(`${context}: Attempt ${attempt + 1}/${config.http.maxRetries + 1} failed, retrying in ${delay}ms`);
        await sleep(delay);
        continue;
      }

      throw error;
    }
  }

  const message = lastError?.message || `${context} failed after ${config.http.maxRetries} retries`;
  logger.error(message, { meta: { context } });
  throw new ServiceUnavailableError(context);
}
