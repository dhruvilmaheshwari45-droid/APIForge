import express from 'express';
import {
  getMockRules,
  getMockRuleById,
  createMockRule,
  updateMockRule,
  toggleMockRule,
  deleteMockRule,
} from '../controllers/mockRuleController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(optionalAuth, getMockRules)
  .post(optionalAuth, createMockRule);

router.patch('/:id/toggle', optionalAuth, toggleMockRule);

router.route('/:id')
  .get(optionalAuth, getMockRuleById)
  .put(optionalAuth, updateMockRule)
  .delete(optionalAuth, deleteMockRule);

export default router;
