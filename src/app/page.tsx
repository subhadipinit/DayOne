'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Syringe,
  TrendingUp,
  Baby,
  Stethoscope,
  Camera,
  Heart,
  Sparkles,
  ShieldAlert,
  Loader2,
  Calculator,
  Utensils,
  Award,
  Smile,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useBabyStore } from '@/lib/store';
import { Navbar } from '@/components/Navbar';
import { HeroAgeTicker } from '@/components/HeroAgeTicker';
import { LoginPage } from '@/components/LoginPage';
import { DayOneLogo } from '@/components/DayOneLogo';
import { BottomNav, ActiveTab } from '@/components/BottomNav';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { pushAllToSupabase } from '@/lib/syncService';
import { getSupabaseClient } from '@/lib/supabaseClient';

const TabLoadingSkeleton = () => (
  <div className="flex flex-col items-center justify-center p-12 text-[#75706B] dark:text-[#9E9892] rounded-3xl bg-white/60 dark:bg-[#1C1B22]/60 border border-[#EAE6DF] dark:border-[#2C2A34] animate-pulse my-4">
    <Loader2 className="w-6 h-6 animate-spin mb-2 text-primary" />
    <span className="text-xs font-medium">Loading section...</span>
  </div>
);

const VaccineTracker = dynamic(
  () => import('@/components/VaccineTracker').then((m) => m.VaccineTracker),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);
const GrowthCharts = dynamic(
  () => import('@/components/GrowthCharts').then((m) => m.GrowthCharts),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);
const DailyCareLogger = dynamic(
  () => import('@/components/DailyCareLogger').then((m) => m.DailyCareLogger),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);
const DoctorVisitVault = dynamic(
  () => import('@/components/DoctorVisitVault').then((m) => m.DoctorVisitVault),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);
const PrescriptionVault = dynamic(
  () => import('@/components/PrescriptionVault').then((m) => m.PrescriptionVault),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);
const MemoryTimeline = dynamic(
  () => import('@/components/MemoryTimeline').then((m) => m.MemoryTimeline),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);
const CelebrationModal = dynamic(
  () => import('@/components/CelebrationModal').then((m) => m.CelebrationModal),
  { ssr: false }
);
const MilestoneShareCard = dynamic(
  () => import('@/components/MilestoneShareCard').then((m) => m.MilestoneShareCard),
  { ssr: false }
);
const ProfileSettingsModal = dynamic(
  () => import('@/components/ProfileSettingsModal').then((m) => m.ProfileSettingsModal),
  { ssr: false }
);
const WhiteNoisePlayer = dynamic(
  () => import('@/components/WhiteNoisePlayer').then((m) => m.WhiteNoisePlayer),
  { ssr: false }
);
const TummyTimeCoach = dynamic(
  () => import('@/components/TummyTimeCoach').then((m) => m.TummyTimeCoach),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);
const MomCareTracker = dynamic(
  () => import('@/components/MomCareTracker').then((m) => m.MomCareTracker),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);
const TeethTracker = dynamic(
  () => import('@/components/TeethTracker').then((m) => m.TeethTracker),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);
const SolidWeaningTracker = dynamic(
  () => import('@/components/SolidWeaningTracker').then((m) => m.SolidWeaningTracker),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);
const DevelopmentalMilestones = dynamic(
  () => import('@/components/DevelopmentalMilestones').then((m) => m.DevelopmentalMilestones),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);
