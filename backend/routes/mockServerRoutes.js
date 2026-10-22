import express from 'express';
import {
  getMockServers,
  getMockServerById,
  createMockServer,
  updateMockServer,
  toggleServerStatus,
  deleteMockServer,
} from '../controllers/mockServerController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(optionalAuth, getMockServers)
  .post(optionalAuth, createMockServer);

router.patch('/:id/toggle', optionalAuth, toggleServerStatus);

router.route('/:id')
  .get(optionalAuth, getMockServerById)
  .put(optionalAuth, updateMockServer)
  .delete(optionalAuth, deleteMockServer);

export default router;
