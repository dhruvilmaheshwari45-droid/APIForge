import React, { useState, useMemo } from 'react';
import Button from '../common/Button';
import { Badge } from '../common/Badge';
import ConfirmDialog from '../common/ConfirmDialog';
import VariableModal from './VariableModal';
import { useToast } from '../../context/ToastContext';
import { detectDuplicateKeys } from '../../services/environmentService';
import {
  KeyRound,
  Plus,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  AlertTriangle,
  Sparkles,
  Info
} from 'lucide-react';

export const EnvironmentVariablesTable = ({
  environment,
  onAddVariable,
  onUpdateVariable,
  onDeleteVariable,
}) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllSecrets, setShowAllSecrets] = useState(false);
  const [revealedVarIds, setRevealedVarIds] = useState(new Set());
  const [copiedKey, setCopiedKey] = useState(null);

  // Modals inside table
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariable, setEditingVariable] = useState(null);
  const [deletingVariable, setDeletingVariable] = useState(null);

  const variables = environment?.variables || [];
  const duplicateKeys = useMemo(() => detectDuplicateKeys(variables), [variables]);

  const filteredVariables = useMemo(() => {
    return variables.filter((v) => {
      const matchKey = (v.key || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchDesc = (v.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchVal = !v.isSecret && (String(v.value || '')).toLowerCase().includes(searchQuery.toLowerCase());
      return matchKey || matchDesc || matchVal;
    });
  }, [variables, searchQuery]);

  const handleCopySnippet = (key) => {
    const snippet = `{{${key}}}`;
    navigator.clipboard.writeText(snippet);
    setCopiedKey(key);
    toast.info(`Copied ${snippet} to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleRevealSingle = (id) => {
    setRevealedVarIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleEnabled = (v) => {
    onUpdateVariable(v.id, { enabled: !v.enabled });
    toast.success(`Variable {{${v.key}}} ${!v.enabled ? 'enabled' : 'disabled'}`);
  };

  const handleSaveVariable = (formData) => {
    if (editingVariable) {
      onUpdateVariable(editingVariable.id, formData);
      toast.success(`Variable {{${formData.key}}} updated`);
    } else {
      onAddVariable(formData);
      toast.success(`Variable {{${formData.key}}} added`);
    }
    setIsModalOpen(false);
    setEditingVariable(null);
  };

  const handleDeleteVariable = () => {
    if (!deletingVariable) return;
    onDeleteVariable(deletingVariable.id);
    toast.success(`Variable {{${deletingVariable.key}}} removed`);
    setDeletingVariable(null);
  };

  const handleQuickAddPreset = (keyName, defaultValue, isSecretDefault = false) => {
    onAddVariable({
      key: keyName,
      value: defaultValue,
      isSecret: isSecretDefault,
      enabled: true,
      description: `Preset ${keyName}`,
    });
    toast.success(`Added preset {{${keyName}}}`);
  };

  return (
    <div className="space-y-4">
      {/* Duplicate Key Warning Banner */}
      {duplicateKeys.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-mono flex items-start space-x-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <div className="space-y-1">
            <span className="font-bold">Duplicate Variable Keys Detected:</span>
            <p className="text-[11px] leading-relaxed">
              The following keys are defined multiple times: <strong>{duplicateKeys.join(', ')}</strong>. During request execution, the last defined variable will take precedence. Consider removing duplicates.
            </p>
          </div>
        </div>
      )}

      {/* Action Header & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search variables by key or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 font-mono"
          />
        </div>

        <div className="flex items-center space-x-2">
          {variables.some((v) => v.isSecret) && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => setShowAllSecrets(!showAllSecrets)}
              leftIcon={showAllSecrets ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            >
              {showAllSecrets ? 'Hide All Secrets' : 'Show All Secrets'}
            </Button>
          )}

          <Button
            variant="primary"
            size="xs"
            onClick={() => {
              setEditingVariable(null);
              setIsModalOpen(true);
            }}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Variable
          </Button>
        </div>
      </div>

      {/* Variables Table */}
      {filteredVariables.length > 0 ? (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3 w-10 text-center">Active</th>
                  <th className="p-3">Variable Key</th>
                  <th className="p-3">Value</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                {filteredVariables.map((v) => {
                  const isMasked = v.isSecret && !showAllSecrets && !revealedVarIds.has(v.id);
                  const isDuplicate = duplicateKeys.includes(v.key?.trim());

                  return (
                    <tr
                      key={v.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        !v.enabled ? 'opacity-60 bg-slate-50/40 dark:bg-slate-950/20' : ''
                      }`}
                    >
                      {/* Active Toggle */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={v.enabled !== false}
                          onChange={() => handleToggleEnabled(v)}
                          className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500 cursor-pointer"
                          title={v.enabled ? 'Enabled for substitution' : 'Disabled'}
                        />
                      </td>

                      {/* Variable Key with Copy Snippet */}
                      <td className="p-3 font-semibold">
                        <div className="flex items-center space-x-1.5">
                          <span
                            onClick={() => handleCopySnippet(v.key)}
                            className="text-brand-600 dark:text-brand-400 cursor-pointer hover:underline flex items-center space-x-1"
                            title="Click to copy {{KEY}}"
                          >
                            <span>&#123;&#123;{v.key}&#125;&#125;</span>
                          </span>
                          <button
                            onClick={() => handleCopySnippet(v.key)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            title="Copy snippet"
                          >
                            {copiedKey === v.key ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          {isDuplicate && (
                            <span className="px-1.5 py-0.2 text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded font-bold">
                              DUPLICATE
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Variable Value (Masked/Unmasked) */}
                      <td className="p-3">
                        <div className="flex items-center space-x-2 max-w-xs sm:max-w-md">
                          <span className="truncate text-slate-800 dark:text-slate-200">
                            {isMasked ? '••••••••••••••••' : v.value || <span className="text-slate-400 italic">empty</span>}
                          </span>
                          {v.isSecret && (
                            <button
                              onClick={() => toggleRevealSingle(v.id)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0 p-1"
                              title={isMasked ? 'Reveal secret' : 'Mask secret'}
                            >
                              {isMasked ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="p-3">
                        {v.isSecret ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-semibold">
                            <Lock className="w-3 h-3" />
                            <span>Secret</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-medium">
                            <Unlock className="w-3 h-3" />
                            <span>Plaintext</span>
                          </span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="p-3 text-slate-500 dark:text-slate-400 font-sans text-xs max-w-xs truncate">
                        {v.description || <span className="text-slate-400 italic font-mono text-[11px]">—</span>}
                      </td>

                      {/* Row Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => {
                              setEditingVariable(v);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Edit Variable"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingVariable(v)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                            title="Delete Variable"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 space-y-3">
          <KeyRound className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono">
              {searchQuery ? 'No Matching Variables' : 'No Variables Configured'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchQuery
                ? `No variables match "${searchQuery}". Clear your search query.`
                : 'Define variables such as BASE_URL, API_KEY, or tokens for parameterized API calls.'}
            </p>
          </div>

          {!searchQuery && (
            <div className="pt-2 flex items-center justify-center space-x-2 flex-wrap gap-y-2">
              <Button
                variant="primary"
                size="xs"
                onClick={() => {
                  setEditingVariable(null);
                  setIsModalOpen(true);
                }}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Custom Variable
              </Button>
              <button
                onClick={() => handleQuickAddPreset('BASE_URL', environment?.baseUrl || 'https://api.example.com')}
                className="px-2.5 py-1 text-xs font-mono rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                + &#123;&#123;BASE_URL&#125;&#125;
              </button>
              <button
                onClick={() => handleQuickAddPreset('API_KEY', 'ak_sample_key_123', true)}
                className="px-2.5 py-1 text-xs font-mono rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                + &#123;&#123;API_KEY&#125;&#125;
              </button>
              <button
                onClick={() => handleQuickAddPreset('TOKEN', 'jwt_bearer_sample_token', true)}
                className="px-2.5 py-1 text-xs font-mono rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                + &#123;&#123;TOKEN&#125;&#125;
              </button>
              <button
                onClick={() => handleQuickAddPreset('USER_ID', 'usr_sample_1001')}
                className="px-2.5 py-1 text-xs font-mono rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                + &#123;&#123;USER_ID&#125;&#125;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Variable Modal */}
      <VariableModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingVariable(null);
        }}
        onSubmit={handleSaveVariable}
        existingVariables={variables}
        initialData={editingVariable}
        isEditing={Boolean(editingVariable)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingVariable)}
        onClose={() => setDeletingVariable(null)}
        onConfirm={handleDeleteVariable}
        title="Delete Variable?"
        message={`Are you sure you want to remove {{${deletingVariable?.key}}} from "${environment?.name}"? Any requests referencing this variable will fail substitution.`}
        confirmText="Delete Variable"
        variant="danger"
      />
    </div>
  );
};

export default EnvironmentVariablesTable;
