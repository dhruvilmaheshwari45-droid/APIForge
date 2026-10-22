import express from 'express';
import {
  getCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
} from '../controllers/collectionController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(optionalAuth, getCollections)
  .post(optionalAuth, createCollection);

router.route('/:id')
  .get(optionalAuth, getCollectionById)
  .put(optionalAuth, updateCollection)
  .delete(optionalAuth, deleteCollection);

export default router;
