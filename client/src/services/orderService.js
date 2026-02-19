import apiClient from './apiClient';

const API_URL = '/api/orders';

// Helper to get auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('itrax_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const orderService = {
  // Get all orders with filters and pagination
  getOrders: (params = {}) => {
    return apiClient.get(API_URL, {
      params,
      headers: getAuthHeader()
    });
  },

  // Get single order
  getOrderById: (id) => {
    return apiClient.get(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
  },

  // Create new order
  createOrder: (orderData) => {
    return apiClient.post(API_URL, orderData, {
      headers: getAuthHeader()
    });
  },

  // Update order
  updateOrder: (id, orderData) => {
    return apiClient.put(`${API_URL}/${id}`, orderData, {
      headers: getAuthHeader()
    });
  },

  // Update order status
  updateOrderStatus: (id, status) => {
    return apiClient.patch(`${API_URL}/${id}/status`, { status }, {
      headers: getAuthHeader()
    });
  },

  // Delete order
  deleteOrder: (id) => {
    return apiClient.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
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
