import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { Badge, StatusBadge } from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import MockServerModal from '../../components/mockServer/MockServerModal';
import { useToast } from '../../context/ToastContext';
import mockServerService from '../../services/mockServerService';
import {
  Server,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Copy,
  Check,
  Globe,
  Layers,
  Clock,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Info,
  Calendar
} from 'lucide-react';

const STATUS_FILTERS = ['ALL', 'active', 'paused', 'draft'];

export const MockServersPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [servers, setServers] = useState([]);
  const [endpoints, setEndpoints] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [deletingServer, setDeletingServer] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = () => {
    try {
      const srvs = mockServerService.getServers();
      const eps = mockServerService.getAllEndpoints();
      setServers(srvs);
      setEndpoints(eps);
    } catch (err) {
      toast.error('Failed to load mock servers: ' + err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute endpoint count per server
  const endpointCounts = useMemo(() => {
    const counts = {};
    endpoints.forEach((ep) => {
      counts[ep.serverId] = (counts[ep.serverId] || 0) + 1;
    });
    return counts;
  }, [endpoints]);

  // Filtered servers
  const filteredServers = useMemo(() => {
    return servers.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.baseUrl && s.baseUrl.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.environment && s.environment.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        selectedStatus === 'ALL' || s.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [servers, searchQuery, selectedStatus]);

  const handleCopyUrl = (e, url, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.info('Mock Base URL copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = (e, id) => {
    e.stopPropagation();
    try {
      const updated = mockServerService.toggleServerStatus(id);
      loadData();
      toast.success(`Server status set to ${updated.status}`);
    } catch (err) {
      toast.error(err.message || 'Error updating status');
    }
  };

  const handleCreateServer = async (formData) => {
    try {
      const created = mockServerService.createServer(formData);
      loadData();
      toast.success(`Mock server "${created.name}" created`);
      setIsCreateModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Error creating server');
    }
  };

  const handleUpdateServer = async (formData) => {
    if (!editingServer) return;
    try {
      const updated = mockServerService.updateServer(editingServer.id, formData);
      loadData();
      toast.success(`Mock server "${updated.name}" updated`);
      setEditingServer(null);
    } catch (err) {
      toast.error(err.message || 'Error updating server');
    }
  };

  const handleDeleteServer = async () => {
    if (!deletingServer) return;
    try {
      setIsDeleting(true);
      mockServerService.deleteServer(deletingServer.id);
      loadData();
      toast.success(`Mock server "${deletingServer.name}" deleted`);
      setDeletingServer(null);
    } catch (err) {
      toast.error(err.message || 'Error deleting server');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetDefaults = () => {
    mockServerService.resetToDefaults();
    loadData();
    toast.info('Reset mock servers to default templates');
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      return new Date(isoStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mock Servers & Virtual APIs"
        subtitle="Simulate backend endpoints, mock HTTP status codes, latency delays, and JSON error responses without running code"
        actions={
          <div className="flex items-center space-x-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              title="Reset sample servers"
            >
              Reset Samples
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Mock Server
            </Button>
          </div>
        }
      />

      {/* Informative Backend Notice */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono flex items-start space-x-3 shadow-xs">
        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <p className="font-bold text-slate-100">
            Frontend Simulation & Virtual Schema Mode
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Mock server routes configured here are locally managed and ready for schema inspection and simulation. Live public HTTP endpoint hosting will connect to the Express/Node.js mock daemon in subsequent development stages.
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search mock servers by name, prefix, or environment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 font-mono"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {STATUS_FILTERS.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors capitalize shrink-0 ${
                selectedStatus === st
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold border border-brand-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Server Counter */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Showing</span>
          <Badge variant="primary" size="sm">
            {filteredServers.length} of {servers.length} Virtual Servers
          </Badge>
        </div>
      </div>

      {/* Mock Servers Grid */}
      {filteredServers.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredServers.map((srv) => {
            const epCount = endpointCounts[srv.id] || 0;
            return (
              <div
                key={srv.id}
                onClick={() => navigate(`/mock-servers/${srv.id}`)}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start space-x-3">
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {srv.name}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {srv.environment || 'Development'}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 font-semibold border border-amber-500/20">
                            Local Simulated
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleToggleStatus(e, srv.id)}
                        title={srv.status === 'active' ? 'Pause server' : 'Activate server'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          srv.status === 'active'
                            ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                            : 'text-amber-500 hover:bg-amber-500/10'
                        }`}
                      >
                        {srv.status === 'active' ? (
                          <PauseCircle className="w-4 h-4" />
                        ) : (
                          <PlayCircle className="w-4 h-4" />
                        )}
                      </button>
                      <StatusBadge status={srv.status || 'active'} />
                      <button
                        onClick={() => setEditingServer(srv)}
                        title="Edit Server"
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingServer(srv)}
                        title="Delete Server"
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {srv.description || 'No description provided for this mock server.'}
                  </p>

                  {/* Base URL / Prefix Strip */}
                  <div
                    onClick={(e) => handleCopyUrl(e, srv.baseUrl, srv.id)}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-mono text-xs mb-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    title="Click to copy route prefix"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{srv.baseUrl}</span>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0 ml-2">
                      {copiedId === srv.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Footer Strip */}
                <div>
                  <div className="grid grid-cols-3 gap-2 py-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <div className="flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>
                        <strong className="text-slate-800 dark:text-slate-200">{epCount}</strong> mock routes
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{srv.defaultLatencyMs || 0}ms delay</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Updated {formatDate(srv.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">ID: {srv.id}</span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 group-hover:translate-x-0.5 transition-transform font-mono">
                      <span>Manage Mock Routes</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Server}
          title={searchQuery ? 'No Matching Mock Servers' : 'No Mock Servers Configured'}
          description={
            searchQuery
              ? `No mock servers match "${searchQuery}". Clear your search query or reset status filter.`
              : 'Create a virtual mock server to simulate backend responses, latency delays, and error codes.'
          }
          actionText={searchQuery ? 'Clear Filters' : 'Create Mock Server'}
          onAction={
            searchQuery
              ? () => {
                  setSearchQuery('');
                  setSelectedStatus('ALL');
                }
              : () => setIsCreateModalOpen(true)
          }
        />
      )}

      {/* Create Modal */}
      <MockServerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateServer}
        isEditing={false}
      />

      {/* Edit Modal */}
      <MockServerModal
        isOpen={Boolean(editingServer)}
        onClose={() => setEditingServer(null)}
        onSubmit={handleUpdateServer}
        initialData={editingServer}
        isEditing={true}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingServer)}
        onClose={() => setDeletingServer(null)}
        onConfirm={handleDeleteServer}
        title="Delete Mock Server?"
        message={`Are you sure you want to delete "${deletingServer?.name}"? This action will remove the server configuration and all ${endpointCounts[deletingServer?.id] || 0} associated mock endpoints.`}
        confirmText="Delete Server"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default MockServersPage;
