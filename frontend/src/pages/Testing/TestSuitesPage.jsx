import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import { StatusBadge, Badge } from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { TestSuiteModal, TestRunnerModal } from '../../components/testing';
import { useToast } from '../../context/ToastContext';
import testService from '../../services/testService';
import environmentService from '../../services/environmentService';
import {
  TestTube2,
  Plus,
  Play,
  PlayCircle,
  Search,
  RotateCcw,
  Clock,
  Layers,
  Copy,
  Edit2,
  Trash2,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export const TestSuitesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [suites, setSuites] = useState([]);
  const [suiteCaseCounts, setSuiteCaseCounts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isSuiteModalOpen, setIsSuiteModalOpen] = useState(false);
  const [editingSuite, setEditingSuite] = useState(null);
  const [deletingSuite, setDeletingSuite] = useState(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Runner Modal
  const [runningSuite, setRunningSuite] = useState(null);

  const loadData = () => {
    try {
      const list = testService.getSuites();
      setSuites(list);

      const counts = {};
      const allCases = testService.getAllTestCases();
      list.forEach((s) => {
        counts[s.id] = allCases.filter((c) => c.suiteId === s.id).length;
      });
      setSuiteCaseCounts(counts);
    } catch (err) {
      toast.error('Failed to load test suites: ' + err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSuites = useMemo(() => {
    return suites.filter((s) => {
      const matchName = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDesc = (s.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchSchedule = (s.schedule || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchName || matchDesc || matchSchedule;
    });
  }, [suites, searchQuery]);

  // Suite CRUD Handlers
  const handleSaveSuite = (formData) => {
    try {
      if (editingSuite) {
        testService.updateSuite(editingSuite.id, formData);
        toast.success(`Test suite "${formData.name}" updated`);
      } else {
        const created = testService.createSuite(formData);
        toast.success(`Test suite "${created.name}" created`);
      }
      loadData();
      setIsSuiteModalOpen(false);
      setEditingSuite(null);
    } catch (err) {
      toast.error(err.message || 'Error saving test suite');
    }
  };

  const handleDuplicateSuite = (s) => {
    try {
      const cloned = testService.duplicateSuite(s.id);
      loadData();
      toast.success(`Duplicated "${s.name}"`);
    } catch (err) {
      toast.error(err.message || 'Error duplicating suite');
    }
  };

  const handleDeleteSuite = () => {
    if (!deletingSuite) return;
    try {
      testService.deleteSuite(deletingSuite.id);
      loadData();
      toast.success(`Test suite "${deletingSuite.name}" deleted`);
      setDeletingSuite(null);
    } catch (err) {
      toast.error(err.message || 'Error deleting suite');
    }
  };

  const handleResetDefaults = () => {
    try {
      testService.resetToDefaults();
      loadData();
      toast.success('Restored default test suites and assertions');
      setIsResetConfirmOpen(false);
    } catch (err) {
      toast.error('Reset failed: ' + err.message);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'Never executed';
    try {
      return new Date(isoStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Never executed';
    }
  };

  // Metrics summary
  const totalTestCasesCount = Object.values(suiteCaseCounts).reduce((a, b) => a + b, 0);
  const suitesWithPassRate = suites.filter((s) => s.passRate !== null && s.passRate !== undefined);
  const avgPassRate =
    suitesWithPassRate.length > 0
      ? Math.round(
          suitesWithPassRate.reduce((acc, s) => acc + s.passRate, 0) / suitesWithPassRate.length
        )
      : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Automated Test Suites"
        subtitle="Organize endpoint assertions into regression suites, configure execution schedules, and run live verification passes"
        actions={
          <div className="flex items-center space-x-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingSuite(null);
                setIsSuiteModalOpen(true);
              }}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Create Test Suite
            </Button>
          </div>
        }
      />

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Test Suites</span>
            <TestTube2 className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-2">
            {suites.length}
          </p>
          <span className="text-[11px] text-slate-400 font-mono">Regression bundles</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Total Test Cases</span>
            <Layers className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-2">
            {totalTestCasesCount}
          </p>
          <span className="text-[11px] text-slate-400 font-mono">Structured assertions</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Overall Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
            {avgPassRate}%
          </p>
          <span className="text-[11px] text-slate-400 font-mono">Average pass metric</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Runs Log</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-2">
            {testService.getRuns().length}
          </p>
          <Link to="/testing/runs" className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline font-mono">
            View Run History &rarr;
          </Link>
        </div>
      </div>

      {/* Search Filter */}
      <div className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search test suites by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 font-mono"
          />
        </div>
      </div>

      {/* Suites List */}
      {filteredSuites.length > 0 ? (
        <div className="space-y-4">
          {filteredSuites.map((suite) => {
            const count = suiteCaseCounts[suite.id] || 0;

            return (
              <div
                key={suite.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                      <TestTube2 className="w-4 h-4 text-amber-500" />
                      <Link
                        to={`/testing/suites/${suite.id}`}
                        className="font-bold text-slate-900 dark:text-slate-100 font-mono text-sm hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                      >
                        {suite.name}
                      </Link>
                      <StatusBadge status={suite.lastStatus || 'untested'} />
                      {suite.passRate !== null && suite.passRate !== undefined && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 font-bold border border-brand-200 dark:border-brand-500/20">
                          {suite.passRate}% Pass Rate
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
                      {suite.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => setRunningSuite(suite)}
                      disabled={count === 0}
                      leftIcon={<Play className="w-3 h-3 fill-current" />}
                      title={count === 0 ? 'Add test cases first' : 'Run all test cases in suite'}
                    >
                      Run Suite
                    </Button>

                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => navigate(`/testing/suites/${suite.id}`)}
                      rightIcon={<ChevronRight className="w-3 h-3" />}
                    >
                      Manage Tests ({count})
                    </Button>

                    <button
                      onClick={() => handleDuplicateSuite(suite)}
                      title="Duplicate Suite"
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setEditingSuite(suite);
                        setIsSuiteModalOpen(true);
                      }}
                      title="Edit Suite"
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeletingSuite(suite)}
                      title="Delete Suite"
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metadata Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase">Test Cases</span>
                    <p className="text-slate-800 dark:text-slate-200 font-semibold">{count} Configured</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase">Last Executed</span>
                    <p className="text-slate-800 dark:text-slate-200 font-semibold">{formatDate(suite.lastRunAt)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase">Execution Trigger</span>
                    <p className="text-slate-800 dark:text-slate-200 font-semibold">{suite.schedule || 'Manual'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase">Environment</span>
                    <p className="text-slate-800 dark:text-slate-200 font-semibold">{suite.environmentId || 'env-dev'}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={TestTube2}
          title={searchQuery ? 'No Matching Test Suites' : 'No Test Suites Configured'}
          description={
            searchQuery
              ? `No test suites match "${searchQuery}". Reset filters to browse all.`
              : 'Create automated test suites with HTTP status codes, latency thresholds, and JSON contract assertions.'
          }
          actionText={searchQuery ? 'Clear Search' : 'Create Test Suite'}
          onAction={
            searchQuery
              ? () => setSearchQuery('')
              : () => {
                  setEditingSuite(null);
                  setIsSuiteModalOpen(true);
                }
          }
        />
      )}

      {/* Create / Edit Suite Modal */}
      <TestSuiteModal
        isOpen={isSuiteModalOpen}
        onClose={() => {
          setIsSuiteModalOpen(false);
          setEditingSuite(null);
        }}
        onSubmit={handleSaveSuite}
        initialData={editingSuite}
        isEditing={Boolean(editingSuite)}
      />

      {/* Delete Suite Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingSuite)}
        onClose={() => setDeletingSuite(null)}
        onConfirm={handleDeleteSuite}
        title="Delete Test Suite?"
        message={`Are you sure you want to delete "${deletingSuite?.name}"? All test cases configured in this suite will be permanently removed.`}
        confirmText="Delete Suite"
        variant="danger"
      />

      {/* Factory Reset Confirmation */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetDefaults}
        title="Reset Test Suites to Factory Defaults?"
        message="This will restore the predefined Auth, Catalog, and Payments regression suites and sample assertion test cases."
        confirmText="Reset to Defaults"
        variant="warning"
      />

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

export default TestSuitesPage;
