import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'
import { isSupabaseConfigured } from '../services/supabase'
import { UserProfile, UserRole } from '../types'

interface AuthContextType {
  currentUser: UserProfile | null
  role: UserRole
  isLoading: boolean
  isDemoMode: boolean
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>
  register: (params: Parameters<typeof authService.register>[0]) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  switchRole: (role: UserRole) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const isDemo = !isSupabaseConfigured()

  const refreshUser = async () => {
    try {
      const user = await authService.getCurrentUser()
      setCurrentUser(user)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const login = async (email: string, password?: string) => {
    setIsLoading(true)
    try {
      const res = await authService.login(email, password)
      if (res.user) {
        setCurrentUser(res.user)
        return { success: true }
      }
      return { success: false, error: res.error || 'Failed to authenticate' }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (params: Parameters<typeof authService.register>[0]) => {
    setIsLoading(true)
    try {
      const res = await authService.register(params)
      if (res.user) {
        setCurrentUser(res.user)
        return { success: true }
      }
      return { success: false, error: res.error || 'Registration failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    await authService.logout()
    setCurrentUser(null)
  }

  const switchRole = (role: UserRole) => {
    const updated = authService.switchDemoRole(role)
    setCurrentUser(updated)
  }

  const role: UserRole = currentUser?.role || 'donor'

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isLoading,
        isDemoMode: isDemo,
        login,
        register,
        logout,
        switchRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
