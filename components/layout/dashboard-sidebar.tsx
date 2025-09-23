'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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
  ChevronDown,
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
    subItems: [
      { type: 'header', title: 'Monthly' },
      { type: 'link', title: 'Account Contribution', href: '/dashboard/batches/account-contribution' },
      { type: 'link', title: 'Employer Contribution', href: '/dashboard/batches/employer-contribution' },
      { type: 'link', title: 'Insurance Premium', href: '/dashboard/batches/insurance-premium' },
      { type: 'link', title: 'Life Insurance', href: '/dashboard/batches/life-insurance' },
      { type: 'header', title: 'Yearly' },
      { type: 'link', title: 'Fiscal Year End', href: '/dashboard/batches/fiscal-year-end' },
      { type: 'link', title: 'Annuity Interest', href: '/dashboard/batches/annuity-interest' },
    ],
  },
  {
    title: 'Reports',
    href: '/dashboard/reports',
    icon: FileText,
  },
  {
    title: 'Admin Settings',
    href: '/dashboard/admin/settings',
    icon: Settings,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [isBatchesOpen, setIsBatchesOpen] = useState(
    pathname.startsWith('/dashboard/batches')
  );

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
            if (item.subItems) {
              const isParentActive = pathname.startsWith(item.href);
              return (
                <div key={item.title} className="space-y-1">
                  <Button
                    variant={isParentActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-between',
                      isParentActive &&
                        'bg-union-100 text-union-900 hover:bg-union-200'
                    )}
                    onClick={() => setIsBatchesOpen(!isBatchesOpen)}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.title}
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transform transition-transform',
                        isBatchesOpen && 'rotate-180'
                      )}
                    />
                  </Button>
                  {isBatchesOpen && (
                    <div className="ml-4 space-y-1 border-l-2 border-gray-200 pl-2">
                      {item.subItems.map((subItem) =>
                        subItem.type === 'header' ? (
                          <h4
                            key={subItem.title}
                            className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                          >
                            {subItem.title}
                          </h4>
                        ) : (
                          <Button
                            key={subItem.href}
                            variant={
                              pathname === subItem.href ? 'secondary' : 'ghost'
                            }
                            className={cn(
                              'w-full justify-start',
                              pathname === subItem.href &&
                                'bg-union-100 text-union-900 hover:bg-union-200'
                            )}
                            asChild
                          >
                            <Link href={subItem.href!}>{subItem.title}</Link>
                          </Button>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            }

            const isActive =
              pathname === item.href ||
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
