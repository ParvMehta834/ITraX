import apiClient from './apiClient';

const API_URL = '/api/reports';

const getAuthHeader = () => {
  const token = localStorage.getItem('itrax_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const reportsService = {
  // Asset Reports
  getAssetReport: (params = {}) => {
    return apiClient.get(`${API_URL}/assets`, {
      params,
      headers: getAuthHeader()
    }).then(res => res.data);
  },

  // License Reports
  getLicenseReport: (params = {}) => {
    return apiClient.get(`${API_URL}/licenses`, {
      params,
      headers: getAuthHeader()
    }).then(res => res.data);
  },

  // Inventory Reports
  getInventoryReport: (params = {}) => {
    return apiClient.get(`${API_URL}/inventory`, {
      params,
      headers: getAuthHeader()
    }).then(res => res.data);
  },

  // Employee Reports
  getEmployeeReport: (params = {}) => {
    return apiClient.get(`${API_URL}/employees`, {
      params,
      headers: getAuthHeader()
    }).then(res => res.data);
  },

  // Tracking Reports
  getTrackingReport: (params = {}) => {
    return apiClient.get(`${API_URL}/tracking`, {
      params,
      headers: getAuthHeader()
    }).then(res => res.data);
  },

  // Update report
  updateReport: (id, reportData) => {
    return apiClient.put(`${API_URL}/${id}`, reportData, {
      headers: getAuthHeader()
    }).then(res => res.data.data);
  },

  // Delete report
  deleteReport: (id) => {
    return apiClient.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    }).then(res => res.data);
  },

  // Generic preview endpoint for the AdminReports page
  getReport: (reportId) => {
    const url = reportPreviewRoutes[reportId] || API_URL;
    return apiClient.get(url, {
      headers: getAuthHeader()
    }).then(res => res.data);
  },

  // Generic export endpoint for the AdminReports page
  exportReport: (reportId) => {
    const url = reportExportRoutes[reportId] || `${API_URL}/export/${reportId}`;
    return apiClient.get(url, {
      responseType: 'blob',
      headers: getAuthHeader()
    });
  },

  // Legacy report methods (for backward compatibility)
  getAssetsMaster: () => {
    return apiClient.get(`${API_URL}?reportType=ASSET`, {
      headers: getAuthHeader()
    }).then(res => res.data);
  },

  getAssetsByStatus: () => {
    return apiClient.get(`${API_URL}?reportType=ASSET&filter=status`, {
      headers: getAuthHeader()
    }).then(res => res.data);
  },

  getAssetsByLocation: () => {
    return apiClient.get(`${API_URL}?reportType=ASSET&filter=location`, {
      headers: getAuthHeader()
    }).then(res => res.data);
  },

  getAssetsByCategory: () => {
    return apiClient.get(`${API_URL}?reportType=ASSET&filter=category`, {
      headers: getAuthHeader()
    }).then(res => res.data);
  },

  getAssetsByDepartment: () => {
    return apiClient.get(`${API_URL}?reportType=ASSET&filter=department`, {
      headers: getAuthHeader()
    }).then(res => res.data);
  },

  getWarrantyExpiring: () => {
    return apiClient.get(`${API_URL}?reportType=LICENSE&filter=expiring`, {
      headers: getAuthHeader()
    }).then(res => res.data);
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
