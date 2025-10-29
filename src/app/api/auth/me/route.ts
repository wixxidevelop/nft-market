import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-modern'
import { apiResponse } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  try {
    // Authenticate user with modern auth system
    const authResult = await authenticateUser(request)
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      )
    }

    const { user } = authResult

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return user data in standard apiResponse format
    return apiResponse({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        bio: user.bio,
        walletAddress: user.walletAddress,
        role: user.role,
        isActive: user.isActive,
        isSuspended: user.isSuspended,
        isVerified: user.isVerified,
        isAdmin: user.isAdmin,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
      }
    })

  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { status: 200 });
}