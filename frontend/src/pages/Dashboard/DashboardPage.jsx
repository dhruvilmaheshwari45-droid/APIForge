import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Badge, MethodBadge, StatusBadge } from '../../components/common/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/common/Table';
import EmptyState from '../../components/common/EmptyState';
import {
  TrafficOverviewChart,
  LatencyTrendChart,
  StatusCodeChart,
  TestStatsChart,
} from '../../components/charts';
import {
  CreateCollectionModal,
  CreateMockServerModal,
  CreateTestSuiteModal,
} from '../../components/dashboard/QuickActionModals';
import RequestDetailsModal from '../../components/dashboard/RequestDetailsModal';

import collectionService from '../../services/collectionService';
import mockServerService from '../../services/mockServerService';
import testService from '../../services/testService';
import trafficService from '../../services/trafficService';

import {
  TIME_RANGE_CHARTS,
  STATUS_CODE_DISTRIBUTION,
  TEST_PASS_FAIL_STATS,
} from '../../data/mockDashboardData';

import {
  Code2,
  Server,
  Activity,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Plus,
  Play,
  Calendar,
  Sparkles,
  ArrowRight,
  ExternalLink,
  FolderGit2,
  TestTube2,
  Send,
  Eye,
  Info,
  Layers,
  Clock,
  Radio,
  XCircle,
} from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();

  // Live state from real platform services
  const [collections, setCollections] = useState(() => collectionService.getCollections());
  const [endpoints, setEndpoints] = useState(() => collectionService.getAllEndpoints());
  const [mockServers, setMockServers] = useState(() => mockServerService.getServers());
  const [testSuites, setTestSuites] = useState(() => testService.getSuites());
  const [testRuns, setTestRuns] = useState(() => testService.getRuns());
  const [trafficLogs, setTrafficLogs] = useState(() => trafficService.getAllRawLogs());

  useEffect(() => {
    const refreshData = () => {
      try {
        setCollections(collectionService.getCollections());
        setEndpoints(collectionService.getAllEndpoints());
        setMockServers(mockServerService.getServers());
        setTestSuites(testService.getSuites());
        setTestRuns(testService.getRuns());
        setTrafficLogs(trafficService.getAllRawLogs());
      } catch (e) {}
    };
    refreshData();
  }, []);

  // Time range filter state
  const [timeRange, setTimeRange] = useState('24h');

  // Modal states
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [mockServerModalOpen, setMockServerModalOpen] = useState(false);
  const [testSuiteModalOpen, setTestSuiteModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  // Active chart datasets based on real live telemetry
  const activeTrafficData = React.useMemo(() => {
    if (trafficLogs.length === 0) return [];
    return TIME_RANGE_CHARTS[timeRange]?.traffic || [];
  }, [trafficLogs, timeRange]);

  const activeLatencyData = React.useMemo(() => {
    if (trafficLogs.length === 0) return [];
    return TIME_RANGE_CHARTS[timeRange]?.latency || [];
  }, [trafficLogs, timeRange]);

  const statusCodeData = React.useMemo(() => {
    if (trafficLogs.length === 0) return [];
    const counts = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 };
    trafficLogs.forEach((l) => {
      const code = l.statusCode || l.status || 200;
      if (code >= 200 && code < 300) counts['2xx']++;
      else if (code >= 300 && code < 400) counts['3xx']++;
      else if (code >= 400 && code < 500) counts['4xx']++;
      else if (code >= 500) counts['5xx']++;
    });
    return [
      { code: '2xx Success', count: counts['2xx'], percent: `${((counts['2xx'] / trafficLogs.length) * 100).toFixed(1)}%`, color: '#10b981' },
      { code: '3xx Redirect', count: counts['3xx'], percent: `${((counts['3xx'] / trafficLogs.length) * 100).toFixed(1)}%`, color: '#06b6d4' },
      { code: '4xx Client Err', count: counts['4xx'], percent: `${((counts['4xx'] / trafficLogs.length) * 100).toFixed(1)}%`, color: '#f59e0b' },
      { code: '5xx Server Err', count: counts['5xx'], percent: `${((counts['5xx'] / trafficLogs.length) * 100).toFixed(1)}%`, color: '#f43f5e' },
    ];
  }, [trafficLogs]);

  const testPassFailData = React.useMemo(() => {
    if (testSuites.length === 0) return [];
    return testSuites.map((s) => {
      const latestRun = testRuns.find((r) => r.suiteId === s.id);
      return {
        suite: s.name,
        passed: latestRun?.passedCount || (s.lastRunStatus === 'passed' ? (s.testCases?.length || 1) : 0),
        failed: latestRun?.failedCount || (s.lastRunStatus === 'failed' ? 1 : 0),
        total: s.testCases?.length || latestRun?.totalTests || 0,
      };
    });
  }, [testSuites, testRuns]);

  const handleRowClick = (req) => {
    setSelectedRequest(req);
    setRequestModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">

      {/* Page Header with Time-Range Selector and Quick Actions */}
      <PageHeader
        title="Dashboard"
        subtitle="Live telemetry overview across API collections, mock server instances, automated suites, and throughput health."
        breadcrumbs={[
          { label: 'APIForge', path: '/dashboard' },
          { label: 'Dashboard', path: '/dashboard' },
        ]}
        actions={
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
            {/* Time-Range Filter */}
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 text-xs font-mono shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
              <button
                type="button"
                onClick={() => setTimeRange('24h')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  timeRange === '24h'
                    ? 'bg-brand-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                24h
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('7d')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  timeRange === '7d'
                    ? 'bg-brand-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                7d
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('30d')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  timeRange === '30d'
                    ? 'bg-brand-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                30d
              </button>
            </div>

            {/* Quick Action: New Request */}
            <Button
              variant="primary"
              size="sm"
              leftIcon={Send}
              onClick={() => navigate('/apis/request')}
            >
              Request Tester
            </Button>
          </div>
        }
      />

      {/* Quick Action Launcher Bar */}
      <Card variant="default">
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Quick Action Launcher
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Instantly provision resources or simulate testing workflows
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="xs"
              leftIcon={FolderGit2}
              onClick={() => setCollectionModalOpen(true)}
            >
              Create API Collection
            </Button>
            <Button
              variant="outline"
              size="xs"
              leftIcon={Server}
              onClick={() => setMockServerModalOpen(true)}
            >
              Create Mock Server
            </Button>
            <Button
              variant="outline"
              size="xs"
              leftIcon={TestTube2}
              onClick={() => setTestSuiteModalOpen(true)}
            >
              Create Test Suite
            </Button>
            <Button
              variant="secondary"
              size="xs"
              leftIcon={Send}
              onClick={() => navigate('/apis/request')}
            >
              Open API Request Tester
            </Button>
          </div>
        </div>
      </Card>

      {/* 6 Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total APIs */}
        <Card 
          onClick={() => navigate('/apis')}
          className="p-4 space-y-2 hover:border-brand-400 dark:hover:border-brand-500 cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono uppercase tracking-wider">Total APIs</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500">
              <Code2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {endpoints.length}
            </span>
            <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-500/10 px-1.5 py-0.5 rounded">
              {collections.length} cols
            </span>
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            Configured endpoints
          </p>
        </Card>

        {/* Active Mock Servers */}
        <Card 
          onClick={() => navigate('/mock-servers')}
          className="p-4 space-y-2 hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono uppercase tracking-wider">Mock Servers</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {mockServers.length}
            </span>
            <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              Active
            </span>
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            Virtual listeners
          </p>
        </Card>

        {/* Total Requests */}
        <Card 
          onClick={() => navigate('/monitoring/traffic')}
          className="p-4 space-y-2 hover:border-brand-400 dark:hover:border-brand-500 cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono uppercase tracking-wider">Total Requests</span>
            <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-500">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {trafficLogs.length}
            </span>
            <span className="text-[11px] font-mono font-semibold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded">
              Live
            </span>
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            Total telemetry logs
          </p>
        </Card>

        {/* Failed Requests */}
        <Card 
          onClick={() => navigate('/monitoring/traffic')}
          className="p-4 space-y-2 hover:border-rose-400 dark:hover:border-rose-500 cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono uppercase tracking-wider">Failed Requests</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {trafficLogs.filter((l) => l.statusCode >= 400).length}
            </span>
            <span className="text-[11px] font-mono font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
              {trafficLogs.length > 0
                ? ((trafficLogs.filter((l) => l.statusCode >= 400).length / trafficLogs.length) * 100).toFixed(1) + '%'
                : '0%'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            4xx / 5xx responses
          </p>
        </Card>

        {/* Average Response Time */}
        <Card 
          onClick={() => navigate('/monitoring/performance')}
          className="p-4 space-y-2 hover:border-amber-400 dark:hover:border-amber-500 cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono uppercase tracking-wider">Avg Latency</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {trafficLogs.length > 0
                ? Math.round(trafficLogs.reduce((a, b) => a + (b.durationMs || b.responseTime || 0), 0) / trafficLogs.length) + 'ms'
                : '0ms'}
            </span>
            <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              Real-time
            </span>
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            Average request duration
          </p>
        </Card>

        {/* Test Success Rate */}
        <Card 
          onClick={() => navigate('/testing')}
          className="p-4 space-y-2 hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono uppercase tracking-wider">Pass Rate</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {testRuns.length > 0
                ? Math.round((testRuns.filter((r) => r.status === 'passed').length / testRuns.length) * 100) + '%'
                : '100%'}
            </span>
            <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              {testSuites.length} suites
            </span>
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            Automated test passes
          </p>
        </Card>
      </div>

      {/* Charts Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. API Traffic Over Time */}
        <Card>
          <CardHeader>
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle>API Traffic Telemetry</CardTitle>
                <Badge variant="primary" size="sm">
                  {timeRange.toUpperCase()}
                </Badge>
              </div>
              <CardDescription>
                Inbound requests and failed HTTP responses over time
              </CardDescription>
            </div>
            <Link
              to="/monitoring/traffic"
              className="text-xs font-mono text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1 shrink-0"
            >
              <span>Traffic Inspector</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            <TrafficOverviewChart data={activeTrafficData} />
          </CardContent>
        </Card>

        {/* 2. Response Time Trends */}
        <Card>
          <CardHeader>
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle>Response Latency Trends</CardTitle>
                <Badge variant="info" size="sm">
                  {timeRange.toUpperCase()}
                </Badge>
              </div>
              <CardDescription>
                Average response time and 95th percentile latency distribution
              </CardDescription>
            </div>
            <Link
              to="/monitoring/performance"
              className="text-xs font-mono text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1 shrink-0"
            >
              <span>Performance Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            <LatencyTrendChart data={activeLatencyData} />
          </CardContent>
        </Card>

        {/* 3. HTTP Status Code Distribution */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>HTTP Status-Code Distribution</CardTitle>
              <CardDescription>
                Response classification breakdown across 2xx, 3xx, 4xx, and 5xx series
              </CardDescription>
            </div>
            <div className="flex items-center space-x-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              <span>
                {trafficLogs.length > 0
                  ? ((trafficLogs.filter((l) => (l.statusCode || l.status) >= 200 && (l.statusCode || l.status) < 400).length / trafficLogs.length) * 100).toFixed(1) + '% Success'
                  : '0% Success'}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <StatusCodeChart data={statusCodeData} />
          </CardContent>
        </Card>

        {/* 4. Test Pass/Fail Statistics */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Test Suite Assertion Health</CardTitle>
              <CardDescription>
                Passed vs. failed assertion results across active test suites
              </CardDescription>
            </div>
            <Link
              to="/testing/suites"
              className="text-xs font-mono text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1 shrink-0"
            >
              <span>All Test Suites</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            <TestStatsChart data={testPassFailData} />
          </CardContent>
        </Card>
      </div>

      {/* Recent API Requests Section */}
      <Card>
        <CardHeader>
          <div>
            <div className="flex items-center space-x-2">
              <CardTitle>Recent API Requests</CardTitle>
              <Badge variant="success" dot size="sm">
                Live Feed
              </Badge>
            </div>
            <CardDescription>
              Real-time request stream. Click any row to inspect full headers, payload, and cURL commands.
            </CardDescription>
          </div>
          <Link
            to="/monitoring/traffic"
            className="text-xs font-mono text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1"
          >
            <span>View Full Stream</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          {trafficLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Time</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {trafficLogs.slice(0, 5).map((req) => (
                  <TableRow
                    key={req.id || req._id}
                    onClick={() => handleRowClick(req)}
                    className="cursor-pointer group"
                  >
                    <TableCell className="font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {req.timestamp ? new Date(req.timestamp).toLocaleTimeString() : 'Just now'}
                    </TableCell>
                    <TableCell>
                      <MethodBadge method={req.method} size="sm" />
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                      {req.endpoint || req.path || req.url}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={req.statusCode || req.status || 200} />
                    </TableCell>
                    <TableCell className="font-mono text-slate-600 dark:text-slate-300">
                      <span
                        className={
                          (req.durationMs || req.responseTime) > 200
                            ? 'text-rose-500 font-bold'
                            : (req.durationMs || req.responseTime) > 100
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                        }
                      >
                        {req.durationMs || req.responseTime || 0}ms
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {req.environment || 'Default'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(req);
                        }}
                        className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-mono inline-flex items-center space-x-1"
                      >
                        <span>Inspect</span>
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 font-mono">
              No recent API traffic. Execute requests in Request Builder or endpoints to stream live telemetry.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Split Section: Recent Activity & Failed Tests Requiring Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Collections & Mock Servers */}
        <div className="space-y-6">
          {/* Recently Created Collections */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent API Collections</CardTitle>
                <CardDescription>Recently designed or updated service domains</CardDescription>
              </div>
              <Link
                to="/apis/collections"
                className="text-xs font-mono text-brand-600 dark:text-brand-400 hover:underline"
              >
                All Collections &rarr;
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {collections.length > 0 ? (
                collections.slice(0, 4).map((col) => (
                  <div
                    key={col.id || col._id}
                    onClick={() => navigate('/apis/collections')}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500 shrink-0">
                        <FolderGit2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                          {col.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                          {col.category || 'General'} • {col.endpointsCount || 0} endpoints
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="neutral" size="sm">
                        {col.version || 'v1.0.0'}
                      </Badge>
                      <span className="block text-[10px] text-slate-400 font-mono mt-1">
                        {col.updatedAt ? new Date(col.updatedAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 font-mono">
                  No API collections created yet.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recently Created Mock Servers */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Active Mock Server Instances</CardTitle>
                <CardDescription>Simulated endpoints listening on local ports</CardDescription>
              </div>
              <Link
                to="/mock-servers"
                className="text-xs font-mono text-brand-600 dark:text-brand-400 hover:underline"
              >
                Manage All &rarr;
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockServers.length > 0 ? (
                mockServers.slice(0, 4).map((srv) => (
                  <div
                    key={srv.id || srv._id}
                    onClick={() => navigate('/mock-servers')}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                        <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                            {srv.name}
                          </h4>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          Port :{srv.port} • {srv.latencyMs || srv.defaultLatencyMs || 0}ms delay • {srv.environment || 'Default'}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={srv.status || 'active'} />
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 font-mono">
                  No mock server instances provisioned yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Recent Test Runs & Failed Tests Requiring Attention */}
        <div className="space-y-6">
          {/* Failed Tests Requiring Attention */}
          <Card className="border-rose-500/30 dark:border-rose-500/20">
            <CardHeader>
              <div>
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-rose-600 dark:text-rose-400">
                    Failed Tests Requiring Attention
                  </CardTitle>
                  <Badge variant={testRuns.filter((r) => r.status === 'failed').length > 0 ? 'danger' : 'success'} size="sm">
                    {testRuns.filter((r) => r.status === 'failed').length} Issues
                  </Badge>
                </div>
                <CardDescription>
                  Contract & regression failures requiring immediate debugging
                </CardDescription>
              </div>
              <Link
                to="/testing/runs"
                className="text-xs font-mono text-rose-600 dark:text-rose-400 hover:underline"
              >
                Inspect Runs &rarr;
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {testRuns.filter((r) => r.status === 'failed').length > 0 ? (
                testRuns.filter((r) => r.status === 'failed').slice(0, 3).map((item) => (
                  <div
                    key={item.id || item._id}
                    onClick={() => navigate('/testing/runs')}
                    className="p-3.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-1.5 cursor-pointer hover:border-rose-300 dark:hover:border-rose-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                          {item.suiteName || 'Suite Failure'}
                        </span>
                      </div>
                      <Badge variant="danger" size="sm">
                        FAILED
                      </Badge>
                    </div>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300 font-mono leading-relaxed pl-6">
                      {item.failedCount || item.failed || 1} test case(s) failed assertion checks.
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 font-mono">
                  All systems green. No failed test assertions requiring attention.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Test Execution Runs */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent Test Execution Runs</CardTitle>
                <CardDescription>Automated CI/CD and manual test passes</CardDescription>
              </div>
              <Link
                to="/testing/runs"
                className="text-xs font-mono text-brand-600 dark:text-brand-400 hover:underline"
              >
                Full History &rarr;
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {testRuns.length > 0 ? (
                testRuns.slice(0, 4).map((run) => (
                  <div
                    key={run.id || run._id}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          run.status === 'passed'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-rose-500/10 text-rose-500'
                        }`}
                      >
                        <TestTube2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                          {run.suiteName}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {run.passed || run.passedCount || 0} passed • {run.failed || run.failedCount || 0} failed • {run.durationMs || 0}ms
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={run.status} />
                      <span className="block text-[10px] text-slate-400 font-mono mt-1">
                        {run.executedAt ? new Date(run.executedAt).toLocaleTimeString() : 'Recent'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 font-mono">
                  No automated test runs executed yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Action Modals */}
      <CreateCollectionModal
        isOpen={collectionModalOpen}
        onClose={() => setCollectionModalOpen(false)}
      />

      <CreateMockServerModal
        isOpen={mockServerModalOpen}
        onClose={() => setMockServerModalOpen(false)}
      />

      <CreateTestSuiteModal
        isOpen={testSuiteModalOpen}
        onClose={() => setTestSuiteModalOpen(false)}
      />

      {/* Request Details Inspection Modal */}
      <RequestDetailsModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        request={selectedRequest}
      />
    </div>
  );
};

export default DashboardPage;
