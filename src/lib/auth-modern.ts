import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { getIronSession } from 'iron-session';

// Enhanced security configuration
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key');
const REFRESH_SECRET = new TextEncoder().encode(process.env.REFRESH_SECRET || 'fallback-refresh-secret');
const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-session-secret';

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m'; // Short-lived access tokens
const REFRESH_TOKEN_EXPIRY = '7d'; // Longer-lived refresh tokens
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Enhanced user interface
export interface ModernAuthUser {
  id: string;
  email: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  bio?: string | null;
  walletAddress?: string | null;
  isActive: boolean;
  isSuspended: boolean;
  isVerified: boolean;
  isAdmin: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface AuthResult {
  success: boolean;
  user?: ModernAuthUser;
  tokens?: AuthTokens;
  message?: string;
  error?: string;
  code?:
    | 'INVALID_CREDENTIALS'
    | 'ACCOUNT_INACTIVE'
    | 'ACCOUNT_SUSPENDED'
    | 'EMAIL_NOT_VERIFIED'
    | 'SERVER_ERROR'
    | 'INVALID_REFRESH_TOKEN'
    | 'UNAUTHORIZED'
    | 'SESSION_EXPIRED';
}

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  issuedAt: number;
  expiresAt: number;
}

export const sessionOptions = {
  password: SESSION_SECRET,
  cookieName: 'etheryte-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: SESSION_MAX_AGE,
  },
};

export async function hashPassword(password: string, rounds: number = 14): Promise<string> {
  const salt = await bcrypt.genSalt(rounds);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

export async function generateAccessToken(payload: { 
  userId: string; 
  email: string; 
  role: string;
  sessionId: string;
}): Promise<string> {
  return await new SignJWT({
    sub: payload.userId,
    email: payload.email,
    role: payload.role,
    sessionId: payload.sessionId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setJti(uuidv4())
    .sign(JWT_SECRET);
}

export async function generateRefreshToken(payload: { 
  userId: string; 
  sessionId: string;
}): Promise<string> {
  return await new SignJWT({
    sub: payload.userId,
    sessionId: payload.sessionId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setJti(uuidv4())
    .sign(REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<{
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  jti: string;
} | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.sub as string,
      email: payload.email as string,
      role: payload.role as string,
      sessionId: payload.sessionId as string,
      jti: payload.jti as string,
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<{
  userId: string;
  sessionId: string;
  jti: string;
} | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    return {
      userId: payload.sub as string,
      sessionId: payload.sessionId as string,
      jti: payload.jti as string,
    };
  } catch (error) {
    console.error('Refresh token verification error:', error);
    return null;
  }
}

export function extractTokens(request: NextRequest): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  // Prefer cookies (HTTP-only) but support Authorization header for SPA/mobile clients
  const cookieAccess = request.cookies.get('access-token')?.value
    || request.cookies.get('auth-token')?.value
    || null;

  const authHeader = request.headers.get('authorization');
  let headerAccess: string | null = null;
  if (authHeader) {
    headerAccess = /^Bearer\s+/i.test(authHeader)
      ? authHeader.replace(/^Bearer\s+/i, '')
      : authHeader;
  }

  const accessToken = cookieAccess || headerAccess;

  // Refresh token from cookies, with optional header support for non-browser clients
  const cookieRefresh = request.cookies.get('refresh-token')?.value || null;
  const headerRefresh = request.headers.get('x-refresh-token');
  const refreshToken = cookieRefresh || headerRefresh || null;

  return { accessToken, refreshToken };
}

export async function authenticateUser(request: NextRequest): Promise<AuthResult> {
  try {
    const { accessToken, refreshToken } = extractTokens(request);

    if (!accessToken && !refreshToken) {
      // No tokens provided
      return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    }

    if (accessToken) {
      const decoded = await verifyAccessToken(accessToken);
      if (decoded) {
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (user) {
          // Update session activity
          await prisma.userSession.update({
            where: { id: decoded.sessionId },
            data: { lastActivityAt: new Date() }
          });

          return { 
            success: true, 
            user: {
              ...user,
              role: user.role as 'USER' | 'ADMIN' | 'MODERATOR'
            }
          };
        }
      }
    }

    // Try refresh token if access token is invalid/expired
    if (refreshToken) {
      const decoded = await verifyRefreshToken(refreshToken);
      if (!decoded) {
        return { success: false, error: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' };
      }

      const session = await prisma.userSession.findUnique({ where: { id: decoded.sessionId } });
      if (!session || session.expiresAt < new Date()) {
        return { success: false, error: 'Session expired', code: 'SESSION_EXPIRED' };
      }

      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      if (!user) {
        return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
      }

      // Update last activity
      await prisma.userSession.update({
        where: { id: session.id },
        data: { lastActivityAt: new Date() }
      });

      return { 
        success: true, 
        user: {
          ...user,
          role: user.role as 'USER' | 'ADMIN' | 'MODERATOR'
        }
      };
    }

    return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Authentication failed', code: 'SERVER_ERROR' };
  }
}

// Modern login with session management
export async function loginUser(
  emailOrUsername: string, 
  password: string, 
  rememberMe: boolean = false,
  userAgent?: string,
  ipAddress?: string
): Promise<AuthResult> {
  try {
    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ]
      }
    });

    if (!user) {
      return { success: false, error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' };
    }

    // Enhanced user status checks
    if (!user.isActive) {
      return { success: false, error: 'Account is inactive', code: 'ACCOUNT_INACTIVE' };
    }

    if (user.isSuspended) {
      return { success: false, error: 'Account is suspended', code: 'ACCOUNT_SUSPENDED' };
    }

    if (!user.isVerified) {
      return { success: false, error: 'Email not verified', code: 'EMAIL_NOT_VERIFIED' };
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return { success: false, error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' };
    }

    // Create new session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));

    const session = await prisma.userSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        userAgent: userAgent || 'Unknown',
        ipAddress: ipAddress || 'Unknown',
        expiresAt,
        lastActivityAt: new Date(),
      }
    });

    // Generate tokens
    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    });

    const refreshToken = await generateRefreshToken({
      userId: user.id,
      sessionId: session.id,
    });

    // Update user's last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    return {
      success: true,
      user: {
        ...user,
        role: user.role as 'USER' | 'ADMIN' | 'MODERATOR'
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresAt,
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Login failed', code: 'SERVER_ERROR' };
  }
}

