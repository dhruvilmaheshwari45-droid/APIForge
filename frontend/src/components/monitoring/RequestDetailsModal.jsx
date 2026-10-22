import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Terminal, 
  Clock, 
  Globe, 
  Shield, 
  Server, 
  Layers, 
  FileText, 
  AlertTriangle,
  Code2,
  ExternalLink
} from 'lucide-react';
import { MethodBadge, StatusBadge, Badge } from '../common/Badge';

export const RequestDetailsModal = ({ isOpen, onClose, log }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedField, setCopiedField] = useState(null);

  if (!isOpen || !log) return null;

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    const stringText = typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text);
    navigator.clipboard.writeText(stringText);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const generateCurl = () => {
    if (!log) return '';
    let curl = `curl -X ${log.method || 'GET'} "${log.url || log.path}"`;
    if (log.requestHeaders && Object.keys(log.requestHeaders).length > 0) {
      Object.entries(log.requestHeaders).forEach(([k, v]) => {
        curl += ` \\\n  -H "${k}: ${v}"`;
      });
    }
    if (log.requestBody) {
      const bodyStr = typeof log.requestBody === 'object' ? JSON.stringify(log.requestBody) : String(log.requestBody);
      curl += ` \\\n  --data '${bodyStr.replace(/'/g, "'\\''")}'`;
    }
    return curl;
  };

  const isError = Boolean(log.isError || (log.status >= 400) || log.status === 0);

  const formatPayload = (payload) => {
    if (payload === null || payload === undefined) return null;
    if (typeof payload === 'object') {
      try {
        return JSON.stringify(payload, null, 2);
      } catch {
        return String(payload);
      }
    }
    try {
      const parsed = JSON.parse(payload);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return String(payload);
    }
  };

  const reqBodyFormatted = formatPayload(log.requestBody);
  const resBodyFormatted = formatPayload(log.responseBody);

  const queryParamsList = Object.entries(log.queryParams || {});
  const reqHeadersList = Object.entries(log.requestHeaders || {});
  const resHeadersList = Object.entries(log.responseHeaders || {});

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl z-10 overflow-hidden flex flex-col max-h-[92vh] animate-scaleIn">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 pb-3 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between shrink-0 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="space-y-1.5 flex-1 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <MethodBadge method={log.method} size="sm" />
              <span className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 break-all">
                {log.path || log.url}
              </span>
              <StatusBadge status={log.status} />
              <Badge 
                variant={log.source === 'real' ? 'primary' : 'neutral'} 
                size="sm"
                className="capitalize"
              >
                {log.source === 'real' ? 'Real Execution' : 'Demo Stream'}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {new Date(log.timestamp).toLocaleString()}
              </span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                {log.responseTimeMs} ms
              </span>
              <span>•</span>
              <span>{log.sizeBytes > 0 ? `${(log.sizeBytes / 1024).toFixed(1)} KB` : '0 B'}</span>
              <span>•</span>
              <span className="text-slate-400">ID: {log.requestId}</span>
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <button
              type="button"
              onClick={() => handleCopy(generateCurl(), 'curl')}
              title="Copy as cURL"
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-mono flex items-center gap-1.5 shadow-sm transition-colors"
            >
              {copiedField === 'curl' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Terminal className="w-3.5 h-3.5 text-brand-500" />
                  <span>Copy cURL</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <nav className="flex space-x-6 overflow-x-auto text-xs font-mono" aria-label="Tabs">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'headers', label: `Headers (${reqHeadersList.length})` },
              { id: 'params', label: `Query Params (${queryParamsList.length})` },
              { id: 'reqBody', label: `Request Body ${reqBodyFormatted ? '•' : ''}` },
              { id: 'resBody', label: `Response Body ${resBodyFormatted ? '•' : ''}` },
              { id: 'resHeaders', label: `Response Headers (${resHeadersList.length})` },
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 custom-scrollbar font-sans text-sm">
          {/* Error Banner if applicable */}
          {isError && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-3 text-rose-800 dark:text-rose-300">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1 text-xs">
                <div className="font-bold font-mono text-sm">
                  {log.status === 0 ? 'Network Connection Failed' : `HTTP ${log.status} ${log.statusText}`}
                </div>
                <div className="font-mono text-slate-600 dark:text-rose-200/80 break-words">
                  {log.errorMessage || (log.status >= 500 ? 'Server internal fault response' : 'Client error status received')}
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Full Destination URL
                  </div>
                  <div className="font-mono text-xs text-slate-900 dark:text-slate-100 break-all select-all flex items-center justify-between">
                    <span>{log.url || log.path}</span>
                    <button
                      onClick={() => handleCopy(log.url || log.path, 'url')}
                      className="p-1 text-slate-400 hover:text-slate-200 ml-2"
                      title="Copy URL"
                    >
                      {copiedField === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Target Environment
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {log.environment || 'Development'}
                    </span>
                    <Badge variant="neutral" size="sm">
                      {log.source === 'real' ? 'Client Request' : 'Simulated Traffic'}
                    </Badge>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Client Origin IP
                  </div>
                  <div className="font-mono text-xs text-slate-800 dark:text-slate-200">
                    {log.ipAddress || log.clientIp || '127.0.0.1 (Local)'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    User-Agent Client
                  </div>
                  <div className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate" title={log.userAgent}>
                    {log.userAgent || 'APIForge / HTTP-Client'}
                  </div>
                </div>
              </div>

              {/* Execution Telemetry Summary */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-500" />
                  Telemetry Diagnostics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Status Code</span>
                    <span className="text-slate-900 dark:text-slate-100 font-bold text-sm">
                      {log.status} {log.statusText}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Duration Latency</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold text-sm">
                      {log.responseTimeMs} ms
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Transferred Size</span>
                    <span className="text-slate-900 dark:text-slate-100 font-bold text-sm">
                      {log.sizeBytes > 0 ? `${log.sizeBytes} B` : '0 B'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Correlation ID</span>
                    <span className="text-slate-700 dark:text-slate-300 text-xs truncate block" title={log.requestId}>
                      {log.requestId}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REQUEST HEADERS */}
          {activeTab === 'headers' && (
            <div className="space-y-3">
              <div className="p-2.5 bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/50 rounded-lg flex items-center justify-between text-xs text-brand-800 dark:text-brand-300">
                <span className="flex items-center gap-1.5 font-mono">
                  <Shield className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                  Sensitive authorization tokens & secret credentials are automatically masked (••••••••).
                </span>
                <span className="text-[11px] text-brand-600 dark:text-brand-400 font-mono">
                  {reqHeadersList.length} header{reqHeadersList.length === 1 ? '' : 's'}
                </span>
              </div>

              {reqHeadersList.length > 0 ? (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-2.5 px-3 w-1/3">Header Name</th>
                        <th className="p-2.5 px-3">Header Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                      {reqHeadersList.map(([key, val]) => (
                        <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">{key}</td>
                          <td className="p-2.5 px-3 text-slate-900 dark:text-slate-100 break-all select-all">
                            {String(val)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-400">
                  No request headers provided with this call.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QUERY PARAMETERS */}
          {activeTab === 'params' && (
            <div className="space-y-3">
              {queryParamsList.length > 0 ? (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-2.5 px-3 w-1/3">Parameter Key</th>
                        <th className="p-2.5 px-3">Parameter Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                      {queryParamsList.map(([key, val]) => (
                        <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">{key}</td>
                          <td className="p-2.5 px-3 text-slate-900 dark:text-slate-100 break-all select-all">
                            {String(val)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-400">
                  No query parameters appended in URL.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REQUEST BODY */}
          {activeTab === 'reqBody' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Payload Content</span>
                {reqBodyFormatted && (
                  <button
                    onClick={() => handleCopy(reqBodyFormatted, 'reqBody')}
                    className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                  >
                    {copiedField === 'reqBody' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'reqBody' ? 'Copied' : 'Copy Payload'}</span>
                  </button>
                )}
              </div>

              {reqBodyFormatted ? (
                <div className="bg-slate-950 text-slate-100 p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto max-h-80 custom-scrollbar select-all">
                  <pre>{reqBodyFormatted}</pre>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-400 space-y-1">
                  <p className="font-medium text-slate-500 dark:text-slate-400">Empty Request Body</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    No payload body was dispatched with this {log.method} request.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: RESPONSE BODY */}
          {activeTab === 'resBody' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Returned Response Payload</span>
                {resBodyFormatted && (
                  <button
                    onClick={() => handleCopy(resBodyFormatted, 'resBody')}
                    className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                  >
                    {copiedField === 'resBody' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'resBody' ? 'Copied' : 'Copy Response'}</span>
                  </button>
                )}
              </div>

              {resBodyFormatted ? (
                <div className="bg-slate-950 text-slate-100 p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto max-h-80 custom-scrollbar select-all">
                  <pre>{resBodyFormatted}</pre>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-400 space-y-1">
                  <p className="font-medium text-slate-500 dark:text-slate-400">No Response Body Returned</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {log.status === 204
                      ? 'HTTP 204 No Content returned per specification.'
                      : log.status === 0
                      ? 'Request failed before receiving an HTTP body payload.'
                      : 'The remote server did not return a body in this response.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: RESPONSE HEADERS */}
          {activeTab === 'resHeaders' && (
            <div className="space-y-3">
              {resHeadersList.length > 0 ? (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-2.5 px-3 w-1/3">Response Header</th>
                        <th className="p-2.5 px-3">Header Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                      {resHeadersList.map(([key, val]) => (
                        <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">{key}</td>
                          <td className="p-2.5 px-3 text-slate-900 dark:text-slate-100 break-all select-all">
                            {String(val)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-400">
                  No response headers recorded for this call.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-5 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] font-mono text-slate-400">
            Request Log ID: <span className="text-slate-600 dark:text-slate-300">{log.id}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-medium font-mono transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailsModal;
