/**
 * APIForge - API Versioning Service
 * 
 * Manages version lifecycle CRUD operations, endpoint matrix comparisons,
 * and version-change history logs persisted in local storage.
 */

import { INITIAL_MOCK_VERSIONS } from '../data/mockVersions.js';
import { apiClient } from './apiService.js';

const STORAGE_KEYS = {
  VERSIONS: 'apiforge_api_versions',
};

export const versionService = {
  // Sync with backend MERN API
  async syncWithBackend() {
    try {
      const res = await apiClient.get('/versions').catch(() => null);
      if (res?.data?.data && Array.isArray(res.data.data)) {
        const backendVersions = res.data.data.map((v) => ({
          ...v,
          id: v.customId || v.id || v._id,
        }));
        this.saveVersions(backendVersions);
      }
    } catch (err) {
      console.warn('[versionService] Backend sync skipped/failed:', err?.message);
    }
  },

  /**
   * Retrieve all versions from localStorage or return empty array
   * @returns {Array}
   */
  getAllVersions() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VERSIONS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse versions from localStorage:', e);
    }
    this.saveVersions([]);
    return [];
  },

  /**
   * Save versions array to localStorage
   */
  saveVersions(versions) {
    try {
      localStorage.setItem(STORAGE_KEYS.VERSIONS, JSON.stringify(versions));
    } catch (e) {
      console.error('Failed to save versions to localStorage:', e);
    }
  },

  /**
   * Get single version by ID or versionNumber
   */
  getVersionById(idOrNumber) {
    const list = this.getAllVersions();
    return (
      list.find(
        (v) =>
          v.id === idOrNumber ||
          v.versionNumber.toLowerCase() === String(idOrNumber).toLowerCase()
      ) || null
    );
  },

  /**
   * Create a new version
   */
  createVersion({
    versionNumber,
    status = 'Draft',
    description = '',
    baseVersionId = null,
    endpoints = [],
    changelogNote = '',
  }) {
    const list = this.getAllVersions();

    // Check for duplicate version number
    const normalizedNumber = versionNumber.trim();
    if (list.some((v) => v.versionNumber.toLowerCase() === normalizedNumber.toLowerCase())) {
      throw new Error(`Version "${normalizedNumber}" already exists.`);
    }

    // If baseVersion is specified and no custom endpoints passed, copy from base
    let assignedEndpoints = [...endpoints];
    if (baseVersionId && assignedEndpoints.length === 0) {
      const base = list.find((v) => v.id === baseVersionId);
      if (base && Array.isArray(base.endpoints)) {
        assignedEndpoints = base.endpoints.map((ep) => ({
          ...ep,
          id: `ep_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        }));
      }
    }

    const now = new Date().toISOString();
    const newVersion = {
      id: `ver_${Date.now()}`,
      versionNumber: normalizedNumber,
      status, // 'Draft' | 'Active' | 'Deprecated' | 'Archived'
      isDefault: status === 'Active',
      description: description.trim(),
      createdDate: now,
      lastModified: now,
      releaseDate: status === 'Active' ? now.split('T')[0] : 'Unreleased',
      deprecationDate: status === 'Deprecated' ? now.split('T')[0] : null,
      sunsetDate: null,
      breakingChanges: false,
      endpoints: assignedEndpoints,
      changelog: [
        {
          id: `cl_${Date.now()}`,
          type: 'added',
          tag: 'Version Created',
          description: changelogNote.trim() || `Created version ${normalizedNumber} specification.`,
          date: now.split('T')[0],
          breaking: false,
        },
      ],
    };

    // If this version is marked Active, demote others
    if (status === 'Active') {
      list.forEach((v) => {
        if (v.isDefault) v.isDefault = false;
      });
    }

    const updated = [newVersion, ...list];
    this.saveVersions(updated);

    // Backend sync
    apiClient.post('/versions', newVersion).catch(() => {});

    return newVersion;
  },

  /**
   * Update an existing version
   */
  updateVersion(id, updates) {
    const list = this.getAllVersions();
    const index = list.findIndex((v) => v.id === id);
    if (index === -1) {
      throw new Error('Version not found.');
    }

    const current = list[index];

    // Check duplicate version number if changed
    if (
      updates.versionNumber &&
      updates.versionNumber.toLowerCase() !== current.versionNumber.toLowerCase()
    ) {
      const duplicate = list.some(
        (v) =>
          v.id !== id &&
          v.versionNumber.toLowerCase() === updates.versionNumber.toLowerCase()
      );
      if (duplicate) {
        throw new Error(`Version "${updates.versionNumber}" already exists.`);
      }
    }

    // Handle Active status promotion
    if (updates.status === 'Active' && current.status !== 'Active') {
      list.forEach((v) => {
        if (v.id !== id && v.isDefault) {
          v.isDefault = false;
        }
      });
    }

    const updatedVersion = {
      ...current,
      ...updates,
      lastModified: new Date().toISOString(),
    };

    // Append changelog entry if note provided
    if (updates.changelogNote && updates.changelogNote.trim()) {
      updatedVersion.changelog = [
        {
          id: `cl_${Date.now()}`,
          type: updates.changeType || 'changed',
          tag: updates.changeTag || 'Spec Modified',
          description: updates.changelogNote.trim(),
          date: new Date().toISOString().split('T')[0],
          breaking: Boolean(updates.isBreaking),
        },
        ...(current.changelog || []),
      ];
    }

    list[index] = updatedVersion;
    this.saveVersions(list);

    // Backend sync
    apiClient.put(`/versions/${id}`, updates).catch(() => {});

    return updatedVersion;
  },

  /**
   * Delete a version
   */
  deleteVersion(id) {
    const list = this.getAllVersions();
    const target = list.find((v) => v.id === id);
    if (!target) {
      throw new Error('Version not found.');
    }

    if (target.status === 'Active' || target.isDefault) {
      throw new Error('Cannot delete the currently Active version. Promote another version first.');
    }

    const filtered = list.filter((v) => v.id !== id);
    this.saveVersions(filtered);

    // Backend sync
    apiClient.delete(`/versions/${id}`).catch(() => {});

    return true;
  },

  /**
   * Set a version as Active
   */
  setActiveVersion(id) {
    const list = this.getAllVersions();
    const target = list.find((v) => v.id === id);
    if (!target) {
      throw new Error('Version not found.');
    }

    list.forEach((v) => {
      if (v.id === id) {
        v.status = 'Active';
        v.isDefault = true;
      } else if (v.status === 'Active' || v.isDefault) {
        v.status = 'Deprecated';
        v.isDefault = false;
        v.deprecationDate = new Date().toISOString().split('T')[0];
      }
    });

    this.saveVersions(list);

    // Backend sync
    apiClient.put(`/versions/${id}`, { status: 'Active', isDefault: true }).catch(() => {});

    return list;
  },

  /**
   * Compare two versions and generate a comprehensive unified endpoint diff
   * @param {string} versionAId
   * @param {string} versionBId
   */
  compareVersions(versionAId, versionBId) {
    const list = this.getAllVersions();
    const verA = list.find((v) => v.id === versionAId || v.versionNumber === versionAId) || list[0];
    const verB = list.find((v) => v.id === versionBId || v.versionNumber === versionBId) || list[1] || list[0];

    const endpointsA = verA?.endpoints || [];
    const endpointsB = verB?.endpoints || [];

    // Map by key: `${method} ${path}`
    const mapA = new Map();
    endpointsA.forEach((ep) => mapA.set(`${ep.method.toUpperCase()} ${ep.path}`, ep));

    const mapB = new Map();
    endpointsB.forEach((ep) => mapB.set(`${ep.method.toUpperCase()} ${ep.path}`, ep));

    // Union of all endpoint keys
    const allKeys = Array.from(new Set([...mapA.keys(), ...mapB.keys()])).sort();

    let addedCount = 0;
    let removedCount = 0;
    let modifiedCount = 0;
    let unchangedCount = 0;

    const endpointComparisons = allKeys.map((key) => {
      const epA = mapA.get(key) || null;
      const epB = mapB.get(key) || null;
      const [method, path] = key.split(' ');

      let diffType = 'unchanged';
      let description = '';

      if (epA && epB) {
        if (epA.description !== epB.description) {
          diffType = 'modified';
          description = `Schema / description updated in ${verB.versionNumber}`;
          modifiedCount++;
        } else {
          diffType = 'unchanged';
          description = 'Identical endpoint signature';
          unchangedCount++;
        }
      } else if (epA && !epB) {
        diffType = 'removed';
        description = `Deprecated & removed in ${verB.versionNumber}`;
        removedCount++;
      } else if (!epA && epB) {
        diffType = 'added';
        description = `Introduced in ${verB.versionNumber}`;
        addedCount++;
      }

      return {
        key,
        method,
        path,
        existsInA: Boolean(epA),
        existsInB: Boolean(epB),
        endpointA: epA,
        endpointB: epB,
        diffType, // 'added' | 'removed' | 'modified' | 'unchanged'
        description,
      };
    });

    return {
      versionA: verA,
      versionB: verB,
      endpoints: endpointComparisons,
      summary: {
        totalEndpointsA: endpointsA.length,
        totalEndpointsB: endpointsB.length,
        addedCount,
        removedCount,
        modifiedCount,
        unchangedCount,
        breakingChangesCount: removedCount + (verB.breakingChanges ? 1 : 0),
      },
    };
  },

  /**
   * Get aggregated global changelog history chronologically
   */
  getGlobalChangelog() {
    const list = this.getAllVersions();
    const allChanges = [];

    list.forEach((ver) => {
      (ver.changelog || []).forEach((cl) => {
        allChanges.push({
          ...cl,
          versionId: ver.id,
          versionNumber: ver.versionNumber,
          versionStatus: ver.status,
        });
      });
    });

    // Sort newest date first
    return allChanges.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  /**
   * Reset versions to initial seed dataset
   */
  resetToDefaults() {
    this.saveVersions(INITIAL_MOCK_VERSIONS);
    return INITIAL_MOCK_VERSIONS;
  },
};

// Initial background synchronization
if (typeof window !== 'undefined') {
  setTimeout(() => versionService.syncWithBackend(), 400);
}

export default versionService;
