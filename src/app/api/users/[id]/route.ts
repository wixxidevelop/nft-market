import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateUser } from '@/lib/auth-modern';
import { logInfo, logError } from '@/lib/logger';
import { userUpdateSchema, validateSchema } from '@/lib/validation';
import { apiResponse, errorResponse, applyMiddleware } from '@/lib/middleware';

// GET /api/users/[id] - Get user profile
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply middleware
    const middlewareResponse = applyMiddleware(req);
    if (middlewareResponse) return middlewareResponse;

    const { id } = await params;

    // Get user with related data
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        walletAddress: true,
        isVerified: true,
        isAdmin: true,
        avatar: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            nfts: true,
            collections: true,
            transactions: true,
            bids: true,
          }
        }
      }
    });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Get user's recent NFTs
    const recentNFTs = await prisma.NFT.findMany({
      where: { creatorId: id },
      take: 12,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isVerified: true,
          }
        }
      }
    });

    // Get user's collections
    const collections = await prisma.collection.findMany({
      where: { creatorId: id },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            nfts: true,
          }
        }
      }
    });

    // Get user's recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        userId: id
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        nft: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          }
        }
      }
    });

    // Calculate user stats
    const transactionStats = await prisma.transaction.aggregate({
      where: {
        userId: id
      },
      _sum: { amount: true },
      _count: true,
    });

    const nftStats = await prisma.NFT.aggregate({
      where: { creatorId: id },
      _avg: { price: true },
      _sum: { price: true },
      _count: true,
    });

    return apiResponse({
      user,
      stats: {
        nfts: user._count.nfts,
        collections: user._count.collections,
        transactions: user._count.transactions,
        bids: user._count.bids,
        totalVolume: transactionStats._sum.amount || 0,
        avgNFTPrice: nftStats._avg.price || 0,
        totalNFTValue: nftStats._sum.price || 0,
      },
      recentNFTs,
      collections,
      recentTransactions,
    });

  } catch (error) {
    logError('Get user profile error', error as Error);
    return errorResponse('Internal server error', 500);
  }
}

// PUT /api/users/[id] - Update user profile
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply middleware
    const middlewareResponse = applyMiddleware(req);
    if (middlewareResponse) return middlewareResponse;

    // Authenticate user
    const authResult = await authenticateUser(req);
    if (!authResult.success) {
      return errorResponse(authResult.error || 'Authentication failed', 401);
    }

    const { id } = await params;

    // Check if user is updating their own profile or is admin
    if (authResult.user?.id !== id && authResult.user?.role !== 'ADMIN') {
      return errorResponse('You can only update your own profile', 403);
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = validateSchema(userUpdateSchema, body);
    
    if (!validation.success) {
      return errorResponse('Validation failed', 400, validation.errors);
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true }
    });

    if (!existingUser) {
      return errorResponse('User not found', 404);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: validation.data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        walletAddress: true,
        isVerified: true,
        isAdmin: true,
        avatar: true,
        bio: true,
        createdAt: true,
      }
    });

    // Log user update
    logInfo('User profile updated successfully', {
      userId: id,
      updatedBy: authResult.user?.id,
      changes: validation.data,
    });

    return apiResponse(updatedUser);

  } catch (error) {
    logError('Update user profile error', error as Error);
    return errorResponse('Internal server error', 500);
  }
}

// DELETE /api/users/[id] - Delete user account
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply middleware
    const middlewareResponse = applyMiddleware(req);
    if (middlewareResponse) return middlewareResponse;

    // Authenticate user
    const authResult = await authenticateUser(req);
    if (!authResult.success) {
      return errorResponse(authResult.error || 'Authentication failed', 401);
    }

    const { id } = await params;

    // Check if user is deleting their own account or is admin
    if (authResult.user?.id !== id && authResult.user?.role !== 'ADMIN') {
      return errorResponse('You can only delete your own account', 403);
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { 
        id: true, 
        email: true, 
        firstName: true,
        lastName: true,
        _count: {
          select: {
            nfts: true,
            auctions: true,
          }
        }
      }
    });

    if (!existingUser) {
      return errorResponse('User not found', 404);
    }

    // Check if user has active auctions
    const activeAuctions = await prisma.auction.count({
      where: {
        sellerId: id,
        isActive: true,
      }
    });

    if (activeAuctions > 0) {
      return errorResponse('Cannot delete account with active auctions', 400);
    }

    // Delete user (this will cascade delete related records based on schema)
    await prisma.user.delete({
      where: { id }
    });

    // Log user deletion
    logInfo('User account deleted successfully', {
      deletedUserId: id,
      deletedUserEmail: existingUser.email,
      deletedUserFirstName: existingUser.firstName,
      deletedUserLastName: existingUser.lastName,
      deletedBy: authResult.user?.id,
    });

    return apiResponse({ message: 'User account deleted successfully' });

  } catch (error) {
    logError('Delete user account error', error as Error);
    return errorResponse('Internal server error', 500);
  }
}

// Handle unsupported methods
export async function POST() {
  return errorResponse('Method not allowed', 405);
}