import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, LayoutDashboard, Terminal, Search } from 'lucide-react';
import Button from '../../components/common/Button';

export const NotFoundPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-6 shadow-lg shadow-rose-500/5">
        <AlertCircle className="w-8 h-8" />
      </div>

      <div className="space-y-2 max-w-md">
        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          HTTP STATUS 404
        </span>
        <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100 pt-1">
          Route Not Found
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
          The requested interface route or API resource path does not exist on this APIForge instance.
        </p>
      </div>

      {/* Route Diagnostics Box */}
      <div className="w-full max-w-lg mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left font-mono text-xs">
        <div className="flex items-center space-x-2 text-slate-400 mb-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-[11px]">
          <Terminal className="w-3.5 h-3.5 text-brand-500" />
          <span>ROUTER DIAGNOSTICS</span>
        </div>
        <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
          <p>
            <span className="text-slate-400">Attempted Path:</span>{' '}
            <span className="text-rose-600 dark:text-rose-400 font-semibold">{location.pathname}</span>
          </p>
          <p>
            <span className="text-slate-400">Router State:</span>{' '}
            <span className="text-amber-600 dark:text-amber-400">UNMATCHED_ROUTE_EXCEPTION</span>
          </p>
        </div>
      </div>

      {/* Suggested Actions */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="outline"
          size="sm"
          leftIcon={ArrowLeft}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
        <Link to="/dashboard">
          <Button variant="primary" size="sm" leftIcon={LayoutDashboard}>
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Quick Links */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 max-w-md w-full">
        <p className="text-[11px] font-mono text-slate-400 mb-2">QUICK NAVIGATION TARGETS</p>
        <div className="flex flex-wrap justify-center gap-2 text-xs font-mono">
          <Link
            to="/apis/collections"
            className="text-brand-600 dark:text-brand-400 hover:underline px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            /apis/collections
          </Link>
          <Link
            to="/apis/endpoints"
            className="text-brand-600 dark:text-brand-400 hover:underline px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            /apis/endpoints
          </Link>
          <Link
            to="/mock-servers"
            className="text-brand-600 dark:text-brand-400 hover:underline px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            /mock-servers
          </Link>
          <Link
            to="/testing/suites"
            className="text-brand-600 dark:text-brand-400 hover:underline px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            /testing/suites
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
