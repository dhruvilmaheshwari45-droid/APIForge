import React, { useState } from 'react';
import { 
  X, 
  GitBranch, 
  Layers, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Edit3, 
  ArrowRightLeft, 
  Check, 
  CheckCircle2, 
  FileText,
  Search
} from 'lucide-react';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../common/Modal';
import { MethodBadge } from '../common/Badge';
import { VersionStatusBadge } from './VersionCard';

export const VersionDetailsModal = ({
  isOpen,
  onClose,
  version,
  onEdit,
  onCompare,
  onSetActive,
}) => {
  const [activeTab, setActiveTab] = useState('endpoints');
  const [endpointSearch, setEndpointSearch] = useState('');

  if (!isOpen || !version) return null;

  const isDefault = Boolean(version.isDefault || version.status === 'Active');
  const endpoints = version.endpoints || [];
  const changelog = version.changelog || [];

  const filteredEndpoints = endpoints.filter((ep) => {
    if (!endpointSearch.trim()) return true;
    const q = endpointSearch.trim().toLowerCase();
    return (
      ep.path.toLowerCase().includes(q) ||
      ep.method.toLowerCase().includes(q) ||
      (ep.description && ep.description.toLowerCase().includes(q))
    );
  });

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return isNaN(d.getTime()) ? isoString : d.toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex flex-col h-full max-h-[88vh]">
        {/* Header */}
        <ModalHeader onClose={onClose}>
          <div className="flex items-start justify-between gap-3 w-full pr-2">
            <div className="space-y-1">
              <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <GitBranch className="w-5 h-5" />
                </div>
                <ModalTitle className="text-lg">
                  API Version: {version.versionNumber}
                </ModalTitle>
                <VersionStatusBadge status={version.status} />
                {isDefault && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                    CURRENT ACTIVE
                  </span>
                )}
                {version.breakingChanges && (
                  <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 text-[10px] font-mono font-bold flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                    <span>Breaking Changes</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                {version.description}
              </p>
            </div>
          </div>
        </ModalHeader>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <nav className="flex space-x-6 overflow-x-auto text-xs font-mono" aria-label="Tabs">
            {[
              { id: 'endpoints', label: `Endpoints (${endpoints.length})` },
              { id: 'changelog', label: `Release Changelog (${changelog.length})` },
              { id: 'lifecycle', label: 'Lifecycle & Dates' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Body */}
        <ModalBody className="p-5 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
          {/* TAB 1: ENDPOINTS LIST */}
          {activeTab === 'endpoints' && (
            <div className="space-y-3">
              {/* Search filter */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={endpointSearch}
                  onChange={(e) => setEndpointSearch(e.target.value)}
                  placeholder="Filter endpoints by path or method..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {filteredEndpoints.length > 0 ? (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-2.5 px-3 w-28">Method</th>
                        <th className="p-2.5 px-3">Route Path</th>
                        <th className="p-2.5 px-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                      {filteredEndpoints.map((ep) => (
                        <tr key={ep.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 px-3">
                            <MethodBadge method={ep.method} size="xs" />
                          </td>
                          <td className="p-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                            {ep.path}
                          </td>
                          <td className="p-2.5 px-3 text-slate-600 dark:text-slate-400 font-sans text-xs">
                            {ep.description || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-xs font-mono text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No endpoints found matching "{endpointSearch}".
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RELEASE CHANGELOG */}
          {activeTab === 'changelog' && (
            <div className="space-y-3">
              {changelog.length > 0 ? (
                changelog.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                          {entry.tag || entry.type.toUpperCase()}
                        </span>
                        {entry.breaking && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500 text-white">
                            BREAKING
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {entry.date}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
                      {entry.description}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs font-mono text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No changelog entries recorded for this version.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LIFECYCLE & DATES */}
          {activeTab === 'lifecycle' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 block uppercase">Created Date</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{formatDate(version.createdDate)}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 block uppercase">Last Modified</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{formatDate(version.lastModified)}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 block uppercase">Official Release Date</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{version.releaseDate || 'Unreleased'}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 block uppercase">Deprecation Schedule</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    {version.deprecationDate ? `Deprecated since ${version.deprecationDate}` : 'No Deprecation Scheduled'}
                  </span>
                </div>
              </div>

              {version.status === 'Deprecated' && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-amber-800 dark:text-amber-300 text-xs font-mono flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Deprecation Notice:</span> This version is scheduled for sunsetting. Client applications are encouraged to migrate endpoints to active version schemas.
                  </div>
                </div>
              )}
            </div>
          )}
        </ModalBody>

        {/* Footer */}
        <ModalFooter className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {!isDefault && onSetActive && (
              <button
                type="button"
                onClick={() => {
                  onSetActive(version.id);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              >
                Promote to Active
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onCompare(version.id);
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60 hover:bg-violet-100 transition-colors flex items-center space-x-1"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Compare</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                onEdit(version);
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center space-x-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-mono font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </ModalFooter>
      </div>
    </Modal>
  );
};

export default VersionDetailsModal;
