import { NextRequest, NextResponse } from 'next/server'
import { applyMiddleware, apiResponse, errorResponse, rateLimit, getClientIP } from '@/lib/middleware'
import { userLoginSchema } from '@/lib/validation'
import { loginUser, setAuthCookies } from '@/lib/auth-modern'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    // Apply middleware (CORS, logging)
    const middlewareResult = await applyMiddleware(request)
    if (middlewareResult) return middlewareResult

    const rawBody = await request.json()

    // Backward compatibility: support { email, password } by mapping to emailOrUsername
    const body = rawBody && typeof rawBody === 'object' && 'email' in rawBody
      ? { emailOrUsername: rawBody.email, password: rawBody.password, rememberMe: rawBody.rememberMe ?? false }
      : rawBody
    
    // Validate request body
    const validation = userLoginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { emailOrUsername, password, rememberMe } = validation.data

    // Get client info for session tracking
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'Unknown'

    // Attempt login with modern auth system
    const result = await loginUser(emailOrUsername, password, rememberMe, userAgent, ipAddress)
    
    if (!result.success) {
      // If this is a server error, return 500 and do not rate limit
      if (result.code === 'SERVER_ERROR') {
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      }

      // Apply rate limiting ONLY on invalid login attempts
      const clientIP = getClientIP(request)
      const limitOk = rateLimit(`login:${clientIP}`, 5, 60 * 1000)
      if (!limitOk) {
        return errorResponse('Too many login attempts. Please try again later.', 429)
      }

      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }

    const { user, tokens } = result

    if (!user || !tokens) {
      return NextResponse.json(
        { error: 'Authentication failed - missing user data' },
        { status: 500 }
      )
    }

    // Generate CSRF token
    const csrfToken = 'csrf-token-placeholder'

    // Create response with enhanced user data
    const response = apiResponse({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      token: tokens.accessToken,
    })

    // Set secure JWT cookies (access + refresh)
    setAuthCookies(response, tokens, rememberMe) 

    // CSRF token
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
      path: '/',
    })

    // User data (non-sensitive, client-accessible)
    response.cookies.set('user-data', JSON.stringify({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
      isVerified: user.isVerified,
      twoFactorEnabled: user.twoFactorEnabled,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
      path: '/',
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { status: 200 });
}