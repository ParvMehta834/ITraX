import apiClient from './apiClient';

const API_URL = '/api/orders';

// Helper to get auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('itrax_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalizeListResponse = (payload) => {
  const pagination = payload.pagination || {
    total: payload.total ?? 0,
    page: payload.page ?? 1,
    pages: payload.pages ?? payload.totalPages ?? 1,
    limit: payload.limit
  };

  return {
    data: payload.data || [],
    pagination,
    raw: payload
  };
};

const normalizeSingleResponse = (payload) => {
  if (payload.data) return payload.data;
  if (payload.order) return payload.order;
  return payload;
};

const orderService = {
  // Get all orders with filters and pagination
  getOrders: (params = {}) => {
    return apiClient.get(API_URL, {
      params,
      headers: getAuthHeader()
    }).then(res => normalizeListResponse(res.data));
  },

  // Get single order
  getOrderById: (id) => {
    return apiClient.get(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    }).then(res => normalizeSingleResponse(res.data));
  },

  // Create new order
  createOrder: (orderData) => {
    return apiClient.post(API_URL, orderData, {
      headers: getAuthHeader()
    }).then(res => normalizeSingleResponse(res.data));
  },

  // Update order
  updateOrder: (id, orderData) => {
    return apiClient.put(`${API_URL}/${id}`, orderData, {
      headers: getAuthHeader()
    }).then(res => normalizeSingleResponse(res.data));
  },

  // Update order status
  updateOrderStatus: (id, status) => {
    return apiClient.patch(`${API_URL}/${id}/status`, { status }, {
      headers: getAuthHeader()
    }).then(res => normalizeSingleResponse(res.data));
  },

  // Delete order
  deleteOrder: (id) => {
    return apiClient.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    }).then(res => res.data);
  },

  // Export orders as CSV
  exportOrders: (params = {}) => {
    return apiClient.get(`${API_URL}/export/download`, {
      params,
      responseType: 'blob',
      headers: getAuthHeader()
    });
  }
};

export default orderService;
