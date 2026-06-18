import express from 'express';
import { getHomePage } from '../controllers/home.controller';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

router.get('/page', asyncHandler(getHomePage));

export default router;

