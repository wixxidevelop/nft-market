'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

export interface User {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  role: 'USER' | 'MODERATOR' | 'ADMIN'
  isActive: boolean
  isVerified: boolean
  twoFactorEnabled: boolean
  createdAt: string
  lastLoginAt?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (emailOrUsername: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
  isAuthenticated: boolean
  hasRole: (role: string | string[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

interface ApiResponse {
  data?: {
    user?: User
    token?: string;
  }
  user?: User
  error?: string
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const isMountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const clearAuthData = useCallback(() => {
    // Clear cookies (will be handled by server)
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie = 'access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie = 'refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie = 'user-data=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie = 'csrf-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('token')
      localStorage.removeItem('user_data')
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('_auth_timestamp')
    }
  }, [])

  const getCookie = useCallback((name: string): string | null => {
    if (typeof document === 'undefined') return null
    
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null
    }
    return null
  }, [])

  const checkAuth = useCallback(async () => {
    const handleMeResponse = async (response: Response, isRetry = false): Promise<boolean> => {
      if (response.ok) {
        const payload: ApiResponse = await response.json()
        const userData = payload?.data?.user || payload?.user
        if (userData) {
          if (isMountedRef.current) {
            setUser(userData)
          }
          return true
        }
        if (process.env.NODE_ENV === 'development') {
          console.warn('Auth check succeeded but no user data in response')
        }
        clearAuthData()
        if (isMountedRef.current) {
          setUser(null)
        }
        return false
      }

      if (response.status === 401) {
        // Don't try to refresh if this is already a retry after refresh
        if (isRetry) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Auth check failed after refresh - user needs to login')
          }
          clearAuthData()
          if (isMountedRef.current) {
            setUser(null)
          }
          return false
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('Received 401, attempting token refresh...')
        }
        
        try {
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          })

          if (refreshRes.ok) {
            if (process.env.NODE_ENV === 'development') {
              console.log('Token refresh successful')
            }
            // The refresh endpoint should return user data
            const payload: ApiResponse = await refreshRes.json()
            const userData = payload?.data?.user || payload?.user
            if (userData) {
              if (isMountedRef.current) {
                setUser(userData)
              }
              return true
            }
            
            // Refresh succeeded but no user data, try /me again
            if (process.env.NODE_ENV === 'development') {
              console.log('Refresh succeeded, retrying /api/auth/me...')
            }
            const retryRes = await fetch('/api/auth/me', {
              method: 'GET',
              credentials: 'include',
            })
            return handleMeResponse(retryRes, true)
          } else if (refreshRes.status === 401) {
            // Refresh token is also invalid/expired - user needs to login
            if (process.env.NODE_ENV === 'development') {
              console.log('Refresh token expired - user needs to login')
            }
          } else {
            // Other refresh error
            if (process.env.NODE_ENV === 'development') {
              console.warn('Token refresh failed with status:', refreshRes.status)
            }
          }
        } catch (e) {
          // Network error during refresh
          if (process.env.NODE_ENV === 'development') {
            console.error('Token refresh request failed:', e)
          }
        }

        // If refresh failed or didn't return user data, clear auth
        clearAuthData()
        if (isMountedRef.current) {
          setUser(null)
        }
        return false
      }

      // Non-401 errors (500, 403, etc.)
      console.error('Auth check failed with status:', response.status)
      clearAuthData()
      if (isMountedRef.current) {
        setUser(null)
      }
      return false
    }

    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      })
      const ok = await handleMeResponse(response)
      if (ok) return
    } catch (error) {
      console.error('Auth check failed:', error)
      // Network error: small backoff and retry once
      try {
        await new Promise(r => setTimeout(r, 250))
        const retryRes = await fetch('/api/auth/me', { 
          method: 'GET', 
          credentials: 'include' 
        })
        const ok = await handleMeResponse(retryRes)
        if (ok) return
      } catch (e2) {
        console.error('Auth retry failed:', e2)
      }
      clearAuthData()
      if (isMountedRef.current) {
        setUser(null)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [clearAuthData])

  // Check authentication status on mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = useCallback(async (emailOrUsername: string, password: string, rememberMe = false) => {
    if (isMountedRef.current) {
      setLoading(true)
    }
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          emailOrUsername,
          password,
          rememberMe,
        }),
      })

      const payload: ApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Login failed')
      }

      const userData = payload?.data?.user || payload?.user
      if (userData && isMountedRef.current) {
        setUser(userData)
      }

      localStorage.setItem('token', payload?.data?.token || '')

      router.push('/dashboard')
    } catch (error) {
      throw error
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [router])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCookie('csrf-token') || '',
        },
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuthData()
      if (isMountedRef.current) {
        setUser(null)
      }
      router.push('/auth/login')
    }
  }, [clearAuthData, getCookie, router])

  const refreshAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const payload: ApiResponse = await response.json()
        const userData = payload?.data?.user || payload?.user
        if (userData && isMountedRef.current) {
          setUser(userData)
        }
      } else {
        clearAuthData()
        if (isMountedRef.current) {
          setUser(null)
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      clearAuthData()
      if (isMountedRef.current) {
        setUser(null)
      }
    }
  }, [clearAuthData])

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser(prevUser => prevUser ? { ...prevUser, ...userData } : null)
  }, [])

  const hasRole = useCallback((roles: string | string[]): boolean => {
    if (!user) return false
    
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }, [user])

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshAuth,
    updateUser,
    isAuthenticated: !!user,
    hasRole,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles?: string[]
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading, hasRole } = useAuth()
    const router = useRouter()
    const hasCheckedAuth = useRef(true)

    // useEffect(() => {
    //   if (!loading && !hasCheckedAuth.current) {
    //     hasCheckedAuth.current = true
        
    //     if (!user) {
    //       router.push('/auth/login')
    //       return
    //     }

    //     if (requiredRoles && !hasRole(requiredRoles)) {
    //       router.push('/unauthorized')
    //       return
    //     }
    //   }
    // }, [user, loading, hasRole, router])

    if (loading || (!user && !hasCheckedAuth.current)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-600">Checking authentication...</div>
        </div>
      )
    }

    if (!user) {
      return null
    }

    return <Component {...props} />
  }
}