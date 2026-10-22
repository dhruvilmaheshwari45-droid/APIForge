import React, { useState } from 'react';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../../common/Modal';
import Button from '../../common/Button';
import { StatusBadge, Badge } from '../../common/Badge';
import { generateRuleSummary } from '../../../services/mockServerService';
import { GitBranch, Copy, Check, Clock, Sparkles, Layers } from 'lucide-react';

export const RulePreviewModal = ({ isOpen, onClose, rule = null }) => {
  const [copied, setCopied] = useState(false);

  if (!rule) return null;

  const narrative = generateRuleSummary(rule);

  const handleCopyBody = () => {
    if (!rule.response?.body) return;
    navigator.clipboard.writeText(rule.response.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader onClose={onClose}>
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-brand-500/10 text-brand-500">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <ModalTitle>{rule.name}</ModalTitle>
              <Badge variant={rule.enabled ? 'success' : 'neutral'} size="sm">
                {rule.enabled ? 'Active' : 'Disabled'}
              </Badge>
              <Badge variant="primary" size="sm">
                Priority #{rule.priority || 1}
              </Badge>
            </div>
            <ModalDescription>
              {rule.description || 'Dynamic mock response condition and payload definition'}
            </ModalDescription>
          </div>
        </div>
      </ModalHeader>

      <ModalBody className="space-y-4">
        {/* Narrative Summary */}
        <div className="p-3.5 rounded-xl bg-brand-500/5 border border-brand-500/20 text-xs font-mono text-brand-600 dark:text-brand-300 space-y-1">
          <div className="flex items-center space-x-1.5 text-[10px] uppercase font-bold text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span>Evaluation Logic</span>
          </div>
          <p className="font-semibold leading-relaxed">{narrative}</p>
        </div>

        {/* Conditions Breakdown Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40 text-xs font-mono">
          <div className="p-2.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 flex justify-between">
            <span>IF Matching Conditions ({rule.conditions?.length || 0})</span>
            <span className="uppercase text-[10px] text-brand-600 dark:text-brand-400">{rule.matchLogic || 'AND'} MATCH</span>
          </div>

          <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {rule.conditions?.map((c, i) => (
              <div key={c.id || i} className="p-2.5 flex items-center justify-between">
                <span className="text-slate-500">#{i + 1} {c.type}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {c.field ? `"${c.field}" ` : ''}
                  <span className="text-cyan-500">{c.operator}</span>
                  {c.value ? ` "${c.value}"` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Response Action Result */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Response Status:</span>
              <StatusBadge status={rule.response?.status || 200} />
            </div>
            {rule.response?.delay > 0 && (
              <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{rule.response.delay}ms delay</span>
              </span>
            )}
          </div>

          {/* Body Preview */}
          {rule.response?.body && (
            <div>
              <div className="flex items-center justify-between mb-1 text-[11px] font-mono text-slate-400">
                <span>Payload ({rule.response.bodyType?.toUpperCase() || 'JSON'})</span>
                <button
                  type="button"
                  onClick={handleCopyBody}
                  className="text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 text-xs font-mono overflow-x-auto max-h-48 leading-relaxed">
                {rule.response.body}
              </pre>
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="primary" size="sm" onClick={onClose}>
          Close Preview
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default RulePreviewModal;
