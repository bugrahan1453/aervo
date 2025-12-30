/**
 * API Client
 * Axios-based HTTP client for backend communication
 */

import axios, { AxiosError, AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<any>) => {
    const message = error.response?.data?.error || 'Bir hata oluştu';

    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/giris';
      }
    }

    return Promise.reject({
      message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

export default api;

// API endpoints
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  changePassword: (data: any) => api.post('/auth/change-password', data),
  logout: () => api.post('/auth/logout'),
};

export const userApi = {
  getStats: () => api.get('/user/stats'),
  getInvoices: (params?: any) => api.get('/user/invoices', { params }),
  getPackages: () => api.get('/user/packages'),
};

export const orderApi = {
  create: (data: any) => api.post('/orders', data),
  getMyOrders: (params?: any) => api.get('/orders', { params }),
  getOrder: (id: string) => api.get(`/orders/${id}`),
  cancel: (id: string) => api.post(`/orders/${id}/cancel`),
  getDownloadUrl: (id: string) => api.get(`/orders/${id}/download`),
};

export const paymentApi = {
  process: (data: any) => api.post('/payment/process', data),
  getStatus: (orderId: string) => api.get(`/payment/${orderId}/status`),
};

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getOrders: (params?: any) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id: string, status: string) =>
    api.put(`/admin/orders/${id}/status`, { status }),
  retryOrder: (id: string) => api.post(`/admin/orders/${id}/retry`),
  refundOrder: (id: string) => api.post(`/admin/orders/${id}/refund`),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  toggleBlockUser: (id: string, isBlocked: boolean) =>
    api.put(`/admin/users/${id}/block`, { isBlocked }),
  getSettings: () => api.get('/admin/settings'),
  updateSetting: (key: string, value: string) =>
    api.put(`/admin/settings/${key}`, { value }),
  getEmailTemplates: () => api.get('/admin/email-templates'),
  updateEmailTemplate: (key: string, data: any) =>
    api.put(`/admin/email-templates/${key}`, data),
  getPackages: () => api.get('/admin/packages'),
  updatePackage: (id: string, data: any) => api.put(`/admin/packages/${id}`, data),
  getSalesReport: (params?: any) => api.get('/admin/reports/sales', { params }),
  getSystemHealth: () => api.get('/admin/system/health'),
};
