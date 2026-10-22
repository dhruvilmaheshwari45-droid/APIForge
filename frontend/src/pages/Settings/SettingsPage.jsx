import React, { useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Tabs from '../../components/common/Tabs';
import { Badge } from '../../components/common/Badge';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { 
  Settings, 
  Shield, 
  Key, 
  Bell, 
  Save, 
  Sun, 
  Moon, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  AlertCircle,
  HelpCircle,
  Laptop
} from 'lucide-react';

export const SettingsPage = () => {
  const { theme, setTheme } = useApp();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('general');
  const [proxyTimeout, setProxyTimeout] = useState('10000');
  const [portRange, setPortRange] = useState('4000 - 4099');
  const [defaultMethod, setDefaultMethod] = useState('GET');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const handleSave = () => {
    setSaveLoading(true);
    setTimeout(() => {
      setSaveLoading(false);
      toast.success('Platform configuration saved successfully.', 'Settings Updated');
    }, 600);
  };

  const handleResetConfirm = () => {
    setIsConfirmOpen(false);
    toast.warning('Default platform configuration has been restored.', 'Settings Reset');
  };

  const settingsTabs = [
    { id: 'general', label: 'General & Proxy', icon: Settings },
    { id: 'appearance', label: 'Appearance & Theme', icon: Sparkles },
    { id: 'design-system', label: 'Design System Demo', icon: Shield },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Platform & Workspace Settings"
        subtitle="Configure API proxy defaults, security tokens, mock server ports, and system preferences"
        badge={<Badge variant="primary">v1.0.0-Day2</Badge>}
        breadcrumbs={[
          { label: 'APIForge', path: '/dashboard' },
          { label: 'Settings', path: '/settings' },
        ]}
        actions={
          <div className="flex items-center space-x-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmOpen(true)}
            >
              Reset Defaults
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Save}
              loading={saveLoading}
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </div>
        }
      />

      {/* Tabs navigation */}
      <Tabs
        tabs={settingsTabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="pills"
      />

      {/* General & Proxy Tab */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Proxy & Mock Defaults</CardTitle>
                  <CardDescription>
                    Configure default network timeouts and simulated mock server ports.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Default Proxy Request Timeout (ms)"
                  mono
                  value={proxyTimeout}
                  onChange={(e) => setProxyTimeout(e.target.value)}
                  helperText="Requests exceeding this threshold will trigger a timeout exception."
                />

                <Input
                  label="Mock Server Port Allocation Range"
                  mono
                  value={portRange}
                  onChange={(e) => setPortRange(e.target.value)}
                  helperText="Ports allocated dynamically for simulated mock server instances."
                />

                <Select
                  label="Default HTTP Method for New Endpoints"
                  mono
                  value={defaultMethod}
                  onChange={(e) => setDefaultMethod(e.target.value)}
                  options={[
                    { value: 'GET', label: 'GET — Safe Read Operations' },
                    { value: 'POST', label: 'POST — Create / Ingest Payload' },
                    { value: 'PUT', label: 'PUT — Complete Resource Replacement' },
                    { value: 'PATCH', label: 'PATCH — Partial Resource Update' },
                    { value: 'DELETE', label: 'DELETE — Remove Resource' },
                  ]}
                />
              </CardContent>
              <CardFooter>
                <span className="text-[11px] text-slate-500 font-mono">
                  Applied globally to all active workspaces
                </span>
                <Button size="xs" variant="primary" onClick={handleSave}>
                  Save Settings
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>System Information</CardTitle>
                  <CardDescription>Current build & runtime environment</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 font-mono text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">APIForge Build</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">1.0.0-Day2</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Theme</span>
                  <Badge variant={theme === 'dark' ? 'primary' : 'warning'} size="sm">
                    {theme.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Routing</span>
                  <span className="text-slate-800 dark:text-slate-200">React Router v6</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Design System</span>
                  <span className="text-slate-800 dark:text-slate-200">Tailwind + Slate</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Status</span>
                  <Badge variant="success" dot size="sm">
                    OPERATIONAL
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <Card className="max-w-2xl">
          <CardHeader>
            <div>
              <CardTitle>Appearance & Theme Direction</CardTitle>
              <CardDescription>
                Select your preferred visual environment. Your preference is persisted in browser storage.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setTheme('dark');
                  toast.info('Switched to Dark Developer Mode.', 'Theme Updated');
                }}
                className={`p-4 rounded-xl border text-left transition-all ${
                  theme === 'dark'
                    ? 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-900 text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-slate-800 text-amber-400">
                    <Moon className="w-5 h-5" />
                  </div>
                  {theme === 'dark' && <Badge variant="primary">Active</Badge>}
                </div>
                <h4 className="text-xs font-bold font-mono text-slate-100">
                  Dark Charcoal / Slate (Recommended)
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Engineered for high-focus API development with subtle blue & emerald accents.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme('light');
                  toast.info('Switched to Light Developer Mode.', 'Theme Updated');
                }}
                className={`p-4 rounded-xl border text-left transition-all ${
                  theme === 'light'
                    ? 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-amber-500">
                    <Sun className="w-5 h-5" />
                  </div>
                  {theme === 'light' && <Badge variant="primary">Active</Badge>}
                </div>
                <h4 className="text-xs font-bold font-mono text-slate-900">
                  Light Developer Mode
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  High-contrast crisp white theme for daytime documentation and testing.
                </p>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Design System Interactive Demo Tab */}
      {activeTab === 'design-system' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Day 2 Design System Verification</CardTitle>
                <CardDescription>
                  Interactive showcase of all Day 2 reusable components: Buttons, Modals, Toasts, Badges, and Dialogs.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Toast Triggers */}
              <div>
                <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-3">
                  1. Toast Notification Variants
                </h4>
                <div className="flex flex-wrap gap-2.5">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => toast.success('API request 200 OK — 42ms response', 'Success')}
                  >
                    Trigger Success Toast
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => toast.error('Connection timed out on port 4010', 'Socket Error')}
                  >
                    Trigger Error Toast
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toast.warning('Rate limit threshold reached (80%)', 'Warning')}
                  >
                    Trigger Warning Toast
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info('New mock response rule added', 'System Event')}
                  >
                    Trigger Info Toast
                  </Button>
                </div>
              </div>

              {/* Modal & Dialog Triggers */}
              <div>
                <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-3">
                  2. Modal Dialogs & Confirm Popups
                </h4>
                <div className="flex flex-wrap gap-2.5">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsModalOpen(true)}
                  >
                    Open Reusable Modal (with Escape & Backdrop)
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setIsConfirmOpen(true)}
                  >
                    Open ConfirmDialog
                  </Button>
                </div>
              </div>

              {/* Badges */}
              <div>
                <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-3">
                  3. Badges & Indicators
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="success" dot>Active</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="danger">Error</Badge>
                  <Badge variant="info">Info</Badge>
                  <Badge variant="neutral">Neutral</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Demo Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md">
        <ModalHeader onClose={() => setIsModalOpen(false)}>
          <ModalTitle>APIForge Reusable Modal</ModalTitle>
          <ModalDescription>
            Fully accessible with Escape key listener, outside click dismissal, and body scroll locking.
          </ModalDescription>
        </ModalHeader>
        <ModalBody className="space-y-3">
          <Input label="Endpoint Path" mono placeholder="/api/v1/resource" defaultValue="/api/v1/auth" />
          <Select
            label="Mock Status Code"
            mono
            options={[
              { value: '200', label: '200 OK — Successful' },
              { value: '201', label: '201 Created — Resource Created' },
              { value: '400', label: '400 Bad Request — Client Error' },
              { value: '404', label: '404 Not Found' },
              { value: '500', label: '500 Internal Server Error' },
            ]}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setIsModalOpen(false);
              toast.success('Modal action performed successfully');
            }}
          >
            Apply Configuration
          </Button>
        </ModalFooter>
      </Modal>

      {/* Confirm Action Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleResetConfirm}
        title="Reset Platform Settings?"
        message="This action will restore default proxy timeout (10000ms) and default port ranges. This cannot be undone."
        confirmText="Yes, Reset Settings"
        variant="danger"
      />
    </div>
  );
};

export default SettingsPage;
