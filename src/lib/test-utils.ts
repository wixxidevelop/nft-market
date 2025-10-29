// Testing utilities for API endpoints and components

import { NextRequest, NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';

// Mock data generators
export const mockData = {
  user: (overrides: Partial<any> = {}) => ({
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    role: 'user',
    isVerified: true,
    isActive: true,
    balance: 100.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  admin: (overrides: Partial<any> = {}) => ({
    id: 'admin-123',
    email: 'admin@example.com',
    username: 'admin',
    role: 'admin',
    isVerified: true,
    isActive: true,
    balance: 1000.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  nft: (overrides: Partial<any> = {}) => ({
    id: 'nft-123',
    title: 'Test NFT',
    description: 'A test NFT for testing purposes',
    image: 'https://example.com/image.jpg',
    price: 1.5,
    currency: 'ETH',
    category: 'Art',
    tags: ['digital', 'art'],
    ownerId: 'user-123',
    collectionId: 'collection-123',
    isListed: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  collection: (overrides: Partial<any> = {}) => ({
    id: 'collection-123',
    name: 'Test Collection',
    description: 'A test collection',
    image: 'https://example.com/collection.jpg',
    creatorId: 'user-123',
    isVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  transaction: (overrides: Partial<any> = {}) => ({
    id: 'transaction-123',
    type: 'purchase',
    amount: 1.5,
    currency: 'ETH',
    status: 'completed',
    fromUserId: 'user-456',
    toUserId: 'user-123',
    nftId: 'nft-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  auction: (overrides: Partial<any> = {}) => ({
    id: 'auction-123',
    nftId: 'nft-123',
    startingPrice: 1.0,
    currentPrice: 2.5,
    currency: 'ETH',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    sellerId: 'user-123',
    winnerId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),
};

// JWT token generators
export const tokenUtils = {
  generateToken: (payload: any, expiresIn: string = '1h'): string => {
    return sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn } as any);
  },

  generateUserToken: (userId: string = 'user-123', role: string = 'user'): string => {
    return tokenUtils.generateToken({ userId, role });
  },

  generateAdminToken: (userId: string = 'admin-123'): string => {
    return tokenUtils.generateToken({ userId, role: 'admin' });
  },

  generateExpiredToken: (userId: string = 'user-123', role: string = 'user'): string => {
    return tokenUtils.generateToken({ userId, role }, '-1h');
  },
};

// Request builders
export const requestBuilder = {
  get: (url: string, headers: Record<string, string> = {}): NextRequest => {
    return new NextRequest(url, {
      method: 'GET',
      headers: new Headers(headers),
    });
  },

  post: (url: string, body: any, headers: Record<string, string> = {}): NextRequest => {
    return new NextRequest(url, {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        ...headers,
      }),
      body: JSON.stringify(body),
    });
  },

  put: (url: string, body: any, headers: Record<string, string> = {}): NextRequest => {
    return new NextRequest(url, {
      method: 'PUT',
      headers: new Headers({
        'Content-Type': 'application/json',
        ...headers,
      }),
      body: JSON.stringify(body),
    });
  },

  patch: (url: string, body: any, headers: Record<string, string> = {}): NextRequest => {
    return new NextRequest(url, {
      method: 'PATCH',
      headers: new Headers({
        'Content-Type': 'application/json',
        ...headers,
      }),
      body: JSON.stringify(body),
    });
  },

  delete: (url: string, headers: Record<string, string> = {}): NextRequest => {
    return new NextRequest(url, {
      method: 'DELETE',
      headers: new Headers(headers),
    });
  },

  withAuth: (request: NextRequest, token: string): NextRequest => {
    request.headers.set('Authorization', `Bearer ${token}`);
    return request;
  },

  withQuery: (url: string, params: Record<string, string>): string => {
    const searchParams = new URLSearchParams(params);
    return `${url}?${searchParams.toString()}`;
  },
};

// Response validators
export const responseValidators = {
  isSuccessResponse: (response: NextResponse): boolean => {
    return response.status >= 200 && response.status < 300;
  },

  isErrorResponse: (response: NextResponse): boolean => {
    return response.status >= 400;
  },

  hasJsonContent: (response: NextResponse): boolean => {
    const contentType = response.headers.get('content-type');
    return contentType?.includes('application/json') || false;
  },

  validateSuccessStructure: async (response: NextResponse): Promise<boolean> => {
    if (!responseValidators.hasJsonContent(response)) return false;
    
    try {
      const data = await response.json();
      return typeof data === 'object' && data.success === true && 'data' in data;
    } catch {
      return false;
    }
  },

  validateErrorStructure: async (response: NextResponse): Promise<boolean> => {
    if (!responseValidators.hasJsonContent(response)) return false;
    
    try {
      const data = await response.json();
      return typeof data === 'object' && 'error' in data;
    } catch {
      return false;
    }
  },

  validatePaginationStructure: async (response: NextResponse): Promise<boolean> => {
    if (!responseValidators.hasJsonContent(response)) return false;
    
    try {
      const data = await response.json();
      return (
        data.success === true &&
        'data' in data &&
        'pagination' in data.data &&
        typeof data.data.pagination === 'object'
      );
    } catch {
      return false;
    }
  },
};

// Database mocking utilities
export const dbMock = {
  users: new Map<string, any>(),
  nfts: new Map<string, any>(),
  collections: new Map<string, any>(),
  transactions: new Map<string, any>(),
  auctions: new Map<string, any>(),

  seed: () => {
    // Seed with test data
    const user = mockData.user();
    const admin = mockData.admin();
    const nft = mockData.nft();
    const collection = mockData.collection();
    const transaction = mockData.transaction();
    const auction = mockData.auction();

    dbMock.users.set(user.id, user);
    dbMock.users.set(admin.id, admin);
    dbMock.nfts.set(nft.id, nft);
    dbMock.collections.set(collection.id, collection);
    dbMock.transactions.set(transaction.id, transaction);
    dbMock.auctions.set(auction.id, auction);
  },

  clear: () => {
    dbMock.users.clear();
    dbMock.nfts.clear();
    dbMock.collections.clear();
    dbMock.transactions.clear();
    dbMock.auctions.clear();
  },

  findUser: (id: string) => dbMock.users.get(id),
  findUserByEmail: (email: string) => {
    for (const user of Array.from(dbMock.users.values())) {
      if (user.email === email) return user;
    }
    return null;
  },

  createUser: (userData: any) => {
    const user = { ...userData, id: `user-${Date.now()}` };
    dbMock.users.set(user.id, user);
    return user;
  },

  updateUser: (id: string, updates: any) => {
    const user = dbMock.users.get(id);
    if (user) {
      const updated = { ...user, ...updates, updatedAt: new Date().toISOString() };
      dbMock.users.set(id, updated);
      return updated;
    }
    return null;
  },

  deleteUser: (id: string) => {
    return dbMock.users.delete(id);
  },
};

// Test scenarios
export const testScenarios = {
  authentication: {
    validLogin: {
      email: 'test@example.com',
      password: 'password123',
    },
    invalidLogin: {
      email: 'invalid@example.com',
      password: 'wrongpassword',
    },
    validRegistration: {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'password123',
    },
    invalidRegistration: {
      email: 'invalid-email',
      username: 'ab', // too short
      password: '123', // too short
    },
  },

  nft: {
    validCreate: {
      title: 'New NFT',
      description: 'A new NFT for testing',
      image: 'https://example.com/nft.jpg',
      price: 2.5,
      currency: 'ETH',
      category: 'Art',
      tags: ['digital', 'art', 'test'],
    },
    invalidCreate: {
      title: '', // empty title
      description: 'A new NFT for testing',
      image: 'invalid-url',
      price: -1, // negative price
      currency: 'INVALID',
    },
  },

  pagination: {
    firstPage: { page: '1', limit: '10' },
    secondPage: { page: '2', limit: '10' },
    largePage: { page: '1', limit: '100' },
    invalidPage: { page: '0', limit: '-1' },
  },
};

// Performance testing utilities
export const performanceUtils = {
  measureResponseTime: async (requestFn: () => Promise<NextResponse>): Promise<{
    response: NextResponse;
    duration: number;
  }> => {
    const start = performance.now();
    const response = await requestFn();
    const duration = performance.now() - start;
    
    return { response, duration };
  },

  measureMemoryUsage: (): NodeJS.MemoryUsage => {
    return process.memoryUsage();
  },

  loadTest: async (
    requestFn: () => Promise<NextResponse>,
    concurrency: number = 10,
    iterations: number = 100
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
  }> => {
    const results: number[] = [];
    let successCount = 0;
    let failCount = 0;

    const batches = Math.ceil(iterations / concurrency);
    
    for (let batch = 0; batch < batches; batch++) {
      const batchSize = Math.min(concurrency, iterations - batch * concurrency);
      const promises = Array(batchSize).fill(0).map(async () => {
        try {
          const { response, duration } = await performanceUtils.measureResponseTime(requestFn);
          results.push(duration);
          
          if (responseValidators.isSuccessResponse(response)) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      });

      await Promise.all(promises);
    }

    return {
      totalRequests: iterations,
      successfulRequests: successCount,
      failedRequests: failCount,
      averageResponseTime: results.reduce((a, b) => a + b, 0) / results.length,
      minResponseTime: Math.min(...results),
      maxResponseTime: Math.max(...results),
    };
  },
};

// Assertion helpers
export const assertions = {
  expectSuccess: async (response: NextResponse, expectedStatus: number = 200) => {
    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
    }
    
    if (!await responseValidators.validateSuccessStructure(response)) {
      throw new Error('Response does not have valid success structure');
    }
  },

  expectError: async (response: NextResponse, expectedStatus: number) => {
    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
    }
    
    if (!await responseValidators.validateErrorStructure(response)) {
      throw new Error('Response does not have valid error structure');
    }
  },

  expectPagination: async (response: NextResponse) => {
    if (!await responseValidators.validatePaginationStructure(response)) {
      throw new Error('Response does not have valid pagination structure');
    }
  },

  expectResponseTime: (duration: number, maxMs: number) => {
    if (duration > maxMs) {
      throw new Error(`Response time ${duration}ms exceeds maximum ${maxMs}ms`);
    }
  },
};

export default {
  mockData,
  tokenUtils,
  requestBuilder,
  responseValidators,
  dbMock,
  testScenarios,
  performanceUtils,
  assertions,
};