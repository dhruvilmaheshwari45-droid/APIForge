import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import { MethodBadge, StatusBadge, Badge } from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  TestSuiteModal,
  TestCaseModal,
  TestRunnerModal,
} from '../../components/testing';
import { useToast } from '../../context/ToastContext';
import testService from '../../services/testService';
import environmentService from '../../services/environmentService';
import {
  TestTube2,
  ChevronLeft,
  Plus,
  Play,
  PlayCircle,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Clock,
  Globe,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sliders,
  Sparkles,
  Calendar
} from 'lucide-react';

export const TestSuiteDetailsPage = () => {
  const { suiteId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [suite, setSuite] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [environment, setEnvironment] = useState(null);

  // Modals
  const [isEditSuiteOpen, setIsEditSuiteOpen] = useState(false);
  const [isDeleteSuiteOpen, setIsDeleteSuiteOpen] = useState(false);
  const [isDeletingSuite, setIsDeletingSuite] = useState(false);

  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [deletingCase, setDeletingCase] = useState(null);

  // Test Runner Modal
  const [runnerState, setRunnerState] = useState({
    isOpen: false,
    suite: null,
    singleTestCase: null,
  });

  const loadData = () => {
    try {
      const s = testService.getSuiteById(suiteId);
      if (!s) {
        setSuite(null);
        return;
      }
      setSuite(s);

      const cases = testService.getTestCases(suiteId);
      setTestCases(cases);

      const env = environmentService.getEnvironmentById(s.environmentId) || environmentService.getActiveEnvironment();
      setEnvironment(env);
    } catch (err) {
      toast.error('Failed to load test suite: ' + err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [suiteId]);

  // Suite Actions
  const handleUpdateSuite = (formData) => {
    try {
      const updated = testService.updateSuite(suiteId, formData);
      setSuite(updated);
      toast.success(`Suite "${updated.name}" updated`);
      setIsEditSuiteOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error updating suite');
    }
  };

  const handleDeleteSuite = () => {
    try {
      setIsDeletingSuite(true);
      testService.deleteSuite(suiteId);
      toast.success(`Suite "${suite?.name}" deleted`);
      navigate('/testing/suites');
    } catch (err) {
      toast.error(err.message || 'Error deleting suite');
    } finally {
      setIsDeletingSuite(false);
      setIsDeleteSuiteOpen(false);
    }
  };

  // Test Case Actions
  const handleSaveTestCase = (formData) => {
    try {
      if (editingCase) {
        testService.updateTestCase(editingCase.id, formData);
        toast.success(`Test case "${formData.name}" updated`);
      } else {
        testService.createTestCase(formData);
        toast.success(`Test case "${formData.name}" added to suite`);
      }
      loadData();
      setIsCaseModalOpen(false);
      setEditingCase(null);
    } catch (err) {
      toast.error(err.message || 'Error saving test case');
    }
  };

  const handleDeleteTestCase = () => {
    if (!deletingCase) return;
    try {
      testService.deleteTestCase(deletingCase.id);
      toast.success(`Test case "${deletingCase.name}" removed`);
      setDeletingCase(null);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error deleting test case');
    }
  };

  const handleToggleCaseEnabled = (tc) => {
    try {
      testService.toggleTestCaseEnabled(tc.id);
      loadData();
      toast.success(`Test case "${tc.name}" ${!tc.enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error('Error toggling test case state');
    }
  };

  const handleMoveCase = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= testCases.length) return;

    const copy = [...testCases];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);

    const reorderedIds = copy.map((c) => c.id);
    testService.reorderTestCases(suiteId, reorderedIds);
    loadData();
    toast.info('Test execution sequence updated');
  };

  // Runner Actions
  const handleRunFullSuite = () => {
    setRunnerState({
      isOpen: true,
      suite,
      singleTestCase: null,
    });
  };

  const handleRunSingleTest = (tc) => {
    setRunnerState({
      isOpen: true,
      suite,
      singleTestCase: tc,
    });
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'Never executed';
    try {
      return new Date(isoStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Never executed';
    }
  };

  if (!suite) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/testing/suites')}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          Back to Test Suites
        </Button>
        <EmptyState
          icon={TestTube2}
          title="Test Suite Not Found"
          description={`The test suite with ID "${suiteId}" does not exist or has been deleted.`}
          actionText="Go to Test Suites"
          onAction={() => navigate('/testing/suites')}
        />
      </div>
    );
  }

  const enabledCount = testCases.filter((c) => c.enabled !== false).length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
          <Link
            to="/testing/suites"
            className="hover:text-slate-900 dark:hover:text-slate-200 flex items-center space-x-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Test Suites</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {suite.name}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleRunFullSuite}
            disabled={enabledCount === 0}
            leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
          >
            Run Suite ({enabledCount})
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditSuiteOpen(true)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit Suite
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDeleteSuiteOpen(true)}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Suite Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-3 flex-wrap gap-y-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <TestTube2 className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                {suite.name}
              </h1>
              <StatusBadge status={suite.lastStatus || 'untested'} />
              {suite.passRate !== null && (
                <Badge variant="info" size="sm">
                  {suite.passRate}% Pass Rate
                </Badge>
              )}
              <Badge variant="neutral" size="sm">
                Trigger: {suite.schedule || 'Manual'}
              </Badge>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              {suite.description || 'No description provided for this test suite.'}
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEditingCase(null);
              setIsCaseModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Test Case
          </Button>
        </div>

        {/* Metadata Strip */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-2">
            <Globe className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-slate-400">Target Environment:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {environment?.name || 'Development'} ({environment?.baseUrl || 'http://localhost'})
            </span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Last Run: {formatDate(suite.lastRunAt)}</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-brand-500" />
              <span>{testCases.length} Test Cases ({enabledCount} active)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Test Cases List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-mono">
              Test Cases Sequence ({testCases.length})
            </h3>
            <p className="text-xs text-slate-500">
              Tests are executed sequentially top-to-bottom during automated runs
            </p>
          </div>

          <Link
            to="/testing/runs"
            className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1 font-mono"
          >
            <span>View Historical Runs</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {testCases.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
            {testCases.map((tc, index) => (
              <div
                key={tc.id}
                className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  !tc.enabled ? 'opacity-60 bg-slate-50/40 dark:bg-slate-950/20' : ''
                }`}
              >
                {/* Left Section: Reordering + Method + Info */}
                <div className="flex items-start md:items-center space-x-3">
                  {/* Sequence Order & Move Controls */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-xs font-bold flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleMoveCase(index, -1)}
                        disabled={index === 0}
                        className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMoveCase(index, 1)}
                        disabled={index === testCases.length - 1}
                        className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <MethodBadge method={tc.method} size="sm" />

                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                        {tc.name}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="font-mono text-xs text-slate-500 truncate max-w-xs sm:max-w-md">
                        {tc.url}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 mt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 flex-wrap gap-y-1">
                      <span className="flex items-center space-x-1 text-brand-600 dark:text-brand-400 font-semibold bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{tc.assertions?.length || 0} Assertions</span>
                      </span>

                      {tc.bodyType && tc.bodyType !== 'none' && (
                        <span>Body: {tc.bodyType.toUpperCase()}</span>
                      )}

                      {tc.description && (
                        <span className="font-sans line-clamp-1 max-w-sm text-slate-400">
                          {tc.description}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Section: Actions */}
                <div className="flex items-center space-x-2 self-end md:self-center shrink-0">
                  {/* Enable / Disable Switch */}
                  <label className="flex items-center space-x-1.5 cursor-pointer mr-1">
                    <input
                      type="checkbox"
                      checked={tc.enabled !== false}
                      onChange={() => handleToggleCaseEnabled(tc)}
                      className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-[11px] font-mono text-slate-500">
                      {tc.enabled !== false ? 'Active' : 'Skipped'}
                    </span>
                  </label>

                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleRunSingleTest(tc)}
                    leftIcon={<Play className="w-3 h-3 text-emerald-500" />}
                  >
                    Run Test
                  </Button>

                  <button
                    onClick={() => {
                      setEditingCase(tc);
                      setIsCaseModalOpen(true);
                    }}
                    title="Edit Test Case"
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setDeletingCase(tc)}
                    title="Delete Test Case"
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
            icon={TestTube2}
            title="No Test Cases in Suite"
            description="Add test cases with expected HTTP statuses, response latency thresholds, and contract assertions."
            actionText="Add First Test Case"
            onAction={() => {
              setEditingCase(null);
              setIsCaseModalOpen(true);
            }}
          />
        )}
      </div>

      {/* Edit Suite Modal */}
      <TestSuiteModal
        isOpen={isEditSuiteOpen}
        onClose={() => setIsEditSuiteOpen(false)}
        onSubmit={handleUpdateSuite}
        initialData={suite}
        isEditing={true}
      />

      {/* Delete Suite Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteSuiteOpen}
        onClose={() => setIsDeleteSuiteOpen(false)}
        onConfirm={handleDeleteSuite}
        title="Delete Test Suite?"
        message={`Are you sure you want to delete "${suite.name}"? All ${testCases.length} test cases within this suite will be permanently removed.`}
        confirmText="Delete Suite"
        variant="danger"
        loading={isDeletingSuite}
      />

      {/* Create / Edit Test Case Modal */}
      <TestCaseModal
        isOpen={isCaseModalOpen}
        onClose={() => {
          setIsCaseModalOpen(false);
          setEditingCase(null);
        }}
        onSubmit={handleSaveTestCase}
        suiteId={suiteId}
        initialData={editingCase}
        isEditing={Boolean(editingCase)}
      />

      {/* Delete Test Case Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingCase)}
        onClose={() => setDeletingCase(null)}
        onConfirm={handleDeleteTestCase}
        title="Delete Test Case?"
        message={`Are you sure you want to remove "${deletingCase?.name}" from this suite?`}
        confirmText="Delete Test Case"
        variant="danger"
      />

      {/* Test Runner Modal */}
      <TestRunnerModal
        isOpen={runnerState.isOpen}
        onClose={() => {
          setRunnerState({ isOpen: false, suite: null, singleTestCase: null });
          loadData();
        }}
        suite={runnerState.suite}
        singleTestCase={runnerState.singleTestCase}
        environment={environment}
        onRunFinished={() => loadData()}
      />
    </div>
  );
};

export default TestSuiteDetailsPage;
