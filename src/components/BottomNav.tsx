'use client';

import React from 'react';
import { Syringe, TrendingUp, Baby, Stethoscope, Camera } from 'lucide-react';

export type ActiveTab =
  | 'vaccines'
  | 'growth'
  | 'daily'
  | 'tummy'
  | 'weaning'
  | 'milestones'
  | 'teeth'
  | 'dose'
  | 'mom'
  | 'doctor'
  | 'memories';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  vaccinesDueCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  vaccinesDueCount = 0,
}) => {
  const tabs = [
    {
      id: 'vaccines' as const,
      label: 'Vaccines',
      icon: Syringe,
      badge: vaccinesDueCount > 0 ? vaccinesDueCount : undefined,
    },
    {
      id: 'growth' as const,
      label: 'Growth',
      icon: TrendingUp,
    },
    {
      id: 'daily' as const,
      label: 'Daily Care',
      icon: Baby,
    },
    {
      id: 'doctor' as const,
      label: 'Clinic',
      icon: Stethoscope,
    },
    {
      id: 'memories' as const,
      label: 'Memories',
      icon: Camera,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/95 dark:bg-[#141317]/95 backdrop-blur-md border-t border-[#EAE6DF] dark:border-[#2D2B33] pb-[env(safe-area-inset-bottom,0px)]"
      suppressHydrationWarning
    >
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-center px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.id === 'daily'
              ? ['daily', 'tummy', 'weaning', 'mom'].includes(activeTab)
              : tab.id === 'doctor'
              ? ['doctor', 'dose'].includes(activeTab)
              : tab.id === 'memories'
              ? ['memories', 'milestones', 'teeth'].includes(activeTab)
              : activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center h-full w-full py-1 transition-[color,transform] duration-150 active:scale-[0.92] select-none ${
                isActive
                  ? 'text-[#E2765A] dark:text-[#F1997A]'
                  : 'text-[#75706B] dark:text-[#9E9892] hover:text-[#201E1D] dark:hover:text-[#FAF8F5]'
              }`}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <span className="absolute top-0 w-8 h-1 rounded-full bg-[#E2765A]" />
              )}

              {/* Icon Container with Badge */}
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.75]'
                  }`}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-3.5 flex items-center justify-center rounded-full text-[9px] font-semibold bg-[#FFF0E6] text-[#8A3510] border border-[#FCDCCB]">
                    {tab.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] tracking-tight mt-1 transition-colors duration-150 ${
                  isActive ? 'font-semibold text-[#E2765A] dark:text-[#F1997A]' : 'font-medium text-[#75706B] dark:text-[#9E9892]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
