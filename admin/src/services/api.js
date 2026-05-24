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
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.message || error.message || 'API request failed';
    return Promise.reject(new Error(message));
  }
);

export const api = {
  // Auth
  login: async (phone, password) => {
    const res = await client.post('/auth/login', { phone, password });
    if (res.token) {
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    }
    return res;
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = '/login';
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },
  getMe: () => client.get('/auth/me'),

  // Dashboard
  getDashboardStats: () => client.get('/dashboard/stats'),

  // Buildings
  getBuildings: () => client.get('/buildings'),
  getBuildingById: (id) => client.get(`/buildings/${id}`),
  createBuilding: (data) => client.post('/buildings', data),
  updateBuilding: (id, data) => client.put(`/buildings/${id}`, data),
  deleteBuilding: (id) => client.delete(`/buildings/${id}`),

  // Apartments
  getApartments: (params) => client.get('/apartments', { params }),
  getApartmentById: (id) => client.get(`/apartments/${id}`),
  createApartment: (data) => client.post('/apartments', data),
  updateApartment: (id, data) => client.put(`/apartments/${id}`, data),
  deleteApartment: (id) => client.delete(`/apartments/${id}`),

  // Tenants
  getTenants: () => client.get('/tenants'),
  getTenantById: (id) => client.get(`/tenants/${id}`),
  createTenant: (data) => client.post('/tenants', data),
  updateTenant: (id, data) => client.put(`/tenants/${id}`, data),
  deleteTenant: (id) => client.delete(`/tenants/${id}`),

  // Contracts
  getContracts: () => client.get('/contracts'),
  getContractById: (id) => client.get(`/contracts/${id}`),
  createContract: (data) => client.post('/contracts', data),
  updateContract: (id, data) => client.put(`/contracts/${id}`, data),
  deleteContract: (id) => client.delete(`/contracts/${id}`),

  // Invoices
  getInvoices: () => client.get('/invoices'),
  getDueInvoices: () => client.get('/invoices/due'),
  getInvoiceById: (id) => client.get(`/invoices/${id}`),
  createInvoice: (data) => client.post('/invoices', data),
  updateInvoice: (id, data) => client.put(`/invoices/${id}`, data),
  deleteInvoice: (id) => client.delete(`/invoices/${id}`),

  // Expenses & Financials
  getExpenses: (params) => client.get('/expenses', { params }),
  createExpense: (data) => client.post('/expenses', data),
  updateExpense: (id, data) => client.put(`/expenses/${id}`, data),
  deleteExpense: (id) => client.delete(`/expenses/${id}`),
  getFinancials: () => client.get('/dashboard/financials'),

  // Staff (Admin-only)
  getStaff: () => client.get('/staff'),
  createStaff: (data) => client.post('/staff', data),
  updateStaff: (id, data) => client.put(`/staff/${id}`, data),
  deleteStaff: (id) => client.delete(`/staff/${id}`)
};

