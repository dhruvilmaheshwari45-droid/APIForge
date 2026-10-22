import TestSuite from '../models/TestSuite.js';
import TestCase from '../models/TestCase.js';
import { runTestSuite } from '../services/testRunnerService.js';

// ==========================================
// TEST SUITES
// ==========================================

export const getSuites = async (req, res, next) => {
  try {
    const suites = await TestSuite.find().sort({ createdAt: -1 });
    const allCases = await TestCase.find({}, 'suiteId');

    const mapped = suites.map((s) => {
      const obj = s.toJSON();
      const count = allCases.filter(
        (c) => c.suiteId === obj.id || c.suiteId === s.customId || c.suiteId === s._id.toString()
      ).length;
      return { ...obj, testCasesCount: count };
    });

    res.status(200).json({ success: true, count: mapped.length, data: mapped });
  } catch (err) {
    next(err);
  }
};

export const getSuiteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const suite = await TestSuite.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!suite) {
      return res.status(404).json({ success: false, message: 'Test Suite not found' });
    }

    const sObj = suite.toJSON();
    const testCases = await TestCase.find({
      $or: [{ suiteId: sObj.id }, { suiteId: id }, { suiteId: suite._id.toString() }],
    }).sort({ order: 1 });

    res.status(200).json({ success: true, data: { ...sObj, testCases } });
  } catch (err) {
    next(err);
  }
};

export const createSuite = async (req, res, next) => {
  try {
    const { name, description, environmentId, schedule } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Suite name is required' });
    }

    const customId = `suite_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const suite = await TestSuite.create({
      customId,
      name: name.trim(),
      description: description || '',
      environmentId: environmentId || 'env-dev',
      schedule: schedule || 'Manual',
      lastStatus: 'untested',
    });

    res.status(201).json({ success: true, data: suite });
  } catch (err) {
    next(err);
  }
};

export const updateSuite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const suite = await TestSuite.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!suite) {
      return res.status(404).json({ success: false, message: 'Test Suite not found' });
    }

    Object.assign(suite, req.body);
    await suite.save();

    res.status(200).json({ success: true, data: suite });
  } catch (err) {
    next(err);
  }
};

export const duplicateSuite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const source = await TestSuite.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!source) {
      return res.status(404).json({ success: false, message: 'Suite not found' });
    }

    const sId = source.customId || source._id.toString();
    const newCustomId = `suite_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    const cloned = await TestSuite.create({
      customId: newCustomId,
      name: `${source.name} (Copy)`,
      description: source.description,
      environmentId: source.environmentId,
      schedule: source.schedule,
      lastStatus: 'untested',
    });

    // Clone test cases
    const cases = await TestCase.find({ suiteId: sId });
    for (const c of cases) {
      await TestCase.create({
        customId: `tc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
        suiteId: newCustomId,
        name: c.name,
        description: c.description,
        method: c.method,
        url: c.url,
        headers: c.headers,
        params: c.params,
        auth: c.auth,
        bodyType: c.bodyType,
        jsonBody: c.jsonBody,
        assertions: c.assertions,
        order: c.order,
        enabled: c.enabled,
      });
    }

    res.status(201).json({ success: true, data: cloned });
  } catch (err) {
    next(err);
  }
};

export const deleteSuite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const suite = await TestSuite.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!suite) {
      return res.status(404).json({ success: false, message: 'Test Suite not found' });
    }

    const sId = suite.customId || suite._id.toString();
    await TestCase.deleteMany({ suiteId: sId });
    await suite.deleteOne();

    res.status(200).json({ success: true, message: 'Test Suite and associated test cases deleted' });
  } catch (err) {
    next(err);
  }
};

export const executeSuiteRun = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { environmentName = 'Development' } = req.body;
    const runResult = await runTestSuite(id, environmentName);

    res.status(200).json({ success: true, data: runResult });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// TEST CASES
// ==========================================

export const getTestCases = async (req, res, next) => {
  try {
    const { suiteId } = req.query;
    const filter = suiteId ? { suiteId } : {};
    const cases = await TestCase.find(filter).sort({ order: 1 });

    res.status(200).json({ success: true, count: cases.length, data: cases });
  } catch (err) {
    next(err);
  }
};

export const createTestCase = async (req, res, next) => {
  try {
    const { suiteId, name, method, url, headers, params, auth, bodyType, jsonBody, assertions, order } = req.body;

    if (!suiteId || !name || !url) {
      return res.status(400).json({ success: false, message: 'suiteId, name, and url are required' });
    }

    const customId = `tc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const testCase = await TestCase.create({
      customId,
      suiteId,
      name: name.trim(),
      method: method || 'GET',
      url: url.trim(),
      headers: headers || [],
      params: params || [],
      auth: auth || { type: 'noauth' },
      bodyType: bodyType || 'none',
      jsonBody: jsonBody || '',
      assertions: assertions || [],
      order: order || 0,
      enabled: true,
    });

    res.status(201).json({ success: true, data: testCase });
  } catch (err) {
    next(err);
  }
};

export const updateTestCase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const testCase = await TestCase.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!testCase) {
      return res.status(404).json({ success: false, message: 'Test Case not found' });
    }

    Object.assign(testCase, req.body);
    await testCase.save();

    res.status(200).json({ success: true, data: testCase });
  } catch (err) {
    next(err);
  }
};

export const deleteTestCase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const testCase = await TestCase.findOne({
      $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!testCase) {
      return res.status(404).json({ success: false, message: 'Test Case not found' });
    }

    await testCase.deleteOne();
    res.status(200).json({ success: true, message: 'Test Case deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export default {
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
};
