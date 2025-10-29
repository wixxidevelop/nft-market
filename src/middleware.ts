import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth-modern'

// Define protected routes and their required roles
const protectedRoutes = {
  '/api/admin': ['ADMIN'],
  '/api/moderator': ['MODERATOR', 'ADMIN'],
  '/api/user': ['USER', 'MODERATOR', 'ADMIN'],
}

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/dashboard',
  // Auth APIs that must be accessible without an access token
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/refresh',
  // Health check endpoint should be public
  '/api/health',
  // Public pages
  '/marketplace',
  '/collections',
  '/nft',
]

// API routes that need CSRF protection
const csrfProtectedRoutes = [
  '/api/auth/logout',
  '/api/user',
  '/api/admin',
  '/api/moderator',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check for authentication token
  const cookieToken = request.cookies.get('access-token')?.value
    || request.cookies.get('auth-token')?.value
    || null;
  const headerAuth = request.headers.get('authorization');
  const headerToken = headerAuth?.startsWith('Bearer ')
    ? headerAuth.slice(7)
    : null;
  const token = cookieToken || headerToken;

  if (!token) {
    // Redirect to login for protected pages
    if (!pathname.startsWith('/api/')) {
      console.log("BAck to sender")
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Return 401 for API routes
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  // Verify token and get user
  try {
    const payload = await verifyAccessToken(token)
    
    if (!payload || !payload.userId) {
      throw new Error('Invalid token payload')
    }

    // Check if route requires specific role
    const requiredRoles = getRequiredRoles(pathname)
    if (requiredRoles.length > 0) {
      const userRole = payload.role || 'USER'
      
      if (!requiredRoles.includes(userRole)) {
        // Redirect to unauthorized page for web routes
        if (!pathname.startsWith('/api/')) {
          return NextResponse.redirect(new URL('/unauthorized', request.url))
        }
        
        // Return 403 for API routes
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    // CSRF Protection for state-changing API requests
    if (csrfProtectedRoutes.some(route => pathname.startsWith(route))) {
      const method = request.method
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        const csrfToken = request.headers.get('x-csrf-token')
        const sessionCsrfToken = request.cookies.get('csrf-token')?.value
        
        if (!csrfToken || !sessionCsrfToken || csrfToken !== sessionCsrfToken) {
          return NextResponse.json(
            { error: 'CSRF token mismatch' },
            { status: 403 }
          )
        }
      }
    }

    // Add user info to request headers for API routes
    const response = NextResponse.next()
    response.headers.set('x-user-id', payload.userId)
    response.headers.set('x-user-role', payload.role || 'USER')
    response.headers.set('x-user-email', payload.email || '')

    return response

  } catch (error) {
    console.error('Middleware auth error:', error)
    
    // Clear invalid token
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      : NextResponse.redirect(new URL('/auth/login', request.url))
    
    response.cookies.delete('auth-token')
    response.cookies.delete('access-token')
    response.cookies.delete('refresh-token')
    response.cookies.delete('user-data')
    
    return response
  }
}

function getRequiredRoles(pathname: string): string[] {
  for (const [route, roles] of Object.entries(protectedRoutes)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return roles
    }
  }
  return []
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}