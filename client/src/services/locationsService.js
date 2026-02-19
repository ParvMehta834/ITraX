import apiClient from './apiClient';

const API_URL = '/api/locations';

const getAuthHeader = () => {
  const token = localStorage.getItem('itrax_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const locationsService = {
  getLocations: (params = {}) => {
    return apiClient.get(API_URL, {
      params,
      headers: getAuthHeader()
    });
  },

  getLocationById: (id) => {
    return apiClient.get(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
  },

  createLocation: (locationData) => {
    return apiClient.post(API_URL, locationData, {
      headers: getAuthHeader()
    });
  },

  updateLocation: (id, locationData) => {
    return apiClient.put(`${API_URL}/${id}`, locationData, {
      headers: getAuthHeader()
    });
  },

  deleteLocation: (id) => {
    return apiClient.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
  },

  exportLocations: (params = {}) => {
    return apiClient.get(`${API_URL}/export/download`, {
      params,
      responseType: 'blob',
      headers: getAuthHeader()
    });
  }
};

export default locationsService;
