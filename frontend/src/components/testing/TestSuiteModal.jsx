import React, { useState, useEffect } from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import environmentService from '../../services/environmentService';
import { TestTube2, Globe, Clock, Layers } from 'lucide-react';

const SCHEDULE_OPTIONS = [
  { value: 'Manual', label: 'Manual Run Only' },
  { value: 'On Every Deploy', label: 'CI/CD Pipeline (On Deploy)' },
  { value: 'Hourly Healthcheck', label: 'Hourly Healthcheck' },
  { value: 'Daily at 00:00 UTC', label: 'Daily Regression (00:00 UTC)' },
  { value: 'Weekly Audit', label: 'Weekly SLA Audit' },
];

export const TestSuiteModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isEditing = false,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [environmentId, setEnvironmentId] = useState('env-dev');
  const [schedule, setSchedule] = useState('Manual');
  const [environments, setEnvironments] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    try {
      const envs = environmentService.getEnvironments();
      setEnvironments(envs);
    } catch {
      setEnvironments([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData && isEditing) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setEnvironmentId(initialData.environmentId || 'env-dev');
      setSchedule(initialData.schedule || 'Manual');
    } else {
      setName('');
      setDescription('');
      setEnvironmentId('env-dev');
      setSchedule('Manual');
    }
    setErrors({});
  }, [initialData, isEditing, isOpen]);

  const validate = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Test suite name is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      environmentId,
      schedule,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader
          title={isEditing ? 'Edit Test Suite' : 'Create Automated Test Suite'}
          description={
            isEditing
              ? `Update configuration for "${initialData?.name}"`
              : 'Group endpoint test cases into an automated regression verification suite'
          }
          icon={TestTube2}
        />

        <ModalBody className="space-y-4">
          <Input
            label="Suite Name"
            placeholder="e.g. Identity & Access Regression, Checkout Flow Healthcheck"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            required
            autoFocus
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 font-mono">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Validates authentication token issuance, permissions, and session timeouts..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-2.5 placeholder-slate-400 focus:outline-none focus:border-brand-500 font-mono resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Environment */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 font-mono">
                Target Environment
              </label>
              <select
                value={environmentId}
                onChange={(e) => setEnvironmentId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-2.5 focus:outline-none focus:border-brand-500 font-mono"
              >
                {environments.map((env) => (
                  <option key={env.id} value={env.id}>
                    {env.name} ({env.baseUrl})
                  </option>
                ))}
              </select>
            </div>

            {/* Automation Schedule Trigger */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 font-mono">
                Execution Trigger
              </label>
              <select
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-2.5 focus:outline-none focus:border-brand-500 font-mono"
              >
                {SCHEDULE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            {isEditing ? 'Save Changes' : 'Create Suite'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default TestSuiteModal;
