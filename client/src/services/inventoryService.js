import apiClient from './apiClient';

const API_URL = '/api/inventory';

// Helper to get auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('itrax_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const inventoryService = {
  // Get all inventory items with filters and pagination
  getItems: (params = {}) => {
    return apiClient.get(API_URL, {
      params,
      headers: getAuthHeader()
    });
  },

  // Get single item by ID
  getItemById: (id) => {
    return apiClient.get(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
  },

  // Create new inventory item
  createItem: (itemData) => {
    return apiClient.post(API_URL, itemData, {
      headers: getAuthHeader()
    });
  },

  // Update inventory item
  updateItem: (id, itemData) => {
    return apiClient.put(`${API_URL}/${id}`, itemData, {
      headers: getAuthHeader()
    });
  },

  // Delete inventory item
  deleteItem: (id) => {
    return apiClient.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
  },

  // Export inventory to CSV
  exportItems: (params = {}) => {
    return apiClient.get(`${API_URL}/export/download`, {
      params,
      responseType: 'blob',
      headers: getAuthHeader()
    });
  }
};

export default inventoryService;
