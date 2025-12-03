export const API_ENDPOINTS = {
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (id: string) => `/products/${id}`,
  PRODUCT_SEARCH: '/products/search',
  ORDERS: '/orders',
  ORDER_DETAIL: (id: string) => `/orders/${id}`,
  USER_ORDERS: (userId: string) => `/orders/user/${userId}`,
  REVIEWS: (productId: string) => `/products/${productId}/reviews`,
  REVIEW_DETAIL: (reviewId: string) => `/reviews/${reviewId}`,
}

export const CART_STORAGE_KEY = 'cart-items'
export const USER_STORAGE_KEY = 'user'
export const AUTH_TOKEN_KEY = 'authToken'

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const

export const MAX_CART_QUANTITY = 99
export const MIN_CART_QUANTITY = 1

export const DEBOUNCE_DELAY = 300
export const CACHE_TTL = 5 * 60 * 1000

