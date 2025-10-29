'use client';

import React, { useState, useEffect } from 'react';

interface Withdrawal {
  id: string;
  amount: string;
  recipientAddress: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  transactionHash?: string;
}

interface UserBalance {
  balance: number;
  totalWithdrawn: number;
  monthlyWithdrawn: number;
  pendingWithdrawals: number;
}

const WithdrawalPage = () => {
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [walletConnected, setWalletConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [recentWithdrawals, setRecentWithdrawals] = useState<Withdrawal[]>([]);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user balance and withdrawal stats
  const fetchUserBalance = async () => {
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
      
      // Calculate withdrawal statistics from user's transactions
      const withdrawalStats = userData.transactions?.filter((tx: any) => tx.type === 'WITHDRAWAL') || [];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyWithdrawn = withdrawalStats
        .filter((tx: any) => {
          const txDate = new Date(tx.createdAt);
          return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
        })
        .reduce((sum: number, tx: any) => sum + parseFloat(tx.amount), 0);

      const totalWithdrawn = withdrawalStats
        .filter((tx: any) => tx.status === 'COMPLETED')
        .reduce((sum: number, tx: any) => sum + parseFloat(tx.amount), 0);

      const pendingWithdrawals = withdrawalStats
        .filter((tx: any) => tx.status === 'PENDING')
        .reduce((sum: number, tx: any) => sum + parseFloat(tx.amount), 0);

      setUserBalance({
        balance: userData.balance || 0,
        totalWithdrawn,
        monthlyWithdrawn,
        pendingWithdrawals,
      });
    } catch (error) {
      console.error('Error fetching user balance:', error);
      setError('Failed to load balance information');
    } finally {
      setBalanceLoading(false);
    }
  };

  // Fetch recent withdrawals
  const fetchRecentWithdrawals = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/transactions?type=WITHDRAWAL&limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch withdrawals');
      }

      const data = await response.json();
      setRecentWithdrawals(data.transactions || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      setError('Failed to load withdrawal history');
    } finally {
      setWithdrawalsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBalance();
    fetchRecentWithdrawals();
  }, []);

  const handleWithdrawal = async () => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!recipientAddress || recipientAddress.length < 42) {
      alert('Please enter a valid recipient address');
      return;
    }

    if (!userBalance || parseFloat(withdrawalAmount) > userBalance.balance) {
      alert('Insufficient balance');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'WITHDRAWAL',
          amount: parseFloat(withdrawalAmount),
          recipientAddress,
          metadata: {
            networkFee: 0.002,
            network: 'ethereum',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process withdrawal');
      }

      const result = await response.json();
      setTransactionHash(result.transactionHash || result.id);
      setWithdrawalAmount('');
      setRecipientAddress('');
      
      // Refresh data
      fetchUserBalance();
      fetchRecentWithdrawals();
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      setError(error instanceof Error ? error.message : 'Failed to process withdrawal');
    } finally {
      setIsLoading(false);
    }
  };

  const setMaxAmount = () => {
    if (userBalance) {
      const maxWithdrawable = Math.max(0, userBalance.balance - 0.002); // Reserve for gas
      setWithdrawalAmount(maxWithdrawable.toFixed(6));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-100';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      case 'FAILED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (balanceLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ETH Withdrawal</h1>
        <p className="text-gray-600">Withdraw Ethereum from your wallet securely</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Balance & Withdrawal Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Balance Card */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium opacity-90">Available Balance</h2>
                <p className="text-3xl font-bold">
                  {userBalance ? userBalance.balance.toFixed(6) : '0.000000'} ETH
                </p>
                <p className="text-sm opacity-75 mt-1">
                  ≈ ${userBalance ? (userBalance.balance * 2340).toLocaleString() : '0'}
                </p>
              </div>
              <div className="text-right">
                <svg className="w-12 h-12 opacity-75" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1.75l-6.25 10.5L12 16l6.25-3.75L12 1.75zM5.75 13.5L12 22.25l6.25-8.75L12 17.25l-6.25-3.75z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Withdrawal Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Withdraw ETH</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0x..."
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Amount (ETH)
                  </label>
                  <button
                    onClick={setMaxAmount}
                    className="text-blue-600 text-sm hover:text-blue-700"
                  >
                    Max
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.000001"
                    min="0"
                    max={userBalance?.balance || 0}
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.000000"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 font-medium">ETH</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Network Fee:</span>
                  <span>~0.002 ETH</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>You will receive:</span>
                  <span>{withdrawalAmount ? (parseFloat(withdrawalAmount) - 0.002).toFixed(6) : '0.000000'} ETH</span>
                </div>
                <div className="flex justify-between text-sm font-medium border-t pt-2">
                  <span>Total Cost:</span>
                  <span>{withdrawalAmount ? parseFloat(withdrawalAmount).toFixed(6) : '0.000000'} ETH</span>
                </div>
              </div>

              <button
                onClick={handleWithdrawal}
                disabled={isLoading || !withdrawalAmount || !recipientAddress}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing Withdrawal...' : 'Withdraw ETH'}
              </button>

              {transactionHash && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 font-medium">Withdrawal Initiated!</p>
                  <p className="text-green-600 text-sm mt-1">
                    Hash: <span className="font-mono">{transactionHash}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Withdrawn</span>
                <span className="font-medium">
                  {userBalance ? userBalance.totalWithdrawn.toFixed(3) : '0.000'} ETH
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">This Month</span>
                <span className="font-medium">
                  {userBalance ? userBalance.monthlyWithdrawn.toFixed(3) : '0.000'} ETH
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending</span>
                <span className="font-medium text-yellow-600">
                  {userBalance ? userBalance.pendingWithdrawals.toFixed(3) : '0.000'} ETH
                </span>
              </div>
            </div>
          </div>

          {/* Security Tips */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Security Tips</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p>Double-check recipient address</p>
              </div>
              <div className="flex items-start">
                <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p>Start with small amounts</p>
              </div>
              <div className="flex items-start">
                <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p>Keep transaction records</p>
              </div>
              <div className="flex items-start">
                <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p>Never share private keys</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Withdrawals */}
      <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Withdrawals</h2>
        <div className="overflow-x-auto">
          {withdrawalsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2 text-gray-600">Loading withdrawals...</span>
            </div>
          ) : recentWithdrawals.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Recipient</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Transaction</th>
                </tr>
              </thead>
              <tbody>
                {recentWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{withdrawal.amount} ETH</td>
                    <td className="py-3 px-4 font-mono text-sm">
                      {formatAddress(withdrawal.recipientAddress)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(withdrawal.createdAt)}</td>
                    <td className="py-3 px-4">
                      {withdrawal.transactionHash ? (
                        <a
                          href={`https://etherscan.io/tx/${withdrawal.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-600">No withdrawals yet</p>
              <p className="text-sm text-gray-500">Your withdrawal history will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WithdrawalPage;