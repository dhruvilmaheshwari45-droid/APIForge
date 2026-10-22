import express from 'express';
import {
  getAllAPIs,
  getAPIById,
  createAPI,
  updateAPI,
  deleteAPI,
  executeRequest,
} from '../controllers/apiController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/execute', executeRequest);

router.route('/')
  .get(optionalAuth, getAllAPIs)
  .post(optionalAuth, createAPI);

router.route('/:id')
  .get(optionalAuth, getAPIById)
  .put(optionalAuth, updateAPI)
  .delete(optionalAuth, deleteAPI);

export default router;
