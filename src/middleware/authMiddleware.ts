import { useUserStore } from '../store/userStore'

export const requireAuth = (callback: () => void) => {
  const { isAuthenticated } = useUserStore.getState()
  if (!isAuthenticated) {
    window.location.href = '/login'
    return
  }
  callback()
}

export const checkAuth = (): boolean => {
  const token = localStorage.getItem('authToken')
  return !!token
}

export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('authToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

