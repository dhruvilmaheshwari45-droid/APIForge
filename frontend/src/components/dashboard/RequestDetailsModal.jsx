import React, { useState } from 'react';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../common/Modal';
import { MethodBadge, StatusBadge } from '../common/Badge';
import Button from '../common/Button';
import { Copy, Check, Terminal, ExternalLink, Globe, Clock, ShieldCheck, FileCode } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const RequestDetailsModal = ({ isOpen, onClose, request }) => {
  const { toast } = useToast();
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  if (!request) return null;

  const generateCurlCommand = () => {
    let curl = `curl -X ${request.method} "https://api.apiforge.dev${request.endpoint}"`;
    if (request.headers) {
      Object.entries(request.headers).forEach(([k, v]) => {
        curl += ` \\\n  -H "${k}: ${v}"`;
      });
    }
    if (request.requestBody) {
      curl += ` \\\n  -d '${JSON.stringify(request.requestBody)}'`;
    }
    return curl;
  };

  const handleCopyCurl = () => {
    const curl = generateCurlCommand();
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    toast.success('cURL command copied to clipboard', 'Copied');
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleCopyJson = () => {
    if (!request.responseBody) return;
    navigator.clipboard.writeText(JSON.stringify(request.responseBody, null, 2));
    setCopiedJson(true);
    toast.success('Response JSON copied to clipboard', 'Copied');
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <MethodBadge method={request.method} size="md" />
          <ModalTitle className="text-sm font-mono truncate max-w-md">
            {request.endpoint}
          </ModalTitle>
          <StatusBadge status={request.status} />
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {request.responseTime}ms
          </span>
        </div>
      </ModalHeader>

      <ModalBody className="space-y-5">
        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Environment</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{request.environment}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Time</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{request.time}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Client IP</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{request.clientIp || '127.0.0.1'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Request ID</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{request.id}</span>
          </div>
        </div>

        {/* Request Headers */}
        <div>
          <h4 className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
            <span>Request Headers</span>
          </h4>
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs font-mono overflow-x-auto space-y-1">
            {request.headers ? (
              Object.entries(request.headers).map(([key, val]) => (
                <div key={key} className="flex justify-between py-0.5">
                  <span className="text-slate-500">{key}:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium truncate ml-4 max-w-sm">{val}</span>
                </div>
              ))
            ) : (
              <span className="text-slate-400">No custom headers transmitted</span>
            )}
          </div>
        </div>

        {/* Request Body (if any) */}
        {request.requestBody && (
          <div>
            <h4 className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <FileCode className="w-3.5 h-3.5 text-amber-500" />
              <span>Inbound Payload (JSON)</span>
            </h4>
            <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-indigo-300 overflow-x-auto max-h-40">
              {JSON.stringify(request.requestBody, null, 2)}
            </pre>
          </div>
        )}

        {/* Response Body */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-500" />
              <span>Response Body</span>
            </h4>
            <Button
              variant="ghost"
              size="xs"
              leftIcon={copiedJson ? Check : Copy}
              onClick={handleCopyJson}
            >
              {copiedJson ? 'Copied' : 'Copy JSON'}
            </Button>
          </div>
          <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto max-h-52">
            {request.responseBody ? JSON.stringify(request.responseBody, null, 2) : '// No response body returned'}
          </pre>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button
          variant="outline"
          size="sm"
          leftIcon={copiedCurl ? Check : Terminal}
          onClick={handleCopyCurl}
        >
          {copiedCurl ? 'Copied cURL' : 'Copy as cURL'}
        </Button>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default RequestDetailsModal;
