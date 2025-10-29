import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateUser } from '@/lib/auth-modern';
import { logInfo, logError } from '@/lib/logger';
import { collectionCreateSchema, paginationSchema, validateSchema } from '@/lib/validation';
import { apiResponse, errorResponse, applyMiddleware } from '@/lib/middleware';

// GET /api/collections - List collections with filtering and pagination
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
    const creatorId = searchParams.get('creatorId');
    const query = searchParams.get('query');

    // Build where clause
    const where: any = {};

    if (creatorId) {
      where.creatorId = creatorId;
    }

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get collections with related data
    const [collections, totalCount] = await Promise.all([
      prisma.collection.findMany({
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
          _count: {
            select: {
              nfts: true,
            }
          },
          nfts: {
            take: 4,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              image: true,
              price: true,
            }
          }
        }
      }),
      prisma.collection.count({ where })
    ]);

    // Calculate collection stats
    const collectionsWithStats = await Promise.all(
      collections.map(async (collection) => {
        const stats = await prisma.nFT.aggregate({
          where: { collectionId: collection.id },
          _avg: { price: true },
          _min: { price: true },
          _max: { price: true },
          _sum: { price: true },
        });

        return {
          ...collection,
          stats: {
            totalNFTs: collection._count.nfts,
            floorPrice: stats._min.price || 0,
            avgPrice: stats._avg.price || 0,
            maxPrice: stats._max.price || 0,
            totalVolume: stats._sum.price || 0,
          }
        };
      })
    );

    const totalPages = Math.ceil(totalCount / limit);

    return apiResponse({
      collections: collectionsWithStats,
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
    logError('Get collections error', error as Error);
    return errorResponse('Internal server error', 500);
  }
}

// POST /api/collections - Create new collection
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
    const validation = validateSchema(collectionCreateSchema, body);
    
    if (!validation.success) {
      return errorResponse('Validation failed', 400, validation.errors);
    }

    const { name, description, image, banner } = validation.data;

    // Generate unique slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check if collection name already exists for this user
    const existingCollection = await prisma.collection.findFirst({
      where: {
        name,
        creatorId: authResult.user?.id,
      }
    });

    if (existingCollection) {
      return errorResponse('You already have a collection with this name', 409);
    }

    // Create collection
    const collection = await prisma.collection.create({
      data: {
        name,
        description,
        image,
        banner,
        slug,
        creator: {
          connect: { id: authResult.user?.id }
        }
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
        _count: {
          select: {
            nfts: true,
          }
        }
      }
    });

    // Log collection creation
    logInfo('Collection created successfully', {
      collectionId: collection.id,
      creatorId: authResult.user?.id,
      name,
    });

    return apiResponse(collection, 201);

  } catch (error) {
    logError('Create collection error', error as Error);
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