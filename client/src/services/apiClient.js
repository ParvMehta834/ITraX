  import axios from 'axios';

const apiClient = axios.create();

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('itrax_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error || {};
    if (!response || response.status !== 401 || !config || config._retry) {
      return Promise.reject(error);
    }

    const url = config.url || '';
    if (url.includes('/api/auth/login') || url.includes('/api/auth/signup') || url.includes('/api/auth/refresh')) {
      return Promise.reject(error);
    }

    config._retry = true;
    try {
      const refreshResponse = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
      const newToken = refreshResponse?.data?.token;
      if (!newToken) throw new Error('Refresh did not return a token');
      localStorage.setItem('itrax_token', newToken);
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(config);
    } catch (refreshError) {
      localStorage.removeItem('itrax_token');
      localStorage.removeItem('itrax_user');
      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;