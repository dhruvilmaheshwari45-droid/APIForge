import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import { useToast } from '../../context/ToastContext';
import { FolderGit2, Server, TestTube2 } from 'lucide-react';
import mockServerService from '../../services/mockServerService';
import collectionService from '../../services/collectionService';
import testService from '../../services/testService';

export const CreateCollectionModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Core Services');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('v1.0.0');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a collection name', 'Validation Error');
      return;
    }
    try {
      collectionService.createCollection({
        name: name.trim(),
        category,
        description: description.trim(),
        version: version.trim() || 'v1.0.0',
      });
      toast.success(`Collection "${name}" created successfully.`, 'Collection Created');
      onClose();
      navigate('/apis/collections');
    } catch (err) {
      toast.error(err.message || 'Failed to create collection');
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
              <ModalTitle>Create API Collection</ModalTitle>
              <ModalDescription>Organize endpoints into a cohesive service domain</ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-4">
          <Input
            label="Collection Name"
            placeholder="e.g. Identity & Authentication API"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Domain Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: 'Core Services', label: 'Core Services' },
                { value: 'Finance & Payments', label: 'Finance & Payments' },
                { value: 'E-Commerce', label: 'E-Commerce' },
                { value: 'Data Ingestion', label: 'Data Ingestion' },
                { value: 'Utility', label: 'Utility' },
              ]}
            />
            <Input
              label="Initial Version"
              mono
              placeholder="v1.0.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
          </div>

          <Textarea
            label="Description"
            placeholder="Briefly describe what this API collection provides..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Create Collection
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export const CreateMockServerModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [port, setPort] = useState('4040');
  const [latency, setLatency] = useState('100');
  const [environment, setEnvironment] = useState('Staging');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please specify a mock server name', 'Validation Error');
      return;
    }
    try {
      mockServerService.createServer({
        name: name.trim(),
        port: parseInt(port, 10) || 8080,
        defaultLatencyMs: parseInt(latency, 10) || 100,
        environment,
        status: 'active',
      });
      toast.success(`Mock Server "${name}" created.`, 'Server Created');
      onClose();
      navigate('/mock-servers');
    } catch (err) {
      toast.error(err.message || 'Failed to create server');
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
              <ModalTitle>Create Mock Server</ModalTitle>
              <ModalDescription>Simulate backend responses with custom latency and error rules</ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-4">
          <Input
            label="Mock Server Name"
            placeholder="e.g. Orders Microservice Mock"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Local Port"
              mono
              type="number"
              placeholder="4040"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              helperText="Allocated port on localhost"
            />
            <Input
              label="Simulated Latency (ms)"
              mono
              type="number"
              placeholder="100"
              value={latency}
              onChange={(e) => setLatency(e.target.value)}
              helperText="Delay added before response"
            />
          </div>

          <Select
            label="Target Environment"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            options={[
              { value: 'Local', label: 'Local (localhost:4040)' },
              { value: 'Development', label: 'Development Environment' },
              { value: 'Staging', label: 'Staging Environment' },
            ]}
          />
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="success" size="sm" type="submit">
            Launch Mock Server
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export const CreateTestSuiteModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [environment, setEnvironment] = useState('Staging');
  const [schedule, setSchedule] = useState('manual');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a test suite title', 'Validation Error');
      return;
    }
    try {
      testService.createSuite({
        name: name.trim(),
        environmentId: environment === 'Local' ? 'env-local' : environment === 'Development' ? 'env-dev' : environment === 'Production' ? 'env-prod' : 'env-staging',
        schedule,
      });
      toast.success(`Test Suite "${name}" created.`, 'Suite Created');
      onClose();
      navigate('/testing/suites');
    } catch (err) {
      toast.error(err.message || 'Failed to create test suite');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={onClose}>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <TestTube2 className="w-5 h-5" />
            </div>
            <div>
              <ModalTitle>Create Test Suite</ModalTitle>
              <ModalDescription>Configure automated assertions, contracts, and regression tests</ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-4">
          <Input
            label="Test Suite Title"
            placeholder="e.g. Identity & Token Expiry Suite"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <Select
            label="Target Execution Environment"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            options={[
              { value: 'Staging', label: 'Staging Environment' },
              { value: 'Development', label: 'Development Internal' },
              { value: 'Production', label: 'Production (Dry-Run Only)' },
              { value: 'Local', label: 'Local Mock Engine' },
            ]}
          />

          <Select
            label="Execution Trigger Schedule"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            options={[
              { value: 'manual', label: 'Manual Execution Only' },
              { value: 'hourly', label: 'Every Hour (Automated Cron)' },
              { value: 'nightly', label: 'Nightly at 00:00 UTC' },
              { value: 'deploy', label: 'On Deployment Webhook' },
            ]}
          />
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Create Test Suite
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
