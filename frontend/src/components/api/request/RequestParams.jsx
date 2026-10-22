import React from 'react';
import Button from '../../common/Button';
import { Plus, Trash2, CheckSquare, Square, Info } from 'lucide-react';

export const RequestParams = ({ params = [], onChange }) => {
  const addParam = () => {
    const newParam = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      key: '',
      value: '',
      description: '',
      enabled: true,
    };
    onChange?.([...params, newParam]);
  };

  const updateParam = (id, field, value) => {
    const updated = params.map((p) =>
      p.id === id ? { ...p, [field]: value } : p
    );
    onChange?.(updated);
  };

  const removeParam = (id) => {
    onChange?.(params.filter((p) => p.id !== id));
  };

  const toggleAll = (enable) => {
    onChange?.(params.map((p) => ({ ...p, enabled: enable })));
  };

  const clearAll = () => {
    onChange?.([]);
  };

  const activeCount = params.filter((p) => p.enabled && p.key.trim()).length;

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
            Query Parameters ({activeCount} active)
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Parameters automatically serialize into the request URL query string
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {params.length > 0 && (
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
            onClick={addParam}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Param
          </Button>
        </div>
      </div>

      {/* Parameters Table */}
      {params.length > 0 ? (
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
          <div className="grid grid-cols-12 gap-2 p-2.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
            <div className="col-span-1 text-center">Active</div>
            <div className="col-span-4">Key</div>
            <div className="col-span-4">Value</div>
            <div className="col-span-2">Description</div>
            <div className="col-span-1 text-right pr-2">Action</div>
          </div>

          <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {params.map((p) => (
              <div
                key={p.id}
                className={`grid grid-cols-12 gap-2 p-2 items-center transition-colors ${
                  p.enabled
                    ? 'hover:bg-white dark:hover:bg-slate-900/60'
                    : 'opacity-50 bg-slate-100/50 dark:bg-slate-900/30'
                }`}
              >
                {/* Active Toggle */}
                <div className="col-span-1 flex justify-center">
                  <input
                    type="checkbox"
                    checked={p.enabled}
                    onChange={(e) => updateParam(p.id, 'enabled', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    title={p.enabled ? 'Enabled' : 'Disabled'}
                  />
                </div>

                {/* Key */}
                <div className="col-span-4">
                  <input
                    type="text"
                    placeholder="Key (e.g. limit)"
                    value={p.key}
                    onChange={(e) => updateParam(p.id, 'key', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* Value */}
                <div className="col-span-4">
                  <input
                    type="text"
                    placeholder="Value (e.g. 25)"
                    value={p.value}
                    onChange={(e) => updateParam(p.id, 'value', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Optional note"
                    value={p.description || ''}
                    onChange={(e) => updateParam(p.id, 'description', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* Action */}
                <div className="col-span-1 flex justify-end pr-1">
                  <button
                    type="button"
                    onClick={() => removeParam(p.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded transition-colors"
                    title="Remove parameter"
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
            No query parameters configured for this request.
          </p>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={addParam}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add First Parameter
          </Button>
        </div>
      )}

      {/* Helpful Hint */}
      <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
        <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
        <span>Parameters with blank keys will not be sent with the request.</span>
      </div>
    </div>
  );
};

export default RequestParams;
