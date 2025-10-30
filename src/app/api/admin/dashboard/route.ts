import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-modern';
import { logInfo, logError } from '@/lib/logger';
import { apiResponse, errorResponse, applyMiddleware } from '@/lib/middleware';

// GET /api/admin/dashboard - Get admin dashboard data
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

    // Get current date ranges for statistics
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get user statistics
    const [
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      verifiedUsers,
      adminUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.user.count({ where: { isAdmin: true } }),
    ]);

    // Get NFT statistics
    const [
      totalNFTs,
      newNFTsToday,
      newNFTsThisWeek,
      newNFTsThisMonth,
      listedNFTs,
      soldNFTs,
    ] = await Promise.all([
      prisma.nFT.count(),
      prisma.nFT.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.nFT.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.nFT.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.nFT.count({ where: { isListed: true } }),
      prisma.nFT.count({ where: { isSold: true } }),
    ]);

    // Get transaction statistics
    const [
      totalTransactions,
      transactionsToday,
      transactionsThisWeek,
      transactionsThisMonth,
      transactionVolume,
      volumeToday,
      volumeThisWeek,
      volumeThisMonth,
    ] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.transaction.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.transaction.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.transaction.aggregate({ _sum: { amount: true } }),
      prisma.transaction.aggregate({
        where: { createdAt: { gte: startOfToday } },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { createdAt: { gte: startOfWeek } },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { createdAt: { gte: startOfMonth } },
        _sum: { amount: true }
      }),
    ]);

    // Get auction statistics
    const [
      totalAuctions,
      activeAuctions,
      auctionsToday,
      auctionsThisWeek,
      auctionsThisMonth,
    ] = await Promise.all([
      prisma.auction.count(),
      prisma.auction.count({ where: { isActive: true } }),
      prisma.auction.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.auction.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.auction.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);

    // Get collection statistics
    const [
      totalCollections,
      collectionsToday,
      collectionsThisWeek,
      collectionsThisMonth,
    ] = await Promise.all([
      prisma.collection.count(),
      prisma.collection.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.collection.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.collection.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);

    // Get recent activities
    const [recentUsers, recentNFTs, recentTransactions, recentAuctions] = await Promise.all([
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          isVerified: true,
          isAdmin: true,
          createdAt: true,
        }
      }),
      prisma.nFT.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              avatar: true,
            }
          }
        }
      }),
      prisma.transaction.findMany({
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
      }),
      prisma.auction.findMany({
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
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            }
          }
        }
      }),
    ]);

    // Get top performers
    const [topCreators, topCollectors, topCollections] = await Promise.all([
      prisma.user.findMany({
        take: 10,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isVerified: true,
          _count: {
            select: {
              nfts: true,
              transactions: true,
            }
          }
        }
      }),
      prisma.user.findMany({
        take: 10,
        orderBy: {
          nfts: {
            _count: 'desc'
          }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isVerified: true,
          _count: {
            select: {
              nfts: true,
              transactions: true,
            }
          }
        }
      }),
      prisma.collection.findMany({
        take: 10,
        orderBy: {
          nfts: {
            _count: 'desc'
          }
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            }
          },
          _count: {
            select: {
              nfts: true,
            }
          }
        }
      }),
    ]);

    // Get system health metrics
    const systemHealth = {
      database: 'healthy', // This could be enhanced with actual health checks
      email: 'healthy',
      storage: 'healthy',
      lastBackup: new Date(), // This would come from actual backup system
    };

    // Log admin dashboard access
    logInfo('Admin dashboard accessed', {
      adminId: authResult.user?.id,
      timestamp: new Date(),
    });

    return apiResponse({
      overview: {
        users: {
          total: totalUsers,
          today: newUsersToday,
          thisWeek: newUsersThisWeek,
          thisMonth: newUsersThisMonth,
          verified: verifiedUsers,
          admins: adminUsers,
        },
        nfts: {
          total: totalNFTs,
          today: newNFTsToday,
          thisWeek: newNFTsThisWeek,
          thisMonth: newNFTsThisMonth,
          listed: listedNFTs,
          sold: soldNFTs,
        },
        transactions: {
          total: totalTransactions,
          today: transactionsToday,
          thisWeek: transactionsThisWeek,
          thisMonth: transactionsThisMonth,
        },
        volume: {
          total: transactionVolume._sum.amount || 0,
          today: volumeToday._sum.amount || 0,
          thisWeek: volumeThisWeek._sum.amount || 0,
          thisMonth: volumeThisMonth._sum.amount || 0,
        },
        auctions: {
          total: totalAuctions,
          active: activeAuctions,
          today: auctionsToday,
          thisWeek: auctionsThisWeek,
          thisMonth: auctionsThisMonth,
        },
        collections: {
          total: totalCollections,
          today: collectionsToday,
          thisWeek: collectionsThisWeek,
          thisMonth: collectionsThisMonth,
        },
      },
      recentActivity: {
        users: recentUsers,
        nfts: recentNFTs,
        transactions: recentTransactions,
        auctions: recentAuctions,
      },
      topPerformers: {
        creators: topCreators,
        collectors: topCollectors,
        collections: topCollections,
      },
      systemHealth,
    });

  } catch (error) {
    logError('Admin dashboard error', error as Error);
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