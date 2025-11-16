import express from 'express';
import {
  getTokens,
  getTokenById,
  getHealth,
  getMetricsEndpoint,
} from '../controllers/token.controller';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

router.get('/tokens', asyncHandler(getTokens));
router.get('/tokens/:address', asyncHandler(getTokenById));
router.get('/health', asyncHandler(getHealth));
router.get('/metrics', asyncHandler(getMetricsEndpoint));

export default router;
