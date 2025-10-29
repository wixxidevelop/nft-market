'use client';

import React, { useState } from 'react';

const AuctionPage = () => {
  const [activeTab, setActiveTab] = useState('live');

  const liveAuctions = [
    {
      id: 1,
      title: 'Cosmic Dreams #001',
      currentBid: '2.5 ETH',
      timeLeft: '2h 15m',
      bidders: 12,
      image: 'bg-gradient-to-br from-purple-500 to-pink-500'
    },
    {
      id: 2,
      title: 'Digital Landscape',
      currentBid: '1.8 ETH',
      timeLeft: '4h 32m',
      bidders: 8,
      image: 'bg-gradient-to-br from-blue-500 to-cyan-500'
    },
    {
      id: 3,
      title: 'Abstract Motion',
      currentBid: '3.2 ETH',
      timeLeft: '1h 45m',
      bidders: 15,
      image: 'bg-gradient-to-br from-green-500 to-teal-500'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Auction House</h1>
        <p className="text-gray-600">Bid on exclusive NFTs and discover rare collections</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('live')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'live'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Live Auctions
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upcoming'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab('ended')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ended'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Ended
            </button>
          </nav>
        </div>
      </div>

      {/* Live Auctions */}
      {activeTab === 'live' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveAuctions.map((auction) => (
            <div key={auction.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className={`h-48 ${auction.image}`}></div>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">{auction.title}</h3>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-sm text-gray-600">Current Bid</p>
                    <p className="text-lg font-bold text-green-600">{auction.currentBid}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Time Left</p>
                    <p className="text-lg font-bold text-red-600">{auction.timeLeft}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-500">{auction.bidders} bidders</span>
                  <div className="flex space-x-2">
                    <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm hover:bg-gray-300">
                      View Details
                    </button>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700">
                      Place Bid
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Auctions */}
      {activeTab === 'upcoming' && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Auctions</h3>
          <p className="text-gray-600">Check back later for new auction announcements</p>
        </div>
      )}

      {/* Ended Auctions */}
      {activeTab === 'ended' && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Ended Auctions</h3>
          <p className="text-gray-600">Completed auctions will appear here</p>
        </div>
      )}

      {/* Auction Statistics */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Auction Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">3</div>
            <div className="text-sm text-gray-600">Live Auctions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">7.5 ETH</div>
            <div className="text-sm text-gray-600">Total Volume</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">35</div>
            <div className="text-sm text-gray-600">Active Bidders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">24h</div>
            <div className="text-sm text-gray-600">Avg Duration</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionPage;