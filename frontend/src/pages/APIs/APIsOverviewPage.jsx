import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import { MethodBadge, StatusBadge } from '../../components/common/Badge';
import { FolderGit2, Send, Plus, ExternalLink, ArrowRight, Layers, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import collectionService from '../../services/collectionService';

export const APIsOverviewPage = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [endpoints, setEndpoints] = useState([]);

  useEffect(() => {
    const cols = collectionService.getCollections();
    const eps = collectionService.getAllEndpoints();
    setCollections(cols);
    setEndpoints(eps);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="APIs & Endpoint Catalog"
        subtitle="Manage API collections, design REST endpoints, configure headers, and inspect schemas"
        actions={
          <div className="flex items-center space-x-3">
            <Link
              to="/apis/collections"
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-white flex items-center space-x-2 transition-colors"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-brand-500" />
              <span>Collections</span>
            </Link>
            <Link
              to="/apis/endpoints"
              className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 rounded-lg text-xs font-semibold text-white flex items-center space-x-2 shadow-md shadow-brand-600/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Explore Endpoints</span>
            </Link>
          </div>
        }
      />

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase font-mono">
              API Collections
            </span>
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-500">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-2">
            {collections.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organized service domains
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase font-mono">
              Total Endpoints
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-2">
            {endpoints.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Across 7 HTTP methods
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase font-mono">
              Schema Sync
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-2">
            100%
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            All routes validated & persistent
          </p>
        </div>
      </div>

      {/* Endpoints Quick Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
              Registered API Endpoints
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live REST endpoints available for testing and mock simulation
            </p>
          </div>
          <Link
            to="/apis/endpoints"
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1"
          >
            <span>Launch Tester</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Method</th>
                <th className="p-3">Endpoint Name</th>
                <th className="p-3">Path</th>
                <th className="p-3">Collection</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {endpoints.slice(0, 8).map((ep) => {
                const col = collections.find((c) => c.id === ep.collectionId);
                return (
                  <tr
                    key={ep.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3">
                      <MethodBadge method={ep.method} size="xs" />
                    </td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-slate-200">
                      {ep.name}
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">
                      {ep.path}
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">
                      {col?.name || ep.collectionId}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => navigate(`/apis/request?endpointId=${ep.id}`)}
                        className="text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                      >
                        Test &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default APIsOverviewPage;
