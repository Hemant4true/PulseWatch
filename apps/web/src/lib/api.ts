import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) return 'http://localhost:4000/api';
  // Remove trailing slash if present
  const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // required to send and receive httpOnly cookies
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh') {
      originalRequest._retry = true;
      try {
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { accessToken } = response.data.data;
        useAuthStore.getState().setAccessToken(accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
