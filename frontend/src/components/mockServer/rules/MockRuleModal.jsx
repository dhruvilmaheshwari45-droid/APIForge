import React, { useState, useEffect, useMemo } from 'react';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../../common/Modal';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Select from '../../common/Select';
import Textarea from '../../common/Textarea';
import { MethodBadge } from '../../common/Badge';
import { generateRuleSummary } from '../../../services/mockServerService';
import { 
  GitBranch, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  FileCode2, 
  Sliders, 
  Clock, 
  Sparkles,
  Info 
} from 'lucide-react';

const CONDITION_TYPES = [
  { value: 'query_param', label: 'Query Parameter' },
  { value: 'header', label: 'Request Header' },
  { value: 'body_field', label: 'Request Body Field (JSON)' },
  { value: 'auth_presence', label: 'Authorization Presence' },
  { value: 'method', label: 'HTTP Method' },
  { value: 'path', label: 'Request Path' },
];

const OPERATORS_BY_TYPE = {
  method: [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
  ],
  path: [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
    { value: 'contains', label: 'contains' },
  ],
  auth_presence: [
    { value: 'exists', label: 'exists (token present)' },
    { value: 'not_exists', label: 'does not exist (missing)' },
  ],
  query_param: [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
    { value: 'contains', label: 'contains' },
    { value: 'exists', label: 'exists' },
    { value: 'not_exists', label: 'does not exist' },
  ],
  header: [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
    { value: 'contains', label: 'contains' },
    { value: 'exists', label: 'exists' },
    { value: 'not_exists', label: 'does not exist' },
  ],
  body_field: [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
    { value: 'contains', label: 'contains' },
    { value: 'exists', label: 'exists' },
    { value: 'not_exists', label: 'does not exist' },
  ],
};

const COMMON_STATUS_CODES = [200, 201, 204, 400, 401, 403, 404, 422, 500];

