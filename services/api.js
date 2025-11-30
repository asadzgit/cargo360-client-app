import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_BASE_URL = (Constants?.expoConfig?.extra?.apiBaseUrl) || 'https://cargo360-api.onrender.com/';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

async function getAccessToken() {
  return SecureStore.getItemAsync('accessToken');
}
async function getRefreshToken() {
  return SecureStore.getItemAsync('refreshToken');
}
export async function setTokens(accessToken, refreshToken) {
  if (accessToken) await SecureStore.setItemAsync('accessToken', accessToken);
  if (refreshToken) await SecureStore.setItemAsync('refreshToken', refreshToken);
}
export async function clearTokens() {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
}

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
  }
  return config;
});

let isRefreshing = false;
let pending = [];

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const status = error?.response?.status;
    const code = error?.response?.code || error?.response?.data?.code;
    const original = error.config || {};

    if (status === 401 && !original._retry && code !== 4100) {
      original._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const rt = await getRefreshToken();
          if (!rt) throw new Error('Session expired');
          const { data } = await axios.post(`${API_BASE_URL}auth/refresh`, { refreshToken: rt }, { headers: { 'Content-Type': 'application/json' } });
          await setTokens(data?.accessToken, data?.refreshToken);

          pending.forEach((fn) => fn(data?.accessToken));
          pending = [];
          return api(original);
        } catch (e) {
          await clearTokens();
          // Navigation back to login should be handled by callers when 401 bubbles up post-clear
          return Promise.reject(e);
        } finally {
          isRefreshing = false;
        }
      }

      return new Promise((resolve) => {
        pending.push((newToken) => {
          if (!original.headers) original.headers = {};
          original.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(original));
        });
      });
    }

    const msg = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'An error occurred';
    return Promise.reject(new Error(msg));
  }
);

export const authAPI = {
  signup: (body) => api.post('/auth/signup', { ...body, role: 'customer' }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  verifyEmail: (token) => api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (code, password) => api.post('/auth/reset-password', { code, password }),
  deletionLink: () => api.post('/auth/deletion-link'),
};

export const bookingAPI = {
  create: (body) => api.post('/shipments', body),
  mine: (status) => api.get(`/shipments/mine${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  get: (id) => api.get(`/shipments/${id}`),
  update: (id, body) => api.put(`/shipments/${id}`, body),
  cancel: (id) => api.patch(`/shipments/${id}/cancel`),
  currentLocation: (id) => api.get(`/location/shipments/${id}/current`),
  createDiscountRequest: (id, requestAmount) => api.post(`/shipments/${id}/discount-request`, { requestAmount }),
  confirm: (id) => api.patch(`/shipments/${id}/confirm`),
};

export const userAPI = {
  updateMe: (body) => api.patch('/users/me', body),
};

// Document Upload APIs
export const documentAPI = {
  // Generate upload signature for Cloudinary
  getUploadSignature: (documentType, fileName) => 
    api.post('/documents/upload-signature', { documentType, fileName }),
  
  // Save document metadata after Cloudinary upload
  save: (body) => api.post('/documents', body),
  
  // List documents (with optional filters)
  list: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/documents${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get single document
  get: (id) => api.get(`/documents/${id}`),
  
  // Delete document
  delete: (id) => api.delete(`/documents/${id}`),
};

// Clearance Request APIs
export const clearanceAPI = {
  // Create clearance request
  create: (body) => api.post('/clearance-requests', body),
  
  // List clearance requests (with optional filters)
  list: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/clearance-requests${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get single clearance request
  get: (id) => api.get(`/clearance-requests/${id}`),
  
  // Update clearance request
  update: (id, body) => api.put(`/clearance-requests/${id}`, body),
  
  // Update clearance request status (admin/moderator only)
  updateStatus: (id, body) => api.put(`/clearance-requests/${id}/status`, body),
  
  // Delete clearance request
  delete: (id) => api.delete(`/clearance-requests/${id}`),
};
