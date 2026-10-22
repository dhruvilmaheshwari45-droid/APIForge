import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { Tabs } from '../../components/common/Tabs';
import { Badge, MethodBadge, StatusBadge } from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EndpointModal from '../../components/api/EndpointModal';
import { useToast } from '../../context/ToastContext';
import collectionService from '../../services/collectionService';
import { HTTP_METHODS } from '../../utils/constants';
import {
  Send,
  Play,
  Copy,
  Check,
  Plus,
  Search,
  Edit2,
  Trash2,
  RotateCcw,
  Sliders,
  FileCode2,
  FileJson,
  Layers,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  FolderGit2,
} from 'lucide-react';

const HTTP_METHOD_OPTIONS = Object.keys(HTTP_METHODS).map((m) => ({
  value: m,
  label: m,
}));

const ALL_METHODS = ['ALL', ...Object.keys(HTTP_METHODS)];

export const EndpointsPage = () => {
  const [searchParams] = useSearchParams();
  const initialEndpointId = searchParams.get('endpointId');
  const { toast } = useToast();

  const [collections, setCollections] = useState([]);
  const [endpoints, setEndpoints] = useState([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [selectedCollectionId, setSelectedCollectionId] = useState('ALL');

  // Request Builder State (active test configuration)
  const [reqMethod, setReqMethod] = useState('GET');
  const [reqUrl, setReqUrl] = useState('');
  const [reqParams, setReqParams] = useState([]);
  const [reqHeaders, setReqHeaders] = useState([]);
  const [reqBody, setReqBody] = useState('');
  const [reqTab, setReqTab] = useState('params');

  // Response Viewer State
  const [isSending, setIsSending] = useState(false);
  const [responseResult, setResponseResult] = useState(null);
  const [resTab, setResTab] = useState('body');
  const [copiedRes, setCopiedRes] = useState(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState(null);
  const [deletingEndpoint, setDeletingEndpoint] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = () => {
    try {
      const cols = collectionService.getCollections();
      const eps = collectionService.getAllEndpoints();
      setCollections(cols);
      setEndpoints(eps);

      // Handle selection
      if (eps.length > 0) {
        let toSelect = null;
        if (initialEndpointId) {
          toSelect = eps.find((ep) => ep.id === initialEndpointId);
        }
        if (!toSelect && selectedEndpoint) {
          toSelect = eps.find((ep) => ep.id === selectedEndpoint.id);
        }
        if (!toSelect) {
          toSelect = eps[0];
        }
        selectEndpoint(toSelect, cols);
      } else {
        setSelectedEndpoint(null);
      }
    } catch (err) {
      toast.error('Failed to load endpoints: ' + err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [initialEndpointId]);

  const selectEndpoint = (ep, colsList = collections) => {
    if (!ep) return;
    setSelectedEndpoint(ep);
    setReqMethod(ep.method || 'GET');

    const col = colsList.find((c) => c.id === ep.collectionId);
    const base = col?.baseUrl || 'https://api.apiforge.dev/v1';
    setReqUrl(`${base}${ep.path}`);

    // Map params
    setReqParams(
      Array.isArray(ep.queryParams)
        ? ep.queryParams.map((p, i) => ({ ...p, id: p.id || `p-${i}` }))
        : []
    );

    // Map headers
    setReqHeaders(
      Array.isArray(ep.headers) && ep.headers.length > 0
        ? ep.headers.map((h, i) => ({ ...h, id: h.id || `h-${i}` }))
        : [{ id: '1', key: 'Content-Type', value: 'application/json', enabled: true }]
    );

    // Map body
    if (ep.requestBody) {
      setReqBody(
        typeof ep.requestBody === 'object'
          ? JSON.stringify(ep.requestBody, null, 2)
          : String(ep.requestBody)
      );
    } else {
      setReqBody('');
    }

    // Set initial response preview from endpoint mock if no live response yet
    if (ep.responseExample) {
      setResponseResult({
        status: ep.responseExample.status || 200,
        statusText: 'OK (Mock Template)',
        data: ep.responseExample.body || {},
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'x-powered-by': 'APIForge-VirtualServer',
        },
        responseTimeMs: ep.responseTime || 35,
        isMockFallback: true,
      });
    } else {
      setResponseResult(null);
    }
  };

  // Filtered list of endpoints
  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((ep) => {
      const matchesSearch =
        ep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ep.description && ep.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesMethod =
        selectedMethod === 'ALL' || ep.method.toUpperCase() === selectedMethod.toUpperCase();

      const matchesCollection =
        selectedCollectionId === 'ALL' || ep.collectionId === selectedCollectionId;

      return matchesSearch && matchesMethod && matchesCollection;
    });
  }, [endpoints, searchQuery, selectedMethod, selectedCollectionId]);

  // Request Execution
  const handleExecuteRequest = async () => {
    if (!reqUrl) return;
    setIsSending(true);

    try {
      // Build active params
      const activeParams = {};
      reqParams.filter((p) => p.enabled && p.key.trim()).forEach((p) => {
        activeParams[p.key.trim()] = p.value;
      });

      // Build active headers
      const activeHeaders = {};
      reqHeaders.filter((h) => h.enabled && h.key.trim()).forEach((h) => {
        activeHeaders[h.key.trim()] = h.value;
      });

      // Parse payload
      let parsedData = null;
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(reqMethod) && reqBody.trim()) {
        try {
          parsedData = JSON.parse(reqBody);
        } catch (e) {
          parsedData = reqBody;
        }
      }

      const res = await collectionService.executeRequest({
        url: reqUrl,
        method: reqMethod,
        headers: activeHeaders,
        params: activeParams,
        data: parsedData,
        fallbackResponse: selectedEndpoint?.responseExample,
      });

      setResponseResult(res);
      if (res.status < 400) {
        toast.success(`Request completed with status ${res.status}`);
      } else {
        toast.warning(`Request finished with status ${res.status}`);
      }
    } catch (err) {
      toast.error('Execution failed: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  // Param table controls
  const addParam = () => {
    setReqParams([...reqParams, { id: `p-${Date.now()}`, key: '', value: '', enabled: true }]);
  };
  const updateParam = (id, field, val) => {
    setReqParams(reqParams.map((p) => (p.id === id ? { ...p, [field]: val } : p)));
  };
  const removeParam = (id) => {
    setReqParams(reqParams.filter((p) => p.id !== id));
  };

  // Header table controls
  const addHeader = () => {
    setReqHeaders([...reqHeaders, { id: `h-${Date.now()}`, key: '', value: '', enabled: true }]);
  };
  const updateHeader = (id, field, val) => {
    setReqHeaders(reqHeaders.map((h) => (h.id === id ? { ...h, [field]: val } : h)));
  };
  const removeHeader = (id) => {
    setReqHeaders(reqHeaders.filter((h) => h.id !== id));
  };

  // Format request body JSON
  const handleFormatJson = () => {
    try {
      if (!reqBody.trim()) return;
      const parsed = JSON.parse(reqBody);
      setReqBody(JSON.stringify(parsed, null, 2));
      toast.info('JSON formatted');
    } catch (e) {
      toast.error('Invalid JSON: ' + e.message);
    }
  };

  // Endpoint CRUD Handlers
  const handleSaveEndpoint = async (formData) => {
    try {
      let saved;
      if (editingEndpoint) {
        saved = collectionService.updateEndpoint(editingEndpoint.id, formData);
        toast.success(`Endpoint "${saved.name}" updated`);
      } else {
        saved = collectionService.createEndpoint(formData);
        toast.success(`Endpoint "${saved.name}" created`);
      }
      loadData();
      selectEndpoint(saved);
      setIsModalOpen(false);
      setEditingEndpoint(null);
    } catch (err) {
      toast.error(err.message || 'Error saving endpoint');
    }
  };

  const handleDeleteEndpoint = async () => {
    if (!deletingEndpoint) return;
    try {
      setIsDeleting(true);
      collectionService.deleteEndpoint(deletingEndpoint.id);
      loadData();
      toast.success(`Endpoint "${deletingEndpoint.name}" deleted`);
      setDeletingEndpoint(null);
    } catch (err) {
      toast.error(err.message || 'Error deleting endpoint');
    } finally {
      setIsDeleting(false);
    }
  };

  const copyResponseJson = () => {
    if (!responseResult?.data) return;
    navigator.clipboard.writeText(JSON.stringify(responseResult.data, null, 2));
    setCopiedRes(true);
    toast.info('Response JSON copied to clipboard');
    setTimeout(() => setCopiedRes(false), 2000);
  };

  const collectionFilterOptions = [
    { value: 'ALL', label: 'All Collections' },
    ...collections.map((c) => ({ value: c.id, label: c.name })),
  ];

  const requestTabs = [
    { id: 'params', label: `Params (${reqParams.length})`, icon: Sliders },
    { id: 'headers', label: `Headers (${reqHeaders.length})`, icon: FileCode2 },
    { id: 'body', label: 'Body', icon: FileJson },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="REST Endpoint Explorer & Request Builder"
        subtitle="Construct requests, configure parameters & headers, test API routes, and inspect response payloads"
        actions={
          <div className="flex items-center space-x-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingEndpoint(null);
                setIsModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Endpoint
            </Button>
          </div>
        }
      />

      {/* Main Workspace Layout (Master-Detail Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Endpoints Directory / Browser */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                Endpoints
              </h3>
              <Badge variant="primary" size="sm">
                {filteredEndpoints.length}
              </Badge>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {collections.length} collections
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by name, path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>

          {/* Collection Filter Dropdown */}
          <div>
            <select
              value={selectedCollectionId}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-brand-500"
            >
              {collectionFilterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Method Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto custom-scrollbar pb-1">
            {ALL_METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMethod(m)}
                className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors shrink-0 ${
                  selectedMethod === m
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold border border-brand-500/30'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Endpoints List */}
          <div className="space-y-1.5 max-h-[580px] overflow-y-auto custom-scrollbar pr-0.5">
            {filteredEndpoints.length > 0 ? (
              filteredEndpoints.map((ep) => {
                const isSelected = selectedEndpoint?.id === ep.id;
                const col = collections.find((c) => c.id === ep.collectionId);

                return (
                  <div
                    key={ep.id}
                    onClick={() => selectEndpoint(ep)}
                    className={`group p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-brand-500/10 border-brand-500/40 text-slate-900 dark:text-slate-100 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <MethodBadge method={ep.method} size="xs" />
                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                          {col?.name || 'Collection'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEndpoint(ep);
                            setIsModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingEndpoint(ep);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs font-semibold font-mono truncate text-slate-900 dark:text-slate-100">
                      {ep.path}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {ep.name}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No matching endpoints found
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Request Builder & Response Inspector */}
        <div className="lg:col-span-8 space-y-5">
          {selectedEndpoint ? (
            <>
              {/* Interactive Request Bar */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                      {selectedEndpoint.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                      ID: {selectedEndpoint.id}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        setEditingEndpoint(selectedEndpoint);
                        setIsModalOpen(true);
                      }}
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    >
                      Edit Config
                    </Button>
                  </div>
                </div>

                {/* URL Bar */}
                <div className="flex items-center space-x-2">
                  <div className="w-28 shrink-0">
                    <Select
                      options={HTTP_METHOD_OPTIONS}
                      value={reqMethod}
                      onChange={(e) => setReqMethod(e.target.value)}
                    />
                  </div>
                  <input
                    type="text"
                    value={reqUrl}
                    onChange={(e) => setReqUrl(e.target.value)}
                    placeholder="https://api.example.com/v1/resource"
                    className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleExecuteRequest}
                    loading={isSending}
                    leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
                  >
                    Send
                  </Button>
                </div>

                {selectedEndpoint.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedEndpoint.description}
                  </p>
                )}
              </div>

              {/* Request Parameters / Headers / Body Tabs */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 pt-3 border-b border-slate-200 dark:border-slate-800">
                  <Tabs
                    tabs={requestTabs}
                    activeTab={reqTab}
                    onChange={setReqTab}
                    variant="pills"
                    size="sm"
                  />
                </div>

                <div className="p-4">
                  {/* Query Params Tab */}
                  {reqTab === 'params' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-mono">
                          Query parameters appended to request URL
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={addParam}
                          leftIcon={<Plus className="w-3 h-3" />}
                        >
                          Add Param
                        </Button>
                      </div>

                      {reqParams.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 font-mono border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                          No query parameters specified
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {reqParams.map((p) => (
                            <div key={p.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={p.enabled}
                                onChange={(e) => updateParam(p.id, 'enabled', e.target.checked)}
                                className="rounded text-brand-600 focus:ring-brand-500"
                              />
                              <input
                                type="text"
                                placeholder="Key"
                                value={p.key}
                                onChange={(e) => updateParam(p.id, 'key', e.target.value)}
                                className="flex-1 px-2.5 py-1 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                              />
                              <input
                                type="text"
                                placeholder="Value"
                                value={p.value}
                                onChange={(e) => updateParam(p.id, 'value', e.target.value)}
                                className="flex-1 px-2.5 py-1 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                              />
                              <button
                                type="button"
                                onClick={() => removeParam(p.id)}
                                className="p-1 text-slate-400 hover:text-rose-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Headers Tab */}
                  {reqTab === 'headers' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-mono">
                          HTTP headers sent with the request
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={addHeader}
                          leftIcon={<Plus className="w-3 h-3" />}
                        >
                          Add Header
                        </Button>
                      </div>

                      {reqHeaders.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 font-mono border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                          No headers specified
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {reqHeaders.map((h) => (
                            <div key={h.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={h.enabled}
                                onChange={(e) => updateHeader(h.id, 'enabled', e.target.checked)}
                                className="rounded text-brand-600 focus:ring-brand-500"
                              />
                              <input
                                type="text"
                                placeholder="Header Key"
                                value={h.key}
                                onChange={(e) => updateHeader(h.id, 'key', e.target.value)}
                                className="flex-1 px-2.5 py-1 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                              />
                              <input
                                type="text"
                                placeholder="Header Value"
                                value={h.value}
                                onChange={(e) => updateHeader(h.id, 'value', e.target.value)}
                                className="flex-1 px-2.5 py-1 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                              />
                              <button
                                type="button"
                                onClick={() => removeHeader(h.id)}
                                className="p-1 text-slate-400 hover:text-rose-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Body Tab */}
                  {reqTab === 'body' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-mono">
                          JSON Payload (Raw Application/JSON)
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={handleFormatJson}
                        >
                          Format JSON
                        </Button>
                      </div>
                      <textarea
                        value={reqBody}
                        onChange={(e) => setReqBody(e.target.value)}
                        placeholder="{\n  &quot;name&quot;: &quot;Example&quot;\n}"
                        rows={7}
                        className="w-full p-3 font-mono text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Response Inspector */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                      Response Inspector
                    </span>
                    {responseResult && (
                      <>
                        <StatusBadge status={responseResult.status} />
                        <span className="text-xs font-mono text-slate-500">
                          {responseResult.responseTimeMs} ms
                        </span>
                        {responseResult.isMockFallback && (
                          <Badge variant="info" size="sm">
                            Mock Engine
                          </Badge>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-mono">
                      <button
                        onClick={() => setResTab('body')}
                        className={`px-2 py-0.5 rounded ${
                          resTab === 'body'
                            ? 'bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100 shadow-xs'
                            : 'text-slate-500'
                        }`}
                      >
                        Body
                      </button>
                      <button
                        onClick={() => setResTab('headers')}
                        className={`px-2 py-0.5 rounded ${
                          resTab === 'headers'
                            ? 'bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100 shadow-xs'
                            : 'text-slate-500'
                        }`}
                      >
                        Headers
                      </button>
                    </div>

                    {responseResult?.data && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={copyResponseJson}
                        leftIcon={
                          copiedRes ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )
                        }
                      >
                        {copiedRes ? 'Copied' : 'Copy'}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  {responseResult ? (
                    resTab === 'body' ? (
                      <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto max-h-96">
                        {typeof responseResult.data === 'string'
                          ? responseResult.data
                          : JSON.stringify(responseResult.data, null, 2)}
                      </pre>
                    ) : (
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 max-h-96 overflow-x-auto space-y-1">
                        {Object.entries(responseResult.headers || {}).map(([key, val]) => (
                          <div key={key} className="flex">
                            <span className="text-slate-500 font-bold min-w-[140px]">
                              {key}:
                            </span>
                            <span className="text-cyan-400">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400 font-mono">
                      Click "Send" to execute request or preview mock responses.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              icon={Send}
              title="No Endpoint Selected"
              description="Select an endpoint from the left directory or create a new endpoint to begin testing."
              actionText="New Endpoint"
              onAction={() => {
                setEditingEndpoint(null);
                setIsModalOpen(true);
              }}
            />
          )}
        </div>
      </div>

      {/* Endpoint Create/Edit Modal */}
      <EndpointModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEndpoint(null);
        }}
        onSubmit={handleSaveEndpoint}
        initialData={editingEndpoint}
        isEditing={Boolean(editingEndpoint)}
        collections={collections}
        defaultCollectionId={selectedCollectionId !== 'ALL' ? selectedCollectionId : ''}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingEndpoint)}
        onClose={() => setDeletingEndpoint(null)}
        onConfirm={handleDeleteEndpoint}
        title="Delete Endpoint?"
        message={`Are you sure you want to delete "${deletingEndpoint?.name}" (${deletingEndpoint?.method} ${deletingEndpoint?.path})?`}
        confirmText="Delete Endpoint"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default EndpointsPage;
