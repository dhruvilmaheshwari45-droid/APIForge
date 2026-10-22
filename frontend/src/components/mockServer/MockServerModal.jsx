import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import { Server, Info, AlertCircle } from 'lucide-react';

const ENV_OPTIONS = [
  { value: 'Development', label: 'Development' },
  { value: 'Staging', label: 'Staging' },
  { value: 'Testing', label: 'Testing' },
  { value: 'Local', label: 'Local' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active (Simulated)' },
  { value: 'draft', label: 'Draft' },
  { value: 'paused', label: 'Paused' },
];

export const MockServerModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isEditing = false,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [environment, setEnvironment] = useState('Development');
  const [status, setStatus] = useState('active');
  const [defaultLatencyMs, setDefaultLatencyMs] = useState(50);
  const [port, setPort] = useState(8081);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData && isEditing) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setBaseUrl(initialData.baseUrl || '');
      setEnvironment(initialData.environment || 'Development');
      setStatus(initialData.status || 'active');
      setDefaultLatencyMs(initialData.defaultLatencyMs || 50);
      setPort(initialData.port || 8081);
    } else {
      setName('');
      setDescription('');
      setBaseUrl('https://mock.apiforge.dev/v1');
      setEnvironment('Development');
      setStatus('active');
      setDefaultLatencyMs(50);
      setPort(8081);
    }
    setError('');
  }, [initialData, isEditing, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Server name is required');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        baseUrl: baseUrl.trim() || 'https://mock.apiforge.dev/v1',
        environment,
        status,
        defaultLatencyMs: Number(defaultLatencyMs) || 0,
        port: Number(port) || 8080,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save mock server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={onClose}>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <ModalTitle>
                {isEditing ? 'Edit Mock Server' : 'Create Virtual Mock Server'}
              </ModalTitle>
              <ModalDescription>
                Configure route prefix, environment, and latency simulation
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

          <Input
            label="Mock Server Name"
            placeholder="e.g. Auth & Identity Virtual Server"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            required
            autoFocus
          />

          <Input
            label="Base URL / Route Prefix"
            placeholder="https://mock.apiforge.dev/v1/auth"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            helperText="Virtual prefix prefixed to all mock routes under this server"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Environment"
              options={ENV_OPTIONS}
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
            />

            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Default Latency (ms)"
              type="number"
              placeholder="50"
              value={defaultLatencyMs}
              onChange={(e) => setDefaultLatencyMs(e.target.value)}
              helperText="Simulated network delay"
            />

            <Input
              label="Assigned Port"
              type="number"
              placeholder="8081"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              helperText="Target backend engine port"
            />
          </div>

          <Textarea
            label="Description"
            placeholder="Document what this mock server simulates (e.g. payment intents, rate limits, customer schemas)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />

          {/* Important Limitation Notice */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-mono flex items-start space-x-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Notice:</strong> This registers a frontend mock configuration and virtual schema. The dedicated Express mock HTTP engine will spin up with the Node.js backend in later development milestones.
            </span>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={loading}>
            {isEditing ? 'Save Changes' : 'Create Server'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default MockServerModal;
