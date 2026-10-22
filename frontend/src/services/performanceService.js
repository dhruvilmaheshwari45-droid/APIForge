/**
 * APIForge - Performance Analytics Service
 * 
 * Computes dynamic latency percentiles, throughput rates, error curves,
 * and endpoint benchmarks based on multi-dimensional filters.
 */

import {
  PERFORMANCE_ENDPOINTS,
  TIME_SERIES_DATA,
  STATUS_CODE_BENCHMARKS,
  ENVIRONMENT_PROFILES,
} from '../data/mockPerformance.js';
import { apiClient } from './apiService.js';

export const performanceService = {
  /**
   * Fetch live performance analytics from backend MERN API
   */
  async fetchFromBackend(filters = {}) {
    try {
      const res = await apiClient.get('/analytics/performance', { params: filters });
      if (res?.data?.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('[performanceService] Backend analytics fetch error:', err?.message);
    }
    return this.getPerformanceData(filters);
  },

  /**
   * Get available filter options for the Performance UI
   */
  getFilterOptions() {
    return {
      environments: ['ALL', 'Production', 'Staging', 'Development'],
      endpoints: ['ALL', ...PERFORMANCE_ENDPOINTS.map((e) => e.endpoint)],
      methods: ['ALL', 'GET', 'POST', 'PUT', 'DELETE'],
      timeRanges: [
        { value: '1h', label: 'Last 1 Hour' },
        { value: '24h', label: 'Last 24 Hours' },
        { value: '7d', label: 'Last 7 Days' },
        { value: '30d', label: 'Last 30 Days' },
      ],
    };
  },

  /**
   * Compute aggregated metrics and chart datasets based on selected filters
   */
  getPerformanceData({
    environment = 'ALL',
    endpoint = 'ALL',
    method = 'ALL',
    timeRange = '24h',
  } = {}) {
    // 1. Determine Environment Factor
    let envMultiplier = 1.0;
    let envRpmMultiplier = 1.0;
    let envErrorMultiplier = 1.0;

    if (environment !== 'ALL' && ENVIRONMENT_PROFILES[environment]) {
      const profile = ENVIRONMENT_PROFILES[environment];
      envMultiplier = profile.latencyMultiplier;
      envRpmMultiplier = profile.rpmMultiplier;
      envErrorMultiplier = profile.errorMultiplier;
    }

    // 2. Filter Endpoint Benchmark List
    let filteredEndpoints = [...PERFORMANCE_ENDPOINTS];

    if (endpoint !== 'ALL') {
      filteredEndpoints = filteredEndpoints.filter((e) => e.endpoint === endpoint);
    }

    if (method !== 'ALL') {
      filteredEndpoints = filteredEndpoints.filter((e) => e.method === method);
    }

    // Apply environment multiplier to endpoints
    const endpointPerformance = filteredEndpoints.map((e) => {
      const adjustedAvg = Math.round(e.avgLatencyMs * envMultiplier);
      const adjustedP95 = Math.round(e.p95Ms * envMultiplier);
      const adjustedP99 = Math.round(e.p99Ms * envMultiplier);
      const adjustedRpm = Math.max(1, Math.round(e.rpm * envRpmMultiplier));
      const adjustedRequests = Math.max(10, Math.round(e.requests * envRpmMultiplier));
      const adjustedErrorRate = Number((e.errorRate * envErrorMultiplier).toFixed(1));

      let health = 'optimal';
      if (adjustedAvg > 400 || adjustedErrorRate > 4.5) {
        health = 'degraded';
      } else if (adjustedAvg > 200 || adjustedErrorRate > 2.5) {
        health = 'moderate';
      }

      return {
        ...e,
        avgLatencyMs: adjustedAvg,
        p95Ms: adjustedP95,
        p99Ms: adjustedP99,
        rpm: adjustedRpm,
        requests: adjustedRequests,
        errorRate: adjustedErrorRate,
        health,
      };
    });

    // 3. Time Series Data for selected window
    const baseTimeSeries = TIME_SERIES_DATA[timeRange] || TIME_SERIES_DATA['24h'];

    // If a specific endpoint is selected, adjust time series to match its latency profile
    let endpointLatencyRatio = 1.0;
    let endpointErrorRatio = 1.0;

    if (endpoint !== 'ALL') {
      const match = PERFORMANCE_ENDPOINTS.find((e) => e.endpoint === endpoint);
      if (match) {
        // Average benchmark across all endpoints is ~270ms
        endpointLatencyRatio = match.avgLatencyMs / 270;
        endpointErrorRatio = match.errorRate / 2.7;
      }
    }

    const timeSeries = baseTimeSeries.map((point) => {
      const calculatedAvg = Math.round(point.avgMs * envMultiplier * endpointLatencyRatio);
      const calculatedP95 = Math.round(point.p95Ms * envMultiplier * endpointLatencyRatio);
      const calculatedP99 = Math.round(point.p99Ms * envMultiplier * endpointLatencyRatio);
      const calculatedRequests = Math.max(1, Math.round(point.requests * envRpmMultiplier));
      const rawErrorRate = point.errorRate * envErrorMultiplier * endpointErrorRatio;
      const calculatedErrorRate = Number(Math.min(100, Math.max(0.1, rawErrorRate)).toFixed(1));
      const failed = Math.round((calculatedRequests * calculatedErrorRate) / 100);
      const successful = calculatedRequests - failed;

      return {
        time: point.time,
        avgMs: calculatedAvg,
        p95Ms: calculatedP95,
        p99Ms: calculatedP99,
        requests: calculatedRequests,
        successful,
        failed,
        errorRate: calculatedErrorRate,
        slaLimit: 5.0, // Standard 5.0% SLA Threshold
      };
    });

    // 4. Calculate Aggregate Dashboard Metrics
    const totalRequests = timeSeries.reduce((acc, p) => acc + p.requests, 0);
    const totalSuccessful = timeSeries.reduce((acc, p) => acc + p.successful, 0);
    const totalFailed = timeSeries.reduce((acc, p) => acc + p.failed, 0);

    const weightedLatencySum = timeSeries.reduce((acc, p) => acc + p.avgMs * p.requests, 0);
    const averageResponseTimeMs = totalRequests > 0 ? Math.round(weightedLatencySum / totalRequests) : 0;

    // Percentiles from series
    const p95ResponseTimeMs =
      timeSeries.length > 0
        ? Math.round(timeSeries.reduce((acc, p) => acc + p.p95Ms, 0) / timeSeries.length)
        : 0;
    const p99ResponseTimeMs =
      timeSeries.length > 0
        ? Math.round(timeSeries.reduce((acc, p) => acc + p.p99Ms, 0) / timeSeries.length)
        : 0;

    const overallErrorRate = totalRequests > 0 ? Number(((totalFailed / totalRequests) * 100).toFixed(1)) : 0;

    // Calculate Average RPM
    // Determine minutes in the selected window
    let windowMinutes = 24 * 60;
    if (timeRange === '1h') windowMinutes = 60;
    if (timeRange === '7d') windowMinutes = 7 * 24 * 60;
    if (timeRange === '30d') windowMinutes = 30 * 24 * 60;

    const requestsPerMinute = totalRequests > 0 ? Math.round(totalRequests / windowMinutes) : 0;

    // 5. HTTP Status Code Distribution
    const statusCodeDistribution = STATUS_CODE_BENCHMARKS.map((item) => {
      let multiplier = envRpmMultiplier;
      // Increase error status counts if error multiplier is high
      if (item.statusGroup === '4xx' || item.statusGroup === '5xx') {
        multiplier *= envErrorMultiplier;
      }
      const adjustedCount = Math.max(1, Math.round(item.count * multiplier));
      return {
        ...item,
        count: adjustedCount,
      };
    });

    const totalStatusCount = statusCodeDistribution.reduce((acc, i) => acc + i.count, 0);
    const finalStatusDistribution = statusCodeDistribution.map((item) => ({
      ...item,
      percent: `${((item.count / totalStatusCount) * 100).toFixed(1)}%`,
    }));

    return {
      metrics: {
        averageResponseTimeMs,
        p95ResponseTimeMs,
        p99ResponseTimeMs,
        requestsPerMinute,
        errorRatePercent: overallErrorRate,
        successfulRequests: totalSuccessful,
        failedRequests: totalFailed,
        totalRequests,
        successRatePercent: totalRequests > 0 ? Number((100 - overallErrorRate).toFixed(1)) : 0,
      },
      charts: {
        responseTimeOverTime: timeSeries,
        requestsOverTime: timeSeries,
        errorRateOverTime: timeSeries,
        httpStatusDistribution: finalStatusDistribution,
        endpointPerformance,
      },
    };
  },
};

export default performanceService;
