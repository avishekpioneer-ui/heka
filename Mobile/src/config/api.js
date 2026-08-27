import axios from 'axios';
import storage from '../utils/storage';

export const BACKEND_URI = process.env.EXPO_PUBLIC_BACKEND_URI || 'http://localhost:5001';

const apiClient = axios.create({
  baseURL: BACKEND_URI,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to automatically attach user token / userId
apiClient.interceptors.request.use(
  async (config) => {
    const userId = await storage.getItem('userId');
    const token = await storage.getItem('token');
    
    if (userId) {
      config.headers['x-user-id'] = userId;
    }
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
