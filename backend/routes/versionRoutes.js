import express from 'express';
import {
  getAllVersions,
  getVersionById,
  createVersion,
  updateVersion,
  deleteVersion,
  compareVersions,
} from '../controllers/versionController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/compare/:v1/:v2', compareVersions);

router.route('/')
  .get(optionalAuth, getAllVersions)
  .post(optionalAuth, createVersion);

router.route('/:id')
  .get(optionalAuth, getVersionById)
  .put(optionalAuth, updateVersion)
  .delete(optionalAuth, deleteVersion);

export default router;
