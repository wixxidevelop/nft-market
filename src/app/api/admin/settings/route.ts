import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-modern';
import { logInfo, logError, logAdminAction } from '@/lib/logger';
import { apiResponse, errorResponse, applyMiddleware } from '@/lib/middleware';
import { z } from 'zod';

// System settings schema
const systemSettingSchema = z.object({
  key: z.string().min(1, 'Setting key is required'),
  value: z.string(),
});

const updateSettingsSchema = z.object({
  settings: z.array(systemSettingSchema),
});

// GET /api/admin/settings - Get system settings
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

    // Get all system settings
    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' }
    });

    // Group settings by category for better organization
    const categorizedSettings = settings.reduce((acc, setting) => {
      const category = setting.key.split('.')[0] || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(setting);
      return acc;
    }, {} as Record<string, typeof settings>);

    // Get default settings if none exist
    if (settings.length === 0) {
      const defaultSettings = [
        {
          key: 'platform.name',
          value: 'Etheryte NFT Marketplace',
        },
        {
          key: 'platform.description',
          value: 'A premium NFT marketplace for digital collectibles',
        },
        {
          key: 'platform.fee_percentage',
          value: '2.5',
        },
        {
          key: 'platform.min_bid_increment',
          value: '0.01',
        },
        {
          key: 'platform.max_file_size',
          value: '10485760',
        },
        {
          key: 'email.from_address',
          value: 'noreply@etheryte.com',
        },
        {
          key: 'email.support_address',
          value: 'support@etheryte.com',
        },
        {
          key: 'security.max_login_attempts',
          value: '5',
        },
        {
          key: 'security.session_timeout',
          value: '86400',
        },
        {
          key: 'features.enable_auctions',
          value: 'true',
        },
        {
          key: 'features.enable_collections',
          value: 'true',
        },
        {
          key: 'features.enable_offers',
          value: 'true',
        },
      ];

      // Create default settings
      await prisma.systemSetting.createMany({
        data: defaultSettings,
      });

      // Re-fetch settings
      const newSettings = await prisma.systemSetting.findMany({
        orderBy: { key: 'asc' }
      });

      const newCategorizedSettings = newSettings.reduce((acc, setting) => {
        const category = setting.key.split('.')[0] || 'general';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(setting);
        return acc;
      }, {} as Record<string, typeof newSettings>);

      return apiResponse({
        settings: newSettings,
        categorized: newCategorizedSettings,
      });
    }

    return apiResponse({
      settings,
      categorized: categorizedSettings,
    });

  } catch (error) {
    logError('Get system settings error', error as Error);
    return errorResponse('Internal server error', 500);
  }
}

// PUT /api/admin/settings - Update system settings
export async function PUT(req: NextRequest) {
  try {
    // Apply middleware
    const middlewareResponse = applyMiddleware(req);
    if (middlewareResponse) return middlewareResponse;

    // Authenticate user and require admin role
    const authResult = await requireRole(req, 'ADMIN');
    if (!authResult.success) {
      return errorResponse(authResult.error || 'Admin access required', 403);
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = updateSettingsSchema.safeParse(body);
    
    if (!validation.success) {
      return errorResponse('Validation failed', 400, validation.error.issues);
    }

    const { settings } = validation.data;

    // Update settings in transaction
    const updatedSettings = await prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const setting of settings) {
        const result = await tx.systemSetting.upsert({
          where: { key: setting.key },
          update: {
            value: setting.value,
            updatedAt: new Date(),
          },
          create: {
            key: setting.key,
            value: setting.value,
          },
        });
        results.push(result);
      }
      
      return results;
    });

    // Log admin action
    await logAdminAction(
      'UPDATE_SYSTEM_SETTINGS',
      `System settings updated by user ${authResult.user?.id || 'unknown'}`,
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      req.headers.get('user-agent') || 'unknown'
    );

    logInfo('System settings updated successfully', {
      adminId: authResult.user?.id,
      settingsCount: settings.length,
      updatedKeys: settings.map(s => s.key),
    });

    return apiResponse({
      message: 'Settings updated successfully',
      settings: updatedSettings,
    });

  } catch (error) {
    logError('Update system settings error', error as Error);
    return errorResponse('Internal server error', 500);
  }
}

// POST /api/admin/settings - Create new system setting
export async function POST(req: NextRequest) {
  try {
    // Apply middleware
    const middlewareResponse = applyMiddleware(req);
    if (middlewareResponse) return middlewareResponse;

    // Authenticate user and require admin role
    const authResult = await requireRole(req, 'ADMIN');
    if (!authResult.success) {
      return errorResponse(authResult.error || 'Admin access required', 403);
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = systemSettingSchema.safeParse(body);
    
    if (!validation.success) {
      return errorResponse('Validation failed', 400, validation.error.issues);
    }

    const { key, value } = validation.data;

    // Check if setting already exists
    const existingSetting = await prisma.systemSetting.findUnique({
      where: { key }
    });

    if (existingSetting) {
      return errorResponse('Setting with this key already exists', 400);
    }

    // Create new setting
    const newSetting = await prisma.systemSetting.create({
      data: {
        key,
        value,
      }
    });

    // Log admin action
    await logAdminAction(
      'CREATE_SYSTEM_SETTING',
      `New system setting created by user ${authResult.user?.id || 'unknown'}: ${key}`,
      undefined,
      req.headers.get('user-agent') || undefined
    );

    logInfo('System setting created successfully', {
      adminId: authResult.user?.id,
      key,
      value,
    });

    return apiResponse(newSetting);

  } catch (error) {
    logError('Create system setting error', error as Error);
    return errorResponse('Internal server error', 500);
  }
}

// DELETE /api/admin/settings - Delete system setting
export async function DELETE(req: NextRequest) {
  try {
    // Apply middleware
    const middlewareResponse = applyMiddleware(req);
    if (middlewareResponse) return middlewareResponse;

    // Authenticate user and require admin role
    const authResult = await requireRole(req, 'ADMIN');
    if (!authResult.success) {
      return errorResponse(authResult.error || 'Admin access required', 403);
    }

    // Get key from query parameters
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return errorResponse('Setting key is required', 400);
    }

    // Check if setting exists
    const existingSetting = await prisma.systemSetting.findUnique({
      where: { key }
    });

    if (!existingSetting) {
      return errorResponse('Setting not found', 404);
    }

    // Delete setting
    await prisma.systemSetting.delete({
      where: { key }
    });

    // Log admin action
    await logAdminAction(
      'DELETE_SYSTEM_SETTING',
      `System setting deleted by user ${authResult.user?.id || 'unknown'}: ${key}`,
      undefined,
      req.headers.get('user-agent') || undefined
    );

    logInfo('System setting deleted successfully', {
      adminId: authResult.user?.id,
      key,
    });

    return apiResponse({ message: 'Setting deleted successfully' });

  } catch (error) {
    logError('Delete system setting error', error as Error);
    return errorResponse('Internal server error', 500);
  }
}