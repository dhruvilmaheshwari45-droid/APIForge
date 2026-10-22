import React, { useState, useMemo } from 'react';
import Button from '../../common/Button';
import { 
  FileJson, 
  FileText, 
  SlidersHorizontal, 
  Ban, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Copy, 
  Check 
} from 'lucide-react';

const BODY_TYPES = [
  { id: 'none', label: 'none', icon: Ban },
  { id: 'json', label: 'JSON', icon: FileJson },
  { id: 'raw', label: 'Raw Text', icon: FileText },
  { id: 'form-data', label: 'Form Data', icon: SlidersHorizontal },
];

export const RequestBody = ({
  bodyType = 'json',
  onBodyTypeChange,
  jsonBody = '',
  onJsonChange,
  rawBody = '',
  onRawChange,
  formData = [],
  onFormDataChange,
}) => {
  const [copied, setCopied] = useState(false);

  // Validate JSON on the fly
  const jsonValidation = useMemo(() => {
    if (!jsonBody.trim()) {
      return { valid: true, error: null };
    }
    try {
      JSON.parse(jsonBody);
      return { valid: true, error: null };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }, [jsonBody]);

  // Format JSON
  const handleFormatJson = () => {
    if (!jsonBody.trim()) return;
    try {
      const parsed = JSON.parse(jsonBody);
      onJsonChange?.(JSON.stringify(parsed, null, 2));
    } catch (err) {
      // JSON is currently invalid, keep as is
    }
  };

  const handleCopyJson = () => {
    if (!jsonBody) return;
    navigator.clipboard.writeText(jsonBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Form Data Handlers
  const addFormRow = () => {
    onFormDataChange?.([
      ...formData,
      {
        id: `fd-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        key: '',
        value: '',
        type: 'text',
        enabled: true,
      },
    ]);
  };

  const updateFormRow = (id, field, val) => {
    const updated = formData.map((row) =>
      row.id === id ? { ...row, [field]: val } : row
    );
    onFormDataChange?.(updated);
  };

  const removeFormRow = (id) => {
    onFormDataChange?.(formData.filter((row) => row.id !== id));
  };

  // Compute line numbers for JSON editor
  const lineNumbers = useMemo(() => {
    const count = (jsonBody || '').split('\n').length;
    return Array.from({ length: Math.max(count, 8) }, (_, i) => i + 1);
  }, [jsonBody]);

  return (
    <div className="space-y-4">
      {/* Body Sub-Type Selector Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          {BODY_TYPES.map((bt) => {
            const Icon = bt.icon;
            const isSelected = bodyType === bt.id;
            return (
              <button
                key={bt.id}
                type="button"
                onClick={() => onBodyTypeChange?.(bt.id)}
                className={`
                  flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-mono font-medium transition-all
                  ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{bt.label}</span>
              </button>
            );
          })}
        </div>

        {bodyType === 'json' && (
          <div className="flex items-center space-x-2">
            {jsonValidation.valid ? (
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Valid JSON</span>
              </span>
            ) : (
              <span className="text-[11px] font-mono text-rose-500 flex items-center space-x-1 truncate max-w-xs" title={jsonValidation.error}>
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{jsonValidation.error}</span>
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleFormatJson}
              disabled={!jsonValidation.valid || !jsonBody.trim()}
            >
              Format JSON
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleCopyJson}
              disabled={!jsonBody.trim()}
              leftIcon={copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        )}
      </div>

      {/* None Type */}
      {bodyType === 'none' && (
        <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/30">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            This request does not include a body payload (standard for GET, HEAD, or simple DELETE requests).
          </p>
        </div>
      )}

      {/* JSON Editor */}
      {bodyType === 'json' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden shadow-inner">
          <div className="flex items-stretch min-h-[220px]">
            {/* Line numbers gutter */}
            <div className="w-10 bg-slate-900/80 text-slate-600 font-mono text-[11px] select-none text-right pr-2 pt-3 border-r border-slate-800 shrink-0 leading-5">
              {lineNumbers.map((num) => (
                <div key={num}>{num}</div>
              ))}
            </div>

            {/* Monospace Code Editor Area */}
            <div className="flex-1 relative">
              <textarea
                value={jsonBody}
                onChange={(e) => onJsonChange?.(e.target.value)}
                placeholder="{\n  &quot;key&quot;: &quot;value&quot;\n}"
                rows={10}
                spellCheck={false}
                className="w-full h-full p-3 bg-transparent text-xs font-mono text-emerald-400 placeholder-slate-600 focus:outline-none resize-y leading-5 selection:bg-brand-500/30"
              />
            </div>
          </div>
        </div>
      )}

      {/* Raw Text Editor */}
      {bodyType === 'raw' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden">
          <textarea
            value={rawBody}
            onChange={(e) => onRawChange?.(e.target.value)}
            placeholder="Type raw text, XML, HTML, or custom payload..."
            rows={10}
            spellCheck={false}
            className="w-full p-3 bg-transparent text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none resize-y"
          />
        </div>
      )}

      {/* Form Data Editor */}
      {bodyType === 'form-data' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs text-slate-500 font-mono">
              Multipart Form Data key-value pairs
            </span>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={addFormRow}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Field
            </Button>
          </div>

          {formData.length > 0 ? (
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
              <div className="grid grid-cols-12 gap-2 p-2.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                <div className="col-span-1 text-center">Active</div>
                <div className="col-span-4">Field Name</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-4">Value</div>
                <div className="col-span-1 text-right pr-2">Action</div>
              </div>

              <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                {formData.map((row) => (
                  <div
                    key={row.id}
                    className={`grid grid-cols-12 gap-2 p-2 items-center transition-colors ${
                      row.enabled ? 'hover:bg-white dark:hover:bg-slate-900/60' : 'opacity-50'
                    }`}
                  >
                    <div className="col-span-1 flex justify-center">
                      <input
                        type="checkbox"
                        checked={row.enabled}
                        onChange={(e) => updateFormRow(row.id, 'enabled', e.target.checked)}
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                      />
                    </div>

                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="Key (e.g. avatar)"
                        value={row.key}
                        onChange={(e) => updateFormRow(row.id, 'key', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <select
                        value={row.type || 'text'}
                        onChange={(e) => updateFormRow(row.id, 'type', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="text">Text</option>
                        <option value="file">File</option>
                      </select>
                    </div>

                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder={row.type === 'file' ? 'File path / filename' : 'Value string'}
                        value={row.value}
                        onChange={(e) => updateFormRow(row.id, 'value', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div className="col-span-1 flex justify-end pr-1">
                      <button
                        type="button"
                        onClick={() => removeFormRow(row.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500"
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
                No form data fields configured.
              </p>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={addFormRow}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Form Field
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RequestBody;
