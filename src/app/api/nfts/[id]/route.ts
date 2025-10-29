import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateUser } from '@/lib/auth-modern';
import { logInfo, logError } from '@/lib/logger';
import { nftUpdateSchema, validateSchema } from '@/lib/validation';
import { apiResponse, errorResponse, applyMiddleware } from '@/lib/middleware';

// GET /api/nfts/[id] - Get specific NFT
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply middleware
    const middlewareResponse = applyMiddleware(req);
    if (middlewareResponse) return middlewareResponse;

    const { id } = await params;

    // Get NFT with all related data
    const nft = await prisma.NFT.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isVerified: true,
            walletAddress: true,
          }
        },
        collection: {
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            banner: true,
          }
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              }
            }
          }
        },
        auctions: {
          where: { isActive: true },
          include: {
            bids: {
              orderBy: { amount: 'desc' },
              take: 5,
              include: {
                bidder: {
              select: {
                id: true,
                username: true,
                avatar: true,
              }
            }
              }
            }
          }
        }
      }
    });

    if (!nft) {
      return errorResponse('NFT not found', 404);
    }

    // Get similar NFTs (same category, different NFT)
    const similarNFTs = await prisma.NFT.findMany({
      where: {
        category: nft.category,
        id: { not: nft.id },
        isListed: true,
      },
      take: 6,
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
    });

    return apiResponse({
      nft,
      similarNFTs,
    });

  } catch (error) {
    logError('Get NFT error', error as Error);
    return errorResponse('Internal server error', 500);
  }
}

// PUT /api/nfts/[id] - Update NFT
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

    // Check if NFT exists and user owns it
    const existingNFT = await prisma.NFT.findUnique({
      where: { id },
      select: {
        id: true,
        creatorId: true,
      }
    });

    if (!existingNFT) {
      return errorResponse('NFT not found', 404);
    }

    // Only creator can update NFT
    if (existingNFT.creatorId !== authResult.user?.id) {
      return errorResponse('You can only update NFTs you created', 403);
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = validateSchema(nftUpdateSchema, body);
    
    if (!validation.success) {
      return errorResponse('Validation failed', 400, validation.errors);
    }

    // Update NFT
    const updatedNFT = await prisma.NFT.update({
      where: { id },
      data: validation.data,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isVerified: true,
          }
        },
        collection: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      }
    });

    // Log NFT update
    logInfo('NFT updated successfully', {
      nftId: id,
      updatedBy: authResult.user?.id,
      changes: validation.data,
    });

    return apiResponse(updatedNFT);

  } catch (error) {
    logError('Update NFT error', error as Error);
    return errorResponse('Internal server error', 500);
  }
}

// DELETE /api/nfts/[id] - Delete NFT
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

    // Check if NFT exists and user owns it
    const existingNFT = await prisma.NFT.findUnique({
      where: { id },
      select: {
        id: true,
        creatorId: true,
        name: true,
      }
    });

    if (!existingNFT) {
      return errorResponse('NFT not found', 404);
    }

    // Only creator can delete NFT
    if (existingNFT.creatorId !== authResult.user?.id) {
      return errorResponse('You can only delete NFTs you created', 403);
    }

    // Check if NFT has active auctions
    const activeAuction = await prisma.auction.findFirst({
      where: {
        nftId: id,
        isActive: true,
      }
    });

    if (activeAuction) {
      return errorResponse('Cannot delete NFT with active auctions', 400);
    }

    // Delete NFT (this will cascade delete related records)
    await prisma.NFT.delete({
      where: { id }
    });

    // Log NFT deletion
    logInfo('NFT deleted successfully', {
      nftId: id,
      nftName: existingNFT.name,
      deletedBy: authResult.user?.id,
    });

    return apiResponse({ message: 'NFT deleted successfully' });

  } catch (error) {
    logError('Delete NFT error', error as Error);
    return errorResponse('Internal server error', 500);
  }
}

// Handle unsupported methods
export async function POST() {
  return errorResponse('Method not allowed', 405);
}