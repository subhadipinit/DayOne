'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const [isClosing, setIsClosing] = useState<boolean>(false);

  // Drag-to-dismiss gesture state
  const [dragY, setDragY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartY = useRef<number>(0);
  const dragStartTime = useRef<number>(0);

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

  // Primary 4 tabs ordered naturally for baby tracking + 1 dynamic 5th slot
  const primaryTabs = [
    {
      id: 'daily' as const,
      label: 'Today',
      icon: Baby,
      isActive: activeTab === 'daily',
    },
    {
      id: 'growth' as const,
      label: 'Growth',
      icon: TrendingUp,
      badge: growthCount !== undefined && growthCount > 0 ? growthCount : undefined,
      isActive: activeTab === 'growth',
    },
    {
      id: 'vaccines' as const,
      label: 'Vaccines',
      icon: Syringe,
      badge: vaccinesDueCount > 0 ? vaccinesDueCount : undefined,
      isActive: activeTab === 'vaccines',
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

  // Snappy exit under 200ms
  const handleCloseSheet = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsSheetOpen(false);
      setIsClosing(false);
      setDragY(0);
      setIsDragging(false);
    }, 190);
  }, [isClosing]);

  const handleOpenSheet = useCallback(() => {
    setIsClosing(false);
    setIsSheetOpen(true);
    setDragY(0);
  }, []);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (isSheetOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isSheetOpen]);

  // Close sheet on Escape key
  useEffect(() => {
    if (!isSheetOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseSheet();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSheetOpen, handleCloseSheet]);

  // Touch gesture handlers for interactive sheet drag
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragStartTime.current = Date.now();
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragStartY.current;
    if (deltaY > 0) {
      setDragY(deltaY);
    } else {
      // Subtle rubber-band resistance when pulling up
      setDragY(deltaY * 0.2);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const elapsedTime = Math.max(1, Date.now() - dragStartTime.current);
    const velocity = dragY / elapsedTime;

    // Dismiss if dragged down > 70px or flicked quickly
    if (dragY > 70 || velocity > 0.3) {
      handleCloseSheet();
    } else {
      setDragY(0);
    }
  };

  return (
    <>
      {/* 1. NATIVE BOTTOM NAVIGATION BAR (Mobile < md) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/94 dark:bg-[#141317]/94 backdrop-blur-xl border-t border-[#EAE6DF]/80 dark:border-[#2D2B33]/80 pb-[max(env(safe-area-inset-bottom,0px),8px)] select-none transition-colors"
        suppressHydrationWarning
      >
        <div className="grid grid-cols-5 h-[56px] max-w-md mx-auto items-center px-1">
          {/* Primary 4 tabs */}
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                className={`tap-feedback relative flex flex-col items-center justify-center h-full w-full py-1 min-h-[48px] touch-manipulation select-none ${
                  tab.isActive
                    ? 'text-[#2D4532] dark:text-[#A8D1B0]'
                    : 'text-[#75706B] dark:text-[#9E9892]'
                }`}
              >
                {/* Active Pill Indicator */}
                <div className="relative">
                  <div
                    className={`w-14 h-7 rounded-full flex items-center justify-center transition-colors duration-150 ${
                      tab.isActive ? 'bg-[#E1EDE4] dark:bg-[#203D24]' : 'bg-transparent'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 transition-transform duration-120 ${
                        tab.isActive ? 'stroke-[2.25] scale-105' : 'stroke-[1.75]'
                      }`}
                    />
                  </div>
                  {tab.badge !== undefined && (
                    <span className="absolute -top-1 -right-1 px-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-bold bg-[#E2765A] text-white shadow-xs ring-2 ring-[#FAF8F5] dark:ring-[#141317] tabular-nums">
                      {tab.badge}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] tracking-tight mt-0.5 leading-tight ${
                    tab.isActive
                      ? 'font-bold text-[#2D4532] dark:text-[#A8D1B0]'
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
            type="button"
            onClick={() => {
              if (isSheetOpen) {
                handleCloseSheet();
              } else {
                handleOpenSheet();
              }
            }}
            aria-label="View all pages and modules"
            aria-expanded={isSheetOpen}
            className={`tap-feedback relative flex flex-col items-center justify-center h-full w-full py-1 min-h-[48px] touch-manipulation select-none ${
              fifthTab.isSelected || isSheetOpen
                ? 'text-[#2D4532] dark:text-[#A8D1B0]'
                : 'text-[#75706B] dark:text-[#9E9892]'
            }`}
          >
            <div className="relative">
              <div
                className={`w-14 h-7 rounded-full flex items-center justify-center transition-colors duration-150 ${
                  fifthTab.isSelected || isSheetOpen ? 'bg-[#E1EDE4] dark:bg-[#203D24]' : 'bg-transparent'
                }`}
              >
                <FifthIcon
                  className={`w-5 h-5 transition-transform duration-120 ${
                    fifthTab.isSelected || isSheetOpen ? 'stroke-[2.25] scale-105' : 'stroke-[1.75]'
                  }`}
                />
              </div>
              {!fifthTab.isSelected && (
                <span className="absolute -top-1 -right-1 px-1.5 min-w-[15px] h-4 flex items-center justify-center rounded-full text-[9px] font-bold bg-[#EAE6DF] dark:bg-[#2D2B33] text-[#75706B] dark:text-[#9E9892] ring-2 ring-[#FAF8F5] dark:ring-[#141317] tabular-nums">
                  7
                </span>
              )}
            </div>

            <span
              className={`text-[10px] tracking-tight mt-0.5 leading-tight flex items-center gap-0.5 ${
                fifthTab.isSelected || isSheetOpen
                  ? 'font-bold text-[#2D4532] dark:text-[#A8D1B0]'
                  : 'font-medium text-[#75706B] dark:text-[#9E9892]'
              }`}
            >
              {fifthTab.label}
              <span className="text-[8px] opacity-60">▾</span>
            </span>
          </button>
        </div>
      </nav>

      {/* 2. ALL PAGES MOBILE BOTTOM SHEET (iOS Drawer with Drag Handle & Snappy Exit) */}
      {(isSheetOpen || isClosing) && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="All DayOne Pages and Features"
          className="fixed inset-0 z-50 flex items-end justify-center md:hidden"
        >
          {/* Backdrop overlay */}
          <div
            onClick={handleCloseSheet}
            className={`fixed inset-0 bg-black/45 backdrop-blur-sm ${
              isClosing ? 'backdrop-exiting' : 'backdrop-entering'
            }`}
          />

          {/* Sliding sheet container */}
          <div
            className={`relative z-10 w-full max-h-[85vh] bg-[#FAF8F5] dark:bg-[#16151B] rounded-t-[28px] border-t border-[#EAE6DF] dark:border-[#2D2B33] shadow-2xl flex flex-col overflow-hidden will-change-transform ${
              isClosing ? 'sheet-exiting' : 'sheet-entering'
            }`}
            style={{
              transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
              transition: isDragging ? 'none' : 'transform 200ms var(--ease-drawer)',
            }}
          >
            {/* Native iOS Drag Handle Area */}
            <div
              className="pt-3 pb-1.5 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="w-10 h-1.5 rounded-full bg-[#D5CFCE] dark:bg-[#3D3B44]" />
            </div>

            {/* Sheet Header */}
            <div className="px-4 py-2.5 border-b border-[#EAE6DF] dark:border-[#2D2B33] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#201E1D] dark:text-[#FAF8F5] flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-[#44634B] dark:text-[#A8D1B0]" />
                  <span>All Trackers &amp; Modules</span>
                </h3>
                <p className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
                  11 Pediatric health tools &amp; care records
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseSheet}
                aria-label="Close sheet"
                className="tap-feedback w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center text-[#75706B] dark:text-[#9E9892] hover:bg-[#EAE6DF] dark:hover:bg-[#27252F] active:scale-[0.95]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Page List */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 pb-[max(env(safe-area-inset-bottom,0px),24px)] overscroll-contain">
              {sheetSections.map((section) => (
                <div key={section.category} className="space-y-1.5">
                  <h4 className="text-[10.5px] font-semibold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider px-1">
                    {section.category}
                  </h4>

                  <div className="space-y-1.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isCurrent = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            onChangeTab(item.id);
                            handleCloseSheet();
                          }}
                          className={`tap-feedback w-full flex items-center justify-between p-2.5 rounded-2xl text-left border min-h-[48px] touch-manipulation ${
                            isCurrent
                              ? 'bg-white dark:bg-[#201E26] border-[#44634B] shadow-xs ring-1 ring-[#44634B]/20'
                              : 'bg-white/80 dark:bg-[#1D1C22]/80 hover:bg-white dark:hover:bg-[#1D1C22] border-[#EAE6DF] dark:border-[#2D2B33]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                                isCurrent
                                  ? 'bg-[#E1EDE4] dark:bg-[#203D24] border-[#C5DCCE] dark:border-[#2E4733] text-[#44634B] dark:text-[#A8D1B0]'
                                  : 'bg-[#F2ECE3] dark:bg-[#26242C] border-[#EAE6DF] dark:border-[#35333C] text-[#75706B] dark:text-[#9E9892]'
                              }`}
                            >
                              <Icon className="w-4 h-4 stroke-[2]" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-semibold truncate ${
                                  isCurrent ? 'text-[#44634B] dark:text-[#A8D1B0]' : 'text-[#201E1D] dark:text-[#FAF8F5]'
                                }`}>
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <span className="text-[9.5px] px-1.5 py-0.2 rounded-full font-medium bg-[#FFF0E6] text-[#8A3510] border border-[#FCDCCB] dark:bg-[#2D1F1A] dark:text-[#F8BCA0] dark:border-[#4A322A] shrink-0">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10.5px] text-[#75706B] dark:text-[#9E9892] truncate mt-0.5">
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
                <h4 className="text-[10.5px] font-semibold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider px-1">
                  Quick Utilities
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {onOpenShusher && (
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseSheet();
                        onOpenShusher();
                      }}
                      className="tap-feedback p-2 rounded-xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] text-center flex flex-col items-center justify-center gap-1 min-h-[48px] touch-manipulation"
                    >
                      <Wind className="w-4 h-4 text-[#E2765A]" />
                      <span className="text-[10px] font-semibold text-[#201E1D] dark:text-[#FAF8F5]">Shusher</span>
                    </button>
                  )}

                  {onOpenCelebration && (
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseSheet();
                        onOpenCelebration();
                      }}
                      className="tap-feedback p-2 rounded-xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] text-center flex flex-col items-center justify-center gap-1 min-h-[48px] touch-manipulation"
                    >
                      <Sparkles className="w-4 h-4 text-[#E2765A]" />
                      <span className="text-[10px] font-semibold text-[#201E1D] dark:text-[#FAF8F5]">Birthday</span>
                    </button>
                  )}

                  {onOpenSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseSheet();
                        onOpenSettings();
                      }}
                      className="tap-feedback p-2 rounded-xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] text-center flex flex-col items-center justify-center gap-1 min-h-[48px] touch-manipulation"
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
