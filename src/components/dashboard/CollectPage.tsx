'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';

interface NFT {
  id: string;
  name: string;
  image: string;
  price: number;
  creator: string;
  collection: string;
  category: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  tokenId: string;
  contractAddress: string;
  description?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface FilterState {
  category: string;
  priceRange: string;
  rarity: string;
  sortBy: string;
}

export default function CollectPage() {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    priceRange: 'all',
    rarity: 'all',
    sortBy: 'newest'
  });

  // Fetch user's NFT collection from API
  const fetchUserNFTs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid or expired, clear storage and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          localStorage.removeItem('isAuthenticated');
          window.location.href = '/auth/login';
          return;
        }
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();
      
      // Transform user's NFTs to match component interface
      const userNFTs = userData.nfts?.map((nft: any) => ({
        id: nft.id,
        name: nft.title,
        image: nft.image,
        price: parseFloat(nft.price || '0'),
        creator: nft.creator?.username || nft.creator?.walletAddress || 'Unknown',
        collection: nft.collection?.name || 'Uncategorized',
        category: nft.category || 'Art',
        rarity: nft.rarity || 'Common',
        tokenId: nft.tokenId,
        contractAddress: nft.contractAddress,
        description: nft.description,
        attributes: nft.attributes,
      })) || [];

      setNfts(userNFTs);
      setFilteredNfts(userNFTs);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      setError('Failed to load your NFT collection');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserNFTs();
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered = [...nfts];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(nft => 
        nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nft.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nft.collection.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(nft => nft.category === filters.category);
    }

    // Price range filter
    if (filters.priceRange !== 'all') {
      switch (filters.priceRange) {
        case 'under1':
          filtered = filtered.filter(nft => nft.price < 1);
          break;
        case '1to5':
          filtered = filtered.filter(nft => nft.price >= 1 && nft.price <= 5);
          break;
        case 'over5':
          filtered = filtered.filter(nft => nft.price > 5);
          break;
      }
    }

    // Rarity filter
    if (filters.rarity !== 'all') {
      filtered = filtered.filter(nft => nft.rarity === filters.rarity);
    }

    // Sort
    switch (filters.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default: // newest
        filtered.sort((a, b) => parseInt(b.id) - parseInt(a.id));
    }

    setFilteredNfts(filtered);
  }, [nfts, searchQuery, filters]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'text-gray-600 bg-gray-100';
      case 'Rare': return 'text-blue-600 bg-blue-100';
      case 'Epic': return 'text-purple-600 bg-purple-100';
      case 'Legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-light-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-charcoal mb-2">Collect NFTs</h1>
          <p className="text-mid-300">Discover and collect unique digital assets from top creators</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-mid-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search NFTs, creators, or collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="Art">Art</option>
                <option value="Photography">Photography</option>
                <option value="Gaming">Gaming</option>
                <option value="Music">Music</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Price Range</label>
              <select
                value={filters.priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Prices</option>
                <option value="under1">Under 1 ETH</option>
                <option value="1to5">1-5 ETH</option>
                <option value="over5">Over 5 ETH</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Rarity</label>
              <select
                value={filters.rarity}
                onChange={(e) => handleFilterChange('rarity', e.target.value)}
                className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Rarities</option>
                <option value="Common">Common</option>
                <option value="Rare">Rare</option>
                <option value="Epic">Epic</option>
                <option value="Legendary">Legendary</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-mid-300">
            {isLoading ? 'Loading...' : `${filteredNfts.length} NFT${filteredNfts.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* NFT Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
                <div className="w-full h-64 bg-light-200 animate-pulse"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-light-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-light-200 rounded w-2/3 animate-pulse"></div>
                  <div className="h-4 bg-light-200 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNfts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-light-200 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-mid-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-charcoal mb-2">No NFTs found</h3>
            <p className="text-mid-300">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredNfts.map((nft) => (
              <div key={nft.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                <div className="relative overflow-hidden">
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(nft.rarity)}`}>
                    {nft.rarity}
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-charcoal mb-1 truncate">{nft.name}</h3>
                  <p className="text-sm text-mid-300 mb-2">{nft.collection}</p>
                  <p className="text-xs text-mid-300 mb-3">by {nft.creator}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-mid-300">Price</p>
                      <p className="font-semibold text-charcoal">{nft.price} ETH</p>
                    </div>
                  </div>
                  
                  <Button variant="primary" className="w-full">
                    Collect Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}