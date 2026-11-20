'use client';

import React, { useState } from 'react';
import {
  Syringe,
  TrendingUp,
  Baby,
  Stethoscope,
  Camera,
  Utensils,
  Sparkles,
  Award,
  Calculator,
  Heart,
  LayoutGrid,
  X,
  ChevronRight,
  Wind,
  Settings,
  Smile,
  ShieldCheck,
  Check,
} from 'lucide-react';

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
  growthCount?: number;
  memoriesCount?: number;
  onOpenShusher?: () => void;
  onOpenCelebration?: () => void;
  onOpenSettings?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  vaccinesDueCount = 0,
  growthCount,
  memoriesCount,
  onOpenShusher,
  onOpenCelebration,
  onOpenSettings,
}) => {
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);

  // Group secondary tabs that route through the dynamic 5th slot
  const secondaryTabs: ActiveTab[] = [
    'tummy',
    'weaning',
    'milestones',
    'teeth',
    'dose',
    'mom',
    'memories',
  ];

  const isSecondaryActive = secondaryTabs.includes(activeTab);

  // Dynamic 5th tab config based on active secondary tab
  const getFifthTabInfo = () => {
    switch (activeTab) {
      case 'weaning':
        return { label: 'Weaning', icon: Utensils, isSelected: true };
      case 'tummy':
        return { label: 'Tummy', icon: Sparkles, isSelected: true };
      case 'milestones':
        return { label: 'Milestones', icon: Award, isSelected: true };
      case 'teeth':
        return { label: 'Teeth', icon: Smile, isSelected: true };
      case 'dose':
        return { label: 'Fever/Dose', icon: Calculator, isSelected: true };
      case 'mom':
        return { label: 'Mom Care', icon: Heart, isSelected: true };
      case 'memories':
        return { label: 'Memories', icon: Camera, isSelected: true };
      default:
        return { label: 'More', icon: LayoutGrid, isSelected: false };
    }
  };

  const fifthTab = getFifthTabInfo();
  const FifthIcon = fifthTab.icon;

  // Primary 4 tabs + 1 dynamic More/Active tab
  const primaryTabs = [
    {
      id: 'vaccines' as const,
      label: 'Vaccines',
      icon: Syringe,
      badge: vaccinesDueCount > 0 ? vaccinesDueCount : undefined,
      isActive: activeTab === 'vaccines',
    },
    {
      id: 'growth' as const,
      label: 'Growth',
      icon: TrendingUp,
      badge: growthCount !== undefined && growthCount > 0 ? growthCount : undefined,
      isActive: activeTab === 'growth',
    },
    {
      id: 'daily' as const,
      label: 'Daily Care',
      icon: Baby,
      isActive: activeTab === 'daily',
    },
    {
      id: 'doctor' as const,
      label: 'Clinic',
      icon: Stethoscope,
      isActive: activeTab === 'doctor',
    },
  ];

  // All 11 pages structured for the All-Pages Sheet
  const sheetSections = [
    {
      category: 'Clinical & Health',
      items: [
        {
          id: 'vaccines' as const,
          label: 'Vaccine Tracker',
          desc: 'Immunization schedule & overdue doses',
          icon: Syringe,
          badge: vaccinesDueCount > 0 ? `${vaccinesDueCount} due` : undefined,
        },
        {
          id: 'growth' as const,
          label: 'WHO Growth Charts',
          desc: 'Weight, height & head circumference centiles',
          icon: TrendingUp,
          badge: growthCount !== undefined ? `${growthCount} entries` : undefined,
        },
        {
          id: 'dose' as const,
          label: 'Pediatric Fever & Dose Calculator',
          desc: 'Weight-based safe doses (Paracetamol, Kidrich D3, Colimex)',
          icon: Calculator,
          badge: 'Safe Dose',
        },
        {
          id: 'doctor' as const,
          label: 'Doctor Visits & Prescriptions',
          desc: 'Pediatrician visit Q&A and prescription vault',
          icon: Stethoscope,
        },
      ],
    },
    {
      category: 'Daily Routines & Food',
      items: [
        {
          id: 'daily' as const,
          label: 'Daily Care & Feeds',
          desc: 'Nursing timer, bottle, sleep & diaper logs',
          icon: Baby,
        },
        {
          id: 'weaning' as const,
          label: 'First Foods & Solid Weaning Hub (6M+)',
          desc: 'Food diary, age-wise Bengali food chart & safe recipes',
          icon: Utensils,
          badge: '6M+ Guide',
        },
        {
          id: 'tummy' as const,
          label: 'Tummy Time Coach',
          desc: 'Daily tummy time stopwatch, streaks & milestones',
          icon: Sparkles,
        },
      ],
    },
    {
      category: 'Milestones & Memories',
      items: [
        {
          id: 'milestones' as const,
          label: 'CDC Developmental Milestones',
          desc: '2M–5Y cognitive, social & motor skill checklist',
          icon: Award,
        },
        {
          id: 'teeth' as const,
          label: '20-Baby-Teeth Map',
          desc: 'Interactive dental eruption chart & teething logs',
          icon: Smile,
          badge: '20 Teeth',
        },
        {
          id: 'memories' as const,
          label: 'Milestone Records & Photos',
          desc: 'Baby photo gallery, memory cards & favorites',
          icon: Camera,
          badge: memoriesCount !== undefined ? `${memoriesCount} photos` : undefined,
        },
      ],
    },
    {
      category: 'Maternal Wellness',
      items: [
        {
          id: 'mom' as const,
          label: 'Mom Care & Postpartum Recovery',
          desc: 'Maternal healing tracker, mood & postpartum wellness',
          icon: Heart,
          badge: 'Maternal Care',
        },
      ],
    },
  ];

  return (
    <>
      {/* 1. BOTTOM NAVIGATION BAR (Visible on mobile < md) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/96 dark:bg-[#141317]/96 backdrop-blur-md border-t border-[#EAE6DF] dark:border-[#2D2B33] pb-[env(safe-area-inset-bottom,0px)] transition-colors shadow-lg shadow-black/5"
        suppressHydrationWarning
      >
        <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-center px-1">
          {/* Primary 4 tabs */}
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`relative flex flex-col items-center justify-center h-full w-full py-1 transition-[color,transform] duration-150 active:scale-[0.92] select-none ${
                  tab.isActive
                    ? 'text-[#44634B] dark:text-[#A8D1B0]'
                    : 'text-[#75706B] dark:text-[#9E9892] hover:text-[#201E1D] dark:hover:text-[#FAF8F5]'
                }`}
              >
                {/* Active Indicator Bar */}
                {tab.isActive && (
                  <span className="absolute top-0 w-8 h-1 rounded-full bg-[#44634B] dark:bg-[#A8D1B0]" />
                )}

                {/* Icon Container with Badge */}
                <div className="relative">
                  <div className={`p-1 rounded-full transition-colors ${tab.isActive ? 'bg-[#E1EDE4] dark:bg-[#203D24]' : ''}`}>
                    <Icon
                      className={`w-5 h-5 transition-transform duration-150 ${
                        tab.isActive ? 'scale-105 stroke-[2.2]' : 'stroke-[1.75]'
                      }`}
                    />
                  </div>
                  {tab.badge !== undefined && (
                    <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-3.5 flex items-center justify-center rounded-full text-[9px] font-semibold bg-[#FAECE5] text-[#D97757] border border-[#F4D5C6] dark:bg-[#3B251F] dark:text-[#F8BCA0] dark:border-[#543830]">
                      {tab.badge}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] tracking-tight mt-0.5 transition-colors duration-150 ${
                    tab.isActive
                      ? 'font-bold text-[#44634B] dark:text-[#A8D1B0]'
                      : 'font-medium text-[#75706B] dark:text-[#9E9892]'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* Dynamic 5th Tab: Active Sub-Page or More Hub */}
          <button
            onClick={() => setIsSheetOpen((prev) => !prev)}
            aria-label="View all pages and modules"
            aria-expanded={isSheetOpen}
            className={`relative flex flex-col items-center justify-center h-full w-full py-1 transition-[color,transform] duration-150 active:scale-[0.92] select-none ${
              fifthTab.isSelected || isSheetOpen
                ? 'text-[#44634B] dark:text-[#A8D1B0]'
                : 'text-[#75706B] dark:text-[#9E9892] hover:text-[#201E1D] dark:hover:text-[#FAF8F5]'
            }`}
          >
            {/* Active Indicator Bar */}
            {(fifthTab.isSelected || isSheetOpen) && (
              <span className="absolute top-0 w-8 h-1 rounded-full bg-[#44634B] dark:bg-[#A8D1B0]" />
            )}

            <div className="relative">
              <div className={`p-1 rounded-full transition-colors ${fifthTab.isSelected || isSheetOpen ? 'bg-[#E1EDE4] dark:bg-[#203D24]' : ''}`}>
                <FifthIcon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    fifthTab.isSelected || isSheetOpen ? 'scale-105 stroke-[2.2]' : 'stroke-[1.75]'
                  }`}
                />
              </div>
              {!fifthTab.isSelected && (
                <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-3.5 flex items-center justify-center rounded-full text-[9px] font-semibold bg-[#FAECE5] text-[#D97757] border border-[#F4D5C6] dark:bg-[#3B251F] dark:text-[#F8BCA0] dark:border-[#543830]">
                  7
                </span>
              )}
            </div>

            <span
              className={`text-[10px] tracking-tight mt-0.5 transition-colors duration-150 flex items-center gap-0.5 ${
                fifthTab.isSelected || isSheetOpen
                  ? 'font-bold text-[#44634B] dark:text-[#A8D1B0]'
                  : 'font-medium text-[#75706B] dark:text-[#9E9892]'
              }`}
            >
              {fifthTab.label}
              <span className="text-[9px] opacity-70">▾</span>
            </span>
          </button>
        </div>
      </nav>

      {/* 2. ALL PAGES MOBILE BOTTOM SHEET */}
      {isSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="All DayOne Pages and Features"
          className="fixed inset-0 z-50 flex items-end justify-center md:hidden animate-in fade-in duration-200"
        >
          {/* Backdrop overlay */}
          <div
            onClick={() => setIsSheetOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />

          {/* Sliding sheet container */}
          <div className="relative z-10 w-full max-h-[85vh] bg-[#FAF8F5] dark:bg-[#16151B] rounded-t-3xl border-t border-[#EAE6DF] dark:border-[#2D2B33] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250">
            {/* Drag Handle Bar */}
            <div className="pt-3 pb-1 flex justify-center">
              <div className="w-12 h-1.5 rounded-full bg-[#D5CFCE] dark:bg-[#3D3B44]" />
            </div>

            {/* Sheet Header */}
            <div className="px-5 py-3 border-b border-[#EAE6DF] dark:border-[#2D2B33] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#201E1D] dark:text-[#FAF8F5] flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-[#44634B] dark:text-[#A8D1B0]" />
                  <span>All Pages & Features</span>
                </h3>
                <p className="text-[11px] text-[#75706B] dark:text-[#9E9892] mt-0.5">
                  12 Pediatric Trackers & Care Modules
                </p>
              </div>

              <button
                onClick={() => setIsSheetOpen(false)}
                aria-label="Close sheet"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#75706B] dark:text-[#9E9892] hover:bg-[#EAE6DF] dark:hover:bg-[#27252F] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Page List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8">
              {sheetSections.map((section) => (
                <div key={section.category} className="space-y-1.5">
                  <h4 className="text-[11px] font-semibold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider px-1">
                    {section.category}
                  </h4>

                  <div className="space-y-1.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isCurrent = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onChangeTab(item.id);
                            setIsSheetOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl text-left border transition-all duration-150 active:scale-[0.98] ${
                            isCurrent
                              ? 'bg-white dark:bg-[#201E26] border-[#44634B] shadow-sm ring-1 ring-[#44634B]/20'
                              : 'bg-white/80 dark:bg-[#1D1C22]/80 hover:bg-white dark:hover:bg-[#1D1C22] border-[#EAE6DF] dark:border-[#2D2B33]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                                isCurrent
                                  ? 'bg-[#E1EDE4] dark:bg-[#203D24] border-[#C5DCCE] dark:border-[#2E4733] text-[#44634B] dark:text-[#A8D1B0]'
                                  : 'bg-[#F2ECE3] dark:bg-[#26242C] border-[#EAE6DF] dark:border-[#35333C] text-[#75706B] dark:text-[#9E9892]'
                              }`}
                            >
                              <Icon className="w-4 h-4 stroke-[2]" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold truncate ${
                                  isCurrent ? 'text-[#44634B] dark:text-[#A8D1B0]' : 'text-[#201E1D] dark:text-[#FAF8F5]'
                                }`}>
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-medium bg-[#FAECE5] text-[#D97757] border border-[#F4D5C6] dark:bg-[#3B251F] dark:text-[#F8BCA0] dark:border-[#543830] shrink-0">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#75706B] dark:text-[#9E9892] truncate mt-0.5">
                                {item.desc}
                              </p>
                            </div>
                          </div>

                          {isCurrent ? (
                            <div className="w-5 h-5 rounded-full bg-[#44634B] text-white flex items-center justify-center shrink-0 ml-2">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                            </div>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[#A8A29E] dark:text-[#6E6A75] shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Quick Utility Tools Row */}
              <div className="pt-2 border-t border-[#EAE6DF] dark:border-[#2D2B33] space-y-2">
                <h4 className="text-[11px] font-semibold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider px-1">
                  Quick Utilities
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {onOpenShusher && (
                    <button
                      onClick={() => {
                        setIsSheetOpen(false);
                        onOpenShusher();
                      }}
                      className="p-2.5 rounded-xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] text-center flex flex-col items-center justify-center gap-1 active:scale-[0.96] transition-all"
                    >
                      <Wind className="w-4 h-4 text-[#E2765A]" />
                      <span className="text-[10px] font-semibold text-[#201E1D] dark:text-[#FAF8F5]">Shusher</span>
                    </button>
                  )}

                  {onOpenCelebration && (
                    <button
                      onClick={() => {
                        setIsSheetOpen(false);
                        onOpenCelebration();
                      }}
                      className="p-2.5 rounded-xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] text-center flex flex-col items-center justify-center gap-1 active:scale-[0.96] transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-[#E2765A]" />
                      <span className="text-[10px] font-semibold text-[#201E1D] dark:text-[#FAF8F5]">Birthday</span>
                    </button>
                  )}

                  {onOpenSettings && (
                    <button
                      onClick={() => {
                        setIsSheetOpen(false);
                        onOpenSettings();
                      }}
                      className="p-2.5 rounded-xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] text-center flex flex-col items-center justify-center gap-1 active:scale-[0.96] transition-all"
                    >
                      <Settings className="w-4 h-4 text-[#75706B] dark:text-[#9E9892]" />
                      <span className="text-[10px] font-semibold text-[#201E1D] dark:text-[#FAF8F5]">Settings</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
