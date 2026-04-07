import apiClient from './apiClient';
import { getAuthToken } from '../utils/authStorage';

const API_URL = '/api/assets';

// Helper to get auth token
const getAuthHeader = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const assetService = {
  // Get all assets with filters and pagination
  getAssets: (params = {}) => {
    return apiClient.get(API_URL, { 
      params,
      headers: getAuthHeader()
    }).then(res => res.data);
  },

  // Get single asset by ID
  getAssetById: (id) => {
    return apiClient.get(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    }).then(res => res.data?.data ?? res.data);
  },

  // Create new asset
  createAsset: (assetData) => {
    return apiClient.post(API_URL, assetData, {
      headers: getAuthHeader()
    }).then(res => res.data?.data ?? res.data);
  },

  // Update asset
  updateAsset: (id, assetData) => {
    return apiClient.put(`${API_URL}/${id}`, assetData, {
      headers: getAuthHeader()
    }).then(res => res.data?.data ?? res.data);
  },

  // Delete asset
  deleteAsset: (id) => {
    return apiClient.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    }).then(res => res.data);
  },

  // Export assets as CSV
  exportAssets: (params = {}) => {
    return apiClient.get(`${API_URL}/export/download`, {
      params,
      responseType: 'blob',
      headers: getAuthHeader()
    });
  }
};

export default assetService;

