import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  bio?: string | null;
  walletAddress?: string | null;
  role?: string;
  isActive: boolean;
  isSuspended: boolean;
  isVerified: boolean;
  isAdmin: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  token?: string;
  message?: string;
}

export interface LoginResult extends AuthResult {
  rememberMe?: boolean;
}

// Hash password with bcrypt
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // Increased from 10 to match XRP platform
  return await bcrypt.hash(password, saltRounds);
}

// Verify password against hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(payload: { userId: string; email: string }): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  return jwt.sign(payload, secret, { 
    expiresIn: '24h',
    issuer: 'etheryte-platform',
    audience: 'etheryte-users'
  });
}

// Verify JWT token
export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    
    const decoded = jwt.verify(token, secret, {
      issuer: 'etheryte-platform',
      audience: 'etheryte-users'
    }) as { userId: string; email: string };
    
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Extract token from request
export function extractToken(request: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookies as fallback
  const cookieToken = request.cookies.get('auth-token')?.value;
  if (cookieToken) {
    return cookieToken;
  }
  
  return null;
}

// Authenticate user from request
export async function authenticateUser(request: NextRequest): Promise<AuthResult> {
  try {
    const token = extractToken(request);
    if (!token) {
      return { success: false, message: 'No authentication token provided' };
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return { success: false, message: 'Invalid or expired authentication token' };
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        walletAddress: true,
        isActive: true,
        isSuspended: true,
        isVerified: true,
        isAdmin: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Check user status
    if (!user.isActive) {
      return { success: false, message: 'Account is inactive' };
    }

    if (user.isSuspended) {
      return { success: false, message: 'Account is suspended' };
    }

    if (!user.isVerified) {
      return { success: false, message: 'Email not verified' };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, message: 'Authentication failed' };
  }
}

// Login user with email or username
export async function loginUser(emailOrUsername: string, password: string, rememberMe: boolean = false): Promise<LoginResult> {
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
      return { success: false, message: 'Invalid credentials' };
    }

    // Check user status before password verification
    if (!user.isActive) {
      return { success: false, message: 'Account is inactive' };
    }

    if (user.isSuspended) {
      return { success: false, message: 'Account is suspended' };
    }

    if (!user.isVerified) {
      return { success: false, message: 'Email not verified' };
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, message: 'Invalid credentials' };
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    // Return user data without password
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword,
      token,
      rememberMe
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Login failed' };
  }
}

// Register new user
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
    // Check for existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: userData.email },
          { username: userData.username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === userData.email) {
        return { success: false, message: 'Email already exists' };
      }
      if (existingUser.username === userData.username) {
        return { success: false, message: 'Username already exists' };
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user (auto-verify for demo mode)
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        username: userData.username,
        passwordHash: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        walletAddress: userData.walletAddress,
        bio: userData.bio,
        isVerified: true, // Auto-verify for demo mode
        isActive: true,   // Ensure user is active
        isSuspended: false,
        isAdmin: false,
        twoFactorEnabled: false,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        walletAddress: true,
        isActive: true,
        isSuspended: true,
        isVerified: true,
        isAdmin: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    return {
      success: true,
      user,
      token,
      message: 'Registration successful'
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'Registration failed' };
  }
}

// Require admin access
export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  const authResult = await authenticateUser(request);
  
  if (!authResult.success || !authResult.user) {
    return authResult;
  }

  if (!authResult.user.isAdmin) {
    return { success: false, message: 'Admin access required' };
  }

  return authResult;
}