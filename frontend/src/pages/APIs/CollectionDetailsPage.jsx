import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { Badge, MethodBadge, StatusBadge } from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import CollectionModal from '../../components/api/CollectionModal';
import EndpointModal from '../../components/api/EndpointModal';
import { useToast } from '../../context/ToastContext';
import collectionService from '../../services/collectionService';
import { HTTP_METHODS } from '../../utils/constants';
import {
  FolderGit2,
  ChevronLeft,
  Plus,
  Search,
  Globe,
  Copy,
  Check,
  Edit2,
  Trash2,
  Play,
  Layers,
  FileCode2,
  Calendar,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

const ALL_METHODS = ['ALL', ...Object.keys(HTTP_METHODS)];

export const CollectionDetailsPage = () => {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [collection, setCollection] = useState(null);
  const [allCollections, setAllCollections] = useState([]);
  const [endpoints, setEndpoints] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Modals state
  const [isEditCollectionOpen, setIsEditCollectionOpen] = useState(false);
  const [isDeleteCollectionOpen, setIsDeleteCollectionOpen] = useState(false);
  const [isDeletingCollection, setIsDeletingCollection] = useState(false);

  const [isEndpointModalOpen, setIsEndpointModalOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState(null);
  const [deletingEndpoint, setDeletingEndpoint] = useState(null);
  const [isDeletingEndpoint, setIsDeletingEndpoint] = useState(false);

  const loadData = () => {
    try {
      const col = collectionService.getCollectionById(collectionId);
      const cols = collectionService.getCollections();
      const eps = collectionService.getEndpointsByCollection(collectionId);
      setCollection(col);
      setAllCollections(cols);
      setEndpoints(eps);
    } catch (err) {
      toast.error('Failed to load collection details: ' + err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [collectionId]);

  const handleCopyBaseUrl = () => {
    if (!collection?.baseUrl) return;
    navigator.clipboard.writeText(collection.baseUrl);
    setCopiedUrl(true);
    toast.info('Base URL copied to clipboard');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Collection CRUD handlers
  const handleUpdateCollection = async (formData) => {
    try {
      const updated = collectionService.updateCollection(collectionId, formData);
      setCollection(updated);
      toast.success('Collection updated successfully');
      setIsEditCollectionOpen(false);
    } catch (err) {
      toast.error(err.message || 'Error updating collection');
    }
  };

  const handleDeleteCollection = async () => {
    try {
      setIsDeletingCollection(true);
      collectionService.deleteCollection(collectionId);
      toast.success(`Collection "${collection?.name}" deleted`);
      navigate('/apis/collections');
    } catch (err) {
      toast.error(err.message || 'Error deleting collection');
    } finally {
      setIsDeletingCollection(false);
      setIsDeleteCollectionOpen(false);
    }
  };

  // Endpoint CRUD handlers
  const handleSaveEndpoint = async (formData) => {
    try {
      if (editingEndpoint) {
        collectionService.updateEndpoint(editingEndpoint.id, formData);
        toast.success(`Endpoint "${formData.name}" updated`);
      } else {
        collectionService.createEndpoint({
          ...formData,
          collectionId,
        });
        toast.success(`Endpoint "${formData.name}" created`);
      }
      loadData();
      setIsEndpointModalOpen(false);
      setEditingEndpoint(null);
    } catch (err) {
      toast.error(err.message || 'Error saving endpoint');
    }
  };

  const handleDeleteEndpoint = async () => {
    if (!deletingEndpoint) return;
    try {
      setIsDeletingEndpoint(true);
      collectionService.deleteEndpoint(deletingEndpoint.id);
      loadData();
      toast.success(`Endpoint "${deletingEndpoint.name}" deleted`);
      setDeletingEndpoint(null);
    } catch (err) {
      toast.error(err.message || 'Error deleting endpoint');
    } finally {
      setIsDeletingEndpoint(false);
    }
  };

  // Filtered endpoints
  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((ep) => {
      const matchesSearch =
        ep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ep.description && ep.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesMethod =
        selectedMethod === 'ALL' || ep.method.toUpperCase() === selectedMethod.toUpperCase();

      return matchesSearch && matchesMethod;
    });
  }, [endpoints, searchQuery, selectedMethod]);

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      return new Date(isoStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return 'N/A';
    }
  };

  if (!collection) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/apis/collections')}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Back to Collections
          </Button>
        </div>
        <EmptyState
          icon={FolderGit2}
          title="Collection Not Found"
          description={`The collection with ID "${collectionId}" does not exist or has been deleted.`}
          actionText="Go to Collections"
          onAction={() => navigate('/apis/collections')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
          <Link
            to="/apis/collections"
            className="hover:text-slate-900 dark:hover:text-slate-200 flex items-center space-x-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Collections</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {collection.name}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditCollectionOpen(true)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit Collection
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDeleteCollectionOpen(true)}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Collection Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-3 flex-wrap gap-y-2">
              <div className="p-2.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                <FolderGit2 className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {collection.name}
              </h1>
              <StatusBadge status={collection.status || 'active'} />
              <Badge variant="neutral" size="sm">
                {collection.category || 'Core'}
              </Badge>
              <Badge variant="primary" size="sm">
                {collection.version || 'v1.0.0'}
              </Badge>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              {collection.description || 'No description configured for this collection.'}
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEditingEndpoint(null);
              setIsEndpointModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Endpoint
          </Button>
        </div>

        {/* Base URL and Metadata Strip */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div
            onClick={handleCopyBaseUrl}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-300 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors shrink-0"
            title="Click to copy base URL"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-500 dark:text-slate-400">Base URL:</span>
            <span>{collection.baseUrl}</span>
            {copiedUrl ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 ml-1" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400 ml-1" />
            )}
          </div>

          <div className="flex items-center space-x-4 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span className="flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-brand-500" />
              <span>{endpoints.length} Total Endpoints</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Created {formatDate(collection.createdAt)}</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Updated {formatDate(collection.updatedAt)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Endpoints Management Section */}
      <div className="space-y-4">
        {/* Filter / Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search endpoints by path, name, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* HTTP Method Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
            {ALL_METHODS.map((method) => (
              <button
                key={method}
                onClick={() => setSelectedMethod(method)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg transition-colors shrink-0 ${
                  selectedMethod === method
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold border border-brand-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Endpoints List */}
        {filteredEndpoints.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
            {filteredEndpoints.map((ep) => (
              <div
                key={ep.id}
                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="flex items-start md:items-center space-x-3.5">
                  <MethodBadge method={ep.method} size="sm" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {ep.path}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {ep.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {ep.description && (
                        <span className="line-clamp-1 max-w-md">{ep.description}</span>
                      )}
                      {ep.headers && ep.headers.length > 0 && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {ep.headers.length} headers
                        </span>
                      )}
                      {ep.queryParams && ep.queryParams.length > 0 && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {ep.queryParams.length} params
                        </span>
                      )}
                      {ep.requestBody && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                          Body: JSON
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Endpoint Actions */}
                <div className="flex items-center space-x-2 self-end md:self-center shrink-0">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => navigate(`/apis/request?endpointId=${ep.id}`)}
                    leftIcon={<Play className="w-3 h-3 text-emerald-500" />}
                  >
                    Test Request
                  </Button>
                  <button
                    onClick={() => {
                      setEditingEndpoint(ep);
                      setIsEndpointModalOpen(true);
                    }}
                    title="Edit Endpoint"
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingEndpoint(ep)}
                    title="Delete Endpoint"
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileCode2}
            title={searchQuery ? 'No Matching Endpoints' : 'No Endpoints in this Collection'}
            description={
              searchQuery
                ? `No endpoints matched "${searchQuery}". Clear your search query or reset method filter.`
                : 'Define your first API route, HTTP method, and parameters in this collection.'
            }
            actionText={searchQuery ? 'Clear Filters' : 'Add First Endpoint'}
            onAction={
              searchQuery
                ? () => {
                    setSearchQuery('');
                    setSelectedMethod('ALL');
                  }
                : () => {
                    setEditingEndpoint(null);
                    setIsEndpointModalOpen(true);
                  }
            }
          />
        )}
      </div>

      {/* Edit Collection Modal */}
      <CollectionModal
        isOpen={isEditCollectionOpen}
        onClose={() => setIsEditCollectionOpen(false)}
        onSubmit={handleUpdateCollection}
        initialData={collection}
        isEditing={true}
      />

      {/* Delete Collection Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteCollectionOpen}
        onClose={() => setIsDeleteCollectionOpen(false)}
        onConfirm={handleDeleteCollection}
        title="Delete Collection?"
        message={`Are you sure you want to delete "${collection.name}"? This action will cascade and permanently remove all ${endpoints.length} endpoints inside.`}
        confirmText="Delete Collection"
        variant="danger"
        loading={isDeletingCollection}
      />

      {/* Endpoint Modal (Create / Edit) */}
      <EndpointModal
        isOpen={isEndpointModalOpen}
        onClose={() => {
          setIsEndpointModalOpen(false);
          setEditingEndpoint(null);
        }}
        onSubmit={handleSaveEndpoint}
        initialData={editingEndpoint}
        isEditing={Boolean(editingEndpoint)}
        collections={allCollections}
        defaultCollectionId={collectionId}
      />

      {/* Endpoint Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingEndpoint)}
        onClose={() => setDeletingEndpoint(null)}
        onConfirm={handleDeleteEndpoint}
        title="Delete Endpoint?"
        message={`Are you sure you want to delete "${deletingEndpoint?.name}" (${deletingEndpoint?.method} ${deletingEndpoint?.path})?`}
        confirmText="Delete Endpoint"
        variant="danger"
        loading={isDeletingEndpoint}
      />
    </div>
  );
};

export default CollectionDetailsPage;
