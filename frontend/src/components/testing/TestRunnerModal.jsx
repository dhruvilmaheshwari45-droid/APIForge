import React, { useState, useEffect, useRef } from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../common/Modal';
import Button from '../common/Button';
import { MethodBadge, StatusBadge } from '../common/Badge';
import { useToast } from '../../context/ToastContext';
import testService from '../../services/testService';
import environmentService from '../../services/environmentService';
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  StopCircle,
  Sparkles,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Globe,
  Layers,
  Check
} from 'lucide-react';

export const TestRunnerModal = ({
  isOpen,
  onClose,
  suite = null,
  singleTestCase = null,
  environment = null,
  onRunFinished = null,
}) => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState([]);
  const [expandedCaseId, setExpandedCaseId] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [runSummary, setRunSummary] = useState(null);

  const abortControllerRef = useRef(null);
  const timerRef = useRef(null);

  const targetEnv = environment || environmentService.getActiveEnvironment();

  const startExecution = async () => {
    setIsRunning(true);
    setResults([]);
    setRunSummary(null);
    setElapsedMs(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const startTime = performance.now();
    timerRef.current = setInterval(() => {
      setElapsedMs(Math.round(performance.now() - startTime));
    }, 50);

    try {
      if (singleTestCase) {
        // Run Single Test Case
        setProgress({ current: 1, total: 1 });
        const res = await testService.executeTestCase(singleTestCase, targetEnv);
        setResults([res]);
        setExpandedCaseId(singleTestCase.id);

        const duration = Math.round(performance.now() - startTime);
        const summary = {
          total: 1,
          passed: res.status === 'passed' ? 1 : 0,
          failed: res.status === 'passed' ? 0 : 1,
          rate: res.status === 'passed' ? 100 : 0,
          duration,
          status: res.status,
        };
        setRunSummary(summary);
        toast[res.status === 'passed' ? 'success' : 'error'](
          `Test "${singleTestCase.name}" ${res.status === 'passed' ? 'Passed' : 'Failed'}`
        );
      } else if (suite) {
        // Run Full Suite
        const liveResults = [];
        const record = await testService.executeSuite(suite.id, {
          environment: targetEnv,
          abortSignal: controller.signal,
          onProgress: ({ current, total, testCase, result, phase }) => {
            setProgress({ current, total });
            if (phase === 'completed_case' && result) {
              liveResults.push(result);
              setResults([...liveResults]);
            }
          },
        });

        setRunSummary({
          total: record.totalTests,
          passed: record.passedCount,
          failed: record.failedCount,
          skipped: record.skippedCount,
          rate: record.successRate,
          duration: record.durationMs,
          status: record.status,
        });

        if (record.status === 'passed') {
          toast.success(`Suite "${suite.name}" passed! (100% success rate)`);
        } else {
          toast.warning(`Suite "${suite.name}" finished with ${record.failedCount} failure(s)`);
        }

        onRunFinished?.(record);
      }
    } catch (err) {
      toast.error('Execution halted: ' + err.message);
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen && (suite || singleTestCase)) {
      startExecution();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [isOpen, suite?.id, singleTestCase?.id]);

  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsRunning(false);
      toast.info('Test execution canceled');
    }
  };

  const toggleExpand = (id) => {
    setExpandedCaseId((prev) => (prev === id ? null : id));
  };

  return (
    <Modal isOpen={isOpen} onClose={isRunning ? undefined : onClose} size="xl">
      <ModalHeader
        title={singleTestCase ? `Running Test: ${singleTestCase.name}` : `Executing Suite: ${suite?.name}`}
        description={`Environment: ${targetEnv?.name || 'Default'} (${targetEnv?.baseUrl || ''})`}
        icon={Play}
      />

      <ModalBody className="space-y-5 max-h-[65vh] overflow-y-auto custom-scrollbar">
        {/* Progress & Live Metrics Bar */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {isRunning
                ? `Running Test ${progress.current} of ${progress.total}...`
                : runSummary
                ? `Run Complete (${runSummary.rate}% Success Rate)`
                : 'Preparing tests...'}
            </span>
            <span className="text-slate-500">
              Elapsed: {elapsedMs}ms
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                runSummary?.status === 'failed' ? 'bg-amber-500' : 'bg-brand-500'
              }`}
              style={{
                width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%',
              }}
            />
          </div>

          {/* Metrics Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-xs font-mono">
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Total Tests</span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{progress.total}</p>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-emerald-500 uppercase">Passed</span>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {results.filter((r) => r.status === 'passed').length}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-rose-500 uppercase">Failed</span>
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                {results.filter((r) => r.status === 'failed').length}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Success Rate</span>
              <p className="text-sm font-bold text-brand-600 dark:text-brand-400">
                {results.length > 0
                  ? `${Math.round((results.filter((r) => r.status === 'passed').length / results.length) * 100)}%`
                  : '0%'}
              </p>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
            Execution Log ({results.length} of {progress.total})
          </h4>

          {results.map((res) => {
            const isExpanded = expandedCaseId === res.testCaseId;

            return (
              <div
                key={res.testCaseId}
                className={`border rounded-xl overflow-hidden transition-all ${
                  res.status === 'passed'
                    ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    : 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
                }`}
              >
                {/* Result Row Header */}
                <div
                  onClick={() => toggleExpand(res.testCaseId)}
                  className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 gap-3"
                >
                  <div className="flex items-center space-x-3 truncate">
                    {res.status === 'passed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <MethodBadge method={res.method} size="xs" />
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 font-mono truncate">
                      {res.name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs font-mono shrink-0">
                    <StatusBadge status={res.responseStatus || (res.status === 'passed' ? 200 : 500)} />
                    <span className="text-slate-400 text-[11px]">{res.responseTimeMs}ms</span>
                    <span className="text-[11px] text-slate-500 hidden sm:inline">
                      {res.passedAssertions}/{res.assertionsCount} passed
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details & Assertions Breakdown */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3 text-xs font-mono">
                    <div className="text-[11px] text-slate-500 flex items-center space-x-2 truncate">
                      <span className="font-semibold text-slate-400">Target URL:</span>
                      <span className="truncate text-slate-700 dark:text-slate-300">{res.resolvedUrl || res.url}</span>
                    </div>

                    {res.error && (
                      <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] flex items-start space-x-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{res.error}</span>
                      </div>
                    )}

                    {/* Assertions Table */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Evaluated Assertions ({res.assertionResults?.length || 0})
                      </div>
                      {res.assertionResults && res.assertionResults.length > 0 ? (
                        <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                          {res.assertionResults.map((asrt, aidx) => (
                            <div
                              key={aidx}
                              className={`p-2.5 flex items-start justify-between gap-3 text-xs ${
                                asrt.passed ? '' : 'bg-rose-50/40 dark:bg-rose-950/20'
                              }`}
                            >
                              <div className="flex items-start space-x-2">
                                {asrt.passed ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                )}
                                <div>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {asrt.description || asrt.type}
                                  </span>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {asrt.message}
                                  </p>
                                </div>
                              </div>

                              <div className="text-[10px] text-right font-mono text-slate-400 shrink-0">
                                {asrt.expected !== undefined && asrt.expected !== '' && (
                                  <div>Expected: <span className="text-slate-600 dark:text-slate-300 font-bold">{String(asrt.expected)}</span></div>
                                )}
                                <div>Actual: <span className="text-slate-600 dark:text-slate-300">{JSON.stringify(asrt.actual)}</span></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic text-[11px]">No assertions defined</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ModalBody>

      <ModalFooter>
        {isRunning ? (
          <Button variant="danger" size="sm" onClick={handleAbort} leftIcon={<StopCircle className="w-3.5 h-3.5" />}>
            Cancel Run
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={startExecution} leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
            Re-run Tests
          </Button>
        )}
        <Button variant="primary" size="sm" onClick={onClose} disabled={isRunning}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default TestRunnerModal;
