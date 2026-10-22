import express from 'express';
import { getPerformanceAnalytics } from '../controllers/analyticsController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, getPerformanceAnalytics);
router.get('/performance', optionalAuth, getPerformanceAnalytics);

export default router;
