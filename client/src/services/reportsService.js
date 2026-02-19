import apiClient from './apiClient';

const API_URL = '/api/reports';

const getAuthHeader = () => {
  const token = localStorage.getItem('itrax_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const reportsService = {
  // Asset Reports
  getAssetsMaster: () => {
    return apiClient.get(`${API_URL}/assets-master`, {
      headers: getAuthHeader()
    });
  },

  getAssetsByStatus: () => {
    return apiClient.get(`${API_URL}/assets-by-status`, {
      headers: getAuthHeader()
    });
  },

  getAssetsByLocation: () => {
    return apiClient.get(`${API_URL}/assets-by-location`, {
      headers: getAuthHeader()
    });
  },

  getAssetsByCategory: () => {
    return apiClient.get(`${API_URL}/assets-by-category`, {
      headers: getAuthHeader()
    });
  },

  getAssetsByDepartment: () => {
    return apiClient.get(`${API_URL}/assets-by-department`, {
      headers: getAuthHeader()
    });
  },

  getWarrantyExpiring: () => {
    return apiClient.get(`${API_URL}/warranty-expiring`, {
      headers: getAuthHeader()
    });
  },

  // Export functions
  exportAssetsMaster: () => {
    return apiClient.get(`${API_URL}/export/assets-master`, {
      responseType: 'blob',
      headers: getAuthHeader()
    });
  },

  exportWarrantyExpiring: () => {
    return apiClient.get(`${API_URL}/export/warranty-expiring`, {
      responseType: 'blob',
      headers: getAuthHeader()
    });
  }
};

export default reportsService;
