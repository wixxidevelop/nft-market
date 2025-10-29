import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/performance';
import { requireRole, verifyAccessToken } from '@/lib/auth-modern';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user and require admin role
    const authResult = await requireRole(request, 'ADMIN');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeWindow = parseInt(searchParams.get('timeWindow') || '300000'); // 5 minutes default
    const action = searchParams.get('action');

    switch (action) {
      case 'summary':
        const summary = performanceMonitor.getSummary(timeWindow);
        return NextResponse.json({
          success: true,
          data: summary,
        });

      case 'slow-queries':
        const threshold = parseInt(searchParams.get('threshold') || '1000');
        const limit = parseInt(searchParams.get('limit') || '10');
        const slowQueries = performanceMonitor.getSlowQueries(threshold, limit);
        return NextResponse.json({
          success: true,
          data: slowQueries,
        });

      case 'cleanup':
        const olderThan = parseInt(searchParams.get('olderThan') || '3600000'); // 1 hour default
        performanceMonitor.cleanup(olderThan);
        return NextResponse.json({
          success: true,
          message: 'Performance data cleaned up',
        });

      default:
        // Return basic system info
        const systemInfo = {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
          version: process.version,
          platform: process.platform,
          arch: process.arch,
        };

        return NextResponse.json({
          success: true,
          data: systemInfo,
        });
    }
  } catch (error) {
    console.error('Performance API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyAccessToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'record-metric':
        const { name, value, metadata } = data;
        performanceMonitor.recordMetric(name, value, metadata);
        return NextResponse.json({
          success: true,
          message: 'Metric recorded',
        });

      case 'record-db-query':
        const { query, duration, success, error } = data;
        performanceMonitor.recordDbQuery(query, duration, success, error);
        return NextResponse.json({
          success: true,
          message: 'Database query recorded',
        });

      case 'force-gc':
        if (global.gc) {
          global.gc();
          return NextResponse.json({
            success: true,
            message: 'Garbage collection forced',
            memoryAfter: process.memoryUsage(),
          });
        } else {
          return NextResponse.json({
            success: false,
            error: 'Garbage collection not available (use --expose-gc flag)',
          }, { status: 400 });
        }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Performance API POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}