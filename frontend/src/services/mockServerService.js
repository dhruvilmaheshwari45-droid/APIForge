import { apiClient } from './apiService.js';

const STORAGE_KEYS = {
  SERVERS: 'apiforge_mock_servers',
  ENDPOINTS: 'apiforge_mock_endpoints',
  RULES: 'apiforge_mock_rules',
};

export const DEFAULT_MOCK_SERVERS = [];
export const DEFAULT_MOCK_ENDPOINTS = [];
export const DEFAULT_MOCK_RULES = [];

const getStored = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
};

const setStored = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Failed to write to localStorage for key ${key}:`, e);
  }
};

const generateId = (prefix = 'mrule') => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
};

/**
 * Generate a human-readable English summary describing the rule's conditions and outcome
 */
export const generateRuleSummary = (rule) => {
  if (!rule || !rule.conditions || rule.conditions.length === 0) {
    return `Always return HTTP ${rule?.response?.status || 200} (No conditions)`;
  }

  const operatorMap = {
    equals: 'equals',
    not_equals: 'does not equal',
    contains: 'contains',
    exists: 'exists',
    not_exists: 'does not exist',
  };

  const conditionPhrases = rule.conditions.map((c) => {
    const op = operatorMap[c.operator] || c.operator;
    switch (c.type) {
      case 'method':
        return `Method ${op} "${c.value || 'GET'}"`;
      case 'path':
        return `Path ${op} "${c.value || '/'}"`;
      case 'query_param':
        return c.operator === 'exists' || c.operator === 'not_exists'
          ? `Query param "${c.field}" ${op}`
          : `Query param "${c.field}" ${op} "${c.value}"`;
      case 'header':
        return c.operator === 'exists' || c.operator === 'not_exists'
          ? `Header "${c.field}" ${op}`
          : `Header "${c.field}" ${op} "${c.value}"`;
      case 'auth_presence':
        return c.operator === 'not_exists' ? 'Authorization does not exist' : 'Authorization exists';
      case 'body_field':
        return c.operator === 'exists' || c.operator === 'not_exists'
          ? `Body field "${c.field}" ${op}`
          : `Body field "${c.field}" ${op} "${c.value}"`;
      default:
        return `${c.type} "${c.field}" ${op} "${c.value}"`;
    }
  });

  const glue = ` ${rule.matchLogic || 'AND'} `;
  const ifPart = `IF ${conditionPhrases.join(glue)}`;
  const delayStr = rule.response?.delay ? ` after ${rule.response.delay}ms` : '';
  const thenPart = `THEN return HTTP ${rule.response?.status || 200}${delayStr}`;

  return `${ifPart} ➔ ${thenPart}`;
};

export const mockServerService = {
  // Sync state with backend MERN API
  async syncWithBackend() {
    try {
      const [serversRes, rulesRes] = await Promise.all([
        apiClient.get('/mock-servers').catch(() => null),
        apiClient.get('/mock-rules').catch(() => null),
      ]);
      if (serversRes?.data?.data && Array.isArray(serversRes.data.data)) {
        const backendServers = serversRes.data.data.map((s) => ({
          ...s,
          id: s.customId || s.id || s._id,
        }));
        setStored(STORAGE_KEYS.SERVERS, backendServers);
      }
      if (rulesRes?.data?.data && Array.isArray(rulesRes.data.data)) {
        const backendRules = rulesRes.data.data.map((r) => ({
          ...r,
          id: r.customId || r.id || r._id,
        }));
        setStored(STORAGE_KEYS.RULES, backendRules);
      }
    } catch (err) {
      console.warn('[mockServerService] Sync with backend skipped/failed:', err?.message);
    }
  },

  // ==========================================
  // MOCK SERVERS
  // ==========================================

  getServers() {
    return getStored(STORAGE_KEYS.SERVERS, DEFAULT_MOCK_SERVERS);
  },

  getServerById(id) {
    const servers = this.getServers();
    return servers.find((s) => s.id === id) || null;
  },

  createServer(data) {
    if (!data.name || !data.name.trim()) {
      throw new Error('Mock server name is required');
    }

    const servers = this.getServers();
    const newServer = {
      id: generateId('msrv'),
      name: data.name.trim(),
      description: data.description ? data.description.trim() : '',
      baseUrl: data.baseUrl?.trim() || `https://mock.apiforge.dev/v1/${data.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      status: data.status || 'active',
      environment: data.environment || 'Development',
      port: parseInt(data.port, 10) || 8080,
      defaultLatencyMs: parseInt(data.defaultLatencyMs, 10) || 50,
      isSimulated: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newServer, ...servers];
    setStored(STORAGE_KEYS.SERVERS, updated);

    // Backend sync
    apiClient.post('/mock-servers', newServer).catch(() => {});

    return newServer;
  },

  updateServer(id, updates) {
    const servers = this.getServers();
    const index = servers.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Mock server "${id}" not found.`);
    }

    if (updates.name !== undefined && !updates.name.trim()) {
      throw new Error('Server name cannot be empty');
    }

    const updatedServer = {
      ...servers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    servers[index] = updatedServer;
    setStored(STORAGE_KEYS.SERVERS, servers);

    // Backend sync
    apiClient.put(`/mock-servers/${id}`, updates).catch(() => {});

    return updatedServer;
  },

  toggleServerStatus(id) {
    const server = this.getServerById(id);
    if (!server) return null;
    const nextStatus = server.status === 'active' ? 'paused' : 'active';

    // Backend sync
    apiClient.patch(`/mock-servers/${id}/toggle`).catch(() => {});

    return this.updateServer(id, { status: nextStatus });
  },

  deleteServer(id) {
    const servers = this.getServers();
    const filteredServers = servers.filter((s) => s.id !== id);
    setStored(STORAGE_KEYS.SERVERS, filteredServers);

    // Cascade delete associated mock endpoints
    const endpoints = this.getAllEndpoints();
    const filteredEndpoints = endpoints.filter((ep) => ep.serverId !== id);
    setStored(STORAGE_KEYS.ENDPOINTS, filteredEndpoints);

    // Cascade delete associated rules
    const rules = this.getAllRules();
    const filteredRules = rules.filter((r) => r.serverId !== id);
    setStored(STORAGE_KEYS.RULES, filteredRules);

    // Backend sync
    apiClient.delete(`/mock-servers/${id}`).catch(() => {});

    return true;
  },

  // ==========================================
  // MOCK ENDPOINTS
  // ==========================================

  getAllEndpoints() {
    return getStored(STORAGE_KEYS.ENDPOINTS, DEFAULT_MOCK_ENDPOINTS);
  },

  getEndpointsByServer(serverId) {
    const endpoints = this.getAllEndpoints();
    return endpoints.filter((ep) => ep.serverId === serverId);
  },

  getEndpointById(id) {
    const endpoints = this.getAllEndpoints();
    return endpoints.find((ep) => ep.id === id) || null;
  },

  createEndpoint(data) {
    if (!data.name || !data.name.trim()) {
      throw new Error('Endpoint name is required');
    }
    if (!data.path || !data.path.trim()) {
      throw new Error('Endpoint path is required');
    }
    if (!data.serverId) {
      throw new Error('Target mock server ID is required');
    }

    let cleanPath = data.path.trim();
    if (!cleanPath.startsWith('/')) {
      cleanPath = `/${cleanPath}`;
    }

    const endpoints = this.getAllEndpoints();
    const newEndpoint = {
      id: generateId('mep'),
      serverId: data.serverId,
      name: data.name.trim(),
      method: (data.method || 'GET').toUpperCase(),
      path: cleanPath,
      description: data.description ? data.description.trim() : '',
      responseStatus: parseInt(data.responseStatus, 10) || 200,
      responseDelay: parseInt(data.responseDelay, 10) || 0,
      responseHeaders: Array.isArray(data.responseHeaders) ? data.responseHeaders : [],
      responseBodyType: data.responseBodyType || 'json',
      responseBody: data.responseBody || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newEndpoint, ...endpoints];
    setStored(STORAGE_KEYS.ENDPOINTS, updated);
    return newEndpoint;
  },

  updateEndpoint(id, updates) {
    const endpoints = this.getAllEndpoints();
    const index = endpoints.findIndex((ep) => ep.id === id);
    if (index === -1) {
      throw new Error(`Mock endpoint "${id}" not found.`);
    }

    if (updates.name !== undefined && !updates.name.trim()) {
      throw new Error('Endpoint name cannot be empty');
    }
    if (updates.path !== undefined && !updates.path.trim()) {
      throw new Error('Endpoint path cannot be empty');
    }

    let cleanPath = updates.path;
    if (cleanPath && !cleanPath.startsWith('/')) {
      cleanPath = `/${cleanPath}`;
    }

    const updatedEndpoint = {
      ...endpoints[index],
      ...updates,
      ...(cleanPath ? { path: cleanPath } : {}),
      ...(updates.method ? { method: updates.method.toUpperCase() } : {}),
      ...(updates.responseStatus !== undefined ? { responseStatus: parseInt(updates.responseStatus, 10) } : {}),
      ...(updates.responseDelay !== undefined ? { responseDelay: parseInt(updates.responseDelay, 10) } : {}),
      updatedAt: new Date().toISOString(),
    };

    endpoints[index] = updatedEndpoint;
    setStored(STORAGE_KEYS.ENDPOINTS, endpoints);
    return updatedEndpoint;
  },

  deleteEndpoint(id) {
    const endpoints = this.getAllEndpoints();
    const filtered = endpoints.filter((ep) => ep.id !== id);
    setStored(STORAGE_KEYS.ENDPOINTS, filtered);

    // Cascade delete associated rules
    const rules = this.getAllRules();
    const filteredRules = rules.filter((r) => r.endpointId !== id);
    setStored(STORAGE_KEYS.RULES, filteredRules);

    return true;
  },

  // ==========================================
  // DYNAMIC RESPONSE RULES
  // ==========================================

  getAllRules() {
    return getStored(STORAGE_KEYS.RULES, DEFAULT_MOCK_RULES);
  },

  getRulesByEndpoint(endpointId) {
    const rules = this.getAllRules();
    return rules
      .filter((r) => r.endpointId === endpointId)
      .sort((a, b) => (a.priority || 1) - (b.priority || 1));
  },

  getRuleById(id) {
    const rules = this.getAllRules();
    return rules.find((r) => r.id === id) || null;
  },

  createRule(data) {
    if (!data.name || !data.name.trim()) {
      throw new Error('Rule name is required');
    }
    if (!data.endpointId) {
      throw new Error('Target endpoint must be selected');
    }

    const rules = this.getAllRules();
    const existingForEndpoint = rules.filter((r) => r.endpointId === data.endpointId);
    const nextPriority = data.priority || existingForEndpoint.length + 1;

    const newRule = {
      id: generateId('mrule'),
      endpointId: data.endpointId,
      serverId: data.serverId || '',
      name: data.name.trim(),
      description: data.description ? data.description.trim() : '',
      enabled: data.enabled !== undefined ? data.enabled : true,
      priority: nextPriority,
      matchLogic: data.matchLogic || 'AND',
      conditions: Array.isArray(data.conditions) ? data.conditions : [],
      response: {
        status: parseInt(data.response?.status, 10) || 200,
        delay: parseInt(data.response?.delay, 10) || 0,
        headers: Array.isArray(data.response?.headers) ? data.response.headers : [],
        bodyType: data.response?.bodyType || 'json',
        body: data.response?.body || '',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newRule, ...rules];
    setStored(STORAGE_KEYS.RULES, updated);

    // Backend sync
    apiClient.post('/mock-rules', newRule).catch(() => {});

    return newRule;
  },

  updateRule(id, updates) {
    const rules = this.getAllRules();
    const index = rules.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Mock rule "${id}" not found.`);
    }

    if (updates.name !== undefined && !updates.name.trim()) {
      throw new Error('Rule name cannot be empty');
    }

    const updatedRule = {
      ...rules[index],
      ...updates,
      ...(updates.response ? { response: { ...rules[index].response, ...updates.response } } : {}),
      updatedAt: new Date().toISOString(),
    };

    rules[index] = updatedRule;
    setStored(STORAGE_KEYS.RULES, rules);

    // Backend sync
    apiClient.put(`/mock-rules/${id}`, updates).catch(() => {});

    return updatedRule;
  },

  toggleRuleStatus(id) {
    const rule = this.getRuleById(id);
    if (!rule) return null;

    // Backend sync
    apiClient.patch(`/mock-rules/${id}/toggle`).catch(() => {});

    return this.updateRule(id, { enabled: !rule.enabled });
  },

  deleteRule(id) {
    const rules = this.getAllRules();
    const filtered = rules.filter((r) => r.id !== id);
    setStored(STORAGE_KEYS.RULES, filtered);

    // Backend sync
    apiClient.delete(`/mock-rules/${id}`).catch(() => {});

    return true;
  },

  reorderRules(endpointId, ruleIds) {
    const rules = this.getAllRules();
    const otherRules = rules.filter((r) => r.endpointId !== endpointId);
    const targetRules = rules.filter((r) => r.endpointId === endpointId);

    const reordered = ruleIds
      .map((id, index) => {
        const found = targetRules.find((r) => r.id === id);
        if (!found) return null;
        return {
          ...found,
          priority: index + 1,
          updatedAt: new Date().toISOString(),
        };
      })
      .filter(Boolean);

    setStored(STORAGE_KEYS.RULES, [...reordered, ...otherRules]);
    return reordered;
  },

  // Reset all to default seed templates
  resetToDefaults() {
    setStored(STORAGE_KEYS.SERVERS, DEFAULT_MOCK_SERVERS);
    setStored(STORAGE_KEYS.ENDPOINTS, DEFAULT_MOCK_ENDPOINTS);
    setStored(STORAGE_KEYS.RULES, DEFAULT_MOCK_RULES);
    return {
      servers: DEFAULT_MOCK_SERVERS,
      endpoints: DEFAULT_MOCK_ENDPOINTS,
      rules: DEFAULT_MOCK_RULES,
    };
  },
};

// Initial background synchronization
if (typeof window !== 'undefined') {
  setTimeout(() => mockServerService.syncWithBackend(), 100);
}

export default mockServerService;
