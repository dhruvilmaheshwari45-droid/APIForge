import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, 
  Activity, 
  AlertTriangle, 
  Gauge, 
  CheckCircle2, 
  ShieldAlert, 
  RefreshCw, 
  Download, 
  SlidersHorizontal,
  Layers,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Flame,
  Info
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/common/StatCard';
import { 
  PerformanceFilters, 
  ResponseTimeTrendChart, 
  RequestsOverTimeChart, 
  ErrorRateChart, 
  HttpStatusDistributionChart, 
  EndpointPerformanceChart, 
  EndpointPerformanceTable 
} from '../../components/performance';
import performanceService from '../../services/performanceService';

const DEFAULT_FILTERS = {
  environment: 'ALL',
  endpoint: 'ALL',
  method: 'ALL',
  timeRange: '24h',
};

export const PerformanceMonitoringPage = () => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [isExporting, setIsExporting] = useState(false);

  const [backendData, setBackendData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Available Filter Options
  const filterOptions = useMemo(() => performanceService.getFilterOptions(), []);

  // Fetch performance metrics from backend API
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    performanceService
      .fetchFromBackend(filters)
      .then((data) => {
        if (active && data) {
          setBackendData(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filters, lastRefreshed]);

  // Performance Data based on backend response or clean zero local state
  const performanceData = useMemo(() => {
    if (backendData?.metrics && backendData?.charts) {
      const bMetrics = backendData.metrics;
      const bCharts = backendData.charts;
      const totalReq = bMetrics.totalRequests ?? 0;
      const successReq = bMetrics.successfulRequests ?? 0;
      const failedReq = Math.max(0, totalReq - successReq);
      const errRate = bMetrics.errorRatePercent ?? bMetrics.errorRate ?? 0;

      return {
        metrics: {
          averageResponseTimeMs: bMetrics.averageResponseTimeMs ?? bMetrics.avgResponseTime ?? 0,
          p95ResponseTimeMs: bMetrics.p95ResponseTimeMs ?? bMetrics.p95ResponseTime ?? 0,
          p99ResponseTimeMs: bMetrics.p99ResponseTimeMs ?? bMetrics.p99ResponseTime ?? 0,
          requestsPerMinute: bMetrics.requestsPerMinute ?? 0,
          errorRatePercent: Number(errRate),
          successfulRequests: successReq,
          failedRequests: failedReq,
          totalRequests: totalReq,
          successRatePercent: totalReq > 0 ? Number((100 - errRate).toFixed(1)) : 0,
        },
        charts: {
          responseTimeOverTime: bCharts.timeSeries || [],
          requestsOverTime: bCharts.timeSeries || [],
          errorRateOverTime: bCharts.timeSeries || [],
          httpStatusDistribution: bCharts.statusDistribution || [],
          endpointPerformance: bCharts.endpointPerformance || [],
        },
      };
    }
    return performanceService.getPerformanceData(filters);
  }, [backendData, filters]);

  const { metrics, charts } = performanceData;

  const handleFilterChange = (partial) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleRefresh = () => {
    setLastRefreshed(new Date());
  };

  const handleFilterByEndpoint = (endpointPath) => {
    setFilters((prev) => ({ ...prev, endpoint: endpointPath }));
  };

  const handleExportData = () => {
    setIsExporting(true);
    try {
      const exportObject = {
        exportedAt: new Date().toISOString(),
        filters,
        metrics,
        endpoints: charts.endpointPerformance,
      };
      const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `apiforge-performance-${filters.environment.toLowerCase()}-${filters.timeRange}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export performance data:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Performance Analytics"
        subtitle="Deep-dive latency percentiles (Avg, P95, P99), throughput (RPM), error rates, and endpoint benchmarks"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Export Summary Button */}
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium font-mono text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 shadow-sm transition-colors"
              title="Export Performance Metrics as JSON"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>{isExporting ? 'Exporting...' : 'Export JSON'}</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 shadow-sm transition-colors"
              title="Refresh Analytics Metrics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {/* Analytics Scope Disclosure Banner */}
      <div className="p-3 px-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-400 flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-brand-500 shrink-0" />
          <span>
            <strong>Performance Scope:</strong> Visualizing telemetry for <strong>{filters.environment === 'ALL' ? 'All Environments' : filters.environment}</strong> ({filters.endpoint === 'ALL' ? 'All Routes' : filters.endpoint}) over <strong>{filters.timeRange}</strong>.
          </span>
        </div>
        <span className="text-[11px] text-slate-400 shrink-0 hidden md:inline">
          Refreshed {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Metric 1: Average Response Time */}
        <StatCard
          title="Avg Response Time"
          value={`${metrics.averageResponseTimeMs} ms`}
          change="-14ms"
          changeType="positive"
          icon={Zap}
          description="Weighted mean latency"
        />

        {/* Metric 2: P95 Response Time */}
        <StatCard
          title="P95 Latency"
          value={`${metrics.p95ResponseTimeMs} ms`}
          change="95th %ile"
          changeType="positive"
          icon={Activity}
          description="5% slowest requests"
        />

        {/* Metric 3: P99 Response Time */}
        <StatCard
          title="P99 Latency"
          value={`${metrics.p99ResponseTimeMs} ms`}
          change="Peak tail"
          changeType={metrics.p99ResponseTimeMs > 1000 ? 'negative' : 'positive'}
          icon={AlertTriangle}
          description="1% extreme latency tail"
        />

        {/* Metric 4: Requests per Minute */}
        <StatCard
          title="Throughput (RPM)"
          value={`${metrics.requestsPerMinute} RPM`}
          change="+6.2%"
          changeType="positive"
          icon={Gauge}
          description="Inbound throughput rate"
        />

        {/* Metric 5: Error Rate */}
        <StatCard
          title="Error Rate"
          value={`${metrics.errorRatePercent}%`}
          change={metrics.errorRatePercent > 5.0 ? 'Exceeds SLA' : '<5% SLA Max'}
          changeType={metrics.errorRatePercent > 5.0 ? 'negative' : 'positive'}
          icon={ShieldAlert}
          description="4xx & 5xx responses"
        />

        {/* Metric 6: Successful Requests */}
        <StatCard
          title="Successful Calls"
          value={metrics.successfulRequests.toLocaleString()}
          change={`${metrics.successRatePercent}%`}
          changeType="positive"
          icon={CheckCircle2}
          description="2xx & 3xx responses"
        />
      </div>

      {/* Multi-Dimensional Filter Controls */}
      <PerformanceFilters
        filters={filters}
        options={filterOptions}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Section 1: Response Time Over Time & Requests Over Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Response Time Over Time */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-500" />
                Response Time Over Time
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                Comparison of Average Latency, P95, and P99 percentiles across the active timeframe
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">Unit: ms</span>
          </div>
          <ResponseTimeTrendChart data={charts.responseTimeOverTime} />
        </div>

        {/* Chart 2: Requests Over Time */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-brand-500" />
                Requests Over Time
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                Total throughput volume and failed request distribution over time
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {metrics.totalRequests.toLocaleString()} Total
            </span>
          </div>
          <RequestsOverTimeChart data={charts.requestsOverTime} />
        </div>
      </div>

      {/* Section 2: Error Rate Over Time & HTTP Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 3: Error Rate Over Time */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                Error Rate (%) Over Time
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                Failed response ratio compared with the standard 5.0% SLA warning threshold
              </p>
            </div>
            <span className={`text-xs font-mono font-bold ${metrics.errorRatePercent > 5 ? 'text-rose-500' : 'text-emerald-500'}`}>
              Avg: {metrics.errorRatePercent}%
            </span>
          </div>
          <ErrorRateChart data={charts.errorRateOverTime} />
        </div>

        {/* Chart 4: HTTP Status Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                HTTP Status Distribution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                Frequency and breakdown of returned HTTP response codes
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {charts.httpStatusDistribution.length} Codes
            </span>
          </div>
          <HttpStatusDistributionChart data={charts.httpStatusDistribution} />
        </div>
      </div>

      {/* Section 3: Endpoint Performance Comparison & Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm space-y-5 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-500" />
              Endpoint Performance Benchmarks
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
              Comparative latency breakdown across API routes (e.g., /users → 124ms, /products → 182ms, /orders → 340ms, /auth/login → 492ms)
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              &lt;200ms Fast
            </span>
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              200-400ms Moderate
            </span>
            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              &gt;400ms Degraded
            </span>
          </div>
        </div>

        {/* Chart 5: Horizontal Endpoint Latency Comparison Chart */}
        <div className="pt-2">
          <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Average Latency by Route
          </h4>
          <EndpointPerformanceChart
            data={charts.endpointPerformance}
            onSelectEndpoint={handleFilterByEndpoint}
          />
        </div>

        {/* Endpoint Benchmark Breakdown Table */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
            Endpoint Performance Matrix
          </h4>
          <EndpointPerformanceTable
            endpoints={charts.endpointPerformance}
            onFilterByEndpoint={handleFilterByEndpoint}
          />
        </div>
      </div>

      {/* Section 4: Performance Diagnostics & Recommendations */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-500" />
          Automated Performance Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-amber-900 dark:text-amber-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              Elevated Tail Latency on /auth/login (P99: 1,150ms)
            </p>
            <p className="text-[11px] text-slate-600 dark:text-amber-200/80 font-sans pl-5.5">
              Password hashing algorithms (bcrypt/argon2) are CPU-bound on the auth route. Consider tuning worker threads or utilizing Redis session caching for repeat token refreshes.
            </p>
          </div>

          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl text-rose-900 dark:text-rose-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              High Transaction Latency on /checkout/pay (560ms Avg)
            </p>
            <p className="text-[11px] text-slate-600 dark:text-rose-200/80 font-sans pl-5.5">
              Payment gateway round-trips represent 78% of request duration. Configure asynchronous webhook settlement or connection keep-alive pools.
            </p>
          </div>

          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-emerald-900 dark:text-emerald-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              Optimal Latency Tier on /users (124ms Avg)
            </p>
            <p className="text-[11px] text-slate-600 dark:text-emerald-200/80 font-sans pl-5.5">
              Core user fetch queries are executing within sub-150ms benchmarks with 1.2% error rates across all regional gateways.
            </p>
          </div>

          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-emerald-900 dark:text-emerald-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              High-Throughput /analytics/events (88ms Avg, 65 RPM)
            </p>
            <p className="text-[11px] text-slate-600 dark:text-emerald-200/80 font-sans pl-5.5">
              Event ingestion pipelines are operating at peak throughput with negligible 0.4% error rates and 142ms P95 latency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitoringPage;
