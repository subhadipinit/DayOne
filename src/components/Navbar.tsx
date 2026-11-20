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
  Wind,
  Download,
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
}) => {
  const [isChildMenuOpen, setIsChildMenuOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
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
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsChildMenuOpen(false);
        setIsUserMenuOpen(false);
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
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur-xl bg-[#FAF8F5]/92 dark:bg-[#141317]/92 border-[#EAE6DF]/80 dark:border-[#2D2B33]/80 transition-colors duration-150 select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">

        {/* Left Section: Brand & Child Profile Switcher */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">

          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 shrink-0">
            <DayOneLogo size={32} variant="mark" />
            <div className="hidden sm:flex flex-col">
              <span className="font-bold tracking-tight text-sm text-[#201E1D] dark:text-[#FAF8F5] leading-none">
                Day<span className="text-[#E2765A]">One</span>
              </span>
              <span className="text-[10px] text-[#75706B] dark:text-[#9E9892] font-medium tracking-tight mt-0.5">
                Care &amp; Health Log
              </span>
            </div>
          </div>

          {/* Vertical subtle divider on desktop */}
          <div className="h-5 w-[1px] bg-[#EAE6DF] dark:bg-[#2D2B33] hidden sm:block shrink-0 mx-0.5" />

          {/* Bespoke Child Profile Switcher */}
          <div className="relative" ref={childMenuRef}>
            <button
              type="button"
              onClick={() => setIsChildMenuOpen((prev) => !prev)}
              aria-expanded={isChildMenuOpen}
              aria-haspopup="true"
              className={`tap-feedback flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border transition-colors ${
                isChildMenuOpen
                  ? 'bg-white dark:bg-[#1D1C22] border-[#44634B] shadow-xs ring-1 ring-[#44634B]/20'
                  : 'bg-white/80 dark:bg-[#1D1C22]/80 hover:bg-white dark:hover:bg-[#1D1C22] border-[#EAE6DF] dark:border-[#2D2B33]'
              }`}
            >
              {/* Child Initial Avatar Token */}
              <div className="w-6 h-6 rounded-full bg-[#E1EDE4] dark:bg-[#203D24] border border-[#C5DCCE] dark:border-[#2E4733] flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-[#344738] dark:text-[#A8D1B0] leading-none">
                  {initial}
                </span>
              </div>

              {/* Child Name & Age */}
              <div className="flex items-baseline gap-1 text-left min-w-0">
                <span className="text-xs sm:text-sm font-semibold tracking-tight text-[#201E1D] dark:text-[#FAF8F5] truncate max-w-[90px] sm:max-w-[140px]">
                  {profile?.name || 'Baby'}
                </span>
                {childAgeDisplay && (
                  <span className="text-[10.5px] font-medium text-[#75706B] dark:text-[#9E9892] tabular-nums shrink-0">
                    • {childAgeDisplay}
                  </span>
                )}
              </div>

              {/* Chevron icon */}
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#75706B] dark:text-[#9E9892] transition-transform duration-150 shrink-0 ${
                  isChildMenuOpen ? 'rotate-180 text-[#44634B]' : ''
                }`}
              />
            </button>

            {/* Custom Child Switcher Dropdown Popover */}
            {isChildMenuOpen && (
              <div
                className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xl shadow-black/8 z-50 overflow-hidden animate-reveal"
                style={{ transformOrigin: 'top left' }}
              >
                {/* Popover Header */}
                <div className="px-3.5 py-2.5 border-b border-[#EAE6DF] dark:border-[#2D2B33] bg-[#FAF8F5]/60 dark:bg-[#17161B]/60 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider">
                    Baby Profiles ({profilesList.length})
                  </span>
                  <span className="text-[10px] font-semibold text-[#44634B] bg-[#E1EDE4] dark:bg-[#203D24] dark:text-[#A8D1B0] px-2 py-0.5 rounded-full border border-[#C5DCCE] dark:border-[#2E4733]">
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
                        className={`tap-feedback w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors duration-120 ${
                          isSelected
                            ? 'bg-[#F2F7F3] dark:bg-[#1C281E] text-[#201E1D] dark:text-[#FAF8F5]'
                            : 'hover:bg-[#F7F4EE] dark:hover:bg-[#232129] text-[#4D4845] dark:text-[#DDD8D0]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? 'bg-[#E1EDE4] dark:bg-[#203D24] border-[#C5DCCE] dark:border-[#2E4733] text-[#344738] dark:text-[#A8D1B0]'
                                : 'bg-[#F2ECE3] dark:bg-[#26242C] border-[#EAE6DF] dark:border-[#35333C] text-[#75706B] dark:text-[#9E9892]'
                            }`}
                          >
                            <span className="text-[11px] font-bold leading-none">{pInitial}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold tracking-tight truncate">
                              {p.name} {p.nickname ? `(${p.nickname})` : ''}
                            </p>
                            <p className="text-[10.5px] text-[#75706B] dark:text-[#9E9892]">
                              {new Date(p.dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {pAge ? ` • ${pAge}` : ''}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-[#44634B] text-white flex items-center justify-center shrink-0 ml-2">
                            <Check className="w-2.5 h-2.5 stroke-[2.5]" />
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
                    className="tap-feedback w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#44634B] dark:text-[#A8D1B0] hover:bg-[#E1EDE4] dark:hover:bg-[#203D24] border border-[#C5DCCE] dark:border-[#2E4733]"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#44634B]" />
                    <span>Manage Profiles</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2">

          {/* PWA App Install Button (Desktop & Tablet) */}
          {!isStandalone && (
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('dayone:trigger-pwa-install'));
              }}
              className="tap-feedback hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#E2765A] bg-[#FFF0E6] hover:bg-[#FFE5D6] dark:bg-[#332522] dark:hover:bg-[#402F2B] border border-[#FCDCCB] dark:border-[#523A34]"
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
              className="tap-feedback flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#4D4845] dark:text-[#DDD8D0] hover:bg-[#F2ECE3] dark:hover:bg-[#201E26] border border-[#EAE6DF] dark:border-[#2D2B33]"
              title="Soothing Infant Shusher &amp; White Noise"
            >
              <Wind className="w-3.5 h-3.5 text-[#E2765A]" />
              <span className="hidden sm:inline">Shusher</span>
            </button>
          )}

          {/* Milestone Summary Button (Desktop & Tablet) */}
          <button
            type="button"
            onClick={onOpenCelebration}
            className="tap-feedback hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#4D4845] dark:text-[#DDD8D0] hover:bg-[#F2ECE3] dark:hover:bg-[#201E26] border border-[#EAE6DF] dark:border-[#2D2B33]"
            title="View Birthday &amp; Milestone Summary"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E2765A]" />
            <span>Milestones</span>
          </button>

          {/* Role Toggle: Parent (Admin) vs Family (View) (Desktop only) */}
          <button
            type="button"
            onClick={onToggleRole}
            className={`tap-feedback hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${
              userRole === 'parent'
                ? 'bg-[#FFF0E6] text-[#8A3510] border-[#FCDCCB] dark:bg-[#2D2422] dark:text-[#F8BCA0] dark:border-[#543830]'
                : 'bg-[#EDF5EE] text-[#23522A] border-[#CFE2D1] dark:bg-[#1A2E1F] dark:text-[#AECDB2] dark:border-[#2D4A33]'
            }`}
            title={`Current View: ${userRole === 'parent' ? 'Parent (Admin - Full Edit Access)' : 'Family (Read-Only Mode)'}`}
          >
            {userRole === 'parent' ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-[#E2765A]" />
                <span>Parent</span>
              </>
            ) : (
              <>
                <Users className="w-3.5 h-3.5 text-[#5A9663]" />
                <span>Family</span>
              </>
            )}
          </button>

          {/* Theme Toggle (Dark / Light) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="tap-feedback w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-[#4D4845] dark:text-[#DDD8D0] hover:bg-[#F2ECE3] dark:hover:bg-[#201E26] border border-[#EAE6DF] dark:border-[#2D2B33]"
            title={isDarkMode ? 'Switch to Gentle Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-[#F6C85F]" />
            ) : (
              <Moon className="w-4 h-4 text-[#5393CE]" />
            )}
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="tap-feedback w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-[#4D4845] dark:text-[#DDD8D0] hover:bg-[#F2ECE3] dark:hover:bg-[#201E26] border border-[#EAE6DF] dark:border-[#2D2B33]"
            title="App &amp; Baby Settings"
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
                  className={`tap-feedback flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-xl border ${
                    isUserMenuOpen
                      ? 'bg-white dark:bg-[#1D1C22] border-[#E2765A] shadow-xs'
                      : 'bg-white/80 dark:bg-[#1D1C22]/80 hover:bg-white dark:hover:bg-[#1D1C22] border-[#EAE6DF] dark:border-[#2D2B33]'
                  }`}
                  title={`Account: ${currentUser.email}`}
                >
                  <div className="w-5 h-5 rounded-lg bg-[#FAF0E8] dark:bg-[#271F1D] text-[#8A3510] dark:text-[#F8BCA0] flex items-center justify-center font-bold text-[11px]">
                    {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <ChevronDown className="w-3 h-3 text-[#75706B] dark:text-[#9E9892]" />
                </button>

                {/* User Account Dropdown Popover */}
                {isUserMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xl shadow-black/8 z-50 overflow-hidden p-2 space-y-1 animate-reveal"
                    style={{ transformOrigin: 'top right' }}
                  >
                    <div className="px-3 py-2 border-b border-[#EAE6DF] dark:border-[#2D2B33]">
                      <p className="text-[10.5px] text-[#75706B] dark:text-[#9E9892]">Signed in as</p>
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
                      className="tap-feedback w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#4D4845] dark:text-[#DDD8D0] hover:bg-[#F7F4EE] dark:hover:bg-[#232129]"
                    >
                      <Settings className="w-3.5 h-3.5 text-[#75706B]" />
                      <span>Account &amp; Settings</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onToggleRole();
                      }}
                      className="tap-feedback w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#4D4845] dark:text-[#DDD8D0] hover:bg-[#F7F4EE] dark:hover:bg-[#232129]"
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
                        className="tap-feedback w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
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
                className="tap-feedback flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#E2765A] hover:bg-[#CB6145] text-white shadow-xs"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
