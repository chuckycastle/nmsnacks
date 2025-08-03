// Core entity types
export interface User {
  id: string
  username: string
  email: string
  name: string
  role: 'ADMIN' | 'SELLER' | 'CUSTOMER'
  isActive: boolean
  lastLogin: string | null
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  creditBalance: number | string // API returns as string, needs conversion
  purchaseCount?: number
  totalSpent?: number | string
  lastPurchaseDate?: string | null
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  name: string
  description?: string | null
  salePrice: number | string
  cost: number | string
  stock: number
  minStock: number
  category?: string | null
  categoryId?: string | null
  sku?: string | null
  barcode?: string | null
  imageLink?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Sale {
  id: string
  productId: string
  quantity: number
  unitSalePrice: number | string
  totalAmount: number | string
  sellerId: string
  customerId?: string | null
  paymentMethod?: string | null
  paymentStatus: 'PENDING' | 'PAID' | 'NOT_PAID' | 'REFUNDED'
  notes?: string | null
  posBatch?: string | null
  saleDate: string
  createdAt: string
  updatedAt: string
  // Relations
  product?: Product
  customer?: Customer
  seller?: User
}

export interface Category {
  id: string
  name: string
  description?: string | null
  createdAt: string
  updatedAt: string
}

// API Response types
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

// Form data types
export interface LoginForm {
  username: string
  password: string
}

export interface CustomerFormData {
  name: string
  email?: string
  phone?: string
  creditBalance?: number
}

export interface ProductFormData {
  name: string
  description?: string
  salePrice: number
  cost: number
  stock?: number
  minStock?: number
  categoryId?: string
  sku?: string
  barcode?: string
}

export interface SaleItemData {
  productId: string
  quantity: number
  unitSalePrice: number
}

export interface SaleFormData {
  items: SaleItemData[]
  customerId?: string
  paymentMethod?: string
  notes?: string
}

// Chart and analytics types
export interface SalesAnalytics {
  summary: {
    totalSales: number
    totalRevenue: number
    totalQuantity: number
    avgOrderValue: number
  }
  topProducts: {
    productId: string
    quantity: number
    totalAmount: number
    transactionCount: number
    product?: Product
  }[]
  salesByDate: {
    date: string
    transaction_count: number
    revenue: number
    quantity_sold: number
  }[]
}

export interface SalesTransaction {
  posBatch: string
  totalAmount: number
  itemCount: number
  saleDate: string
  paymentStatus: string
  paymentMethod?: string
  customerId?: string
  customer?: Customer
  sellerId: string
  seller: User
  items: Sale[]
}

// Search and filter types
export interface CustomerSearchParams {
  page?: number
  limit?: number
  q?: string
  hasCredit?: boolean
}

export interface ProductSearchParams {
  page?: number
  limit?: number
  q?: string
  category?: string
  inStock?: boolean
  lowStock?: boolean
  minPrice?: number
  maxPrice?: number
}

export interface SaleSearchParams {
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
  customerId?: string
  sellerId?: string
  paymentStatus?: string
}

// UI State types
export interface PaginationState {
  page: number
  limit: number
  total: number
  pages: number
}

export interface LoadingState {
  isLoading: boolean
  error?: string | null
}

export interface ModalState {
  isOpen: boolean
  data?: any
}