import axios from 'axios';

// Base URL for Python FastAPI backend
const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: automatically attaches JWT token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('civicfix_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: formats errors cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Backend returned an error response (4xx, 5xx)
      const message = error.response.data?.message || error.response.data?.detail || 'An unexpected error occurred.';
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // Backend did not respond (connection refused or offline)
      return Promise.reject(new Error('Cannot reach the CivicFix backend. Please ensure the server is running on port 8000.'));
    } else {
      return Promise.reject(new Error(error.message));
    }
  }
);

export const getImageUrl = (path) => {
  if (!path) return 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE_URL}${path}`;
};

export default api;
