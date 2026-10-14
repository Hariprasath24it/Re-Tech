import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to add JWT token if stored
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('retech_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses to handle 401 unauthorized
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if checking auth or on login page
      const isAuthCheck = error.config.url.includes('/auth/me');
      const isLoginPage = window.location.pathname === '/login';
      
      if (!isAuthCheck && !isLoginPage) {
        localStorage.removeItem('retech_token');
        localStorage.removeItem('retech_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
