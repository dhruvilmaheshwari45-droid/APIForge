import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import { Tabs } from '../common/Tabs';
import { MethodBadge } from '../common/Badge';
import { HTTP_METHODS } from '../../utils/constants';
import { 
  Send, 
  Sliders, 
  FileJson, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  FileCode2 
} from 'lucide-react';

const HTTP_METHOD_OPTIONS = Object.keys(HTTP_METHODS).map((m) => ({
  value: m,
  label: m,
}));

export const EndpointModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isEditing = false,
  collections = [],
  defaultCollectionId = '',
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [name, setName] = useState('');
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('');
  const [collectionId, setCollectionId] = useState(defaultCollectionId || '');
  const [description, setDescription] = useState('');
  
  // Headers & Params
  const [headers, setHeaders] = useState([
    { id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
  ]);
  const [queryParams, setQueryParams] = useState([]);
  
  // Body & Example Response
  const [requestBody, setRequestBody] = useState('');
  const [responseStatus, setResponseStatus] = useState('200');
  const [responseBody, setResponseBody] = useState('{\n  "status": "success",\n  "data": {}\n}');

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData && isEditing) {
      setName(initialData.name || '');
      setMethod(initialData.method || 'GET');
      setPath(initialData.path || '');
      setCollectionId(initialData.collectionId || defaultCollectionId || (collections[0]?.id || ''));
      setDescription(initialData.description || '');
      
      setHeaders(
        Array.isArray(initialData.headers) && initialData.headers.length > 0
          ? initialData.headers.map((h, i) => ({ ...h, id: h.id || `h-${i}` }))
          : [{ id: '1', key: 'Content-Type', value: 'application/json', enabled: true }]
      );

      setQueryParams(
        Array.isArray(initialData.queryParams)
          ? initialData.queryParams.map((p, i) => ({ ...p, id: p.id || `p-${i}` }))
          : []
      );

      setRequestBody(
        typeof initialData.requestBody === 'object'
          ? JSON.stringify(initialData.requestBody, null, 2)
          : initialData.requestBody || ''
      );

      setResponseStatus(
        initialData.responseExample?.status ? String(initialData.responseExample.status) : '200'
      );
      setResponseBody(
        initialData.responseExample?.body
          ? JSON.stringify(initialData.responseExample.body, null, 2)
          : '{\n  "status": "success",\n  "data": {}\n}'
      );
    } else {
      setName('');
      setMethod('GET');
      setPath('');
      setCollectionId(defaultCollectionId || (collections[0]?.id || ''));
      setDescription('');
      setHeaders([{ id: '1', key: 'Content-Type', value: 'application/json', enabled: true }]);
      setQueryParams([]);
      setRequestBody('');
      setResponseStatus('200');
      setResponseBody('{\n  "status": "success",\n  "data": {}\n}');
    }
    setActiveTab('general');
    setErrors({});
  }, [initialData, isEditing, isOpen, defaultCollectionId, collections]);

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Endpoint name is required';
    if (!path.trim()) errs.path = 'Endpoint path is required';
    if (!collectionId) errs.collectionId = 'Target collection is required';

    if (requestBody.trim()) {
      try {
        JSON.parse(requestBody);
      } catch (err) {
        errs.requestBody = 'Request body must be valid JSON';
      }
    }

    if (responseBody.trim()) {
      try {
        JSON.parse(responseBody);
      } catch (err) {
        errs.responseBody = 'Response example body must be valid JSON';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormatJson = (type) => {
    try {
      if (type === 'body' && requestBody.trim()) {
        const parsed = JSON.parse(requestBody);
        setRequestBody(JSON.stringify(parsed, null, 2));
      } else if (type === 'response' && responseBody.trim()) {
        const parsed = JSON.parse(responseBody);
        setResponseBody(JSON.stringify(parsed, null, 2));
      }
      setErrors((prev) => ({ ...prev, [type === 'body' ? 'requestBody' : 'responseBody']: undefined }));
    } catch (e) {
      setErrors((prev) => ({
        ...prev,
        [type === 'body' ? 'requestBody' : 'responseBody']: 'Invalid JSON: ' + e.message,
      }));
    }
  };

  const addHeader = () => {
    setHeaders([...headers, { id: `h-${Date.now()}`, key: '', value: '', enabled: true }]);
  };

  const updateHeader = (id, field, val) => {
    setHeaders(headers.map((h) => (h.id === id ? { ...h, [field]: val } : h)));
  };

  const removeHeader = (id) => {
    setHeaders(headers.filter((h) => h.id !== id));
  };

  const addParam = () => {
    setQueryParams([...queryParams, { id: `p-${Date.now()}`, key: '', value: '', enabled: true }]);
  };

  const updateParam = (id, field, val) => {
    setQueryParams(queryParams.map((p) => (p.id === id ? { ...p, [field]: val } : p)));
  };

  const removeParam = (id) => {
    setQueryParams(queryParams.filter((p) => p.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);

      let parsedBody = null;
      if (requestBody.trim()) {
        try {
          parsedBody = JSON.parse(requestBody);
        } catch (e) {
          parsedBody = requestBody;
        }
      }

      let parsedResBody = {};
      if (responseBody.trim()) {
        try {
          parsedResBody = JSON.parse(responseBody);
        } catch (e) {
          parsedResBody = { raw: responseBody };
        }
      }

      let cleanPath = path.trim();
      if (!cleanPath.startsWith('/')) {
        cleanPath = `/${cleanPath}`;
      }

      await onSubmit({
        name: name.trim(),
        method,
        path: cleanPath,
        collectionId,
        description: description.trim(),
        headers: headers.filter((h) => h.key.trim()),
        queryParams: queryParams.filter((p) => p.key.trim()),
        requestBody: parsedBody,
        responseExample: {
          status: parseInt(responseStatus, 10) || 200,
          body: parsedResBody,
        },
      });

      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to save endpoint' });
    } finally {
      setLoading(false);
    }
  };

  const tabsConfig = [
    { id: 'general', label: 'General', icon: Sliders },
    { id: 'headers', label: `Params & Headers (${queryParams.length + headers.length})`, icon: FileCode2 },
    { id: 'body', label: 'Body & Response', icon: FileJson },
  ];

  const collectionOptions = collections.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.version || 'v1'})`,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[85vh]">
        <ModalHeader onClose={onClose}>
          <div className="flex items-center space-x-3">
            <MethodBadge method={method} size="md" />
            <div>
              <ModalTitle>
                {isEditing ? 'Edit API Endpoint' : 'Create API Endpoint'}
              </ModalTitle>
              <ModalDescription>
                Define route path, HTTP method, headers, parameters, and payloads
              </ModalDescription>
            </div>
          </div>
        </ModalHeader>

        {errors.form && (
          <div className="mx-6 mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 pt-3 pb-1 border-b border-slate-200 dark:border-slate-800">
          <Tabs
            tabs={tabsConfig}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="pills"
            size="sm"
          />
        </div>

        <ModalBody className="overflow-y-auto space-y-4 py-4">
          {activeTab === 'general' && (
            <div className="space-y-4">
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

              <Input
                label="Resource Path"
                placeholder="/users/:id or /orders"
                value={path}
                onChange={(e) => {
                  setPath(e.target.value);
                  if (errors.path) setErrors((prev) => ({ ...prev, path: undefined }));
                }}
                error={errors.path}
                helperText="Paths automatically prepend with a leading slash '/' and are appended to the collection Base URL."
                required
              />

              <Select
                label="Target Collection"
                options={collectionOptions}
                value={collectionId}
                onChange={(e) => {
                  setCollectionId(e.target.value);
                  if (errors.collectionId) setErrors((prev) => ({ ...prev, collectionId: undefined }));
                }}
                error={errors.collectionId}
                required
              />

              <Textarea
                label="Description"
                placeholder="Detailed explanation of what this endpoint does, auth scopes, or usage constraints..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {activeTab === 'headers' && (
            <div className="space-y-6">
              {/* Query Parameters */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Query Parameters
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Key-value pairs appended to the URL as query string (?key=val)
                    </p>
                  </div>
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

                {queryParams.length === 0 ? (
                  <div className="p-3 text-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                    No query parameters configured. Click "Add Param" to add one.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {queryParams.map((p) => (
                      <div key={p.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={p.enabled}
                          onChange={(e) => updateParam(p.id, 'enabled', e.target.checked)}
                          className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500"
                        />
                        <input
                          type="text"
                          placeholder="Key (e.g. limit)"
                          value={p.key}
                          onChange={(e) => updateParam(p.id, 'key', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
                        />
                        <input
                          type="text"
                          placeholder="Value (e.g. 50)"
                          value={p.value}
                          onChange={(e) => updateParam(p.id, 'value', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeParam(p.id)}
                          className="p-1.5 text-slate-600 hover:text-rose-500 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Request Headers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Request Headers
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      HTTP headers sent with this request (Authorization, Content-Type, etc.)
                    </p>
                  </div>
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

                {headers.length === 0 ? (
                  <div className="p-3 text-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                    No headers defined. Click "Add Header" to configure custom headers.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {headers.map((h) => (
                      <div key={h.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={h.enabled}
                          onChange={(e) => updateHeader(h.id, 'enabled', e.target.checked)}
                          className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500"
                        />
                        <input
                          type="text"
                          placeholder="Header (e.g. Authorization)"
                          value={h.key}
                          onChange={(e) => updateHeader(h.id, 'key', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
                        />
                        <input
                          type="text"
                          placeholder="Value (e.g. Bearer {{token}})"
                          value={h.value}
                          onChange={(e) => updateHeader(h.id, 'value', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeHeader(h.id)}
                          className="p-1.5 text-slate-600 hover:text-rose-500 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'body' && (
            <div className="space-y-5">
              {/* Request Payload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Request Body (JSON)
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => handleFormatJson('body')}
                  >
                    Format JSON
                  </Button>
                </div>
                <Textarea
                  value={requestBody}
                  onChange={(e) => {
                    setRequestBody(e.target.value);
                    if (errors.requestBody) setErrors((prev) => ({ ...prev, requestBody: undefined }));
                  }}
                  error={errors.requestBody}
                  placeholder="{\n  &quot;email&quot;: &quot;user@example.com&quot;,\n  &quot;name&quot;: &quot;Alex Doe&quot;\n}"
                  rows={5}
                  className="font-mono text-xs"
                />
              </div>

              {/* Simulated Response Example */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Mock / Sample Response
                    </h5>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Returned by APIForge mock runner or request simulator
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-600 dark:text-slate-400">Status:</span>
                    <input
                      type="number"
                      value={responseStatus}
                      onChange={(e) => setResponseStatus(e.target.value)}
                      className="w-16 px-2 py-1 text-xs font-mono font-bold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-600 dark:text-slate-400">Response Body JSON</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => handleFormatJson('response')}
                    >
                      Format JSON
                    </Button>
                  </div>
                  <Textarea
                    value={responseBody}
                    onChange={(e) => {
                      setResponseBody(e.target.value);
                      if (errors.responseBody) setErrors((prev) => ({ ...prev, responseBody: undefined }));
                    }}
                    error={errors.responseBody}
                    rows={5}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={loading}>
            {isEditing ? 'Save Changes' : 'Create Endpoint'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default EndpointModal;
