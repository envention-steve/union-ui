'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  Building2,
  Shield,
  Package,
  FileText,
  Settings,
} from 'lucide-react';

const sidebarItems = [
  {
    title: 'Members',
    href: '/dashboard/members',
    icon: Users,
  },
  {
    title: 'Employers',
    href: '/dashboard/employers',
    icon: Building2,
  },
  {
    title: 'Insurance Plans',
    href: '/dashboard/insurance-plans',
    icon: Shield,
  },
  {
    title: 'Batches',
    href: '/dashboard/batches',
    icon: Package,
  },
  {
    title: 'Reports',
    href: '/dashboard/reports',
    icon: FileText,
  },
  {
    title: 'Admin Settings',
    href: '/dashboard/admin-settings',
    icon: Settings,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center px-6 border-b">
        <h2 className="text-lg font-semibold text-union-700">
          Union Benefits
        </h2>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            
            return (
              <Button
                key={item.href}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  isActive && 'bg-union-100 text-union-900 hover:bg-union-200'
                )}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}
