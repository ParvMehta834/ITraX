import apiClient from './apiClient';
import { getAuthToken } from '../utils/authStorage';

const API_URL = '/api/locations';

const getAuthHeader = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const locationsService = {
  getLocations: (params = {}) => {
    return apiClient.get(API_URL, {
      params,
      headers: getAuthHeader()
    }).then(res => res.data);
  },

  getLocationById: (id) => {
    return apiClient.get(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    }).then(res => res.data?.data ?? res.data);
  },

  createLocation: (locationData) => {
    return apiClient.post(API_URL, locationData, {
      headers: getAuthHeader()
    }).then(res => res.data?.data ?? res.data);
  },

  updateLocation: (id, locationData) => {
    return apiClient.put(`${API_URL}/${id}`, locationData, {
      headers: getAuthHeader()
    }).then(res => res.data?.data ?? res.data);
  },

  deleteLocation: (id) => {
    return apiClient.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    }).then(res => res.data);
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
