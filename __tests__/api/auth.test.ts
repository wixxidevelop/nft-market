// Authentication API tests

import { NextRequest } from 'next/server';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { POST as registerPOST } from '@/app/api/auth/register/route';
import { GET as getMePOST } from '@/app/api/auth/me/route';
import testUtils from '@/lib/test-utils';

const { mockData, tokenUtils, requestBuilder, assertions, dbMock, testScenarios } = testUtils;

describe('Authentication API', () => {
  beforeEach(() => {
    dbMock.clear();
    dbMock.seed();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const request = requestBuilder.post(
        'http://localhost:3000/api/auth/login',
        testScenarios.authentication.validLogin
      );

      const response = await loginPOST(request);
      
      await assertions.expectSuccess(response, 200);
      
      const data = await response.json();
      expect(data.data).toHaveProperty('token');
      expect(data.data).toHaveProperty('user');
      expect(data.data.user.email).toBe(testScenarios.authentication.validLogin.email);
    });

    it('should reject invalid credentials', async () => {
      const request = requestBuilder.post(
        'http://localhost:3000/api/auth/login',
        testScenarios.authentication.invalidLogin
      );

      const response = await loginPOST(request);
      
      await assertions.expectError(response, 401);
      
      const data = await response.json();
      expect(data.error).toContain('Invalid credentials');
    });

    it('should reject missing email', async () => {
      const request = requestBuilder.post(
        'http://localhost:3000/api/auth/login',
        { password: 'password123' }
      );

      const response = await loginPOST(request);
      
      await assertions.expectError(response, 400);
    });

    it('should reject missing password', async () => {
      const request = requestBuilder.post(
        'http://localhost:3000/api/auth/login',
        { email: 'test@example.com' }
      );

      const response = await loginPOST(request);
      
      await assertions.expectError(response, 400);
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      const response = await loginPOST(request);
      
      await assertions.expectError(response, 400);
    });

    it('should respond within acceptable time', async () => {
      const request = requestBuilder.post(
        'http://localhost:3000/api/auth/login',
        testScenarios.authentication.validLogin
      );

      const { response, duration } = await testUtils.performanceUtils.measureResponseTime(
        () => loginPOST(request)
      );

      assertions.expectResponseTime(duration, 1000); // 1 second max
      await assertions.expectSuccess(response, 200);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register with valid data', async () => {
      const request = requestBuilder.post(
        'http://localhost:3000/api/auth/register',
        testScenarios.authentication.validRegistration
      );

      const response = await registerPOST(request);
      
      await assertions.expectSuccess(response, 201);
      
      const data = await response.json();
      expect(data.data).toHaveProperty('token');
      expect(data.data).toHaveProperty('user');
      expect(data.data.user.email).toBe(testScenarios.authentication.validRegistration.email);
    });

    it('should reject invalid email format', async () => {
      const request = requestBuilder.post(
        'http://localhost:3000/api/auth/register',
        testScenarios.authentication.invalidRegistration
      );

      const response = await registerPOST(request);
      
      await assertions.expectError(response, 400);
    });

    it('should reject duplicate email', async () => {
      // First registration
      const request1 = requestBuilder.post(
        'http://localhost:3000/api/auth/register',
        testScenarios.authentication.validRegistration
      );
      await registerPOST(request1);

      // Duplicate registration
      const request2 = requestBuilder.post(
        'http://localhost:3000/api/auth/register',
        testScenarios.authentication.validRegistration
      );

      const response = await registerPOST(request2);
      
      await assertions.expectError(response, 409);
      
      const data = await response.json();
      expect(data.error).toContain('already exists');
    });

    it('should reject weak password', async () => {
      const request = requestBuilder.post(
        'http://localhost:3000/api/auth/register',
        {
          ...testScenarios.authentication.validRegistration,
          password: '123',
        }
      );

      const response = await registerPOST(request);
      
      await assertions.expectError(response, 400);
    });

    it('should reject short username', async () => {
      const request = requestBuilder.post(
        'http://localhost:3000/api/auth/register',
        {
          ...testScenarios.authentication.validRegistration,
          username: 'ab',
        }
      );

      const response = await registerPOST(request);
      
      await assertions.expectError(response, 400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile for authenticated user', async () => {
      const userId = 'user-123';
      const token = tokenUtils.generateUserToken(userId);
      const request = requestBuilder.withAuth(
        requestBuilder.get('http://localhost:3000/api/auth/me'),
        token
      );

      const response = await getMePOST(request);
      
      await assertions.expectSuccess(response, 200);
      
      const data = await response.json();
      expect(data.data.user.id).toBe(userId);
      expect(data.data.user).not.toHaveProperty('password');
    });

    it('should reject unauthenticated request', async () => {
      const request = requestBuilder.get('http://localhost:3000/api/auth/me');

      const response = await getMePOST(request);
      
      await assertions.expectError(response, 401);
    });

    it('should reject invalid token', async () => {
      const request = requestBuilder.withAuth(
        requestBuilder.get('http://localhost:3000/api/auth/me'),
        'invalid-token'
      );

      const response = await getMePOST(request);
      
      await assertions.expectError(response, 401);
    });

    it('should reject expired token', async () => {
      const expiredToken = tokenUtils.generateExpiredToken();
      const request = requestBuilder.withAuth(
        requestBuilder.get('http://localhost:3000/api/auth/me'),
        expiredToken
      );

      const response = await getMePOST(request);
      
      await assertions.expectError(response, 401);
    });

    it('should handle non-existent user', async () => {
      const token = tokenUtils.generateUserToken('non-existent-user');
      const request = requestBuilder.withAuth(
        requestBuilder.get('http://localhost:3000/api/auth/me'),
        token
      );

      const response = await getMePOST(request);
      
      await assertions.expectError(response, 404);
    });
  });

  describe('Authentication Performance', () => {
    it('should handle concurrent login requests', async () => {
      const results = await testUtils.performanceUtils.loadTest(
        () => {
          const request = requestBuilder.post(
            'http://localhost:3000/api/auth/login',
            testScenarios.authentication.validLogin
          );
          return loginPOST(request);
        },
        10, // concurrency
        50  // iterations
      );

      expect(results.successfulRequests).toBeGreaterThan(40); // 80% success rate
      expect(results.averageResponseTime).toBeLessThan(1000); // 1 second average
    });

    it('should handle concurrent registration requests', async () => {
      const results = await testUtils.performanceUtils.loadTest(
        () => {
          const uniqueEmail = `test${Date.now()}${Math.random()}@example.com`;
          const request = requestBuilder.post(
            'http://localhost:3000/api/auth/register',
            {
              ...testScenarios.authentication.validRegistration,
              email: uniqueEmail,
              username: `user${Date.now()}${Math.random()}`,
            }
          );
          return registerPOST(request);
        },
        5,  // concurrency
        25  // iterations
      );

      expect(results.successfulRequests).toBeGreaterThan(20); // 80% success rate
      expect(results.averageResponseTime).toBeLessThan(2000); // 2 seconds average
    });
  });

  describe('Authentication Security', () => {
    it('should not expose sensitive information in error messages', async () => {
      const request = requestBuilder.post(
        'http://localhost:3000/api/auth/login',
        { email: 'test@example.com', password: 'wrongpassword' }
      );

      const response = await loginPOST(request);
      const data = await response.json();

      expect(data.error).not.toContain('password');
      expect(data.error).not.toContain('hash');
      expect(data.error).not.toContain('salt');
    });

    it('should rate limit login attempts', async () => {
      const requests = Array(10).fill(0).map(() =>
        requestBuilder.post(
          'http://localhost:3000/api/auth/login',
          testScenarios.authentication.invalidLogin
        )
      );

      const responses = await Promise.all(
        requests.map(request => loginPOST(request))
      );

      // Should have some rate limited responses
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should validate JWT token structure', async () => {
      const malformedTokens = [
        'not.a.jwt',
        'header.payload', // missing signature
        'invalid-token-format',
        '',
      ];

      for (const token of malformedTokens) {
        const request = requestBuilder.withAuth(
          requestBuilder.get('http://localhost:3000/api/auth/me'),
          token
        );

        const response = await getMePOST(request);
        await assertions.expectError(response, 401);
      }
    });
  });
});