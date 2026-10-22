import express from 'express';
import {
  getSuites,
  getSuiteById,
  createSuite,
  updateSuite,
  duplicateSuite,
  deleteSuite,
  executeSuiteRun,
  getTestCases,
  createTestCase,
  updateTestCase,
  deleteTestCase,
} from '../controllers/testController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Suites Root & List
router.get('/', optionalAuth, getSuites);

router.route('/suites')
  .get(optionalAuth, getSuites)
  .post(optionalAuth, createSuite);

router.post('/suites/:id/run', optionalAuth, executeSuiteRun);
router.post('/suites/:id/duplicate', optionalAuth, duplicateSuite);

router.route('/suites/:id')
  .get(optionalAuth, getSuiteById)
  .put(optionalAuth, updateSuite)
  .delete(optionalAuth, deleteSuite);

// Cases
router.route('/cases')
  .get(optionalAuth, getTestCases)
  .post(optionalAuth, createTestCase);

router.route('/cases/:id')
  .put(optionalAuth, updateTestCase)
  .delete(optionalAuth, deleteTestCase);

export default router;
