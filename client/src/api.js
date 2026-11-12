import axios from 'axios'

// Override per environment with VITE_API_BASE_URL (e.g. an https URL behind a proxy)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api'

// Path segments built from ids must be escaped so a value can't change the request path
const seg = (value) => encodeURIComponent(String(value))

const buildParams = (filters, keys) => {
  const params = new URLSearchParams()
  for (const key of keys) {
    if (filters[key] && filters[key] !== 'all') params.append(key, filters[key])
  }
  return params.toString()
}

// GET helper. `signal` (an AbortSignal) lets callers cancel requests that are no longer needed.
const get = async (path, { signal } = {}) => {
  const response = await axios.get(`${API_BASE_URL}${path}`, { signal })
  return response.data
}

export const api = {
  getInventory(filters = {}, options) {
    return get(`/inventory?${buildParams(filters, ['warehouse', 'category'])}`, options)
  },

  getInventoryItem(id, options) {
    return get(`/inventory/${seg(id)}`, options)
  },

  getOrders(filters = {}, options) {
    return get(`/orders?${buildParams(filters, ['warehouse', 'category', 'status', 'month'])}`, options)
  },

  getOrder(id, options) {
    return get(`/orders/${seg(id)}`, options)
  },

  getDemandForecasts(options) {
    return get('/demand', options)
  },

  getBacklog(options) {
    return get('/backlog', options)
  },

  getDashboardSummary(filters = {}, options) {
    return get(`/dashboard/summary?${buildParams(filters, ['warehouse', 'category', 'status', 'month'])}`, options)
  },

  getSpendingSummary(options) {
    return get('/spending/summary', options)
  },

  getMonthlySpending(options) {
    return get('/spending/monthly', options)
  },

  getCategorySpending(options) {
    return get('/spending/categories', options)
  },

  getTransactions(options) {
    return get('/spending/transactions', options)
  },

  getQuarterlyReports(filters = {}, options) {
    return get(`/reports/quarterly?${buildParams(filters, ['warehouse', 'category', 'status', 'month'])}`, options)
  },

  getMonthlyTrends(filters = {}, options) {
    return get(`/reports/monthly-trends?${buildParams(filters, ['warehouse', 'category', 'status', 'month'])}`, options)
  },

  getTasks(options) {
    return get('/tasks', options)
  },

  async createTask(taskData) {
    const response = await axios.post(`${API_BASE_URL}/tasks`, taskData)
    return response.data
  },

  async deleteTask(taskId) {
    const response = await axios.delete(`${API_BASE_URL}/tasks/${seg(taskId)}`)
    return response.data
  },

  async toggleTask(taskId) {
    const response = await axios.patch(`${API_BASE_URL}/tasks/${seg(taskId)}`)
    return response.data
  },

  async createPurchaseOrder(purchaseOrderData) {
    const response = await axios.post(`${API_BASE_URL}/purchase-orders`, purchaseOrderData)
    return response.data
  },

  getPurchaseOrderByBacklogItem(backlogItemId, options) {
    return get(`/purchase-orders/${seg(backlogItemId)}`, options)
  }
}
