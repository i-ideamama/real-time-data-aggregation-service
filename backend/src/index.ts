import express from 'express';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import http from 'http';

import { config } from './config/env';
import { initRedis, closeRedis } from './config/redis';
import { logger } from './config/logger';
import { initSocket } from './config/socket';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { scheduleTokenRefresh, closeQueue } from './jobs/tokenRefresh.job';

import homeRoutes from './routes/getHome.route';
import apiRoutes from './routes/api.routes';

const rawPort = process.env.PORT;
const PORT: number = rawPort ? Number(rawPort) : 3000;

const app = express();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});


const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors({ origin: config.cors.origin }));
app.use(compression());
app.use(express.json());
app.use(limiter);
app.use(requestIdMiddleware);

app.use('/home', homeRoutes);
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'real-time-crypto-aggregator',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      tokens: '/api/tokens',
      metrics: '/api/metrics',
      home: '/home/page',
    },
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Not found',
    requestId: req.id,
  });
});

app.use(errorHandler);

const server = http.createServer(app);
initSocket(server);

async function start(): Promise<void> {
  try {
    await initRedis().catch((err) => {
      logger.warn('Redis initialization failed, continuing without cache:', err.message);
    });

    await scheduleTokenRefresh().catch((err) => {
      logger.warn('Failed to schedule background jobs:', err.message);
    });

    server.listen(config.port, () => {
      logger.info(`Server listening on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

async function shutdown(): Promise<void> {
  logger.info('Shutting down gracefully...');

  try {
    await closeQueue();
    await closeRedis();
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown');
      process.exit(1);
    }, 10000);
  } catch (error) {
    logger.error('Error during shutdown', error);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();

