'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { LoginForm } from '@/components/features/auth/login-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
      router.push(callbackUrl);
    }
  }, [isAuthenticated, router, searchParams]);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'session-expired') {
      setUrlError('Your session has expired. Please log in again.');
    } else if (error) {
      setUrlError('Authentication error. Please try again.');
    }
  }, [searchParams]);

  if (isAuthenticated) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-union-50 to-union-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-union-900 mb-2">
            Union Benefits
          </h1>
          <p className="text-union-700">
            Comprehensive benefits management platform
          </p>
        </div>
        
        {urlError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{urlError}</AlertDescription>
          </Alert>
        )}
        
        <LoginForm />
      </div>
    </div>
  );
}
