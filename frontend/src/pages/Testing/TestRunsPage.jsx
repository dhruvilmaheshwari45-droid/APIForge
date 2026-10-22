import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import { StatusBadge, Badge } from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { TestRunDetailsModal } from '../../components/testing';
import { useToast } from '../../context/ToastContext';
import testService from '../../services/testService';
import {
  PlayCircle,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Trash2,
  TestTube2,
  ExternalLink,
  ChevronRight,
  Filter,
  Eye
} from 'lucide-react';

export const TestRunsPage = () => {
  const { toast } = useToast();
  const [runs, setRuns] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [inspectedRun, setInspectedRun] = useState(null);
  const [deletingRun, setDeletingRun] = useState(null);
  const [isClearAllOpen, setIsClearAllOpen] = useState(false);

  const loadData = () => {
    try {
      const list = testService.getRuns();
      setRuns(list);
    } catch (err) {
      toast.error('Failed to load test runs: ' + err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRuns = useMemo(() => {
    return runs.filter((r) => {
      const matchSearch =
        r.suiteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.environmentName && r.environmentName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [runs, searchQuery, statusFilter]);

  const handleDeleteRun = () => {
    if (!deletingRun) return;
    try {
      testService.deleteRun(deletingRun.id);
      loadData();
      toast.success('Test run entry deleted');
      setDeletingRun(null);
    } catch (err) {
      toast.error('Failed to delete run entry');
    }
  };

  const handleClearAllRuns = () => {
    try {
      testService.clearRuns();
      loadData();
      toast.success('Historical test run logs cleared');
      setIsClearAllOpen(false);
    } catch (err) {
      toast.error('Failed to clear runs: ' + err.message);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      return new Date(isoStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  // Metrics
  const passedRunsCount = runs.filter((r) => r.status === 'passed').length;
  const failedRunsCount = runs.filter((r) => r.status === 'failed').length;
  const avgDuration =
    runs.length > 0 ? Math.round(runs.reduce((acc, r) => acc + (r.durationMs || 0), 0) / runs.length) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test Execution History & Logs"
        subtitle="Review historical test run outcomes, execution duration, and assertion results across all suites"
        actions={
          <div className="flex items-center space-x-2.5">
            <Link
              to="/testing/suites"
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center space-x-1.5 shadow-xs"
            >
              <TestTube2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Test Suites</span>
            </Link>

            {runs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsClearAllOpen(true)}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Clear History
              </Button>
            )}
          </div>
        }
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Total Executions</span>
            <History className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-2">
            {runs.length}
          </p>
          <span className="text-[11px] text-slate-400 font-mono">Recorded runs</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Passed Runs</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
            {passedRunsCount}
          </p>
          <span className="text-[11px] text-slate-400 font-mono">100% assertions met</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Failed Runs</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-2">
            {failedRunsCount}
          </p>
          <span className="text-[11px] text-slate-400 font-mono">Requires investigation</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Avg Latency</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-2">
            {avgDuration}ms
          </p>
          <span className="text-[11px] text-slate-400 font-mono">Execution turnaround</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search runs by suite name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 font-mono"
          />
        </div>

        <div className="flex items-center space-x-1">
          {['ALL', 'passed', 'failed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors capitalize ${
                statusFilter === st
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold border border-brand-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Historical Runs List */}
      {filteredRuns.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
          {filteredRuns.map((run) => (
            <div
              key={run.id}
              className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                  <span className="font-mono text-xs text-slate-400 font-bold">
                    #{run.id.slice(-8)}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-sm">
                    {run.suiteName}
                  </span>
                  <StatusBadge status={run.status} />
                  <span className="text-[11px] font-mono font-bold text-brand-600 dark:text-brand-400">
                    {run.successRate}% Success
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-xs font-mono text-slate-500 dark:text-slate-400 flex-wrap gap-y-1">
                  <span>Executed: {formatDate(run.executedAt)}</span>
                  <span>•</span>
                  <span>Env: {run.environmentName || 'Development'}</span>
                  <span>•</span>
                  <span>Duration: {run.durationMs}ms</span>
                  <span>•</span>
                  <span>
                    Tests: {run.passedCount}/{run.totalTests} Passed
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 self-end md:self-center shrink-0">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setInspectedRun(run)}
                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                >
                  Inspect Results
                </Button>

                <button
                  onClick={() => setDeletingRun(run)}
                  title="Delete Run Log"
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={PlayCircle}
          title={searchQuery ? 'No Matching Test Runs' : 'No Execution History'}
          description={
            searchQuery
              ? `No test runs match "${searchQuery}". Reset filters to see all runs.`
              : 'Execute a test suite from the Test Suites page to inspect assertion traces and metrics.'
          }
          actionText={searchQuery ? 'Clear Filter' : 'Go to Test Suites'}
          onAction={
            searchQuery
              ? () => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }
              : () => {
                  window.location.href = '/testing/suites';
                }
          }
        />
      )}

      {/* Inspect Results Modal */}
      <TestRunDetailsModal
        isOpen={Boolean(inspectedRun)}
        onClose={() => setInspectedRun(null)}
        run={inspectedRun}
      />

      {/* Delete Single Run Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingRun)}
        onClose={() => setDeletingRun(null)}
        onConfirm={handleDeleteRun}
        title="Delete Test Run Log?"
        message="Are you sure you want to delete this historical execution entry?"
        confirmText="Delete Log"
        variant="danger"
      />

      {/* Clear All Confirmation */}
      <ConfirmDialog
        isOpen={isClearAllOpen}
        onClose={() => setIsClearAllOpen(false)}
        onConfirm={handleClearAllRuns}
        title="Clear All Test Execution Logs?"
        message="This will delete all historical test run records. This action cannot be undone."
        confirmText="Clear All History"
        variant="danger"
      />
    </div>
  );
};

export default TestRunsPage;
