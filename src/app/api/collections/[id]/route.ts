import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateUser, requireRole } from '@/lib/auth-modern';
import { logInfo, logError } from '@/lib/logger';
import { collectionUpdateSchema, validateSchema } from '@/lib/validation';
import { apiResponse, errorResponse, applyMiddleware } from '@/lib/middleware';

// GET /api/collections/[id] - Get specific collection with NFTs
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply middleware
    const middlewareResponse = applyMiddleware(req);
    if (middlewareResponse) return middlewareResponse;

    const { id } = await params;

    // Get collection with related data
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isVerified: true,
          }
        },
        nfts: {
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              avatar: true,
              isVerified: true,
            }
          }
        }
      },
        _count: {
          select: {
            nfts: true,
          }
        }
      }
    });

    if (!collection) {
      return errorResponse('Collection not found', 404);
    }

    // Calculate collection stats
    const stats = await prisma.NFT.aggregate({
      where: { collectionId: id },
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true },
      _sum: { price: true },
      _count: true,
    });

    // Get transaction volume for this collection
    const volumeStats = await prisma.transaction.aggregate({
      where: {
        nft: { collectionId: id }
      },
      _sum: { amount: true },
      _count: true,
    });

    const collectionWithStats = {
      ...collection,
      stats: {
        totalNfts: stats._count || 0,
        floorPrice: stats._min.price || 0,
        avgPrice: stats._avg.price || 0,
        maxPrice: stats._max.price || 0,
        totalVolume: volumeStats._sum.amount || 0,
        totalSales: volumeStats._count || 0,
      }
    };

    return apiResponse({ collection: collectionWithStats });

  } catch (error) {
    logError('Get collection error', error as Error);
    return errorResponse('Internal server error', 500);
  }
}

// PUT /api/collections/[id] - Update collection
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

    // Check if collection exists
    const existingCollection = await prisma.collection.findUnique({
      where: { id },
      select: {
        id: true,
        creatorId: true,
        name: true,
        isVerified: true,
      }
    });

    if (!existingCollection) {
      return errorResponse('Collection not found', 404);
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = validateSchema(collectionUpdateSchema, body);
    
    if (!validation.success) {
      return errorResponse('Validation failed', 400, validation.errors);
    }

    const updateData = validation.data;

    // Check permissions
    const isCreator = existingCollection.creatorId === authResult.user?.id;
    const isAdmin = authResult.user?.role === 'ADMIN';

    if (!isCreator && !isAdmin) {
      return errorResponse('You can only update collections you created', 403);
    }

    // Only admins can verify collections
    if ('isVerified' in updateData && !isAdmin) {
      return errorResponse('Only admins can verify collections', 403);
    }

    // Check if new name conflicts with existing collections (if name is being changed)
    if (updateData.name && updateData.name !== existingCollection.name) {
      const nameConflict = await prisma.collection.findFirst({
        where: {
          name: updateData.name,
          creatorId: existingCollection.creatorId,
          id: { not: id }
        }
      });

      if (nameConflict) {
        return errorResponse('You already have a collection with this name', 409);
      }
    }

    // Update collection
    const updatedCollection = await prisma.collection.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
            select: {
              id: true,
              username: true,
              avatar: true,
              isVerified: true,
            }
          },
        _count: {
          select: {
            nfts: true,
          }
        }
      }
    });

    // Log collection update
    logInfo('Collection updated successfully', {
      collectionId: id,
      updatedBy: authResult.user?.id,
      changes: Object.keys(updateData),
    });

    return apiResponse({ collection: updatedCollection });

  } catch (error) {
    logError('Update collection error', error as Error);
    return errorResponse('Internal server error', 500);
  }
}

// DELETE /api/collections/[id] - Delete collection
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

    // Check if collection exists
    const existingCollection = await prisma.collection.findUnique({
      where: { id },
      select: {
        id: true,
        creatorId: true,
        name: true,
        _count: {
          select: {
            nfts: true,
          }
        }
      }
    });

    if (!existingCollection) {
      return errorResponse('Collection not found', 404);
    }

    // Check permissions
    const isCreator = existingCollection.creatorId === authResult.user?.id;
    const isAdmin = authResult.user?.role === 'ADMIN';

    if (!isCreator && !isAdmin) {
      return errorResponse('You can only delete collections you created', 403);
    }

    // Check if collection has NFTs
    if (existingCollection._count.nfts > 0) {
      return errorResponse('Cannot delete collection that contains NFTs', 400);
    }

    // Delete collection
    await prisma.collection.delete({
      where: { id }
    });

    // Log collection deletion
    logInfo('Collection deleted successfully', {
      collectionId: id,
      collectionName: existingCollection.name,
      deletedBy: authResult.user?.id,
    });

    return apiResponse({ message: 'Collection deleted successfully' });

  } catch (error) {
    logError('Delete collection error', error as Error);
    return errorResponse('Internal server error', 500);
  }
}

// Handle unsupported methods
export async function POST() {
  return errorResponse('Method not allowed', 405);
}