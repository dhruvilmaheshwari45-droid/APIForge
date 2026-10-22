import React from 'react';
import Button from '../../common/Button';
import { Plus, Trash2, Info, Sparkles } from 'lucide-react';

const COMMON_HEADERS = [
  { key: 'Content-Type', value: 'application/json' },
  { key: 'Accept', value: 'application/json, text/plain, */*' },
  { key: 'Cache-Control', value: 'no-cache' },
  { key: 'X-Requested-With', value: 'XMLHttpRequest' },
];

export const RequestHeaders = ({ headers = [], onChange }) => {
  const addHeader = (customKey = '', customValue = '') => {
    const newHeader = {
      id: `h-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      key: customKey,
      value: customValue,
      description: '',
      enabled: true,
    };
    onChange?.([...headers, newHeader]);
  };

  const updateHeader = (id, field, value) => {
    const updated = headers.map((h) =>
      h.id === id ? { ...h, [field]: value } : h
    );
    onChange?.(updated);
  };

  const removeHeader = (id) => {
    onChange?.(headers.filter((h) => h.id !== id));
  };

  const toggleAll = (enable) => {
    onChange?.(headers.map((h) => ({ ...h, enabled: enable })));
  };

  const clearAll = () => {
    onChange?.([]);
  };

  const activeCount = headers.filter((h) => h.enabled && h.key.trim()).length;

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
            Request Headers ({activeCount} active)
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            HTTP headers dispatched along with the outgoing request
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {headers.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => toggleAll(true)}
                className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-mono"
              >
                Enable All
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <button
                type="button"
                onClick={() => toggleAll(false)}
                className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-mono"
              >
                Disable All
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] text-rose-500 hover:text-rose-600 font-mono"
              >
                Clear
              </button>
            </>
          )}
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => addHeader()}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Header
          </Button>
        </div>
      </div>

      {/* Quick Add Preset Headers */}
      <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar pb-1 text-xs">
        <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold shrink-0 mr-1 flex items-center space-x-1">
          <Sparkles className="w-3 h-3 text-brand-500" />
          <span>Quick add:</span>
        </span>
        {COMMON_HEADERS.map((ch) => (
          <button
            key={ch.key}
            type="button"
            onClick={() => addHeader(ch.key, ch.value)}
            className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-300 transition-colors shrink-0 border border-slate-200 dark:border-slate-700"
          >
            + {ch.key}
          </button>
        ))}
      </div>

      {/* Headers Table */}
      {headers.length > 0 ? (
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
          <div className="grid grid-cols-12 gap-2 p-2.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
            <div className="col-span-1 text-center">Active</div>
            <div className="col-span-4">Header Key</div>
            <div className="col-span-4">Header Value</div>
            <div className="col-span-2">Description</div>
            <div className="col-span-1 text-right pr-2">Action</div>
          </div>

          <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {headers.map((h) => (
              <div
                key={h.id}
                className={`grid grid-cols-12 gap-2 p-2 items-center transition-colors ${
                  h.enabled
                    ? 'hover:bg-white dark:hover:bg-slate-900/60'
                    : 'opacity-50 bg-slate-100/50 dark:bg-slate-900/30'
                }`}
              >
                {/* Active Toggle */}
                <div className="col-span-1 flex justify-center">
                  <input
                    type="checkbox"
                    checked={h.enabled}
                    onChange={(e) => updateHeader(h.id, 'enabled', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    title={h.enabled ? 'Enabled' : 'Disabled'}
                  />
                </div>

                {/* Key */}
                <div className="col-span-4">
                  <input
                    type="text"
                    placeholder="Header (e.g. Content-Type)"
                    value={h.key}
                    onChange={(e) => updateHeader(h.id, 'key', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* Value */}
                <div className="col-span-4">
                  <input
                    type="text"
                    placeholder="Value (e.g. application/json)"
                    value={h.value}
                    onChange={(e) => updateHeader(h.id, 'value', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Optional note"
                    value={h.description || ''}
                    onChange={(e) => updateHeader(h.id, 'description', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* Action */}
                <div className="col-span-1 flex justify-end pr-1">
                  <button
                    type="button"
                    onClick={() => removeHeader(h.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded transition-colors"
                    title="Remove header"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            No custom headers configured. Standard client headers will be applied automatically.
          </p>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => addHeader()}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Header
          </Button>
        </div>
      )}

      {/* Helpful Hint */}
      <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
        <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
        <span>Headers configured under Authorization will be merged automatically into outgoing requests.</span>
      </div>
    </div>
  );
};

export default RequestHeaders;
