import React, { useState, useEffect } from 'react';
import { MethodBadge, StatusBadge, Badge } from '../../common/Badge';
import Button from '../../common/Button';
import ConfirmDialog from '../../common/ConfirmDialog';
import MockRuleModal from './MockRuleModal';
import RulePreviewModal from './RulePreviewModal';
import { useToast } from '../../../context/ToastContext';
import mockServerService, { generateRuleSummary } from '../../../services/mockServerService';
import {
  GitBranch,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Eye,
  Check,
  X,
  Clock,
  Sparkles,
  Sliders,
  Layers,
  Info,
  CornerDownRight,
  ShieldAlert
} from 'lucide-react';

export const EndpointRulesDrawer = ({
  isOpen = false,
  onClose,
  endpoint = null,
  server = null,
  onEndpointUpdated,
}) => {
  const { toast } = useToast();
  const [rules, setRules] = useState([]);

  // Modals inside drawer
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [previewingRule, setPreviewingRule] = useState(null);
  const [deletingRule, setDeletingRule] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadRules = () => {
    if (!endpoint) return;
    const list = mockServerService.getRulesByEndpoint(endpoint.id);
    setRules(list);
  };

  useEffect(() => {
    if (isOpen && endpoint) {
      loadRules();
    }
  }, [isOpen, endpoint]);

  const handleToggleRule = (id) => {
    try {
      const updated = mockServerService.toggleRuleStatus(id);
      loadRules();
      if (onEndpointUpdated) onEndpointUpdated();
      toast.success(`Rule "${updated.name}" is now ${updated.enabled ? 'Active' : 'Disabled'}`);
    } catch (err) {
      toast.error('Error toggling rule status');
    }
  };

  const handleMoveRule = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= rules.length) return;

    const copy = [...rules];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);

    const reorderedIds = copy.map((r) => r.id);
    mockServerService.reorderRules(endpoint.id, reorderedIds);
    loadRules();
    if (onEndpointUpdated) onEndpointUpdated();
    toast.info('Rule evaluation priority updated');
  };

  const handleSaveRule = async (formData) => {
    try {
      if (editingRule) {
        mockServerService.updateRule(editingRule.id, formData);
        toast.success(`Rule "${formData.name}" updated`);
      } else {
        mockServerService.createRule({
          ...formData,
          endpointId: endpoint.id,
          serverId: endpoint.serverId,
        });
        toast.success(`Rule "${formData.name}" created`);
      }
      loadRules();
      if (onEndpointUpdated) onEndpointUpdated();
      setIsRuleModalOpen(false);
      setEditingRule(null);
    } catch (err) {
      toast.error(err.message || 'Failed to save rule');
    }
  };

  const handleDeleteRule = async () => {
    if (!deletingRule) return;
    try {
      setIsDeleting(true);
      mockServerService.deleteRule(deletingRule.id);
      loadRules();
      if (onEndpointUpdated) onEndpointUpdated();
      toast.success(`Rule "${deletingRule.name}" deleted`);
      setDeletingRule(null);
    } catch (err) {
      toast.error(err.message || 'Error deleting rule');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !endpoint) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col z-10 animate-slideDown">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <MethodBadge method={endpoint.method} size="sm" />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-mono">
                  {endpoint.path}
                </h3>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs text-slate-500 font-sans">{endpoint.name}</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {server?.name || 'Mock Server'} • Dynamic Response Rules ({rules.length})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="primary"
              size="xs"
              onClick={() => {
                setEditingRule(null);
                setIsRuleModalOpen(true);
              }}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Rule
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informative Priority Notice */}
        <div className="p-3 bg-brand-500/5 border-b border-brand-500/10 text-xs font-mono text-slate-600 dark:text-slate-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-brand-500 shrink-0" />
            <span>Rules evaluate sequentially by priority (#1 first). First match returns.</span>
          </div>
          <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold uppercase">
            Top-Down Priority
          </span>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* Rules List */}
          {rules.length > 0 ? (
            <div className="space-y-3">
              {rules.map((rule, index) => {
                const narrative = generateRuleSummary(rule);
                const isFirst = index === 0;
                const isLast = index === rules.length - 1;

                return (
                  <div
                    key={rule.id}
                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                      rule.enabled
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                        : 'bg-slate-100/50 dark:bg-slate-950/60 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                    }`}
                  >
                    {/* Top Rule Strip: Priority & Reordering & Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {/* Priority Badge */}
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                          #{index + 1} Priority
                        </span>

                        <h4 className="font-bold text-xs font-mono text-slate-900 dark:text-slate-100">
                          {rule.name}
                        </h4>

                        {!rule.enabled && (
                          <Badge variant="neutral" size="sm">
                            Disabled
                          </Badge>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex items-center space-x-1">
                        {/* Priority Shift Buttons */}
                        <button
                          type="button"
                          onClick={() => handleMoveRule(index, -1)}
                          disabled={isFirst}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                          title="Increase Priority (Move Up)"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveRule(index, 1)}
                          disabled={isLast}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                          title="Decrease Priority (Move Down)"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        <span className="text-slate-300 dark:text-slate-700 px-0.5">•</span>

                        {/* Enable/Disable Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleRule(rule.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border transition-colors ${
                            rule.enabled
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {rule.enabled ? 'Active' : 'Disabled'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setPreviewingRule(rule)}
                          className="p-1.5 text-slate-400 hover:text-brand-500 rounded"
                          title="Preview full response"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingRule(rule);
                            setIsRuleModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                          title="Edit rule"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingRule(rule)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded"
                          title="Delete rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Human-Readable Logic Banner */}
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 font-mono text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                      <div className="flex items-center space-x-1.5 text-[10px] uppercase font-bold text-slate-400">
                        <Sparkles className="w-3 h-3 text-brand-500" />
                        <span>Condition Logic ({rule.matchLogic || 'AND'})</span>
                      </div>
                      <p className="leading-relaxed font-semibold text-slate-800 dark:text-slate-200">
                        {narrative}
                      </p>
                    </div>

                    {/* Response Action Summary Badges */}
                    <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-slate-500">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400">Response:</span>
                        <StatusBadge status={rule.response?.status || 200} />
                        {rule.response?.delay > 0 && (
                          <span className="flex items-center space-x-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{rule.response.delay}ms</span>
                          </span>
                        )}
                        <span>Payload: {rule.response?.bodyType?.toUpperCase() || 'JSON'}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPreviewingRule(rule)}
                        className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-0.5"
                      >
                        <span>Inspect Payload</span>
                        <CornerDownRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2 font-mono text-xs text-slate-500">
              <GitBranch className="w-8 h-8 mx-auto text-slate-400 opacity-50" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                No Dynamic Rules Configured
              </p>
              <p className="max-w-sm mx-auto text-[11px] text-slate-400">
                Incoming calls will always trigger the endpoint's default fallback response. Add a rule to return customized payloads or status codes based on headers, query params, or body values.
              </p>
              <div className="pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="xs"
                  onClick={() => {
                    setEditingRule(null);
                    setIsRuleModalOpen(true);
                  }}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Create First Rule
                </Button>
              </div>
            </div>
          )}

          {/* SECTION: Default Fallback Response Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Fallback
                </span>
                <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                  Default Fallback Response
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Triggered when no above rules match
              </span>
            </div>

            <p className="text-[11px] text-slate-500 font-sans">
              Configured directly on the endpoint definition.
            </p>

            <div className="flex items-center space-x-3 pt-1 text-xs font-mono">
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400">Status:</span>
                <StatusBadge status={endpoint.responseStatus || 200} />
              </div>
              {endpoint.responseDelay > 0 && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-500">{endpoint.responseDelay}ms delay</span>
                </div>
              )}
              <span className="text-slate-500">
                Body: {endpoint.responseBodyType?.toUpperCase() || 'JSON'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit Rule Modal */}
      <MockRuleModal
        isOpen={isRuleModalOpen}
        onClose={() => {
          setIsRuleModalOpen(false);
          setEditingRule(null);
        }}
        onSubmit={handleSaveRule}
        endpoint={endpoint}
        initialData={editingRule}
        isEditing={Boolean(editingRule)}
      />

      {/* Rule Preview Modal */}
      <RulePreviewModal
        isOpen={Boolean(previewingRule)}
        onClose={() => setPreviewingRule(null)}
        rule={previewingRule}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingRule)}
        onClose={() => setDeletingRule(null)}
        onConfirm={handleDeleteRule}
        title="Delete Response Rule?"
        message={`Are you sure you want to delete the rule "${deletingRule?.name}"?`}
        confirmText="Delete Rule"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default EndpointRulesDrawer;
