import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateUser } from '@/lib/auth-modern';
import { logInfo, logError } from '@/lib/logger';
import { nftCreateSchema, paginationSchema, validateSchema } from '@/lib/validation';
import { apiResponse, errorResponse, applyMiddleware } from '@/lib/middleware';

// GET /api/nfts - List NFTs with filtering and pagination
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
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const isListed = searchParams.get('isListed');
    const isVerified = searchParams.get('isVerified');
    const creatorId = searchParams.get('creatorId');
    const ownerId = searchParams.get('ownerId');
    const collectionId = searchParams.get('collectionId');
    const query = searchParams.get('query');

    // Build where clause
    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (isListed !== null) {
      where.isListed = isListed === 'true';
    }

    if (creatorId) {
      where.creatorId = creatorId;
    }

    if (ownerId) {
      where.creatorId = ownerId;
    }

    if (collectionId) {
      where.collectionId = collectionId;
    }

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (isVerified !== null) {
      where.creator = {
        isVerified: isVerified === 'true'
      };
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get NFTs with related data
    const [nfts, totalCount] = await Promise.all([
      prisma.nFT.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [sortBy as string]: sortOrder },
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
          },
          _count: {
            select: {
              transactions: true,
            }
          }
        }
      }),
      prisma.nFT.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return apiResponse({
      nfts,
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
    logError('Get NFTs error', error as Error);
    return errorResponse('Internal server error', 500);
  }
}

// POST /api/nfts - Create new NFT
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
    const validation = validateSchema(nftCreateSchema, body);
    
    if (!validation.success) {
      return errorResponse('Validation failed', 400, validation.errors);
    }

    const { name, description, image, price, category, collectionId } = validation.data;

    // Verify collection exists if provided
    if (collectionId) {
      const collection = await prisma.collection.findUnique({
        where: { id: collectionId }
      });

      if (!collection) {
        return errorResponse('Collection not found', 404);
      }

      // Check if user owns the collection
      if (collection.creatorId !== authResult.user?.id) {
        return errorResponse('You can only add NFTs to your own collections', 403);
      }
    }

    // Create NFT
    const nft = await prisma.nFT.create({
      data: {
        name,
        description,
        image,
        price,
        category,
        tokenId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate unique token ID
        contractAddress: `0x${Math.random().toString(16).substr(2, 40)}`, // Generate contract address
        creator: {
          connect: { id: authResult.user?.id }
        },
        ...(collectionId && { 
          collection: {
            connect: { id: collectionId }
          }
        }),
        isListed: true,
      },
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

    // Log NFT creation
    logInfo('NFT created successfully', {
      nftId: nft.id,
      creatorId: authResult.user?.id,
      name,
      price,
      category,
    });

    return apiResponse(nft, 201);

  } catch (error) {
    logError('Create NFT error', error as Error);
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