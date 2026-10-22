import React, { useState } from 'react';
import { StatusBadge, Badge } from '../../common/Badge';
import Button from '../../common/Button';
import { 
  Play, 
  Copy, 
  Check, 
  Clock, 
  Database, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Info
} from 'lucide-react';

export const ResponsePlaceholder = ({
  response = null,
  isSending = false,
  onSimulateRequest,
}) => {
  const [activeTab, setActiveTab] = useState('body');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!response?.data) return;
    navigator.clipboard.writeText(
      typeof response.data === 'string'
        ? response.data
        : JSON.stringify(response.data, null, 2)
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Response Header / Status Banner */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono">
            Response Output
          </span>
          {response && (
            <>
              <StatusBadge status={response.status || 200} />
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{response.responseTimeMs || 34} ms</span>
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                <Database className="w-3.5 h-3.5" />
                <span>{response.sizeBytes ? `${response.sizeBytes} B` : '1.24 KB'}</span>
              </span>
              <Badge variant="warning" size="sm">
                Day 5 UI Simulator
              </Badge>
            </>
          )}
        </div>

        {response && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveTab('body')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeTab === 'body'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Body ({typeof response.data === 'object' ? 'JSON' : 'Text'})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('headers')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeTab === 'headers'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Headers ({Object.keys(response.headers || {}).length})
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleCopy}
              leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        )}
      </div>

      {/* Main Response Body / Tab Content */}
      <div className="p-4">
        {isSending ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Simulating outgoing request dispatch...
            </p>
          </div>
        ) : response ? (
          <div>
            {activeTab === 'body' && (
              <div className="relative">
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto max-h-[420px] custom-scrollbar selection:bg-brand-500/30">
                  {typeof response.data === 'string'
                    ? response.data
                    : JSON.stringify(response.data, null, 2)}
                </pre>
              </div>
            )}

            {activeTab === 'headers' && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
                <div className="grid grid-cols-12 gap-2 p-2.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                  <div className="col-span-5">Header Key</div>
                  <div className="col-span-7">Header Value</div>
                </div>
                <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60 max-h-[380px] overflow-y-auto custom-scrollbar">
                  {Object.entries(response.headers || {}).map(([key, val]) => (
                    <div key={key} className="grid grid-cols-12 gap-2 p-2.5 font-mono text-xs">
                      <div className="col-span-5 font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {key}
                      </div>
                      <div className="col-span-7 text-cyan-600 dark:text-cyan-400 truncate">
                        {String(val)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Note banner explaining Day 5 vs Day 6 */}
            <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-mono flex items-start space-x-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Day 5 Verification Notice:</strong> This response is generated by the local UI request simulator testbed for parameter and schema testing. Full live network execution, CORS proxying, and comprehensive response inspection will be completed in <strong>Day 6</strong>.
              </span>
            </div>
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
                Configure your URL, query parameters, headers, authorization, or request body above, then click <strong>Send</strong> to run the request simulator.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsePlaceholder;
