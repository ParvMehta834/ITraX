import apiClient from './apiClient';

const API_URL = '/api/admin/employees';

const getAuthHeader = () => {
  const token = localStorage.getItem('itrax_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const employeesService = {
  getEmployees: (params = {}) => {
    return apiClient.get(API_URL, {
      params,
      headers: getAuthHeader()
    });
  },

  getEmployeeById: (id) => {
    return apiClient.get(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
  },

  createEmployee: (employeeData) => {
    return apiClient.post(API_URL, employeeData, {
      headers: getAuthHeader()
    });
  },

  updateEmployee: (id, employeeData) => {
    return apiClient.put(`${API_URL}/${id}`, employeeData, {
      headers: getAuthHeader()
    });
  },

  deleteEmployee: (id) => {
    return apiClient.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
  },

  exportEmployees: (params = {}) => {
    return apiClient.get(`${API_URL}/export/download`, {
      params,
      responseType: 'blob',
      headers: getAuthHeader()
    });
  }
};

export default employeesService;
