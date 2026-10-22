import React, { useState, useMemo } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EnvironmentModal from '../../components/environments/EnvironmentModal';
import EnvironmentVariablesTable from '../../components/environments/EnvironmentVariablesTable';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import environmentService from '../../services/environmentService';
import {
  Layers,
  Plus,
  Search,
  Globe,
  Copy,
  Check,
  Edit2,
  Trash2,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Lock,
  FileCode2,
  AlertTriangle
} from 'lucide-react';

export const EnvironmentsPage = () => {
  const { toast } = useToast();
  const {
    environments,
    selectedEnvironment,
    setSelectedEnvironment,
    refreshEnvironments,
  } = useApp();

  // Currently focused environment in the UI for inspecting variables
  const [focusedEnvId, setFocusedEnvId] = useState(
    selectedEnvironment?.id || (environments && environments[0]?.id) || 'env-dev'
  );

  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false);
  const [editingEnv, setEditingEnv] = useState(null);
  const [deletingEnv, setDeletingEnv] = useState(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Active focused environment object
  const currentEnv = useMemo(() => {
    return environments.find((e) => e.id === focusedEnvId) || environments[0] || null;
  }, [environments, focusedEnvId]);

  // Filtered environments for list
  const filteredEnvironments = useMemo(() => {
    return (environments || []).filter((e) => {
      const matchName = e.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDesc = (e.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchUrl = (e.baseUrl || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchName || matchDesc || matchUrl;
    });
  }, [environments, searchQuery]);

  // Handle switching active environment (Global target)
  const handleSetActive = (env) => {
    try {
      setSelectedEnvironment(env.id);
      setFocusedEnvId(env.id);
      toast.success(`Active environment set to "${env.name}"`);
    } catch (err) {
      toast.error('Failed to set active environment: ' + err.message);
    }
  };

  // Create or Update Environment
  const handleSaveEnvironment = (formData) => {
    try {
      if (editingEnv) {
        const updated = environmentService.updateEnvironment(editingEnv.id, formData);
        refreshEnvironments();
        setFocusedEnvId(updated.id);
        toast.success(`Environment "${updated.name}" updated`);
      } else {
        const created = environmentService.createEnvironment(formData);
        refreshEnvironments();
        setFocusedEnvId(created.id);
        toast.success(`Environment "${created.name}" created`);
      }
      setIsEnvModalOpen(false);
      setEditingEnv(null);
    } catch (err) {
      toast.error(err.message || 'Error saving environment');
    }
  };

  // Duplicate Environment
  const handleDuplicateEnvironment = (env) => {
    try {
      const cloned = environmentService.duplicateEnvironment(env.id);
      refreshEnvironments();
      setFocusedEnvId(cloned.id);
      toast.success(`Duplicated "${env.name}" into "${cloned.name}"`);
    } catch (err) {
      toast.error('Error duplicating environment: ' + err.message);
    }
  };

  // Delete Environment
  const handleDeleteEnvironment = () => {
    if (!deletingEnv) return;
    try {
      const res = environmentService.deleteEnvironment(deletingEnv.id);
      refreshEnvironments();
      setFocusedEnvId(res.nextActiveId);
      toast.success(`Environment "${deletingEnv.name}" deleted`);
      setDeletingEnv(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete environment');
    }
  };

  // Factory Reset to Defaults
  const handleResetDefaults = () => {
    try {
      environmentService.resetToDefaults();
      refreshEnvironments();
      setFocusedEnvId('env-dev');
      toast.success('Environments reset to predefined templates (Development, Staging, Production)');
      setIsResetConfirmOpen(false);
    } catch (err) {
      toast.error('Reset failed: ' + err.message);
    }
  };

  // Variable Actions
  const handleAddVariable = (varData) => {
    if (!currentEnv) return;
    environmentService.addVariable(currentEnv.id, varData);
    refreshEnvironments();
  };

  const handleUpdateVariable = (varId, updates) => {
    if (!currentEnv) return;
    environmentService.updateVariable(currentEnv.id, varId, updates);
    refreshEnvironments();
  };

  const handleDeleteVariable = (varId) => {
    if (!currentEnv) return;
    environmentService.deleteVariable(currentEnv.id, varId);
    refreshEnvironments();
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      return new Date(isoStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Environment Management"
        subtitle="Configure scoped environments, manage variable sets (BASE_URL, API_KEY, TOKEN), and parameterize request executions"
        actions={
          <div className="flex items-center space-x-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingEnv(null);
                setIsEnvModalOpen(true);
              }}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Create Environment
            </Button>
          </div>
        }
      />

      {/* Security Disclaimer Banner */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono flex items-start space-x-3 shadow-xs">
        <ShieldAlert className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-100">Security Architecture & Secrets Policy:</span>
            <Badge variant="warning" size="xs">Local Simulated Storage</Badge>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            APIForge stores frontend configuration in local storage for developer simulation and testing. Local storage is unencrypted; do not persist real production tokens or sensitive credentials here. All pre-configured keys are simulated demonstration values. Secrets are masked in the UI and telemetry logs.
          </p>
        </div>
      </div>

      {/* Main Workspace Layout */}
      {environments && environments.length > 0 && currentEnv ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Environments Directory */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                Environments ({environments.length})
              </h3>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter environments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 font-mono shadow-xs"
              />
            </div>

            {/* Environment Cards List */}
            <div className="space-y-2.5">
              {filteredEnvironments.map((env) => {
                const isSelected = currentEnv?.id === env.id;
                const isActive = selectedEnvironment?.id === env.id;

                return (
                  <div
                    key={env.id}
                    onClick={() => setFocusedEnvId(env.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 border-brand-500 shadow-md ring-1 ring-brand-500/20'
                        : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            env.name === 'Production'
                              ? 'bg-rose-500'
                              : env.name === 'Staging'
                              ? 'bg-indigo-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 font-mono text-xs">
                          {env.name}
                        </h4>
                      </div>

                      {isActive && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold shrink-0">
                          <Check className="w-3 h-3" />
                          <span>Active Target</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate mb-2">
                      {env.baseUrl}
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      <span>{env.variables?.length || 0} variables</span>

                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        {!isActive && (
                          <button
                            onClick={() => handleSetActive(env)}
                            className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                          >
                            Set Active
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredEnvironments.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400 font-mono border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No environments match "{searchQuery}"
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Selected Environment Details & Variables Editor */}
          <div className="lg:col-span-8 space-y-5">
            {/* Environment Overview Header Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {currentEnv.name}
                    </h2>
                    {selectedEnvironment?.id === currentEnv.id ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>Active Target Environment</span>
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleSetActive(currentEnv)}
                        leftIcon={<Check className="w-3 h-3" />}
                      >
                        Set as Active Target
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                    {currentEnv.description || 'No description configured for this environment.'}
                  </p>
                </div>

                {/* Environment Card Actions */}
                <div className="flex items-center space-x-1.5 self-end sm:self-center shrink-0">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleDuplicateEnvironment(currentEnv)}
                    leftIcon={<Copy className="w-3 h-3" />}
                    title="Duplicate this environment and its variables"
                  >
                    Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      setEditingEnv(currentEnv);
                      setIsEnvModalOpen(true);
                    }}
                    leftIcon={<Edit2 className="w-3 h-3" />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => setDeletingEnv(currentEnv)}
                    leftIcon={<Trash2 className="w-3 h-3" />}
                    disabled={environments.length <= 1}
                    title={environments.length <= 1 ? 'Cannot delete the only environment' : 'Delete environment'}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Base URL and Metadata Strip */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-500 dark:text-slate-400">
                <div className="flex items-center space-x-2">
                  <Globe className="w-3.5 h-3.5 text-brand-500" />
                  <span className="text-slate-400">Base URL:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {currentEnv.baseUrl}
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-[11px]">
                  <span>ID: <code className="text-slate-400">{currentEnv.id}</code></span>
                  <span>•</span>
                  <span>Updated: {formatDate(currentEnv.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Variables Management Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 font-mono text-sm">
                    {currentEnv.name} Variables ({currentEnv.variables?.length || 0})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Variables available to request builder using &#123;&#123;VARIABLE_NAME&#125;&#125; syntax
                  </p>
                </div>
              </div>

              <EnvironmentVariablesTable
                environment={currentEnv}
                onAddVariable={handleAddVariable}
                onUpdateVariable={handleUpdateVariable}
                onDeleteVariable={handleDeleteVariable}
              />
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Layers}
          title="No Environments Configured"
          description="Create environment profiles (Development, Staging, Production) to parameterize host URLs and tokens."
          actionText="Create Environment"
          onAction={() => {
            setEditingEnv(null);
            setIsEnvModalOpen(true);
          }}
        />
      )}

      {/* Create / Edit Environment Modal */}
      <EnvironmentModal
        isOpen={isEnvModalOpen}
        onClose={() => {
          setIsEnvModalOpen(false);
          setEditingEnv(null);
        }}
        onSubmit={handleSaveEnvironment}
        initialData={editingEnv}
        isEditing={Boolean(editingEnv)}
      />

      {/* Delete Environment Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingEnv)}
        onClose={() => setDeletingEnv(null)}
        onConfirm={handleDeleteEnvironment}
        title="Delete Environment?"
        message={
          deletingEnv?.id === selectedEnvironment?.id
            ? `Warning: "${deletingEnv?.name}" is currently your active target environment! Deleting it will automatically reassign your active environment to another valid profile.`
            : `Are you sure you want to delete "${deletingEnv?.name}"? All ${deletingEnv?.variables?.length || 0} scoped variables will be permanently removed.`
        }
        confirmText="Delete Environment"
        variant="danger"
      />

      {/* Factory Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetDefaults}
        title="Reset Environments to Default?"
        message="This will restore the predefined Development, Staging, and Production environments with sample variables (BASE_URL, API_KEY, TOKEN, USER_ID). Custom environments will be replaced."
        confirmText="Reset to Defaults"
        variant="warning"
      />
    </div>
  );
};

export default EnvironmentsPage;
