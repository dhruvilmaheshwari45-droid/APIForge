/**
 * APIForge - Variable Substitution & Resolution Utility
 * 
 * Safely resolves {{VARIABLE_NAME}} placeholders without eval or code execution.
 * Detects missing variables, validates syntax, and prevents secret leakage.
 */

// Regex for extracting {{VAR_NAME}} with optional internal whitespace
export const VARIABLE_REGEX = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

/**
 * Validate variable key syntax
 * Must begin with a letter or underscore and contain only alphanumeric chars and underscores.
 */
export const validateVariableName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Variable name is required' };
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Variable name cannot be empty' };
  }
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
    return {
      valid: false,
      error: 'Variable name must start with a letter/underscore and contain only letters, numbers, and underscores',
    };
  }
  return { valid: true, error: null };
};

/**
 * Extract all unique variable names referenced in a string
 * @param {string} text
 * @returns {string[]} Array of unique variable names
 */
export const extractVariables = (text) => {
  if (!text || typeof text !== 'string') return [];
  const matches = new Set();
  let match;
  const regex = new RegExp(VARIABLE_REGEX.source, 'g');
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      matches.add(match[1]);
    }
  }
  return Array.from(matches);
};

/**
 * Resolve variables within a single string template
 * @param {string} text 
 * @param {Record<string, string>} variablesMap Key-value mapping of enabled variables
 * @returns {{ resolved: string, unresolved: string[], replaced: string[] }}
 */
export const resolveString = (text, variablesMap = {}) => {
  if (!text || typeof text !== 'string') {
    return { resolved: text || '', unresolved: [], replaced: [] };
  }

  const unresolved = new Set();
  const replaced = new Set();

  const resolved = text.replace(new RegExp(VARIABLE_REGEX.source, 'g'), (fullMatch, varName) => {
    const key = varName.trim();
    if (Object.prototype.hasOwnProperty.call(variablesMap, key) && variablesMap[key] !== undefined && variablesMap[key] !== null) {
      replaced.add(key);
      return String(variablesMap[key]);
    }
    unresolved.add(key);
    return fullMatch; // Keep the placeholder if unresolved
  });

  return {
    resolved,
    unresolved: Array.from(unresolved),
    replaced: Array.from(replaced),
  };
};

/**
 * Convert an environment's variables array to a lookup map of enabled variables
 * @param {object} environment 
 * @returns {Record<string, string>}
 */
export const buildEnvironmentVariablesMap = (environment) => {
  const map = {};
  if (!environment) return map;

  // 1. If environment has baseUrl, provide it as default fallback for {{BASE_URL}}
  if (environment.baseUrl) {
    map['BASE_URL'] = environment.baseUrl;
  }

  // 2. Iterate through environment variables array (only include enabled ones)
  if (Array.isArray(environment.variables)) {
    environment.variables.forEach((v) => {
      if (v && v.key && (v.enabled !== false)) {
        map[v.key.trim()] = v.value !== undefined ? v.value : '';
      }
    });
  }

  return map;
};

/**
 * Resolve an entire API request configuration against an active environment
 * Safely resolves URL, Params, Headers, Auth, and Body
 * 
 * @param {object} requestConfig
 * @param {object} environment Active environment object
 * @returns {{
 *   resolvedRequest: object,
 *   unresolvedVariables: string[],
 *   replacedVariables: string[],
 *   hasUnresolved: boolean
 * }}
 */
export const resolveRequestPayload = (requestConfig, environment) => {
  const variablesMap = buildEnvironmentVariablesMap(environment);
  const allUnresolved = new Set();
  const allReplaced = new Set();

  const helperResolve = (str) => {
    const res = resolveString(str, variablesMap);
    res.unresolved.forEach((u) => allUnresolved.add(u));
    res.replaced.forEach((r) => allReplaced.add(r));
    return res.resolved;
  };

  // 1. Resolve URL
  const resolvedUrl = helperResolve(requestConfig.url || '');

  // 2. Resolve Params
  const resolvedParams = Array.isArray(requestConfig.params)
    ? requestConfig.params.map((p) => ({
        ...p,
        key: helperResolve(p.key || ''),
        value: helperResolve(p.value || ''),
      }))
    : [];

  // 3. Resolve Headers
  const resolvedHeaders = Array.isArray(requestConfig.headers)
    ? requestConfig.headers.map((h) => ({
        ...h,
        key: helperResolve(h.key || ''),
        value: helperResolve(h.value || ''),
      }))
    : [];

  // 4. Resolve Auth
  const resolvedAuth = { ...(requestConfig.auth || { type: 'noauth' }) };
  if (resolvedAuth.bearerToken) {
    resolvedAuth.bearerToken = helperResolve(resolvedAuth.bearerToken);
  }
  if (resolvedAuth.basicUsername) {
    resolvedAuth.basicUsername = helperResolve(resolvedAuth.basicUsername);
  }
  if (resolvedAuth.basicPassword) {
    resolvedAuth.basicPassword = helperResolve(resolvedAuth.basicPassword);
  }
  if (resolvedAuth.apiKeyValue) {
    resolvedAuth.apiKeyValue = helperResolve(resolvedAuth.apiKeyValue);
  }
  if (resolvedAuth.apiKeyName) {
    resolvedAuth.apiKeyName = helperResolve(resolvedAuth.apiKeyName);
  }

  // 5. Resolve Body
  let resolvedJsonBody = requestConfig.jsonBody || '';
  let resolvedRawBody = requestConfig.rawBody || '';
  let resolvedFormData = requestConfig.formData;

  if (requestConfig.bodyType === 'json' && resolvedJsonBody) {
    resolvedJsonBody = helperResolve(resolvedJsonBody);
  } else if (requestConfig.bodyType === 'raw' && resolvedRawBody) {
    resolvedRawBody = helperResolve(resolvedRawBody);
  } else if (requestConfig.bodyType === 'form-data' && Array.isArray(resolvedFormData)) {
    resolvedFormData = resolvedFormData.map((f) => ({
      ...f,
      key: helperResolve(f.key || ''),
      value: helperResolve(f.value || ''),
    }));
  }

  const unresolvedList = Array.from(allUnresolved);
  const replacedList = Array.from(allReplaced);

  return {
    resolvedRequest: {
      ...requestConfig,
      url: resolvedUrl,
      params: resolvedParams,
      headers: resolvedHeaders,
      auth: resolvedAuth,
      jsonBody: resolvedJsonBody,
      rawBody: resolvedRawBody,
      formData: resolvedFormData,
    },
    unresolvedVariables: unresolvedList,
    replacedVariables: replacedList,
    hasUnresolved: unresolvedList.length > 0,
  };
};

export default {
  VARIABLE_REGEX,
  validateVariableName,
  extractVariables,
  resolveString,
  buildEnvironmentVariablesMap,
  resolveRequestPayload,
};
