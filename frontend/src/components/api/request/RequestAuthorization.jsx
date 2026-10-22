import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, Shield, ShieldAlert, ShieldCheck, Lock, Info } from 'lucide-react';

const AUTH_TYPES = [
  { id: 'noauth', label: 'No Auth', description: 'No authentication credentials sent' },
  { id: 'bearer', label: 'Bearer Token', description: 'Sends an Authorization: Bearer <token> header' },
  { id: 'basic', label: 'Basic Auth', description: 'Sends base64 encoded username:password credentials' },
  { id: 'apikey', label: 'API Key', description: 'Sends key/value in custom header or query string' },
];

export const RequestAuthorization = ({ auth = { type: 'noauth' }, onChange }) => {
  const [showBearer, setShowBearer] = useState(false);
  const [showBasicPass, setShowBasicPass] = useState(false);
  const [showApiKeyVal, setShowApiKeyVal] = useState(false);

  const setAuthType = (type) => {
    onChange?.({
      ...auth,
      type,
    });
  };

  const updateField = (field, val) => {
    onChange?.({
      ...auth,
      [field]: val,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
          Authorization Strategy
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Select and configure the authentication protocol attached to outgoing requests
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Auth Type Selector */}
        <div className="md:col-span-4 space-y-2">
          <label className="text-[11px] font-mono font-semibold uppercase text-slate-400">
            Auth Type
          </label>
          <div className="space-y-1.5">
            {AUTH_TYPES.map((t) => {
              const isSelected = (auth.type || 'noauth') === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setAuthType(t.id)}
                  className={`
                    w-full text-left p-3 rounded-xl border transition-all flex items-start space-x-3
                    ${
                      isSelected
                        ? 'bg-brand-500/10 border-brand-500/50 text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-brand-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }
                  `}
                >
                  <div className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${isSelected ? 'bg-brand-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs block font-mono">{t.label}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                      {t.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Specific Configuration Panel */}
        <div className="md:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          {/* No Auth */}
          {(!auth.type || auth.type === 'noauth') && (
            <div className="py-6 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Shield className="w-5 h-5" />
              </div>
              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                No Authentication Selected
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                This request does not use any authentication credentials. Standard open endpoints will accept this.
              </p>
            </div>
          )}

          {/* Bearer Token */}
          {auth.type === 'bearer' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                <Lock className="w-4 h-4 text-brand-500" />
                <span>Bearer Token Configuration</span>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Token String / JWT
                </label>
                <div className="relative">
                  <input
                    type={showBearer ? 'text' : 'password'}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={auth.bearerToken || ''}
                    onChange={(e) => updateField('bearerToken', e.target.value)}
                    className="w-full pl-3 pr-10 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBearer(!showBearer)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    title={showBearer ? 'Hide token' : 'Show token'}
                  >
                    {showBearer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {auth.bearerToken && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Preview Header:</span>
                  <div className="text-brand-600 dark:text-brand-400 truncate">
                    Authorization: Bearer {auth.bearerToken.substring(0, 15)}...
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Basic Auth */}
          {auth.type === 'basic' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                <Lock className="w-4 h-4 text-brand-500" />
                <span>Basic Auth Credentials</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="admin"
                    value={auth.basicUsername || ''}
                    onChange={(e) => updateField('basicUsername', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showBasicPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={auth.basicPassword || ''}
                      onChange={(e) => updateField('basicPassword', e.target.value)}
                      className="w-full pl-3 pr-10 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowBasicPass(!showBasicPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                      title={showBasicPass ? 'Hide password' : 'Show password'}
                    >
                      {showBasicPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {auth.basicUsername && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Preview Header:</span>
                  <div className="text-brand-600 dark:text-brand-400 truncate">
                    Authorization: Basic {btoa(`${auth.basicUsername || ''}:${auth.basicPassword || ''}`)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* API Key */}
          {auth.type === 'apikey' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                <Lock className="w-4 h-4 text-brand-500" />
                <span>API Key Configuration</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Key Name
                  </label>
                  <input
                    type="text"
                    placeholder="X-API-Key or api_key"
                    value={auth.apiKeyName || 'X-API-Key'}
                    onChange={(e) => updateField('apiKeyName', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Key Location
                  </label>
                  <select
                    value={auth.apiKeyLocation || 'header'}
                    onChange={(e) => updateField('apiKeyLocation', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                  >
                    <option value="header">HTTP Header</option>
                    <option value="query">Query Parameter</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Key Value / Secret
                </label>
                <div className="relative">
                  <input
                    type={showApiKeyVal ? 'text' : 'password'}
                    placeholder="sk_live_..."
                    value={auth.apiKeyValue || ''}
                    onChange={(e) => updateField('apiKeyValue', e.target.value)}
                    className="w-full pl-3 pr-10 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKeyVal(!showApiKeyVal)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    title={showApiKeyVal ? 'Hide value' : 'Show value'}
                  >
                    {showApiKeyVal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {auth.apiKeyName && auth.apiKeyValue && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Transmission Target:</span>
                  <div className="text-brand-600 dark:text-brand-400 truncate">
                    {auth.apiKeyLocation === 'query'
                      ? `URL Query: ?${auth.apiKeyName}=${auth.apiKeyValue.substring(0, 8)}...`
                      : `Header: ${auth.apiKeyName}: ${auth.apiKeyValue.substring(0, 8)}...`}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Security Notice */}
          <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Tokens are preserved in browser memory only and never logged to backend servers.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestAuthorization;
