import axios from 'axios';

// Base Axios instance setup for Express backend integration
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('apiforge_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Service methods with backend connection & fallback
export const apiService = {
  async getCollections() {
    try {
      const res = await apiClient.get('/collections');
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (error) {
      return [];
    }
  },

  async getEndpoints(collectionId) {
    try {
      const params = collectionId ? { collectionId } : {};
      const res = await apiClient.get('/apis', { params });
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (error) {
      return [];
    }
  },

  async executeRequest(requestConfig) {
    const startTime = performance.now();
    try {
      // First attempt execution through server proxy
      const res = await apiClient.post('/apis/execute', {
        url: requestConfig.url,
        method: requestConfig.method || 'GET',
        headers: requestConfig.headers || {},
        params: requestConfig.params || {},
        data: requestConfig.data || null,
        timeout: requestConfig.timeout || 10000,
      });

      const endTime = performance.now();
      return {
        status: res.data.status,
        statusText: res.data.statusText,
        data: res.data.data,
        headers: res.data.headers,
        responseTimeMs: res.data.durationMs || Math.round(endTime - startTime),
      };
    } catch {
      // Fallback to direct client-side axios if proxy fails
      try {
        const directRes = await axios({
          url: requestConfig.url,
          method: requestConfig.method || 'GET',
          headers: requestConfig.headers || {},
          data: requestConfig.data || null,
          params: requestConfig.params || {},
          validateStatus: () => true,
        });
        const endTime = performance.now();
        return {
          status: directRes.status,
          statusText: directRes.statusText,
          data: directRes.data,
          headers: directRes.headers,
          responseTimeMs: Math.round(endTime - startTime),
        };
      } catch (err) {
        const endTime = performance.now();
        return {
          status: err.response?.status || 500,
          statusText: err.response?.statusText || 'Execution Error',
          data: err.response?.data || { error: err.message },
          headers: err.response?.headers || {},
          responseTimeMs: Math.round(endTime - startTime),
        };
      }
    }
  },
};

export default apiClient;
