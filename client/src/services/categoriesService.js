import apiClient from './apiClient';

const API_URL = '/api/categories';

const getAuthHeader = () => {
  const token = localStorage.getItem('itrax_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const categoriesService = {
  getCategories: (params = {}) => {
    return apiClient.get(API_URL, {
      params,
      headers: getAuthHeader()
    }).then(res => res.data);
  },

  getCategoryById: (id) => {
    return apiClient.get(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    }).then(res => res.data.data);
  },

  createCategory: (categoryData) => {
    return apiClient.post(API_URL, categoryData, {
      headers: getAuthHeader()
    }).then(res => res.data.data);
  },

  updateCategory: (id, categoryData) => {
    return apiClient.put(`${API_URL}/${id}`, categoryData, {
      headers: getAuthHeader()
    }).then(res => res.data.data);
  },

  deleteCategory: (id) => {
    return apiClient.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    }).then(res => res.data);
  },

  exportCategories: (params = {}) => {
    return apiClient.get(`${API_URL}/export/download`, {
      params,
      responseType: 'blob',
      headers: getAuthHeader()
    });
  }
};

export default categoriesService;
