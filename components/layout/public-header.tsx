'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Benefits', href: '/benefits' },
  { name: 'Resources', href: '/resources' },
  { name: 'Contact', href: '/contact' },
];

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

          {/* Navigation */}
          <nav className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-union-100 hover:text-white hover:bg-union-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>

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
