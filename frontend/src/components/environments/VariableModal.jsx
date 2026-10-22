import React, { useState, useEffect } from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { validateVariableName } from '../../utils/variableResolver';
import { KeyRound, Eye, EyeOff, ShieldAlert, Sparkles, Check } from 'lucide-react';

export const VariableModal = ({
  isOpen,
  onClose,
  onSubmit,
  existingVariables = [],
  initialData = null,
  isEditing = false,
}) => {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [description, setDescription] = useState('');
  const [showPlainValue, setShowPlainValue] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData && isEditing) {
      setKey(initialData.key || '');
      setValue(initialData.value !== undefined ? String(initialData.value) : '');
      setIsSecret(Boolean(initialData.isSecret || initialData.secret));
      setEnabled(initialData.enabled !== undefined ? initialData.enabled : true);
      setDescription(initialData.description || '');
      setShowPlainValue(false);
    } else {
      setKey('');
      setValue('');
      setIsSecret(false);
      setEnabled(true);
      setDescription('');
      setShowPlainValue(false);
    }
    setErrors({});
  }, [initialData, isEditing, isOpen]);

  const validate = () => {
    const errs = {};
    const keyValidation = validateVariableName(key);
    if (!keyValidation.valid) {
      errs.key = keyValidation.error;
    } else {
      // Check for duplicate key (excluding self if editing)
      const normalizedKey = key.trim();
      const duplicate = existingVariables.find((v) => {
        if (isEditing && initialData && v.id === initialData.id) return false;
        return (v.key || '').trim().toLowerCase() === normalizedKey.toLowerCase();
      });
      if (duplicate) {
        errs.key = `Variable "${normalizedKey}" already exists in this environment`;
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      key: key.trim(),
      value,
      isSecret,
      enabled,
      description: description.trim(),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader
          title={isEditing ? 'Edit Variable' : 'Add Environment Variable'}
          description={
            isEditing
              ? `Update variable {{${initialData?.key}}}`
              : 'Add a new reusable variable for request parameterization'
          }
          icon={KeyRound}
        />

        <ModalBody className="space-y-4">
          <div>
            <Input
              label="Variable Key (Name)"
              placeholder="e.g. API_KEY, USER_ID, TENANT_CODE"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                if (errors.key) setErrors((prev) => ({ ...prev, key: null }));
              }}
              error={errors.error || errors.key}
              required
              autoFocus
              helperText="Reference as {{VARIABLE_KEY}} anywhere in URLs, headers, or request bodies"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 font-mono">
                Value
              </label>
              {isSecret && (
                <button
                  type="button"
                  onClick={() => setShowPlainValue(!showPlainValue)}
                  className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1"
                >
                  {showPlainValue ? (
                    <>
                      <EyeOff className="w-3 h-3" />
                      <span>Mask Value</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" />
                      <span>Reveal Value</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type={isSecret && !showPlainValue ? 'password' : 'text'}
                placeholder="Variable value..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-2.5 placeholder-slate-400 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>

          <Input
            label="Description (Optional)"
            placeholder="e.g. Staging bearer auth token or Customer UUID"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            {/* Secret / Sensitive Flag Toggle */}
            <label className="flex items-start space-x-3 cursor-pointer p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
              <input
                type="checkbox"
                checked={isSecret}
                onChange={(e) => setIsSecret(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 font-mono">
                  Mask as Secret Value
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Automatically masks this value in the interface, telemetry, and request history logs
                </p>
              </div>
            </label>

            {/* Enabled / Disabled Toggle */}
            <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                Enable variable for active substitution
              </span>
            </label>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            {isEditing ? 'Save Variable' : 'Add Variable'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default VariableModal;
