import React, { useState, useMemo, useEffect } from 'react';
import { StatusBadge, Badge } from '../../common/Badge';
import Button from '../../common/Button';
import RequestInspector from './RequestInspector';
import {
  Play,
  Copy,
  Check,
  Clock,
  Database,
  Download,
  Search,
  AlertTriangle,
  XCircle,
  FileText,
  FileCode2,
  Code2,
  Eye,
  Sliders,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

export const ResponseViewer = ({
  response = null,
  isSending = false,
  elapsedTimeMs = 0,
  onCancelRequest,
}) => {
  const [activeTab, setActiveTab] = useState('body'); // 'body' | 'headers' | 'raw' | 'preview' | 'inspector'
  const [copiedBody, setCopiedBody] = useState(false);
  const [copiedHeaders, setCopiedHeaders] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [forceRenderLarge, setForceRenderLarge] = useState(false);

  // Auto switch tab if error occurred
  useEffect(() => {
    if (response) {
      if (response.isNetworkError) {
        setActiveTab('inspector');
      } else {
        setActiveTab('body');
      }
      setSearchFilter('');
      setForceRenderLarge(false);
    }
  }, [response]);

  // Format response data
  const { formattedBody, isJson, isLargePayload } = useMemo(() => {
    if (!response || response.data === undefined || response.data === null) {
      return { formattedBody: '', isJson: false, isLargePayload: false };
    }

    const data = response.data;
    const isLarge = (response.sizeBytes || 0) > 400 * 1024; // > 400 KB

    if (typeof data === 'object') {
      try {
        const json = JSON.stringify(data, null, 2);
        return { formattedBody: json, isJson: true, isLargePayload: isLarge };
      } catch (e) {
        return { formattedBody: String(data), isJson: false, isLargePayload: false };
      }
    }

    // Try parsing if string is JSON
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        const json = JSON.stringify(parsed, null, 2);
        return { formattedBody: json, isJson: true, isLargePayload: isLarge };
      } catch (e) {
        return { formattedBody: data, isJson: false, isLargePayload: isLarge };
      }
    }

    return { formattedBody: String(data), isJson: false, isLargePayload: false };
  }, [response]);

  // Filtered body search lines
  const displayBody = useMemo(() => {
    if (!formattedBody) return '';
    if (isLargePayload && !forceRenderLarge) {
      return formattedBody.slice(0, 3000) + '\n\n... [Response truncated: payload exceeds 400 KB to preserve browser responsiveness. Click below to render complete body]';
    }
    return formattedBody;
  }, [formattedBody, isLargePayload, forceRenderLarge]);

  const copyBody = () => {
    if (!formattedBody) return;
    navigator.clipboard.writeText(formattedBody);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  const copyHeaders = () => {
    if (!response?.headers) return;
    navigator.clipboard.writeText(JSON.stringify(response.headers, null, 2));
    setCopiedHeaders(true);
    setTimeout(() => setCopiedHeaders(false), 2000);
  };

  const downloadResponse = () => {
    if (!formattedBody) return;
    const blob = new Blob([formattedBody], {
      type: isJson ? 'application/json' : 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response_${Date.now()}.${isJson ? 'json' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Format Size
  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Filter headers
  const filteredHeaders = useMemo(() => {
    if (!response?.headers) return [];
    const entries = Object.entries(response.headers);
    if (!searchFilter.trim()) return entries;
    const q = searchFilter.toLowerCase();
    return entries.filter(([k, v]) => k.toLowerCase().includes(q) || String(v).toLowerCase().includes(q));
  }, [response?.headers, searchFilter]);

  const tabsConfig = [
    { id: 'body', label: `Body ${isJson ? '(JSON)' : ''}`, icon: FileCode2 },
    { id: 'headers', label: `Headers (${Object.keys(response?.headers || {}).length})`, icon: FileText },
    { id: 'raw', label: 'Raw', icon: Code2 },
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'inspector', label: 'Inspector', icon: Sliders },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Top Banner / Status Strip */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-950/60">
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono">
            Response
          </span>

          {isSending ? (
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-ping"></span>
              <span className="text-xs font-mono text-brand-600 dark:text-brand-400 font-bold">
                Sending request... ({elapsedTimeMs} ms)
              </span>
            </div>
          ) : response ? (
            <>
              {response.isNetworkError ? (
                <Badge variant="danger" size="sm">
                  {response.statusText || 'Network Error'}
                </Badge>
              ) : response.isTimeout ? (
                <Badge variant="warning" size="sm">
                  Request Timeout
                </Badge>
              ) : response.isCanceled ? (
                <Badge variant="neutral" size="sm">
                  Canceled
                </Badge>
              ) : (
                <StatusBadge status={response.status} />
              )}

              <span className="text-xs font-mono text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{response.responseTimeMs} ms</span>
              </span>

              <span className="text-xs font-mono text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatSize(response.sizeBytes)}</span>
              </span>
            </>
          ) : (
            <span className="text-xs text-slate-400 font-mono">No response yet</span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {isSending && (
            <Button
              type="button"
              variant="danger"
              size="xs"
              onClick={onCancelRequest}
              leftIcon={<XCircle className="w-3.5 h-3.5" />}
            >
              Cancel Request
            </Button>
          )}

          {response && !isSending && (
            <>
              {activeTab === 'body' && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={copyBody}
                    disabled={!formattedBody}
                    leftIcon={copiedBody ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    {copiedBody ? 'Copied' : 'Copy'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={downloadResponse}
                    disabled={!formattedBody}
                    title="Download Response"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                  </Button>
                </>
              )}

              {activeTab === 'headers' && (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={copyHeaders}
                  leftIcon={copiedHeaders ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copiedHeaders ? 'Copied' : 'Copy Headers'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs Switcher Strip */}
      {response && !isSending && (
        <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/30 dark:bg-slate-900/40">
          <div className="flex items-center space-x-1 overflow-x-auto custom-scrollbar">
            {tabsConfig.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`
                    flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all shrink-0
                    ${
                      isActive
                        ? 'bg-brand-500/15 text-brand-600 dark:text-brand-300 font-bold border border-brand-500/30 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }
                  `}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Filter (for body or headers) */}
          {(activeTab === 'body' || activeTab === 'headers') && (
            <div className="relative w-44">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter output..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          )}
        </div>
      )}

      {/* Main Body Area */}
      <div className="p-4">
        {isSending ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                Awaiting response from target server...
              </p>
              <p className="text-[11px] font-mono text-slate-500">
                Elapsed: {elapsedTimeMs} ms • Request in flight
              </p>
            </div>
          </div>
        ) : response ? (
          <div>
            {/* 1. Body Tab */}
            {activeTab === 'body' && (
              <div className="space-y-3">
                {formattedBody ? (
                  <>
                    <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto max-h-[460px] custom-scrollbar selection:bg-brand-500/30 leading-5">
                      {displayBody}
                    </pre>

                    {isLargePayload && !forceRenderLarge && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-mono">
                        <span>Large payload ({formatSize(response.sizeBytes)}). Showing preview.</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => setForceRenderLarge(true)}
                        >
                          Render Full Payload
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-500">
                    Response body is empty (Status: {response.status} {response.statusText}).
                  </div>
                )}
              </div>
            )}

            {/* 2. Headers Tab */}
            {activeTab === 'headers' && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
                <div className="grid grid-cols-12 gap-2 p-2.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                  <div className="col-span-5">Header Key</div>
                  <div className="col-span-7">Header Value</div>
                </div>

                <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60 max-h-[420px] overflow-y-auto custom-scrollbar">
                  {filteredHeaders.length > 0 ? (
                    filteredHeaders.map(([k, v]) => (
                      <div key={k} className="grid grid-cols-12 gap-2 p-2.5 font-mono text-xs">
                        <div className="col-span-5 font-semibold text-slate-700 dark:text-slate-300 truncate">
                          {k}
                        </div>
                        <div className="col-span-7 text-cyan-600 dark:text-cyan-400 truncate select-all">
                          {String(v)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs font-mono text-slate-500">
                      {searchFilter ? 'No headers match your filter query.' : 'No response headers available.'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Raw Tab */}
            {activeTab === 'raw' && (
              <textarea
                readOnly
                value={typeof response.data === 'string' ? response.data : JSON.stringify(response.data)}
                rows={12}
                className="w-full p-4 font-mono text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-200 focus:outline-none custom-scrollbar"
              />
            )}

            {/* 4. Preview Tab */}
            {activeTab === 'preview' && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white min-h-[300px]">
                {typeof response.data === 'string' && response.data.includes('<html') ? (
                  <iframe
                    title="HTML Response Preview"
                    srcDoc={response.data}
                    sandbox="allow-same-origin"
                    className="w-full h-80 border-0"
                  />
                ) : (
                  <div className="p-6 text-center space-y-2 text-slate-600 font-mono text-xs">
                    <p>Standard JSON/Text response preview:</p>
                    <pre className="text-left p-4 bg-slate-100 rounded-lg max-h-60 overflow-y-auto text-slate-800 text-[11px]">
                      {formattedBody || 'No previewable content'}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* 5. Inspector Tab */}
            {activeTab === 'inspector' && (
              <RequestInspector
                requestMeta={response.requestMeta}
                response={response}
              />
            )}
          </div>
        ) : (
          <div className="py-14 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Play className="w-6 h-6 ml-0.5 text-brand-500" />
            </div>
            <div className="space-y-1">
              <h5 className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                Ready to Send Request
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Configure your URL, query parameters, headers, authorization, or request body above, then click <strong>Send</strong> to execute the API call.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseViewer;
