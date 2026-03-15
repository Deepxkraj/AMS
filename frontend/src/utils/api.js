import axios from 'axios';

// Dynamic API URL for development and production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ams-backend-86i6.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Don't redirect here - let the component handle it
      console.warn('Token expired, please login again');
    }
    return Promise.reject(error);
  }
);

export default api;

