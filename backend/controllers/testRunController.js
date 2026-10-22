import TestRun from '../models/TestRun.js';

// @desc    Get all test runs
// @route   GET /api/test-runs
// @access  Public
export const getTestRuns = async (req, res, next) => {
  try {
    const { suiteId, status } = req.query;
    const filter = {};
    if (suiteId) filter.suiteId = suiteId;
    if (status && status !== 'ALL') filter.status = status;

    const runs = await TestRun.find(filter).sort({ startedAt: -1 }).limit(100);
    res.status(200).json({ success: true, count: runs.length, data: runs });
  } catch (err) {
    next(err);
  }
};

// @desc    Get test run by ID
// @route   GET /api/test-runs/:id
// @access  Public
export const getTestRunById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const run = await TestRun.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!run) {
      return res.status(404).json({ success: false, message: 'Test Run not found' });
    }
    res.status(200).json({ success: true, data: run });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete single test run
// @route   DELETE /api/test-runs/:id
// @access  Public
export const deleteTestRun = async (req, res, next) => {
  try {
    const { id } = req.params;
    const run = await TestRun.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!run) {
      return res.status(404).json({ success: false, message: 'Test Run not found' });
    }

    await run.deleteOne();
    res.status(200).json({ success: true, message: 'Test run deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Clear all test runs
// @route   DELETE /api/test-runs
// @access  Public
export const clearTestRuns = async (req, res, next) => {
  try {
    const { suiteId } = req.query;
    const filter = suiteId ? { suiteId } : {};
    await TestRun.deleteMany(filter);

    res.status(200).json({ success: true, message: 'Test runs cleared successfully' });
  } catch (err) {
    next(err);
  }
};

export default {
  getTestRuns,
  getTestRunById,
  deleteTestRun,
  clearTestRuns,
};
