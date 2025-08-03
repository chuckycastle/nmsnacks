import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import { toast } from 'react-hot-toast'

interface User {
  id: string
  username: string
  email: string
  name: string
  role: 'ADMIN' | 'SELLER' | 'CUSTOMER'
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          // Validate token and get user info
          const response = await authApi.validateToken()
          if (response.success) {
            setUser(response.data.user)
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
          }
        } catch (error) {
          // Token validation failed
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      }
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const response = await authApi.login(username, password)
      
      if (response.success) {
        const { user, accessToken, refreshToken } = response.data
        
        // Store tokens
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        
        // Set user state
        setUser(user)
        
        toast.success(`Welcome back, ${user.name}!`)
        navigate('/dashboard')
      } else {
        throw new Error(response.error || 'Login failed')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed'
      toast.error(errorMessage)
      throw error
    }
  }

  const logout = async () => {
    try {
      // Call logout endpoint
      await authApi.logout()
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error)
    } finally {
      // Clear local state and tokens
      setUser(null)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      
      toast.success('Logged out successfully')
      navigate('/login')
    }
  }

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await authApi.refreshToken(refreshToken)
      
      if (response.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data
        
        // Update stored tokens
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', newRefreshToken)
        
        return
      } else {
        throw new Error('Token refresh failed')
      }
    } catch (error) {
      // Refresh failed, log out user
      setUser(null)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      navigate('/login')
      throw error
    }
  }

  const value = {
    user,
    isLoading,
    login,
    logout,
    refreshToken
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}