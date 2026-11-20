'use client';

import React, { useState, useEffect } from 'react';
import {
  Baby,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Moon,
  Trash2,
  Droplets,
  Milk,
  CheckCircle,
  Sparkles,
  Calendar,
  ChevronRight,
  ArrowRight,
  Timer,
  Check,
  X,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { FeedingLog, DiaperLog, SleepLog } from '@/lib/types';
import { ActiveTab } from './BottomNav';

interface DailyCareLoggerProps {
  childId: string;
  feedingLogs: FeedingLog[];
  diaperLogs: DiaperLog[];
  sleepLogs: SleepLog[];
  onAddFeedingLog: (log: Omit<FeedingLog, 'id'>) => void;
  onDeleteFeedingLog: (id: string) => void;
  onAddDiaperLog: (log: Omit<DiaperLog, 'id'>) => void;
  onDeleteDiaperLog: (id: string) => void;
  onAddSleepLog: (log: Omit<SleepLog, 'id'>) => void;
  userRole: 'parent' | 'family';
  onOpenShusher?: () => void;
  onNavigateTab?: (tab: ActiveTab) => void;
}

export const DailyCareLogger: React.FC<DailyCareLoggerProps> = ({
  childId,
  feedingLogs,
  diaperLogs,
  sleepLogs,
  onAddFeedingLog,
  onDeleteFeedingLog,
  onAddDiaperLog,
  onDeleteDiaperLog,
  onAddSleepLog,
  userRole,
  onOpenShusher,
  onNavigateTab,
}) => {
  // --- TOAST STATE ---
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastIcon, setToastIcon] = useState<string>('check_circle');

  const showToast = (msg: string, icon = 'check_circle') => {
    setToastMessage(msg);
    setToastIcon(icon);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // --- BREASTFEEDING TIMER STATE ---
  const [activeSide, setActiveSide] = useState<'left' | 'right' | null>(null);
  const [leftSeconds, setLeftSeconds] = useState<number>(0);
  const [rightSeconds, setRightSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // --- MODAL DRAWER STATE ---
  const [activeModal, setActiveModal] = useState<'feeding' | 'diaper' | 'sleep' | null>(null);
  const [bottleMl, setBottleMl] = useState<string>('120');
  const [sleepMinutes, setSleepMinutes] = useState<string>('45');
  const [diaperNote, setDiaperNote] = useState<string>('');

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && activeSide) {
      interval = setInterval(() => {
        if (activeSide === 'left') {
          setLeftSeconds((prev) => prev + 1);
        } else {
          setRightSeconds((prev) => prev + 1);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, activeSide]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartTimer = (side: 'left' | 'right') => {
    setActiveSide(side);
    setIsTimerRunning(true);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setActiveSide(null);
    setLeftSeconds(0);
    setRightSeconds(0);
  };

  const handleSaveFeed = () => {
    if (leftSeconds === 0 && rightSeconds === 0) return;
    const lMins = Math.round(leftSeconds / 60);
    const rMins = Math.round(rightSeconds / 60);
    onAddFeedingLog({
      childId,
      timestamp: new Date().toISOString(),
      type: 'breast',
      leftDurationMinutes: lMins,
      rightDurationMinutes: rMins,
      notes: `Left: ${lMins}m, Right: ${rMins}m`,
    });
    showToast(`Breastfeed logged: ${lMins + rMins}m total`, 'water_drop');
    handleResetTimer();
    setActiveModal(null);
  };

  const handleSaveBottle = () => {
    if (!bottleMl) return;
    onAddFeedingLog({
      childId,
      timestamp: new Date().toISOString(),
      type: 'bottle',
      bottleAmountMl: parseInt(bottleMl),
      notes: `Bottle feed: ${bottleMl} ml`,
    });
    showToast(`Bottle feed logged: ${bottleMl} ml`, 'baby_changing_station');
    setActiveModal(null);
  };

  const handleQuickDiaper = (type: 'wet' | 'dirty' | 'both') => {
    onAddDiaperLog({
      childId,
      timestamp: new Date().toISOString(),
      type,
    });
    const label = type === 'both' ? 'Wet & Dirty' : type === 'wet' ? 'Wet' : 'Dirty';
    showToast(`${label} diaper recorded at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 'clean_hands');
    setActiveModal(null);
  };

  const handleSaveSleep = (mins = 45) => {
    onAddSleepLog({
      childId,
      startTime: new Date(Date.now() - mins * 60 * 1000).toISOString(),
      endTime: new Date().toISOString(),
      durationMinutes: mins,
      notes: `Nap: ${mins} minutes`,
    });
    showToast(`Nap session saved: ${mins} mins`, 'bedtime');
    setActiveModal(null);
  };

  // --- STATS CALCULATIONS ---
  const lastFeed = feedingLogs[feedingLogs.length - 1];
  const lastDiaper = diaperLogs[diaperLogs.length - 1];
  const lastSleep = sleepLogs[sleepLogs.length - 1];

  const wetCount = diaperLogs.filter((d) => d.type === 'wet' || d.type === 'both').length;
  const dirtyCount = diaperLogs.filter((d) => d.type === 'dirty' || d.type === 'both').length;
  const totalDiapers = diaperLogs.length;

  const totalSleepMinutes = sleepLogs.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const sleepHours = Math.floor(totalSleepMinutes / 60);
  const sleepMinsRem = totalSleepMinutes % 60;

  const getTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'None today';
    const diffMin = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60)));
    if (diffMin < 60) return `${diffMin}m ago`;
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return `${h}h ${m}m ago`;
  };

  // Combine care timeline events with normalized time
  const careTimeline = [
    ...feedingLogs.map((f) => ({ ...f, eventType: 'feed' as const, time: f.timestamp })),
    ...diaperLogs.map((d) => ({ ...d, eventType: 'diaper' as const, time: d.timestamp })),
    ...sleepLogs.map((s) => ({ ...s, eventType: 'sleep' as const, time: s.startTime })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div className="space-y-5 animate-reveal">
      
      {/* Toast Notification Pop */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 max-w-[90vw] animate-in fade-in slide-in-from-top-4">
          <div className="bg-[#2D312E]/95 text-[#EFF2ED] backdrop-blur-md px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2.5 text-xs font-semibold border border-white/10">
            <CheckCircle className="w-4 h-4 text-[#C8EBCC]" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 1. Quick Log Action Grid (Stitch UI 4-Pill Grid) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold tracking-tight text-[#191C1A] dark:text-[#FAF8F5]">
            Quick Log
          </h2>
          <span className="text-[11px] font-medium text-[#424842] dark:text-[#9E9892]">
            Tap to record
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {/* Feeding Action Button */}
          <button
            type="button"
            onClick={() => setActiveModal('feeding')}
            className="tap-feedback flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-[#FFF0E6] hover:bg-[#FFE5D6] dark:bg-[#2D1F1A] dark:hover:bg-[#382620] text-center gap-1.5 shadow-xs border border-[#FCDCCB]/60 dark:border-[#4A322A]/60 cursor-pointer min-h-[76px]"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-[#1E1614] flex items-center justify-center text-[#99462A] dark:text-[#FFB59E] shadow-xs">
              <Milk className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[#191C1A] dark:text-[#FAF8F5]">
              Feeding
            </span>
          </button>

          {/* Diaper Action Button */}
          <button
            type="button"
            onClick={() => setActiveModal('diaper')}
            className="tap-feedback flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-[#EDF5EE] hover:bg-[#E1EDE4] dark:bg-[#1A281E] dark:hover:bg-[#223528] text-center gap-1.5 shadow-xs border border-[#CFE2D1]/60 dark:border-[#2D4532]/60 cursor-pointer min-h-[76px]"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-[#141F17] flex items-center justify-center text-[#44634B] dark:text-[#ADCFB1] shadow-xs">
              <Droplets className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[#191C1A] dark:text-[#FAF8F5]">
              Diaper
            </span>
          </button>

          {/* Sleep Action Button */}
          <button
            type="button"
            onClick={() => setActiveModal('sleep')}
            className="tap-feedback flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-[#F0EEEC] hover:bg-[#E8E5E2] dark:bg-[#201F25] dark:hover:bg-[#292830] text-center gap-1.5 shadow-xs border border-[#E0DCD7]/60 dark:border-[#35333E]/60 cursor-pointer min-h-[76px]"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-[#16151B] flex items-center justify-center text-[#55505C] dark:text-[#DDD8D0] shadow-xs">
              <Moon className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[#191C1A] dark:text-[#FAF8F5]">
              Sleep
            </span>
          </button>

          {/* Tummy Time Action Button */}
          <button
            type="button"
            onClick={() => {
              if (onNavigateTab) onNavigateTab('tummy');
              else showToast('+5m added to tummy goal!', 'timer');
            }}
            className="tap-feedback flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-[#FFF6E8] hover:bg-[#FFEDD1] dark:bg-[#2C2314] dark:hover:bg-[#382C19] text-center gap-1.5 shadow-xs border border-[#F8DCB0]/60 dark:border-[#4B391D]/60 cursor-pointer min-h-[76px]"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-[#1F180E] flex items-center justify-center text-[#7C5400] dark:text-[#F8BC58] shadow-xs">
              <Timer className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[#191C1A] dark:text-[#FAF8F5]">
              Tummy
            </span>
          </button>
        </div>
      </div>

      {/* 2. Today at a Glance Bento Grid (2x2 Cards from Stitch) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold tracking-tight text-[#191C1A] dark:text-[#FAF8F5]">
            Today at a Glance
          </h2>
          <div
            onClick={() => showToast('Daily care target is 85% completed!', 'check_circle')}
            className="flex items-center gap-1 bg-[#C8EBCC] dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1] px-2.5 py-0.5 rounded-full cursor-pointer hover:opacity-90 transition-opacity"
          >
            <CheckCircle className="w-3 h-3" />
            <span className="text-[10px] font-bold">Goal 85%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Last Feed Card */}
          <div
            onClick={() => setActiveModal('feeding')}
            className="tap-feedback bg-white dark:bg-[#1E2520] p-3.5 rounded-2xl shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] flex flex-col justify-between space-y-2 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 rounded-full bg-[#FFF0E6] dark:bg-[#3E1C12] flex items-center justify-center text-[#99462A] dark:text-[#FFB59E]">
                <Milk className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-[#75706B] dark:text-[#9E9892] font-medium">
                {getTimeAgo(lastFeed?.timestamp)}
              </span>
            </div>
            <div>
              <span className="text-lg font-bold text-[#191C1A] dark:text-[#FAF8F5] block leading-tight tabular-nums">
                {lastFeed?.type === 'bottle' ? `${lastFeed.bottleAmountMl || 120} ml` : `${(lastFeed?.leftDurationMinutes || 10) + (lastFeed?.rightDurationMinutes || 8)}m`}
              </span>
              <span className="text-xs font-semibold text-[#99462A] dark:text-[#FFB59E] block">
                {lastFeed?.type === 'bottle' ? 'Bottle feed' : 'Breastmilk'}
              </span>
            </div>
            <div className="pt-1 bg-[#F1F4F0] dark:bg-[#161C17] px-2 py-1 rounded-xl flex items-center gap-1 text-[#424842] dark:text-[#A8A29E]">
              <Check className="w-3 h-3 text-[#99462A] dark:text-[#FFB59E]" />
              <span className="text-[10.5px] truncate">
                {lastFeed ? (lastFeed.notes || 'Recorded on time') : 'Tap to log first feed'}
              </span>
            </div>
          </div>

          {/* Diapers Card */}
          <div
            onClick={() => setActiveModal('diaper')}
            className="tap-feedback bg-white dark:bg-[#1E2520] p-3.5 rounded-2xl shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] flex flex-col justify-between space-y-2 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 rounded-full bg-[#EDF5EE] dark:bg-[#203D24] flex items-center justify-center text-[#44634B] dark:text-[#ADCFB1]">
                <Droplets className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-[#75706B] dark:text-[#9E9892] font-medium">
                {getTimeAgo(lastDiaper?.timestamp)}
              </span>
            </div>
            <div>
              <span className="text-lg font-bold text-[#191C1A] dark:text-[#FAF8F5] block leading-tight tabular-nums">
                {totalDiapers > 0 ? `${totalDiapers} Changed` : '0 Changed'}
              </span>
              <span className="text-xs font-semibold text-[#44634B] dark:text-[#ADCFB1] block">
                {wetCount} Wet, {dirtyCount} Dirty
              </span>
            </div>
            {/* Visual Status Dots */}
            <div className="pt-1 flex items-center gap-1.5 py-0.5 px-0.5">
              {Array.from({ length: Math.min(5, Math.max(1, totalDiapers)) }).map((_, idx) => (
                <span
                  key={idx}
                  className={`w-2 h-2 rounded-full ${
                    idx < wetCount ? 'bg-[#44634B] dark:bg-[#ADCFB1]' : 'bg-[#99462A] dark:bg-[#FE9572]'
                  }`}
                  title="Diaper Logged"
                />
              ))}
              <span className="text-[10px] text-[#424842] dark:text-[#9E9892] ml-auto font-semibold">
                {totalDiapers >= 4 ? 'Optimal' : 'Healthy'}
              </span>
            </div>
          </div>

          {/* Sleep Card */}
          <div
            onClick={() => setActiveModal('sleep')}
            className="tap-feedback bg-white dark:bg-[#1E2520] p-3.5 rounded-2xl shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] flex flex-col justify-between space-y-2 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 rounded-full bg-[#F0EEEC] dark:bg-[#262E28] flex items-center justify-center text-[#44634B] dark:text-[#ADCFB1]">
                <Moon className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-[#44634B] dark:text-[#ADCFB1] font-semibold bg-[#EDF5EE] dark:bg-[#203D24] px-1.5 py-0.5 rounded-full">
                {sleepLogs.length > 0 ? `Nap ${sleepLogs.length} done` : 'Awake'}
              </span>
            </div>
            <div>
              <span className="text-lg font-bold text-[#191C1A] dark:text-[#FAF8F5] block leading-tight tabular-nums">
                {sleepHours > 0 ? `${sleepHours}h ${sleepMinsRem}m` : `${totalSleepMinutes || 45}m`}
              </span>
              <span className="text-xs font-semibold text-[#75706B] dark:text-[#9E9892] block">
                Total Rest Today
              </span>
            </div>
            <div className="bg-[#F1F4F0] dark:bg-[#161C17] px-2 py-1 rounded-xl flex items-center justify-between text-[#424842] dark:text-[#A8A29E]">
              <span className="text-[10px]">Next window:</span>
              <span className="text-[10.5px] font-bold text-[#191C1A] dark:text-[#FAF8F5]">~1h 15m</span>
            </div>
          </div>

          {/* Tummy Time Card */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('tummy')}
            className="tap-feedback bg-white dark:bg-[#1E2520] p-3.5 rounded-2xl shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] flex flex-col justify-between space-y-2 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 rounded-full bg-[#FFF6E8] dark:bg-[#3D2C12] flex items-center justify-center text-[#7C5400] dark:text-[#F8BC58]">
                <Timer className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-[#7C5400] dark:text-[#F8BC58] font-bold">83%</span>
            </div>
            <div>
              <span className="text-lg font-bold text-[#191C1A] dark:text-[#FAF8F5] block leading-tight tabular-nums">
                25 <span className="text-xs font-normal text-[#75706B] dark:text-[#9E9892]">/ 30m</span>
              </span>
              <span className="text-xs font-semibold text-[#75706B] dark:text-[#9E9892] block">
                Tummy Goal
              </span>
            </div>
            <div className="space-y-1">
              <div className="w-full h-1.5 bg-[#E6E9E4] dark:bg-[#2D382F] rounded-full overflow-hidden">
                <div className="bg-[#7C5400] dark:bg-[#F8BC58] h-full rounded-full tummy-bar-animate w-[83%]" />
              </div>
              <div className="flex justify-between items-center text-[9.5px] text-[#75706B] dark:text-[#9E9892]">
                <span>5m left</span>
                <span className="font-semibold text-[#7C5400] dark:text-[#F8BC58]">almost there</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Alert / Upcoming Pediatrician Visit Card (Stitch Component) */}
      <div className="bg-[#FAF8F5] dark:bg-[#19221B] rounded-2xl p-4 shadow-xs border border-[#E0E3DF] dark:border-[#2D382F]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFDBD0] dark:bg-[#3E1C12] flex items-center justify-center text-[#99462A] dark:text-[#FFB59E] shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#99462A] dark:text-[#FFB59E] block">
              Upcoming Pediatrician Checkup
            </span>
            <h3 className="text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5] leading-snug mt-0.5">
              6-Month Pediatrician Checkup & Vaccines
            </h3>
            <p className="text-xs text-[#424842] dark:text-[#A8A29E] mt-0.5">
              Next Tuesday, 10:00 AM • Dr. Morrison at Westside Pediatrics
            </p>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('doctor')}
                className="inline-flex items-center gap-1.5 bg-[#44634B] hover:bg-[#344738] active:scale-[0.98] text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <span>View Details & Records</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Live Breastfeeding Stopwatch Station (Integrated Pill Design) */}
      <div className="bg-white dark:bg-[#1E2520] rounded-[24px] p-4 shadow-sm border border-[#E8E4DC] dark:border-[#2D382F]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#FFDBD0] dark:bg-[#3E1C12] flex items-center justify-center text-[#99462A] dark:text-[#FFB59E]">
              <Baby className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-xs text-[#191C1A] dark:text-[#FAF8F5]">
              Nursing Stopwatch Station
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-[#03210E] dark:text-[#ADCFB1] bg-[#C8EBCC] dark:bg-[#203D24] px-2.5 py-0.5 rounded-full">
            Dual Side
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-3">
          {/* Left Breast */}
          <div
            onClick={() => handleStartTimer('left')}
            className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
              activeSide === 'left' && isTimerRunning
                ? 'bg-[#FFDBD0]/40 dark:bg-[#3D1E16] border-[#99462A] shadow-xs'
                : 'bg-[#F7FAF5] dark:bg-[#161C17] border-[#E0E3DF] dark:border-[#2D382F]'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-[#424842] dark:text-[#9E9892] block mb-1">
              Left Side
            </span>
            <span className="text-xl font-black text-[#191C1A] dark:text-[#FAF8F5] tabular-nums">
              {formatTimer(leftSeconds)}
            </span>
            {activeSide === 'left' && isTimerRunning && (
              <span className="text-[9.5px] font-bold text-[#44634B] dark:text-[#ADCFB1] block mt-0.5 animate-pulse">
                ● Nursing active
              </span>
            )}
          </div>

          {/* Right Breast */}
          <div
            onClick={() => handleStartTimer('right')}
            className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
              activeSide === 'right' && isTimerRunning
                ? 'bg-[#FFDBD0]/40 dark:bg-[#3D1E16] border-[#99462A] shadow-xs'
                : 'bg-[#F7FAF5] dark:bg-[#161C17] border-[#E0E3DF] dark:border-[#2D382F]'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-[#424842] dark:text-[#9E9892] block mb-1">
              Right Side
            </span>
            <span className="text-xl font-black text-[#191C1A] dark:text-[#FAF8F5] tabular-nums">
              {formatTimer(rightSeconds)}
            </span>
            {activeSide === 'right' && isTimerRunning && (
              <span className="text-[9.5px] font-bold text-[#44634B] dark:text-[#ADCFB1] block mt-0.5 animate-pulse">
                ● Nursing active
              </span>
            )}
          </div>
        </div>

        {/* Stopwatch Action Controls */}
        <div className="flex gap-2">
          {isTimerRunning ? (
            <button
              type="button"
              onClick={handlePauseTimer}
              className="flex-1 py-2 rounded-full font-semibold text-xs bg-[#424842] text-white hover:bg-[#303530] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleStartTimer(activeSide || 'left')}
              className="flex-1 py-2 rounded-full font-semibold text-xs bg-[#44634B] text-white hover:bg-[#344738] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{leftSeconds > 0 || rightSeconds > 0 ? 'Resume' : 'Start Timer'}</span>
            </button>
          )}

          {(leftSeconds > 0 || rightSeconds > 0) && (
            <>
              <button
                type="button"
                onClick={handleSaveFeed}
                className="py-2 px-4 rounded-full font-semibold text-xs bg-[#99462A] hover:bg-[#762C12] text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
              <button
                type="button"
                onClick={handleResetTimer}
                className="p-2 rounded-full border border-[#E0E3DF] dark:border-[#2D382F] hover:bg-[#F1F4F0] dark:hover:bg-[#1E2520] text-[#424842] dark:text-[#9E9892] transition-colors cursor-pointer"
                title="Reset Stopwatch"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 5. Recent Activity Feed Timeline (Matching Stitch code.html) */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold tracking-tight text-[#191C1A] dark:text-[#FAF8F5]">
            Recent Activity
          </h2>
          <span className="text-[11px] font-semibold text-[#44634B] dark:text-[#ADCFB1]">
            {careTimeline.length} events logged
          </span>
        </div>

        {careTimeline.length === 0 ? (
          <div className="bg-white dark:bg-[#1E2520] rounded-[24px] p-6 text-center border border-[#E8E4DC] dark:border-[#2D382F] space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#C8EBCC] dark:bg-[#203D24] text-[#44634B] dark:text-[#ADCFB1] flex items-center justify-center mx-auto">
              <Baby className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-[#191C1A] dark:text-[#FAF8F5]">
              No care events recorded yet today
            </p>
            <p className="text-[11px] text-[#424842] dark:text-[#9E9892]">
              Use the Quick Log buttons above to easily track feedings, diapers, and naps.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {careTimeline.slice(0, 8).map((event) => {
              const eventDate = new Date(event.time);
              const timeString = eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              if (event.eventType === 'diaper') {
                const d = event as DiaperLog;
                return (
                  <div
                    key={d.id}
                    className="bg-white dark:bg-[#1E2520] p-3 rounded-2xl shadow-2xs border border-[#E8E4DC] dark:border-[#2D382F] flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#C8EBCC]/50 dark:bg-[#203D24]/50 flex items-center justify-center text-[#44634B] dark:text-[#ADCFB1] shrink-0">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#191C1A] dark:text-[#FAF8F5]">
                          {d.type === 'both' ? 'Wet & Dirty Diaper' : d.type === 'wet' ? 'Wet Diaper' : 'Dirty Diaper'}
                        </span>
                        <span className="text-[10px] text-[#424842] dark:text-[#9E9892] tabular-nums">
                          {timeString}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#424842] dark:text-[#9E9892] truncate">
                        {d.notes || 'Recorded on time'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteDiaperLog(d.id)}
                      className="p-1 text-stone-300 hover:text-rose-500 transition-colors"
                      title="Delete log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              if (event.eventType === 'feed') {
                const f = event as FeedingLog;
                return (
                  <div
                    key={f.id}
                    className="bg-white dark:bg-[#1E2520] p-3 rounded-2xl shadow-2xs border border-[#E8E4DC] dark:border-[#2D382F] flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#FFDBD0]/50 dark:bg-[#3E1C12]/50 flex items-center justify-center text-[#99462A] dark:text-[#FFB59E] shrink-0">
                      <Milk className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#191C1A] dark:text-[#FAF8F5]">
                          {f.type === 'bottle' ? `Bottle Feed (${f.bottleAmountMl || 120} ml)` : 'Nursing Session'}
                        </span>
                        <span className="text-[10px] text-[#424842] dark:text-[#9E9892] tabular-nums">
                          {timeString}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#424842] dark:text-[#9E9892] truncate">
                        {f.notes || `${(f.leftDurationMinutes || 0) + (f.rightDurationMinutes || 0)} mins total`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteFeedingLog(f.id)}
                      className="p-1 text-stone-300 hover:text-rose-500 transition-colors"
                      title="Delete log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              const s = event as SleepLog;
              return (
                <div
                  key={s.id}
                  className="bg-white dark:bg-[#1E2520] p-3 rounded-2xl shadow-2xs border border-[#E8E4DC] dark:border-[#2D382F] flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-[#E6E9E4] dark:bg-[#252D26] flex items-center justify-center text-[#44634B] dark:text-[#ADCFB1] shrink-0">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#191C1A] dark:text-[#FAF8F5]">
                        Nap ({s.durationMinutes || 30} mins)
                      </span>
                      <span className="text-[10px] text-[#424842] dark:text-[#9E9892] tabular-nums">
                        {timeString}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#424842] dark:text-[#9E9892] truncate">
                      {s.notes || 'Slept peacefully'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Quick Log Modals (Feeding, Diaper, Sleep) */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs p-3">
          <div className="w-full max-w-md bg-white dark:bg-[#1E2520] rounded-[28px] border border-[#E8E4DC] dark:border-[#2D382F] p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-[#E8E4DC] dark:border-[#2D382F] pb-3">
              <h3 className="font-bold text-sm text-[#191C1A] dark:text-[#FAF8F5] flex items-center gap-2">
                {activeModal === 'feeding' && <Milk className="w-4 h-4 text-[#99462A]" />}
                {activeModal === 'diaper' && <Droplets className="w-4 h-4 text-[#44634B]" />}
                {activeModal === 'sleep' && <Moon className="w-4 h-4 text-[#7C5400]" />}
                <span>
                  {activeModal === 'feeding' && 'Log Feeding'}
                  {activeModal === 'diaper' && 'Log Diaper Change'}
                  {activeModal === 'sleep' && 'Log Nap Duration'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Feeding */}
            {activeModal === 'feeding' && (
              <div className="space-y-3">
                <p className="text-xs text-[#424842] dark:text-[#9E9892]">
                  Choose feeding type or enter bottle quantity:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleStartTimer('left');
                      setActiveModal(null);
                    }}
                    className="p-3 rounded-2xl bg-[#FFDBD0]/40 border border-[#99462A]/40 text-center text-xs font-semibold text-[#762C12] hover:bg-[#FFDBD0]"
                  >
                    Start Left Breast 🍼
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleStartTimer('right');
                      setActiveModal(null);
                    }}
                    className="p-3 rounded-2xl bg-[#FFDBD0]/40 border border-[#99462A]/40 text-center text-xs font-semibold text-[#762C12] hover:bg-[#FFDBD0]"
                  >
                    Start Right Breast 🍼
                  </button>
                </div>

                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-[#424842] dark:text-[#9E9892] mb-1">
                    Bottle Volume (ml)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={bottleMl}
                      onChange={(e) => setBottleMl(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-full border border-[#E8E4DC] dark:border-[#2D382F] bg-[#F7FAF5] dark:bg-[#161C17] text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleSaveBottle}
                      className="px-4 py-2 rounded-full bg-[#99462A] text-white text-xs font-semibold"
                    >
                      Save Bottle
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Body: Diaper */}
            {activeModal === 'diaper' && (
              <div className="space-y-3">
                <p className="text-xs text-[#424842] dark:text-[#9E9892]">
                  Select the diaper condition:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDiaper('wet')}
                    className="p-3 rounded-2xl bg-[#C8EBCC]/60 hover:bg-[#C8EBCC] text-[#03210E] text-xs font-semibold text-center"
                  >
                    💧 Wet
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDiaper('dirty')}
                    className="p-3 rounded-2xl bg-[#FFDBD0]/60 hover:bg-[#FFDBD0] text-[#762C12] text-xs font-semibold text-center"
                  >
                    💩 Dirty
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDiaper('both')}
                    className="p-3 rounded-2xl bg-[#FFDDAE]/60 hover:bg-[#FFDDAE] text-[#281800] text-xs font-semibold text-center"
                  >
                    ✨ Both
                  </button>
                </div>
              </div>
            )}

            {/* Modal Body: Sleep */}
            {activeModal === 'sleep' && (
              <div className="space-y-3">
                <p className="text-xs text-[#424842] dark:text-[#9E9892]">
                  Quick save completed nap duration:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 45, 60].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSaveSleep(m)}
                      className="p-2.5 rounded-2xl bg-[#F1F4F0] dark:bg-[#243026] text-[#191C1A] dark:text-[#FAF8F5] text-xs font-semibold text-center hover:bg-[#C8EBCC]"
                    >
                      {m} mins
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <input
                    type="number"
                    value={sleepMinutes}
                    onChange={(e) => setSleepMinutes(e.target.value)}
                    placeholder="Custom mins"
                    className="flex-1 px-3 py-2 rounded-full border border-[#E8E4DC] dark:border-[#2D382F] bg-[#F7FAF5] dark:bg-[#161C17] text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveSleep(parseInt(sleepMinutes) || 30)}
                    className="px-4 py-2 rounded-full bg-[#44634B] text-white text-xs font-semibold"
                  >
                    Save Nap
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
