import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import testUtils from '@/lib/test-utils';

const { dbMock } = testUtils;

// Types mirroring production
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
  isSuspended?: boolean;
  isVerified: boolean;
  isAdmin?: boolean;
  twoFactorEnabled?: boolean;
  lastLoginAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  role?: 'USER' | 'ADMIN' | 'MODERATOR' | string;
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
}

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';

function createAccessToken(payload: { userId: string; email: string; role?: string; sessionId: string }) {
  return jwt.sign({ ...payload }, JWT_SECRET, { expiresIn: '15m' });
}

function createRefreshToken(payload: { userId: string; sessionId: string }) {
  return jwt.sign({ ...payload }, JWT_SECRET, { expiresIn: '7d' });
}

export async function loginUser(
  emailOrUsername: string,
  password: string,
  rememberMe: boolean = false,
  userAgent?: string,
  ipAddress?: string
): Promise<AuthResult> {
  // Use in-memory dbMock for tests
  const byEmail = dbMock.findUserByEmail(emailOrUsername);
  const byUsername = Array.from(dbMock.users.values()).find((u: any) => u.username === emailOrUsername);
  const user: any = byEmail || byUsername;

  if (!user || password !== 'password123') {
    return { success: false, error: 'Invalid credentials' };
  }

  const sessionId = 'sess-' + Math.random().toString(36).slice(2);
  const expiresAt = new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));

  const accessToken = createAccessToken({ userId: user.id, email: user.email, role: (user.role || 'user').toUpperCase(), sessionId });
  const refreshToken = createRefreshToken({ userId: user.id, sessionId });

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      avatar: user.avatar || null,
      role: (user.role || 'user').toUpperCase() as any,
      isActive: user.isActive !== false,
      isVerified: user.isVerified !== false,
      twoFactorEnabled: !!user.twoFactorEnabled,
      createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
      lastLoginAt: new Date(),
    },
    tokens: { accessToken, refreshToken, expiresAt },
  };
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
  // Fail if existing email
  const existing = dbMock.findUserByEmail(userData.email);
  if (existing) {
    return { success: false, error: 'Email already in use' };
  }

  const id = 'user-' + Math.random().toString(36).slice(2);
  const nowIso = new Date().toISOString();
  const newUser: any = {
    id,
    email: userData.email,
    username: userData.username,
    firstName: userData.firstName || null,
    lastName: userData.lastName || null,
    isActive: true,
    isVerified: true,
    role: 'user',
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  dbMock.users.set(id, newUser);

  const sessionId = 'sess-' + Math.random().toString(36).slice(2);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const accessToken = createAccessToken({ userId: id, email: newUser.email, role: 'USER', sessionId });
  const refreshToken = createRefreshToken({ userId: id, sessionId });

  return {
    success: true,
    user: {
      ...newUser,
      role: 'USER',
      createdAt: new Date(newUser.createdAt),
      updatedAt: new Date(newUser.updatedAt),
    },
    tokens: { accessToken, refreshToken, expiresAt },
  };
}

export async function authenticateUser(request: NextRequest): Promise<AuthResult> {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return { success: false, error: 'No token provided' };
  }
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = dbMock.findUser(decoded.userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: (user.role || 'user').toUpperCase() as any,
        isActive: user.isActive !== false,
        isVerified: user.isVerified !== false,
        twoFactorEnabled: !!user.twoFactorEnabled,
        createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
      },
    };
  } catch {
    return { success: false, error: 'Invalid token' };
  }
}

export function setAuthCookies(response: NextResponse, tokens: AuthTokens, rememberMe: boolean = false): void {
  // In test environment, cookies are not required for assertions; avoid errors if unavailable
  // @ts-ignore
  const cookies = (response as any).cookies;
  if (!cookies || typeof cookies.set !== 'function') return;

  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
  cookies.set('access-token', tokens.accessToken, { httpOnly: true, path: '/', maxAge: 15 * 60 });
  cookies.set('auth-token', tokens.accessToken, { httpOnly: true, path: '/', maxAge: 15 * 60 });
  cookies.set('refresh-token', tokens.refreshToken, { httpOnly: true, path: '/', maxAge });
}

export function clearAuthCookies(response: NextResponse): void {
  // no-op for tests
}