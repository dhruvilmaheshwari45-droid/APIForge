// Centralized Telemetry Data for APIForge Dashboard
// Clean initial state with zero mock records.

export const DASHBOARD_METRICS = {
  totalApis: {
    value: 0,
    label: 'Total Endpoints',
    change: '0',
    comparisonLabel: 'endpoints',
    trend: 'neutral',
    description: 'Active endpoints across collections',
  },
  activeMockServers: {
    value: 0,
    label: 'Active Mock Servers',
    change: '0',
    comparisonLabel: 'instances',
    trend: 'neutral',
    description: 'Active mock server instances',
  },
  totalRequests: {
    value: '0',
    label: 'Total Requests',
    change: '0',
    comparisonLabel: 'requests',
    trend: 'neutral',
    description: 'Total throughput recorded',
  },
  failedRequests: {
    value: '0',
    label: 'Failed Requests',
    change: '0',
    comparisonLabel: '0.00% failure rate',
    trend: 'neutral',
    description: 'HTTP 4xx & 5xx error responses',
  },
  avgResponseTime: {
    value: '0ms',
    label: 'Average Response Time',
    change: '0ms',
    comparisonLabel: 'P95 latency: 0ms',
    trend: 'neutral',
    description: 'Average network round-trip duration',
  },
  testSuccessRate: {
    value: '0%',
    label: 'Test Success Rate',
    change: '0%',
    comparisonLabel: '0 passed / 0 failed',
    trend: 'neutral',
    description: 'Passing assertion contracts in active suites',
  },
};

// Traffic and response time datasets by time range
export const TIME_RANGE_CHARTS = {
  '24h': {
    traffic: [],
    latency: [],
  },
  '7d': {
    traffic: [],
    latency: [],
  },
  '30d': {
    traffic: [],
    latency: [],
  },
};

// HTTP status code breakdown
export const STATUS_CODE_DISTRIBUTION = [];

// Test pass/fail statistics by test suite
export const TEST_PASS_FAIL_STATS = [];

// Recent API requests stream
export const RECENT_API_REQUESTS = [];

export const MOCK_SERVERS_SUMMARY = [];

export const RECENT_TEST_RUNS_SUMMARY = [];
