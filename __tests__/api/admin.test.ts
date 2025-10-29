// Admin API tests

import { NextRequest } from 'next/server';
import { GET as getDashboardHandler } from '@/app/api/admin/dashboard/route';
import { GET as getSystemLogsHandler } from '@/app/api/admin/logs/route';
import { GET as getSettingsHandler, PUT as updateSettingsHandler, POST as createSettingsHandler, DELETE as deleteSettingsHandler } from '@/app/api/admin/settings/route';
import testUtils from '@/lib/test-utils';

const { mockData, tokenUtils, requestBuilder, assertions, dbMock, testScenarios } = testUtils;

describe('Admin API', () => {
  beforeEach(() => {
    dbMock.clear();
    dbMock.seed();
  });

  describe('GET /api/admin/dashboard', () => {
    it('should return admin dashboard statistics', async () => {
      const token = tokenUtils.generateAdminToken();
      const request = requestBuilder.withAuth(
        requestBuilder.get('http://localhost:3000/api/admin/dashboard'),
        token
      );

      const response = await getDashboardHandler(request);
      
      await assertions.expectSuccess(response, 200);
      
      const data = await response.json();
      expect(data.data.overview).toHaveProperty('users');
      expect(data.data.overview).toHaveProperty('nfts');
      expect(data.data.overview).toHaveProperty('transactions');
      expect(data.data.overview).toHaveProperty('volume');
      expect(data.data.overview).toHaveProperty('auctions');
      expect(data.data.overview).toHaveProperty('collections');
    });

    it('should reject non-admin access', async () => {
      const token = tokenUtils.generateUserToken();
      const request = requestBuilder.withAuth(
        requestBuilder.get('http://localhost:3000/api/admin/dashboard'),
        token
      );

      const response = await getDashboardHandler(request);
      
      await assertions.expectError(response, 403);
    });

    it('should reject unauthenticated access', async () => {
      const request = requestBuilder.get('http://localhost:3000/api/admin/dashboard');

      const response = await getDashboardHandler(request);
      
      await assertions.expectError(response, 401);
    });
  });

  describe('GET /api/admin/logs', () => {
    it('should return paginated system logs', async () => {
      const token = tokenUtils.generateAdminToken();
      const url = requestBuilder.withQuery(
        'http://localhost:3000/api/admin/logs',
        testScenarios.pagination.firstPage
      );
      const request = requestBuilder.withAuth(
        requestBuilder.get(url),
        token
      );

      const response = await getSystemLogsHandler(request);
      
      await assertions.expectSuccess(response, 200);
      await assertions.expectPagination(response);
      
      const data = await response.json();
      expect(Array.isArray(data.data.logs)).toBe(true);
      expect(data.data.pagination).toHaveProperty('page');
      expect(data.data.pagination).toHaveProperty('limit');
      expect(data.data.pagination).toHaveProperty('total');
    });

    it('should filter logs by level', async () => {
      const token = tokenUtils.generateAdminToken();
      const url = requestBuilder.withQuery(
        'http://localhost:3000/api/admin/logs',
        { ...testScenarios.pagination.firstPage, level: 'error' }
      );
      const request = requestBuilder.withAuth(
        requestBuilder.get(url),
        token
      );

      const response = await getSystemLogsHandler(request);
      
      await assertions.expectSuccess(response, 200);
      
      const data = await response.json();
      data.data.logs.forEach((log: any) => {
        expect(log.level).toBe('error');
      });
    });

    it('should filter logs by service', async () => {
      const token = tokenUtils.generateAdminToken();
      const url = requestBuilder.withQuery(
        'http://localhost:3000/api/admin/logs',
        { ...testScenarios.pagination.firstPage, service: 'auth' }
      );
      const request = requestBuilder.withAuth(
        requestBuilder.get(url),
        token
      );

      const response = await getSystemLogsHandler(request);
      
      await assertions.expectSuccess(response, 200);
      
      const data = await response.json();
      data.data.logs.forEach((log: any) => {
        expect(log.service).toBe('auth');
      });
    });

    it('should search logs by message content', async () => {
      const token = tokenUtils.generateAdminToken();
      const url = requestBuilder.withQuery(
        'http://localhost:3000/api/admin/logs',
        { ...testScenarios.pagination.firstPage, search: 'login' }
      );
      const request = requestBuilder.withAuth(
        requestBuilder.get(url),
        token
      );

      const response = await getSystemLogsHandler(request);
      
      await assertions.expectSuccess(response, 200);
      
      const data = await response.json();
      data.data.logs.forEach((log: any) => {
        expect(log.message.toLowerCase()).toContain('login');
      });
    });

    it('should reject non-admin access', async () => {
      const token = tokenUtils.generateUserToken();
      const request = requestBuilder.withAuth(
        requestBuilder.get('http://localhost:3000/api/admin/logs'),
        token
      );

      const response = await getSystemLogsHandler(request);
      
      await assertions.expectError(response, 403);
    });
  });

  describe('GET /api/admin/settings', () => {
    it('should return system settings', async () => {
      const token = tokenUtils.generateAdminToken();
      const request = requestBuilder.withAuth(
        requestBuilder.get('http://localhost:3000/api/admin/settings'),
        token
      );

      const response = await getSettingsHandler(request);
      
      await assertions.expectSuccess(response, 200);
      
      const data = await response.json();
      expect(data.data).toHaveProperty('settings');
    });

    it('should reject non-admin access', async () => {
      const token = tokenUtils.generateUserToken();
      const request = requestBuilder.withAuth(
        requestBuilder.get('http://localhost:3000/api/admin/settings'),
        token
      );

      const response = await getSettingsHandler(request);
      
      await assertions.expectError(response, 403);
    });
  });

  describe('PUT /api/admin/settings', () => {
    it('should update system settings', async () => {
      const token = tokenUtils.generateAdminToken();
      const settingsData = {
        maintenanceMode: false,
        registrationEnabled: true,
        maxFileSize: 10485760
      };

      const request = requestBuilder.withAuth(
        requestBuilder.put('http://localhost:3000/api/admin/settings', settingsData),
        token
      );

      const response = await updateSettingsHandler(request);
      
      await assertions.expectSuccess(response, 200);
      
      const data = await response.json();
      expect(data.data.settings.maintenanceMode).toBe(false);
      expect(data.data.settings.registrationEnabled).toBe(true);
    });

    it('should validate settings data', async () => {
      const token = tokenUtils.generateAdminToken();
      const invalidSettingsData = {
        maxFileSize: 'invalid'
      };

      const request = requestBuilder.withAuth(
        requestBuilder.put('http://localhost:3000/api/admin/settings', invalidSettingsData),
        token
      );

      const response = await updateSettingsHandler(request);
      
      await assertions.expectError(response, 400);
    });

    it('should reject non-admin access', async () => {
      const token = tokenUtils.generateUserToken();
      const settingsData = {
        maintenanceMode: true
      };

      const request = requestBuilder.withAuth(
        requestBuilder.put('http://localhost:3000/api/admin/settings', settingsData),
        token
      );

      const response = await updateSettingsHandler(request);
      
      await assertions.expectError(response, 403);
    });
  });

  describe('POST /api/admin/settings', () => {
    it('should create new settings', async () => {
      const token = tokenUtils.generateAdminToken();
      const settingsData = {
        key: 'newSetting',
        value: 'testValue',
        type: 'string'
      };

      const request = requestBuilder.withAuth(
        requestBuilder.post('http://localhost:3000/api/admin/settings', settingsData),
        token
      );

      const response = await createSettingsHandler(request);
      
      await assertions.expectSuccess(response, 201);
    });

    it('should validate required fields', async () => {
      const token = tokenUtils.generateAdminToken();
      const invalidSettingsData = {
        value: 'testValue'
        // missing key
      };

      const request = requestBuilder.withAuth(
        requestBuilder.post('http://localhost:3000/api/admin/settings', invalidSettingsData),
        token
      );

      const response = await createSettingsHandler(request);
      
      await assertions.expectError(response, 400);
    });

    it('should reject non-admin access', async () => {
      const token = tokenUtils.generateUserToken();
      const settingsData = {
        key: 'newSetting',
        value: 'testValue'
      };

      const request = requestBuilder.withAuth(
        requestBuilder.post('http://localhost:3000/api/admin/settings', settingsData),
        token
      );

      const response = await createSettingsHandler(request);
      
      await assertions.expectError(response, 403);
    });
  });

  describe('DELETE /api/admin/settings', () => {
    it('should delete settings', async () => {
      const token = tokenUtils.generateAdminToken();
      const request = requestBuilder.withAuth(
        requestBuilder.delete('http://localhost:3000/api/admin/settings?key=testSetting'),
        token
      );

      const response = await deleteSettingsHandler(request);
      
      await assertions.expectSuccess(response, 200);
    });

    it('should validate setting key exists', async () => {
      const token = tokenUtils.generateAdminToken();
      const request = requestBuilder.withAuth(
        requestBuilder.delete('http://localhost:3000/api/admin/settings?key=nonExistentSetting'),
        token
      );

      const response = await deleteSettingsHandler(request);
      
      await assertions.expectError(response, 404);
    });

    it('should reject non-admin access', async () => {
      const token = tokenUtils.generateUserToken();
      const request = requestBuilder.withAuth(
        requestBuilder.delete('http://localhost:3000/api/admin/settings?key=testSetting'),
        token
      );

      const response = await deleteSettingsHandler(request);
      
      await assertions.expectError(response, 403);
    });
  });
});