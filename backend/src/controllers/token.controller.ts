import { Request, Response } from 'express';
import { tokenAggregationService } from '../services/tokenAggregation.service';
import { tokenRepository } from '../repositories/token.repository';
import { TokenQuerySchema, TokenAddressParamSchema } from '../schemas/token.schema';
import { getMetrics } from '../config/socket';
import { logger } from '../config/logger';

export const getTokens = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = TokenQuerySchema.parse(req.query);
    const { search = 'pepe' } = req.query as { search?: string };

    const result = await tokenAggregationService.getTokens(
      String(search),
      query.sortBy as any,
      query.sortOrder as any,
      query.limit,
      query.cursor
    );

    res.status(200).json({
      success: true,
      data: result,
      requestId: req.id,
    });
  } catch (error) {
    logger.error('Get tokens error', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tokens',
      requestId: req.id,
    });
  }
};

export const getTokenById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = TokenAddressParamSchema.parse(req.params);
    const token = await tokenAggregationService.getTokenByAddress(address);

    if (!token) {
      res.status(404).json({
        success: false,
        message: 'Token not found',
        requestId: req.id,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: token,
      requestId: req.id,
    });
  } catch (error) {
    logger.error('Get token by ID error', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch token',
      requestId: req.id,
    });
  }
};

export const getHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      requestId: req.id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      requestId: req.id,
    });
  }
};

export const getMetricsEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const metrics = getMetrics();
    const cacheStats = await tokenRepository.getStats();

    res.status(200).json({
      success: true,
      data: {
        websocket: {
          activeConnections: metrics.activeConnections,
          totalMessages: metrics.totalMessages,
        },
        cache: cacheStats,
        api: {
          totalCalls: metrics.apiCalls,
        },
      },
      requestId: req.id,
    });
  } catch (error) {
    logger.error('Get metrics error', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch metrics',
      requestId: req.id,
    });
  }
};
