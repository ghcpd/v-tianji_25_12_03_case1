import { create } from 'zustand'
import { User } from '../types'

interface UserState {
  currentUser: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  logout: () => void
  updatePreferences: (preferences: Partial<User['preferences']>) => void
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: (() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })(),
  isAuthenticated: !!localStorage.getItem('user'),
  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('authToken', 'mock-token-' + user.id)
    } else {
      localStorage.removeItem('user')
      localStorage.removeItem('authToken')
    }
    set({ currentUser: user, isAuthenticated: !!user })
  },
  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('authToken')
    set({ currentUser: null, isAuthenticated: false })
  },
  updatePreferences: (preferences) =>
    set((state) => {
      const updatedUser = state.currentUser
        ? {
            ...state.currentUser,
            preferences: {
              ...state.currentUser.preferences,
              ...preferences,
            },
          }
        : null
      if (updatedUser) {
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }
      return { currentUser: updatedUser }
    }),
}))

