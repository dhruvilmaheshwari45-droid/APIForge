/**
 * APIForge - Structured Assertion Evaluator
 * 
 * Safely evaluates response assertions without using `eval` or running arbitrary user code.
 * Supports status code, text search, JSON field comparison, latency thresholds, and header checks.
 */

/**
 * Supported assertion types and their display metadata
 */
export const ASSERTION_TYPES = {
  status_code_equals: {
    label: 'Status Code Equals',
    description: 'Verifies the HTTP response status code matches',
    targetRequired: false,
    valueRequired: true,
    valuePlaceholder: 'e.g. 200, 201, 404',
  },
  response_contains_text: {
    label: 'Response Body Contains Text',
    description: 'Verifies the response body text contains a substring',
    targetRequired: false,
    valueRequired: true,
    valuePlaceholder: 'e.g. "success": true',
  },
  json_field_equals: {
    label: 'JSON Field Equals',
    description: 'Verifies a specific JSON path matches an expected value',
    targetRequired: true,
    targetPlaceholder: 'e.g. data.id or user.name or items[0].status',
    valueRequired: true,
    valuePlaceholder: 'e.g. 42, "admin", true',
  },
  json_field_exists: {
    label: 'JSON Field Exists',
    description: 'Verifies a specific JSON path is present in the response',
    targetRequired: true,
    targetPlaceholder: 'e.g. token or data.items or user.email',
    valueRequired: false,
  },
  response_time_below: {
    label: 'Response Time Below (ms)',
    description: 'Verifies request completed faster than the given threshold',
    targetRequired: false,
    valueRequired: true,
    valuePlaceholder: 'e.g. 500 (in milliseconds)',
  },
  response_header_exists: {
    label: 'Response Header Exists',
    description: 'Verifies that a specified HTTP header is returned',
    targetRequired: true,
    targetPlaceholder: 'e.g. content-type or x-request-id',
    valueRequired: false,
  },
};

/**
 * Safe nested JSON path extraction (supports dot.path and array[0].index)
 * Avoids eval or Function constructor.
 * 
 * @param {any} obj - Object to traverse
 * @param {string} path - Path string (e.g., 'data.users[0].id')
 * @returns {any} Extracted value or undefined
 */
export const getNestedValue = (obj, path) => {
  if (!obj || typeof obj !== 'object' || !path || typeof path !== 'string') {
    return undefined;
  }

  // Tokenize path: 'data.users[0].id' -> ['data', 'users', '0', 'id']
  const cleanPath = path.trim().replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');
  const keys = cleanPath.split('.');

  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = current[key];
  }

  return current;
};

/**
 * Loosely parse expected value string for smart equality comparisons
 * Handles numbers, booleans, and null/string values
 */