export const MockRuleModal = ({
  isOpen,
  onClose,
  onSubmit,
  endpoint = null,
  initialData = null,
  isEditing = false,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [priority, setPriority] = useState(1);
  const [matchLogic, setMatchLogic] = useState('AND');

  // Conditions
  const [conditions, setConditions] = useState([
    { id: 'c-1', type: 'query_param', field: 'role', operator: 'equals', value: 'admin' },
  ]);

  // Response Config
  const [status, setStatus] = useState(200);
  const [delay, setDelay] = useState(0);
  const [headers, setHeaders] = useState([
    { id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true },
  ]);
  const [bodyType, setBodyType] = useState('json');
  const [body, setBody] = useState('{\n  "success": true,\n  "data": {}\n}');

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData && isEditing) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setEnabled(initialData.enabled !== undefined ? initialData.enabled : true);
      setPriority(initialData.priority || 1);
      setMatchLogic(initialData.matchLogic || 'AND');

      setConditions(
        Array.isArray(initialData.conditions) && initialData.conditions.length > 0
          ? initialData.conditions
          : [{ id: 'c-1', type: 'query_param', field: 'role', operator: 'equals', value: 'admin' }]
      );

      setStatus(initialData.response?.status || 200);
      setDelay(initialData.response?.delay || 0);
      setHeaders(
        Array.isArray(initialData.response?.headers) && initialData.response.headers.length > 0
          ? initialData.response.headers
          : [{ id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }]
      );
      setBodyType(initialData.response?.bodyType || 'json');
      setBody(
        typeof initialData.response?.body === 'object'
          ? JSON.stringify(initialData.response.body, null, 2)
          : initialData.response?.body || ''
      );
    } else {
      setName('');
      setDescription('');
      setEnabled(true);
      setPriority(1);
      setMatchLogic('AND');
      setConditions([
        { id: `c-${Date.now()}`, type: 'query_param', field: 'role', operator: 'equals', value: 'admin' },
      ]);
      setStatus(200);
      setDelay(0);
      setHeaders([{ id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }]);
      setBodyType('json');
      setBody('{\n  "success": true,\n  "data": {}\n}');
    }
    setErrors({});
  }, [initialData, isEditing, isOpen]);

  // Live preview summary
  const liveSummary = useMemo(() => {
    return generateRuleSummary({
      conditions,
      matchLogic,
      response: { status, delay },
    });
  }, [conditions, matchLogic, status, delay]);

  // Conditions Handlers
  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'query_param',
        field: '',
        operator: 'equals',
        value: '',
      },
    ]);
  };

  const updateCondition = (id, field, val) => {
    setConditions(
      conditions.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, [field]: val };
        // Reset operator if type changed
        if (field === 'type') {
          const ops = OPERATORS_BY_TYPE[val] || [];
          updated.operator = ops[0]?.value || 'equals';
          if (val === 'auth_presence') {
            updated.field = '';
            updated.value = '';
          }
        }
        return updated;
      })
    );
  };

  const removeCondition = (id) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  // Header Handlers
  const addHeader = () => {
    setHeaders([...headers, { id: `rh-${Date.now()}`, key: '', value: '', enabled: true }]);
  };

  const updateHeader = (id, field, val) => {
    setHeaders(headers.map((h) => (h.id === id ? { ...h, [field]: val } : h)));
  };

  const removeHeader = (id) => {
    setHeaders(headers.filter((h) => h.id !== id));
  };

  const handleFormatJson = () => {
    try {
      if (!body.trim()) return;
      const parsed = JSON.parse(body);
      setBody(JSON.stringify(parsed, null, 2));
      setErrors((prev) => ({ ...prev, body: undefined }));
    } catch (e) {
      setErrors((prev) => ({ ...prev, body: 'Invalid JSON: ' + e.message }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Rule name is required';

    if (conditions.length === 0) {
      errs.conditions = 'At least one condition is required';
    } else {
      conditions.forEach((c, idx) => {
        const needsField = ['query_param', 'header', 'body_field'].includes(c.type);
        const needsValue = !['exists', 'not_exists'].includes(c.operator) && c.type !== 'auth_presence';

        if (needsField && !c.field?.trim()) {
          errs[`condition_${idx}_field`] = `Field name required for condition #${idx + 1}`;
        }
        if (needsValue && !c.value?.trim()) {
          errs[`condition_${idx}_value`] = `Target value required for condition #${idx + 1}`;
        }
      });
    }

    if (bodyType === 'json' && body.trim()) {
      try {
        JSON.parse(body);
      } catch (e) {
        errs.body = 'Invalid response JSON: ' + e.message;
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      await onSubmit({
        endpointId: endpoint?.id,
        serverId: endpoint?.serverId,
        name: name.trim(),
        description: description.trim(),
        enabled,
        priority: parseInt(priority, 10) || 1,
        matchLogic,
        conditions: conditions.map((c) => ({
          ...c,
          field: c.field?.trim() || '',
          value: c.value?.trim() || '',
        })),
        response: {
          status: parseInt(status, 10) || 200,
          delay: parseInt(delay, 10) || 0,
          headers: headers.filter((h) => h.key?.trim()),
          bodyType,
          body: body.trim(),
        },
      });
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to save mock rule' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[85vh]">
        <ModalHeader onClose={onClose}>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-500">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <ModalTitle>{isEditing ? 'Edit Dynamic Rule' : 'Create Response Rule'}</ModalTitle>
                {endpoint && <MethodBadge method={endpoint.method} size="xs" />}
              </div>
              <ModalDescription>
                Define IF/AND matching criteria and the THEN simulated response for {endpoint?.path || 'endpoint'}
              </ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="overflow-y-auto space-y-5 py-4">
          {errors.form && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Live Narrative Summary */}
          <div className="p-3 rounded-xl bg-brand-500/5 border border-brand-500/20 text-xs font-mono text-brand-600 dark:text-brand-300 flex items-start space-x-2.5">
            <Sparkles className="w-4 h-4 shrink-0 text-brand-500 mt-0.5" />
            <div className="space-y-0.5 overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Rule Logic Preview</span>
              <p className="font-semibold break-words leading-relaxed">{liveSummary}</p>
            </div>
          </div>

          {/* General Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-6">
              <Input
                label="Rule Name"
                placeholder="e.g. Admin Role Elevated Access"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                error={errors.name}
                required
                autoFocus
              />
            </div>

            <div className="md:col-span-3">
              <Input
                label="Priority (#1 = highest)"
                type="number"
                min="1"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                helperText="Evaluated in order"
                required
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Evaluation Status
              </label>
              <label className="flex items-center space-x-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {enabled ? 'Active Rule' : 'Disabled'}
                </span>
              </label>
            </div>
          </div>

          {/* SECTION 1: "IF" CONDITIONS */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                  IF Conditions
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  When incoming requests match:
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 p-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setMatchLogic('AND')}
                    className={`px-2 py-0.5 rounded ${matchLogic === 'AND' ? 'bg-white dark:bg-slate-900 font-bold text-brand-600 dark:text-brand-400' : 'text-slate-500'}`}
                  >
                    Match ALL (AND)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchLogic('OR')}
                    className={`px-2 py-0.5 rounded ${matchLogic === 'OR' ? 'bg-white dark:bg-slate-900 font-bold text-brand-600 dark:text-brand-400' : 'text-slate-500'}`}
                  >
                    Match ANY (OR)
                  </button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={addCondition}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Condition
                </Button>
              </div>
            </div>

            {/* Conditions List */}
            <div className="space-y-2.5">
              {conditions.map((c, idx) => {
                const needsField = ['query_param', 'header', 'body_field'].includes(c.type);
                const needsValue = !['exists', 'not_exists'].includes(c.operator) && c.type !== 'auth_presence';
                const operators = OPERATORS_BY_TYPE[c.type] || OPERATORS_BY_TYPE.query_param;

                return (
                  <div
                    key={c.id}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
                      <span>Condition #{idx + 1}</span>
                      {conditions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCondition(c.id)}
                          className="text-rose-500 hover:text-rose-600 flex items-center space-x-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      {/* Type */}
                      <div className="sm:col-span-4">
                        <select
                          value={c.type}
                          onChange={(e) => updateCondition(c.id, 'type', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
                        >
                          {CONDITION_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Field name (if applicable) */}
                      <div className="sm:col-span-3">
                        {needsField ? (
                          <input
                            type="text"
                            placeholder={c.type === 'query_param' ? 'Param key' : c.type === 'header' ? 'Header name' : 'JSON key'}
                            value={c.field}
                            onChange={(e) => updateCondition(c.id, 'field', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
                          />
                        ) : (
                          <span className="text-[11px] font-mono text-slate-400 px-2 italic">
                            (N/A for {c.type})
                          </span>
                        )}
                      </div>

                      {/* Operator */}
                      <div className="sm:col-span-2">
                        <select
                          value={c.operator}
                          onChange={(e) => updateCondition(c.id, 'operator', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
                        >
                          {operators.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Value (if applicable) */}
                      <div className="sm:col-span-3">
                        {needsValue ? (
                          <input
                            type="text"
                            placeholder="Target value"
                            value={c.value}
                            onChange={(e) => updateCondition(c.id, 'value', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
                          />
                        ) : (
                          <span className="text-[11px] font-mono text-slate-400 px-2 italic">
                            (No value needed)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: "THEN" RESPONSE ACTION */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-4">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                THEN Response Action
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Simulated response dispatched on match:
              </span>
            </div>

            {/* Status & Latency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  HTTP Status Code
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-24 px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                  <div className="flex items-center space-x-1 overflow-x-auto text-[11px] font-mono">
                    {COMMON_STATUS_CODES.slice(0, 5).map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setStatus(code)}
                        className={`px-1.5 py-0.5 rounded border transition-colors ${
                          Number(status) === code
                            ? 'bg-emerald-500 text-white border-emerald-600 font-bold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Response Delay (ms)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={delay}
                    onChange={(e) => setDelay(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                  <Clock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Custom Headers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  Custom Response Headers
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={addHeader}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Header
                </Button>
              </div>

              <div className="space-y-2">
                {headers.map((h) => (
                  <div key={h.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={h.enabled}
                      onChange={(e) => updateHeader(h.id, 'enabled', e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <input
                      type="text"
                      placeholder="Header Key (e.g. Content-Type)"
                      value={h.key}
                      onChange={(e) => updateHeader(h.id, 'key', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    />
                    <input
                      type="text"
                      placeholder="Header Value"
                      value={h.value}
                      onChange={(e) => updateHeader(h.id, 'value', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeHeader(h.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Response Body Payload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Rule Response Payload
                  </span>
                  <div className="flex items-center space-x-1 p-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono">
                    <button
                      type="button"
                      onClick={() => setBodyType('json')}
                      className={`px-2 py-0.5 rounded ${bodyType === 'json' ? 'bg-white dark:bg-slate-900 font-bold text-brand-600 dark:text-brand-400' : 'text-slate-500'}`}
                    >
                      JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => setBodyType('text')}
                      className={`px-2 py-0.5 rounded ${bodyType === 'text' ? 'bg-white dark:bg-slate-900 font-bold text-brand-600 dark:text-brand-400' : 'text-slate-500'}`}
                    >
                      Raw Text
                    </button>
                  </div>
                </div>

                {bodyType === 'json' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={handleFormatJson}
                  >
                    Format JSON
                  </Button>
                )}
              </div>

              <Textarea
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  if (errors.body) setErrors((prev) => ({ ...prev, body: undefined }));
                }}
                error={errors.body}
                rows={6}
                className="font-mono text-xs"
                placeholder={bodyType === 'json' ? '{\n  &quot;role&quot;: &quot;superadmin&quot;\n}' : 'Plain text payload'}
              />
            </div>
          </div>

          <Textarea
            label="Rule Notes (Optional)"
            placeholder="Operational notes explaining when this rule is invoked..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={loading}>
            {isEditing ? 'Save Changes' : 'Create Rule'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default MockRuleModal;
