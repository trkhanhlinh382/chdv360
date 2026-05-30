import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'chdv360_admin_token';
const USER_KEY = 'chdv360_admin_user';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Authentication Failure
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (window.location.hash !== '#/login') {
        window.location.href = '/#/login';
      }
    }
    const message = error.response?.data?.message || error.message || 'API request failed';
    return Promise.reject(new Error(message));
  }
);

// Simple, lightweight cache store for HTTP GET requests
const cacheStore = {
  data: {},
  get: (key) => cacheStore.data[key],
  set: (key, val) => { cacheStore.data[key] = val; },
  clear: () => { cacheStore.data = {}; }
};

const cachedGet = async (url, params) => {
  const cacheKey = `${url}_${JSON.stringify(params || {})}`;
  if (cacheStore.get(cacheKey)) {
    return cacheStore.get(cacheKey);
  }
  const res = await client.get(url, params ? { params } : undefined);
  cacheStore.set(cacheKey, res);
  return res;
};

export const api = {
  // Auth
  login: async (phone, password) => {
    const res = await client.post('/auth/login', { phone, password });
    if (res.token) {
      cacheStore.clear();
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    }
    return res;
  },
  logout: () => {
    cacheStore.clear();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = '/#/login';
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },
  getMe: () => cachedGet('/auth/me'),

  // Dashboard
  getDashboardStats: () => cachedGet('/dashboard/stats'),

  // Buildings
  getBuildings: () => cachedGet('/buildings'),
  getBuildingById: (id) => cachedGet(`/buildings/${id}`),
  createBuilding: async (data) => {
    const res = await client.post('/buildings', data);
    cacheStore.clear();
    return res;
  },
  updateBuilding: async (id, data) => {
    const res = await client.put(`/buildings/${id}`, data);
    cacheStore.clear();
    return res;
  },
  deleteBuilding: async (id) => {
    const res = await client.delete(`/buildings/${id}`);
    cacheStore.clear();
    return res;
  },

  // Apartments
  getApartments: (params) => cachedGet('/apartments', params),
  getApartmentById: (id) => cachedGet(`/apartments/${id}`),
  createApartment: async (data) => {
    const res = await client.post('/apartments', data);
    cacheStore.clear();
    return res;
  },
  updateApartment: async (id, data) => {
    const res = await client.put(`/apartments/${id}`, data);
    cacheStore.clear();
    return res;
  },
  deleteApartment: async (id) => {
    const res = await client.delete(`/apartments/${id}`);
    cacheStore.clear();
    return res;
  },

  // Tenants
  getTenants: (params) => cachedGet('/tenants', params),
  getTenantById: (id) => cachedGet(`/tenants/${id}`),
  createTenant: async (data) => {
    const res = await client.post('/tenants', data);
    cacheStore.clear();
    return res;
  },
  updateTenant: async (id, data) => {
    const res = await client.put(`/tenants/${id}`, data);
    cacheStore.clear();
    return res;
  },
  deleteTenant: async (id) => {
    const res = await client.delete(`/tenants/${id}`);
    cacheStore.clear();
    return res;
  },

  // Contracts
  getContracts: (params) => cachedGet('/contracts', params),
  getContractById: (id) => cachedGet(`/contracts/${id}`),
  createContract: async (data) => {
    const res = await client.post('/contracts', data);
    cacheStore.clear();
    return res;
  },
  updateContract: async (id, data) => {
    const res = await client.put(`/contracts/${id}`, data);
    cacheStore.clear();
    return res;
  },
  deleteContract: async (id) => {
    const res = await client.delete(`/contracts/${id}`);
    cacheStore.clear();
    return res;
  },

  // Invoices
  getInvoices: () => cachedGet('/invoices'),
  getDueInvoices: () => cachedGet('/invoices/due'),
  getInvoiceById: (id) => cachedGet(`/invoices/${id}`),
  createInvoice: async (data) => {
    const res = await client.post('/invoices', data);
    cacheStore.clear();
    return res;
  },
  updateInvoice: async (id, data) => {
    const res = await client.put(`/invoices/${id}`, data);
    cacheStore.clear();
    return res;
  },
  deleteInvoice: async (id) => {
    const res = await client.delete(`/invoices/${id}`);
    cacheStore.clear();
    return res;
  },

  // Expenses & Financials
  getExpenses: (params) => cachedGet('/expenses', params),
  createExpense: async (data) => {
    const res = await client.post('/expenses', data);
    cacheStore.clear();
    return res;
  },
  updateExpense: async (id, data) => {
    const res = await client.put(`/expenses/${id}`, data);
    cacheStore.clear();
    return res;
  },
  deleteExpense: async (id) => {
    const res = await client.delete(`/expenses/${id}`);
    cacheStore.clear();
    return res;
  },
  getFinancials: () => cachedGet('/dashboard/financials'),

  // Staff (Admin-only)
  getStaff: () => cachedGet('/staff'),
  createStaff: async (data) => {
    const res = await client.post('/staff', data);
    cacheStore.clear();
    return res;
  },
  updateStaff: async (id, data) => {
    const res = await client.put(`/staff/${id}`, data);
    cacheStore.clear();
    return res;
  },
  deleteStaff: async (id) => {
    const res = await client.delete(`/staff/${id}`);
    cacheStore.clear();
    return res;
  },
  
  // Image Upload helper
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await client.post('/public/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res;
  }
};

