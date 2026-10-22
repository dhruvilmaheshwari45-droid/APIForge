import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import MethodSelector from './MethodSelector';
import RequestParams from './RequestParams';
import RequestHeaders from './RequestHeaders';
import RequestAuthorization from './RequestAuthorization';
import RequestBody from './RequestBody';
import ResponseViewer from './ResponseViewer';
import RequestHistory from './RequestHistory';
import SaveRequestModal from './SaveRequestModal';
import { Tabs } from '../../common/Tabs';
import Button from '../../common/Button';
import { useToast } from '../../../context/ToastContext';
import { useApp } from '../../../context/AppContext';
import collectionService from '../../../services/collectionService';
import requestService from '../../../services/requestService';
import {
  resolveString,
  resolveRequestPayload,
  buildEnvironmentVariablesMap,
} from '../../../utils/variableResolver';
import { 
  Play, 
  Bookmark, 
  RotateCcw, 
  Sliders, 
  FileCode2, 
  KeyRound, 
  FileJson, 
  AlertCircle,
  History,
  Clock,
  Layers,
  Sparkles,
  Timer,
  Globe,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';

const TIMEOUT_OPTIONS = [
  { value: 5000, label: '5s timeout' },
  { value: 10000, label: '10s timeout' },
  { value: 30000, label: '30s timeout' },
  { value: 60000, label: '60s timeout' },
];

export const RequestBuilder = ({
  initialEndpoint = null,
  onEndpointSaved = null,
}) => {
  const { toast } = useToast();
  const { selectedEnvironment } = useApp();

  // Core Request State
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [timeout, setTimeoutVal] = useState(10000);

  const [params, setParams] = useState([]);
  const [headers, setHeaders] = useState([
    { id: 'h-1', key: 'Accept', value: 'application/json', description: '', enabled: true },
  ]);
  const [auth, setAuth] = useState({
    type: 'noauth',
    bearerToken: '',
    basicUsername: '',
    basicPassword: '',
    apiKeyName: 'X-API-Key',
    apiKeyValue: '',
    apiKeyLocation: 'header',
  });

  // Body State
  const [bodyType, setBodyType] = useState('none');
  const [jsonBody, setJsonBody] = useState('{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}');
  const [rawBody, setRawBody] = useState('');
  const [formData, setFormData] = useState([]);

  // Active Configuration Tab
  const [activeTab, setActiveTab] = useState('params');

  // Response & Execution State
  const [isSending, setIsSending] = useState(false);
  const [elapsedTimeMs, setElapsedTimeMs] = useState(0);
  const [response, setResponse] = useState(null);
  const timerIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Modals & Panels
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentLinkedEndpoint, setCurrentLinkedEndpoint] = useState(null);

  // Sync guard to prevent infinite loops between URL text and Params array
  const isUpdatingFromParams = useRef(false);

  // Initialize or prefill from initialEndpoint
  useEffect(() => {
    if (initialEndpoint) {
      setCurrentLinkedEndpoint(initialEndpoint);
      setMethod(initialEndpoint.method || 'GET');

      // Base URL from collection
      const cols = collectionService.getCollections();
      const parentCol = cols.find((c) => c.id === initialEndpoint.collectionId);
      const base = parentCol?.baseUrl || 'https://api.apiforge.dev/v1';
      const cleanPath = initialEndpoint.path?.startsWith('/')
        ? initialEndpoint.path
        : `/${initialEndpoint.path || ''}`;

      // Set initial params
      const epsParams = Array.isArray(initialEndpoint.queryParams)
        ? initialEndpoint.queryParams.map((p, i) => ({
            ...p,
            id: p.id || `p-${i}`,
            enabled: p.enabled !== undefined ? p.enabled : true,
          }))
        : [];
      setParams(epsParams);

      // Construct URL with query params
      const fullUrl = buildUrlWithParams(`${base}${cleanPath}`, epsParams);
      setUrl(fullUrl);

      // Set headers
      if (Array.isArray(initialEndpoint.headers) && initialEndpoint.headers.length > 0) {
        setHeaders(
          initialEndpoint.headers.map((h, i) => ({
            ...h,
            id: h.id || `h-${i}`,
            enabled: h.enabled !== undefined ? h.enabled : true,
          }))
        );
      }

      // Set body
      if (initialEndpoint.requestBody) {
        setBodyType('json');
        setJsonBody(
          typeof initialEndpoint.requestBody === 'object'
            ? JSON.stringify(initialEndpoint.requestBody, null, 2)
            : String(initialEndpoint.requestBody)
        );
      } else {
        setBodyType(['POST', 'PUT', 'PATCH'].includes(initialEndpoint.method) ? 'json' : 'none');
      }

      // Initial response preview if present
      if (initialEndpoint.responseExample) {
        setResponse({
          ok: true,
          status: initialEndpoint.responseExample.status || 200,
          statusText: 'OK',
          data: initialEndpoint.responseExample.body || {},
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'x-powered-by': 'APIForge-VirtualServer',
          },
          responseTimeMs: 25,
          sizeBytes: 1024,
          requestMeta: {
            method: initialEndpoint.method,
            url: fullUrl,
            headers: {},
            params: {},
          },
        });
      }
    }
  }, [initialEndpoint]);

  // Helper: append query parameters to base URL
  const buildUrlWithParams = (baseUrl, paramsList) => {
    const [baseOnly] = baseUrl.split('?');
    const activeParams = paramsList.filter((p) => p.enabled && p.key.trim());
    if (activeParams.length === 0) return baseOnly;

    const searchParams = new URLSearchParams();
    activeParams.forEach((p) => {
      searchParams.append(p.key.trim(), p.value);
    });
    return `${baseOnly}?${searchParams.toString()}`;
  };

  // When params change from UI, synchronize URL query string
  const handleParamsChange = (newParams) => {
    setParams(newParams);
    isUpdatingFromParams.current = true;
    const [baseOnly] = url.split('?');
    const newUrl = buildUrlWithParams(baseOnly, newParams);
    setUrl(newUrl);
    setTimeout(() => {
      isUpdatingFromParams.current = false;
    }, 50);
  };

  // When user edits URL directly, parse any query string into params rows
  const handleUrlChange = (newUrlText) => {
    setUrl(newUrlText);
    if (isUpdatingFromParams.current) return;

    try {
      const qIndex = newUrlText.indexOf('?');
      if (qIndex !== -1) {
        const queryString = newUrlText.slice(qIndex + 1);
        const searchParams = new URLSearchParams(queryString);
        const parsedRows = [];
        searchParams.forEach((value, key) => {
          parsedRows.push({
            id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            key,
            value,
            description: '',
            enabled: true,
          });
        });
        if (parsedRows.length > 0) {
          setParams(parsedRows);
        }
      }
    } catch (e) {
      // Ignore URL parsing errors while user is actively typing
    }
  };

  // URL Validation & Dynamic Variable Resolution Preview
  const urlValidation = (() => {
    if (!url.trim()) return { valid: false, error: 'URL is required', resolved: '', unresolved: [] };

    const envMap = buildEnvironmentVariablesMap(selectedEnvironment);
    const { resolved, unresolved } = resolveString(url, envMap);

    if (unresolved.length > 0) {
      return {
        valid: false,
        error: `Unresolved variable(s): ${unresolved.map((u) => `{{${u}}}`).join(', ')} in environment "${selectedEnvironment?.name || 'No Environment'}"`,
        resolved,
        unresolved,
        hasVariables: true,
      };
    }

    if (!resolved.startsWith('http://') && !resolved.startsWith('https://') && !resolved.startsWith('/')) {
      return {
        valid: false,
        error: 'Resolved URL must start with http://, https://, or /',
        resolved,
        unresolved: [],
        hasVariables: url.includes('{{'),
      };
    }

    return { valid: true, error: null, resolved, unresolved: [], hasVariables: url.includes('{{') };
  })();

  // Clear / Reset Request Workspace
  const handleReset = () => {
    setMethod('GET');
    setUrl('{{BASE_URL}}/posts/1');
    setParams([]);
    setHeaders([
      { id: 'h-1', key: 'Accept', value: 'application/json', description: '', enabled: true },
    ]);
    setAuth({
      type: 'noauth',
      bearerToken: '',
      basicUsername: '',
      basicPassword: '',
      apiKeyName: 'X-API-Key',
      apiKeyValue: '',
      apiKeyLocation: 'header',
    });
    setBodyType('none');
    setJsonBody('{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}');
    setRawBody('');
    setFormData([]);
    setResponse(null);
    setCurrentLinkedEndpoint(null);
    toast.info('Workspace reset to template with {{BASE_URL}}');
  };

  // Send API Request via requestService (with live timer, variable resolution & abort controller)
  const handleSendRequest = async () => {
    if (!urlValidation.valid) {
      toast.error(urlValidation.error || 'Please enter a valid URL');
      return;
    }

    if (bodyType === 'json' && jsonBody.trim()) {
      try {
        JSON.parse(jsonBody);
      } catch (err) {
        toast.error('JSON body contains syntax errors: ' + err.message);
        setActiveTab('body');
        return;
      }
    }

    // Set up cancellation
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 1. Resolve request variables against the active environment
    const {
      resolvedRequest,
      unresolvedVariables,
      hasUnresolved,
      replacedVariables,
    } = resolveRequestPayload(
      {
        url,
        method,
        headers,
        params,
        auth,
        bodyType,
        jsonBody,
        rawBody,
        formData,
        timeout,
        abortSignal: controller.signal,
      },
      selectedEnvironment
    );

    if (hasUnresolved) {
      toast.error(
        `Cannot send request with unresolved variable(s): ${unresolvedVariables.map((u) => `{{${u}}}`).join(', ')} in environment "${selectedEnvironment?.name || 'No Environment'}". Please define these variables in Environments.`
      );
      return;
    }

    setIsSending(true);
    setElapsedTimeMs(0);

    const startTime = performance.now();
    timerIntervalRef.current = setInterval(() => {
      setElapsedTimeMs(Math.round(performance.now() - startTime));
    }, 40);

    try {
      const result = await requestService.sendRequest(resolvedRequest);

      // Attach template metadata for inspection
      if (result.requestMeta) {
        result.requestMeta.templateUrl = url;
        result.requestMeta.environmentName = selectedEnvironment?.name || 'Development';
        result.requestMeta.replacedVariables = replacedVariables;
      }

      setResponse(result);

      if (result.ok) {
        toast.success(`Request completed (${result.status} ${result.statusText}) in ${result.responseTimeMs}ms`);
      } else if (result.isHttpError) {
        toast.warning(`HTTP ${result.status} ${result.statusText}`);
      } else if (result.isCanceled) {
        toast.info('Request canceled');
      } else {
        toast.error(`Request failed: ${result.statusText}`);
      }
    } catch (err) {
      toast.error('Execution error: ' + err.message);
    } finally {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setIsSending(false);
      abortControllerRef.current = null;
    }
  };

  // Cancel in-flight request
  const handleCancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Restore configuration from History snapshot
  const handleRestoreFromHistory = (snapshot) => {
    if (!snapshot) return;

    setMethod(snapshot.method || 'GET');
    setUrl(snapshot.url || '');

    // Restore Params
    if (snapshot.params) {
      if (Array.isArray(snapshot.params)) {
        setParams(snapshot.params);
      } else {
        const rows = Object.entries(snapshot.params).map(([k, v], i) => ({
          id: `p-${i}-${Date.now()}`,
          key: k,
          value: String(v),
          description: '',
          enabled: true,
        }));
        setParams(rows);
      }
    }

    // Restore Headers
    if (snapshot.headers) {
      if (Array.isArray(snapshot.headers)) {
        setHeaders(snapshot.headers);
      } else {
        const rows = Object.entries(snapshot.headers).map(([k, v], i) => ({
          id: `h-${i}-${Date.now()}`,
          key: k,
          value: String(v),
          description: '',
          enabled: true,
        }));
        setHeaders(rows);
      }
    }

    // Restore Body
    if (snapshot.bodyType) {
      setBodyType(snapshot.bodyType);
    }
    if (snapshot.body) {
      setJsonBody(
        typeof snapshot.body === 'object'
          ? JSON.stringify(snapshot.body, null, 2)
          : String(snapshot.body)
      );
    }
  };

  const handleSavedSuccess = (savedEndpoint) => {
    setCurrentLinkedEndpoint(savedEndpoint);
    onEndpointSaved?.(savedEndpoint);
    toast.success(`Saved request as "${savedEndpoint.name}"`);
  };

  const requestTabs = [
    {
      id: 'params',
      label: `Params (${params.filter((p) => p.enabled && p.key.trim()).length})`,
      icon: Sliders,
    },
    {
      id: 'headers',
      label: `Headers (${headers.filter((h) => h.enabled && h.key.trim()).length})`,
      icon: FileCode2,
    },
    {
      id: 'auth',
      label: `Auth (${auth.type !== 'noauth' ? auth.type : 'none'})`,
      icon: KeyRound,
    },
    {
      id: 'body',
      label: `Body (${bodyType})`,
      icon: FileJson,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Command Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        {/* Active Environment Context Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="text-slate-400">Target Env:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {selectedEnvironment?.name || 'No Environment'}
            </span>
            {selectedEnvironment?.baseUrl && (
              <span className="text-[11px] text-slate-400 hidden sm:inline truncate max-w-xs">
                ({selectedEnvironment.baseUrl})
              </span>
            )}
          </div>

          <Link
            to="/environments"
            className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1"
          >
            <span>Manage Variables ({selectedEnvironment?.variables?.length || 0})</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* Linked Endpoint Banner (if linked) */}
        {currentLinkedEndpoint && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-xs font-mono">
            <div className="flex items-center space-x-2 truncate">
              <span className="font-bold text-brand-600 dark:text-brand-400">Linked Endpoint:</span>
              <span className="text-slate-800 dark:text-slate-200 truncate">{currentLinkedEndpoint.name}</span>
              <span className="text-slate-400">({currentLinkedEndpoint.path})</span>
            </div>
            <span className="text-[10px] text-slate-400 shrink-0">ID: {currentLinkedEndpoint.id}</span>
          </div>
        )}

        {/* Primary Method + URL + Actions Input Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Method Selector */}
          <div className="shrink-0">
            <MethodSelector value={method} onChange={setMethod} />
          </div>

          {/* URL Input */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="https://api.example.com/v1/resource?param=val or {{BASE_URL}}/users"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              disabled={isSending}
              className={`
                w-full px-3.5 py-2 text-xs font-mono rounded-lg border transition-all
                bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400
                focus:outline-none focus:ring-2 focus:ring-brand-500/30
                ${
                  !urlValidation.valid
                    ? 'border-rose-400 dark:border-rose-600 focus:border-rose-500'
                    : 'border-slate-200 dark:border-slate-800 focus:border-brand-500'
                }
              `}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendRequest}
              loading={isSending}
              disabled={isSending}
              leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
            >
              Send
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSaveModalOpen(true)}
              leftIcon={<Bookmark className="w-3.5 h-3.5" />}
              title="Save request into an API collection"
            >
              Save
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryOpen(true)}
              leftIcon={<History className="w-3.5 h-3.5 text-slate-400" />}
              title="View request execution history"
            >
              History
            </Button>

            {/* Timeout Selector */}
            <div className="relative">
              <select
                value={timeout}
                onChange={(e) => setTimeoutVal(Number(e.target.value))}
                className="px-2 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 focus:outline-none"
                title="Configurable request timeout"
              >
                {TIMEOUT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              title="Clear & reset workspace"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            </Button>
          </div>
        </div>

        {/* Live Resolved URL Preview (When using {{VARIABLE}} syntax) */}
        {url.includes('{{') && urlValidation.valid && (
          <div className="flex items-center space-x-2 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="font-semibold text-slate-500 dark:text-slate-400">Resolves to:</span>
            <span className="truncate">{urlValidation.resolved}</span>
            <span className="text-slate-400 shrink-0">({selectedEnvironment?.name || 'Default'})</span>
          </div>
        )}

        {/* URL Validation or Unresolved Variable Error Banner */}
        {!urlValidation.valid && (
          <div className="text-[11px] font-mono text-rose-500 bg-rose-500/10 px-2.5 py-1.5 rounded-lg border border-rose-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 truncate">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{urlValidation.error}</span>
            </div>
            {urlValidation.unresolved?.length > 0 && (
              <Link
                to="/environments"
                className="underline text-brand-600 dark:text-brand-400 shrink-0 ml-2 font-semibold"
              >
                Define in Environments →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Request Configuration Tabs Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Tab Switcher */}
        <div className="px-4 pt-3 border-b border-slate-200 dark:border-slate-800">
          <Tabs
            tabs={requestTabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="pills"
            size="sm"
          />
        </div>

        {/* Tab Body */}
        <div className="p-5">
          {activeTab === 'params' && (
            <RequestParams params={params} onChange={handleParamsChange} />
          )}

          {activeTab === 'headers' && (
            <RequestHeaders headers={headers} onChange={setHeaders} />
          )}

          {activeTab === 'auth' && (
            <RequestAuthorization auth={auth} onChange={setAuth} />
          )}

          {activeTab === 'body' && (
            <RequestBody
              bodyType={bodyType}
              onBodyTypeChange={setBodyType}
              jsonBody={jsonBody}
              onJsonChange={setJsonBody}
              rawBody={rawBody}
              onRawChange={setRawBody}
              formData={formData}
              onFormDataChange={setFormData}
            />
          )}
        </div>
      </div>

      {/* Response Panel */}
      <ResponseViewer
        response={response}
        isSending={isSending}
        elapsedTimeMs={elapsedTimeMs}
        onCancelRequest={handleCancelRequest}
      />

      {/* Request History Drawer */}
      <RequestHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onRestoreRequest={handleRestoreFromHistory}
      />

      {/* Save Request Modal */}
      <SaveRequestModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSaved={handleSavedSuccess}
        requestData={{
          method,
          url,
          params,
          headers,
          auth,
          body: bodyType === 'json' && jsonBody.trim() ? JSON.parse(jsonBody) : jsonBody,
        }}
        existingEndpoint={currentLinkedEndpoint}
      />
    </div>
  );
};

export default RequestBuilder;
