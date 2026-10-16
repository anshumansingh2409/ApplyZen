import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('applyzen_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired and redirect to login if not public
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/signup') && path !== '/') {
        localStorage.removeItem('applyzen_token');
        localStorage.removeItem('applyzen_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
