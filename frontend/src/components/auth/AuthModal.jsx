import React, { useState } from 'react';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { useToast } from '../../context/ToastContext';
import authService from '../../services/authService';
import { LogIn, UserPlus, ShieldCheck } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const { toast } = useToast();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) {
          toast.error('Please enter your full name');
          setLoading(false);
          return;
        }
        const data = await authService.register(name.trim(), email.trim(), password);
        toast.success(`Welcome, ${data.user.name}! Account registered successfully.`, 'Registered');
      } else {
        const data = await authService.login(email.trim(), password);
        toast.success(`Welcome back, ${data.user.name}!`, 'Logged In');
      }

      if (onAuthSuccess) onAuthSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemo = async () => {
    setLoading(true);
    try {
      const data = await authService.login('alex@apiforge.dev', 'Password123!');
      toast.success(`Logged in as demo user ${data.user.name}`, 'Demo Mode');
      if (onAuthSuccess) onAuthSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Demo login error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={onClose}>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
              {isRegister ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            </div>
            <div>
              <ModalTitle>{isRegister ? 'Create APIForge Account' : 'Sign in to APIForge'}</ModalTitle>
              <ModalDescription>
                {isRegister ? 'Register your developer profile with JWT authentication' : 'Enter your credentials to access secured API resources'}
              </ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-4">
          {isRegister && (
            <Input
              label="Full Name"
              placeholder="e.g. Alex Rivera"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="developer@apiforge.dev"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus={!isRegister}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="pt-1 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-brand-600 dark:text-brand-400 hover:underline font-mono"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>

            <button
              type="button"
              onClick={handleUseDemo}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-mono text-[11px]"
            >
              Use Demo Account
            </button>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            loading={loading}
            leftIcon={isRegister ? UserPlus : ShieldCheck}
          >
            {isRegister ? 'Register' : 'Sign In'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default AuthModal;
