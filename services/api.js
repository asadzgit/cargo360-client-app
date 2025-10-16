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
    const original = error.config || {};

    if (status === 401 && !original._retry) {
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
};

export const bookingAPI = {
  create: (body) => api.post('/shipments', body),
  mine: (status) => api.get(`/shipments/mine${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  get: (id) => api.get(`/shipments/${id}`),
  update: (id, body) => api.put(`/shipments/${id}`, body),
  cancel: (id) => api.patch(`/shipments/${id}/cancel`),
  currentLocation: (id) => api.get(`/location/shipments/${id}/current`),
};

export const userAPI = {
  updateMe: (body) => api.patch('/users/me', body),
};
