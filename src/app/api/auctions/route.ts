import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateUser } from '@/lib/auth-modern';
import { logInfo, logError } from '@/lib/logger';
import { auctionCreateSchema, paginationSchema, validateSchema } from '@/lib/validation';
import { apiResponse, errorResponse, applyMiddleware } from '@/lib/middleware';

// GET /api/auctions - List auctions with filtering and pagination
export async function GET(req: NextRequest) {
  try {
    // Apply middleware
    const middlewareResponse = applyMiddleware(req);
    if (middlewareResponse) return middlewareResponse;

    const { searchParams } = new URL(req.url);
    
    // Parse pagination parameters
    const paginationData = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    };

    const paginationValidation = validateSchema(paginationSchema, paginationData);
    if (!paginationValidation.success) {
      return errorResponse('Invalid pagination parameters', 400, paginationValidation.errors);
    }

    const { page, limit, sortBy, sortOrder } = paginationValidation.data;

    // Parse filter parameters
    const isActive = searchParams.get('isActive');
    const creatorId = searchParams.get('creatorId');
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    // Build where clause
    const where: any = {};

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (creatorId) {
      where.nft = {
        creatorId
      };
    }

    if (category) {
      where.nft = {
        ...where.nft,
        category
      };
    }

    if (minPrice || maxPrice) {
      where.currentPrice = {};
      if (minPrice) where.currentPrice.gte = parseFloat(minPrice);
      if (maxPrice) where.currentPrice.lte = parseFloat(maxPrice);
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get auctions with related data
    const [auctions, totalCount] = await Promise.all([
      prisma.auction.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          nft: {
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
          },
          _count: {
            select: {
              bids: true
            }
          }
        }
      }),
      prisma.auction.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return apiResponse({
      auctions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });

  } catch (error) {
    logError('Get auctions error', error as Error);
    return errorResponse('Internal server error', 500);
  }
}

// POST /api/auctions - Create new auction
export async function POST(req: NextRequest) {
  try {
    // Apply middleware
    const middlewareResponse = applyMiddleware(req);
    if (middlewareResponse) return middlewareResponse;

    // Authenticate user
    const authResult = await authenticateUser(req);
    if (!authResult.success) {
      return errorResponse(authResult.error || 'Authentication failed', 401);
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = validateSchema(auctionCreateSchema, body);
    
    if (!validation.success) {
      return errorResponse('Validation failed', 400, validation.errors);
    }

    const { nftId, startingPrice, reservePrice, duration } = validation.data;

    // Verify NFT exists and user owns it
    const nft = await prisma.nFT.findUnique({
      where: { id: nftId },
      include: {
        creator: true,
      }
    });

    if (!nft) {
      return errorResponse('NFT not found', 404);
    }

    if (nft.creatorId !== authResult.user?.id) {
      return errorResponse('You can only auction NFTs you own', 403);
    }

    // Check if NFT already has an active auction
    const existingAuction = await prisma.auction.findFirst({
      where: {
        nftId,
        isActive: true,
      }
    });

    if (existingAuction) {
      return errorResponse('NFT already has an active auction', 409);
    }

    // Calculate end time
    const endTime = new Date(Date.now() + duration * 60 * 60 * 1000); // duration in hours

    // Create auction
    const auction = await prisma.auction.create({
      data: {
        nftId,
        startPrice: startingPrice,
        reservePrice,
        currentPrice: startingPrice,
        startTime: new Date(),
        endTime,
        sellerId: authResult.user?.id,
        isActive: true,
      },
      include: {
        nft: {
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
        }
      }
    });

    // Update NFT to mark as in auction
    await prisma.nFT.update({
      where: { id: nftId },
      data: { isListed: false } // Remove from regular marketplace
    });

    // Log auction creation
    logInfo('Auction created successfully', {
      auctionId: auction.id,
      nftId,
      creatorId: authResult.user?.id,
      startingPrice,
      reservePrice,
      duration,
    });

    return apiResponse(auction, 201);

  } catch (error) {
    logError('Create auction error', error as Error);
    return errorResponse('Internal server error', 500);
  }
}

// Handle unsupported methods
export async function PUT() {
  return errorResponse('Method not allowed', 405);
}

export async function DELETE() {
  return errorResponse('Method not allowed', 405);
}