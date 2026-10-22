import axios from 'axios';
import TestSuite from '../models/TestSuite.js';
import TestCase from '../models/TestCase.js';
import TestRun from '../models/TestRun.js';
import Environment from '../models/Environment.js';

// Safe property extraction by dot/bracket path
const getNestedValue = (obj, path) => {
  if (!obj || !path) return undefined;
  const cleanPath = path.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');
  const parts = cleanPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
};

export const runTestSuite = async (suiteId, environmentName = 'Development') => {
  const suite = await TestSuite.findOne({
    $or: [{ customId: suiteId }, { _id: suiteId.match(/^[0-9a-fA-F]{24}$/) ? suiteId : null }],
  });

  if (!suite) {
    throw new Error(`Test Suite "${suiteId}" not found`);
  }

  const sId = suite.customId || suite._id.toString();
  const cases = await TestCase.find({ suiteId: sId, enabled: true }).sort({ order: 1 });

  const startTime = Date.now();
  const details = [];
  let passedCases = 0;
  let failedCases = 0;

  for (const tc of cases) {
    const caseStartTime = Date.now();
    let responseStatus = 0;
    let responseBody = null;
    let responseHeaders = {};
    let durationMs = 0;
    let executionError = null;

    try {
      const headers = {};
      (tc.headers || []).filter((h) => h.enabled && h.key).forEach((h) => {
        headers[h.key] = h.value;
      });

      const params = {};
      (tc.params || []).filter((p) => p.enabled && p.key).forEach((p) => {
        params[p.key] = p.value;
      });

      let reqData = null;
      if (tc.bodyType === 'json' && tc.jsonBody) {
        try {
          reqData = JSON.parse(tc.jsonBody);
        } catch {
          reqData = tc.jsonBody;
        }
      }

      const res = await axios({
        url: tc.url,
        method: tc.method || 'GET',
        headers,
        params,
        data: reqData,
        timeout: 5000,
        validateStatus: () => true,
      });

      durationMs = Date.now() - caseStartTime;
      responseStatus = res.status;
      responseBody = res.data;
      responseHeaders = res.headers;
    } catch (err) {
      durationMs = Date.now() - caseStartTime;
      executionError = err.message;
    }

    // Evaluate Assertions
    const assertionResults = [];
    let passedAssertions = 0;
    let failedAssertions = 0;

    for (const asrt of (tc.assertions || []).filter((a) => a.enabled)) {
      let passed = false;
      let actual = null;
      let message = '';

      switch (asrt.type) {
        case 'status_code_equals':
          actual = responseStatus;
          passed = responseStatus === parseInt(asrt.value, 10);
          message = passed
            ? `Status code is ${responseStatus} as expected`
            : `Expected status ${asrt.value}, got ${responseStatus}`;
          break;

        case 'response_time_below':
          actual = durationMs;
          passed = durationMs <= parseInt(asrt.value, 10);
          message = passed
            ? `Response latency ${durationMs}ms is within ${asrt.value}ms SLA`
            : `Response latency ${durationMs}ms exceeded threshold of ${asrt.value}ms`;
          break;

        case 'response_contains_text':
          const strBody = typeof responseBody === 'object' ? JSON.stringify(responseBody) : String(responseBody || '');
          actual = strBody.substring(0, 100);
          passed = strBody.toLowerCase().includes((asrt.value || '').toLowerCase());
          message = passed
            ? `Response contains text "${asrt.value}"`
            : `Response did not contain expected text "${asrt.value}"`;
          break;

        case 'json_field_exists':
          actual = getNestedValue(responseBody, asrt.target);
          passed = actual !== undefined;
          message = passed
            ? `Field "${asrt.target}" exists in JSON response`
            : `Field "${asrt.target}" does not exist in response`;
          break;

        case 'json_field_equals':
          actual = getNestedValue(responseBody, asrt.target);
          passed = String(actual) === String(asrt.value);
          message = passed
            ? `Field "${asrt.target}" equals "${asrt.value}"`
            : `Expected field "${asrt.target}" to be "${asrt.value}", got "${actual}"`;
          break;

        case 'response_header_exists':
          const headerKey = (asrt.target || '').toLowerCase();
          actual = responseHeaders[headerKey];
          passed = actual !== undefined;
          message = passed
            ? `Header "${asrt.target}" is present in response`
            : `Header "${asrt.target}" missing from response`;
          break;

        default:
          passed = true;
          message = 'Assertion evaluated';
      }

      if (passed) passedAssertions++;
      else failedAssertions++;

      assertionResults.push({
        id: asrt.id || `asrt_${Date.now()}`,
        type: asrt.type,
        target: asrt.target,
        expected: asrt.value,
        actual,
        passed,
        message,
        description: asrt.description || message,
      });
    }

    const caseStatus = failedAssertions === 0 && !executionError ? 'passed' : 'failed';
    if (caseStatus === 'passed') passedCases++;
    else failedCases++;

    details.push({
      testCaseId: tc.customId || tc._id.toString(),
      name: tc.name,
      method: tc.method,
      url: tc.url,
      status: caseStatus,
      responseStatus,
      durationMs,
      assertionsCount: assertionResults.length,
      passedAssertions,
      failedAssertions,
      assertionResults,
      error: executionError,
    });
  }

  const totalDurationMs = Date.now() - startTime;
  const totalCount = cases.length;
  const overallStatus = failedCases === 0 && totalCount > 0 ? 'passed' : totalCount === 0 ? 'passed' : 'failed';
  const successRate = totalCount > 0 ? Math.round((passedCases / totalCount) * 100) : 100;

  // Persist TestRun
  const customId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const run = await TestRun.create({
    customId,
    suiteId: sId,
    suiteName: suite.name,
    startedAt: new Date(startTime),
    durationMs: totalDurationMs,
    status: overallStatus,
    totalCount,
    passedCount: passedCases,
    failedCount: failedCases,
    skippedCount: 0,
    successRate,
    environmentName,
    trigger: 'Manual Run',
    details,
  });

  // Update suite statistics
  suite.lastRunAt = new Date();
  suite.lastStatus = overallStatus;
  suite.passRate = successRate;
  await suite.save();

  const runObj = run.toJSON ? run.toJSON() : { ...run };
  return {
    ...runObj,
    totalTests: totalCount,
    totalCount,
  };
};

export default {
  runTestSuite,
};
