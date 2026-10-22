import express from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import { optionalAuth, protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(optionalAuth, getProjects)
  .post(protect, createProject);

router.route('/:id')
  .get(optionalAuth, getProjectById)
  .put(protect, updateProject)
  .delete(protect, deleteProject);

export default router;
