/**
 * APIForge - Environment Management Service
 * 
 * Manages environments and variables with localStorage persistence.
 * Includes predefined sample environments (Development, Staging, Production),
 * CRUD operations, variable masking, duplicate key detection, and active selection.
 */

import { apiClient } from './apiService.js';

const STORAGE_KEYS = {
  ENVIRONMENTS: 'apiforge_environments',
  ACTIVE_ENV_ID: 'apiforge_active_env_id',
};

export const DEFAULT_ENVIRONMENTS = [];

/**
 * Detect duplicate keys in a variables array
 * @param {Array} variables 
 * @returns {string[]} Array of keys that appear more than once
 */
export const detectDuplicateKeys = (variables = []) => {
  const counts = {};
  const duplicates = new Set();
  variables.forEach((v) => {
    if (v && v.key) {
      const k = v.key.trim();
      counts[k] = (counts[k] || 0) + 1;
      if (counts[k] > 1) {
        duplicates.add(k);
      }
    }
  });
  return Array.from(duplicates);
};

export const environmentService = {
  /**
   * Retrieve all environments from localStorage or initialize with defaults
   */
  getEnvironments() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ENVIRONMENTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse environments from localStorage:', e);
    }
    this.saveEnvironments([]);
    return [];
  },

  /**
   * Save environments list to localStorage
   */
  saveEnvironments(envs) {
    try {
      localStorage.setItem(STORAGE_KEYS.ENVIRONMENTS, JSON.stringify(envs));
    } catch (e) {
      console.error('Failed to save environments to localStorage:', e);
    }
  },

  /**
   * Get currently active environment ID
   */
  getActiveEnvironmentId() {
    try {
      const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ENV_ID);
      if (activeId) return activeId;
    } catch (e) {
      console.warn('Error reading active environment id:', e);
    }
    return null;
  },

  /**
   * Get full object of currently active environment
   */
  getActiveEnvironment() {
    const envs = this.getEnvironments();
    const activeId = this.getActiveEnvironmentId();
    const found = envs.find((e) => e.id === activeId);
    if (found) return found;
    // Fallback to first available or default
    return envs[0] || null;
  },

  /**
   * Set active environment by ID
   */
  setActiveEnvironment(id) {
    const envs = this.getEnvironments();
    const target = envs.find((e) => e.id === id);
    if (!target) {
      throw new Error(`Environment with ID "${id}" not found`);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ENV_ID, id);
    } catch (e) {
      console.error('Error saving active environment id:', e);
    }

    // Backend sync
    apiClient.patch(`/environments/${id}/activate`).catch(() => {});

    return target;
  },

  /**
   * Get single environment by ID
   */
  getEnvironmentById(id) {
    const envs = this.getEnvironments();
    return envs.find((e) => e.id === id) || null;
  },

  /**
   * Create a new environment
   */
  createEnvironment(data) {
    const envs = this.getEnvironments();
    const now = new Date().toISOString();
    const newEnv = {
      id: `env-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: data.name?.trim() || 'New Environment',
      description: data.description?.trim() || '',
      baseUrl: data.baseUrl?.trim() || 'https://api.example.com',
      color: data.color || 'blue',
      isDefault: Boolean(data.isDefault),
      createdAt: now,
      updatedAt: now,
      variables: Array.isArray(data.variables)
        ? data.variables.map((v, idx) => ({
            id: v.id || `var-${Date.now()}-${idx}`,
            key: (v.key || '').trim(),
            value: v.value !== undefined ? v.value : '',
            isSecret: Boolean(v.isSecret || v.secret),
            enabled: v.enabled !== undefined ? v.enabled : true,
            description: v.description || '',
          }))
        : [],
    };

    envs.push(newEnv);
    this.saveEnvironments(envs);

    if (data.setAsActive) {
      this.setActiveEnvironment(newEnv.id);
    }

    // Backend sync
    apiClient.post('/environments', {
      name: newEnv.name,
      description: newEnv.description,
      baseUrl: newEnv.baseUrl,
      color: newEnv.color,
      isDefault: newEnv.isDefault,
      variables: newEnv.variables,
    }).catch(() => {});

    return newEnv;
  },

  /**
   * Update an existing environment
   */
  updateEnvironment(id, updates) {
    const envs = this.getEnvironments();
    const index = envs.findIndex((e) => e.id === id);
    if (index === -1) {
      throw new Error(`Environment with ID "${id}" not found`);
    }

    const current = envs[index];
    const updated = {
      ...current,
      ...updates,
      name: updates.name !== undefined ? updates.name.trim() : current.name,
      description: updates.description !== undefined ? updates.description.trim() : current.description,
      baseUrl: updates.baseUrl !== undefined ? updates.baseUrl.trim() : current.baseUrl,
      updatedAt: new Date().toISOString(),
    };

    envs[index] = updated;
    this.saveEnvironments(envs);

    if (updates.setAsActive) {
      this.setActiveEnvironment(id);
    }

    // Backend sync
    apiClient.put(`/environments/${id}`, updates).catch(() => {});

    return updated;
  },

  /**
   * Delete an environment
   * Automatically recovers gracefully if deleting active environment
   */
  deleteEnvironment(id) {
    let envs = this.getEnvironments();
    const toDelete = envs.find((e) => e.id === id);
    if (!toDelete) {
      throw new Error(`Environment with ID "${id}" not found`);
    }

    if (envs.length <= 1) {
      throw new Error('Cannot delete the only remaining environment. At least one environment must exist.');
    }

    const activeId = this.getActiveEnvironmentId();
    envs = envs.filter((e) => e.id !== id);
    this.saveEnvironments(envs);

    // Backend sync
    apiClient.delete(`/environments/${id}`).catch(() => {});

    // If active environment was deleted, reassign to first remaining
    if (activeId === id) {
      const nextActive = envs[0];
      this.setActiveEnvironment(nextActive.id);
      return { deleted: toDelete, nextActiveId: nextActive.id };
    }

    return { deleted: toDelete, nextActiveId: activeId };
  },

  /**
   * Duplicate an existing environment
   */
  duplicateEnvironment(id) {
    const envs = this.getEnvironments();
    const source = envs.find((e) => e.id === id);
    if (!source) {
      throw new Error(`Environment with ID "${id}" not found`);
    }

    const now = new Date().toISOString();
    const cloned = {
      ...source,
      id: `env-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: `${source.name} (Copy)`,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
      variables: source.variables.map((v, idx) => ({
        ...v,
        id: `var-${Date.now()}-${idx}`,
      })),
    };

    envs.push(cloned);
    this.saveEnvironments(envs);
    return cloned;
  },

  /**
   * Add a variable to an environment
   */
  addVariable(envId, variableData) {
    const envs = this.getEnvironments();
    const env = envs.find((e) => e.id === envId);
    if (!env) {
      throw new Error(`Environment with ID "${envId}" not found`);
    }

    const key = (variableData.key || '').trim();
    if (!key) {
      throw new Error('Variable key cannot be empty');
    }

    const newVar = {
      id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      key,
      value: variableData.value !== undefined ? variableData.value : '',
      isSecret: Boolean(variableData.isSecret || variableData.secret),
      enabled: variableData.enabled !== undefined ? variableData.enabled : true,
      description: variableData.description?.trim() || '',
    };

    env.variables = [...(env.variables || []), newVar];
    env.updatedAt = new Date().toISOString();

    this.saveEnvironments(envs);
    return newVar;
  },

  /**
   * Update a variable in an environment
   */
  updateVariable(envId, varId, updates) {
    const envs = this.getEnvironments();
    const env = envs.find((e) => e.id === envId);
    if (!env) {
      throw new Error(`Environment with ID "${envId}" not found`);
    }

    const varIndex = env.variables.findIndex((v) => v.id === varId);
    if (varIndex === -1) {
      throw new Error(`Variable with ID "${varId}" not found`);
    }

    const currentVar = env.variables[varIndex];
    const updatedVar = {
      ...currentVar,
      ...updates,
      key: updates.key !== undefined ? updates.key.trim() : currentVar.key,
      value: updates.value !== undefined ? updates.value : currentVar.value,
      isSecret: updates.isSecret !== undefined ? Boolean(updates.isSecret) : currentVar.isSecret,
      enabled: updates.enabled !== undefined ? Boolean(updates.enabled) : currentVar.enabled,
      description: updates.description !== undefined ? updates.description : currentVar.description,
    };

    env.variables[varIndex] = updatedVar;
    env.updatedAt = new Date().toISOString();

    this.saveEnvironments(envs);
    return updatedVar;
  },

  /**
   * Delete a variable from an environment
   */
  deleteVariable(envId, varId) {
    const envs = this.getEnvironments();
    const env = envs.find((e) => e.id === envId);
    if (!env) {
      throw new Error(`Environment with ID "${envId}" not found`);
    }

    env.variables = env.variables.filter((v) => v.id !== varId);
    env.updatedAt = new Date().toISOString();

    this.saveEnvironments(envs);
    return true;
  },

  /**
   * Reset environments to factory defaults
   */
  resetToDefaults() {
    this.saveEnvironments(DEFAULT_ENVIRONMENTS);
    if (DEFAULT_ENVIRONMENTS.length > 0) {
      this.setActiveEnvironment(DEFAULT_ENVIRONMENTS[0].id);
    } else {
      try {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_ENV_ID);
      } catch (e) {}
    }
    return DEFAULT_ENVIRONMENTS;
  },
};

export default environmentService;
