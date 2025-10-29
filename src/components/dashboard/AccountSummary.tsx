'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

interface Coin {
  symbol: string;
  name: string;
  amount: number;
  value: number;
  change: number;
}

interface PortfolioStats {
  totalNFTs: number;
  totalSales: number;
  activeListings: number;
}

export default function AccountSummary() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [stats, setStats] = useState<PortfolioStats>({ totalNFTs: 0, totalSales: 0, activeListings: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadAccountData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        // Fetch user data with portfolio information
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
            router.push('/auth/login');
            return;
          }
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        
        // Calculate portfolio stats from user data
        const portfolioStats = {
          totalNFTs: userData.nfts?.length || 0,
          totalSales: userData.transactions?.filter((tx: any) => tx.type === 'SALE').length || 0,
          activeListings: userData.nfts?.filter((nft: any) => nft.isListed).length || 0,
        };

        // Calculate crypto holdings from transactions
        const cryptoHoldings = calculateCryptoHoldings(userData.transactions || []);
        const totalBalance = cryptoHoldings.reduce((sum, holding) => sum + holding.value, 0);

        setCoins(cryptoHoldings);
        setBalance(totalBalance);
        setStats(portfolioStats);
      } catch (error) {
        console.error('Error loading account data:', error);
        setError('Failed to load account data');
      } finally {
        setIsLoading(false);
      }
    };

    loadAccountData();
  }, [router]);

  // Calculate crypto holdings from transaction history
  const calculateCryptoHoldings = (transactions: any[]): Coin[] => {
    const holdings: { [key: string]: { amount: number; name: string } } = {};
    
    // Process transactions to calculate current holdings
    transactions.forEach((tx: any) => {
      const currency = tx.currency || 'ETH';
      if (!holdings[currency]) {
        holdings[currency] = { amount: 0, name: getCurrencyName(currency) };
      }
      
      if (tx.type === 'DEPOSIT' || tx.type === 'SALE') {
        holdings[currency].amount += parseFloat(tx.amount || '0');
      } else if (tx.type === 'WITHDRAWAL' || tx.type === 'PURCHASE') {
        holdings[currency].amount -= parseFloat(tx.amount || '0');
      }
    });

    // Convert to Coin format with mock prices and changes
    return Object.entries(holdings)
      .filter(([_, holding]) => holding.amount > 0)
      .map(([symbol, holding]) => ({
        symbol,
        name: holding.name,
        amount: holding.amount,
        value: holding.amount * getMockPrice(symbol),
        change: Math.random() * 10 - 5 // Mock change percentage
      }));
  };

  const getCurrencyName = (symbol: string): string => {
    const names: { [key: string]: string } = {
      'ETH': 'Ethereum',
      'BTC': 'Bitcoin',
      'USDC': 'USD Coin',
      'USDT': 'Tether',
    };
    return names[symbol] || symbol;
  };

  const getMockPrice = (symbol: string): number => {
    const prices: { [key: string]: number } = {
      'ETH': 3456.78,
      'BTC': 67890.12,
      'USDC': 1.00,
      'USDT': 1.00,
    };
    return prices[symbol] || 1.00;
  };

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-4 bg-light-200 rounded w-3/4 mb-2"></div>
      <div className="h-6 bg-light-200 rounded w-1/2"></div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* Page Header */}
      <div className="text-2xl md:text-3xl">
        <h1 className="text-charcoal font-bold">Account Summary</h1>
      </div>

      {/* Main Grid Layout */}
      <div className="grid lg:grid-cols-[2fr_1fr] gap-8 lg:gap-10">
        {/* Left Column */}
        <div className="flex flex-col gap-6 md:gap-8">
          {/* Account Balance Section */}
          <section className="flex flex-col justify-between gap-4 p-6 bg-light-100 rounded-xl md:p-8 xl:items-end xl:flex-row">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-mid-300">Account Balance</p>
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-light-200 rounded w-48"></div>
                </div>
              ) : (
                <span className="text-3xl font-bold text-charcoal">
                  ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1 text-sm xl:flex md:gap-2">
              <Button 
                variant="primary" 
                className="w-full xl:w-32"
                onClick={() => router.push('/dashboard/deposit')}
              >
                Deposit
              </Button>
              <Button 
                variant="outline" 
                className="w-full xl:w-32"
                onClick={() => router.push('/dashboard/create-nft')}
              >
                Mint
              </Button>
              <Button 
                variant="outline" 
                className="w-full xl:w-32"
                onClick={() => router.push('/dashboard/withdrawal')}
              >
                Withdraw
              </Button>
            </div>
          </section>

          {/* Crypto Holdings Section */}
          <section className="flex flex-col justify-between gap-4 p-6 bg-light-100 rounded-xl md:p-8">
            <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 mb-2 md:grid-cols-[3fr_1fr_1fr]">
              <p className="text-sm text-mid-300">Coin</p>
              <p className="text-sm text-mid-300">Ratio</p>
              <p className="text-right text-sm text-mid-300">Amount</p>
            </div>
            
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="grid grid-cols-[2fr_1fr_1fr] md:grid-cols-[3fr_1fr_1fr] gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-light-200 rounded-full animate-pulse"></div>
                      <div className="space-y-1">
                        <div className="h-4 bg-light-200 rounded w-12 animate-pulse"></div>
                        <div className="h-3 bg-light-200 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="h-4 bg-light-200 rounded w-12 animate-pulse"></div>
                      <div className="h-2 bg-light-200 rounded w-8 animate-pulse"></div>
                    </div>
                    <div className="flex flex-col text-right">
                      <div className="h-4 bg-light-200 rounded w-8 ml-auto animate-pulse"></div>
                      <div className="h-3 bg-light-200 rounded w-12 ml-auto animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {coins.map((coin) => (
                  <div key={coin.symbol} className="grid grid-cols-[2fr_1fr_1fr] md:grid-cols-[3fr_1fr_1fr] gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {coin.symbol.charAt(0)}
                      </div>
                      <div className="flex flex-col font-semibold">
                        <span className="text-sm">{coin.symbol}</span>
                        <span className="text-[0.65rem]">ERC20</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 font-semibold">
                      <span className="text-sm">{((coin.value / balance) * 100).toFixed(1)}%</span>
                      <div className="relative h-1 overflow-hidden rounded-full bg-light-200 w-[40%]">
                        <div 
                          className="h-full bg-neutral-600 transition-all"
                          style={{ width: `${(coin.value / balance) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex flex-col font-semibold text-right">
                      <span className="text-sm font-[900]">{coin.amount.toFixed(2)}</span>
                      <span className="text-[0.65rem] text-mid-300">
                        ${coin.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Create NFT Section */}
          <section>
            <div className="relative bg-light-100 p-8 rounded-xl overflow-clip">
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-1 z-30">
                  <h3 className="text-xl md:text-4xl font-[900]">Create your own NFT</h3>
                  <p className="text-black text-xs md:max-w-none md:text-base">Buy and sell NFTs from top artists</p>
                </div>
                <div>
                  <Button 
                    variant="primary" 
                    className="flex items-center gap-2 w-40 md:w-64 lg:w-72"
                    onClick={() => router.push('/dashboard/create-nft')}
                  >
                    <span>Create</span>
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="20" width="20">
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                  </Button>
                </div>
              </div>
              <div className="absolute bottom-0 right-4 z-20">
                <img 
                  alt="create nft" 
                  loading="lazy" 
                  width="201" 
                  height="234" 
                  decoding="async" 
                  className="w-[110px] md:w-[140px] lg:w-[170px]"
                  src="https://i.postimg.cc/jCV8tPqT/create-nft.webp"
                  style={{ color: 'transparent' }}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="flex flex-col py-4 gap-6 md:gap-8 lg:py-0 lg:gap-10">
          {/* Recent Transactions */}
          <section className="flex flex-col justify-between gap-4 py-6 px-6 rounded-xl bg-light-100 lg:bg-white lg:py-0 lg:px-0">
            <div className="flex items-center justify-between">
              <p className="text-sm text-mid-300">Recent Transactions</p>
              <Button variant="outline" size="sm" className="text-xs h-7 px-3 bg-light-200 text-charcoal hover:bg-light-300 lg:bg-light-100 lg:hover:bg-light-200">
                View All
              </Button>
            </div>
            <div className="flex flex-col gap-3 items-center justify-center my-4 md:my-6">
              <p className="italic">No transactions yet.</p>
              <Button variant="outline" size="sm" className="mt-3 h-9 px-4 text-sm bg-light-200 hover:bg-light-200 text-charcoal lg:bg-light-100 lg:hover:bg-light-200">
                Make a deposit
              </Button>
            </div>
          </section>

          {/* Recent Sales */}
          <section className="flex flex-col justify-between gap-4 py-6 px-6 rounded-xl bg-light-100 lg:bg-white lg:py-0 lg:px-0">
            <div className="flex items-center justify-between">
              <p className="text-sm text-mid-300">Recent Sales</p>
              <Button variant="outline" size="sm" className="text-xs h-7 px-3 bg-light-200 text-charcoal hover:bg-light-300 lg:bg-light-100 lg:hover:bg-light-200">
                View All
              </Button>
            </div>
            <div className="flex flex-col gap-3 items-center justify-center my-4 md:my-6">
              <p className="italic">No sales yet.</p>
              <Button variant="outline" size="sm" className="mt-3 h-9 px-4 text-sm bg-light-200 hover:bg-light-200 text-charcoal lg:bg-light-100 lg:hover:bg-light-200">
                Make a sale
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}