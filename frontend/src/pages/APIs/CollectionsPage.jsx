import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import { Badge, StatusBadge } from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import CollectionModal from '../../components/api/CollectionModal';
import { useToast } from '../../context/ToastContext';
import collectionService from '../../services/collectionService';
import {
  FolderGit2,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Copy,
  Check,
  Globe,
  Layers,
  Calendar,
  Clock,
  RotateCcw,
} from 'lucide-react';

export const CollectionsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [collections, setCollections] = useState([]);
  const [endpoints, setEndpoints] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [deletingCollection, setDeletingCollection] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = () => {
    try {
      const cols = collectionService.getCollections();
      const eps = collectionService.getAllEndpoints();
      setCollections(cols);
      setEndpoints(eps);
    } catch (err) {
      toast.error('Failed to load collections: ' + err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute endpoint count per collection
  const endpointCounts = useMemo(() => {
    const counts = {};
    endpoints.forEach((ep) => {
      counts[ep.collectionId] = (counts[ep.collectionId] || 0) + 1;
    });
    return counts;
  }, [endpoints]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set(collections.map((c) => c.category).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [collections]);

  // Filtered collections
  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.baseUrl && c.baseUrl.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.category && c.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'ALL' || c.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [collections, searchQuery, selectedCategory]);

  const handleCopyBaseUrl = (e, url, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.info('Base URL copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateCollection = async (formData) => {
    try {
      const created = collectionService.createCollection(formData);
      loadData();
      toast.success(`Collection "${created.name}" created successfully`);
      setIsCreateModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Error creating collection');
    }
  };

  const handleUpdateCollection = async (formData) => {
    if (!editingCollection) return;
    try {
      const updated = collectionService.updateCollection(editingCollection.id, formData);
      loadData();
      toast.success(`Collection "${updated.name}" updated successfully`);
      setEditingCollection(null);
    } catch (err) {
      toast.error(err.message || 'Error updating collection');
    }
  };

  const handleDeleteCollection = async () => {
    if (!deletingCollection) return;
    try {
      setIsDeleting(true);
      collectionService.deleteCollection(deletingCollection.id);
      loadData();
      toast.success(`Collection "${deletingCollection.name}" deleted`);
      setDeletingCollection(null);
    } catch (err) {
      toast.error(err.message || 'Error deleting collection');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetDefaults = () => {
    collectionService.resetToDefaults();
    loadData();
    toast.info('Reset collections and endpoints to default templates');
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Collections"
        subtitle="Group API endpoints into logical service domains, manage base URLs, and version tagging"
        actions={
          <div className="flex items-center space-x-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Collection
            </Button>
          </div>
        }
      />

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search collections by name, base URL, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold border border-brand-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Collection Counter Banner */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Showing</span>
          <Badge variant="primary" size="sm">
            {filteredCollections.length} of {collections.length} Collections
          </Badge>
        </div>
      </div>

      {/* Collections Grid */}
      {filteredCollections.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredCollections.map((col) => {
            const epCount = endpointCounts[col.id] || 0;
            return (
              <div
                key={col.id}
                onClick={() => navigate(`/apis/collections/${col.id}`)}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-brand-500/50 dark:hover:border-brand-500/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start space-x-3">
                      <div className="p-2.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 group-hover:scale-105 transition-transform shrink-0">
                        <FolderGit2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                            {col.name}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {col.category || 'General'}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {col.version || 'v1.0.0'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <StatusBadge status={col.status || 'active'} />
                      <button
                        onClick={() => setEditingCollection(col)}
                        title="Edit Collection"
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingCollection(col)}
                        title="Delete Collection"
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {col.description || 'No description provided for this collection.'}
                  </p>

                  {/* Base URL Pill */}
                  <div
                    onClick={(e) => handleCopyBaseUrl(e, col.baseUrl, col.id)}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-mono text-xs mb-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    title="Click to copy Base URL"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{col.baseUrl || 'https://api.apiforge.dev'}</span>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0 ml-2">
                      {copiedId === col.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Footer Info */}
                <div>
                  <div className="grid grid-cols-3 gap-2 py-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <div className="flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                      <span>
                        <strong className="text-slate-800 dark:text-slate-200">{epCount}</strong> endpoints
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Created {formatDate(col.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Updated {formatDate(col.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">ID: {col.id}</span>
                    <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 flex items-center space-x-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Explore Endpoints</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={FolderGit2}
          title={searchQuery ? 'No Matching Collections' : 'No API Collections Found'}
          description={
            searchQuery
              ? `No collections matched "${searchQuery}". Clear your search query or reset filters.`
              : 'Create your first API collection to organize endpoints, manage base URLs, and set up mock routes.'
          }
          actionText={searchQuery ? 'Clear Filters' : 'Create Collection'}
          onAction={
            searchQuery
              ? () => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                }
              : () => setIsCreateModalOpen(true)
          }
        />
      )}

      {/* Create Modal */}
      <CollectionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCollection}
        isEditing={false}
      />

      {/* Edit Modal */}
      <CollectionModal
        isOpen={Boolean(editingCollection)}
        onClose={() => setEditingCollection(null)}
        onSubmit={handleUpdateCollection}
        initialData={editingCollection}
        isEditing={true}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingCollection)}
        onClose={() => setDeletingCollection(null)}
        onConfirm={handleDeleteCollection}
        title="Delete Collection?"
        message={`Are you sure you want to delete "${deletingCollection?.name}"? This action will cascade and remove all endpoints grouped under this collection.`}
        confirmText="Delete Collection"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default CollectionsPage;
