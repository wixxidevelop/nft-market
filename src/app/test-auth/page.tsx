'use client'

import { useState } from 'react'

export default function TestAuthPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[AUTH TEST] ${message}`)
  }

  const clearLogs = () => {
    setLogs([])
    console.clear()
  }

  const testLogin = async () => {
    setIsLoading(true)
    clearLogs()
    
    try {
      addLog('Starting login test...')
      
      // Clear any existing auth data
      addLog('Clearing existing localStorage data...')
      localStorage.removeItem('token')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('_auth_timestamp')
      
      // Test login with demo user
      addLog('Attempting login with demo@etheryte.com / password123')
      
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'demo@etheryte.com',
          password: 'password123'
        }),
        credentials: 'include'
      })
      
      addLog(`Login response status: ${loginResponse.status}`)
      
      if (!loginResponse.ok) {
        const errorText = await loginResponse.text()
        addLog(`Login failed: ${errorText}`)
        return
      }
      
      const loginData = await loginResponse.json()
      addLog(`Login response: ${JSON.stringify(loginData, null, 2)}`)
      
      if (loginData.success && loginData.token) {
        addLog('Login successful! Storing token...')
        
        // Store token in localStorage
        localStorage.setItem('token', loginData.token)
        localStorage.setItem('auth_token', loginData.token)
        localStorage.setItem('user_data', JSON.stringify(loginData.user))
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('_auth_timestamp', Date.now().toString())
        
        addLog('Token stored in localStorage')
        
        // Wait a bit for localStorage to be written
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Verify localStorage
        const storedToken = localStorage.getItem('token')
        addLog(`Stored token: ${storedToken ? storedToken.substring(0, 20) + '...' : 'null'}`)
        
        // Test /api/auth/me endpoint
        addLog('Testing /api/auth/me endpoint...')
        
        const meResponse = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        })
        
        addLog(`/api/auth/me response status: ${meResponse.status}`)
        
        if (meResponse.ok) {
          const meData = await meResponse.json()
          addLog(`/api/auth/me response: ${JSON.stringify(meData, null, 2)}`)
        } else {
          const errorText = await meResponse.text()
          addLog(`/api/auth/me failed: ${errorText}`)
        }
        
        // Check cookies
        addLog(`Document cookies: ${document.cookie}`)
        
      } else {
        addLog('Login failed: No token received')
      }
      
    } catch (error) {
      addLog(`Error during test: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testStorageAndCookies = () => {
    clearLogs()
    addLog('Testing current storage and cookies...')
    
    // Check localStorage
    const token = localStorage.getItem('token')
    const authToken = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user_data')
    const isAuth = localStorage.getItem('isAuthenticated')
    
    addLog(`localStorage token: ${token ? token.substring(0, 20) + '...' : 'null'}`)
    addLog(`localStorage auth_token: ${authToken ? authToken.substring(0, 20) + '...' : 'null'}`)
    addLog(`localStorage user_data: ${userData}`)
    addLog(`localStorage isAuthenticated: ${isAuth}`)
    
    // Check cookies
    addLog(`Document cookies: ${document.cookie}`)
    
    // Check all localStorage keys
    const allKeys = Object.keys(localStorage)
    addLog(`All localStorage keys: ${allKeys.join(', ')}`)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Test Page</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="space-x-4">
            <button
              onClick={testLogin}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Complete Login Flow'}
            </button>
            
            <button
              onClick={testStorageAndCookies}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Check Storage & Cookies
            </button>
            
            <button
              onClick={clearLogs}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Clear Logs
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Logs</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Click "Test Complete Login Flow" to start.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>
        
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Test Credentials:</h3>
          <p className="text-yellow-700">
            <strong>Demo User:</strong> demo@etheryte.com / password123<br/>
            <strong>Admin User:</strong> admin@etheryte.com / admin123
          </p>
        </div>
      </div>
    </div>
  )
}