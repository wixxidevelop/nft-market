'use client';

import React from 'react';

const ExhibitionPage = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exhibition</h1>
        <p className="text-gray-600">Discover and showcase featured NFT collections</p>
      </div>

      {/* Featured Collections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-400"></div>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">Digital Art Collection</h3>
            <p className="text-gray-600 text-sm mb-3">A curated collection of digital masterpieces</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">12 items</span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                View Collection
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-48 bg-gradient-to-br from-blue-400 to-cyan-400"></div>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">Abstract Expressions</h3>
            <p className="text-gray-600 text-sm mb-3">Modern abstract art in digital form</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">8 items</span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                View Collection
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-48 bg-gradient-to-br from-green-400 to-teal-400"></div>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">Nature's Beauty</h3>
            <p className="text-gray-600 text-sm mb-3">Stunning nature photography NFTs</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">15 items</span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                View Collection
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Exhibition Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Exhibition Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">35</div>
            <div className="text-sm text-gray-600">Total Collections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">1,247</div>
            <div className="text-sm text-gray-600">Total NFTs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">892</div>
            <div className="text-sm text-gray-600">Active Visitors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">156</div>
            <div className="text-sm text-gray-600">Featured Artists</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExhibitionPage;