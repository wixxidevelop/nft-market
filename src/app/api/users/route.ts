import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateUser, requireRole } from '@/lib/auth-modern';
import { logInfo, logError } from '@/lib/logger';
import { paginationSchema, validateSchema } from '@/lib/validation';
import { apiResponse, errorResponse, applyMiddleware } from '@/lib/middleware';

// GET /api/users - List users (Admin only)
export async function GET(req: NextRequest) {
  try {
    // Apply middleware
    const middlewareResponse = applyMiddleware(req);
    if (middlewareResponse) return middlewareResponse;

    // Authenticate user and require admin role
    const authResult = await requireRole(req, 'ADMIN');
    if (!authResult.success) {
      return errorResponse(authResult.error || 'Admin access required', 403);
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const queryParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      search: searchParams.get('search') || '',
      role: searchParams.get('role') || '',
      isVerified: searchParams.get('isVerified'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };

    // Validate pagination
    const validation = validateSchema(paginationSchema, {
      page: queryParams.page,
      limit: queryParams.limit,
    });

    if (!validation.success) {
      return errorResponse('Invalid pagination parameters', 400, validation.errors);
    }

    const { page, limit } = validation.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (queryParams.search) {
      where.OR = [
        { name: { contains: queryParams.search, mode: 'insensitive' } },
        { email: { contains: queryParams.search, mode: 'insensitive' } },
        { walletAddress: { contains: queryParams.search, mode: 'insensitive' } },
      ];
    }

    if (queryParams.role) {
      where.role = queryParams.role;
    }

    if (queryParams.isVerified !== null) {
      where.isVerified = queryParams.isVerified === 'true';
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[queryParams.sortBy] = queryParams.sortOrder;

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          walletAddress: true,
          isVerified: true,
          isAdmin: true,
          avatar: true,
          bio: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              nfts: true,
              transactions: true,
              collections: true,
              bids: true,
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Get user statistics
    const userStats = await prisma.user.groupBy({
      by: ['isAdmin'],
      _count: true,
    });

    const verificationStats = await prisma.user.groupBy({
      by: ['isVerified'],
      _count: true,
    });

    return apiResponse({
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit,
      },
      stats: {
        byRole: userStats.reduce((acc: Record<string, number>, stat: any) => {
          acc[stat.role] = stat._count;
          return acc;
        }, {} as Record<string, number>),
        byVerification: verificationStats.reduce((acc: Record<string, number>, stat: any) => {
          acc[stat.isVerified ? 'verified' : 'unverified'] = stat._count;
          return acc;
        }, {} as Record<string, number>),
      }
    });

  } catch (error) {
    logError('List users error', error as Error);
    return errorResponse('Internal server error', 500);
  }
}

// Handle unsupported methods
export async function POST() {
  return errorResponse('Method not allowed', 405);
}

export async function PUT() {
  return errorResponse('Method not allowed', 405);
}

export async function DELETE() {
  return errorResponse('Method not allowed', 405);
}