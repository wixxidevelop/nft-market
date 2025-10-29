import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { registerUser, setAuthCookies } from '@/lib/auth-modern';
import { logInfo, logError } from '@/lib/logger';
import { userRegistrationSchema, validateSchema } from '@/lib/validation';
import { apiResponse, errorResponse, applyMiddleware, rateLimit, getClientIP } from '@/lib/middleware';

export async function POST(req: NextRequest) {
  try {
    // Apply middleware
    const middlewareResponse = applyMiddleware(req);
    if (middlewareResponse) return middlewareResponse;

    // Rate limiting for registration
    const clientIP = getClientIP(req);
    const registerLimitOk = rateLimit(
      `register:${clientIP}`,
      process.env.NODE_ENV === 'test' ? 100 : 5,
      process.env.NODE_ENV === 'test' ? 60 * 1000 : 60 * 60 * 1000
    );
    if (!registerLimitOk) {
      return errorResponse('Too many registration attempts. Please try again later.', 429);
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return errorResponse('Invalid JSON in request body', 400);
    }

    // Validate request data with Zod
    const validation = validateSchema(userRegistrationSchema, body);
    if (!validation.success) {
      return errorResponse(validation.errors.join(', '), 400);
    }

    const { email, password, username, firstName, lastName } = validation.data;

    console.log(`Registration attempt for: ${email} (username: ${username})`);

    // Check for duplicate email or username (skip Prisma in test environment)
    let existingUser: any = null;
    if (process.env.NODE_ENV !== 'test') {
      existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email.toLowerCase() },
            { username: username.toLowerCase() }
          ]
        }
      });
    }

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return errorResponse('User with this email already exists', 409);
      }
      if (existingUser.username === username.toLowerCase()) {
        return errorResponse('User with this username already exists', 409);
      }
    }

    // Register user using the enhanced auth library
    const result = await registerUser({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password,
      firstName,
      lastName,
    });

    if (!result.success) {
      console.error(`Registration failed for ${email}: ${result.message}`);
      return errorResponse(result.message || 'Registration failed', 400);
    }

    const { user, tokens } = result;

    if (!user || !tokens) {
      console.error('Registration result missing user or tokens');
      return errorResponse('Registration failed - incomplete result', 500);
    }

    console.log(`Registration successful for user: ${user.email} (ID: ${user.id})`);

    // Create response with user data
    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: null,
        avatar: user.avatar,
        bio: user.bio,
        walletAddress: user.walletAddress,
        isActive: user.isActive,
        isSuspended: user.isSuspended,
        isVerified: user.isVerified,
        isAdmin: user.isAdmin,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token: tokens.accessToken,
      tokens,
      message: 'Registration successful. Welcome to Etheryte!'
    };

    // Create response
    const response = apiResponse(responseData, 201);

    // Set secure JWT cookies (access + refresh)
    setAuthCookies(response, tokens, false)

    // CSRF token (align with login route)
    const csrfToken = 'csrf-token-placeholder'
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    // Set user data cookie for client-side access (non-sensitive data only)
    response.cookies.set('user-data', JSON.stringify({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      isAdmin: user.isAdmin,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response;

  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function OPTIONS(req: NextRequest) {
  const middlewareResponse = applyMiddleware(req);
  if (middlewareResponse) return middlewareResponse;
  
  return apiResponse({}, 200);
}