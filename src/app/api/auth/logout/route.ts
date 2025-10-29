import { NextRequest, NextResponse } from 'next/server'
import { logoutUser, verifyAccessToken } from '@/lib/auth-modern'

export async function POST(request: NextRequest) {
  try {
    // Get tokens from cookies
    const accessToken = request.cookies.get('auth-token')?.value
    const refreshToken = request.cookies.get('refresh-token')?.value

    // Logout user (invalidate session)
    if (accessToken) {
      // Extract session ID from access token to logout properly
      try {
        const decoded = await verifyAccessToken(accessToken);
        if (decoded?.sessionId) {
          await logoutUser(decoded.sessionId);
        }
      } catch (error) {
        console.error('Error extracting session ID:', error);
      }
    }

    // Create response
    const response = NextResponse.json({
      message: 'Logout successful'
    })

    // Clear all authentication cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      expires: new Date(0) // Set to past date to delete
    }

    response.cookies.set('auth-token', '', cookieOptions)
     response.cookies.set('access-token', '', cookieOptions)
     response.cookies.set('refresh-token', '', cookieOptions)
     response.cookies.set('csrf-token', '', { ...cookieOptions, httpOnly: false })
     response.cookies.set('user-data', '', { ...cookieOptions, httpOnly: false })

    return response

  } catch (error) {
    console.error('Logout error:', error)
    
    // Even if there's an error, clear the cookies
    const response = NextResponse.json({
      message: 'Logout completed'
    })

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      expires: new Date(0)
    }

    response.cookies.set('auth-token', '', cookieOptions)
    response.cookies.set('access-token', '', cookieOptions)
    response.cookies.set('refresh-token', '', cookieOptions)
    response.cookies.set('csrf-token', '', { ...cookieOptions, httpOnly: false })
    response.cookies.set('user-data', '', { ...cookieOptions, httpOnly: false })

    return response
  }
}