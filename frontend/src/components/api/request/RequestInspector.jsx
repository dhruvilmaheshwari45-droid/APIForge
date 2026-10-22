import React, { useState } from 'react';
import { MethodBadge, StatusBadge, Badge } from '../../common/Badge';
import Button from '../../common/Button';
import { 
  Terminal, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Clock, 
  Database, 
  ShieldCheck, 
  AlertTriangle,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';

export const RequestInspector = ({ requestMeta = {}, response = {} }) => {
  const [showMasked, setShowMasked] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const finalUrl = (() => {
    if (!requestMeta.url) return '';
    const [base] = requestMeta.url.split('?');
    const params = requestMeta.params || {};
    const entries = Object.entries(params);
    if (entries.length === 0) return base;
    const sp = new URLSearchParams();
    entries.forEach(([k, v]) => sp.append(k, v));
    return `${base}?${sp.toString()}`;
  })();

  // Generate cURL command
  const generateCurl = () => {
    const method = requestMeta.method || 'GET';
    let curl = `curl -X ${method} "${finalUrl}"`;

    const headers = requestMeta.headers || {};
    Object.entries(headers).forEach(([k, v]) => {
      curl += ` \\\n  -H "${k}: ${v}"`;
    });

    if (requestMeta.body) {
      const bodyStr = typeof requestMeta.body === 'object' 
        ? JSON.stringify(requestMeta.body) 
        : String(requestMeta.body);
      curl += ` \\\n  -d '${bodyStr.replace(/'/g, "\\'")}'`;
    }

    return curl;
  };

  const copyCurl = () => {
    navigator.clipboard.writeText(generateCurl());
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const headersToDisplay = showMasked ? requestMeta.headers || {} : requestMeta.maskedHeaders || {};

  return (
    <div className="space-y-6 text-xs font-mono">
      {/* Overview Diagnostic Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-slate-200">
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <MethodBadge method={requestMeta.method || 'GET'} size="md" />
          <span className="font-bold text-slate-100 truncate max-w-md">{finalUrl}</span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={copyCurl}
            leftIcon={copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Terminal className="w-3.5 h-3.5 text-brand-400" />}
          >
            {copiedCurl ? 'cURL Copied' : 'Copy cURL'}
          </Button>
        </div>
      </div>

      {/* Grid: Request Side vs Response Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outgoing Request Diagnostics */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <h5 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
              <span>Dispatched Request</span>
            </h5>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setShowMasked(!showMasked)}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center space-x-1 font-mono"
                title="Toggle reveal secrets"
              >
                {showMasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showMasked ? 'Mask Secrets' : 'Reveal'}</span>
              </button>
            </div>
          </div>

          {/* Outgoing Headers */}
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
              Request Headers ({Object.keys(headersToDisplay).length})
            </span>
            {Object.keys(headersToDisplay).length > 0 ? (
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-2.5 space-y-1 overflow-x-auto">
                {Object.entries(headersToDisplay).map(([k, v]) => (
                  <div key={k} className="flex">
                    <span className="text-slate-400 font-semibold min-w-[130px]">{k}:</span>
                    <span className="text-cyan-400 truncate">{String(v)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-slate-500 italic text-[11px]">No custom headers dispatched.</span>
            )}
          </div>

          {/* Outgoing Query Parameters */}
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
              Query Parameters ({Object.keys(requestMeta.params || {}).length})
            </span>
            {Object.keys(requestMeta.params || {}).length > 0 ? (
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-2.5 space-y-1 overflow-x-auto">
                {Object.entries(requestMeta.params || {}).map(([k, v]) => (
                  <div key={k} className="flex">
                    <span className="text-slate-400 font-semibold min-w-[130px]">{k}:</span>
                    <span className="text-brand-400 truncate">{String(v)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-slate-500 italic text-[11px]">No query parameters attached.</span>
            )}
          </div>

          {/* Outgoing Body */}
          {requestMeta.body && (
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                Dispatched Payload ({requestMeta.bodyType || 'JSON'})
              </span>
              <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 overflow-x-auto max-h-48 text-[11px]">
                {typeof requestMeta.body === 'object'
                  ? JSON.stringify(requestMeta.body, null, 2)
                  : String(requestMeta.body)}
              </pre>
            </div>
          )}
        </div>

        {/* Incoming Response Diagnostics */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <h5 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${response.status >= 200 && response.status < 400 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              <span>Response Metrics</span>
            </h5>
            <div className="flex items-center space-x-2">
              <StatusBadge status={response.status || 0} />
            </div>
          </div>

          {/* Timing & Size Strip */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Latency</span>
              <span className="text-sm font-bold text-slate-200">{response.responseTimeMs || 0} ms</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Size</span>
              <span className="text-sm font-bold text-slate-200">
                {response.sizeBytes ? `${(response.sizeBytes / 1024).toFixed(2)} KB` : '0 B'}
              </span>
            </div>
          </div>

          {/* Response Headers */}
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
              Server Headers ({Object.keys(response.headers || {}).length})
            </span>
            {Object.keys(response.headers || {}).length > 0 ? (
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-2.5 space-y-1 overflow-x-auto max-h-48">
                {Object.entries(response.headers || {}).map(([k, v]) => (
                  <div key={k} className="flex">
                    <span className="text-slate-400 font-semibold min-w-[140px] truncate">{k}:</span>
                    <span className="text-emerald-400 truncate">{String(v)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-slate-500 italic text-[11px]">
                {response.corsLikely ? 'Headers unavailable (CORS blocked)' : 'No response headers received.'}
              </span>
            )}
          </div>

          {/* Network Failure / CORS Diagnostic Advice */}
          {response.isNetworkError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] space-y-2">
              <div className="flex items-center space-x-2 font-bold text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Network / Browser Security Block</span>
              </div>
              <p className="leading-relaxed">
                {response.error || 'The connection failed. Most commonly, this is caused by browser CORS policies when targeting servers that do not return Access-Control-Allow-Origin headers.'}
              </p>
              <div className="pt-1 text-[10px] text-slate-400 border-t border-rose-500/20">
                Tip: Test with public CORS-friendly APIs such as <code className="text-cyan-400">https://jsonplaceholder.typicode.com/posts</code> or <code className="text-cyan-400">https://httpbin.org/get</code>.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestInspector;
