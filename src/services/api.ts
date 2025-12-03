import { Product, Order, Review } from '../types'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api'
const REQUEST_TIMEOUT = 10000

interface ApiResponse<T> {
  data: T
  status: number
  statusText: string
}

interface ApiError {
  response?: {
    status: number
    data?: any
  }
  code?: string
  message?: string
}

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('authToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const handleApiError = (error: ApiError): never => {
  if (error.response?.status === 401) {
    localStorage.removeItem('authToken')
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  } else if (error.response?.status && error.response.status >= 500) {
    console.error('Server error:', error)
  } else if (error.code === 'ECONNABORTED') {
    console.error('Request timeout')
  }
  throw error
}

const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const url = `${API_BASE_URL}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error: ApiError = {
        response: {
          status: response.status,
          data: await response.json().catch(() => null),
        },
        message: response.statusText,
      }
      handleApiError(error)
    }

    const data = await response.json()
    return {
      data,
      status: response.status,
      statusText: response.statusText,
    }
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      handleApiError({ code: 'ECONNABORTED', message: 'Request timeout' })
    }
    throw error
  }
}

export const productService = {
  getAll: async (): Promise<Product[]> => {
    const response = await apiRequest<Product[]>('/products')
    return response.data
  },
  
  getById: async (id: string): Promise<Product> => {
    const response = await apiRequest<Product>(`/products/${id}`)
    return response.data
  },
  
  search: async (query: string): Promise<Product[]> => {
    const params = new URLSearchParams({ q: query })
    const response = await apiRequest<Product[]>(`/products/search?${params}`)
    return response.data
  },
  
  getByCategory: async (category: string): Promise<Product[]> => {
    const params = new URLSearchParams({ category })
    const response = await apiRequest<Product[]>(`/products?${params}`)
    return response.data
  },
}

export const orderService = {
  create: async (orderData: Partial<Order>): Promise<Order> => {
    const response = await apiRequest<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    })
    return response.data
  },
  
  getByUser: async (userId: string): Promise<Order[]> => {
    const response = await apiRequest<Order[]>(`/orders/user/${userId}`)
    return response.data
  },
  
  getById: async (id: string): Promise<Order> => {
    const response = await apiRequest<Order>(`/orders/${id}`)
    return response.data
  },
}

export const reviewService = {
  create: async (productId: string, review: Partial<Review>): Promise<Review> => {
    const response = await apiRequest<Review>(`/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(review),
    })
    return response.data
  },
  
  update: async (reviewId: string, review: Partial<Review>): Promise<Review> => {
    const response = await apiRequest<Review>(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(review),
    })
    return response.data
  },
  
  delete: async (reviewId: string): Promise<void> => {
    await apiRequest<void>(`/reviews/${reviewId}`, {
      method: 'DELETE',
    })
  },
}

