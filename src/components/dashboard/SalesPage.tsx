'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Sale {
  id: string;
  nftName: string;
  nftImage: string;
  buyer: string;
  salePrice: string;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
  royalty: string;
  transactionHash: string;
}

export default function SalesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sales data from API
  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/transactions?type=SALE', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch sales data');
        }

        const data = await response.json();
        
        // Transform API data to match component interface
        const transformedSales: Sale[] = data.transactions.map((transaction: any) => ({
          id: transaction.id,
          nftName: transaction.nft.name,
          nftImage: transaction.nft.image,
          buyer: `${transaction.buyer.walletAddress?.slice(0, 6)}...${transaction.buyer.walletAddress?.slice(-4)}` || transaction.buyer.name,
          salePrice: `${transaction.amount} ETH`,
          date: new Date(transaction.createdAt).toLocaleString(),
          status: transaction.status?.toLowerCase() || 'completed',
          royalty: `${(transaction.amount * 0.1).toFixed(3)} ETH`, // 10% royalty assumption
          transactionHash: transaction.transactionHash || `0x${Math.random().toString(16).substr(2, 64)}`
        }));

        setSales(transformedSales);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sales data');
        console.error('Error fetching sales:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  const filteredSales = sales.filter(sale => {
    const matchesTab = activeTab === 'all' || sale.status === activeTab;
    const matchesSearch = sale.nftName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.buyer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const sortedSales = [...filteredSales].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return parseFloat(b.salePrice) - parseFloat(a.salePrice);
      case 'name':
        return a.nftName.localeCompare(b.nftName);
      case 'date':
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Calculate statistics from real data
  const totalSales = sales.filter(sale => sale.status === 'completed').length;
  const totalRevenue = sales
    .filter(sale => sale.status === 'completed')
    .reduce((sum, sale) => sum + parseFloat(sale.salePrice), 0);
  const totalRoyalties = sales
    .filter(sale => sale.status === 'completed')
    .reduce((sum, sale) => sum + parseFloat(sale.royalty), 0);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Sales</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between">
      <main className="pt-8 pb-12 md:pb-14 lg:pb-16">
        <div className="max-w-[84rem] mx-auto px-3 md:px-5 flex flex-col gap-6 md:gap-8 lg:px-6">
          {/* Header */}
          <div className="flex items-center gap-3 text-2xl md:text-3xl">
            <div>
              <svg 
                stroke="currentColor" 
                fill="none" 
                strokeWidth="2" 
                viewBox="0 0 24 24" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="cursor-pointer" 
                height="1em" 
                width="1em" 
                xmlns="http://www.w3.org/2000/svg"
                onClick={() => router.back()}
              >
                <path d="m15 18-6-6 6-6"></path>
              </svg>
            </div>
            <h1 className="text-charcoal font-bold">Sales History</h1>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">{totalSales}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{totalRevenue.toFixed(2)} ETH</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Royalties</p>
                  <p className="text-2xl font-bold text-gray-900">{totalRoyalties.toFixed(2)} ETH</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by NFT name or buyer address..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Sort */}
            <div className="md:w-48">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date">Sort by Date</option>
                <option value="price">Sort by Price</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>

          {/* Tabs */}
          <div>
            <div className="flex flex-col overflow-hidden">
              <div 
                role="tablist" 
                className="inline-flex h-12 items-center rounded-lg bg-neutral-100 p-2 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 md:w-fit w-full overflow-auto justify-start max-w-[75vw] max-md:remove-system-scrollbar"
              >
                {[
                  { id: 'all', label: 'All Sales' },
                  { id: 'completed', label: 'Completed' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'cancelled', label: 'Cancelled' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded w-full px-4 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                      activeTab === tab.id
                        ? 'bg-white text-neutral-950 shadow-sm dark:bg-neutral-950 dark:text-neutral-50'
                        : 'hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sales List */}
              <div className="mt-6">
                {/* Desktop View */}
                <div className="hidden lg:block">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-[2fr_2fr_2fr_1fr_1fr_1fr] gap-4 p-4 bg-gray-50 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-700">NFT</p>
                      <p className="text-sm font-medium text-gray-700">Buyer</p>
                      <p className="text-sm font-medium text-gray-700">Sale Price</p>
                      <p className="text-sm font-medium text-gray-700">Royalty</p>
                      <p className="text-sm font-medium text-gray-700">Date</p>
                      <p className="text-sm font-medium text-gray-700">Status</p>
                    </div>

                    {/* Sales List */}
                    {sortedSales.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {sortedSales.map((sale) => (
                          <div key={sale.id} className="grid grid-cols-[2fr_2fr_2fr_1fr_1fr_1fr] gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{sale.nftName}</p>
                                <p className="text-sm text-gray-500">#{sale.id}</p>
                              </div>
                            </div>
                            <div>
                              <p className="font-mono text-sm text-gray-900">{sale.buyer}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{sale.salePrice}</p>
                            </div>
                            <div>
                              <p className="text-gray-900">{sale.royalty}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">{sale.date}</p>
                            </div>
                            <div>
                              <span className={getStatusBadge(sale.status)}>
                                {sale.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 items-center justify-center py-12">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <p className="text-gray-600">No sales found</p>
                        <p className="text-sm text-gray-500">Try adjusting your filters or create your first NFT</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile View */}
                <div className="lg:hidden space-y-4">
                  {sortedSales.length > 0 ? (
                    sortedSales.map((sale) => (
                      <div key={sale.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium text-gray-900">{sale.nftName}</h3>
                              <span className={getStatusBadge(sale.status)}>
                                {sale.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mb-2">Buyer: {sale.buyer}</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Sale Price</p>
                                <p className="font-semibold text-gray-900">{sale.salePrice}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Royalty</p>
                                <p className="font-semibold text-gray-900">{sale.royalty}</p>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{sale.date}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col gap-3 items-center justify-center py-12 bg-gray-50 rounded-lg">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <p className="text-gray-600">No sales found</p>
                      <p className="text-sm text-gray-500 text-center">Try adjusting your filters or create your first NFT</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}