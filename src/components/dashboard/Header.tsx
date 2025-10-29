'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onToggleSidebar: () => void;
}

interface Notification {
  id: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  type?: string;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch user data and notifications
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log("No token found, redirecting to login")
          router.push('/auth/login');
          return;
        }

        // Fetch user profile
        const userResponse = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserEmail(userData.user.email);
        } else if (userResponse.status === 401) {
          console.log("here i guess")
          // Token is invalid or expired, clear storage and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          localStorage.removeItem('isAuthenticated');
          router.push('/auth/login');
          return;
        }

        // Fetch notifications (simulated endpoint - you may need to create this)
        await fetchNotifications();
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const fetchNotifications = async () => {
      try {
        setNotificationsLoading(true);
        const token = localStorage.getItem('token');
        
        // For now, we'll simulate notifications based on recent activities
        // You can create a dedicated notifications API endpoint later
        const [transactionsRes, auctionsRes] = await Promise.all([
          fetch('/api/transactions?limit=5', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch('/api/auctions?limit=5', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
        ]);

        const mockNotifications: Notification[] = [];
        
        if (transactionsRes.ok) {
          const transactionsData = await transactionsRes.json();
          transactionsData.transactions?.slice(0, 2).forEach((transaction: any, index: number) => {
            mockNotifications.push({
              id: `tx-${transaction.id}`,
              title: transaction.type === 'SALE' ? 'NFT Sale Completed' : 'New Transaction',
              desc: `${transaction.nft.name} - ${transaction.amount} ETH`,
              time: getRelativeTime(transaction.createdAt),
              unread: index === 0,
              type: 'transaction'
            });
          });
        }

        if (auctionsRes.ok) {
          const auctionsData = await auctionsRes.json();
          auctionsData.auctions?.slice(0, 2).forEach((auction: any, index: number) => {
            mockNotifications.push({
              id: `auction-${auction.id}`,
              title: auction.status === 'ACTIVE' ? 'New Bid Received' : 'Auction Update',
              desc: `${auction.nft.name} - Current bid: ${auction.currentBid || auction.startingPrice} ETH`,
              time: getRelativeTime(auction.updatedAt),
              unread: index === 0,
              type: 'auction'
            });
          });
        }

        // Add a welcome notification if no real notifications
        if (mockNotifications.length === 0) {
          mockNotifications.push({
            id: 'welcome',
            title: 'Welcome to Etheryte',
            desc: 'Start creating and trading NFTs on our platform',
            time: '1h ago',
            unread: true,
            type: 'system'
          });
        }

        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => n.unread).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        // Fallback to basic notification
        setNotifications([{
          id: 'error',
          title: 'System Notification',
          desc: 'Welcome to your dashboard',
          time: '1h ago',
          unread: false,
          type: 'system'
        }]);
      } finally {
        setNotificationsLoading(false);
      }
    };

    const getRelativeTime = (dateString: string) => {
      const now = new Date();
      const date = new Date(dateString);
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    fetchUserData();

    // Handle scroll effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    // Close dropdowns when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token'); // Remove both for complete cleanup
    localStorage.removeItem('user_data');
    localStorage.removeItem('isAuthenticated');
    router.push('/auth/login');
  };

  const markNotificationAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, unread: false }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, unread: false })));
    setUnreadCount(0);
  };

  return (
    <header 
      className={`sticky top-0 z-30 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 backdrop-blur-xl shadow-lg border-b border-light-200/50' 
          : 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-light-200'
      }`}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button with hover effect */}
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-mid-400 hover:text-charcoal hover:bg-gradient-to-br hover:from-light-100 hover:to-light-200 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo with gradient and animation */}
            <div className="flex items-center group cursor-pointer">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-black via-gray-800 to-gray-600 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-charcoal via-black to-gray-800 bg-clip-text text-transparent group-hover:from-black group-hover:via-gray-800 group-hover:to-gray-600 transition-all duration-300">
                Etheryte
              </span>
            </div>
          </div>

          {/* Right side - Actions and User Profile */}
          <div className="flex items-center gap-2">
            {/* Notifications with badge */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-mid-400 hover:text-charcoal hover:bg-gradient-to-br hover:from-light-100 hover:to-light-200 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-light-200 overflow-hidden z-50 animate-in slide-in-from-top-5 duration-200">
                  <div className="p-4 bg-gradient-to-r from-black/5 to-gray-500/5 border-b border-light-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-charcoal">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-mid-400 mt-0.5">
                      {unreadCount > 0 ? `You have ${unreadCount} unread messages` : 'All caught up!'}
                    </p>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 hover:bg-light-50 transition-colors cursor-pointer border-b border-light-100 last:border-0 ${
                            notif.unread ? 'bg-blue-50/50' : ''
                          }`}
                          onClick={() => markNotificationAsRead(notif.id)}
                        >
                          <div className="flex items-start gap-3">
                            {notif.unread && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 animate-pulse"></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-charcoal truncate">{notif.title}</p>
                              <p className="text-xs text-mid-400 mt-1">{notif.desc}</p>
                              <p className="text-xs text-mid-300 mt-1">{notif.time}</p>
                            </div>
                            {notif.type && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                notif.type === 'transaction' ? 'bg-green-100 text-green-800' :
                                notif.type === 'auction' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {notif.type}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p className="text-gray-600">No notifications</p>
                        <p className="text-sm text-gray-500">You're all caught up!</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-light-50 border-t border-light-200">
                    <button className="w-full text-center text-sm text-black hover:text-gray-800 font-medium transition-colors">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 p-2 pl-3 rounded-xl hover:bg-gradient-to-br hover:from-light-100 hover:to-light-200 transition-all duration-200 hover:scale-105 active:scale-95 group"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-charcoal group-hover:text-brand transition-colors">
                    {userEmail.split('@')[0]}
                  </p>
                  <p className="text-xs text-mid-400">
                    {userEmail}
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-black to-gray-800 rounded-full blur-sm opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative w-10 h-10 bg-gradient-to-br from-black via-gray-800 to-gray-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white group-hover:ring-black/20 transition-all">
                    <span className="text-white text-sm font-bold">
                      {userEmail.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <svg 
                  className={`w-4 h-4 text-mid-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-light-200 overflow-hidden z-50 animate-in slide-in-from-top-5 duration-200">
                  {/* User Info Header */}
                  <div className="p-4 bg-gradient-to-br from-black/10 via-gray-500/10 to-gray-600/10 border-b border-light-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-black via-gray-800 to-gray-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold">
                          {userEmail.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-charcoal truncate">
                          {userEmail.split('@')[0]}
                        </p>
                        <p className="text-xs text-mid-400 truncate">
                          {userEmail}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <a
                      href="#"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-charcoal hover:bg-gradient-to-r hover:from-black/10 hover:to-gray-500/10 transition-all group"
                    >
                      <svg className="w-5 h-5 text-mid-400 group-hover:text-brand transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium">Profile Settings</span>
                    </a>
                    <a
                      href="#"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-charcoal hover:bg-gradient-to-r hover:from-black/10 hover:to-gray-500/10 transition-all group"
                    >
                      <svg className="w-5 h-5 text-mid-400 group-hover:text-brand transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium">Account Settings</span>
                    </a>
                    <a
                      href="#"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-charcoal hover:bg-gradient-to-r hover:from-black/10 hover:to-gray-500/10 transition-all group"
                    >
                      <svg className="w-5 h-5 text-mid-400 group-hover:text-brand transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Help & Support</span>
                    </a>
                  </div>

                  <div className="border-t border-light-200 p-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-all group"
                    >
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="font-semibold">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}