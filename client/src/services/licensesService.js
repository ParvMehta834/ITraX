import apiClient from './apiClient';

const API_URL = '/api/licenses';

// Helper to get auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('itrax_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const licensesService = {
  // Get all licenses with filters and pagination
  getLicenses: (params = {}) => {
    return apiClient.get(API_URL, {
      params,
      headers: getAuthHeader()
    });
  },

  // Get single license by ID
  getLicenseById: (id) => {
    return apiClient.get(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
  },

  // Create new license
  createLicense: (licenseData) => {
    return apiClient.post(API_URL, licenseData, {
      headers: getAuthHeader()
    });
  },

  // Update license
  updateLicense: (id, licenseData) => {
    return apiClient.put(`${API_URL}/${id}`, licenseData, {
      headers: getAuthHeader()
    });
  },

  // Delete license
  deleteLicense: (id) => {
    return apiClient.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
  },

  // Export licenses as CSV
  exportLicenses: (params = {}) => {
    return apiClient.get(`${API_URL}/export/download`, {
      params,
      responseType: 'blob',
      headers: getAuthHeader()
    });
  }
};

export default licensesService;
