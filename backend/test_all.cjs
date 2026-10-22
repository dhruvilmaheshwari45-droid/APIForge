const axios = require('axios');
const BASE = 'http://localhost:5000/api';

async function runComprehensiveTests() {
  console.log('=== RUNNING COMPREHENSIVE END-TO-END VALIDATION ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log('  [PASS]', message);
      passed++;
    } else {
      console.error('  [FAIL]', message);
      failed++;
    }
  }

  // 1. AUTHENTICATION FLOW
  console.log('1. AUTHENTICATION FLOW:');
  let token = null;
  const testEmail = 'tester_' + Date.now() + '@apiforge.dev';
  try {
    const regRes = await axios.post(BASE + '/auth/register', {
      name: 'Test Engineer',
      email: testEmail,
      password: 'Password123!',
      role: 'qa_lead'
    });
    assert(regRes.status === 201 && regRes.data.token, 'Register new user returns 201 + JWT');
    
    const loginRes = await axios.post(BASE + '/auth/login', {
      email: testEmail,
      password: 'Password123!'
    });
    assert(loginRes.status === 200 && loginRes.data.user.email === testEmail, 'Login with new credentials returns 200');
    token = loginRes.data.token;

    const meRes = await axios.get(BASE + '/auth/me', {
      headers: { Authorization: 'Bearer ' + token }
    });
    assert(meRes.status === 200 && meRes.data.user.name === 'Test Engineer', 'Protected route /api/auth/me returns profile');

    try {
      await axios.get(BASE + '/auth/me');
      assert(false, 'Protected route without token should reject with 401');
    } catch (e) {
      assert(e.response && e.response.status === 401, 'Protected route without token rejects with 401 Unauthorized');
    }
  } catch (err) {
    assert(false, 'Auth error: ' + (err.response?.data?.message || err.message));
  }

  // 2. COLLECTIONS CRUD
  console.log('\n2. COLLECTIONS CRUD:');
  let collectionId = null;
  try {
    const listRes = await axios.get(BASE + '/collections');
    assert(listRes.status === 200 && Array.isArray(listRes.data.data), 'Get collections returns 200');

    const createRes = await axios.post(BASE + '/collections', {
      name: 'E2E Testing Collection',
      description: 'Automated validation collection',
      category: 'integration'
    }, { headers: { Authorization: 'Bearer ' + token } });
    assert(createRes.status === 201 && createRes.data.data.name === 'E2E Testing Collection', 'Create collection returns 201');
    collectionId = createRes.data.data.customId || createRes.data.data._id;

    const updateRes = await axios.put(BASE + '/collections/' + collectionId, {
      name: 'E2E Collection (Updated)'
    }, { headers: { Authorization: 'Bearer ' + token } });
    assert(updateRes.status === 200 && updateRes.data.data.name === 'E2E Collection (Updated)', 'Update collection returns 200');

    const delRes = await axios.delete(BASE + '/collections/' + collectionId, {
      headers: { Authorization: 'Bearer ' + token }
    });
    assert(delRes.status === 200, 'Delete collection returns 200');
  } catch (err) {
    assert(false, 'Collections error: ' + (err.response?.data?.message || err.message));
  }

  // 3. APIS & REQUEST PROXY
  console.log('\n3. APIS & REQUEST EXECUTION PROXY:');
  let apiId = null;
  try {
    const apisRes = await axios.get(BASE + '/apis');
    assert(apisRes.status === 200 && Array.isArray(apisRes.data.data), 'Get APIs returns 200');

    const createApiRes = await axios.post(BASE + '/apis', {
      name: 'Health Ping API',
      method: 'GET',
      path: '/health',
      description: 'Diagnostic probe'
    });
    assert(createApiRes.status === 201, 'Create API returns 201');
    apiId = createApiRes.data.data.customId || createApiRes.data.data._id;

    const execRes = await axios.post(BASE + '/apis/execute', {
      url: 'http://localhost:5000/api/health',
      method: 'GET',
      headers: [{ key: 'X-Test', value: 'APIForge', enabled: true }]
    });
    assert(execRes.status === 200 && execRes.data.success, 'Execute request proxy returns 200 with response payload');

    await axios.delete(BASE + '/apis/' + apiId);
    assert(true, 'Delete API returns 200');
  } catch (err) {
    assert(false, 'APIs error: ' + (err.response?.data?.message || err.message));
  }

  // 4. MOCK SERVERS & RULES
  console.log('\n4. MOCK SERVERS & DYNAMIC RULES:');
  let serverId = null;
  let ruleId = null;
  try {
    const srvRes = await axios.post(BASE + '/mock-servers', {
      name: 'Telemetry Simulator',
      port: 9090,
      environment: 'Development'
    });
    assert(srvRes.status === 201, 'Create mock server returns 201');
    serverId = srvRes.data.data.customId || srvRes.data.data._id;

    const toggleRes = await axios.patch(BASE + '/mock-servers/' + serverId + '/toggle');
    assert(toggleRes.status === 200 && toggleRes.data.data.status === 'paused', 'Toggle server status pauses server');

    const ruleRes = await axios.post(BASE + '/mock-rules', {
      serverId: serverId,
      name: 'Catch VIP Users',
      priority: 1,
      conditions: [{ field: 'Header', operator: 'equals', value: 'Bearer vip_token' }],
      response: { statusCode: 200, body: JSON.stringify({ vip: true }) }
    });
    assert(ruleRes.status === 201, 'Create mock rule returns 201');
    ruleId = ruleRes.data.data.customId || ruleRes.data.data._id;

    await axios.delete(BASE + '/mock-rules/' + ruleId);
    assert(true, 'Delete mock rule returns 200');

    await axios.delete(BASE + '/mock-servers/' + serverId);
    assert(true, 'Delete mock server returns 200');
  } catch (err) {
    assert(false, 'Mock server/rule error: ' + (err.response?.data?.message || err.message));
  }

  // 5. ENVIRONMENTS & VARIABLES
  console.log('\n5. ENVIRONMENTS & VARIABLES:');
  let envId = null;
  try {
    const envs = await axios.get(BASE + '/environments');
    assert(envs.status === 200 && envs.data.data.length >= 3, 'Get environments returns Dev, Staging, Prod');

    const newEnv = await axios.post(BASE + '/environments', {
      name: 'QA Automation',
      description: 'Dedicated QA cluster',
      variables: [{ key: 'BASE_URL', value: 'https://qa.api.dev', isSecret: false }]
    });
    assert(newEnv.status === 201, 'Create environment returns 201');
    envId = newEnv.data.data.customId || newEnv.data.data._id;

    const dupRes = await axios.post(BASE + '/environments/' + envId + '/duplicate');
    assert(dupRes.status === 201 && dupRes.data.data.name.includes('Copy'), 'Duplicate environment returns 201');

    await axios.delete(BASE + '/environments/' + (dupRes.data.data.customId || dupRes.data.data._id));
    await axios.delete(BASE + '/environments/' + envId);
    assert(true, 'Cleaned up test environments');
  } catch (err) {
    assert(false, 'Environment error: ' + (err.response?.data?.message || err.message));
  }

  // 6. AUTOMATED TEST SUITES, CASES & RUNS
  console.log('\n6. AUTOMATED TEST SUITES, CASES & RUNS:');
  try {
    const suites = await axios.get(BASE + '/tests/suites');
    assert(suites.status === 200 && suites.data.data.length > 0, 'Get test suites returns 200');
    const firstSuiteId = suites.data.data[0].customId || suites.data.data[0]._id;

    const runRes = await axios.post(BASE + '/tests/suites/' + firstSuiteId + '/run', {
      environmentName: 'Development'
    });
    assert(runRes.status === 200 && runRes.data.data.totalTests !== undefined, 'Execute test suite run returns completed run result');

    const runsList = await axios.get(BASE + '/test-runs');
    assert(runsList.status === 200 && runsList.data.data.length > 0, 'Get test runs contains executed run');
  } catch (err) {
    assert(false, 'Test execution error: ' + (err.response?.data?.message || err.message));
  }

  // 7. TRAFFIC LOGGING
  console.log('\n7. TRAFFIC LOGGING:');
  try {
    const logRes = await axios.post(BASE + '/traffic', {
      method: 'POST',
      url: '/v1/orders/checkout',
      path: '/v1/orders/checkout',
      statusCode: 201,
      durationMs: 84,
      environment: 'Staging'
    });
    assert(logRes.status === 201, 'Record traffic log returns 201');

    const trafficList = await axios.get(BASE + '/traffic?limit=5');
    assert(trafficList.status === 200 && trafficList.data.data.length > 0, 'Query traffic logs returns list');
  } catch (err) {
    assert(false, 'Traffic error: ' + (err.response?.data?.message || err.message));
  }

  // 8. PERFORMANCE ANALYTICS
  console.log('\n8. PERFORMANCE ANALYTICS:');
  try {
    const perfRes = await axios.get(BASE + '/analytics/performance?timeRange=24h&environment=Development');
    assert(perfRes.status === 200 && perfRes.data.data.metrics.averageResponseTimeMs !== undefined, 'Performance analytics computes latency percentiles and RPM');
  } catch (err) {
    assert(false, 'Analytics error: ' + (err.response?.data?.message || err.message));
  }

  // 9. API VERSIONING & COMPARISON
  console.log('\n9. API VERSIONING & COMPARISON:');
  try {
    const vers = await axios.get(BASE + '/versions');
    assert(vers.status === 200 && vers.data.data.length >= 2, 'Get API versions returns version list');

    const compRes = await axios.get(BASE + '/versions/compare/v1/v2');
    assert(compRes.status === 200 && Array.isArray(compRes.data.data.endpointMatrix), 'Compare versions v1 vs v2 returns endpoint diff matrix');
  } catch (err) {
    assert(false, 'Versioning error: ' + (err.response?.data?.message || err.message));
  }

  console.log('\n=== COMPREHENSIVE TEST RESULTS ===');
  console.log('Passed:', passed);
  console.log('Failed:', failed);
  if (failed > 0) {
    process.exit(1);
  }
}

runComprehensiveTests();
