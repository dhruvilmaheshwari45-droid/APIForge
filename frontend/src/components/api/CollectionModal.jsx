import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import { FolderGit2 } from 'lucide-react';

export const CollectionModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isEditing = false,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [category, setCategory] = useState('Core Services');
  const [version, setVersion] = useState('v1.0.0');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData && isEditing) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setBaseUrl(initialData.baseUrl || '');
      setCategory(initialData.category || 'Core Services');
      setVersion(initialData.version || 'v1.0.0');
    } else {
      setName('');
      setDescription('');
      setBaseUrl('https://api.apiforge.dev/v1');
      setCategory('Core Services');
      setVersion('v1.0.0');
    }
    setError('');
  }, [initialData, isEditing, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Collection name is required.');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        baseUrl: baseUrl.trim() || 'https://api.apiforge.dev/v1',
        category,
        version: version.trim() || 'v1.0.0',
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save collection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={onClose}>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <ModalTitle>
                {isEditing ? 'Edit API Collection' : 'Create API Collection'}
              </ModalTitle>
              <ModalDescription>
                {isEditing
                  ? 'Update collection properties, base URL, and metadata'
                  : 'Group endpoints into a distinct service domain'}
              </ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-4">
          <Input
            label="Collection Name"
            placeholder="e.g. User Management & Auth API"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            error={error}
            required
            autoFocus
          />

          <Input
            label="Base Environment URL"
            mono
            placeholder="https://api.apiforge.dev/v1"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            helperText="Default host prefix inherited by endpoints in this collection"
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Service Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: 'Core Services', label: 'Core Services' },
                { value: 'Finance', label: 'Finance & Payments' },
                { value: 'E-Commerce', label: 'E-Commerce' },
                { value: 'Utility', label: 'Utility' },
                { value: 'External Integration', label: 'External Integration' },
              ]}
            />
            <Input
              label="Version Tag"
              mono
              placeholder="v1.0.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
          </div>

          <Textarea
            label="Description"
            placeholder="Brief overview of endpoints grouped within this collection..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={loading}>
            {isEditing ? 'Save Changes' : 'Create Collection'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default CollectionModal;
