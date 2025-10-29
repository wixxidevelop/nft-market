import { NextRequest, NextResponse } from 'next/server';
import { logError, logInfo } from './logger';

// CORS configuration
const CORS_HEADERS = {
  // Use explicit origin when credentials are involved; '*' + credentials breaks cookies
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production'
    ? (process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com')
    : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token',
  'Access-Control-Allow-Credentials': 'true',
};

// Apply CORS middleware
export function applyCorsHeaders(response: NextResponse): NextResponse {
  // Ensure caches vary on Origin when proxies are involved
  response.headers.set('Vary', 'Origin');
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value as string);
  });
  return response;
}

// Handle preflight OPTIONS requests
export function handlePreflight(): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  return applyCorsHeaders(response);
}

// Apply general middleware (CORS, logging, etc.)
export function applyMiddleware(req: NextRequest): NextResponse | null {
  const { method, url } = req;
  
  logInfo(`${method} ${url}`);

  // Handle preflight requests
  if (method === 'OPTIONS') {
    return handlePreflight();
  }

  return null; // Continue with normal processing
}

// Standard API response format
export function apiResponse(data: any, status: number = 200): NextResponse {
  const response = NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  }, { status });
  
  return applyCorsHeaders(response);
}

// Standard error response format
export function errorResponse(message: string, status: number = 400, details?: any): NextResponse {
  logError(`API Error: ${message}`, details);
  
  const response = NextResponse.json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(details && { details }),
  }, { status });
  
  return applyCorsHeaders(response);
}

// Validation middleware
export function validateRequiredFields(data: any, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  identifier: string, 
  maxRequests: number = 100, 
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Clean up old entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < windowStart) {
      rateLimitMap.delete(key);
    }
  }
  
  const current = rateLimitMap.get(identifier);
  
  if (!current) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now });
    return true;
  }
  
  if (current.resetTime < windowStart) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
}

// Get client IP address
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}