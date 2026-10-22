import React, { useState, useEffect } from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { Layers, Globe, Palette, Check } from 'lucide-react';

const COLOR_PRESETS = [
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500', border: 'border-emerald-500' },
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500', border: 'border-indigo-500' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-500', border: 'border-amber-500' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-500', border: 'border-rose-500' },
  { id: 'cyan', label: 'Cyan', bg: 'bg-cyan-500', border: 'border-cyan-500' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-500', border: 'border-purple-500' },
];

export const EnvironmentModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isEditing = false,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [color, setColor] = useState('indigo');
  const [setAsActive, setSetAsActive] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData && isEditing) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setBaseUrl(initialData.baseUrl || '');
      setColor(initialData.color || 'indigo');
      setSetAsActive(false);
    } else {
      setName('');
      setDescription('');
      setBaseUrl('https://api.example.com');
      setColor('indigo');
      setSetAsActive(true);
    }
    setErrors({});
  }, [initialData, isEditing, isOpen]);

  const validate = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Environment name is required';
    }
    if (!baseUrl.trim()) {
      errs.baseUrl = 'Base URL is required';
    } else if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      errs.baseUrl = 'Base URL must start with http:// or https://';
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
      baseUrl: baseUrl.trim(),
      color,
      setAsActive,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader
          title={isEditing ? 'Edit Environment' : 'Create Environment'}
          description={
            isEditing
              ? `Update configuration for "${initialData?.name}"`
              : 'Define a new deployment target with scoped variables and base URLs'
          }
          icon={Layers}
        />

        <ModalBody className="space-y-4">
          <Input
            label="Environment Name"
            placeholder="e.g. Local Docker, Staging QA, Production EU"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            required
            autoFocus
          />

          <Input
            label="Base URL / Host Gateway"
            placeholder="e.g. https://api.staging.example.com/v1"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            error={errors.baseUrl}
            required
            helperText="Default value automatically mapped to {{BASE_URL}} in requests"
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 font-mono">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Pre-production testing environment for integration suites..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-2.5 placeholder-slate-400 focus:outline-none focus:border-brand-500 font-mono resize-none"
            />
          </div>

          {/* Color Preset Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 font-mono">
              Accent Badge Color
            </label>
            <div className="flex items-center space-x-3">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setColor(p.id)}
                  className={`w-7 h-7 rounded-full ${p.bg} flex items-center justify-center transition-transform ${
                    color === p.id ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  title={p.label}
                >
                  {color === p.id && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Set as Active Immediately Checkbox */}
          {!isEditing && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={setAsActive}
                  onChange={(e) => setAsActive(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                  Set as currently active target environment
                </span>
              </label>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            {isEditing ? 'Save Changes' : 'Create Environment'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default EnvironmentModal;
