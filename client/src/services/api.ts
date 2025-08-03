import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { toast } from 'react-hot-toast'

// Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Base API configuration  
const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: `${BASE_URL}/api/v1`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor - handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = localStorage.getItem('refresh_token')
            if (refreshToken) {
              const response = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
                refreshToken
              })

              if (response.data.success) {
                const { accessToken, refreshToken: newRefreshToken } = response.data.data
                localStorage.setItem('access_token', accessToken)
                localStorage.setItem('refresh_token', newRefreshToken)

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${accessToken}`
                return this.client(originalRequest)
              }
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        // Handle other errors
        if (error.response?.status >= 500) {
          toast.error('Server error. Please try again later.')
        } else if (error.response?.status === 403) {
          toast.error('Access denied. You do not have permission for this action.')
        } else if (error.code === 'ECONNABORTED') {
          toast.error('Request timeout. Please check your connection.')
        }

        return Promise.reject(error)
      }
    )
  }

  // Generic request methods
  async get<T = any>(url: string, params?: any): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, { params })
    return response.data
  }

  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data)
    return response.data
  }

  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data)
    return response.data
  }

  async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.patch(url, data)
    return response.data
  }

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url)
    return response.data
  }

  // Upload file method
  async upload<T = any>(url: string, formData: FormData): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }
}

// Create API client instance
const apiClient = new ApiClient()

// Authentication API
export const authApi = {
  login: (username: string, password: string) =>
    apiClient.post('/auth/login', { username, password }),
  
  logout: () =>
    apiClient.post('/auth/logout'),
  
  refreshToken: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),
  
  validateToken: () =>
    apiClient.get('/auth/validate'),
  
  getProfile: () =>
    apiClient.get('/auth/profile'),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post('/auth/change-password', { currentPassword, newPassword }),
}

// Products API
export const productsApi = {
  getProducts: (params?: {
    page?: number
    limit?: number
    q?: string
    category?: string
    inStock?: boolean
    lowStock?: boolean
  }) => apiClient.get<PaginatedResponse>('/products', params),
  
  getProduct: (id: string) =>
    apiClient.get(`/products/${id}`),
  
  createProduct: (data: {
    name: string
    salePrice: number
    cost: number
    stock?: number
    category?: string
    sku?: string
    barcode?: string
  }) => apiClient.post('/products', data),
  
  updateProduct: (id: string, data: Partial<{
    name: string
    salePrice: number
    cost: number
    stock: number
    category: string
    sku: string
    barcode: string
  }>) => apiClient.put(`/products/${id}`, data),
  
  deleteProduct: (id: string) =>
    apiClient.delete(`/products/${id}`),
  
  uploadImage: (id: string, file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return apiClient.upload(`/products/${id}/image`, formData)
  },
  
  updateStock: (id: string, quantity: number, operation: 'add' | 'subtract') =>
    apiClient.patch(`/products/${id}/stock`, { quantity, operation }),
  
  getCategories: () =>
    apiClient.get('/products/categories'),
  
  getLowStock: (threshold?: number) =>
    apiClient.get('/products/low-stock', { threshold }),
  
  getBestSellers: (limit?: number) =>
    apiClient.get('/products/best-sellers', { limit }),
}

// Sales API
export const salesApi = {
  getSales: (params?: {
    page?: number
    limit?: number
    startDate?: string
    endDate?: string
    customerId?: string
    sellerId?: string
  }) => apiClient.get<PaginatedResponse>('/sales', params),
  
  getSale: (id: string) =>
    apiClient.get(`/sales/${id}`),
  
  createSale: (data: {
    items: Array<{
      productId: string
      quantity: number
      unitSalePrice: number
    }>
    customerId?: string
    paymentMethod?: string
    notes?: string
  }) => apiClient.post('/sales', data),
  
  updateSaleStatus: (id: string, status: 'PAID' | 'NOT_PAID' | 'REFUNDED', notes?: string) =>
    apiClient.patch(`/sales/${id}/status`, { paymentStatus: status, notes }),
  
  getTransaction: (batchId: string) =>
    apiClient.get(`/sales/transaction/${batchId}`),
  
  getAnalytics: (startDate?: string, endDate?: string) =>
    apiClient.get('/sales/analytics', { startDate, endDate }),
  
  getRecentTransactions: (limit?: number) =>
    apiClient.get('/sales/recent', { limit }),
  
  getDailySummary: () =>
    apiClient.get('/sales/daily-summary'),
  
  generateReceipt: (batchId: string) =>
    apiClient.get(`/sales/receipt/${batchId}`),
}

// Customers API
export const customersApi = {
  getCustomers: (params?: {
    page?: number
    limit?: number
    q?: string
    hasCredit?: boolean
  }) => apiClient.get<PaginatedResponse>('/customers', params),
  
  getCustomer: (id: string) =>
    apiClient.get(`/customers/${id}`),
  
  createCustomer: (data: {
    name: string
    email?: string
    phone?: string
    creditBalance?: number
  }) => apiClient.post('/customers', data),
  
  updateCustomer: (id: string, data: Partial<{
    name: string
    email: string
    phone: string
    creditBalance: number
  }>) => apiClient.put(`/customers/${id}`, data),
  
  deleteCustomer: (id: string) =>
    apiClient.delete(`/customers/${id}`),
  
  updateCredit: (id: string, amount: number, operation: 'add' | 'subtract', reason?: string) =>
    apiClient.patch(`/customers/${id}/credit`, { amount, operation, reason }),
  
  searchCustomers: (q: string) =>
    apiClient.get('/customers/search', { q }),
  
  getTopCustomers: (limit?: number) =>
    apiClient.get('/customers/top-customers', { limit }),
  
  getCustomersWithCredit: () =>
    apiClient.get('/customers/with-credit'),
}

// Export the API client for custom requests
export default apiClient