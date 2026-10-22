import React, { useState, useEffect } from 'react';
import { 
  X, 
  GitBranch, 
  Layers, 
  AlertTriangle, 
  FileText, 
  Check, 
  HelpCircle 
} from 'lucide-react';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../common/Modal';

export const VersionModal = ({
  isOpen,
  onClose,
  onSubmit,
  version = null, // null for create, object for edit
  existingVersions = [],
}) => {
  const isEditing = Boolean(version);

  const [formData, setFormData] = useState({
    versionNumber: '',
    status: 'Draft',
    description: '',
    baseVersionId: '',
    changelogNote: '',
    breakingChanges: false,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (version) {
        setFormData({
          versionNumber: version.versionNumber || '',
          status: version.status || 'Draft',
          description: version.description || '',
          baseVersionId: '',
          changelogNote: '',
          breakingChanges: Boolean(version.breakingChanges),
        });
      } else {
        // Suggest next version number
        let nextVer = 'v4';
        if (existingVersions.length > 0) {
          const numbers = existingVersions
            .map((v) => parseInt(v.versionNumber.replace(/\D/g, ''), 10))
            .filter((n) => !isNaN(n));
          if (numbers.length > 0) {
            nextVer = `v${Math.max(...numbers) + 1}`;
          }
        }

        setFormData({
          versionNumber: nextVer,
          status: 'Draft',
          description: '',
          baseVersionId: existingVersions[0]?.id || '',
          changelogNote: 'Initial schema baseline draft.',
          breakingChanges: false,
        });
      }
      setErrors({});
    }
  }, [isOpen, version, existingVersions]);

  const validate = () => {
    const errs = {};
    if (!formData.versionNumber || !formData.versionNumber.trim()) {
      errs.versionNumber = 'Version number is required (e.g., v1, v2, v3).';
    } else if (!/^v[0-9]+(\.[0-9]+)?$/i.test(formData.versionNumber.trim())) {
      errs.versionNumber = 'Format should be like v1, v2, v3 or v2.1.';
    }

    if (!formData.description || !formData.description.trim()) {
      errs.description = 'Please provide a short description of this version.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      ...formData,
      versionNumber: formData.versionNumber.trim(),
      description: formData.description.trim(),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <ModalHeader onClose={onClose}>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <ModalTitle>
                {isEditing ? `Edit Version: ${version.versionNumber}` : 'Create New API Version'}
              </ModalTitle>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                {isEditing
                  ? 'Update version metadata, release status, or add revision notes.'
                  : 'Tag a new schema version and inherit endpoints from an existing baseline.'}
              </p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-4">
          {/* Row 1: Version Number and Lifecycle Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-medium text-slate-700 dark:text-slate-300 mb-1">
                Version Tag <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.versionNumber}
                onChange={(e) => setFormData({ ...formData, versionNumber: e.target.value })}
                placeholder="e.g. v3, v4, v3.1"
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                  errors.versionNumber
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 dark:border-slate-800 focus:border-brand-500'
                }`}
              />
              {errors.versionNumber && (
                <p className="text-[11px] text-rose-500 mt-1 font-mono">{errors.versionNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-700 dark:text-slate-300 mb-1">
                Lifecycle Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                <option value="Draft">Draft (In development, unreleased)</option>
                <option value="Active">Active (Current production standard)</option>
                <option value="Deprecated">Deprecated (Scheduled for retirement)</option>
                <option value="Archived">Archived (Retired historical schema)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Base Version Fork (only on create) */}
          {!isEditing && existingVersions.length > 0 && (
            <div>
              <label className="block text-xs font-mono font-medium text-slate-700 dark:text-slate-300 mb-1">
                Inherit Endpoints from Base Version
              </label>
              <select
                value={formData.baseVersionId}
                onChange={(e) => setFormData({ ...formData, baseVersionId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                <option value="">Start Empty (No endpoints inherited)</option>
                {existingVersions.map((v) => (
                  <option key={v.id} value={v.id}>
                    Clone from {v.versionNumber} ({v.endpoints?.length || 0} endpoints) - {v.status}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 font-sans mt-1">
                Clones all active routes and schemas from the selected base version to start from a working baseline.
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-mono font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Explain the scope, purpose, architectural updates, or migration guidelines for this version..."
              className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border rounded-lg text-xs font-sans text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                errors.description
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-slate-200 dark:border-slate-800 focus:border-brand-500'
              }`}
            />
            {errors.description && (
              <p className="text-[11px] text-rose-500 mt-1 font-mono">{errors.description}</p>
            )}
          </div>

          {/* Changelog Note */}
          <div>
            <label className="block text-xs font-mono font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isEditing ? 'Append Changelog Revision Note' : 'Initial Changelog Entry'}
            </label>
            <input
              type="text"
              value={formData.changelogNote}
              onChange={(e) => setFormData({ ...formData, changelogNote: e.target.value })}
              placeholder={isEditing ? 'e.g., Added support for token expiration' : 'e.g., Initial baseline release'}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-sans text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Breaking Changes Toggle */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.breakingChanges}
                onChange={(e) => setFormData({ ...formData, breakingChanges: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-medium font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  Includes Breaking Changes
                </span>
                <p className="text-[11px] text-slate-400 font-sans">
                  Flags this version with a breaking change warning banner and deprecation alerts for client consumers.
                </p>
              </div>
            </label>
          </div>
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium font-mono transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium font-mono flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Save Changes' : 'Create Version'}</span>
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default VersionModal;
