import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/Badge';
import { TestRunnerModal } from '../../components/testing';
import testService from '../../services/testService';
import {
  TestTube2,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Play,
  Layers,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const TestingOverviewPage = () => {
  const navigate = useNavigate();
  const [suites, setSuites] = useState([]);
  const [runs, setRuns] = useState([]);
  const [runningSuite, setRunningSuite] = useState(null);

  const loadData = () => {
    try {
      setSuites(testService.getSuites());
      setRuns(testService.getRuns());
    } catch {
      setSuites([]);
      setRuns([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCases = testService.getAllTestCases().length;
  const passedRuns = runs.filter((r) => r.status === 'passed').length;
  const failedRuns = runs.filter((r) => r.status === 'failed').length;
  const overallSuccessRate =
    runs.length > 0 ? Math.round((passedRuns / runs.length) * 100) : 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Automation & Testing Hub"
        subtitle="Create automated test suites, write response assertions, and monitor regression test execution history"
        actions={
          <div className="flex space-x-3">
            <Link
              to="/testing/suites"
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center space-x-2 shadow-xs"
            >
              <TestTube2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Test Suites ({suites.length})</span>
            </Link>
            <Link
              to="/testing/runs"
              className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 rounded-lg text-xs font-semibold text-white flex items-center space-x-2 shadow-md shadow-brand-600/20"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Execution Logs ({runs.length})</span>
            </Link>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium font-mono uppercase">
              Configured Suites
            </span>
            <TestTube2 className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-2">
            {suites.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
            {totalCases} test cases defined
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium font-mono uppercase">
              Run Success Rate
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
            {overallSuccessRate}%
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
            {passedRuns} passed of {runs.length} runs
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium font-mono uppercase">
              Failed Runs
            </span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-2">
            {failedRuns}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
            {failedRuns === 0 ? 'All systems green' : 'Failed assertions present'}
          </p>
        </div>
      </div>

      {/* Test Suites Overview List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
            Automated Test Suites
          </h2>
          <Link
            to="/testing/suites"
            className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-mono"
          >
            Manage All Suites &rarr;
          </Link>
        </div>

        {suites.length > 0 ? (
          <div className="space-y-3">
            {suites.map((ts) => (
              <div
                key={ts.id}
                className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs font-mono">
                      {ts.name}
                    </h3>
                    <StatusBadge status={ts.lastStatus || 'untested'} />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {ts.description}
                  </p>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => setRunningSuite(ts)}
                    className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run Suite</span>
                  </button>

                  <button
                    onClick={() => navigate(`/testing/suites/${ts.id}`)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:text-slate-900"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={TestTube2}
            title="No Test Suites Available"
            description="Create your first automated test suite to run HTTP status, header, and contract assertions."
            actionText="New Test Suite"
            onAction={() => navigate('/testing/suites')}
          />
        )}
      </div>

      {/* Test Runner Modal */}
      <TestRunnerModal
        isOpen={Boolean(runningSuite)}
        onClose={() => {
          setRunningSuite(null);
          loadData();
        }}
        suite={runningSuite}
        onRunFinished={() => loadData()}
      />
    </div>
  );
};

export default TestingOverviewPage;
