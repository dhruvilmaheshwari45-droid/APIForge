import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  GitBranch, 
  Plus, 
  Layers, 
  ArrowRightLeft, 
  History, 
  Search, 
  Filter, 
  RotateCcw, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2,
  Info
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { 
  VersionCard, 
  VersionModal, 
  VersionDetailsModal, 
  VersionComparisonView, 
  VersionHistoryTimeline 
} from '../../components/versions';
import versionService from '../../services/versionService';

const STATUS_FILTERS = ['ALL', 'Active', 'Draft', 'Deprecated', 'Archived'];

export const VersionsPage = () => {
  const { toast } = useToast();

  // Tab State: 'versions' | 'comparison' | 'history'
  const [activeTab, setActiveTab] = useState('versions');

  // Versions Data State
  const [versions, setVersions] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState(null);
  const [inspectingVersion, setInspectingVersion] = useState(null);
  const [deletingVersion, setDeletingVersion] = useState(null);

  // Pre-selected versions for Comparison Tab
  const [comparisonVerA, setComparisonVerA] = useState(null);
  const [comparisonVerB, setComparisonVerB] = useState(null);

  // Load versions
  const loadVersions = useCallback(() => {
    const list = versionService.getAllVersions();
    setVersions(list);
  }, []);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  // Global Changelog
  const changelog = useMemo(() => {
    return versionService.getGlobalChangelog();
  }, [versions]);

  // Active production version
  const activeVersion = useMemo(() => {
    return versions.find((v) => v.status === 'Active' || v.isDefault) || versions[0];
  }, [versions]);

  // Filtered versions list
  const filteredVersions = useMemo(() => {
    let list = versions;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (v) =>
          v.versionNumber.toLowerCase().includes(q) ||
          (v.description && v.description.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((v) => v.status.toLowerCase() === statusFilter.toLowerCase());
    }

    return list;
  }, [versions, search, statusFilter]);

  // Handlers
  const handleCreateVersion = (formData) => {
    try {
      const created = versionService.createVersion(formData);
      loadVersions();
      setIsCreateModalOpen(false);
      toast.success(`API Version ${created.versionNumber} tagged successfully!`);
    } catch (err) {
      toast.error(err.message || 'Failed to create version.');
    }
  };

  const handleUpdateVersion = (formData) => {
    if (!editingVersion) return;
    try {
      const updated = versionService.updateVersion(editingVersion.id, formData);
      loadVersions();
      setEditingVersion(null);
      toast.success(`API Version ${updated.versionNumber} updated.`);
    } catch (err) {
      toast.error(err.message || 'Failed to update version.');
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingVersion) return;
    try {
      versionService.deleteVersion(deletingVersion.id);
      loadVersions();
      toast.success(`Version ${deletingVersion.versionNumber} has been removed.`);
    } catch (err) {
      toast.error(err.message || 'Failed to delete version.');
    } finally {
      setDeletingVersion(null);
    }
  };

  const handleSetActive = (versionId) => {
    try {
      versionService.setActiveVersion(versionId);
      loadVersions();
      toast.success('Active API version updated.');
    } catch (err) {
      toast.error(err.message || 'Failed to set active version.');
    }
  };

  const handleTriggerCompare = (versionId) => {
    // Set as base version and pick active or previous as target
    setComparisonVerA(versionId);
    const other = versions.find((v) => v.id !== versionId);
    if (other) {
      setComparisonVerB(other.id);
    }
    setActiveTab('comparison');
  };

  const handleResetSeeds = () => {
    if (window.confirm('Reset all versions to default seed data (v1, v2, v3)?')) {
      versionService.resetToDefaults();
      loadVersions();
      toast.info('API versions reset to seed dataset.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="API Versioning & Release Lifecycle"
        subtitle="Manage API schema iterations, track breaking changes, compare endpoint signatures across versions, and inspect change history"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Active Version Pill */}
            {activeVersion && (
              <div className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-semibold flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active: {activeVersion.versionNumber}</span>
              </div>
            )}

            {/* Reset Seeds Button */}
            <button
              onClick={handleResetSeeds}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-mono text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-1 shadow-sm transition-colors"
              title="Reset versions to initial seed dataset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Seeds</span>
            </button>

            {/* Tag New Version Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 rounded-lg text-xs font-semibold text-white flex items-center space-x-2 shadow-md shadow-brand-600/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tag New Version</span>
            </button>
          </div>
        }
      />

      {/* Main Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl px-4 shadow-sm">
        <nav className="flex space-x-6 overflow-x-auto text-xs font-mono" aria-label="Views">
          <button
            onClick={() => setActiveTab('versions')}
            className={`py-3.5 px-1 border-b-2 font-bold whitespace-nowrap transition-colors flex items-center space-x-2 ${
              activeTab === 'versions'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>All Versions ({versions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`py-3.5 px-1 border-b-2 font-bold whitespace-nowrap transition-colors flex items-center space-x-2 ${
              activeTab === 'comparison'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Endpoint Comparison</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-3.5 px-1 border-b-2 font-bold whitespace-nowrap transition-colors flex items-center space-x-2 ${
              activeTab === 'history'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Release Change History ({changelog.length})</span>
          </button>
        </nav>
      </div>

      {/* TAB 1: ALL VERSIONS LIST & GRID */}
      {activeTab === 'versions' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 px-4 shadow-sm">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search versions (e.g. v1, v2, GraphQL)..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center space-x-1 overflow-x-auto text-xs font-mono">
              {STATUS_FILTERS.map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-brand-600 text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {st === 'ALL' ? 'All Statuses' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Versions Grid */}
          {filteredVersions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVersions.map((v) => (
                <VersionCard
                  key={v.id}
                  version={v}
                  onInspect={(ver) => setInspectingVersion(ver)}
                  onEdit={(ver) => setEditingVersion(ver)}
                  onDelete={(ver) => setDeletingVersion(ver)}
                  onCompare={(verId) => handleTriggerCompare(verId)}
                  onSetActive={handleSetActive}
                />
              ))}
            </div>
          ) : versions.length === 0 ? (
            <EmptyState
              icon={GitBranch}
              title="No API Versions Yet"
              description="Get started by defining your first API specification version (e.g., v1, v2) to track schemas, contracts, and endpoint matrices."
              actionText="Create Version"
              onAction={() => setIsCreateModalOpen(true)}
            />
          ) : (
            <EmptyState
              icon={GitBranch}
              title="No Versions Match Filters"
              description="No schema versions found with the applied search term or status filter."
              actionText="Reset Filters"
              onAction={() => {
                setSearch('');
                setStatusFilter('ALL');
              }}
            />
          )}
        </div>
      )}

      {/* TAB 2: ENDPOINT COMPARISON VIEW */}
      {activeTab === 'comparison' && (
        <VersionComparisonView
          versions={versions}
          initialVerA={comparisonVerA}
          initialVerB={comparisonVerB}
        />
      )}

      {/* TAB 3: RELEASE CHANGE HISTORY */}
      {activeTab === 'history' && (
        <VersionHistoryTimeline changelog={changelog} />
      )}

      {/* MODAL 1: CREATE VERSION */}
      <VersionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateVersion}
        existingVersions={versions}
      />

      {/* MODAL 2: EDIT VERSION */}
      <VersionModal
        isOpen={Boolean(editingVersion)}
        onClose={() => setEditingVersion(null)}
        onSubmit={handleUpdateVersion}
        version={editingVersion}
        existingVersions={versions}
      />

      {/* MODAL 3: VERSION DETAILS INSPECTOR */}
      <VersionDetailsModal
        isOpen={Boolean(inspectingVersion)}
        onClose={() => setInspectingVersion(null)}
        version={inspectingVersion}
        onEdit={(ver) => {
          setEditingVersion(ver);
          setInspectingVersion(null);
        }}
        onCompare={(verId) => {
          handleTriggerCompare(verId);
          setInspectingVersion(null);
        }}
        onSetActive={handleSetActive}
      />

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deletingVersion)}
        onClose={() => setDeletingVersion(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete Version ${deletingVersion?.versionNumber}?`}
        message={`Are you sure you want to delete ${deletingVersion?.versionNumber}? This action will permanently remove its endpoint mappings and release metadata.`}
        confirmText="Delete Version"
        variant="danger"
      />
    </div>
  );
};

export default VersionsPage;
