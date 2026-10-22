import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Radio, 
  Play, 
  Pause, 
  RotateCcw, 
  Send, 
  RefreshCw,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { 
  RequestDetailsModal, 
  TrafficFilters, 
  TrafficChartsPanel, 
  TrafficTable 
} from '../../components/monitoring';
import trafficService from '../../services/trafficService';

const DEFAULT_FILTERS = {
  search: '',
  method: 'ALL',
  status: 'ALL',
  environment: 'ALL',
  timeRange: '24h',
  source: 'ALL',
  sortBy: 'timestamp',
  sortOrder: 'desc',
};

export const TrafficMonitoringPage = () => {
  const navigate = useNavigate();

  // Filter & Pagination States
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Data States
  const [logsData, setLogsData] = useState({ logs: [], total: 0, totalPages: 1 });
  const [metrics, setMetrics] = useState(null);
  const [totalRawCount, setTotalRawCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Selected Log for Inspector Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Connection Info
  const connectionInfo = trafficService.getConnectionStatus();

  // Load telemetry logs and aggregated metrics
  const loadTrafficData = useCallback(() => {
    const rawList = trafficService.getAllRawLogs();
    setTotalRawCount(rawList.length);

    const result = trafficService.getLogs({
      ...filters,
      page,
      pageSize,
    });
    setLogsData(result);

    const aggregated = trafficService.getMetrics({
      timeRange: filters.timeRange,
      environment: filters.environment,
      method: filters.method,
      status: filters.status,
      search: filters.search,
    });
    setMetrics(aggregated);
    setLastRefreshed(new Date());
  }, [filters, page, pageSize]);

  // Initial load and whenever filters/page change
  useEffect(() => {
    loadTrafficData();
  }, [loadTrafficData]);

  // Periodic polling for simulated stream (if not paused)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      // Re-fetch to capture any new requests logged by Request Builder
      loadTrafficData();
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, loadTrafficData]);

  // Filter Handlers
  const handleFilterChange = (partial) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPage(1); // Reset to page 1 on filter modification
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1);
  };

  // Inspect Modal Handlers
  const handleSelectLog = (log) => {
    setSelectedLog(log);
    setIsInspectorOpen(true);
  };

  const handleInspectById = (logId) => {
    const found = trafficService.getLogById(logId);
    if (found) {
      setSelectedLog(found);
      setIsInspectorOpen(true);
    }
  };

  const handleCloseInspector = () => {
    setIsInspectorOpen(false);
    setSelectedLog(null);
  };

  // Reset to Seed Logs
  const handleResetSeedLogs = () => {
    if (window.confirm('Reset traffic telemetry to default seed logs? This will clear any live logged executions.')) {
      trafficService.resetToDefaults();
      loadTrafficData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="API Traffic Monitoring"
        subtitle="Live inspection of active inbound API requests, IP origins, payload byte sizes, and HTTP status distribution"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Stream Status Badge */}
            <div 
              className="px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs font-mono flex items-center gap-2"
              title={connectionInfo.description}
            >
              <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-slate-400' : 'bg-amber-500 animate-pulse'}`} />
              <span className="font-semibold">{connectionInfo.label}</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400">
                ({isPaused ? 'Paused' : 'Active'})
              </span>
            </div>

            {/* Pause / Resume Button */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium font-mono text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 shadow-sm transition-colors"
            >
              {isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Resume Stream</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pause Stream</span>
                </>
              )}
            </button>

            {/* Refresh Button */}
            <button
              onClick={loadTrafficData}
              className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 shadow-sm transition-colors"
              title="Manual Telemetry Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Reset to Seeds Button */}
            <button
              onClick={handleResetSeedLogs}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-mono text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-1 shadow-sm transition-colors"
              title="Reset to seed dataset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Seeds</span>
            </button>

            {/* Launch Request Tester Button */}
            <button
              onClick={() => navigate('/apis/request')}
              className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium font-mono flex items-center space-x-1.5 shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Request Tester</span>
            </button>
          </div>
        }
      />

      {/* Real-time Connection Disclosure Alert */}
      <div className="p-3 px-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-400 flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-brand-500 shrink-0" />
          <span>
            <strong>Telemetry Stream Disclosure:</strong> Telemetry logs are simulated and client-persisted in local storage. All requests dispatched in the <strong>Request Tester</strong> automatically feed into this stream in real-time.
          </span>
        </div>
        <span className="text-[11px] text-slate-400 shrink-0 hidden md:inline">
          Refreshed {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      {/* KPI Cards Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Inbound Requests"
          value={metrics ? metrics.totalRequests.toLocaleString() : '...'}
          icon={Activity}
          description={`${metrics?.methodDistribution?.length || 0} HTTP methods in current filter`}
        />

        <StatCard
          title="Successful Requests"
          value={metrics ? metrics.successfulRequests.toLocaleString() : '...'}
          change={metrics ? `${metrics.successRate}% rate` : ''}
          changeType="positive"
          icon={CheckCircle2}
          description="Status codes 2xx & 3xx"
        />

        <StatCard
          title="Failed Requests"
          value={metrics ? metrics.failedRequests.toLocaleString() : '...'}
          change={metrics && metrics.failedRequests > 0 ? `${100 - metrics.successRate}% error` : '0%'}
          changeType={metrics && metrics.failedRequests > 0 ? 'negative' : 'positive'}
          icon={AlertTriangle}
          description="Status codes 4xx & 5xx"
        />

        <StatCard
          title="Avg Response Latency"
          value={metrics ? `${metrics.avgResponseTimeMs} ms` : '...'}
          icon={Clock}
          description={
            metrics?.avgResponseTimeMs < 200
              ? 'Optimal performance tier'
              : metrics?.avgResponseTimeMs < 500
              ? 'Moderate response latency'
              : 'High response latency detected'
          }
        />
      </div>

      {/* Visual Traffic Analytics (Recharts) */}
      <TrafficChartsPanel
        metrics={metrics}
        onRequestClick={handleInspectById}
      />

      {/* Multi-Criteria Filters Bar */}
      <TrafficFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        totalFilteredCount={logsData.total}
        totalRawCount={totalRawCount}
      />

      {/* Traffic Logs Stream Table */}
      <TrafficTable
        logs={logsData.logs}
        total={logsData.total}
        page={logsData.page}
        pageSize={logsData.pageSize}
        totalPages={logsData.totalPages}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSelectLog={handleSelectLog}
      />

      {/* Full Request Inspector Modal */}
      <RequestDetailsModal
        isOpen={isInspectorOpen}
        onClose={handleCloseInspector}
        log={selectedLog}
      />
    </div>
  );
};

export default TrafficMonitoringPage;
