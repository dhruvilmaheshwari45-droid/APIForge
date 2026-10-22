import React, { useState, useEffect } from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { MethodBadge } from '../common/Badge';
import { Tabs } from '../common/Tabs';
import { ASSERTION_TYPES } from '../../utils/assertionEvaluator';
import { HTTP_METHODS } from '../../utils/constants';
import collectionService from '../../services/collectionService';
import {
  TestTube2,
  Sliders,
  FileCode2,
  FileJson,
  CheckCircle2,
  Plus,
  Trash2,
  Import,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Clock
} from 'lucide-react';

const METHODS_LIST = Object.keys(HTTP_METHODS);

export const TestCaseModal = ({
  isOpen,
  onClose,
  onSubmit,
  suiteId,
  initialData = null,
  isEditing = false,
}) => {
  const [activeTab, setActiveTab] = useState('request');

  // Request State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('{{BASE_URL}}/posts');
  const [params, setParams] = useState([]);
  const [headers, setHeaders] = useState([
    { id: 'h-1', key: 'Accept', value: 'application/json', enabled: true },
  ]);
  const [bodyType, setBodyType] = useState('none');
  const [jsonBody, setJsonBody] = useState('{\n  "title": "Test Resource"\n}');
  const [enabled, setEnabled] = useState(true);

  // Assertions State
  const [assertions, setAssertions] = useState([
    {
      id: 'asrt-init-1',
      type: 'status_code_equals',
      target: '',
      value: '200',
      description: 'Status code equals 200 OK',
      enabled: true,
    },
    {
      id: 'asrt-init-2',
      type: 'response_time_below',
      target: '',
      value: '2000',
      description: 'Response time under 2000ms',
      enabled: true,
    },
  ]);

  // Saved Endpoints for quick import
  const [savedEndpoints, setSavedEndpoints] = useState([]);
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    try {
      const cols = collectionService.getCollections();
      const allEps = [];
      cols.forEach((col) => {
        const eps = collectionService.getEndpointsByCollection(col.id);
        eps.forEach((ep) => {
          allEps.push({
            ...ep,
            collectionName: col.name,
            collectionBaseUrl: col.baseUrl,
          });
        });
      });
      setSavedEndpoints(allEps);
    } catch {
      setSavedEndpoints([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData && isEditing) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setMethod(initialData.method || 'GET');
      setUrl(initialData.url || '{{BASE_URL}}/posts');
      setParams(Array.isArray(initialData.params) ? initialData.params : []);
      setHeaders(Array.isArray(initialData.headers) ? initialData.headers : []);
      setBodyType(initialData.bodyType || 'none');
      setJsonBody(initialData.jsonBody || '');
      setEnabled(initialData.enabled !== undefined ? initialData.enabled : true);
      setAssertions(
        Array.isArray(initialData.assertions) && initialData.assertions.length > 0
          ? initialData.assertions
          : [
              {
                id: 'asrt-init-1',
                type: 'status_code_equals',
                target: '',
                value: '200',
                description: 'Status code equals 200 OK',
                enabled: true,
              },
            ]
      );
    } else {
      setName('');
      setDescription('');
      setMethod('GET');
      setUrl('{{BASE_URL}}/posts');
      setParams([]);
      setHeaders([{ id: 'h-1', key: 'Accept', value: 'application/json', enabled: true }]);
      setBodyType('none');
      setJsonBody('{\n  "title": "Test Resource"\n}');
      setEnabled(true);
      setAssertions([
        {
          id: `asrt-${Date.now()}-1`,
          type: 'status_code_equals',
          target: '',
          value: '200',
          description: 'Status code equals 200 OK',
          enabled: true,
        },
        {
          id: `asrt-${Date.now()}-2`,
          type: 'response_time_below',
          target: '',
          value: '2000',
          description: 'Response time under 2000ms',
          enabled: true,
        },
      ]);
    }
    setErrors({});
    setActiveTab('request');
  }, [initialData, isEditing, isOpen]);

  // Import existing endpoint
  const handleImportEndpoint = (ep) => {
    setName(`Test ${ep.name}`);
    setDescription(ep.description || `Automated test for ${ep.method} ${ep.path}`);
    setMethod(ep.method || 'GET');
    setUrl(`{{BASE_URL}}${ep.path?.startsWith('/') ? '' : '/'}${ep.path || ''}`);
    if (Array.isArray(ep.queryParams) && ep.queryParams.length > 0) {
      setParams(ep.queryParams.map((p, i) => ({ ...p, id: `p-${i}`, enabled: true })));
    }
    if (Array.isArray(ep.headers) && ep.headers.length > 0) {
      setHeaders(ep.headers.map((h, i) => ({ ...h, id: `h-${i}`, enabled: true })));
    }
    if (ep.requestBody) {
      setBodyType('json');
      setJsonBody(typeof ep.requestBody === 'object' ? JSON.stringify(ep.requestBody, null, 2) : String(ep.requestBody));
    }
    setShowImportDropdown(false);
  };

  // Add / Edit / Remove Assertions
  const handleAddAssertion = (type = 'status_code_equals') => {
    const meta = ASSERTION_TYPES[type];
    setAssertions((prev) => [
      ...prev,
      {
        id: `asrt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type,
        target: meta.targetRequired ? 'data.id' : '',
        value: type === 'status_code_equals' ? '200' : type === 'response_time_below' ? '1500' : 'expected_val',
        description: meta.label,
        enabled: true,
      },
    ]);
  };

  const handleUpdateAssertion = (id, field, val) => {
    setAssertions((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const updated = { ...a, [field]: val };
          // If type changed, set default label
          if (field === 'type') {
            updated.description = ASSERTION_TYPES[val]?.label || val;
            if (!ASSERTION_TYPES[val]?.targetRequired) updated.target = '';
            if (!ASSERTION_TYPES[val]?.valueRequired) updated.value = '';
          }
          return updated;
        }
        return a;
      })
    );
  };

  const handleRemoveAssertion = (id) => {
    setAssertions((prev) => prev.filter((a) => a.id !== id));
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Test case name is required';
    if (!url.trim()) errs.url = 'URL is required';
    if (assertions.length === 0) {
      errs.assertions = 'At least one assertion is required for this test case';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      suiteId,
      name: name.trim(),
      description: description.trim(),
      method,
      url: url.trim(),
      params,
      headers,
      bodyType,
      jsonBody: bodyType === 'json' ? jsonBody : '',
      enabled,
      assertions,
    });
  };

  const modalTabs = [
    { id: 'request', label: 'HTTP Request', icon: Sliders },
    { id: 'assertions', label: `Assertions (${assertions.length})`, icon: CheckCircle2 },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <form onSubmit={handleSubmit}>
        <ModalHeader
          title={isEditing ? 'Edit Test Case' : 'Add Test Case to Suite'}
          description={
            isEditing
              ? `Configure request parameters and assertions for "${initialData?.name}"`
              : 'Define an endpoint request, parameters, and contract assertions'
          }
          icon={TestTube2}
        />

        {/* Tab Selector */}
        <div className="px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
          <Tabs tabs={modalTabs} activeTab={activeTab} onChange={setActiveTab} size="sm" variant="pills" />

          {/* Import Saved Endpoint Shortcut */}
          {savedEndpoints.length > 0 && (
            <div className="relative pb-2">
              <Button
                variant="outline"
                size="xs"
                type="button"
                onClick={() => setShowImportDropdown(!showImportDropdown)}
                leftIcon={<Import className="w-3 h-3 text-brand-500" />}
              >
                Import Saved Endpoint
              </Button>

              {showImportDropdown && (
                <div className="absolute right-0 top-8 z-30 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="p-2 text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-950 uppercase">
                    Select endpoint to prefill
                  </div>
                  {savedEndpoints.map((ep) => (
                    <div
                      key={ep.id}
                      onClick={() => handleImportEndpoint(ep)}
                      className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs font-mono flex items-center justify-between"
                    >
                      <div className="truncate pr-2">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{ep.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{ep.path}</div>
                      </div>
                      <MethodBadge method={ep.method} size="xs" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <ModalBody className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {activeTab === 'request' && (
            <div className="space-y-4">
              <Input
                label="Test Case Name"
                placeholder="e.g. Valid Admin Auth Token, Search Pagination Edge Case"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                required
                autoFocus
              />

              <Input
                label="Description (Optional)"
                placeholder="e.g. Asserts that the endpoint responds with 200 and schema contains ID..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {/* Method + URL Row */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 font-mono">
                  Endpoint URL (supports &#123;&#123;BASE_URL&#125;&#125;)
                </label>
                <div className="flex items-center space-x-2">
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-28 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-2.5 focus:outline-none focus:border-brand-500"
                  >
                    {METHODS_LIST.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="https://api.example.com/v1/resource or {{BASE_URL}}/posts"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-2.5 font-mono focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
                {errors.url && <p className="text-[11px] text-rose-500 font-mono">{errors.url}</p>}
              </div>

              {/* Request Body (If POST/PUT/PATCH) */}
              {['POST', 'PUT', 'PATCH'].includes(method) && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 font-mono">
                      Request Body (JSON)
                    </label>
                    <div className="flex items-center space-x-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setBodyType(bodyType === 'json' ? 'none' : 'json')}
                        className={`text-[11px] font-mono px-2 py-0.5 rounded transition-colors ${
                          bodyType === 'json'
                            ? 'bg-brand-500/10 text-brand-600 font-bold border border-brand-500/20'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {bodyType === 'json' ? 'Body Enabled' : 'No Body'}
                      </button>
                    </div>
                  </div>

                  {bodyType === 'json' && (
                    <textarea
                      rows={4}
                      value={jsonBody}
                      onChange={(e) => setJsonBody(e.target.value)}
                      placeholder='{\n  "title": "Sample"\n}'
                      className="w-full text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 text-emerald-400 p-2.5 focus:outline-none focus:border-brand-500 resize-none"
                    />
                  )}
                </div>
              )}

              {/* Enabled toggle */}
              <label className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                  Enable this test case for suite runs
                </span>
              </label>
            </div>
          )}

          {activeTab === 'assertions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs font-mono text-slate-900 dark:text-slate-100">
                    Response Assertions
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Define structured rules verified against the executed response
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="xs"
                  type="button"
                  onClick={() => handleAddAssertion()}
                  leftIcon={<Plus className="w-3 h-3" />}
                >
                  Add Assertion
                </Button>
              </div>

              {errors.assertions && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-mono flex items-center space-x-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.assertions}</span>
                </div>
              )}

              {assertions.length > 0 ? (
                <div className="space-y-3">
                  {assertions.map((asrt, index) => {
                    const meta = ASSERTION_TYPES[asrt.type] || ASSERTION_TYPES.status_code_equals;

                    return (
                      <div
                        key={asrt.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-mono text-[10px] font-bold flex items-center justify-center">
                              #{index + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                              {meta.label}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleRemoveAssertion(asrt.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                              title="Delete assertion"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Fields Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs font-mono">
                          {/* Assertion Type */}
                          <div className="sm:col-span-4">
                            <select
                              value={asrt.type}
                              onChange={(e) => handleUpdateAssertion(asrt.id, 'type', e.target.value)}
                              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                            >
                              {Object.entries(ASSERTION_TYPES).map(([typeKey, opt]) => (
                                <option key={typeKey} value={typeKey}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Target (JSON path or Header) */}
                          {meta.targetRequired ? (
                            <div className="sm:col-span-4">
                              <input
                                type="text"
                                placeholder={meta.targetPlaceholder || 'Target path...'}
                                value={asrt.target || ''}
                                onChange={(e) => handleUpdateAssertion(asrt.id, 'target', e.target.value)}
                                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                              />
                            </div>
                          ) : (
                            <div className="sm:col-span-4">
                              <input
                                type="text"
                                disabled
                                value="HTTP Response"
                                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-400 cursor-not-allowed"
                              />
                            </div>
                          )}

                          {/* Expected Value */}
                          {meta.valueRequired ? (
                            <div className="sm:col-span-4">
                              <input
                                type="text"
                                placeholder={meta.valuePlaceholder || 'Expected value...'}
                                value={asrt.value || ''}
                                onChange={(e) => handleUpdateAssertion(asrt.id, 'value', e.target.value)}
                                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                              />
                            </div>
                          ) : (
                            <div className="sm:col-span-4">
                              <input
                                type="text"
                                disabled
                                value="Must Exist"
                                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-400 cursor-not-allowed"
                              />
                            </div>
                          )}
                        </div>

                        {/* Description field */}
                        <div>
                          <input
                            type="text"
                            placeholder="Assertion explanatory note (e.g. Ensure user profile exists)"
                            value={asrt.description || ''}
                            onChange={(e) => handleUpdateAssertion(asrt.id, 'description', e.target.value)}
                            className="w-full px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 placeholder-slate-400"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <HelpCircle className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500 font-mono">No assertions added yet</p>
                  <Button variant="primary" size="xs" type="button" onClick={() => handleAddAssertion()}>
                    Add First Assertion
                  </Button>
                </div>
              )}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            {isEditing ? 'Save Test Case' : 'Add Test Case'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default TestCaseModal;
