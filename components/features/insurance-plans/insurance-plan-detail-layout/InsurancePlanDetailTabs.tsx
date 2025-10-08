'use client';

import type { InsurancePlanDetailTab } from '@/lib/insurance-plans/constants';

interface InsurancePlanDetailTabsProps {
  tabs: InsurancePlanDetailTab[];
  activeTab: InsurancePlanDetailTab['id'];
  onTabChange: (tabId: InsurancePlanDetailTab['id']) => void;
}

export function InsurancePlanDetailTabs({ tabs, activeTab, onTabChange }: InsurancePlanDetailTabsProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive
                  ? 'border-union-600 text-union-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
