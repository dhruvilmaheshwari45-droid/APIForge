import express from 'express';
import {
  getTestRuns,
  getTestRunById,
  deleteTestRun,
  clearTestRuns,
} from '../controllers/testRunController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(optionalAuth, getTestRuns)
  .delete(optionalAuth, clearTestRuns);

router.route('/:id')
  .get(optionalAuth, getTestRunById)
  .delete(optionalAuth, deleteTestRun);

export default router;
