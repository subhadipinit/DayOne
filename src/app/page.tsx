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
} from 'lucide-react';
import { useBabyStore } from '@/lib/store';
import { Navbar } from '@/components/Navbar';
import { HeroAgeTicker } from '@/components/HeroAgeTicker';
import { VaccineTracker } from '@/components/VaccineTracker';
import { GrowthCharts } from '@/components/GrowthCharts';
import { DailyCareLogger } from '@/components/DailyCareLogger';
import { DoctorVisitVault } from '@/components/DoctorVisitVault';
import { PrescriptionVault } from '@/components/PrescriptionVault';
import { MemoryTimeline } from '@/components/MemoryTimeline';
import { CelebrationModal } from '@/components/CelebrationModal';
import { MilestoneShareCard } from '@/components/MilestoneShareCard';
import { ProfileSettingsModal } from '@/components/ProfileSettingsModal';
import { WhiteNoisePlayer } from '@/components/WhiteNoisePlayer';
import { TummyTimeCoach } from '@/components/TummyTimeCoach';
import { MomCareTracker } from '@/components/MomCareTracker';
import { TeethTracker } from '@/components/TeethTracker';
import { SolidWeaningTracker } from '@/components/SolidWeaningTracker';
import { DevelopmentalMilestones } from '@/components/DevelopmentalMilestones';
import { MedicineDoseCalculator } from '@/components/MedicineDoseCalculator';
import { LoginPage } from '@/components/LoginPage';
import { DayOneLogo } from '@/components/DayOneLogo';
import { BottomNav, ActiveTab } from '@/components/BottomNav';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
import { pushAllToSupabase } from '@/lib/syncService';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function Home() {
  const store = useBabyStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('daily');
  const [isCelebrationOpen, setIsCelebrationOpen] = useState<boolean>(false);
  const [isShareCardOpen, setIsShareCardOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShusherOpen, setIsShusherOpen] = useState<boolean>(false);
  const tabScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active tab pill into view on mobile and desktop
  useEffect(() => {
    if (!tabScrollRef.current) return;
    const activeBtn = tabScrollRef.current.querySelector<HTMLElement>(`[data-tab="${activeTab}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
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

    // Check active session
    client.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        setCurrentUser(data.session.user);
        setIsOfflineMode(false);
        store.hydrateFromCloud();
      }
      setIsAuthChecked(true);
    });

    // Listen to auth changes
    const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        setIsOfflineMode(false);
        localStorage.removeItem('dayone_offline_mode');
        store.hydrateFromCloud();
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
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

  const latestGrowth = store.growthRecords[store.growthRecords.length - 1];

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

      {/* Primary Feature Tabs Switcher (Visible on Mobile, Tablet & Desktop) */}
      <div className="sticky top-14 sm:top-16 z-30 py-1.5 sm:py-2.5 backdrop-blur-md bg-[#FAF8F5]/96 dark:bg-[#141317]/96 border-b border-[#EAE6DF] dark:border-[#2D2B33] transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div
            ref={tabScrollRef}
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 scroll-smooth overscroll-x-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <button
              data-tab="daily"
              onClick={() => setActiveTab('daily')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 active:scale-95 select-none ${activeTab === 'daily'
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 active:scale-95 select-none ${activeTab === 'growth'
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
              data-tab="weaning"
              onClick={() => setActiveTab('weaning')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 active:scale-95 select-none ${activeTab === 'weaning'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>100 Foods Weaning</span>
            </button>

            <button
              data-tab="vaccines"
              onClick={() => setActiveTab('vaccines')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 active:scale-95 select-none ${activeTab === 'vaccines'
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
              data-tab="teeth"
              onClick={() => setActiveTab('teeth')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 active:scale-95 select-none ${activeTab === 'teeth'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
            >
              <span>🦷</span>
              <span>Baby Teeth</span>
            </button>

            <button
              data-tab="milestones"
              onClick={() => setActiveTab('milestones')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 active:scale-95 select-none ${activeTab === 'milestones'
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 active:scale-95 select-none ${activeTab === 'tummy'
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 active:scale-95 select-none ${activeTab === 'dose'
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 active:scale-95 select-none ${activeTab === 'doctor'
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 active:scale-95 select-none ${activeTab === 'mom'
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 active:scale-95 select-none ${activeTab === 'memories'
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 space-y-3.5 sm:space-y-5 pb-24 md:pb-6">

        {/* Hero Banner with Precision Age Counter & Celebration Alert */}
        <HeroAgeTicker
          profile={store.profile}
          latestGrowth={latestGrowth}
          onOpenShareCard={() => setIsShareCardOpen(true)}
          onOpenCelebration={() => setIsCelebrationOpen(true)}
        />

        {/* Tab 1: Vaccines */}
        {activeTab === 'vaccines' && (
          <VaccineTracker
            vaccines={store.vaccines}
            onUpdateVaccine={store.updateVaccine}
            userRole={store.userRole}
          />
        )}

        {/* Tab 2: Growth Charts */}
        {activeTab === 'growth' && (
          <GrowthCharts
            growthRecords={store.growthRecords}
            profile={store.profile}
            onAddGrowthRecord={store.addGrowthRecord}
            onDeleteGrowthRecord={store.deleteGrowthRecord}
            userRole={store.userRole}
          />
        )}

        {/* Tab 3: Daily Care & Feeds */}
        {activeTab === 'daily' && (
          <DailyCareLogger
            childId={store.profile.id}
            feedingLogs={store.feedingLogs}
            diaperLogs={store.diaperLogs}
            sleepLogs={store.sleepLogs}
            onAddFeedingLog={store.addFeedingLog}
            onDeleteFeedingLog={store.deleteFeedingLog}
            onAddDiaperLog={store.addDiaperLog}
            onDeleteDiaperLog={store.deleteDiaperLog}
            onAddSleepLog={store.addSleepLog}
            userRole={store.userRole}
            onOpenShusher={() => setIsShusherOpen(true)}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* Tab: Tummy Time Coach & Sensory Play */}
        {activeTab === 'tummy' && (
          <TummyTimeCoach
            profile={store.profile}
            userRole={store.userRole}
          />
        )}

        {/* Tab: First Foods & Solid Weaning Diary */}
        {activeTab === 'weaning' && (
          <SolidWeaningTracker
            profile={store.profile}
            userRole={store.userRole}
          />
        )}

        {/* Tab: CDC & IAP Developmental Milestones */}
        {activeTab === 'milestones' && (
          <DevelopmentalMilestones
            profile={store.profile}
            userRole={store.userRole}
          />
        )}

        {/* Tab: 20-Baby-Teeth Eruption Map */}
        {activeTab === 'teeth' && (
          <TeethTracker
            profile={store.profile}
            userRole={store.userRole}
          />
        )}

        {/* Tab: Pediatric Fever & Weight-Based Dose Calculator */}
        {activeTab === 'dose' && (
          <MedicineDoseCalculator
            profile={store.profile}
            latestGrowth={latestGrowth}
            userRole={store.userRole}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* Tab: Maternal Recovery & Care */}
        {activeTab === 'mom' && (
          <MomCareTracker
            profile={store.profile}
            userRole={store.userRole}
          />
        )}

        {/* Tab 4: Doctor Visits & Prescriptions */}
        {activeTab === 'doctor' && (
          <div className="space-y-8">
            <DoctorVisitVault
              profile={store.profile}
              growthRecords={store.growthRecords}
              vaccines={store.vaccines}
              questions={store.questions}
              symptoms={store.symptoms}
              onAddQuestion={store.addDoctorQuestion}
              onToggleQuestion={store.toggleDoctorQuestion}
              onDeleteQuestion={store.deleteDoctorQuestion}
              onAddSymptom={store.addSymptom}
              userRole={store.userRole}
              onNavigateTab={setActiveTab}
            />
            <PrescriptionVault
              childId={store.profile.id}
              prescriptions={store.prescriptions}
              onAddPrescription={store.addPrescription}
              onDeletePrescription={store.deletePrescription}
              userRole={store.userRole}
            />
          </div>
        )}

        {/* Tab 5: Memories & Milestones */}
        {activeTab === 'memories' && (
          <MemoryTimeline
            profile={store.profile}
            memories={store.memories}
            onAddMemory={store.addMemory}
            onDeleteMemory={store.deleteMemory}
            onToggleFavorite={store.toggleFavoriteMemory}
            userRole={store.userRole}
          />
        )}

      </main>

      {/* Gentle Footer */}
      <footer className="border-t border-[#EAE6DF] dark:border-[#2D2B33] py-5 text-center text-xs text-[#75706B] dark:text-[#9E9892] mb-16 md:mb-0">
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
              if (teethRaw) teethRecords = JSON.parse(teethRaw);

              const msRaw = localStorage.getItem(`dayone_milestones_${store.profile.id}`);
              if (msRaw) milestones = JSON.parse(msRaw);

              const ttRaw = localStorage.getItem('dayone_tummy_sessions');
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
