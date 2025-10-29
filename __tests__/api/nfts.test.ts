// NFT API tests

import { NextRequest } from 'next/server';
import { GET as getNftsHandler, POST as createNftHandler } from '@/app/api/nfts/route';
import { GET as getNftHandler, PUT as updateNftHandler, DELETE as deleteNftHandler } from '@/app/api/nfts/[id]/route';
import testUtils from '@/lib/test-utils';

const { mockData, tokenUtils, requestBuilder, assertions, dbMock, testScenarios } = testUtils;

describe('NFT API', () => {
  beforeEach(() => {
    dbMock.clear();
    dbMock.seed();
  });

  describe('GET /api/nfts', () => {
    it('should return paginated NFTs', async () => {
      const url = requestBuilder.withQuery(
        'http://localhost:3000/api/nfts',
        testScenarios.pagination.firstPage
      );
      const request = requestBuilder.get(url);

      const response = await getNftsHandler(request);
      
      await assertions.expectSuccess(response, 200);
      await assertions.expectPagination(response);
      
      const data = await response.json();
      expect(Array.isArray(data.data.nfts)).toBe(true);
      expect(data.data.pagination).toHaveProperty('page');
      expect(data.data.pagination).toHaveProperty('limit');
      expect(data.data.pagination).toHaveProperty('total');
    });

    it('should filter NFTs by category', async () => {
      const url = requestBuilder.withQuery(
        'http://localhost:3000/api/nfts',
        { ...testScenarios.pagination.firstPage, category: 'Art' }
      );
      const request = requestBuilder.get(url);

      const response = await getNftsHandler(request);
      
      await assertions.expectSuccess(response, 200);
      
      const data = await response.json();
      data.data.nfts.forEach((nft: any) => {
        expect(nft.category).toBe('Art');
      });
    });

    it('should filter NFTs by price range', async () => {
      const url = requestBuilder.withQuery(
        'http://localhost:3000/api/nfts',
        { 
          ...testScenarios.pagination.firstPage, 
          minPrice: '1.0',
          maxPrice: '5.0'
        }
      );
      const request = requestBuilder.get(url);

      const response = await getNftsHandler(request);
      
      await assertions.expectSuccess(response, 200);
      
      const data = await response.json();
      data.data.nfts.forEach((nft: any) => {
        expect(nft.price).toBeGreaterThanOrEqual(1.0);
        expect(nft.price).toBeLessThanOrEqual(5.0);
      });
    });

    it('should search NFTs by title', async () => {
      const url = requestBuilder.withQuery(
        'http://localhost:3000/api/nfts',
        { ...testScenarios.pagination.firstPage, search: 'Test' }
      );
      const request = requestBuilder.get(url);

      const response = await getNftsHandler(request);
      
      await assertions.expectSuccess(response, 200);
      
      const data = await response.json();
      data.data.nfts.forEach((nft: any) => {
        expect(nft.title.toLowerCase()).toContain('test');
      });
    });

    it('should sort NFTs by price', async () => {
      const url = requestBuilder.withQuery(
        'http://localhost:3000/api/nfts',
        { ...testScenarios.pagination.firstPage, sortBy: 'price', sortOrder: 'desc' }
      );
      const request = requestBuilder.get(url);

      const response = await getNftsHandler(request);
      
      await assertions.expectSuccess(response, 200);
      
      const data = await response.json();
      for (let i = 1; i < data.data.nfts.length; i++) {
        expect(data.data.nfts[i-1].price).toBeGreaterThanOrEqual(data.data.nfts[i].price);
      }
    });

    it('should handle invalid pagination parameters', async () => {
      const url = requestBuilder.withQuery(
        'http://localhost:3000/api/nfts',
        testScenarios.pagination.invalidPage
      );
      const request = requestBuilder.get(url);

      const response = await getNftsHandler(request);
      
      await assertions.expectError(response, 400);
    });

    it('should respond within acceptable time', async () => {
      const request = requestBuilder.get('http://localhost:3000/api/nfts');

      const { response, duration } = await testUtils.performanceUtils.measureResponseTime(
        () => getNftsHandler(request)
      );

      assertions.expectResponseTime(duration, 500); // 500ms max
      await assertions.expectSuccess(response, 200);
    });
  });

  describe('POST /api/nfts', () => {
    it('should create NFT with valid data', async () => {
      const token = tokenUtils.generateUserToken();
      const request = requestBuilder.withAuth(
        requestBuilder.post('http://localhost:3000/api/nfts', testScenarios.nft.validCreate),
        token
      );

      const response = await createNftHandler(request);
      
      await assertions.expectSuccess(response, 201);
      
      const data = await response.json();
      expect(data.data.nft).toHaveProperty('id');
      expect(data.data.nft.title).toBe(testScenarios.nft.validCreate.title);
      expect(data.data.nft.price).toBe(testScenarios.nft.validCreate.price);
    });

    it('should reject unauthenticated request', async () => {
      const request = requestBuilder.post('http://localhost:3000/api/nfts', testScenarios.nft.validCreate);

      const response = await createNftHandler(request);
      
      await assertions.expectError(response, 401);
    });

    it('should reject invalid NFT data', async () => {
      const token = tokenUtils.generateUserToken();
      const request = requestBuilder.withAuth(
        requestBuilder.post('http://localhost:3000/api/nfts', testScenarios.nft.invalidCreate),
        token
      );

      const response = await createNftHandler(request);
      
      await assertions.expectError(response, 400);
    });

    it('should reject negative price', async () => {
      const token = tokenUtils.generateUserToken();
      const request = requestBuilder.withAuth(
        requestBuilder.post('http://localhost:3000/api/nfts', {
          ...testScenarios.nft.validCreate,
          price: -1
        }),
        token
      );

      const response = await createNftHandler(request);
      
      await assertions.expectError(response, 400);
    });

    it('should reject empty title', async () => {
      const token = tokenUtils.generateUserToken();
      const request = requestBuilder.withAuth(
        requestBuilder.post('http://localhost:3000/api/nfts', {
          ...testScenarios.nft.validCreate,
          title: ''
        }),
        token
      );

      const response = await createNftHandler(request);
      
      await assertions.expectError(response, 400);
    });

    it('should validate image URL format', async () => {
      const token = tokenUtils.generateUserToken();
      const request = requestBuilder.withAuth(
        requestBuilder.post('http://localhost:3000/api/nfts', {
          ...testScenarios.nft.validCreate,
          image: 'invalid-url'
        }),
        token
      );

      const response = await createNftHandler(request);
      
      await assertions.expectError(response, 400);
    });
  });

  describe('GET /api/nfts/[id]', () => {
    it('should return specific NFT', async () => {
      const nftId = 'nft-123';
      const request = requestBuilder.get(`http://localhost:3000/api/nfts/${nftId}`);

      const response = await getNftHandler(request, { params: Promise.resolve({ id: nftId }) });
      
      await assertions.expectSuccess(response, 200);
      
      const data = await response.json();
      expect(data.data.nft.id).toBe(nftId);
    });

    it('should return 404 for non-existent NFT', async () => {
      const nftId = 'non-existent-nft';
      const request = requestBuilder.get(`http://localhost:3000/api/nfts/${nftId}`);

      const response = await getNftHandler(request, { params: Promise.resolve({ id: nftId }) });
      
      await assertions.expectError(response, 404);
    });

    it('should include owner information', async () => {
      const nftId = 'nft-123';
      const request = requestBuilder.get(`http://localhost:3000/api/nfts/${nftId}`);

      const response = await getNftHandler(request, { params: Promise.resolve({ id: nftId }) });
      
      await assertions.expectSuccess(response, 200);
      
      const data = await response.json();
      expect(data.data.nft).toHaveProperty('owner');
      expect(data.data.nft.owner).toHaveProperty('username');
    });

    it('should include collection information if applicable', async () => {
      const nftId = 'nft-123';
      const request = requestBuilder.get(`http://localhost:3000/api/nfts/${nftId}`);

      const response = await getNftHandler(request, { params: Promise.resolve({ id: nftId }) });
      
      await assertions.expectSuccess(response, 200);
      
      const data = await response.json();
      if (data.data.nft.collectionId) {
        expect(data.data.nft).toHaveProperty('collection');
      }
    });
  });

  describe('PUT /api/nfts/[id]', () => {
    it('should update NFT by owner', async () => {
      const nftId = 'nft-123';
      const ownerId = 'user-123';
      const token = tokenUtils.generateUserToken(ownerId);
      
      const updateData = {
        title: 'Updated NFT Title',
        description: 'Updated description',
        price: 3.0
      };

      const request = requestBuilder.withAuth(
        requestBuilder.put(`http://localhost:3000/api/nfts/${nftId}`, updateData),
        token
      );

      const response = await updateNftHandler(request, { params: Promise.resolve({ id: nftId }) });
      
      await assertions.expectSuccess(response, 200);
      
      const data = await response.json();
      expect(data.data.nft.title).toBe(updateData.title);
      expect(data.data.nft.price).toBe(updateData.price);
    });

    it('should reject update by non-owner', async () => {
      const nftId = 'nft-123';
      const nonOwnerId = 'user-456';
      const token = tokenUtils.generateUserToken(nonOwnerId);
      
      const updateData = { title: 'Unauthorized Update' };

      const request = requestBuilder.withAuth(
        requestBuilder.put(`http://localhost:3000/api/nfts/${nftId}`, updateData),
        token
      );

      const response = await updateNftHandler(request, { params: Promise.resolve({ id: nftId }) });
      
      await assertions.expectError(response, 403);
    });

    it('should allow admin to update any NFT', async () => {
      const nftId = 'nft-123';
      const token = tokenUtils.generateAdminToken();
      
      const updateData = { title: 'Admin Updated Title' };

      const request = requestBuilder.withAuth(
        requestBuilder.put(`http://localhost:3000/api/nfts/${nftId}`, updateData),
        token
      );

      const response = await updateNftHandler(request, { params: Promise.resolve({ id: nftId }) });
      
      await assertions.expectSuccess(response, 200);
    });

    it('should reject unauthenticated update', async () => {
      const nftId = 'nft-123';
      const updateData = { title: 'Unauthorized Update' };

      const request = requestBuilder.put(`http://localhost:3000/api/nfts/${nftId}`, updateData);

      const response = await updateNftHandler(request, { params: Promise.resolve({ id: nftId }) });
      
      await assertions.expectError(response, 401);
    });

    it('should validate update data', async () => {
      const nftId = 'nft-123';
      const ownerId = 'user-123';
      const token = tokenUtils.generateUserToken(ownerId);
      
      const invalidData = { price: -1 };

      const request = requestBuilder.withAuth(
        requestBuilder.put(`http://localhost:3000/api/nfts/${nftId}`, invalidData),
        token
      );

      const response = await updateNftHandler(request, { params: Promise.resolve({ id: nftId }) });
      
      await assertions.expectError(response, 400);
    });
  });

  describe('DELETE /api/nfts/[id]', () => {
    it('should delete NFT by owner', async () => {
      const nftId = 'nft-123';
      const ownerId = 'user-123';
      const token = tokenUtils.generateUserToken(ownerId);

      const request = requestBuilder.withAuth(
        requestBuilder.delete(`http://localhost:3000/api/nfts/${nftId}`),
        token
      );

      const response = await deleteNftHandler(request, { params: Promise.resolve({ id: nftId }) });
      
      await assertions.expectSuccess(response, 200);
    });

    it('should reject delete by non-owner', async () => {
      const nftId = 'nft-123';
      const nonOwnerId = 'user-456';
      const token = tokenUtils.generateUserToken(nonOwnerId);

      const request = requestBuilder.withAuth(
        requestBuilder.delete(`http://localhost:3000/api/nfts/${nftId}`),
        token
      );

      const response = await deleteNftHandler(request, { params: Promise.resolve({ id: nftId }) });
      
      await assertions.expectError(response, 403);
    });

    it('should allow admin to delete any NFT', async () => {
      const nftId = 'nft-123';
      const token = tokenUtils.generateAdminToken();

      const request = requestBuilder.withAuth(
        requestBuilder.delete(`http://localhost:3000/api/nfts/${nftId}`),
        token
      );

      const response = await deleteNftHandler(request, { params: Promise.resolve({ id: nftId }) });
      
      await assertions.expectSuccess(response, 200);
    });

    it('should reject unauthenticated delete', async () => {
      const nftId = 'nft-123';

      const request = requestBuilder.delete(`http://localhost:3000/api/nfts/${nftId}`);

      const response = await deleteNftHandler(request, { params: Promise.resolve({ id: nftId }) });
      
      await assertions.expectError(response, 401);
    });

    it('should return 404 for non-existent NFT', async () => {
      const nftId = 'non-existent-nft';
      const token = tokenUtils.generateUserToken();

      const request = requestBuilder.withAuth(
        requestBuilder.delete(`http://localhost:3000/api/nfts/${nftId}`),
        token
      );

      const response = await deleteNftHandler(request, { params: Promise.resolve({ id: nftId }) });
      
      await assertions.expectError(response, 404);
    });
  });

  describe('NFT Performance Tests', () => {
    it('should handle concurrent NFT creation', async () => {
      const results = await testUtils.performanceUtils.loadTest(
        () => {
          const token = tokenUtils.generateUserToken();
          const uniqueTitle = `NFT ${Date.now()}-${Math.random()}`;
          const request = requestBuilder.withAuth(
            requestBuilder.post('http://localhost:3000/api/nfts', {
              ...testScenarios.nft.validCreate,
              title: uniqueTitle
            }),
            token
          );
          return createNftHandler(request);
        },
        5,  // concurrency
        25  // iterations
      );

      expect(results.successfulRequests).toBeGreaterThan(20); // 80% success rate
      expect(results.averageResponseTime).toBeLessThan(1000); // 1 second average
    });

    it('should handle high-volume NFT listing requests', async () => {
      const results = await testUtils.performanceUtils.loadTest(
        () => {
          const request = requestBuilder.get('http://localhost:3000/api/nfts');
          return getNftsHandler(request);
        },
        20, // concurrency
        100 // iterations
      );

      expect(results.successfulRequests).toBeGreaterThan(90); // 90% success rate
      expect(results.averageResponseTime).toBeLessThan(500); // 500ms average
    });
  });

  describe('NFT Security Tests', () => {
    it('should prevent SQL injection in search', async () => {
      const maliciousSearch = "'; DROP TABLE nfts; --";
      const url = requestBuilder.withQuery(
        'http://localhost:3000/api/nfts',
        { search: maliciousSearch }
      );
      const request = requestBuilder.get(url);

      const response = await getNftsHandler(request);
      
      // Should not crash and should return safe results
      expect(response.status).toBeLessThan(500);
    });

    it('should sanitize NFT metadata', async () => {
      const token = tokenUtils.generateUserToken();
      const maliciousData = {
        ...testScenarios.nft.validCreate,
        title: '<script>alert("xss")</script>',
        description: '<img src="x" onerror="alert(1)">',
      };

      const request = requestBuilder.withAuth(
        requestBuilder.post('http://localhost:3000/api/nfts', maliciousData),
        token
      );

      const response = await createNftHandler(request);
      
      if (response.status === 201) {
        const data = await response.json();
        expect(data.data.nft.title).not.toContain('<script>');
        expect(data.data.nft.description).not.toContain('onerror');
      }
    });

    it('should validate file upload limits', async () => {
      const token = tokenUtils.generateUserToken();
      const largeDescription = 'x'.repeat(10000); // Very long description

      const request = requestBuilder.withAuth(
        requestBuilder.post('http://localhost:3000/api/nfts', {
          ...testScenarios.nft.validCreate,
          description: largeDescription
        }),
        token
      );

      const response = await createNftHandler(request);
      
      await assertions.expectError(response, 400);
    });
  });
});
