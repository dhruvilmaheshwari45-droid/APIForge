import axios from 'axios';
import { apiClient } from './apiService.js';

const STORAGE_KEYS = {
  COLLECTIONS: 'apiforge_collections',
  ENDPOINTS: 'apiforge_endpoints',
};

// Clean slate default collections (sample data removed)
export const DEFAULT_COLLECTIONS = [];

// Clean slate default endpoints (sample data removed)
export const DEFAULT_ENDPOINTS = [];

// Helper to safely read from localStorage
const getStoredItems = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[collectionService] Failed reading ${key} from localStorage, using fallback:`, err);
    return fallback;
  }
};

// Helper to safely write to localStorage
const setStoredItems = (key, items) => {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    console.error(`[collectionService] Failed saving ${key} to localStorage:`, err);
  }
};

// Generate MongoDB-like object ID
export const generateId = (prefix = 'id') => {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
};

export const collectionService = {
  // ==========================================
  // COLLECTION OPERATIONS
  // ==========================================

  getCollections() {
    const collections = getStoredItems(STORAGE_KEYS.COLLECTIONS, DEFAULT_COLLECTIONS);
    const endpoints = getStoredItems(STORAGE_KEYS.ENDPOINTS, DEFAULT_ENDPOINTS);

    // Compute live endpointsCount for each collection
    return collections.map((col) => {
      const count = endpoints.filter((ep) => ep.collectionId === col.id).length;
      return { ...col, endpointsCount: count };
    });
  },

  getCollectionById(id) {
    const collections = this.getCollections();
    const collection = collections.find((c) => c.id === id);
    if (!collection) return null;

    const endpoints = this.getEndpointsByCollection(id);
    return { ...collection, endpoints };
  },

  createCollection(data) {
    if (!data.name || !data.name.trim()) {
      throw new Error('Collection name is required.');
    }

    const collections = getStoredItems(STORAGE_KEYS.COLLECTIONS, DEFAULT_COLLECTIONS);
    const newCollection = {
      id: generateId('col'),
      name: data.name.trim(),
      description: data.description ? data.description.trim() : '',
      baseUrl: data.baseUrl ? data.baseUrl.trim() : 'https://api.apiforge.dev/v1',
      category: data.category || 'General Services',
      version: data.version || 'v1.0.0',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      endpointsCount: 0,
    };

    const updated = [newCollection, ...collections];
    setStoredItems(STORAGE_KEYS.COLLECTIONS, updated);

    // Sync with backend API
    apiClient.post('/collections', {
      name: newCollection.name,
      description: newCollection.description,
      baseUrl: newCollection.baseUrl,
      category: newCollection.category,
      version: newCollection.version,
    }).then((res) => {
      if (res.data?.data?.id) {
        newCollection.backendId = res.data.data.id;
      }
    }).catch((e) => console.warn('Backend collection creation sync failed:', e.message));

    return newCollection;
  },

  updateCollection(id, updates) {
    if (updates.name !== undefined && !updates.name.trim()) {
      throw new Error('Collection name cannot be empty.');
    }

    const collections = getStoredItems(STORAGE_KEYS.COLLECTIONS, DEFAULT_COLLECTIONS);
    const index = collections.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Collection with ID "${id}" was not found.`);
    }

    const updatedCol = {
      ...collections[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    collections[index] = updatedCol;
    setStoredItems(STORAGE_KEYS.COLLECTIONS, collections);

    // Sync with backend API
    apiClient.put(`/collections/${id}`, updates).catch((e) =>
      console.warn('Backend collection update sync failed:', e.message)
    );

    return updatedCol;
  },

  deleteCollection(id) {
    const collections = getStoredItems(STORAGE_KEYS.COLLECTIONS, DEFAULT_COLLECTIONS);
    const filteredCollections = collections.filter((c) => c.id !== id);
    setStoredItems(STORAGE_KEYS.COLLECTIONS, filteredCollections);

    // Cascade delete associated endpoints
    const endpoints = getStoredItems(STORAGE_KEYS.ENDPOINTS, DEFAULT_ENDPOINTS);
    const filteredEndpoints = endpoints.filter((ep) => ep.collectionId !== id);
    setStoredItems(STORAGE_KEYS.ENDPOINTS, filteredEndpoints);

    // Sync with backend API
    apiClient.delete(`/collections/${id}`).catch((e) =>
      console.warn('Backend collection deletion sync failed:', e.message)
    );

    return true;
  },

  // ==========================================
  // ENDPOINT OPERATIONS
  // ==========================================

  getAllEndpoints() {
    return getStoredItems(STORAGE_KEYS.ENDPOINTS, DEFAULT_ENDPOINTS);
  },

  getEndpointsByCollection(collectionId) {
    const endpoints = this.getAllEndpoints();
    return endpoints.filter((ep) => ep.collectionId === collectionId);
  },

  getEndpointById(id) {
    const endpoints = this.getAllEndpoints();
    return endpoints.find((ep) => ep.id === id) || null;
  },

  createEndpoint(data) {
    if (!data.name || !data.name.trim()) {
      throw new Error('Endpoint name is required.');
    }
    if (!data.path || !data.path.trim()) {
      throw new Error('Endpoint path is required.');
    }
    if (!data.collectionId) {
      throw new Error('Target collection must be selected.');
    }

    const endpoints = getStoredItems(STORAGE_KEYS.ENDPOINTS, DEFAULT_ENDPOINTS);

    // Format path with leading slash
    let cleanPath = data.path.trim();
    if (!cleanPath.startsWith('/')) {
      cleanPath = `/${cleanPath}`;
    }

    const newEndpoint = {
      id: generateId('ep'),
      collectionId: data.collectionId,
      name: data.name.trim(),
      method: (data.method || 'GET').toUpperCase(),
      path: cleanPath,
      description: data.description ? data.description.trim() : '',
      headers: Array.isArray(data.headers) ? data.headers : [],
      queryParams: Array.isArray(data.queryParams) ? data.queryParams : [],
      requestBody: data.requestBody || '',
      responseExample: data.responseExample || {
        status: 200,
        body: { message: 'Sample response OK' },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newEndpoint, ...endpoints];
    setStoredItems(STORAGE_KEYS.ENDPOINTS, updated);

    // Sync with backend API
    apiClient.post('/apis', {
      collectionId: newEndpoint.collectionId,
      name: newEndpoint.name,
      method: newEndpoint.method,
      path: newEndpoint.path,
      description: newEndpoint.description,
      headers: newEndpoint.headers,
      queryParams: newEndpoint.queryParams,
      requestBody: newEndpoint.requestBody,
      responseExample: newEndpoint.responseExample,
    }).catch((e) => console.warn('Backend endpoint creation sync failed:', e.message));

    return newEndpoint;
  },

  updateEndpoint(id, updates) {
    const endpoints = getStoredItems(STORAGE_KEYS.ENDPOINTS, DEFAULT_ENDPOINTS);
    const index = endpoints.findIndex((ep) => ep.id === id);
    if (index === -1) {
      throw new Error(`Endpoint with ID "${id}" was not found.`);
    }

    if (updates.name !== undefined && !updates.name.trim()) {
      throw new Error('Endpoint name cannot be empty.');
    }
    if (updates.path !== undefined && !updates.path.trim()) {
      throw new Error('Endpoint path cannot be empty.');
    }

    let cleanPath = updates.path;
    if (cleanPath && !cleanPath.startsWith('/')) {
      cleanPath = `/${cleanPath}`;
    }

    const updatedEp = {
      ...endpoints[index],
      ...updates,
      ...(cleanPath ? { path: cleanPath } : {}),
      ...(updates.method ? { method: updates.method.toUpperCase() } : {}),
      updatedAt: new Date().toISOString(),
    };

    endpoints[index] = updatedEp;
    setStoredItems(STORAGE_KEYS.ENDPOINTS, endpoints);

    // Sync with backend API
    apiClient.put(`/apis/${id}`, updates).catch((e) =>
      console.warn('Backend endpoint update sync failed:', e.message)
    );

    return updatedEp;
  },

  deleteEndpoint(id) {
    const endpoints = getStoredItems(STORAGE_KEYS.ENDPOINTS, DEFAULT_ENDPOINTS);
    const filtered = endpoints.filter((ep) => ep.id !== id);
    setStoredItems(STORAGE_KEYS.ENDPOINTS, filtered);

    // Sync with backend API
    apiClient.delete(`/apis/${id}`).catch((e) =>
      console.warn('Backend endpoint deletion sync failed:', e.message)
    );

    return true;
  },

  // Hydrate local cache from backend MongoDB database
  syncWithBackend() {
    apiClient.get('/collections')
      .then((res) => {
        if (res.data?.data && Array.isArray(res.data.data)) {
          setStoredItems(STORAGE_KEYS.COLLECTIONS, res.data.data);
        }
      })
      .catch(() => {});

    apiClient.get('/apis')
      .then((res) => {
        if (res.data?.data && Array.isArray(res.data.data)) {
          setStoredItems(STORAGE_KEYS.ENDPOINTS, res.data.data);
        }
      })
      .catch(() => {});
  },

  // ==========================================
  // REQUEST EXECUTION (LIVE & MOCK)
  // ==========================================

  async executeRequest({ url, method = 'GET', headers = {}, params = {}, data = null, fallbackResponse }) {
    const startTime = performance.now();
    try {
      const response = await axios({
        url,
        method,
        headers,
        params,
        data: data || undefined,
        timeout: 8000,
      });
      const endTime = performance.now();
      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        responseTimeMs: Math.round(endTime - startTime),
        isMockFallback: false,
      };
    } catch (err) {
      const endTime = performance.now();

      // If network fails (e.g. CORS or offline mock domain), provide clean mock fallback
      if (fallbackResponse) {
        return {
          status: fallbackResponse.status || 200,
          statusText: 'OK (Simulated Mock Response)',
          headers: {
            'content-type': 'application/json',
            'x-powered-by': 'APIForge-MockEngine',
            'x-response-time': `${Math.round(endTime - startTime)}ms`,
          },
          data: fallbackResponse.body || fallbackResponse,
          responseTimeMs: Math.round(endTime - startTime) || 45,
          isMockFallback: true,
        };
      }

      return {
        status: err.response?.status || 500,
        statusText: err.response?.statusText || 'Execution Error',
        headers: err.response?.headers || {},
        data: err.response?.data || { error: err.message },
        responseTimeMs: Math.round(endTime - startTime),
        isMockFallback: false,
      };
    }
  },

  // Reset to default sample collections if desired
  resetToDefaults() {
    setStoredItems(STORAGE_KEYS.COLLECTIONS, DEFAULT_COLLECTIONS);
    setStoredItems(STORAGE_KEYS.ENDPOINTS, DEFAULT_ENDPOINTS);
    return { collections: DEFAULT_COLLECTIONS, endpoints: DEFAULT_ENDPOINTS };
  },
};

// Initial backend sync
try {
  collectionService.syncWithBackend();
} catch {}

export default collectionService;
