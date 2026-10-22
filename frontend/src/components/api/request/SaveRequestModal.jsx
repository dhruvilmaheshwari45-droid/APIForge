import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../../common/Modal';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Select from '../../common/Select';
import Textarea from '../../common/Textarea';
import { MethodBadge } from '../../common/Badge';
import { Bookmark, FolderPlus, FolderGit2, Check, AlertCircle } from 'lucide-react';
import collectionService from '../../../services/collectionService';

export const SaveRequestModal = ({
  isOpen,
  onClose,
  onSaved,
  requestData = {},
  existingEndpoint = null,
}) => {
  const [collections, setCollections] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [endpointName, setEndpointName] = useState('');
  const [endpointPath, setEndpointPath] = useState('');
  const [description, setDescription] = useState('');
  const [saveMode, setSaveMode] = useState('new'); // 'new' | 'update'

  // In-modal quick collection creation
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColBaseUrl, setNewColBaseUrl] = useState('https://api.apiforge.dev/v1');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const cols = collectionService.getCollections();
    setCollections(cols);

    // Derive path from URL
    let path = '/';
    try {
      if (requestData.url) {
        if (requestData.url.startsWith('http://') || requestData.url.startsWith('https://')) {
          const parsed = new URL(requestData.url);
          path = parsed.pathname || '/';
        } else {
          path = requestData.url.startsWith('/') ? requestData.url : `/${requestData.url}`;
        }
      }
    } catch (e) {
      path = '/';
    }

    if (existingEndpoint) {
      setSaveMode('update');
      setEndpointName(existingEndpoint.name || '');
      setEndpointPath(existingEndpoint.path || path);
      setSelectedCollectionId(existingEndpoint.collectionId || cols[0]?.id || '');
      setDescription(existingEndpoint.description || '');
    } else {
      setSaveMode('new');
      setEndpointName(requestData.name || `Request ${requestData.method} ${path}`);
      setEndpointPath(path);
      setSelectedCollectionId(cols[0]?.id || '');
      setDescription('');
    }

    setIsCreatingCollection(false);
    setError('');
  }, [isOpen, existingEndpoint, requestData]);

  const handleQuickCreateCollection = () => {
    if (!newColName.trim()) {
      setError('Please provide a collection name');
      return;
    }
    try {
      const created = collectionService.createCollection({
        name: newColName.trim(),
        baseUrl: newColBaseUrl.trim() || 'https://api.apiforge.dev/v1',
        description: 'Created from Request Builder',
        category: 'Custom',
      });
      const updatedCols = collectionService.getCollections();
      setCollections(updatedCols);
      setSelectedCollectionId(created.id);
      setIsCreatingCollection(false);
      setNewColName('');
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to create collection');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!endpointName.trim()) {
      setError('Endpoint name is required');
      return;
    }
    if (!endpointPath.trim()) {
      setError('Endpoint path is required');
      return;
    }
    if (!selectedCollectionId) {
      setError('Please select or create a collection');
      return;
    }

    try {
      setLoading(true);

      let cleanPath = endpointPath.trim();
      if (!cleanPath.startsWith('/')) {
        cleanPath = `/${cleanPath}`;
      }

      const payload = {
        name: endpointName.trim(),
        method: requestData.method || 'GET',
        path: cleanPath,
        collectionId: selectedCollectionId,
        description: description.trim(),
        headers: requestData.headers || [],
        queryParams: requestData.params || [],
        requestBody: requestData.body || null,
        responseExample: {
          status: 200,
          body: { message: 'Sample saved response' },
        },
      };

      let result;
      if (saveMode === 'update' && existingEndpoint) {
        result = collectionService.updateEndpoint(existingEndpoint.id, payload);
      } else {
        result = collectionService.createEndpoint(payload);
      }

      onSaved?.(result);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save request');
    } finally {
      setLoading(false);
    }
  };

  const collectionOptions = collections.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.version || 'v1'})`,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={onClose}>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <ModalTitle>
                {existingEndpoint && saveMode === 'update' ? 'Update Saved Request' : 'Save Request to Collection'}
              </ModalTitle>
              <ModalDescription>
                Store request headers, parameters, and payload into your API catalog
              </ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* If existing endpoint is linked, show radio choice: update vs new */}
          {existingEndpoint && (
            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-mono uppercase font-semibold text-slate-500">
                Save Target
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSaveMode('update')}
                  className={`p-2 rounded-lg text-xs font-mono text-center border transition-all ${
                    saveMode === 'update'
                      ? 'bg-brand-500/15 border-brand-500 text-brand-600 dark:text-brand-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Update Existing ({existingEndpoint.name})
                </button>
                <button
                  type="button"
                  onClick={() => setSaveMode('new')}
                  className={`p-2 rounded-lg text-xs font-mono text-center border transition-all ${
                    saveMode === 'new'
                      ? 'bg-brand-500/15 border-brand-500 text-brand-600 dark:text-brand-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Save as New Endpoint
                </button>
              </div>
            </div>
          )}

          {/* Method and Name */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <MethodBadge method={requestData.method || 'GET'} size="sm" />
              <div className="flex-1">
                <Input
                  label="Endpoint Name"
                  placeholder="e.g. Get User Profile by ID"
                  value={endpointName}
                  onChange={(e) => setEndpointName(e.target.value)}
                  required
                />
              </div>
            </div>

            <Input
              label="Resource Path"
              placeholder="/v1/users/:id"
              value={endpointPath}
              onChange={(e) => setEndpointPath(e.target.value)}
              helperText="Extracted relative path"
              required
            />
          </div>

          {/* Collection Selector & Quick Add */}
          {!isCreatingCollection ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Target Collection
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingCollection(true)}
                  className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1 font-mono"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>+ New Collection</span>
                </button>
              </div>
              <Select
                options={collectionOptions}
                value={selectedCollectionId}
                onChange={(e) => setSelectedCollectionId(e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-brand-500/30 bg-brand-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                  Create New Collection
                </h5>
                <button
                  type="button"
                  onClick={() => setIsCreatingCollection(false)}
                  className="text-[11px] text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>
              <Input
                label="Collection Name"
                placeholder="e.g. Analytics & Metrics API"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
              />
              <Input
                label="Base URL"
                placeholder="https://api.apiforge.dev/v1"
                value={newColBaseUrl}
                onChange={(e) => setNewColBaseUrl(e.target.value)}
              />
              <Button
                type="button"
                variant="primary"
                size="xs"
                onClick={handleQuickCreateCollection}
              >
                Create & Select Collection
              </Button>
            </div>
          )}

          <Textarea
            label="Description (Optional)"
            placeholder="Brief overview or notes regarding this request configuration..."
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
            {saveMode === 'update' ? 'Save & Update' : 'Save Request'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default SaveRequestModal;
