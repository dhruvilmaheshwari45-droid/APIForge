import React, { useState } from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../common/Modal';
import Button from '../common/Button';
import { MethodBadge, StatusBadge } from '../common/Badge';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  Layers,
  ChevronDown,
  ChevronRight,
  Check,
  AlertTriangle
} from 'lucide-react';

export const TestRunDetailsModal = ({ isOpen, onClose, run = null }) => {
  const [expandedCaseId, setExpandedCaseId] = useState(null);

  if (!run) return null;

  const toggleExpand = (id) => {
    setExpandedCaseId((prev) => (prev === id ? null : id));
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalHeader
        title={`Test Run: ${run.suiteName}`}
        description={`Executed on ${formatDate(run.executedAt)} • ${run.environmentName || 'Development'}`}
        icon={History}
      />

      <ModalBody className="space-y-5 max-h-[65vh] overflow-y-auto custom-scrollbar">
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase">Outcome</span>
            <div className="mt-1">
              <StatusBadge status={run.status} />
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-emerald-500 uppercase">Passed</span>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {run.passedCount} / {run.totalTests}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-brand-500 uppercase">Pass Rate</span>
            <p className="text-sm font-bold text-brand-600 dark:text-brand-400 mt-1">
              {run.successRate}%
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase">Total Duration</span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
              {run.durationMs}ms
            </p>
          </div>
        </div>

        {/* Detailed Test Results */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
            Recorded Test Outcomes ({run.details?.length || 0})
          </h4>

          {run.details && run.details.length > 0 ? (
            run.details.map((item, idx) => {
              const isExpanded = expandedCaseId === (item.testCaseId || idx);

              return (
                <div
                  key={idx}
                  className={`border rounded-xl overflow-hidden transition-all ${
                    item.status === 'passed'
                      ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                      : 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
                  }`}
                >
                  <div
                    onClick={() => toggleExpand(item.testCaseId || idx)}
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 gap-3"
                  >
                    <div className="flex items-center space-x-3 truncate">
                      {item.status === 'passed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <MethodBadge method={item.method} size="xs" />
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 font-mono truncate">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs font-mono shrink-0">
                      <StatusBadge status={item.responseStatus || (item.status === 'passed' ? 200 : 500)} />
                      <span className="text-slate-400 text-[11px]">{item.responseTimeMs || item.durationMs}ms</span>
                      <span className="text-[11px] text-slate-500 hidden sm:inline">
                        {item.passedAssertions || (item.status === 'passed' ? 1 : 0)}/{item.assertionsCount || 1} passed
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3 text-xs font-mono">
                      <div className="text-[11px] text-slate-500 flex items-center space-x-2 truncate">
                        <span className="font-semibold text-slate-400">Endpoint:</span>
                        <span className="truncate text-slate-700 dark:text-slate-300">{item.resolvedUrl || item.url || 'N/A'}</span>
                      </div>

                      {item.error && (
                        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] flex items-start space-x-2">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{item.error}</span>
                        </div>
                      )}

                      {/* Assertions Table */}
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Assertions Breakdown
                        </div>
                        {item.assertionResults && item.assertionResults.length > 0 ? (
                          <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                            {item.assertionResults.map((asrt, aidx) => (
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
                          <p className="text-slate-400 italic text-[11px]">No individual assertion breakdown available</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-400 font-mono italic">No test case details logged for this run.</p>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="primary" size="sm" onClick={onClose}>
          Close Log
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default TestRunDetailsModal;
