import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import { MethodBadge } from '../common/Badge';
import { HTTP_METHODS } from '../../utils/constants';
import { Code2, Plus, Trash2, CheckCircle2, AlertCircle, FileJson, Clock } from 'lucide-react';

const HTTP_METHOD_OPTIONS = Object.keys(HTTP_METHODS).map((m) => ({
  value: m,
  label: m,
}));

const COMMON_STATUS_CODES = [200, 201, 204, 400, 401, 403, 404, 422, 500, 503];

export const MockEndpointModal = ({
  isOpen,
  onClose,
  onSubmit,
  serverId,
  initialData = null,
  isEditing = false,
}) => {
  const [name, setName] = useState('');
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('');
  const [description, setDescription] = useState('');
  const [responseStatus, setResponseStatus] = useState(200);
  const [responseDelay, setResponseDelay] = useState(0);
  const [responseHeaders, setResponseHeaders] = useState([
    { id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true },
  ]);
  const [responseBodyType, setResponseBodyType] = useState('json');
  const [responseBody, setResponseBody] = useState('{\n  "status": "success",\n  "data": {}\n}');

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData && isEditing) {
      setName(initialData.name || '');
      setMethod(initialData.method || 'GET');
      setPath(initialData.path || '');
      setDescription(initialData.description || '');
      setResponseStatus(initialData.responseStatus || 200);
      setResponseDelay(initialData.responseDelay || 0);
      setResponseHeaders(
        Array.isArray(initialData.responseHeaders) && initialData.responseHeaders.length > 0
          ? initialData.responseHeaders
          : [{ id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }]
      );
      setResponseBodyType(initialData.responseBodyType || 'json');
      setResponseBody(
        typeof initialData.responseBody === 'object'
          ? JSON.stringify(initialData.responseBody, null, 2)
          : initialData.responseBody || ''
      );
    } else {
      setName('');
      setMethod('GET');
      setPath('');
      setDescription('');
      setResponseStatus(200);
      setResponseDelay(0);
      setResponseHeaders([{ id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }]);
      setResponseBodyType('json');
      setResponseBody('{\n  "status": "success",\n  "data": {}\n}');
    }
    setErrors({});
  }, [initialData, isEditing, isOpen]);

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Endpoint name is required';
    if (!path.trim()) errs.path = 'Endpoint route path is required';

    if (responseBodyType === 'json' && responseBody.trim()) {
      try {
        JSON.parse(responseBody);
      } catch (e) {
        errs.responseBody = 'Invalid JSON: ' + e.message;
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormatJson = () => {
    try {
      if (!responseBody.trim()) return;
      const parsed = JSON.parse(responseBody);
      setResponseBody(JSON.stringify(parsed, null, 2));
      setErrors((prev) => ({ ...prev, responseBody: undefined }));
    } catch (e) {
      setErrors((prev) => ({ ...prev, responseBody: 'Invalid JSON: ' + e.message }));
    }
  };

  const addHeader = () => {
    setResponseHeaders([
      ...responseHeaders,
      { id: `h-${Date.now()}`, key: '', value: '', enabled: true },
    ]);
  };

  const updateHeader = (id, field, val) => {
    setResponseHeaders(
      responseHeaders.map((h) => (h.id === id ? { ...h, [field]: val } : h))
    );
  };

  const removeHeader = (id) => {
    setResponseHeaders(responseHeaders.filter((h) => h.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);

      let cleanPath = path.trim();
      if (!cleanPath.startsWith('/')) {
        cleanPath = `/${cleanPath}`;
      }

      await onSubmit({
        serverId,
        name: name.trim(),
        method,
        path: cleanPath,
        description: description.trim(),
        responseStatus: parseInt(responseStatus, 10) || 200,
        responseDelay: parseInt(responseDelay, 10) || 0,
        responseHeaders: responseHeaders.filter((h) => h.key.trim()),
        responseBodyType,
        responseBody: responseBody.trim(),
      });

      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to save mock endpoint' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[85vh]">
        <ModalHeader onClose={onClose}>
          <div className="flex items-center space-x-3">
            <MethodBadge method={method} size="md" />
            <div>
              <ModalTitle>
                {isEditing ? 'Edit Mock Endpoint' : 'Define Mock Endpoint'}
              </ModalTitle>
              <ModalDescription>
                Configure route pattern, simulated status code, headers, and mock payload
              </ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="overflow-y-auto space-y-4 py-4">
          {errors.form && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Method and Name */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-1">
              <Select
                label="HTTP Method"
                options={HTTP_METHOD_OPTIONS}
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                required
              />
            </div>
            <div className="md:col-span-3">
              <Input
                label="Endpoint Name"
                placeholder="e.g. Get User Profile by ID"
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
          </div>

          {/* Route Path */}
          <Input
            label="Route Path"
            placeholder="/users/:id or /v1/checkout"
            value={path}
            onChange={(e) => {
              setPath(e.target.value);
              if (errors.path) setErrors((prev) => ({ ...prev, path: undefined }));
            }}
            error={errors.path}
            helperText="Relative endpoint path matching request URLs (e.g. /users, /orders/:id)"
            required
          />

          {/* Response Status & Simulated Latency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
            <div>
              <label className="block text-xs font-mono font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Default HTTP Status
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={responseStatus}
                  onChange={(e) => setResponseStatus(e.target.value)}
                  className="w-24 px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
                <div className="flex items-center space-x-1 overflow-x-auto text-[11px] font-mono">
                  {COMMON_STATUS_CODES.slice(0, 5).map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setResponseStatus(code)}
                      className={`px-1.5 py-0.5 rounded border transition-colors ${
                        Number(responseStatus) === code
                          ? 'bg-brand-500 text-white border-brand-600 font-bold'
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
                Simulated Latency (ms)
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0"
                  value={responseDelay}
                  onChange={(e) => setResponseDelay(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
                <Clock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Response Headers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                Mock Response Headers
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
              {responseHeaders.map((h) => (
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

          {/* Response Body */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  Mock Response Body
                </span>
                <div className="flex items-center space-x-1 p-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setResponseBodyType('json')}
                    className={`px-2 py-0.5 rounded ${responseBodyType === 'json' ? 'bg-white dark:bg-slate-900 font-bold text-brand-600 dark:text-brand-400' : 'text-slate-500'}`}
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setResponseBodyType('text')}
                    className={`px-2 py-0.5 rounded ${responseBodyType === 'text' ? 'bg-white dark:bg-slate-900 font-bold text-brand-600 dark:text-brand-400' : 'text-slate-500'}`}
                  >
                    Raw Text
                  </button>
                </div>
              </div>

              {responseBodyType === 'json' && (
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
              value={responseBody}
              onChange={(e) => {
                setResponseBody(e.target.value);
                if (errors.responseBody) setErrors((prev) => ({ ...prev, responseBody: undefined }));
              }}
              error={errors.responseBody}
              rows={7}
              className="font-mono text-xs"
              placeholder={responseBodyType === 'json' ? '{\n  &quot;message&quot;: &quot;OK&quot;\n}' : 'Plain text payload'}
            />
          </div>

          <Textarea
            label="Description (Optional)"
            placeholder="Scenario details (e.g. Simulates 404 for deactivated user IDs)..."
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
            {isEditing ? 'Save Changes' : 'Create Mock Endpoint'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default MockEndpointModal;
