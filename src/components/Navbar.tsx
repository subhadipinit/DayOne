'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Moon,
  Sun,
  ShieldCheck,
  Users,
  Settings,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Check,
  Plus,
  Baby,
  Calendar,
  Menu,
  X,
  Lock,
  Heart,
  Wind,
  Download,
  Syringe,
  TrendingUp,
  Utensils,
  Award,
  Calculator,
  Stethoscope,
  Camera,
  Smile,
  LayoutGrid,
} from 'lucide-react';
import { ChildProfile } from '@/lib/types';
import { DayOneLogo } from './DayOneLogo';
import { ActiveTab } from './BottomNav';

interface NavbarProps {
  profile: ChildProfile;
  profilesList: ChildProfile[];
  onSwitchChild: (childId: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  userRole: 'parent' | 'family';
  onToggleRole: () => void;
  onOpenSettings: () => void;
  onOpenCelebration: () => void;
  currentUser: any;
  onSignOut: () => void;
  onOpenLogin: () => void;
  onOpenShusher?: () => void;
  activeTab?: ActiveTab;
  onChangeTab?: (tab: ActiveTab) => void;
}

// Calculate concise age string for header badge
function getConciseAge(dobString: string): string {
  if (!dobString) return '';
  const birth = new Date(dobString);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - birth.getTime());
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 30) {
    return `${diffDays}d`;
  }
  const months = Math.floor(diffDays / 30.4375);
  if (months < 24) {
    const remDays = Math.floor(diffDays % 30.4375);
    return remDays > 0 ? `${months}m ${remDays}d` : `${months}m`;
  }
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  return remMonths > 0 ? `${years}y ${remMonths}m` : `${years}y`;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  profilesList,
  onSwitchChild,
  isDarkMode,
  onToggleTheme,
  userRole,
  onToggleRole,
  onOpenSettings,
  onOpenCelebration,
  currentUser,
  onSignOut,
  onOpenLogin,
  onOpenShusher,
  activeTab,
  onChangeTab,
}) => {
  const [isChildMenuOpen, setIsChildMenuOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const check = () => {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://')
      );
    };
    setIsStandalone(Boolean(check()));
    const handleInstalled = () => setIsStandalone(true);
    window.addEventListener('appinstalled', handleInstalled);
    return () => window.removeEventListener('appinstalled', handleInstalled);
  }, []);

  const childMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (childMenuRef.current && !childMenuRef.current.contains(target)) {
        setIsChildMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsChildMenuOpen(false);
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const childAgeDisplay = getConciseAge(profile?.dob);
  const initial = profile?.name ? profile.name.trim().charAt(0).toUpperCase() : 'B';

  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur-md bg-[#FAF8F5]/94 dark:bg-[#141317]/94 border-[#EAE6DF] dark:border-[#2D2B33] transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3">

        {/* Left Section: Brand & Child Profile Switcher */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">

          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5 shrink-0 select-none">
            <DayOneLogo size={34} variant="mark" />
            <div className="hidden sm:flex flex-col">
              <span className="font-bold tracking-tight text-base text-[#201E1D] dark:text-[#FAF8F5] leading-none">
                Day<span className="text-[#E2765A]">One</span>
              </span>
              <span className="text-[10px] text-[#75706B] dark:text-[#9E9892] font-medium tracking-tight mt-0.5">
                Care & Health Log
              </span>
            </div>
          </div>

          {/* Vertical subtle divider */}
          <div className="h-6 w-[1px] bg-[#EAE6DF] dark:bg-[#2D2B33] hidden sm:block shrink-0 mx-0.5" />

          {/* Bespoke Child Profile Switcher */}
          <div className="relative" ref={childMenuRef}>
            <button
              type="button"
              onClick={() => setIsChildMenuOpen((prev) => !prev)}
              aria-expanded={isChildMenuOpen}
              aria-haspopup="true"
              className={`group flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full border transition-all duration-150 active:scale-[0.98] ${isChildMenuOpen
                ? 'bg-white dark:bg-[#1D1C22] border-[#E2765A] shadow-sm ring-2 ring-[#E2765A]/15'
                : 'bg-white/80 dark:bg-[#1D1C22]/80 hover:bg-white dark:hover:bg-[#1D1C22] border-[#EAE6DF] dark:border-[#2D2B33] hover:border-[#D5CFCE] dark:hover:border-[#3D3B44]'
                }`}
            >
              {/* Child Initial Avatar Token */}
              <div className="w-7 h-7 rounded-full bg-[#FFF0E6] dark:bg-[#2D2422] border border-[#FCDCCB] dark:border-[#543830] flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-[#8A3510] dark:text-[#F8BCA0] leading-none">
                  {initial}
                </span>
              </div>

              {/* Child Name & Age */}
              <div className="flex items-baseline gap-1.5 text-left min-w-0">
                <span className="text-xs sm:text-sm font-semibold tracking-tight text-[#201E1D] dark:text-[#FAF8F5] truncate max-w-[100px] sm:max-w-[140px]">
                  {profile?.name || 'Baby'}
                </span>
                {childAgeDisplay && (
                  <span className="text-[11px] font-medium text-[#75706B] dark:text-[#9E9892] tabular-nums shrink-0">
                    • {childAgeDisplay}
                  </span>
                )}
              </div>

              {/* Chevron icon with animated rotation */}
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#75706B] dark:text-[#9E9892] group-hover:text-[#201E1D] dark:group-hover:text-[#FAF8F5] transition-transform duration-200 shrink-0 ${isChildMenuOpen ? 'rotate-180 text-[#E2765A]' : ''
                  }`}
              />
            </button>

            {/* Custom Child Switcher Dropdown Popover */}
            {isChildMenuOpen && (
              <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-lg shadow-black/5 dark:shadow-black/40 z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">

                {/* Popover Header */}
                <div className="px-4 py-3 border-b border-[#EAE6DF] dark:border-[#2D2B33] bg-[#FAF8F5]/60 dark:bg-[#17161B]/60 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider">
                    Baby Profiles ({profilesList.length})
                  </span>
                  <span className="text-[10px] font-medium text-[#E2765A] bg-[#FFF0E6] dark:bg-[#2D2422] px-2 py-0.5 rounded-full border border-[#FCDCCB] dark:border-[#543830]">
                    Active
                  </span>
                </div>

                {/* Profiles List */}
                <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                  {profilesList.map((p) => {
                    const isSelected = p.id === profile.id;
                    const pInitial = p.name ? p.name.trim().charAt(0).toUpperCase() : 'B';
                    const pAge = getConciseAge(p.dob);

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onSwitchChild(p.id);
                          setIsChildMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors duration-150 ${isSelected
                          ? 'bg-[#FFF7F2] dark:bg-[#261E1C] text-[#201E1D] dark:text-[#FAF8F5]'
                          : 'hover:bg-[#F7F4EE] dark:hover:bg-[#232129] text-[#4D4845] dark:text-[#DDD8D0]'
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${isSelected
                            ? 'bg-[#FFF0E6] dark:bg-[#2D2422] border-[#FCDCCB] dark:border-[#543830] text-[#8A3510] dark:text-[#F8BCA0]'
                            : 'bg-[#F2ECE3] dark:bg-[#26242C] border-[#EAE6DF] dark:border-[#35333C] text-[#75706B] dark:text-[#9E9892]'
                            }`}>
                            <span className="text-xs font-bold leading-none">{pInitial}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold tracking-tight truncate">
                              {p.name} {p.nickname ? `(${p.nickname})` : ''}
                            </p>
                            <p className="text-[11px] text-[#75706B] dark:text-[#9E9892] mt-0.5">
                              {new Date(p.dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {pAge ? ` • ${pAge}` : ''}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#E2765A] text-white flex items-center justify-center shrink-0 ml-2">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Popover Footer: Add / Edit Sibling */}
                <div className="p-2 border-t border-[#EAE6DF] dark:border-[#2D2B33] bg-[#FAF8F5]/80 dark:bg-[#17161B]/80">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChildMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#8A3510] dark:text-[#F8BCA0] hover:bg-[#FFF0E6] dark:hover:bg-[#2D2422] border border-[#FCDCCB] dark:border-[#543830] transition-colors duration-150 active:scale-[0.98]"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#E2765A]" />
                    <span>Add Child / Manage Profiles</span>
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>

        {/* Right Section: Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">

          {/* PWA App Install Button */}
          {!isStandalone && (
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('dayone:trigger-pwa-install'));
              }}
              className="hidden lg:flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold text-[#E2765A] bg-[#FFF0E6] hover:bg-[#FFE5D6] dark:bg-[#332522] dark:hover:bg-[#402F2B] border border-[#FCDCCB] dark:border-[#523A34] transition-all duration-150 active:scale-[0.97]"
              title="Install DayOne to your Home Screen or Desktop"
            >
              <Download className="w-3.5 h-3.5 text-[#E2765A]" />
              <span>Install App</span>
            </button>
          )}

          {/* White Noise & Infant Shusher Button */}
          {onOpenShusher && (
            <button
              type="button"
              onClick={onOpenShusher}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold text-[#4D4845] dark:text-[#DDD8D0] hover:text-[#201E1D] dark:hover:text-white hover:bg-[#F2ECE3] dark:hover:bg-[#201E26] border border-[#EAE6DF] dark:border-[#2D2B33] transition-all duration-150 active:scale-[0.97]"
              title="Soothing Infant Shusher & White Noise"
            >
              <Wind className="w-3.5 h-3.5 text-[#E2765A]" />
              <span className="hidden sm:inline">Shusher</span>
            </button>
          )}

          {/* Milestone Summary Button (Desktop & Tablet) */}
          <button
            type="button"
            onClick={onOpenCelebration}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#4D4845] dark:text-[#DDD8D0] hover:text-[#201E1D] dark:hover:text-white hover:bg-[#F2ECE3] dark:hover:bg-[#201E26] border border-[#EAE6DF] dark:border-[#2D2B33] transition-all duration-150 active:scale-[0.97]"
            title="View Birthday & Milestone Summary"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E2765A]" />
            <span>Milestones</span>
          </button>

          {/* Role Toggle: Parent (Admin) vs Family (View) */}
          <button
            type="button"
            onClick={onToggleRole}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 active:scale-[0.97] ${userRole === 'parent'
              ? 'bg-[#FFF0E6] text-[#8A3510] border-[#FCDCCB] dark:bg-[#2D2422] dark:text-[#F8BCA0] dark:border-[#543830]'
              : 'bg-[#EDF5EE] text-[#23522A] border-[#CFE2D1] dark:bg-[#1A2E1F] dark:text-[#AECDB2] dark:border-[#2D4A33]'
              }`}
            title={`Current View: ${userRole === 'parent' ? 'Parent (Admin - Full Edit Access)' : 'Family (Read-Only Mode)'}. Click to switch.`}
          >
            {userRole === 'parent' ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-[#E2765A]" />
                <span>Parent Mode</span>
              </>
            ) : (
              <>
                <Users className="w-3.5 h-3.5 text-[#5A9663]" />
                <span>Family View</span>
              </>
            )}
          </button>

          {/* Theme Toggle (Dark / Light) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#4D4845] dark:text-[#DDD8D0] hover:text-[#201E1D] dark:hover:text-white hover:bg-[#F2ECE3] dark:hover:bg-[#201E26] border border-[#EAE6DF] dark:border-[#2D2B33] transition-all duration-150 active:scale-[0.95]"
            title={isDarkMode ? 'Switch to Gentle Cream Light Mode' : 'Switch to Midnight Dark Mode'}
            aria-label="Toggle Dark/Light Mode"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-[#F6C85F] transition-transform duration-200 rotate-0 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-[#5393CE] transition-transform duration-200 rotate-0 hover:-rotate-12" />
            )}
          </button>

          {/* Settings Button (Desktop & Tablet) */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center text-[#4D4845] dark:text-[#DDD8D0] hover:text-[#201E1D] dark:hover:text-white hover:bg-[#F2ECE3] dark:hover:bg-[#201E26] border border-[#EAE6DF] dark:border-[#2D2B33] transition-all duration-150 active:scale-[0.95]"
            title="App & Baby Settings"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Account / Auth Dropdown */}
          <div className="relative" ref={userMenuRef}>
            {currentUser ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                  className={`flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border transition-all duration-150 active:scale-[0.97] ${isUserMenuOpen
                    ? 'bg-white dark:bg-[#1D1C22] border-[#E2765A] shadow-sm'
                    : 'bg-white/80 dark:bg-[#1D1C22]/80 hover:bg-white dark:hover:bg-[#1D1C22] border-[#EAE6DF] dark:border-[#2D2B33]'
                    }`}
                  title={`Account: ${currentUser.email}`}
                >
                  <div className="w-6 h-6 rounded-lg bg-[#FAF0E8] dark:bg-[#271F1D] text-[#8A3510] dark:text-[#F8BCA0] flex items-center justify-center font-bold text-xs">
                    {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden xl:inline text-xs font-mono text-[#75706B] dark:text-[#9E9892] max-w-[100px] truncate">
                    {currentUser.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#75706B] dark:text-[#9E9892]" />
                </button>

                {/* User Account Dropdown Popover */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-lg shadow-black/5 dark:shadow-black/40 z-50 overflow-hidden p-2 space-y-1 animate-in fade-in-0 zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-[#EAE6DF] dark:border-[#2D2B33]">
                      <p className="text-[11px] text-[#75706B] dark:text-[#9E9892]">Signed in as</p>
                      <p className="text-xs font-semibold text-[#201E1D] dark:text-[#FAF8F5] truncate mt-0.5">
                        {currentUser.email}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-[#5A9663] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#5A9663]" />
                        <span>Cloud Sync Active</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#4D4845] dark:text-[#DDD8D0] hover:bg-[#F7F4EE] dark:hover:bg-[#232129] transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-[#75706B]" />
                      <span>Account & Cloud Settings</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onToggleRole();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#4D4845] dark:text-[#DDD8D0] hover:bg-[#F7F4EE] dark:hover:bg-[#232129] transition-colors"
                    >
                      {userRole === 'parent' ? (
                        <>
                          <Users className="w-3.5 h-3.5 text-[#5A9663]" />
                          <span>Switch to Family View</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-[#E2765A]" />
                          <span>Switch to Parent Mode</span>
                        </>
                      )}
                    </button>

                    <div className="border-t border-[#EAE6DF] dark:border-[#2D2B33] pt-1 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onSignOut();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#E2765A] hover:bg-[#CB6145] text-white shadow-sm transition-all duration-150 active:scale-[0.97]"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Overflow Toggle */}
          <div className="relative sm:hidden" ref={mobileMenuRef}>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Open Navigation Menu"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#4D4845] dark:text-[#DDD8D0] hover:bg-[#F2ECE3] dark:hover:bg-[#201E26] border border-[#EAE6DF] dark:border-[#2D2B33] transition-all"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* Mobile Dropdown Menu with Complete Page Navigation */}
            {isMobileMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xl shadow-black/15 z-50 p-2.5 space-y-3 animate-in fade-in-0 zoom-in-95 duration-150">
                {/* 1. All 11 Pages & Trackers */}
                <div>
                  <div className="flex items-center justify-between px-2.5 py-1 mb-1">
                    <span className="text-[11px] font-bold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider">
                      All Pages & Trackers (11)
                    </span>
                    <span className="text-[10px] text-[#E2765A] font-semibold bg-[#FFF0E6] dark:bg-[#2D2422] px-2 py-0.5 rounded-full">
                      Touch to open
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    {[
                      { id: 'vaccines' as const, label: 'Vaccine Tracker', icon: Syringe },
                      { id: 'growth' as const, label: 'WHO Growth Charts', icon: TrendingUp },
                      { id: 'daily' as const, label: 'Daily Care & Feeds', icon: Baby },
                      { id: 'tummy' as const, label: 'Tummy Time Coach', icon: Sparkles },
                      { id: 'weaning' as const, label: 'First Foods & Weaning (6M+)', icon: Utensils },
                      { id: 'milestones' as const, label: 'CDC Milestones', icon: Award },
                      { id: 'teeth' as const, label: '20-Baby-Teeth Map', icon: Smile },
                      { id: 'dose' as const, label: 'Fever & Dose Calculator', icon: Calculator },
                      { id: 'mom' as const, label: 'Mom Care & Recovery', icon: Heart },
                      { id: 'doctor' as const, label: 'Doctor Visits & Rx', icon: Stethoscope },
                      { id: 'memories' as const, label: 'Milestone Records & Photos', icon: Camera },
                    ].map((page) => {
                      const isCurrent = activeTab === page.id;
                      const PageIcon = page.icon;

                      return (
                        <button
                          key={page.id}
                          type="button"
                          onClick={() => {
                            if (onChangeTab) onChangeTab(page.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                            isCurrent
                              ? 'bg-[#FFF0E6] dark:bg-[#2D2422] text-[#8A3510] dark:text-[#F8BCA0] font-semibold border border-[#FCDCCB] dark:border-[#543830]'
                              : 'text-[#4D4845] dark:text-[#DDD8D0] hover:bg-[#F7F4EE] dark:hover:bg-[#232129]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <PageIcon className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-[#E2765A]' : 'text-[#75706B] dark:text-[#9E9892]'}`} />
                            <span className="truncate">{page.label}</span>
                          </div>
                          {isCurrent && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E2765A] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Tools & Settings Divider */}
                <div className="pt-2 border-t border-[#EAE6DF] dark:border-[#2D2B33] space-y-1">
                  <span className="text-[11px] font-bold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider px-2.5 block mb-1">
                    Utilities & Settings
                  </span>

                  {onOpenShusher && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenShusher();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#4D4845] dark:text-[#DDD8D0] hover:bg-[#F7F4EE] dark:hover:bg-[#232129]"
                    >
                      <Wind className="w-3.5 h-3.5 text-[#E2765A]" />
                      <span>Infant Shusher & White Noise</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenCelebration();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#4D4845] dark:text-[#DDD8D0] hover:bg-[#F7F4EE] dark:hover:bg-[#232129]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#E2765A]" />
                    <span>Birthday & Milestone Summary</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onToggleRole();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium hover:bg-[#F7F4EE] dark:hover:bg-[#232129]"
                  >
                    <span className="text-[#4D4845] dark:text-[#DDD8D0]">Role Mode</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      userRole === 'parent'
                        ? 'bg-[#FFF0E6] text-[#8A3510] border-[#FCDCCB]'
                        : 'bg-[#EDF5EE] text-[#23522A] border-[#CFE2D1]'
                    }`}>
                      {userRole === 'parent' ? 'Parent (Admin)' : 'Family (View)'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#4D4845] dark:text-[#DDD8D0] hover:bg-[#F7F4EE] dark:hover:bg-[#232129]"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#75706B]" />
                    <span>App & Baby Settings</span>
                  </button>

                  {!isStandalone && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        window.dispatchEvent(new CustomEvent('dayone:trigger-pwa-install'));
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#E2765A] bg-[#FFF0E6]/80 dark:bg-[#332522]/80 hover:bg-[#FFF0E6] dark:hover:bg-[#332522] border border-[#FCDCCB] dark:border-[#523A34] transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-[#E2765A]" />
                      <span>Install DayOne App</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
