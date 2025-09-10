'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestRefreshPage() {
  const { user, isAuthenticated, expiresAt, checkAuth, refreshSession } = useAuthStore();
  const [refreshLog, setRefreshLog] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setRefreshLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  useEffect(() => {
    if (isAuthenticated && expiresAt) {
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;
      addLog(`Token expires in ${Math.floor(timeUntilExpiry / 60)} minutes and ${timeUntilExpiry % 60} seconds`);
    }
  }, [isAuthenticated, expiresAt]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    addLog('Starting manual token refresh...');
    try {
      await refreshSession();
      addLog('Manual refresh successful!');
    } catch (error) {
      addLog(`Manual refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCheckAuth = async () => {
    addLog('Checking auth status...');
    try {
      await checkAuth();
      addLog('Auth check successful!');
    } catch (error) {
      addLog(`Auth check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const formatExpiryTime = (expiresAt: number) => {
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = expiresAt - now;
    
    if (timeUntilExpiry <= 0) {
      return 'EXPIRED';
    }
    
    const minutes = Math.floor(timeUntilExpiry / 60);
    const seconds = timeUntilExpiry % 60;
    return `${minutes}m ${seconds}s`;
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>JWT Refresh Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to test JWT refresh functionality.</p>
            <Button onClick={handleCheckAuth} className="mt-4">
              Check Auth Status
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>JWT Refresh Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">User Info</h3>
              <p><strong>Name:</strong> {user?.name}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>ID:</strong> {user?.id}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Token Info</h3>
              {expiresAt && (
                <>
                  <p><strong>Expires in:</strong> {formatExpiryTime(expiresAt)}</p>
                  <p><strong>Expires at:</strong> {new Date(expiresAt * 1000).toLocaleString()}</p>
                  <p><strong>Status:</strong> {
                    (expiresAt - Math.floor(Date.now() / 1000)) < 300 
                      ? <span className="text-red-600">Expiring Soon</span>
                      : <span className="text-green-600">Valid</span>
                  }</p>
                </>
              )}
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Button 
              onClick={handleManualRefresh} 
              disabled={isRefreshing}
              variant="outline"
            >
              {isRefreshing ? 'Refreshing...' : 'Manual Refresh'}
            </Button>
            <Button onClick={handleCheckAuth} variant="outline">
              Check Auth
            </Button>
            <Button 
              onClick={() => setRefreshLog([])} 
              variant="outline"
            >
              Clear Log
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Refresh Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-md max-h-64 overflow-y-auto">
            {refreshLog.length === 0 ? (
              <p className="text-gray-500 italic">No activity yet...</p>
            ) : (
              <div className="space-y-1">
                {refreshLog.map((log, index) => (
                  <div key={index} className="text-sm font-mono">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>• This page helps test JWT token refresh functionality</p>
            <p>• The middleware should automatically refresh tokens when they expire or are expiring soon</p>
            <p>• The AuthProvider should also handle proactive refresh</p>
            <p>• Use "Manual Refresh" to test the refresh flow manually</p>
            <p>• Watch the console logs for detailed refresh activity</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
