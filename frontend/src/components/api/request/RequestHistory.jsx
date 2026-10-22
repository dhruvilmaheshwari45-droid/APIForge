import React, { useState, useEffect, useMemo } from 'react';
import { MethodBadge, StatusBadge } from '../../common/Badge';
import Button from '../../common/Button';
import ConfirmDialog from '../../common/ConfirmDialog';
import { useToast } from '../../../context/ToastContext';
import requestService from '../../../services/requestService';
import {
  History,
  Trash2,
  Clock,
  RotateCcw,
  Search,
  ExternalLink,
  ChevronRight,
  Database,
  X,
  AlertCircle
} from 'lucide-react';

export const RequestHistory = ({
  isOpen = false,
  onClose,
  onRestoreRequest,
}) => {
  const { toast } = useToast();
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const loadHistory = () => {
    const list = requestService.getHistory();
    setHistory(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const handleRemoveEntry = (e, id) => {
    e.stopPropagation();
    const updated = requestService.removeHistoryEntry(id);
    setHistory(updated);
    toast.info('History entry removed');
  };

  const handleClearAll = () => {
    requestService.clearHistory();
    setHistory([]);
    setIsClearConfirmOpen(false);
    toast.info('Request history cleared');
  };

  const handleSelectEntry = (entry) => {
    if (!entry.configSnapshot) return;
    onRestoreRequest?.(entry.configSnapshot);
    onClose?.();
    toast.success(`Restored ${entry.method} request configuration`);
  };

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;
    const q = searchQuery.toLowerCase();
    return history.filter(
      (h) =>
        h.url?.toLowerCase().includes(q) ||
        h.method?.toLowerCase().includes(q) ||
        String(h.status).includes(q)
    );
  }, [history, searchQuery]);

  const formatTime = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col z-10 animate-slideDown">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-mono">
                Request Execution History
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {history.length} logged requests (stored locally)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setIsClearConfirmOpen(true)}
                title="Clear all history"
              >
                <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-500" />
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by URL, method, status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectEntry(item)}
                className="group p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 hover:bg-brand-500/5 hover:border-brand-500/40 cursor-pointer transition-all space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MethodBadge method={item.method} size="xs" />
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(item.timestamp)}</span>
                    <button
                      onClick={(e) => handleRemoveEntry(e, item.id)}
                      className="p-1 hover:text-rose-500 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                      title="Remove entry"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <p className="text-xs font-mono text-slate-800 dark:text-slate-200 truncate font-semibold">
                  {item.url}
                </p>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                  <span>{item.responseTimeMs} ms</span>
                  <span className="text-brand-600 dark:text-brand-400 group-hover:translate-x-0.5 transition-transform flex items-center space-x-0.5">
                    <span>Restore</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center space-y-2 text-slate-400 font-mono text-xs">
              <History className="w-8 h-8 mx-auto opacity-40" />
              <p>No request executions in history</p>
              {searchQuery && <p className="text-[11px]">No items match "{searchQuery}"</p>}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[10px] font-mono text-slate-500 text-center">
          Authorization secrets are automatically redacted before being stored.
        </div>
      </div>

      {/* Clear Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={handleClearAll}
        title="Clear Request History?"
        message="Are you sure you want to delete all entries from your local request history? This action cannot be undone."
        confirmText="Clear All"
        variant="danger"
      />
    </div>
  );
};

export default RequestHistory;
