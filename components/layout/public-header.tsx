'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Navigation items removed as only the main page and login are needed

export function PublicHeader() {
  return (
    <header className="bg-union-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="bg-union-600 p-2 rounded-lg mr-3">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-lg font-semibold">Union Benefits</span>
            </div>
          </div>

          {/* Navigation removed - only main page and login needed */}

          {/* Manager Login Button */}
          <div className="flex items-center">
            <Button 
              asChild
              variant="secondary"
              className="bg-union-600 hover:bg-union-500 text-white border-union-500"
            >
              <Link href="/login">
                Manager Login
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
