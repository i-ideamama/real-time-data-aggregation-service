import { Request, Response } from 'express';
import { tokenAggregationService } from '../services/tokenAggregation.service';
import { logger } from '../config/logger';
import { getIO } from '../config/socket';

export const getHomePage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query = 'pepe' } = req.query;
    const result = await tokenAggregationService.aggregateTokens(String(query));

    try {
      const io = getIO();
      if (io) {
        io.emit('home:update', result);
      }
    } catch (error) {
      logger.error('Socket emit error', error);
    }

    res.status(200).json({
      success: true,
      data: result,
      requestId: req.id,
    });
  } catch (error) {
    logger.error('Home page error', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch home page data',
      requestId: req.id,
    });
  }
};

