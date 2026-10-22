import express from 'express';
import {
  getTrafficLogs,
  getTrafficLogById,
  createTrafficLog,
  clearTrafficLogs,
} from '../controllers/trafficController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(optionalAuth, getTrafficLogs)
  .post(optionalAuth, createTrafficLog)
  .delete(optionalAuth, clearTrafficLogs);

router.route('/:id')
  .get(optionalAuth, getTrafficLogById);

export default router;
