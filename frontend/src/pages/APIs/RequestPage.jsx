import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import RequestBuilder from '../../components/api/request/RequestBuilder';
import collectionService from '../../services/collectionService';
import { FolderGit2, Send, ExternalLink, Sparkles } from 'lucide-react';

export const RequestPage = () => {
  const [searchParams] = useSearchParams();
  const endpointId = searchParams.get('endpointId');

  const [initialEndpoint, setInitialEndpoint] = useState(null);

  useEffect(() => {
    if (endpointId) {
      const ep = collectionService.getEndpointById(endpointId);
      if (ep) {
        setInitialEndpoint(ep);
      }
    }
  }, [endpointId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Request Builder"
        subtitle="Craft and parameterize REST API requests, manage headers, configure auth strategies, and inspect payloads"
        actions={
          <div className="flex items-center space-x-2.5">
            <Link
              to="/apis/collections"
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-white flex items-center space-x-2 transition-colors shadow-xs"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-brand-500" />
              <span>Collections</span>
            </Link>
            <Link
              to="/apis/endpoints"
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-white flex items-center space-x-2 transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5 text-cyan-500" />
              <span>Endpoints Catalog</span>
            </Link>
          </div>
        }
      />

      {/* Main Request Workspace */}
      <RequestBuilder
        initialEndpoint={initialEndpoint}
        onEndpointSaved={(saved) => {
          setInitialEndpoint(saved);
        }}
      />
    </div>
  );
};

export default RequestPage;
