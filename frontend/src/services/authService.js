import axios from 'axios';

const TOKEN_KEY = 'apiforge_token';
const USER_KEY = 'apiforge_user';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY) || null;
  },

  setToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  getUser() {
    try {
      const data = localStorage.getItem(USER_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return {
      name: 'Alex Rivera',
      email: 'alex@apiforge.dev',
      role: 'Lead Architect',
    };
  },

  setUser(user) {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  },

  async login(email, password) {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      if (res.data?.token) {
        this.setToken(res.data.token);
        this.setUser(res.data.user);
      }
      return res.data;
    } catch (err) {
      // If offline, still provide friendly response
      throw new Error(err.response?.data?.message || err.message || 'Login failed');
    }
  },

  async register(name, email, password, role = 'Lead Architect') {
    try {
      const res = await apiClient.post('/auth/register', { name, email, password, role });
      if (res.data?.token) {
        this.setToken(res.data.token);
        this.setUser(res.data.user);
      }
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Registration failed');
    }
  },

  async getMe() {
    try {
      const res = await apiClient.get('/auth/me');
      if (res.data?.user) {
        this.setUser(res.data.user);
      }
      return res.data?.user || this.getUser();
    } catch {
      return this.getUser();
    }
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      this.setToken(null);
      this.setUser(null);
    }
  },
};

export default authService;