const MedicineDoseCalculator = dynamic(
  () => import('@/components/MedicineDoseCalculator').then((m) => m.MedicineDoseCalculator),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

export default function Home() {
  const store = useBabyStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('daily');
  const [isCelebrationOpen, setIsCelebrationOpen] = useState<boolean>(false);
  const [isShareCardOpen, setIsShareCardOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShusherOpen, setIsShusherOpen] = useState<boolean>(false);
  const tabScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active tab pill into view on desktop if needed
  useEffect(() => {
    if (!tabScrollRef.current) return;
    const activeBtn = tabScrollRef.current.querySelector<HTMLElement>(`[data-tab="${activeTab}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthChecked, setIsAuthChecked] = useState<boolean>(false);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  // Initialize Supabase Auth Listener
  useEffect(() => {
    const offlineFlag = localStorage.getItem('dayone_offline_mode');
    if (offlineFlag === 'true') {
      setIsOfflineMode(true);
    }

    const client = getSupabaseClient();
    if (!client) {
      setIsAuthChecked(true);
      return;
    }

    let hasHydrated = false;

    // Check active session safely with catch/finally
    client.auth
      .getSession()
      .then(({ data }) => {
        if (data?.session?.user) {
          setCurrentUser(data.session.user);
          setIsOfflineMode(false);
          if (!hasHydrated) {
            hasHydrated = true;
            store.hydrateFromCloud();
          }
        }
      })
      .catch((err) => {
        console.warn('[Supabase Auth] Session fetch error:', err);
      })
      .finally(() => {
        setIsAuthChecked(true);
      });

    // Listen to auth changes
    const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        setIsOfflineMode(false);
        localStorage.removeItem('dayone_offline_mode');
        if (event === 'SIGNED_IN' || (!hasHydrated && event === 'INITIAL_SESSION')) {
          hasHydrated = true;
          store.hydrateFromCloud();
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      try {
        authListener?.subscription?.unsubscribe();
      } catch (err) {
        // cleanup ignore
      }
    };
  }, []);

  const handleSignOut = async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut().catch(() => {});
    }
    setCurrentUser(null);
    setIsOfflineMode(false);
    localStorage.removeItem('dayone_offline_mode');
  };

  const handleContinueOffline = () => {
    setIsOfflineMode(true);
    localStorage.setItem('dayone_offline_mode', 'true');
  };

  if (!store.isLoaded || !isAuthChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] dark:bg-[#141317] text-[#201E1D] dark:text-[#FAF8F5]" suppressHydrationWarning>
        <div className="flex flex-col items-center gap-3" suppressHydrationWarning>
          <DayOneLogo size={40} variant="mark" />
          <p className="text-xs text-[#75706B] font-medium">Initializing DayOne records...</p>
        </div>
      </div>
    );
  }

  // If user is neither logged in nor continuing offline, show the Login Page
  if (!currentUser && !isOfflineMode) {
    return (
      <LoginPage
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsOfflineMode(false);
        }}
        onContinueOffline={handleContinueOffline}
      />
    );
  }

  const latestGrowth =
    store.growthRecords && store.growthRecords.length > 0
      ? store.growthRecords[store.growthRecords.length - 1]
      : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] dark:bg-[#141317] text-[#201E1D] dark:text-[#FAF8F5] transition-colors duration-150">

      {/* Navigation Header */}
      <Navbar
        profile={store.profile}
        profilesList={store.profilesList}
        onSwitchChild={store.switchChild}
        isDarkMode={store.isDarkMode}
        onToggleTheme={store.toggleTheme}
        userRole={store.userRole}
        onToggleRole={store.toggleUserRole}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCelebration={() => setIsCelebrationOpen(true)}
        onOpenShusher={() => setIsShusherOpen(true)}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onOpenLogin={() => {
          setIsOfflineMode(false);
          localStorage.removeItem('dayone_offline_mode');
        }}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {/* Primary Feature Tabs Switcher (Visible on Desktop & Tablet; Mobile uses Native Thumb BottomNav) */}
      <div className="hidden md:block sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:top-[calc(4rem+env(safe-area-inset-top,0px))] z-30 py-2 backdrop-blur-xl bg-[#FAF8F5]/92 dark:bg-[#141317]/92 border-b border-[#EAE6DF]/80 dark:border-[#2D2B33]/80 transition-colors shadow-2xs select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            ref={tabScrollRef}
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 overscroll-x-contain"
          >
            <button
              data-tab="daily"
              onClick={() => setActiveTab('daily')}
              className={`tap-feedback flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 select-none ${activeTab === 'daily'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
            >
              <Baby className="w-3.5 h-3.5" />
              <span>Today Dashboard</span>
            </button>

            <button
              data-tab="growth"
              onClick={() => setActiveTab('growth')}
              className={`tap-feedback flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 select-none ${activeTab === 'growth'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>WHO Growth</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${activeTab === 'growth'
                ? 'bg-white/20 text-white'
                : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                {store.growthRecords.length}
              </span>
            </button>

            <button
              data-tab="vaccines"
              onClick={() => setActiveTab('vaccines')}
              className={`tap-feedback flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 select-none ${activeTab === 'vaccines'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
            >
              <Syringe className="w-3.5 h-3.5" />
              <span>Vaccines</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${activeTab === 'vaccines'
                ? 'bg-white/20 text-white'
                : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                {store.vaccines.filter((v) => v.status === 'given').length}/{store.vaccines.length}
              </span>
            </button>

            <button
              data-tab="weaning"
              onClick={() => setActiveTab('weaning')}
              className={`tap-feedback flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 select-none ${activeTab === 'weaning'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>100 Foods Weaning</span>
            </button>

            <button
              data-tab="teeth"
              onClick={() => setActiveTab('teeth')}
              className={`tap-feedback flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 select-none ${activeTab === 'teeth'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
            >
              <Smile className="w-3.5 h-3.5" />
              <span>Baby Teeth</span>
            </button>

            <button
              data-tab="milestones"
              onClick={() => setActiveTab('milestones')}
              className={`tap-feedback flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 select-none ${activeTab === 'milestones'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>CDC Milestones</span>
            </button>

            <button
              data-tab="tummy"
              onClick={() => setActiveTab('tummy')}
              className={`tap-feedback flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 select-none ${activeTab === 'tummy'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tummy Time</span>
            </button>

            <button
              data-tab="dose"
              onClick={() => setActiveTab('dose')}
              className={`tap-feedback flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 select-none ${activeTab === 'dose'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Fever &amp; Dose</span>
            </button>

            <button
              data-tab="doctor"
              onClick={() => setActiveTab('doctor')}
              className={`tap-feedback flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 select-none ${activeTab === 'doctor'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor Visit &amp; Rx</span>
            </button>

            <button
              data-tab="mom"
              onClick={() => setActiveTab('mom')}
              className={`tap-feedback flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 select-none ${activeTab === 'mom'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
              <span>Mom Care</span>
            </button>

            <button
              data-tab="memories"
              onClick={() => setActiveTab('memories')}
              className={`tap-feedback flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 select-none ${activeTab === 'memories'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scrapbook</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${activeTab === 'memories'
                ? 'bg-white/20 text-white'
                : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                {store.memories.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 space-y-3.5 sm:space-y-5 pb-8 md:pb-6">

        {/* Hero Banner with Precision Age Counter & Celebration Alert */}
        <HeroAgeTicker
          profile={store.profile}
          latestGrowth={latestGrowth}
          onOpenShareCard={() => setIsShareCardOpen(true)}
          onOpenCelebration={() => setIsCelebrationOpen(true)}
        />

        {/* Tab 1: Vaccines */}
        {activeTab === 'vaccines' && (
          <ErrorBoundary fallbackTitle="Could not load Vaccine Tracker">
            <VaccineTracker
              key={store.profile.id}
              vaccines={store.vaccines}
              onUpdateVaccine={store.updateVaccine}
              userRole={store.userRole}
            />
          </ErrorBoundary>
        )}

        {/* Tab 2: Growth Charts */}
        {activeTab === 'growth' && (
          <ErrorBoundary fallbackTitle="Could not load WHO Growth Charts">
            <GrowthCharts
              key={store.profile.id}
              growthRecords={store.growthRecords}
              profile={store.profile}
              onAddGrowthRecord={store.addGrowthRecord}
              onDeleteGrowthRecord={store.deleteGrowthRecord}
              userRole={store.userRole}
            />
          </ErrorBoundary>
        )}

        {/* Tab 3: Daily Care & Feeds */}
        {activeTab === 'daily' && (
          <ErrorBoundary fallbackTitle="Could not load Daily Care Logger">
            <DailyCareLogger
              key={store.profile.id}
              childId={store.profile.id}
              feedingLogs={store.feedingLogs}
              diaperLogs={store.diaperLogs}
              sleepLogs={store.sleepLogs}
              onAddFeedingLog={store.addFeedingLog}
              onDeleteFeedingLog={store.deleteFeedingLog}
              onAddDiaperLog={store.addDiaperLog}
              onDeleteDiaperLog={store.deleteDiaperLog}
              onAddSleepLog={store.addSleepLog}
              onDeleteSleepLog={store.deleteSleepLog}
              userRole={store.userRole}
              onOpenShusher={() => setIsShusherOpen(true)}
              onNavigateTab={setActiveTab}
            />
          </ErrorBoundary>
        )}

        {/* Tab: Tummy Time Coach & Sensory Play */}
        {activeTab === 'tummy' && (
          <ErrorBoundary fallbackTitle="Could not load Tummy Time Coach">
            <TummyTimeCoach
              key={store.profile.id}
              profile={store.profile}
              userRole={store.userRole}
            />
          </ErrorBoundary>
        )}

        {/* Tab: First Foods & Solid Weaning Diary */}
        {activeTab === 'weaning' && (
          <ErrorBoundary fallbackTitle="Could not load Solid Weaning Tracker">
            <SolidWeaningTracker
              key={store.profile.id}
              profile={store.profile}
              userRole={store.userRole}
            />
          </ErrorBoundary>
        )}

        {/* Tab: CDC & IAP Developmental Milestones */}
        {activeTab === 'milestones' && (
          <ErrorBoundary fallbackTitle="Could not load Developmental Milestones">
            <DevelopmentalMilestones
              key={store.profile.id}
              profile={store.profile}
              userRole={store.userRole}
            />
          </ErrorBoundary>
        )}

        {/* Tab: 20-Baby-Teeth Eruption Map */}
        {activeTab === 'teeth' && (
          <ErrorBoundary fallbackTitle="Could not load Baby Teeth Tracker">
            <TeethTracker
              key={store.profile.id}
              profile={store.profile}
              userRole={store.userRole}
            />
          </ErrorBoundary>
        )}

        {/* Tab: Pediatric Fever & Weight-Based Dose Calculator */}
        {activeTab === 'dose' && (
          <ErrorBoundary fallbackTitle="Could not load Medicine Dose Calculator">
            <MedicineDoseCalculator
              key={store.profile.id}
              profile={store.profile}
              latestGrowth={latestGrowth}
              userRole={store.userRole}
              onNavigateTab={setActiveTab}
            />
          </ErrorBoundary>
        )}

        {/* Tab: Maternal Recovery & Care */}
        {activeTab === 'mom' && (
          <ErrorBoundary fallbackTitle="Could not load Mom Care Tracker">
            <MomCareTracker
              key={store.profile.id}
              profile={store.profile}
              userRole={store.userRole}
            />
          </ErrorBoundary>
        )}

        {/* Tab 4: Doctor Visits & Prescriptions */}
        {activeTab === 'doctor' && (
          <ErrorBoundary fallbackTitle="Could not load Doctor Visit & Prescriptions">
            <div className="space-y-8">
              <DoctorVisitVault
                key={`dv_${store.profile.id}`}
                profile={store.profile}
                growthRecords={store.growthRecords}
                vaccines={store.vaccines}
                questions={store.questions}
                symptoms={store.symptoms}
                onAddQuestion={store.addDoctorQuestion}
                onToggleQuestion={store.toggleDoctorQuestion}
                onDeleteQuestion={store.deleteDoctorQuestion}
                onAddSymptom={store.addSymptom}
                onDeleteSymptom={store.deleteSymptom}
                userRole={store.userRole}
                onNavigateTab={setActiveTab}
              />
              <PrescriptionVault
                key={`rx_${store.profile.id}`}
                childId={store.profile.id}
                prescriptions={store.prescriptions}
                onAddPrescription={store.addPrescription}
                onDeletePrescription={store.deletePrescription}
                userRole={store.userRole}
              />
            </div>
          </ErrorBoundary>
        )}

        {/* Tab 5: Memories & Milestones */}
        {activeTab === 'memories' && (
          <ErrorBoundary fallbackTitle="Could not load Memory Scrapbook">
            <MemoryTimeline
              key={store.profile.id}
              profile={store.profile}
              memories={store.memories}
              onAddMemory={store.addMemory}
              onDeleteMemory={store.deleteMemory}
              onToggleFavorite={store.toggleFavoriteMemory}
              userRole={store.userRole}
            />
          </ErrorBoundary>
        )}

      </main>

      {/* Gentle Footer */}
      <footer className="border-t border-[#EAE6DF] dark:border-[#2D2B33] py-5 text-center text-xs text-[#75706B] dark:text-[#9E9892] mb-[calc(4rem+max(env(safe-area-inset-bottom,0px),8px))] md:mb-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-[#E2765A] fill-current" />
            <span className="font-semibold text-[#201E1D] dark:text-[#FAF8F5]">DayOne</span>
            <span>• Gentle pediatric tracking & milestones</span>
          </div>
          <div className="flex items-center gap-3 text-[#75706B] dark:text-[#9E9892]">
            <span>{currentUser ? `Connected: ${currentUser.email}` : 'Local Device Mode'}</span>
            <span>•</span>
            <span>WHO Growth & IAP Standards</span>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (Touch-First & Thumb-Zone) */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        vaccinesDueCount={store.vaccines.filter((v) => v.status === 'upcoming' || v.status === 'overdue').length}
        growthCount={store.growthRecords.length}
        memoriesCount={store.memories.length}
        onOpenShusher={() => setIsShusherOpen(true)}
        onOpenCelebration={() => setIsCelebrationOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* MODALS */}
      <CelebrationModal
        isOpen={isCelebrationOpen}
        onClose={() => setIsCelebrationOpen(false)}
        profile={store.profile}
        latestGrowth={latestGrowth}
        onOpenShareCard={() => {
          setIsCelebrationOpen(false);
          setIsShareCardOpen(true);
        }}
      />

      <MilestoneShareCard
        isOpen={isShareCardOpen}
        onClose={() => setIsShareCardOpen(false)}
        profile={store.profile}
        latestGrowth={latestGrowth}
      />

      {/* Offline White Noise & Infant Shusher */}
      <WhiteNoisePlayer
        isOpen={isShusherOpen}
        onClose={() => setIsShusherOpen(false)}
      />

      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={store.profile}
        profilesList={store.profilesList}
        onUpdateProfile={store.updateProfile}
        onAddChild={store.addChildProfile}
        supabaseConfig={store.supabaseConfig}
        onUpdateSupabaseConfig={store.updateSupabaseConfig}
        onResetDemo={store.resetToDemoData}
        onSyncToCloud={async () => {
          let medicineLogs: any[] = [];
          let weaningFoods: any[] = [];
          let teethRecords: any[] = [];
          let milestones: any[] = [];
          let momCareLogs: any[] = [];
          let tummyTimeSessions: any[] = [];

          if (typeof window !== 'undefined') {
            try {
              const medRaw = localStorage.getItem(`dayone_med_history_${store.profile.id}`);
              if (medRaw) medicineLogs = JSON.parse(medRaw);

              const foodRaw = localStorage.getItem(`dayone_foods_${store.profile.id}`);
              if (foodRaw) weaningFoods = JSON.parse(foodRaw);

              const teethRaw = localStorage.getItem(`dayone_teeth_${store.profile.id}`);
              if (teethRaw) {
                const parsed = JSON.parse(teethRaw);
                teethRecords = Array.isArray(parsed) ? parsed : Object.values(parsed);
              }

              const msRaw = localStorage.getItem(`dayone_milestones_${store.profile.id}`);
              if (msRaw) {
                const parsed = JSON.parse(msRaw);
                if (Array.isArray(parsed)) {
                  milestones = parsed;
                } else if (typeof parsed === 'object' && parsed !== null) {
                  milestones = Object.entries(parsed).map(([key, val]) => ({
                    id: `${store.profile.id}_${key}`,
                    childId: store.profile.id,
                    milestoneKey: key,
                    isAchieved: Boolean(val),
                    achievedDate: val ? new Date().toISOString().split('T')[0] : undefined,
                  }));
                }
              }

              const ttRaw =
                localStorage.getItem(`dayone_tummy_sessions_${store.profile.id}`) ||
                localStorage.getItem('dayone_tummy_sessions');
              if (ttRaw) tummyTimeSessions = JSON.parse(ttRaw);

              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('dayone_mom_log_')) {
                  const val = localStorage.getItem(key);
                  if (val) momCareLogs.push(JSON.parse(val));
                }
              }
            } catch (e) {
              console.warn('[Sync] Could not read extra module data:', e);
            }
          }

          return await pushAllToSupabase({
            profile: store.profile,
            profilesList: store.profilesList,
            vaccines: store.vaccines,
            growthRecords: store.growthRecords,
            feedingLogs: store.feedingLogs,
            diaperLogs: store.diaperLogs,
            sleepLogs: store.sleepLogs,
            questions: store.questions,
            symptoms: store.symptoms,
            prescriptions: store.prescriptions,
            memories: store.memories,
            medicineLogs,
            weaningFoods,
            teethRecords,
            milestones,
            momCareLogs,
            tummyTimeSessions,
          });
        }}
      />

      {/* PWA Install Banner & iOS Instructions Modal */}
      <PwaInstallPrompt />

    </div>
  );
}
