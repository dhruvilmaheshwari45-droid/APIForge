/**
 * APIForge - API Traffic Monitoring Service
 * 
 * Manages traffic telemetry logs, real-time buffering preparation,
 * combined filtering, sorting, pagination, and visual metric aggregations.
 * Compatible with future MongoDB TrafficLog collection and Socket.io stream.
 */

import { SAMPLE_TRAFFIC_LOGS } from '../data/mockTraffic.js';
import { maskHeaders, maskSecret } from './requestService.js';
import { apiClient } from './apiService.js';
import { io } from 'socket.io-client';

const STORAGE_KEYS = {
  TRAFFIC_LOGS: 'apiforge_traffic_logs',
};

let socket = null;
let isSocketConnected = false;
const trafficListeners = new Set();

function initSocket() {
  if (typeof window === 'undefined') return;
  try {
    socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    socket.on('connect', () => {
      isSocketConnected = true;
    });
    socket.on('disconnect', () => {
      isSocketConnected = false;
    });
    socket.on('traffic:new', (newLog) => {
      if (!newLog) return;
      const logs = trafficService.getAllRawLogs();
      const mapped = {
        ...newLog,
        id: newLog.customId || newLog.id || newLog._id,
      };
      const updated = [mapped, ...logs.filter((l) => l.requestId !== mapped.requestId)].slice(0, 200);
      trafficService.saveRawLogs(updated);
      trafficListeners.forEach((fn) => {
        try { fn(mapped); } catch (e) {}
      });
    });
  } catch (err) {
    console.warn('[trafficService] Socket init error:', err);
  }
}