const parseExpectedValue = (val) => {
  if (val === undefined || val === null) return val;
  const trimmed = String(val).trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (!isNaN(trimmed) && trimmed !== '') return Number(trimmed);
  // Remove wrapping quotes if user typed '"admin"'
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

/**
 * Evaluate a single assertion against an HTTP response
 * 
 * @param {object} assertion - Assertion definition { id, type, target, value, description }
 * @param {object} response - Standard response object { status, data, headers, responseTimeMs }
 * @returns {object} Evaluation result
 */
export const evaluateSingleAssertion = (assertion, response) => {
  const { id, type, target = '', value = '', description } = assertion;

  if (!response) {
    return {
      id,
      type,
      target,
      expected: value,
      actual: 'No response received',
      passed: false,
      message: 'Network request did not complete or response was empty',
      description: description || ASSERTION_TYPES[type]?.label || type,
    };
  }

  let passed = false;
  let actual = null;
  let message = '';
  const parsedExpected = parseExpectedValue(value);

  switch (type) {
    case 'status_code_equals': {
      actual = response.status || 0;
      const expectedStatus = Number(value);
      passed = actual === expectedStatus;
      message = passed
        ? `Status code is ${actual} as expected`
        : `Expected status ${expectedStatus}, but got ${actual}`;
      break;
    }

    case 'response_contains_text': {
      let bodyText = '';
      if (typeof response.data === 'string') {
        bodyText = response.data;
      } else if (response.data !== undefined && response.data !== null) {
        bodyText = JSON.stringify(response.data);
      }
      actual = bodyText.length > 60 ? `${bodyText.substring(0, 60)}...` : bodyText;
      const needle = String(value || '');
      passed = bodyText.includes(needle);
      message = passed
        ? `Response contains text "${needle}"`
        : `Response does not contain "${needle}"`;
      break;
    }

    case 'json_field_equals': {
      const rawActual = getNestedValue(response.data, target);
      actual = rawActual;
      // Compare parsed values
      if (typeof rawActual === 'number' || typeof rawActual === 'boolean' || rawActual === null) {
        passed = rawActual === parsedExpected;
      } else {
        passed = String(rawActual) === String(parsedExpected);
      }
      message = passed
        ? `Field "${target}" equals ${JSON.stringify(actual)}`
        : `Expected field "${target}" to equal ${JSON.stringify(parsedExpected)}, but got ${JSON.stringify(actual)}`;
      break;
    }

    case 'json_field_exists': {
      actual = getNestedValue(response.data, target);
      passed = actual !== undefined;
      message = passed
        ? `Field "${target}" exists in JSON response`
        : `Field "${target}" does not exist in JSON response`;
      break;
    }

    case 'response_time_below': {
      actual = response.responseTimeMs || 0;
      const maxMs = Number(value) || 0;
      passed = actual <= maxMs;
      message = passed
        ? `Response latency ${actual}ms is below threshold of ${maxMs}ms`
        : `Expected response time under ${maxMs}ms, but took ${actual}ms`;
      break;
    }

    case 'response_header_exists': {
      const headers = response.headers || {};
      const targetHeader = (target || '').toLowerCase().trim();
      // Case-insensitive header key lookup
      const foundHeaderKey = Object.keys(headers).find(
        (h) => h.toLowerCase() === targetHeader
      );
      passed = Boolean(foundHeaderKey);
      actual = foundHeaderKey ? headers[foundHeaderKey] : undefined;
      message = passed
        ? `Header "${target}" exists (value: ${actual})`
        : `Header "${target}" was not found in response headers`;
      break;
    }

    default: {
      passed = false;
      actual = 'Unknown assertion type';
      message = `Unrecognized assertion type: ${type}`;
      break;
    }
  }

  return {
    id,
    type,
    target,
    expected: value,
    actual: actual !== undefined ? actual : 'undefined',
    passed,
    message,
    description: description || ASSERTION_TYPES[type]?.label || type,
  };
};

/**
 * Evaluate all enabled assertions for a test case response
 * 
 * @param {Array} assertions - Array of assertion definitions
 * @param {object} response - Executed HTTP response
 * @returns {object} Summary result { passed: boolean, total, passedCount, failedCount, results: [] }
 */
export const evaluateAssertions = (assertions = [], response) => {
  const activeAssertions = assertions.filter((a) => a.enabled !== false);
  if (activeAssertions.length === 0) {
    // If no assertions configured, consider passed if status < 400
    const autoPassed = Boolean(response && response.status && response.status < 400);
    return {
      passed: autoPassed,
      totalCount: 0,
      passedCount: 0,
      failedCount: 0,
      results: [],
      autoSummary: autoPassed ? 'Implicit HTTP success (< 400)' : 'HTTP failure',
    };
  }

  const results = activeAssertions.map((a) => evaluateSingleAssertion(a, response));
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;
  const allPassed = failedCount === 0;

  return {
    passed: allPassed,
    totalCount: results.length,
    passedCount,
    failedCount,
    results,
  };
};

export default {
  ASSERTION_TYPES,
  getNestedValue,
  evaluateSingleAssertion,
  evaluateAssertions,
};
