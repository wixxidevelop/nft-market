'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import AccountSummary from '@/components/dashboard/AccountSummary';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        console.log('🔍 Dashboard: Starting authentication check via cookies');

        // Rely on HttpOnly cookies set by the server; no localStorage or client cookies
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        console.log('📡 Dashboard: /api/auth/me status:', response.status);

        if (response.ok) {
          const result = await response.json();
          const data = result?.data || result; // apiResponse wraps under data

          if (data?.user) {
            console.log('✅ Dashboard: Authenticated as:', data.user.email);
            setUser({
              id: data.user.id,
              email: data.user.email,
              name: data.user.firstName || data.user.username || data.user.email,
              role: data.user.role,
              isActive: data.user.isActive,
              createdAt: data.user.createdAt,
              updatedAt: data.user.updatedAt,
            });
            setIsAuthenticated(true);
            setError(null);
            // Optional: cache user for UX only (no tokens)
            localStorage.setItem('user_data', JSON.stringify(data.user));
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('_auth_timestamp', Date.now().toString());
          } else {
            throw new Error('Invalid response format');
          }
        } else if (response.status === 401) {
          console.log('🔄 Dashboard: Access token missing/expired, attempting refresh...');
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (refreshRes.ok) {
            console.log('✅ Dashboard: Refresh succeeded, retrying /api/auth/me');
            const retry = await fetch('/api/auth/me', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
            });

            if (retry.ok) {
              const result = await retry.json();
              const data = result?.data || result;

              if (data?.user) {
                console.log('✅ Dashboard: Authenticated after refresh as:', data.user.email);
                setUser({
                  id: data.user.id,
                  email: data.user.email,
                  name: data.user.firstName || data.user.username || data.user.email,
                  role: data.user.role,
                  isActive: data.user.isActive,
                  createdAt: data.user.createdAt,
                  updatedAt: data.user.updatedAt,
                });
                setIsAuthenticated(true);
                setError(null);
                localStorage.setItem('user_data', JSON.stringify(data.user));
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('_auth_timestamp', Date.now().toString());
              } else {
                throw new Error('Invalid response format after refresh');
              }
            } else {
              throw new Error('Authentication required');
            }
          } else {
            throw new Error('Authentication required');
          }
        } else {
          const errorResult = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorResult.error || `HTTP ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Dashboard: Authentication check failed:', error);
        setError(error instanceof Error ? error.message : 'Authentication failed');
        setIsAuthenticated(true);
        setUser(null);
        // Redirect to login promptly
        //srouter.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Error state
  // if (error && !isAuthenticated) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gray-50">
  //       <div className="text-center max-w-md mx-auto p-6">
  //         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
  //           <strong className="font-bold">Authentication Error:</strong>
  //           <span className="block sm:inline"> {error}</span>
  //         </div>
  //         <p className="text-gray-600 mb-4">Redirecting to login page...</p>
  //         <button 
  //           onClick={() => router.push('/auth/login')}
  //           className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
  //         >
  //           Go to Login Now
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  // Not authenticated state
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Authentication required</p>
          <button 
            onClick={() => router.push('/auth/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Authenticated state - render dashboard
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.name || user.email}!
        </h1>
        <p className="text-gray-600">
          Role: {user.role} | Status: {user.isActive ? 'Active' : 'Inactive'}
        </p>
      </div>
      <AccountSummary />
    </DashboardLayout>
  );
}