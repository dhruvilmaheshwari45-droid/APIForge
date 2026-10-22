import { SAMPLE_TRAFFIC_LOGS } from './mockTraffic';

export const mockTrafficLogs = SAMPLE_TRAFFIC_LOGS;

export const mockPerformanceMetrics = {
  averageResponseTimeMs: 0,
  p95ResponseTimeMs: 0,
  p99ResponseTimeMs: 0,
  throughputRpm: 0,
  errorRatePercent: 0,
  availabilityPercent: 100,
  chartData: [],
  statusCodeDistribution: [],
};

export default {
  mockTrafficLogs,
  mockPerformanceMetrics,
};
