import { NextRequest, NextResponse } from 'next/server'
import { refreshTokens } from '@/lib/auth-modern'

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshToken = request.cookies.get('refresh-token')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token not found' },
        { status: 401 }
      )
    }

    // Refresh the access token
    const result = await refreshTokens(refreshToken)

    if (!result.success) {
      // Clear invalid tokens
      const response = NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
      
      response.cookies.delete('auth-token')
      response.cookies.delete('access-token')
      response.cookies.delete('refresh-token')
      response.cookies.delete('user-data')
      response.cookies.delete('csrf-token')
      
      return response
    }

    const { user, tokens } = result

    if (!user || !tokens) {
      return NextResponse.json(
        { error: 'Invalid refresh result' },
        { status: 500 }
      )
    }

    // Generate new CSRF token (placeholder for now)
    const csrfToken = 'csrf-token-placeholder'

    // Create response
    const response = NextResponse.json({
      message: 'Token refreshed successfully',
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
      token: tokens.accessToken, // For backward compatibility
    })

    // Set new cookies
    const accessTokenMaxAge = 15 * 60 // 15 minutes
    const refreshTokenMaxAge = 7 * 24 * 60 * 60 // 7 days

    // New access token
    response.cookies.set('auth-token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: accessTokenMaxAge,
      path: '/'
    })

    // Also set modern access-token cookie for compatibility
    response.cookies.set('access-token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: accessTokenMaxAge,
      path: '/'
    })

    // New refresh token (if provided)
    if (tokens.refreshToken) {
      response.cookies.set('refresh-token', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: refreshTokenMaxAge,
        path: '/'
      })
    }

    // New CSRF token
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshTokenMaxAge,
      path: '/'
    })

    // Updated user data
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
      maxAge: refreshTokenMaxAge,
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}