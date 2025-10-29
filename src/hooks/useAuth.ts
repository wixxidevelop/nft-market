'use client'

import { useAuth as useAuthContext } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function useAuth() {
  const auth = useAuthContext()
  const router = useRouter()

  const requireAuth = useCallback((redirectTo = '/auth/login') => {
    if (!auth.isAuthenticated) {
      router.push(redirectTo)
      return false
    }
    return true
  }, [auth.isAuthenticated, router])

  const requireRole = useCallback((roles: string | string[], redirectTo = '/unauthorized') => {
    if (!auth.isAuthenticated) {
      router.push('/auth/login')
      return false
    }

    if (!auth.hasRole(roles)) {
      router.push(redirectTo)
      return false
    }

    return true
  }, [auth.isAuthenticated, auth.hasRole, router])

  const isAdmin = useCallback(() => {
    return auth.hasRole('ADMIN')
  }, [auth.hasRole])

  const isModerator = useCallback(() => {
    return auth.hasRole(['MODERATOR', 'ADMIN'])
  }, [auth.hasRole])

  const canAccess = useCallback((resource: string) => {
    // Define resource-based permissions
    const permissions = {
      'admin-panel': ['ADMIN'],
      'moderator-panel': ['MODERATOR', 'ADMIN'],
      'user-management': ['ADMIN'],
      'content-moderation': ['MODERATOR', 'ADMIN'],
      'system-settings': ['ADMIN'],
      'analytics': ['MODERATOR', 'ADMIN'],
    }

    const requiredRoles = permissions[resource as keyof typeof permissions]
    return requiredRoles ? auth.hasRole(requiredRoles) : true
  }, [auth.hasRole])

  return {
    ...auth,
    requireAuth,
    requireRole,
    isAdmin,
    isModerator,
    canAccess,
  }
}

export default useAuth