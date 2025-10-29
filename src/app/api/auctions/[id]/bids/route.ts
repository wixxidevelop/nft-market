import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateUser } from '@/lib/auth-modern';
import { sendEmail } from '@/lib/email';
import { logInfo, logError } from '@/lib/logger';
import { bidCreateSchema, validateSchema } from '@/lib/validation';
import { apiResponse, errorResponse, applyMiddleware } from '@/lib/middleware';

// GET /api/auctions/[id]/bids - Get bids for an auction
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply middleware
    const middlewareResponse = applyMiddleware(req);
    if (middlewareResponse) return middlewareResponse;

    const { id: auctionId } = await params;

    // Verify auction exists
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        nft: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      }
    });

    if (!auction) {
      return errorResponse('Auction not found', 404);
    }

    // Get bids for the auction
    const bids = await prisma.bid.findMany({
      where: { auctionId },
      orderBy: { amount: 'desc' },
      include: {
        bidder: {
            select: {
              id: true,
              username: true,
              avatar: true,
              isVerified: true,
            }
          },
      }
    });

    return apiResponse({
      auction: {
        id: auction.id,
        nft: auction.nft,
        currentPrice: auction.currentPrice,
        endTime: auction.endTime,
        isActive: auction.isActive,
      },
      bids,
      totalBids: bids.length,
      highestBid: bids[0] || null,
    });

  } catch (error) {
    logError('Get auction bids error', error as Error);
    return errorResponse('Internal server error', 500);
  }
}

// POST /api/auctions/[id]/bids - Place a bid on an auction
export async function POST(
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

    const { id: auctionId } = await params;

    // Parse and validate request body
    const body = await req.json();
    const validation = validateSchema(bidCreateSchema, {
      ...body,
      auctionId
    });
    
    if (!validation.success) {
      return errorResponse('Validation failed', 400, validation.errors);
    }

    const { amount } = validation.data;

    // Get auction with current highest bid
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        nft: {
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        },
        bids: {
          orderBy: { amount: 'desc' },
          take: 1,
          include: {
            bidder: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        }
      }
    });

    if (!auction) {
      return errorResponse('Auction not found', 404);
    }

    // Check if auction is active
    if (!auction.isActive) {
      return errorResponse('Auction is not active', 400);
    }

    // Check if auction has ended
    if (new Date() > auction.endTime) {
      return errorResponse('Auction has ended', 400);
    }

    // Check if user is trying to bid on their own NFT
    if (auction.sellerId === authResult.user?.id) {
      return errorResponse('You cannot bid on your own NFT', 400);
    }

    // Check if bid amount is higher than current price
    if (amount <= (auction.currentPrice || auction.startPrice)) {
      return errorResponse(`Bid must be higher than current price of ${auction.currentPrice} ETH`, 400);
    }

    // Check if user already has the highest bid
    const highestBid = auction.bids[0];
    if (highestBid && highestBid.bidderId === authResult.user?.id) {
      return errorResponse('You already have the highest bid', 400);
    }

    // Create bid and update auction in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the bid
      const bid = await tx.bid.create({
        data: {
          auctionId,
          bidderId: authResult.user?.id || '',
          amount,
          nftId: auction.nftId,
        },
        include: {
          bidder: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              isVerified: true,
            }
          },
          auction: {
            include: {
              nft: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                }
              }
            }
          }
        }
      });

      // Update auction current price
      await tx.auction.update({
        where: { id: auctionId },
        data: { currentPrice: amount }
      });

      return bid;
    });

    // Send notification emails
    try {
      // Type assertion for result with bidder relation
      const bidWithBidder = result as typeof result & {
        bidder: {
          id: string;
          firstName: string | null;
          lastName: string | null;
          email: string;
          avatar: string | null;
          isVerified: boolean;
        };
      };

      // Email to NFT creator
      await sendEmail({
        to: auction.nft.creator.email,
        subject: 'New Bid on Your NFT Auction',
        html: `
          <h2>New Bid on Your NFT Auction</h2>
          <p>Your NFT "${auction.nft.name}" has received a new bid!</p>
          <p><strong>Bid Amount:</strong> ${amount.toString()} ETH</p>
          <p><strong>Bidder:</strong> ${bidWithBidder.bidder.firstName || 'Anonymous'} ${bidWithBidder.bidder.lastName || ''}</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/auction/${auctionId}">View Auction</a></p>
        `
      });

      // Email to previous highest bidder (if exists)
      if (highestBid && highestBid.bidder && highestBid.bidder.email) {
        await sendEmail({
          to: highestBid.bidder.email,
          subject: 'You have been outbid',
          html: `
            <h2>You have been outbid</h2>
            <p>Your bid on "${auction.nft.name}" has been outbid.</p>
            <p><strong>Your Bid:</strong> ${highestBid.amount.toString()} ETH</p>
            <p><strong>New Bid:</strong> ${amount.toString()} ETH</p>
            <p><strong>New Bidder:</strong> ${bidWithBidder.bidder.firstName || 'Anonymous'} ${bidWithBidder.bidder.lastName || ''}</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/auction/${auctionId}">View Auction</a></p>
          `
        });
      }
    } catch (emailError) {
      logError('Failed to send bid notification emails', emailError as Error, { 
        bidId: result.id 
      });
      // Don't fail bid if email fails
    }

    // Log bid creation
    logInfo('Bid placed successfully', {
      bidId: result.id,
      auctionId,
      bidderId: authResult.user?.id,
      amount,
      nftId: auction.nft.id,
    });

    return apiResponse(result, 201);

  } catch (error) {
    logError('Place bid error', error as Error);
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