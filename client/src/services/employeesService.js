import apiClient from './apiClient';

const API_URL = '/api/employee';
const ADMIN_API_URL = '/api/admin/employees';

const getAuthHeader = () => {
  const token = localStorage.getItem('itrax_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const employeesService = {
  getEmployees: (params = {}) => {
    return apiClient.get(ADMIN_API_URL, {
      params,
      headers: getAuthHeader()
    }).then(res => res.data);
  },

  getEmployeeById: (id) => {
    return apiClient.get(`${ADMIN_API_URL}/${id}`, {
      headers: getAuthHeader()
    }).then(res => res.data.data || res.data);
  },

  createEmployee: (employeeData) => {
    return apiClient.post(ADMIN_API_URL, employeeData, {
      headers: getAuthHeader()
    }).then(res => res.data);
  },

  updateEmployee: (id, employeeData) => {
    return apiClient.put(`${ADMIN_API_URL}/${id}`, employeeData, {
      headers: getAuthHeader()
    }).then(res => res.data.data || res.data);
  },

  deleteEmployee: (id) => {
    return apiClient.delete(`${ADMIN_API_URL}/${id}`, {
      headers: getAuthHeader()
    }).then(res => res.data);
  },

  exportEmployees: (params = {}) => {
    return apiClient.get(`${ADMIN_API_URL}/export/download`, {
      params,
      responseType: 'blob',
      headers: getAuthHeader()
    });
  }
};

export default employeesService;
