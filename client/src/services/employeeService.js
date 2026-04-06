import apiClient from './apiClient'
import { buildApiUrl } from '../utils/apiUrl'

const employeeService = {
  async getAssets(params = {}) {
    const res = await apiClient.get(buildApiUrl('/assets'), { params })
    return res.data
  },

  async getOrders(params = {}) {
    const res = await apiClient.get(buildApiUrl('/orders'), { params })
    return res.data
  },

  async getLicenses(params = {}) {
    const res = await apiClient.get(buildApiUrl('/licenses'), { params })
    return res.data
  },

  async getCategories(params = {}) {
    const res = await apiClient.get(buildApiUrl('/categories'), { params })
    return res.data
  },

  async getProfile() {
    const res = await apiClient.get(buildApiUrl('/auth/me'))
    return res.data
  },

  async updateProfile(payload) {
    const res = await apiClient.put(buildApiUrl('/auth/me'), payload)
    return res.data
  },

  async createCategoryRequest(payload) {
    const res = await apiClient.post(buildApiUrl('/reports/requests'), payload)
    return res.data
  },

  async getReports() {
    const res = await apiClient.get(buildApiUrl('/reports/assets'))
    return res.data
  }
}

export default employeeService
