import express from 'express';
import {
  getEnvironments,
  getEnvironmentById,
  createEnvironment,
  updateEnvironment,
  setActiveEnvironment,
  duplicateEnvironment,
  deleteEnvironment,
} from '../controllers/environmentController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(optionalAuth, getEnvironments)
  .post(optionalAuth, createEnvironment);

router.patch('/:id/activate', optionalAuth, setActiveEnvironment);
router.post('/:id/duplicate', optionalAuth, duplicateEnvironment);

router.route('/:id')
  .get(optionalAuth, getEnvironmentById)
  .put(optionalAuth, updateEnvironment)
  .delete(optionalAuth, deleteEnvironment);

export default router;
