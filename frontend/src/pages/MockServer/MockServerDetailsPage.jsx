import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Badge, MethodBadge, StatusBadge } from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import MockServerModal from '../../components/mockServer/MockServerModal';
import MockEndpointModal from '../../components/mockServer/MockEndpointModal';
import EndpointRulesDrawer from '../../components/mockServer/rules/EndpointRulesDrawer';
import { useToast } from '../../context/ToastContext';
import mockServerService from '../../services/mockServerService';
import { HTTP_METHODS } from '../../utils/constants';
import {
  Server,
  ChevronLeft,
  Plus,
  Search,
  Globe,
  Copy,
  Check,
  Edit2,
  Trash2,
  Play,
  PlayCircle,
  PauseCircle,
  Clock,
  Layers,
  Code2,
  AlertCircle,
  Calendar,
  Info,
  ExternalLink,
  GitBranch
} from 'lucide-react';

const ALL_METHODS = ['ALL', ...Object.keys(HTTP_METHODS)];

export const MockServerDetailsPage = () => {
  const { serverId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [server, setServer] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Modals
  const [isEditServerOpen, setIsEditServerOpen] = useState(false);
  const [isDeleteServerOpen, setIsDeleteServerOpen] = useState(false);
  const [isDeletingServer, setIsDeletingServer] = useState(false);

  const [isEndpointModalOpen, setIsEndpointModalOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState(null);
  const [deletingEndpoint, setDeletingEndpoint] = useState(null);
  const [isDeletingEndpoint, setIsDeletingEndpoint] = useState(false);

  // Dynamic Rules Drawer
  const [selectedRulesEndpoint, setSelectedRulesEndpoint] = useState(null);
  const [endpointRulesCountMap, setEndpointRulesCountMap] = useState({});

  const loadData = () => {
    try {
      const srv = mockServerService.getServerById(serverId);
      const eps = mockServerService.getEndpointsByServer(serverId);
      setServer(srv);
      setEndpoints(eps);

      // Compute rule count for each endpoint
      const allRules = mockServerService.getAllRules();
      const countMap = {};
      eps.forEach((ep) => {
        countMap[ep.id] = allRules.filter((r) => r.endpointId === ep.id).length;
      });
      setEndpointRulesCountMap(countMap);

      // Sync selectedRulesEndpoint if currently open
      setSelectedRulesEndpoint((prev) => {
        if (!prev) return null;
        return eps.find((e) => e.id === prev.id) || null;
      });
    } catch (err) {
      toast.error('Failed to load mock server: ' + err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [serverId]);

  const handleCopyBaseUrl = () => {
    if (!server?.baseUrl) return;
    navigator.clipboard.writeText(server.baseUrl);
    setCopiedUrl(true);
    toast.info('Mock Base URL copied to clipboard');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleToggleStatus = () => {
    if (!server) return;
    try {
      const updated = mockServerService.toggleServerStatus(server.id);
      setServer(updated);
      toast.success(`Server configuration status changed to ${updated.status}`);
    } catch (err) {
      toast.error(err.message || 'Error updating status');
    }
  };

  const handleUpdateServer = async (formData) => {
    try {
      const updated = mockServerService.updateServer(serverId, formData);
      setServer(updated);
      toast.success('Mock server updated successfully');
      setIsEditServerOpen(false);
    } catch (err) {
      toast.error(err.message || 'Error updating server');
    }
  };

  const handleDeleteServer = async () => {
    try {
      setIsDeletingServer(true);
      mockServerService.deleteServer(serverId);
      toast.success(`Mock server "${server?.name}" deleted`);
      navigate('/mock-servers');
    } catch (err) {
      toast.error(err.message || 'Error deleting server');
    } finally {
      setIsDeletingServer(false);
      setIsDeleteServerOpen(false);
    }
  };

  // Endpoint Handlers
  const handleSaveEndpoint = async (formData) => {
    try {
      if (editingEndpoint) {
        mockServerService.updateEndpoint(editingEndpoint.id, formData);
        toast.success(`Mock endpoint "${formData.name}" updated`);
      } else {
        mockServerService.createEndpoint(formData);
        toast.success(`Mock endpoint "${formData.name}" defined`);
      }
      loadData();
      setIsEndpointModalOpen(false);
      setEditingEndpoint(null);
    } catch (err) {
      toast.error(err.message || 'Error saving endpoint');
    }
  };

  const handleDeleteEndpoint = async () => {
    if (!deletingEndpoint) return;
    try {
      setIsDeletingEndpoint(true);
      mockServerService.deleteEndpoint(deletingEndpoint.id);
      loadData();
      toast.success(`Mock endpoint "${deletingEndpoint.name}" removed`);
      setDeletingEndpoint(null);
    } catch (err) {
      toast.error(err.message || 'Error deleting endpoint');
    } finally {
      setIsDeletingEndpoint(false);
    }
  };

  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((ep) => {
      const matchesSearch =
        ep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ep.description && ep.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesMethod =
        selectedMethod === 'ALL' || ep.method.toUpperCase() === selectedMethod.toUpperCase();

      return matchesSearch && matchesMethod;
    });
  }, [endpoints, searchQuery, selectedMethod]);

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

  if (!server) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/mock-servers')}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Back to Mock Servers
          </Button>
        </div>
        <EmptyState
          icon={Server}
          title="Mock Server Not Found"
          description={`The mock server with ID "${serverId}" does not exist or has been removed.`}
          actionText="Go to Mock Servers"
          onAction={() => navigate('/mock-servers')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
          <Link
            to="/mock-servers"
            className="hover:text-slate-900 dark:hover:text-slate-200 flex items-center space-x-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Mock Servers</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {server.name}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={server.status === 'active' ? 'outline' : 'primary'}
            size="sm"
            onClick={handleToggleStatus}
            leftIcon={
              server.status === 'active' ? (
                <PauseCircle className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <PlayCircle className="w-3.5 h-3.5 text-emerald-500" />
              )
            }
          >
            {server.status === 'active' ? 'Pause Server' : 'Activate Server'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditServerOpen(true)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDeleteServerOpen(true)}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Server Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-3 flex-wrap gap-y-2">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Server className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                {server.name}
              </h1>
              <StatusBadge status={server.status || 'active'} />
              <Badge variant="neutral" size="sm">
                {server.environment || 'Development'}
              </Badge>
              <Badge variant="info" size="sm">
                Port {server.port || 8080}
              </Badge>
              <Badge variant="warning" size="sm">
                Local Simulated
              </Badge>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              {server.description || 'No description provided for this mock server.'}
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEditingEndpoint(null);
              setIsEndpointModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Mock Endpoint
          </Button>
        </div>

        {/* Base URL and Metadata Strip */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div
            onClick={handleCopyBaseUrl}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-300 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors shrink-0"
            title="Click to copy mock Base URL"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-500 dark:text-slate-400">Route Prefix:</span>
            <span>{server.baseUrl}</span>
            {copiedUrl ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 ml-1" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400 ml-1" />
            )}
          </div>

          <div className="flex items-center space-x-4 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Delay: {server.defaultLatencyMs || 0}ms</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              <span>{endpoints.length} Mock Routes</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Updated {formatDate(server.updatedAt)}</span>
            </span>
          </div>
        </div>

        {/* Informative Limitation Banner */}
        <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-mono flex items-start space-x-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Simulation Note:</strong> This server configuration is stored locally for schema modeling and testing with APIForge. In future days, the Node/Express backend will dynamically mount these endpoints live on your network.
          </span>
        </div>
      </div>

      {/* Endpoints Management Section */}
      <div className="space-y-4">
        {/* Search & Method Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter mock endpoints by path, name, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>

          {/* HTTP Method Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
            {ALL_METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMethod(m)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg transition-colors shrink-0 ${
                  selectedMethod === m
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold border border-brand-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Endpoints Table / Cards */}
        {filteredEndpoints.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
            {filteredEndpoints.map((ep) => (
              <div
                key={ep.id}
                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="flex items-start md:items-center space-x-3.5">
                  <MethodBadge method={ep.method} size="sm" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {ep.path}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {ep.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 mt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 flex-wrap gap-y-1">
                      <span className="flex items-center space-x-1">
                        <span className="text-slate-400">Default:</span>
                        <StatusBadge status={ep.responseStatus || 200} />
                      </span>
                      {ep.responseDelay > 0 && (
                        <span>Delay: {ep.responseDelay}ms</span>
                      )}
                      <span>Body: {ep.responseBodyType?.toUpperCase() || 'JSON'}</span>
                      {(endpointRulesCountMap[ep.id] || 0) > 0 && (
                        <span className="flex items-center space-x-1 text-brand-600 dark:text-brand-400 font-semibold bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-500/20">
                          <GitBranch className="w-3 h-3" />
                          <span>{endpointRulesCountMap[ep.id]} Dynamic Rule{endpointRulesCountMap[ep.id] > 1 ? 's' : ''}</span>
                        </span>
                      )}
                      {ep.description && (
                        <span className="font-sans line-clamp-1 max-w-sm text-slate-400">
                          {ep.description}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 self-end md:self-center shrink-0">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setSelectedRulesEndpoint(ep)}
                    leftIcon={<GitBranch className="w-3.5 h-3.5 text-brand-500" />}
                  >
                    Rules ({endpointRulesCountMap[ep.id] || 0})
                  </Button>

                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      const fullUrl = `${server.baseUrl}${ep.path}`;
                      navigate(`/apis/request?url=${encodeURIComponent(fullUrl)}&method=${ep.method}`);
                    }}
                    leftIcon={<Play className="w-3 h-3 text-emerald-500" />}
                  >
                    Test Route
                  </Button>

                  <button
                    onClick={() => {
                      setEditingEndpoint(ep);
                      setIsEndpointModalOpen(true);
                    }}
                    title="Edit Endpoint"
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setDeletingEndpoint(ep)}
                    title="Delete Endpoint"
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
            icon={Code2}
            title={searchQuery ? 'No Matching Mock Endpoints' : 'No Endpoints Defined in this Server'}
            description={
              searchQuery
                ? `No mock endpoints match "${searchQuery}". Clear your search query or reset method filter.`
                : 'Add mock routes with simulated status codes (200, 201, 404, 500) and response bodies.'
            }
            actionText={searchQuery ? 'Clear Filters' : 'Define First Endpoint'}
            onAction={
              searchQuery
                ? () => {
                    setSearchQuery('');
                    setSelectedMethod('ALL');
                  }
                : () => {
                    setEditingEndpoint(null);
                    setIsEndpointModalOpen(true);
                  }
            }
          />
        )}
      </div>

      {/* Edit Server Modal */}
      <MockServerModal
        isOpen={isEditServerOpen}
        onClose={() => setIsEditServerOpen(false)}
        onSubmit={handleUpdateServer}
        initialData={server}
        isEditing={true}
      />

      {/* Delete Server Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteServerOpen}
        onClose={() => setIsDeleteServerOpen(false)}
        onConfirm={handleDeleteServer}
        title="Delete Mock Server?"
        message={`Are you sure you want to delete "${server?.name}"? All ${endpoints.length} mock endpoints associated with this server will also be deleted.`}
        confirmText="Delete Server"
        variant="danger"
        loading={isDeletingServer}
      />

      {/* Create / Edit Mock Endpoint Modal */}
      <MockEndpointModal
        isOpen={isEndpointModalOpen}
        onClose={() => {
          setIsEndpointModalOpen(false);
          setEditingEndpoint(null);
        }}
        onSubmit={handleSaveEndpoint}
        serverId={serverId}
        initialData={editingEndpoint}
        isEditing={Boolean(editingEndpoint)}
      />

      {/* Delete Mock Endpoint Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingEndpoint)}
        onClose={() => setDeletingEndpoint(null)}
        onConfirm={handleDeleteEndpoint}
        title="Delete Mock Endpoint?"
        message={`Are you sure you want to delete "${deletingEndpoint?.name}" (${deletingEndpoint?.method} ${deletingEndpoint?.path})?`}
        confirmText="Delete Endpoint"
        variant="danger"
        loading={isDeletingEndpoint}
      />

      {/* Dynamic Response Rules Drawer */}
      <EndpointRulesDrawer
        isOpen={Boolean(selectedRulesEndpoint)}
        onClose={() => setSelectedRulesEndpoint(null)}
        endpoint={selectedRulesEndpoint}
        server={server}
        onEndpointUpdated={loadData}
      />
    </div>
  );
};

export default MockServerDetailsPage;