export const trafficService = {
  // Sync with backend MERN API
  async syncWithBackend() {
    try {
      const res = await apiClient.get('/traffic').catch(() => null);
      if (res?.data?.data && Array.isArray(res.data.data)) {
        const backendLogs = res.data.data.map((l) => ({
          ...l,
          id: l.customId || l.id || l._id,
        }));
        this.saveRawLogs(backendLogs);
      }
    } catch (err) {
      console.warn('[trafficService] Backend sync skipped/failed:', err?.message);
    }
  },

  onTrafficUpdate(listener) {
    trafficListeners.add(listener);
    return () => trafficListeners.delete(listener);
  },
  /**
   * Get raw logs array from localStorage or return empty array
   * @returns {Array}
   */
  getAllRawLogs() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRAFFIC_LOGS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error parsing traffic logs from localStorage:', e);
    }
    this.saveRawLogs([]);
    return [];
  },

  /**
   * Save raw logs to localStorage
   */
  saveRawLogs(logs) {
    try {
      localStorage.setItem(STORAGE_KEYS.TRAFFIC_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save traffic logs:', e);
    }
  },

  /**
   * Get single log by ID
   */
  getLogById(id) {
    const list = this.getAllRawLogs();
    return list.find((l) => l.id === id || l.requestId === id) || null;
  },

  /**
   * Record a new log entry (e.g. from live request executions in Request Builder)
   */
  recordLog(logEntry) {
    const logs = this.getAllRawLogs();
    const newEntry = {
      id: logEntry.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      requestId: logEntry.requestId || `req_${Date.now().toString(36)}`,
      timestamp: logEntry.timestamp || new Date().toISOString(),
      method: (logEntry.method || 'GET').toUpperCase(),
      path: logEntry.path || logEntry.url || '/',
      url: logEntry.url || logEntry.path || '/',
      environment: logEntry.environment || 'Development',
      status: Number(logEntry.status) || 200,
      statusText: logEntry.statusText || 'OK',
      responseTimeMs: Number(logEntry.responseTimeMs) || 0,
      sizeBytes: Number(logEntry.sizeBytes) || 0,
      ipAddress: logEntry.ipAddress || '127.0.0.1 (Local Client)',
      userAgent: logEntry.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'APIForge/1.0'),
      requestHeaders: maskHeaders(logEntry.requestHeaders || {}),
      queryParams: logEntry.queryParams || {},
      requestBody: logEntry.requestBody || null,
      responseHeaders: logEntry.responseHeaders || {},
      responseBody: logEntry.responseBody || null,
      errorMessage: logEntry.errorMessage || null,
      isError: Boolean(logEntry.isError || (logEntry.status >= 400)),
      source: logEntry.source || 'real',
    };

    // Keep up to 200 recent logs
    const updated = [newEntry, ...logs].slice(0, 200);
    this.saveRawLogs(updated);

    // Backend sync
    apiClient.post('/traffic', newEntry).catch(() => {});

    return newEntry;
  },

  /**
   * Record traffic log from requestService.sendRequest result
   */
  recordFromExecution(result, environmentName = 'Development') {
    if (!result) return;
    const meta = result.requestMeta || {};
    let urlPath = meta.url || '/';
    try {
      const parsed = new URL(meta.url);
      urlPath = parsed.pathname + parsed.search;
    } catch {
      // url was relative or template
    }

    this.recordLog({
      requestId: `req_${Date.now().toString(36)}`,
      timestamp: meta.timestamp || new Date().toISOString(),
      method: meta.method || 'GET',
      path: urlPath,
      url: meta.url || '',
      environment: environmentName,
      status: result.status || (result.ok ? 200 : 500),
      statusText: result.statusText || (result.ok ? 'OK' : 'Error'),
      responseTimeMs: result.responseTimeMs || 0,
      sizeBytes: result.sizeBytes || 0,
      ipAddress: '127.0.0.1 (Local Client)',
      requestHeaders: meta.headers || {},
      queryParams: meta.params || {},
      requestBody: meta.body,
      responseHeaders: result.headers || {},
      responseBody: result.data,
      errorMessage: result.error || (result.isHttpError ? `HTTP ${result.status} ${result.statusText}` : null),
      isError: !result.ok,
      source: 'real',
    });
  },

  /**
   * Filter, sort, and paginate traffic logs
   */
  getLogs({
    search = '',
    method = 'ALL',
    status = 'ALL',
    environment = 'ALL',
    timeRange = '24h',
    source = 'ALL',
    sortBy = 'timestamp',
    sortOrder = 'desc',
    page = 1,
    pageSize = 10,
  } = {}) {
    let list = this.getAllRawLogs();

    // 1. Time Range Filter
    const now = Date.now();
    if (timeRange === '1h') {
      const cutoff = now - 60 * 60 * 1000;
      list = list.filter((l) => new Date(l.timestamp).getTime() >= cutoff);
    } else if (timeRange === '24h') {
      const cutoff = now - 24 * 60 * 60 * 1000;
      list = list.filter((l) => new Date(l.timestamp).getTime() >= cutoff);
    } else if (timeRange === '7d') {
      const cutoff = now - 7 * 24 * 60 * 60 * 1000;
      list = list.filter((l) => new Date(l.timestamp).getTime() >= cutoff);
    }

    // 2. Search Query Filter (Endpoint path, URL, Request ID, IP)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (l) =>
          (l.path && l.path.toLowerCase().includes(q)) ||
          (l.url && l.url.toLowerCase().includes(q)) ||
          (l.requestId && l.requestId.toLowerCase().includes(q)) ||
          (l.ipAddress && l.ipAddress.toLowerCase().includes(q))
      );
    }

    // 3. HTTP Method Filter
    if (method && method !== 'ALL') {
      list = list.filter((l) => l.method?.toUpperCase() === method.toUpperCase());
    }

    // 4. Status Filter ('ALL', '2xx', '3xx', '4xx', '5xx', or exact number)
    if (status && status !== 'ALL') {
      if (status === '2xx') {
        list = list.filter((l) => l.status >= 200 && l.status < 300);
      } else if (status === '3xx') {
        list = list.filter((l) => l.status >= 300 && l.status < 400);
      } else if (status === '4xx') {
        list = list.filter((l) => l.status >= 400 && l.status < 500);
      } else if (status === '5xx') {
        list = list.filter((l) => l.status >= 500 && l.status < 600);
      } else if (!isNaN(Number(status))) {
        list = list.filter((l) => l.status === Number(status));
      }
    }

    // 5. Environment Filter
    if (environment && environment !== 'ALL') {
      list = list.filter((l) => l.environment?.toLowerCase() === environment.toLowerCase());
    }

    // 6. Source Filter ('real' vs 'sample')
    if (source && source !== 'ALL') {
      list = list.filter((l) => l.source === source);
    }

    // 7. Sorting
    list.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'responseTimeMs') {
        valA = Number(a.responseTimeMs) || 0;
        valB = Number(b.responseTimeMs) || 0;
      } else if (sortBy === 'status') {
        valA = Number(a.status) || 0;
        valB = Number(b.status) || 0;
      } else {
        // default: timestamp
        valA = new Date(a.timestamp).getTime();
        valB = new Date(b.timestamp).getTime();
      }

      if (sortOrder === 'asc') {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      }
      return valA < valB ? 1 : valA > valB ? -1 : 0;
    });

    const total = list.length;
    const safePageSize = Math.max(1, pageSize);
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const validPage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (validPage - 1) * safePageSize;
    const paginatedLogs = list.slice(startIndex, startIndex + safePageSize);

    return {
      logs: paginatedLogs,
      total,
      page: validPage,
      pageSize: safePageSize,
      totalPages,
    };
  },

  /**
   * Aggregate visual metrics matching active filter options
   */
  getMetrics({ timeRange = '24h', environment = 'ALL', method = 'ALL', status = 'ALL', search = '' } = {}) {
    // Retrieve all filtered logs without pagination
    const { logs } = this.getLogs({
      search,
      method,
      status,
      environment,
      timeRange,
      page: 1,
      pageSize: 9999,
    });

    const totalRequests = logs.length;
    const successfulRequests = logs.filter((l) => l.status < 400).length;
    const failedRequests = logs.filter((l) => l.status >= 400).length;
    const successRate = totalRequests > 0 ? Math.round((successfulRequests / totalRequests) * 100) : 100;

    const totalLatency = logs.reduce((acc, l) => acc + (Number(l.responseTimeMs) || 0), 0);
    const avgResponseTimeMs = totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0;

    // 1. Status Code Distribution for BarChart
    const statusCounts = {};
    logs.forEach((l) => {
      const code = String(l.status || 200);
      statusCounts[code] = (statusCounts[code] || 0) + 1;
    });

    const STATUS_COLORS = {
      '200': '#10b981',
      '201': '#10b981',
      '204': '#10b981',
      '400': '#f59e0b',
      '401': '#f59e0b',
      '403': '#f43f5e',
      '404': '#f59e0b',
      '500': '#f43f5e',
      '502': '#f43f5e',
    };

    const statusCodeDistribution = Object.entries(statusCounts).map(([code, count]) => ({
      code,
      count,
      percent: `${Math.round((count / totalRequests) * 100)}%`,
      color: STATUS_COLORS[code] || (Number(code) < 400 ? '#10b981' : '#f43f5e'),
    }));

    // 2. HTTP Method Distribution
    const methodCounts = {};
    logs.forEach((l) => {
      const m = (l.method || 'GET').toUpperCase();
      methodCounts[m] = (methodCounts[m] || 0) + 1;
    });

    const methodDistribution = Object.entries(methodCounts).map(([m, count]) => ({
      method: m,
      count,
      percent: `${Math.round((count / totalRequests) * 100)}%`,
    }));

    // 3. Requests Over Time (Bucketed hourly intervals for AreaChart)
    const timeBuckets = {};
    logs.forEach((l) => {
      const d = new Date(l.timestamp);
      // Format as 'HH:00'
      const bucket = `${String(d.getHours()).padStart(2, '0')}:00`;
      if (!timeBuckets[bucket]) {
        timeBuckets[bucket] = { requests: 0, errors: 0 };
      }
      timeBuckets[bucket].requests += 1;
      if (l.status >= 400) {
        timeBuckets[bucket].errors += 1;
      }
    });

    // Sort time buckets chronologically
    const requestsOverTime = Object.entries(timeBuckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, stats]) => ({ time, requests: stats.requests, errors: stats.errors }));

    // Fallback if empty
    if (requestsOverTime.length === 0) {
      requestsOverTime.push({ time: 'Now', requests: 0, errors: 0 });
    }

    // 4. Recent Errors
    const recentErrors = logs
      .filter((l) => l.status >= 400)
      .slice(0, 5)
      .map((l) => ({
        id: l.id,
        timestamp: l.timestamp,
        method: l.method,
        path: l.path,
        status: l.status,
        responseTimeMs: l.responseTimeMs,
        errorMessage: l.errorMessage || `${l.status} ${l.statusText}`,
      }));

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate,
      avgResponseTimeMs,
      statusCodeDistribution,
      methodDistribution,
      requestsOverTime,
      recentErrors,
    };
  },

  /**
   * Connection status for real-time stream
   * Reports live WebSocket connection status or demo mode
   */
  getConnectionStatus() {
    if (isSocketConnected) {
      return {
        status: 'live',
        label: 'Live (Socket.io Connected)',
        isLive: true,
        description: 'Real-time telemetry stream connected to APIForge Express/Socket.io backend.',
      };
    }
    return {
      status: 'demo',
      label: 'Local / Buffered Stream',
      isLive: false,
      description: 'Telemetry logs buffered locally. Connecting to backend telemetry stream...',
    };
  },

  /**
   * Reset logs to initial sample data
   */
  resetToDefaults() {
    this.saveRawLogs(SAMPLE_TRAFFIC_LOGS);
    return SAMPLE_TRAFFIC_LOGS;
  },

  /**
   * Clear all traffic logs
   */
  clearLogs() {
    this.saveRawLogs([]);

    // Backend sync
    apiClient.delete('/traffic').catch(() => {});
  },
};

// Initialize WebSocket and sync with MongoDB traffic logs
if (typeof window !== 'undefined') {
  initSocket();
  setTimeout(() => trafficService.syncWithBackend(), 300);
}

export default trafficService;
