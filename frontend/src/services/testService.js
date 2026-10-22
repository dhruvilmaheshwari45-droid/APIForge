/**
 * APIForge - Test Suite & Execution Service
 * 
 * Manages Test Suites, Test Cases, and Historical Test Runs.
 * Reuses requestService for HTTP calls and variableResolver for environment scoping.
 * Evaluates structured assertions safely without eval.
 */

import requestService from './requestService.js';
import { resolveRequestPayload } from '../utils/variableResolver.js';
import { evaluateAssertions } from '../utils/assertionEvaluator.js';
import environmentService from './environmentService.js';
import { apiClient } from './apiService.js';

const STORAGE_KEYS = {
  SUITES: 'apiforge_test_suites',
  CASES: 'apiforge_test_cases',
  RUNS: 'apiforge_test_runs',
};

export const DEFAULT_SUITES = [];
export const DEFAULT_TEST_CASES = [];
export const DEFAULT_RUNS = [];

export const testService = {
  // Sync state with backend MERN API
  async syncWithBackend() {
    try {
      const [suitesRes, casesRes, runsRes] = await Promise.all([
        apiClient.get('/tests/suites').catch(() => null),
        apiClient.get('/tests/cases').catch(() => null),
        apiClient.get('/test-runs').catch(() => null),
      ]);
      if (suitesRes?.data?.data && Array.isArray(suitesRes.data.data)) {
        const backendSuites = suitesRes.data.data.map((s) => ({
          ...s,
          id: s.customId || s.id || s._id,
        }));
        this.saveSuites(backendSuites);
      }
      if (casesRes?.data?.data && Array.isArray(casesRes.data.data)) {
        const backendCases = casesRes.data.data.map((c) => ({
          ...c,
          id: c.customId || c.id || c._id,
        }));
        this.saveAllTestCases(backendCases);
      }
      if (runsRes?.data?.data && Array.isArray(runsRes.data.data)) {
        const backendRuns = runsRes.data.data.map((r) => ({
          ...r,
          id: r.customId || r.id || r._id,
        }));
        this.saveRuns(backendRuns);
      }
    } catch (err) {
      console.warn('[testService] Sync with backend skipped/failed:', err?.message);
    }
  },

  // ==========================================
  // TEST SUITES CRUD
  // ==========================================

  getSuites() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUITES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading test suites, re-initializing defaults:', e);
    }
    this.saveSuites(DEFAULT_SUITES);
    return DEFAULT_SUITES;
  },

  saveSuites(suites) {
    try {
      localStorage.setItem(STORAGE_KEYS.SUITES, JSON.stringify(suites));
    } catch (e) {
      console.error('Failed to save test suites:', e);
    }
  },

  getSuiteById(id) {
    const list = this.getSuites();
    return list.find((s) => s.id === id) || null;
  },

  createSuite(data) {
    const list = this.getSuites();
    const now = new Date().toISOString();
    const newSuite = {
      id: `suite-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: data.name?.trim() || 'New Test Suite',
      description: data.description?.trim() || '',
      environmentId: data.environmentId || 'env-dev',
      schedule: data.schedule || 'Manual',
      createdAt: now,
      updatedAt: now,
      lastRunAt: null,
      lastStatus: 'untested',
      passRate: null,
    };
    list.unshift(newSuite);
    this.saveSuites(list);

    // Backend sync
    apiClient.post('/tests/suites', newSuite).catch(() => {});

    return newSuite;
  },

  updateSuite(id, updates) {
    const list = this.getSuites();
    const index = list.findIndex((s) => s.id === id);
    if (index === -1) throw new Error(`Test Suite "${id}" not found`);

    const current = list[index];
    const updated = {
      ...current,
      ...updates,
      name: updates.name !== undefined ? updates.name.trim() : current.name,
      description: updates.description !== undefined ? updates.description.trim() : current.description,
      updatedAt: new Date().toISOString(),
    };
    list[index] = updated;
    this.saveSuites(list);

    // Backend sync
    apiClient.put(`/tests/suites/${id}`, updates).catch(() => {});

    return updated;
  },

  deleteSuite(id) {
    let list = this.getSuites();
    const toDelete = list.find((s) => s.id === id);
    if (!toDelete) throw new Error(`Test Suite "${id}" not found`);

    list = list.filter((s) => s.id !== id);
    this.saveSuites(list);

    // Cascade delete test cases
    let allCases = this.getAllTestCases();
    allCases = allCases.filter((c) => c.suiteId !== id);
    this.saveAllTestCases(allCases);

    // Backend sync
    apiClient.delete(`/tests/suites/${id}`).catch(() => {});

    return toDelete;
  },

  duplicateSuite(id) {
    const source = this.getSuiteById(id);
    if (!source) throw new Error(`Suite "${id}" not found`);

    const cases = this.getTestCases(id);
    const now = new Date().toISOString();
    const newSuiteId = `suite-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const clonedSuite = {
      ...source,
      id: newSuiteId,
      name: `${source.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
      lastRunAt: null,
      lastStatus: 'untested',
      passRate: null,
    };

    const list = this.getSuites();
    list.unshift(clonedSuite);
    this.saveSuites(list);

    // Clone test cases
    const allCases = this.getAllTestCases();
    cases.forEach((c, idx) => {
      allCases.push({
        ...c,
        id: `tc-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        suiteId: newSuiteId,
        assertions: Array.isArray(c.assertions)
          ? c.assertions.map((a, aidx) => ({ ...a, id: `asrt-${Date.now()}-${aidx}` }))
          : [],
      });
    });
    this.saveAllTestCases(allCases);

    // Backend sync
    apiClient.post(`/tests/suites/${id}/duplicate`).catch(() => {});

    return clonedSuite;
  },

  // ==========================================
  // TEST CASES CRUD
  // ==========================================

  getAllTestCases() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CASES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading test cases, re-initializing:', e);
    }
    this.saveAllTestCases(DEFAULT_TEST_CASES);
    return DEFAULT_TEST_CASES;
  },

  saveAllTestCases(cases) {
    try {
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
    } catch (e) {
      console.error('Failed to save test cases:', e);
    }
  },

  getTestCases(suiteId) {
    const all = this.getAllTestCases();
    return all
      .filter((c) => c.suiteId === suiteId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  getTestCaseById(id) {
    const all = this.getAllTestCases();
    return all.find((c) => c.id === id) || null;
  },

  createTestCase(data) {
    const all = this.getAllTestCases();
    const suiteCases = all.filter((c) => c.suiteId === data.suiteId);
    const newCase = {
      id: `tc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      suiteId: data.suiteId,
      name: data.name?.trim() || 'New Test Case',
      description: data.description?.trim() || '',
      method: data.method?.toUpperCase() || 'GET',
      url: data.url?.trim() || '{{BASE_URL}}/posts',
      headers: Array.isArray(data.headers) ? data.headers : [],
      params: Array.isArray(data.params) ? data.params : [],
      auth: data.auth || { type: 'noauth' },
      bodyType: data.bodyType || 'none',
      jsonBody: data.jsonBody || '',
      rawBody: data.rawBody || '',
      formData: data.formData || [],
      enabled: data.enabled !== undefined ? Boolean(data.enabled) : true,
      order: suiteCases.length + 1,
      assertions: Array.isArray(data.assertions)
        ? data.assertions.map((a, i) => ({
            id: a.id || `asrt-${Date.now()}-${i}`,
            type: a.type || 'status_code_equals',
            target: a.target || '',
            value: a.value !== undefined ? String(a.value) : '',
            description: a.description || '',
            enabled: a.enabled !== undefined ? Boolean(a.enabled) : true,
          }))
        : [
            {
              id: `asrt-${Date.now()}-0`,
              type: 'status_code_equals',
              target: '',
              value: '200',
              description: 'Status code equals 200 OK',
              enabled: true,
            },
          ],
    };

    all.push(newCase);
    this.saveAllTestCases(all);

    // Backend sync
    apiClient.post('/tests/cases', newCase).catch(() => {});

    return newCase;
  },

  updateTestCase(id, updates) {
    const all = this.getAllTestCases();
    const index = all.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Test Case "${id}" not found`);

    const current = all[index];
    const updated = {
      ...current,
      ...updates,
      name: updates.name !== undefined ? updates.name.trim() : current.name,
      url: updates.url !== undefined ? updates.url.trim() : current.url,
      method: updates.method !== undefined ? updates.method.toUpperCase() : current.method,
    };

    all[index] = updated;
    this.saveAllTestCases(all);

    // Backend sync
    apiClient.put(`/tests/cases/${id}`, updates).catch(() => {});

    return updated;
  },

  deleteTestCase(id) {
    let all = this.getAllTestCases();
    const toDelete = all.find((c) => c.id === id);
    if (!toDelete) throw new Error(`Test Case "${id}" not found`);

    all = all.filter((c) => c.id !== id);
    this.saveAllTestCases(all);

    // Backend sync
    apiClient.delete(`/tests/cases/${id}`).catch(() => {});

    return toDelete;
  },

  reorderTestCases(suiteId, orderedIds) {
    const all = this.getAllTestCases();
    const suiteCases = all.filter((c) => c.suiteId === suiteId);
    const otherCases = all.filter((c) => c.suiteId !== suiteId);

    const reorderedSuiteCases = [];
    orderedIds.forEach((id, index) => {
      const found = suiteCases.find((c) => c.id === id);
      if (found) {
        reorderedSuiteCases.push({ ...found, order: index + 1 });
      }
    });

    this.saveAllTestCases([...otherCases, ...reorderedSuiteCases]);
  },

  toggleTestCaseEnabled(id) {
    const all = this.getAllTestCases();
    const found = all.find((c) => c.id === id);
    if (!found) throw new Error(`Test Case "${id}" not found`);

    found.enabled = !found.enabled;
    this.saveAllTestCases(all);

    // Backend sync
    apiClient.put(`/tests/cases/${id}`, { enabled: found.enabled }).catch(() => {});

    return found;
  },

  // ==========================================
  // TEST RUNS & EXECUTION
  // ==========================================

  getRuns(suiteId = null) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RUNS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return suiteId ? parsed.filter((r) => r.suiteId === suiteId) : parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading test runs:', e);
    }
    if (!suiteId) {
      this.saveRuns(DEFAULT_RUNS);
      return DEFAULT_RUNS;
    }
    return [];
  },

  saveRuns(runs) {
    try {
      localStorage.setItem(STORAGE_KEYS.RUNS, JSON.stringify(runs));
    } catch (e) {
      console.error('Failed to save test runs:', e);
    }
  },

  getRunById(id) {
    const runs = this.getRuns();
    return runs.find((r) => r.id === id) || null;
  },

  deleteRun(id) {
    let runs = this.getRuns();
    runs = runs.filter((r) => r.id !== id);
    this.saveRuns(runs);

    // Backend sync
    apiClient.delete(`/test-runs/${id}`).catch(() => {});
  },

  clearRuns() {
    this.saveRuns([]);

    // Backend sync
    apiClient.delete('/test-runs').catch(() => {});
  },

  /**
   * Execute a single test case against the target environment
   */
  async executeTestCase(testCase, environment = null) {
    const env = environment || environmentService.getActiveEnvironment();
    const startTime = performance.now();

    // 1. Resolve variables in request payload
    const { resolvedRequest, unresolvedVariables, hasUnresolved } = resolveRequestPayload(
      {
        url: testCase.url,
        method: testCase.method,
        headers: testCase.headers || [],
        params: testCase.params || [],
        auth: testCase.auth || { type: 'noauth' },
        bodyType: testCase.bodyType || 'none',
        jsonBody: testCase.jsonBody || '',
        rawBody: testCase.rawBody || '',
        formData: testCase.formData || [],
        timeout: 10000,
      },
      env
    );

    if (hasUnresolved) {
      return {
        testCaseId: testCase.id,
        name: testCase.name,
        method: testCase.method,
        url: testCase.url,
        resolvedUrl: resolvedRequest.url,
        status: 'failed',
        responseStatus: 0,
        responseTimeMs: 0,
        assertionsCount: testCase.assertions?.length || 0,
        passedAssertions: 0,
        failedAssertions: testCase.assertions?.length || 0,
        assertionResults: [
          {
            id: 'unresolved-var-err',
            type: 'variable_resolution',
            expected: 'All variables defined',
            actual: `Unresolved: ${unresolvedVariables.join(', ')}`,
            passed: false,
            message: `Missing variable(s): ${unresolvedVariables.map((v) => `{{${v}}}`).join(', ')} in environment "${env?.name || 'Default'}"`,
            description: 'Environment Variable Resolution',
          },
        ],
        error: `Missing environment variable(s): ${unresolvedVariables.join(', ')}`,
      };
    }

    try {
      // 2. Dispatch HTTP request
      const httpResponse = await requestService.sendRequest(resolvedRequest);
      const durationMs = Math.round(performance.now() - startTime);

      // 3. Evaluate assertions
      const assertions = testCase.assertions || [];
      const evaluation = evaluateAssertions(assertions, httpResponse);

      const overallStatus = evaluation.passed ? 'passed' : 'failed';

      return {
        testCaseId: testCase.id,
        name: testCase.name,
        method: testCase.method,
        url: testCase.url,
        resolvedUrl: resolvedRequest.url,
        status: overallStatus,
        responseStatus: httpResponse.status || 0,
        statusText: httpResponse.statusText || '',
        responseTimeMs: httpResponse.responseTimeMs || durationMs,
        assertionsCount: evaluation.totalCount,
        passedAssertions: evaluation.passedCount,
        failedAssertions: evaluation.failedCount,
        assertionResults: evaluation.results,
        isNetworkError: httpResponse.isNetworkError,
        isTimeout: httpResponse.isTimeout,
        error: httpResponse.isNetworkError
          ? 'Network / CORS Error: Destination server unreachable or blocked by CORS policy'
          : httpResponse.isTimeout
          ? 'Timeout: Request exceeded configured timeout threshold'
          : null,
      };
    } catch (err) {
      const durationMs = Math.round(performance.now() - startTime);
      return {
        testCaseId: testCase.id,
        name: testCase.name,
        method: testCase.method,
        url: testCase.url,
        resolvedUrl: resolvedRequest.url,
        status: 'failed',
        responseStatus: 0,
        responseTimeMs: durationMs,
        assertionsCount: testCase.assertions?.length || 0,
        passedAssertions: 0,
        failedAssertions: testCase.assertions?.length || 1,
        assertionResults: [
          {
            id: 'err-eval',
            type: 'runtime_error',
            expected: 'Successful request',
            actual: err.message,
            passed: false,
            message: `Execution failed: ${err.message}`,
            description: 'Runtime Request Dispatch',
          },
        ],
        error: err.message,
      };
    }
  },

  /**
   * Execute an entire test suite sequentially with live progress callbacks
   */
  async executeSuite(suiteId, { environment = null, onProgress = null, abortSignal = null } = {}) {
    const suite = this.getSuiteById(suiteId);
    if (!suite) throw new Error(`Suite "${suiteId}" not found`);

    const cases = this.getTestCases(suiteId);
    const env = environment || environmentService.getEnvironmentById(suite.environmentId) || environmentService.getActiveEnvironment();

    const enabledCases = cases.filter((c) => c.enabled !== false);
    const suiteStartTime = performance.now();
    const results = [];

    let passedCount = 0;
    let failedCount = 0;
    const skippedCount = cases.length - enabledCases.length;

    for (let i = 0; i < enabledCases.length; i++) {
      if (abortSignal?.aborted) {
        break;
      }

      const tc = enabledCases[i];
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: enabledCases.length,
          testCase: tc,
          phase: 'running',
        });
      }

      const caseResult = await this.executeTestCase(tc, env);
      results.push(caseResult);

      if (caseResult.status === 'passed') {
        passedCount++;
      } else {
        failedCount++;
      }

      if (onProgress) {
        onProgress({
          current: i + 1,
          total: enabledCases.length,
          testCase: tc,
          result: caseResult,
          phase: 'completed_case',
        });
      }
    }

    const suiteTotalDuration = Math.round(performance.now() - suiteStartTime);
    const totalExecuted = results.length;
    const successRate = totalExecuted > 0 ? Math.round((passedCount / totalExecuted) * 100) : 0;
    const suiteStatus = failedCount === 0 && totalExecuted > 0 ? 'passed' : 'failed';

    const runRecord = {
      id: `run-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      suiteId: suite.id,
      suiteName: suite.name,
      executedAt: new Date().toISOString(),
      status: suiteStatus,
      totalTests: totalExecuted,
      passedCount,
      failedCount,
      skippedCount,
      durationMs: suiteTotalDuration,
      successRate,
      environmentName: env?.name || 'Default',
      trigger: 'Manual Suite Execution',
      details: results,
    };

    // Save run record to runs history
    const allRuns = this.getRuns();
    allRuns.unshift(runRecord);
    this.saveRuns(allRuns);

    // Update test suite metadata
    this.updateSuite(suite.id, {
      lastRunAt: runRecord.executedAt,
      lastStatus: suiteStatus,
      passRate: successRate,
      lastDurationMs: suiteTotalDuration,
    });

    // Backend sync suite run
    apiClient.post(`/tests/suites/${suite.id}/run`, {
      environmentName: env?.name || 'Default',
    }).catch(() => {});

    return runRecord;
  },

  /**
   * Reset test suites, cases, and runs to predefined factory defaults
   */
  resetToDefaults() {
    this.saveSuites(DEFAULT_SUITES);
    this.saveAllTestCases(DEFAULT_TEST_CASES);
    this.saveRuns(DEFAULT_RUNS);
    return {
      suites: DEFAULT_SUITES,
      cases: DEFAULT_TEST_CASES,
      runs: DEFAULT_RUNS,
    };
  },
};

// Initial background synchronization
if (typeof window !== 'undefined') {
  setTimeout(() => testService.syncWithBackend(), 200);
}

export default testService;
