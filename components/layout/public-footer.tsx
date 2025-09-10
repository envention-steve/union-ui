'use client';

import Link from 'next/link';
import { Shield, Phone, Mail, Clock } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="bg-union-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="bg-union-600 p-2 rounded-lg mr-3">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-lg font-semibold">Union Benefits</span>
            </div>
            <p className="text-union-200 text-sm leading-relaxed">
              Providing comprehensive benefit management services to 
              union members and their families. Your benefits matter.
            </p>
            <div className="flex space-x-4">
              <div className="w-8 h-8 bg-union-700 rounded-full flex items-center justify-center hover:bg-union-600 cursor-pointer transition-colors">
                <span className="text-xs">f</span>
              </div>
              <div className="w-8 h-8 bg-union-700 rounded-full flex items-center justify-center hover:bg-union-600 cursor-pointer transition-colors">
                <span className="text-xs">t</span>
              </div>
              <div className="w-8 h-8 bg-union-700 rounded-full flex items-center justify-center hover:bg-union-600 cursor-pointer transition-colors">
                <span className="text-xs">in</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <div className="space-y-2">
              <Link href="/benefits" className="block text-union-200 hover:text-white text-sm transition-colors">
                Benefits Overview
              </Link>
              <Link href="/enrollment" className="block text-union-200 hover:text-white text-sm transition-colors">
                Enrollment
              </Link>
              <Link href="/claims" className="block text-union-200 hover:text-white text-sm transition-colors">
                Claims
              </Link>
              <Link href="/support" className="block text-union-200 hover:text-white text-sm transition-colors">
                Support
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-union-200">
                <Phone className="h-4 w-4 mr-2" />
                1-800-555-0123
              </div>
              <div className="flex items-center text-sm text-union-200">
                <Mail className="h-4 w-4 mr-2" />
                info@union.org
              </div>
              <div className="flex items-center text-sm text-union-200">
                <Clock className="h-4 w-4 mr-2" />
                Mon-Fri 8AM-5PM EST
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-union-700 mt-8 pt-6 text-center">
          <p className="text-union-300 text-sm">
            © 2024 Union Benefits Management System. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
