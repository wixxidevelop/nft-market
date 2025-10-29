import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateUser } from '@/lib/auth-modern';
import { sendEmail } from '@/lib/email';
import { logInfo, logError } from '@/lib/logger';
import { transactionCreateSchema, paginationSchema, validateSchema } from '@/lib/validation';
import { apiResponse, errorResponse, applyMiddleware } from '@/lib/middleware';

// GET /api/transactions - List transactions with filtering and pagination
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
    const userId = searchParams.get('userId');
    const nftId = searchParams.get('nftId');
    const type = searchParams.get('type');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');

    // Build where clause
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (nftId) {
      where.nftId = nftId;
    }

    if (type) {
      where.type = type;
    }

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = parseFloat(minAmount);
      if (maxAmount) where.amount.lte = parseFloat(maxAmount);
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get transactions with related data
    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          nft: {
            select: {
              id: true,
              name: true,
              image: true,
              tokenId: true,
            }
          },
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              walletAddress: true,
            }
          }
        }
      }),
      prisma.transaction.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return apiResponse({
      transactions,
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
    logError('Get transactions error', error as Error);
    return errorResponse('Internal server error', 500);
  }
}

// POST /api/transactions - Create new transaction
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
    const validation = validateSchema(transactionCreateSchema, body);
    
    if (!validation.success) {
      return errorResponse('Validation failed', 400, validation.errors);
    }

    const { nftId, userId, amount, transactionHash, type } = validation.data;

    // Verify NFT exists
    const nft = await prisma.NFT.findUnique({
      where: { id: nftId },
      include: {
        creator: true,
      }
    });

    if (!nft) {
      return errorResponse('NFT not found', 404);
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Verify user created the NFT (for sales)
    if (type === 'SALE' && nft.creatorId !== userId) {
      return errorResponse('User did not create this NFT', 400);
    }

    // Verify transaction hash is unique
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: transactionHash } // Using id instead of transactionHash
    });

    if (existingTransaction) {
      return errorResponse('Transaction hash already exists', 409);
    }

    // Create transaction and update NFT ownership in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          nftId,
          userId,
          amount,
          txHash: transactionHash,
          type,
        },
        include: {
          nft: {
            select: {
              id: true,
              name: true,
              image: true,
              tokenId: true,
            }
          },
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              avatar: true,
              walletAddress: true,
            }
          }
        }
      });

      // Update NFT status for sales and transfers
      if (type === 'SALE' || type === 'TRANSFER') {
        await tx.NFT.update({
          where: { id: nftId },
          data: {
            isListed: false, // Remove from marketplace after sale
          }
        });
      }

      return transaction;
    });

    // Send notification emails
    try {
      // Email to user
      await sendEmail({
        to: result.user.email,
        subject: 'Transaction Confirmation',
        html: `
          <h2>Transaction Confirmation</h2>
          <p>Your ${type.toLowerCase()} transaction has been completed successfully.</p>
          <p><strong>NFT:</strong> ${result.nft?.name || 'Unknown NFT'}</p>
          <p><strong>Amount:</strong> ${amount.toString()} ETH</p>
          <p><strong>Transaction Hash:</strong> ${transactionHash}</p>
          <p><strong>User:</strong> ${result.user.username}</p>
        `
      });
    } catch (emailError) {
      logError('Email notification error', emailError as Error);
      // Don't fail the transaction if email fails
    }

    // Log transaction creation
    logInfo('Transaction created successfully', {
      transactionId: result.id,
      nftId,
      userId,
      amount,
      type,
      transactionHash,
    });

    return apiResponse(result, 201);

  } catch (error) {
    logError('Create transaction error', error as Error);
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