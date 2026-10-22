import axios from 'axios';

const STORAGE_KEYS = {
  HISTORY: 'apiforge_request_history',
};

const MAX_HISTORY_ENTRIES = 50;

/**
 * Mask sensitive authorization tokens and secrets for safe UI display and storage
 */
export const maskSecret = (value) => {
  if (!value || typeof value !== 'string') return '';
  if (value.length <= 8) return '••••••••';
  return `${value.substring(0, 4)}••••••••${value.substring(value.length - 4)}`;
};

/**
 * Mask sensitive headers like Authorization, X-API-Key, Cookie
 */
export const maskHeaders = (headersObj = {}) => {
  const sensitiveKeys = ['authorization', 'x-api-key', 'api-key', 'token', 'cookie', 'x-auth-token'];
  const masked = {};

  Object.entries(headersObj).forEach(([k, v]) => {
    const isSensitive = sensitiveKeys.includes(k.toLowerCase());
    masked[k] = isSensitive ? maskSecret(String(v)) : String(v);
  });

  return masked;
};

export const requestService = {
  /**
   * Execute an HTTP request with full network inspection, timeout, and cancellation support
   */
  async sendRequest({
    url,
    method = 'GET',
    headers = [],
    params = [],
    auth = { type: 'noauth' },
    bodyType = 'none',
    jsonBody = '',
    rawBody = '',
    formData = [],
    timeout = 10000,
    abortSignal = null,
  }) {
    const startTime = performance.now();

    // 1. Build and sanitize query params
    const activeParams = {};
    params
      .filter((p) => p.enabled && p.key && p.key.trim())
      .forEach((p) => {
        activeParams[p.key.trim()] = p.value || '';
      });

    // 2. Build and sanitize headers
    const activeHeaders = {};
    headers
      .filter((h) => h.enabled && h.key && h.key.trim())
      .forEach((h) => {
        activeHeaders[h.key.trim()] = h.value || '';
      });

    // 3. Inject Authorization
    if (auth.type === 'bearer' && auth.bearerToken?.trim()) {
      activeHeaders['Authorization'] = `Bearer ${auth.bearerToken.trim()}`;
    } else if (auth.type === 'basic' && auth.basicUsername) {
      const credentials = `${auth.basicUsername}:${auth.basicPassword || ''}`;
      activeHeaders['Authorization'] = `Basic ${btoa(credentials)}`;
    } else if (auth.type === 'apikey' && auth.apiKeyValue?.trim()) {
      const keyName = auth.apiKeyName?.trim() || 'X-API-Key';
      const keyVal = auth.apiKeyValue.trim();
      if (auth.apiKeyLocation === 'query') {
        activeParams[keyName] = keyVal;
      } else {
        activeHeaders[keyName] = keyVal;
      }
    }

    // 4. Build Request Payload
    let payload = undefined;
    const upperMethod = method.toUpperCase();
    const canHaveBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(upperMethod);

    if (canHaveBody) {
      if (bodyType === 'json' && jsonBody?.trim()) {
        try {
          payload = JSON.parse(jsonBody);
          if (!activeHeaders['Content-Type']) {
            activeHeaders['Content-Type'] = 'application/json';
          }
        } catch (e) {
          // If JSON parse fails, send as string
          payload = jsonBody;
          if (!activeHeaders['Content-Type']) {
            activeHeaders['Content-Type'] = 'application/json';
          }
        }
      } else if (bodyType === 'raw' && rawBody?.trim()) {
        payload = rawBody;
        if (!activeHeaders['Content-Type']) {
          activeHeaders['Content-Type'] = 'text/plain';
        }
      } else if (bodyType === 'form-data' && formData?.length > 0) {
        const activeForm = formData.filter((r) => r.enabled && r.key?.trim());
        if (activeForm.length > 0) {
          const fd = new FormData();
          activeForm.forEach((r) => {
            fd.append(r.key.trim(), r.value || '');
          });
          payload = fd;
          // Let axios set multipart/form-data boundary automatically
          delete activeHeaders['Content-Type'];
        }
      }
    }

    // 5. Build final request metadata for inspector
    const requestMeta = {
      method: upperMethod,
      url,
      params: activeParams,
      headers: activeHeaders,
      maskedHeaders: maskHeaders(activeHeaders),
      body: payload,
      bodyType,
      timeout,
      timestamp: new Date().toISOString(),
    };

    try {
      const axiosConfig = {
        url,
        method: upperMethod,
        headers: activeHeaders,
        params: activeParams,
        data: payload,
        timeout: parseInt(timeout, 10) || 10000,
        signal: abortSignal || undefined,
        // Accept all HTTP status codes so we can inspect 4xx and 5xx responses accurately
        validateStatus: () => true,
      };

      const response = await axios(axiosConfig);
      const endTime = performance.now();
      const durationMs = Math.round(endTime - startTime);

      // Measure payload size
      let sizeBytes = 0;
      if (response.headers && response.headers['content-length']) {
        sizeBytes = parseInt(response.headers['content-length'], 10);
      } else if (response.data) {
        try {
          const str = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
          sizeBytes = new Blob([str]).size;
        } catch (e) {
          sizeBytes = 0;
        }
      }

      const isHttpError = response.status >= 400;

      const result = {
        ok: !isHttpError,
        isHttpError,
        isNetworkError: false,
        isTimeout: false,
        status: response.status,
        statusText: response.statusText || (isHttpError ? 'Error' : 'OK'),
        headers: response.headers || {},
        data: response.data,
        responseTimeMs: durationMs,
        sizeBytes,
        requestMeta: {
          ...requestMeta,
          durationMs,
        },
      };

      // Record in history & traffic monitoring
      this.addHistoryEntry(result);
      import('./trafficService')
        .then((m) => m.trafficService?.recordFromExecution(result))
        .catch(() => {});

      return result;
    } catch (err) {
      const endTime = performance.now();
      const durationMs = Math.round(endTime - startTime);

      const isAborted = axios.isCancel(err) || err.name === 'CanceledError' || err.name === 'AbortError';
      const isTimeout = err.code === 'ECONNABORTED' || (err.message && err.message.toLowerCase().includes('timeout'));

      let errorKind = 'Network Error';
      let errorDetails = err.message || 'Unknown network error';
      let corsLikely = false;

      if (isAborted) {
        errorKind = 'Request Canceled';
        errorDetails = 'The request was canceled by the user.';
      } else if (isTimeout) {
        errorKind = 'Timeout';
        errorDetails = `The request exceeded the configured timeout of ${timeout}ms.`;
      } else if (!err.response) {
        corsLikely = true;
        errorKind = 'Network / CORS Error';
        errorDetails =
          'The request could not reach the target server. In browser environments, this typically happens when the server does not return "Access-Control-Allow-Origin" CORS headers, the domain is unreachable, or a local firewall/extension blocked the connection.';
      }

      const failureResult = {
        ok: false,
        isHttpError: false,
        isNetworkError: !isAborted && !isTimeout,
        isTimeout,
        isCanceled: isAborted,
        corsLikely,
        status: 0,
        statusText: errorKind,
        error: errorDetails,
        headers: {},
        data: {
          error: errorKind,
          message: errorDetails,
          help: corsLikely
            ? 'To test external APIs directly from the browser, the destination server must support CORS, or you can use safe public CORS-enabled testbeds such as https://httpbin.org or mock endpoints.'
            : undefined,
        },
        responseTimeMs: durationMs,
        sizeBytes: 0,
        requestMeta: {
          ...requestMeta,
          durationMs,
        },
      };

      if (!isAborted) {
        this.addHistoryEntry(failureResult);
        import('./trafficService')
          .then((m) => m.trafficService?.recordFromExecution(failureResult))
          .catch(() => {});
      }

      return failureResult;
    }
  },

  // ==========================================
  // REQUEST HISTORY PERSISTENCE
  // ==========================================

  getHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  },

  addHistoryEntry(result) {
    try {
      const history = this.getHistory();
      const meta = result.requestMeta || {};

      // Redact sensitive secrets before saving into localStorage
      const safeEntry = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: meta.timestamp || new Date().toISOString(),
        method: meta.method || 'GET',
        url: meta.url || '',
        status: result.status,
        statusText: result.statusText,
        responseTimeMs: result.responseTimeMs || 0,
        sizeBytes: result.sizeBytes || 0,
        ok: result.ok,
        isNetworkError: result.isNetworkError,
        isTimeout: result.isTimeout,
        // Sanitized config to allow restoring the request later
        configSnapshot: {
          method: meta.method || 'GET',
          url: meta.url || '',
          params: meta.params || {},
          headers: meta.maskedHeaders || {},
          bodyType: meta.bodyType || 'none',
          body: typeof meta.body === 'object' ? meta.body : meta.body || null,
        },
      };

      const updated = [safeEntry, ...history].slice(0, MAX_HISTORY_ENTRIES);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
      return safeEntry;
    } catch (e) {
      console.warn('Failed to save request history:', e);
      return null;
    }
  },

  removeHistoryEntry(id) {
    try {
      const history = this.getHistory();
      const filtered = history.filter((h) => h.id !== id);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filtered));
      return filtered;
    } catch (e) {
      return [];
    }
  },

  clearHistory() {
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
      return [];
    } catch (e) {
      return [];
    }
  },
};

export default requestService;
