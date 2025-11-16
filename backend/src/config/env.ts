import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8000'),
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    db: parseInt(process.env.REDIS_DB || '0'),
  },
  
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '30'),
  },
  
  apis: {
    dexscreener: process.env.DEXSCREENER_BASE_URL || 'https://api.dexscreener.com',
    jupiter: process.env.JUPITER_BASE_URL || 'https://lite-api.jup.ag',
    coingecko: process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3',
  },
  
  http: {
    timeout: parseInt(process.env.API_TIMEOUT || '10000'),
    maxRetries: parseInt(process.env.MAX_RETRIES || '4'),
    baseRetryDelay: parseInt(process.env.BASE_RETRY_DELAY || '200'),
    maxRetryDelay: parseInt(process.env.MAX_RETRY_DELAY || '10000'),
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
    max: parseInt(process.env.RATE_LIMIT_MAX || '300'),
  },
  
  jobs: {
    fetchInterval: parseInt(process.env.JOB_FETCH_INTERVAL || '30000'),
    retryAttempts: parseInt(process.env.JOB_RETRY_ATTEMPTS || '3'),
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
};

export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
