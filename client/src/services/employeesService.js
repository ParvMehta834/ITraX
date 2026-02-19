import apiClient from './apiClient';

const API_URL = '/api/employee';

const getAuthHeader = () => {
  const token = localStorage.getItem('itrax_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const employeesService = {
  getEmployees: (params = {}) => {
    return apiClient.get(API_URL, {
      params,
      headers: getAuthHeader()
    }).then(res => res.data);
  },

  getEmployeeById: (id) => {
    return apiClient.get(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    }).then(res => res.data.data);
  },

  createEmployee: (employeeData) => {
    return apiClient.post(API_URL, employeeData, {
      headers: getAuthHeader()
    }).then(res => res.data.data);
  },

  updateEmployee: (id, employeeData) => {
    return apiClient.put(`${API_URL}/${id}`, employeeData, {
      headers: getAuthHeader()
    }).then(res => res.data.data);
  },

  deleteEmployee: (id) => {
    return apiClient.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    }).then(res => res.data);
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