// Refresh token functionality
export async function refreshTokens(refreshToken: string): Promise<AuthResult> {
  try {
    const decoded = await verifyRefreshToken(refreshToken);
    if (!decoded) {
      return { success: false, error: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' };
    }

    // Check if session exists and is valid
    const session = await prisma.userSession.findUnique({
      where: { id: decoded.sessionId },
    });

    if (!session || session.expiresAt < new Date()) {
      return { success: false, error: 'Session expired', code: 'SESSION_EXPIRED' };
    }

    // Get user associated with the session
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    }

    // Generate a new access token
    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    });

    // Update session last activity
    await prisma.userSession.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() }
    });

    return {
      success: true,
      user: {
        ...user,
        role: user.role as 'USER' | 'ADMIN' | 'MODERATOR'
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return { success: false, error: 'Token refresh failed', code: 'SERVER_ERROR' };
  }
}

export async function logoutUser(sessionId: string): Promise<{ success: boolean }> {
  try {
    await prisma.userSession.delete({ where: { id: sessionId } });
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false };
  }
}

export async function logoutAllSessions(userId: string): Promise<{ success: boolean }> {
  try {
    await prisma.userSession.deleteMany({ where: { userId } });
    return { success: true };
  } catch (error) {
    console.error('Logout all sessions error:', error);
    return { success: false };
  }
}

export async function getUserSessions(userId: string) {
  try {
    return await prisma.userSession.findMany({
      where: { userId },
      orderBy: { lastActivityAt: 'desc' }
    });
  } catch (error) {
    console.error('Get user sessions error:', error);
    return [];
  }
}

export async function cleanupExpiredSessions(): Promise<void> {
  try {
    await prisma.userSession.deleteMany({
      where: { expiresAt: { lt: new Date() } }
    });
  } catch (error) {
    console.error('Session cleanup error:', error);
  }
}

export function hasPermission(user: ModernAuthUser, requiredRole: 'USER' | 'ADMIN' | 'MODERATOR'): boolean {
  const roleHierarchy = { USER: 1, MODERATOR: 2, ADMIN: 3 } as const;
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

export async function requireRole(request: NextRequest, requiredRole: 'USER' | 'ADMIN' | 'MODERATOR'): Promise<AuthResult> {
  try {
    const { accessToken } = extractTokens(request);
    if (!accessToken) {
      return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    }

    const decoded = await verifyAccessToken(accessToken);
    if (!decoded) {
      return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    }

    if (!hasPermission({ ...user, role: user.role as 'USER' | 'ADMIN' | 'MODERATOR' }, requiredRole)) {
      return { success: false, error: 'Forbidden', code: 'UNAUTHORIZED' };
    }

    // Update session last activity
    await prisma.userSession.update({
      where: { id: decoded.sessionId },
      data: { lastActivityAt: new Date() }
    });

    return { 
      success: true, 
      user: {
        ...user,
        role: user.role as 'USER' | 'ADMIN' | 'MODERATOR'
      }
    };
  } catch (error) {
    console.error('Authorization error:', error);
    return { success: false, error: 'Authorization failed', code: 'SERVER_ERROR' };
  }
}

export function setAuthCookies(response: NextResponse, tokens: AuthTokens, rememberMe: boolean = false): void {
  const accessTokenMaxAge = 15 * 60; // 15 minutes
  const refreshTokenMaxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 or 7 days

  // Set access token cookie
  response.cookies.set('access-token', tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: accessTokenMaxAge,
    path: '/',
  });

  // Set refresh token cookie
  response.cookies.set('refresh-token', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: refreshTokenMaxAge,
    path: '/',
  });

  // Legacy support
  response.cookies.set('auth-token', tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: accessTokenMaxAge,
    path: '/',
  });
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set('access-token', '', { maxAge: 0, path: '/' });
  response.cookies.set('refresh-token', '', { maxAge: 0, path: '/' });
  response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
}

export async function registerUser(userData: {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  walletAddress?: string;
  bio?: string;
}): Promise<AuthResult> {
  try {
    // Check if email or username already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: userData.email },
          { username: userData.username },
        ]
      }
    });

    if (existing) {
      return { success: false, error: 'Email or username already in use', code: 'UNAUTHORIZED' };
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        username: userData.username,
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        walletAddress: userData.walletAddress,
        bio: userData.bio,
        isActive: true,
        isVerified: true, // For demo: auto-verify
        isAdmin: false,
        twoFactorEnabled: false,
      }
    });

    // Create session for new user
    const sessionId = uuidv4();
    const session = await prisma.userSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        userAgent: 'Registration',
        ipAddress: '127.0.0.1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        lastActivityAt: new Date(),
      }
    });

    // Generate tokens
    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    });

    const refreshToken = await generateRefreshToken({
      userId: user.id,
      sessionId: session.id,
    });

    return {
      success: true,
      user: {
        ...user,
        role: user.role as 'USER' | 'ADMIN' | 'MODERATOR'
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      }
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Registration failed', code: 'SERVER_ERROR' };
  }
}