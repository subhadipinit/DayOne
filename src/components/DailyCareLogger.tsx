'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Baby,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Moon,
  Trash2,
  Droplets,
  Milk,
  CheckCircle2,
  Sparkles,
  Calendar,
  ArrowRight,
  Timer,
  Check,
  X,
  AlertCircle,
  ShieldAlert,
  Volume2,
  Sun,
  BedDouble,
  Activity,
  ChevronRight,
  Flame,
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
  onDeleteSleepLog?: (id: string) => void;
  userRole: 'parent' | 'family';
  onOpenShusher?: () => void;
  onNavigateTab?: (tab: ActiveTab) => void;
}

// Preset volumes for bottle feeds
const BOTTLE_PRESETS = [60, 90, 120, 150, 180, 210];

// Sleep presets in minutes: 30m, 45m, 1h, 1.5h, 2h
const SLEEP_PRESETS = [
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
  { label: '1h', minutes: 60 },
  { label: '1.5h', minutes: 90 },
  { label: '2h', minutes: 120 },
];

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
  onDeleteSleepLog,
  userRole,
  onOpenShusher,
  onNavigateTab,
}) => {
  // --- 1. 3 AM NURSERY LOW-STIMULATION MODE ---
  // High-contrast, low-lumen dim night theme for midnight feedings
  const [isNurseryMode, setIsNurseryMode] = useState<boolean>(false);

  // --- 2. TOAST NOTIFICATION POP ---
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastIcon, setToastIcon] = useState<string>('check');

  const showToast = (msg: string, icon = 'check') => {
    setToastMessage(msg);
    setToastIcon(icon);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // --- 3. BREASTFEEDING STOPWATCH STATE ---
  const [activeSide, setActiveSide] = useState<'left' | 'right' | null>(null);
  const [leftSeconds, setLeftSeconds] = useState<number>(0);
  const [rightSeconds, setRightSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [nursingNotes, setNursingNotes] = useState<string>('');

  // Live Timer Interval
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

  // 1-Tap Quick Switch: Switch breast immediately with 1 single thumb tap!
  const handleTapBreast = (side: 'left' | 'right') => {
    if (activeSide === side && isTimerRunning) {
      // Tapping the running side pauses it
      setIsTimerRunning(false);
    } else {
      // Tapping opposite side or when paused immediately switches and runs
      setActiveSide(side);
      setIsTimerRunning(true);
    }
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResumeTimer = () => {
    if (!activeSide) {
      setActiveSide('left');
    }
    setIsTimerRunning(true);
  };

  const handleResetTimer = () => {
    if (leftSeconds + rightSeconds > 60) {
      if (!window.confirm('Reset the nursing stopwatch timer?')) return;
    }
    setIsTimerRunning(false);
    setActiveSide(null);
    setLeftSeconds(0);
    setRightSeconds(0);
    setNursingNotes('');
  };

  const handleSaveFeed = () => {
    if (leftSeconds === 0 && rightSeconds === 0) return;
    const lMins = Math.max(leftSeconds > 0 ? 1 : 0, Math.round(leftSeconds / 60));
    const rMins = Math.max(rightSeconds > 0 ? 1 : 0, Math.round(rightSeconds / 60));
    const totalMins = lMins + rMins;

    onAddFeedingLog({
      childId,
      timestamp: new Date().toISOString(),
      type: 'breast',
      leftDurationMinutes: lMins,
      rightDurationMinutes: rMins,
      notes: nursingNotes.trim()
        ? `${nursingNotes} (L: ${lMins}m, R: ${rMins}m)`
        : `Nursing session: ${totalMins}m total (L: ${lMins}m, R: ${rMins}m)`,
    });

    showToast(`Nursing session saved: ${totalMins} mins total`, 'milk');
    handleResetTimer();
    setActiveModal(null);
  };

  // --- 4. LIVE NAP STOPWATCH STATE ---
  const [napStartTime, setNapStartTime] = useState<Date | null>(null);
  const [napElapsedSeconds, setNapElapsedSeconds] = useState<number>(0);

  // Live nap elapsed ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (napStartTime) {
      interval = setInterval(() => {
        const diffSec = Math.floor((Date.now() - napStartTime.getTime()) / 1000);
        setNapElapsedSeconds(diffSec);
      }, 1000);
    } else {
      setNapElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [napStartTime]);

  const handleStartLiveNap = () => {
    const started = new Date();
    setNapStartTime(started);
    setActiveModal(null);
    showToast(`Nap started at ${started.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 'moon');
  };

  const handleWakeAndSaveLiveNap = () => {
    if (!napStartTime) return;
    const end = new Date();
    const durationMinutes = Math.max(1, Math.round(napElapsedSeconds / 60));

    onAddSleepLog({
      childId,
      startTime: napStartTime.toISOString(),
      endTime: end.toISOString(),
      durationMinutes,
      notes: `Live Nap: ${durationMinutes} mins (${napStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
    });

    showToast(`Nap logged: ${durationMinutes} minutes`, 'moon');
    setNapStartTime(null);
    setNapElapsedSeconds(0);
  };

  const handleCancelLiveNap = () => {
    if (window.confirm('Discard active nap timer?')) {
      setNapStartTime(null);
      setNapElapsedSeconds(0);
    }
  };

  // --- 5. BOTTOM SHEET MODAL STATE ---
  const [activeModal, setActiveModal] = useState<'bottle' | 'diaper' | 'sleep' | 'breast_manual' | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Lock body scroll and handle Escape key when modal drawer is open
  useEffect(() => {
    if (activeModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setActiveModal(null);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [activeModal]);

  // Bottle Logger States
  const [bottleMl, setBottleMl] = useState<number>(120);
  const [bottleType, setBottleType] = useState<'breastmilk' | 'formula'>('breastmilk');
  const [bottleNotes, setBottleNotes] = useState<string>('');

  // Diaper Logger States
  const [diaperType, setDiaperType] = useState<'wet' | 'dirty' | 'both'>('wet');
  const [diaperRashStatus, setDiaperRashStatus] = useState<'none' | 'rash_observed' | 'cream_applied'>('none');
  const [diaperConsistency, setDiaperConsistency] = useState<string>('Normal');
  const [diaperNotes, setDiaperNotes] = useState<string>('');

  // Retrospective Sleep Logger States
  const [sleepPresetMinutes, setSleepPresetMinutes] = useState<number>(45);
  const [sleepLocation, setSleepLocation] = useState<string>('Crib');
  const [customSleepNotes, setCustomSleepNotes] = useState<string>('');

  // Quick Save Bottle
  const handleSaveBottle = () => {
    if (!bottleMl || bottleMl <= 0) return;
    const typeLabel = bottleType === 'breastmilk' ? 'Expressed Breastmilk' : 'Infant Formula';
    onAddFeedingLog({
      childId,
      timestamp: new Date().toISOString(),
      type: 'bottle',
      bottleAmountMl: bottleMl,
      notes: bottleNotes.trim()
        ? `${bottleNotes} (${typeLabel}, ${bottleMl} ml)`
        : `Bottle: ${bottleMl} ml (${typeLabel})`,
    });
    showToast(`Logged ${bottleMl} ml ${typeLabel}`, 'milk');
    setActiveModal(null);
    setBottleNotes('');
  };

  // Quick Save Diaper
  const handleSaveDiaper = () => {
    const rashNote =
      diaperRashStatus === 'rash_observed'
        ? ' [⚠️ Rash Observed]'
        : diaperRashStatus === 'cream_applied'
        ? ' [🛡️ Rash Cream Applied]'
        : '';
    const consistencyNote = diaperType !== 'wet' ? ` Texture: ${diaperConsistency}.` : '';
    const combinedNotes = `${diaperNotes.trim()}${consistencyNote}${rashNote}`.trim();

    onAddDiaperLog({
      childId,
      timestamp: new Date().toISOString(),
      type: diaperType,
      notes: combinedNotes || (diaperType === 'both' ? 'Wet & Dirty Diaper' : diaperType === 'wet' ? 'Wet Diaper' : 'Dirty Diaper'),
    });

    const label = diaperType === 'both' ? 'Wet & Dirty' : diaperType === 'wet' ? 'Wet' : 'Dirty';
    showToast(`${label} diaper recorded`, 'droplets');
    setActiveModal(null);
    setDiaperNotes('');
  };

  // Quick Save Retrospective Sleep
  const handleSaveSleepRetrospective = (mins: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - mins * 60 * 1000);
    onAddSleepLog({
      childId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      durationMinutes: mins,
      notes: customSleepNotes.trim()
        ? `${customSleepNotes} (${sleepLocation}, ${mins} mins)`
        : `Nap: ${mins} mins in ${sleepLocation}`,
    });
    showToast(`Saved ${mins}m nap in ${sleepLocation}`, 'moon');
    setActiveModal(null);
    setCustomSleepNotes('');
  };

  // --- 6. STATS & RECENT TIMELINE ---
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

  // Timeline Activity Filter Tab
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'feed' | 'diaper' | 'sleep'>('all');

  const careTimeline = useMemo(() => {
    return [
      ...feedingLogs.map((f) => ({ ...f, eventType: 'feed' as const, time: f.timestamp })),
      ...diaperLogs.map((d) => ({ ...d, eventType: 'diaper' as const, time: d.timestamp })),
      ...sleepLogs.map((s) => ({ ...s, eventType: 'sleep' as const, time: s.startTime })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .filter((ev) => timelineFilter === 'all' || ev.eventType === timelineFilter);
  }, [feedingLogs, diaperLogs, sleepLogs, timelineFilter]);

  // Total nursing elapsed display
  const totalNursingSeconds = leftSeconds + rightSeconds;
  const totalNursingMins = Math.floor(totalNursingSeconds / 60);

  return (
    <div
      className={`space-y-4 sm:space-y-5 transition-colors duration-200 ${
        isNurseryMode ? 'nursery-night-mode bg-[#0B0C0E] text-[#D8D4CC] p-3 sm:p-4 rounded-3xl' : ''
      }`}
    >
      {/* Toast Notification Pop */}
      {isMounted && toastMessage && createPortal(
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-200 max-w-[92vw] animate-in fade-in slide-in-from-top-3">
          <div className="bg-[#1C1B22]/95 text-[#FAF8F5] backdrop-blur-md px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2.5 text-xs font-bold border border-white/10">
            <CheckCircle2 className="w-4 h-4 text-[#A8D1B0]" />
            <span>{toastMessage}</span>
          </div>
        </div>,
        document.body
      )}

      {/* Header Bar with 3 AM Nursery Mode Toggle */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-sm sm:text-base font-black tracking-tight text-[#191C1A] dark:text-[#FAF8F5]">
            Daily Care &amp; Feeding
          </h2>
          <p className="text-[11px] font-medium text-[#75706B] dark:text-[#A8A29E]">
            Thumb-friendly 3 AM controls &amp; native tracker
          </p>
        </div>

        {/* 3 AM Low-Strain Nursery Night Mode Toggle */}
        <button
          type="button"
          onClick={() => setIsNurseryMode(!isNurseryMode)}
          className={`tap-feedback px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer min-h-[36px] ${
            isNurseryMode
              ? 'bg-[#EBB04D] text-[#191C1A] border-[#EBB04D] shadow-xs'
              : 'bg-white dark:bg-[#1C1B22] text-[#44634B] dark:text-[#A8D1B0] border-[#EAE6DF] dark:border-[#2C2A34]'
          }`}
          title="Toggle 3 AM Dim Night Mode"
        >
          {isNurseryMode ? (
            <>
              <Sun className="w-3.5 h-3.5 text-[#191C1A]" />
              <span>Normal View</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5" />
              <span>3 AM Dim Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Active Live Nap Banner (if sleep tracker is running) */}
      {napStartTime && (
        <div className="bg-[#1C1A29] dark:bg-[#161424] text-white rounded-[24px] p-4 shadow-md border border-[#4B4468] animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#362F4C] flex items-center justify-center text-[#C2B5F0] shrink-0">
                <Moon className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#E2DCF7] uppercase tracking-wider">
                    Baby is Sleeping
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#9B87F5] animate-ping" />
                </div>
                <div className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-white mt-0.5">
                  {formatTimer(napElapsedSeconds)}
                </div>
                <p className="text-[11px] text-[#A69FC0] truncate">
                  Fell asleep at {napStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleWakeAndSaveLiveNap}
                className="tap-feedback px-4 py-2.5 rounded-full bg-[#9B87F5] hover:bg-[#856DE8] text-white font-bold text-xs shadow-xs min-h-[48px] flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Wake Baby &amp; Save</span>
              </button>
              <button
                type="button"
                onClick={handleCancelLiveNap}
                className="tap-feedback p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-[#D0C9E8] min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer"
                title="Discard timer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Quick Log Thumb-Pill Grid (4 Prominent Action Buttons) */}
      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
          {/* Bottle Feed Button */}
          <button
            type="button"
            onClick={() => setActiveModal('bottle')}
            className="tap-feedback flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-[#FFF0E6] hover:bg-[#FFE5D6] dark:bg-[#2D1F1A] dark:hover:bg-[#382620] text-center gap-1.5 shadow-xs border border-[#FCDCCB]/80 dark:border-[#4A322A]/80 cursor-pointer min-h-[78px]"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-[#1E1614] flex items-center justify-center text-[#99462A] dark:text-[#FFB59E] shadow-2xs">
              <Milk className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5]">
              Bottle
            </span>
          </button>

          {/* Diaper Button */}
          <button
            type="button"
            onClick={() => setActiveModal('diaper')}
            className="tap-feedback flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-[#EDF5EE] hover:bg-[#E1EDE4] dark:bg-[#1A281E] dark:hover:bg-[#223528] text-center gap-1.5 shadow-xs border border-[#CFE2D1]/80 dark:border-[#2D4532]/80 cursor-pointer min-h-[78px]"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-[#141F17] flex items-center justify-center text-[#44634B] dark:text-[#ADCFB1] shadow-2xs">
              <Droplets className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5]">
              Diaper
            </span>
          </button>

          {/* Sleep / Nap Button */}
          <button
            type="button"
            onClick={() => setActiveModal('sleep')}
            className="tap-feedback flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-[#F0EEEC] hover:bg-[#E8E5E2] dark:bg-[#201F25] dark:hover:bg-[#292830] text-center gap-1.5 shadow-xs border border-[#E0DCD7]/80 dark:border-[#35333E]/80 cursor-pointer min-h-[78px]"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-[#16151B] flex items-center justify-center text-[#55505C] dark:text-[#DDD8D0] shadow-2xs">
              <Moon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5]">
              {napStartTime ? 'Nap (Active)' : 'Sleep'}
            </span>
          </button>

          {/* Shusher / White Noise Button */}
          <button
            type="button"
            onClick={() => {
              if (onOpenShusher) onOpenShusher();
              else showToast('White noise & shusher ready', 'volume2');
            }}
            className="tap-feedback flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-[#FFF6E8] hover:bg-[#FFEDD1] dark:bg-[#2C2314] dark:hover:bg-[#382C19] text-center gap-1.5 shadow-xs border border-[#F8DCB0]/80 dark:border-[#4B391D]/80 cursor-pointer min-h-[78px]"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-[#1F180E] flex items-center justify-center text-[#7C5400] dark:text-[#F8BC58] shadow-2xs">
              <Volume2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5]">
              Shusher
            </span>
          </button>
        </div>
      </div>

      {/* 2. Breastfeeding Stopwatch Station (Ergonomic Thumb-Zone & 1-Tap Switch) */}
      <div className="bg-white dark:bg-[#1E2520] rounded-[26px] p-4 sm:p-5 shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#FFDBD0] dark:bg-[#3E1C12] flex items-center justify-center text-[#99462A] dark:text-[#FFB59E]">
              <Baby className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-[#191C1A] dark:text-[#FAF8F5]">
              Nursing Stopwatch Station
            </h3>
          </div>
          <span className="text-[10px] font-bold text-[#762C12] dark:text-[#FFB59E] bg-[#FFDBD0]/60 dark:bg-[#3D1E16] px-2.5 py-0.5 rounded-full">
            1-Tap Quick Switch
          </span>
        </div>

        {/* Large Ergonomic Dual Left / Right Buttons */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {/* Left Breast Button */}
          <button
            type="button"
            onClick={() => handleTapBreast('left')}
            className={`tap-feedback relative p-3 sm:p-4 rounded-2xl border text-center transition-all cursor-pointer min-h-[88px] sm:min-h-[96px] flex flex-col justify-between ${
              activeSide === 'left' && isTimerRunning
                ? 'bg-[#FFDBD0]/50 dark:bg-[#3E1C12] border-2 border-[#99462A] shadow-sm'
                : activeSide === 'left'
                ? 'bg-[#FFDBD0]/20 dark:bg-[#2A1610] border-[#99462A]/60'
                : 'bg-[#F7FAF5] dark:bg-[#161C17] border-[#E0E3DF] dark:border-[#2D382F] hover:bg-[#EDF5EE] dark:hover:bg-[#202720]'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#99462A] dark:text-[#FFB59E]">
                Left Breast
              </span>
              {activeSide === 'left' && isTimerRunning && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#99462A] dark:bg-[#FF8D66] animate-ping" />
              )}
            </div>

            <span className="text-2xl sm:text-3xl font-black text-[#191C1A] dark:text-[#FAF8F5] tabular-nums my-1">
              {formatTimer(leftSeconds)}
            </span>

            <span className="text-[10px] font-bold block truncate">
              {activeSide === 'left' && isTimerRunning ? (
                <span className="text-[#99462A] dark:text-[#FFB59E] flex items-center justify-center gap-1 font-bold">
                  ● Nursing (Tap to pause)
                </span>
              ) : leftSeconds > 0 ? (
                <span className="text-[#424842] dark:text-[#A8A29E]">
                  Paused • Tap to resume
                </span>
              ) : (
                <span className="text-[#75706B] dark:text-[#8D8882]">
                  Tap to start
                </span>
              )}
            </span>
          </button>

          {/* Right Breast Button */}
          <button
            type="button"
            onClick={() => handleTapBreast('right')}
            className={`tap-feedback relative p-3 sm:p-4 rounded-2xl border text-center transition-all cursor-pointer min-h-[88px] sm:min-h-[96px] flex flex-col justify-between ${
              activeSide === 'right' && isTimerRunning
                ? 'bg-[#FFDBD0]/50 dark:bg-[#3E1C12] border-2 border-[#99462A] shadow-sm'
                : activeSide === 'right'
                ? 'bg-[#FFDBD0]/20 dark:bg-[#2A1610] border-[#99462A]/60'
                : 'bg-[#F7FAF5] dark:bg-[#161C17] border-[#E0E3DF] dark:border-[#2D382F] hover:bg-[#EDF5EE] dark:hover:bg-[#202720]'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#99462A] dark:text-[#FFB59E]">
                Right Breast
              </span>
              {activeSide === 'right' && isTimerRunning && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#99462A] dark:bg-[#FF8D66] animate-ping" />
              )}
            </div>

            <span className="text-2xl sm:text-3xl font-black text-[#191C1A] dark:text-[#FAF8F5] tabular-nums my-1">
              {formatTimer(rightSeconds)}
            </span>

            <span className="text-[10px] font-bold block truncate">
              {activeSide === 'right' && isTimerRunning ? (
                <span className="text-[#99462A] dark:text-[#FFB59E] flex items-center justify-center gap-1 font-bold">
                  ● Nursing (Tap to pause)
                </span>
              ) : rightSeconds > 0 ? (
                <span className="text-[#424842] dark:text-[#A8A29E]">
                  Paused • Tap to resume
                </span>
              ) : (
                <span className="text-[#75706B] dark:text-[#8D8882]">
                  Tap to start
                </span>
              )}
            </span>
          </button>
        </div>

        {/* Total Duration Ticker & Control Bar */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="text-xs text-[#75706B] dark:text-[#A8A29E] font-medium">
            <span>Total: </span>
            <strong className="text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5] tabular-nums">
              {formatTimer(totalNursingSeconds)}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            {isTimerRunning ? (
              <button
                type="button"
                onClick={handlePauseTimer}
                className="tap-feedback px-4 py-2.5 rounded-full font-bold text-xs bg-[#424842] hover:bg-[#303530] text-white flex items-center gap-1.5 cursor-pointer min-h-[48px]"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            ) : totalNursingSeconds > 0 ? (
              <button
                type="button"
                onClick={handleResumeTimer}
                className="tap-feedback px-4 py-2.5 rounded-full font-bold text-xs bg-[#44634B] hover:bg-[#344738] text-white flex items-center gap-1.5 cursor-pointer min-h-[48px]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume</span>
              </button>
            ) : null}

            {totalNursingSeconds > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleSaveFeed}
                  className="tap-feedback px-5 py-2.5 rounded-full font-bold text-xs bg-[#99462A] hover:bg-[#7D341D] text-white flex items-center gap-1.5 shadow-xs cursor-pointer min-h-[48px]"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Feed</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetTimer}
                  className="tap-feedback p-2.5 rounded-full border border-[#E0E3DF] dark:border-[#2D382F] hover:bg-[#F1F4F0] dark:hover:bg-[#1E2520] text-[#75706B] dark:text-[#9E9892] min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer"
                  title="Reset Stopwatch"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Today at a Glance Bento Grid (2x2 Cards) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black tracking-tight text-[#191C1A] dark:text-[#FAF8F5]">
            Today at a Glance
          </h2>
          <div className="flex items-center gap-1 bg-[#C8EBCC] dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1] px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            <span className="text-[10px] font-bold">Optimal Daily Rhythm</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Card 1: Last Feed */}
          <div
            onClick={() => setActiveModal('bottle')}
            className="tap-feedback bg-white dark:bg-[#1E2520] p-3.5 rounded-2xl shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] flex flex-col justify-between space-y-2 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 rounded-full bg-[#FFF0E6] dark:bg-[#3E1C12] flex items-center justify-center text-[#99462A] dark:text-[#FFB59E]">
                <Milk className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-[#75706B] dark:text-[#9E9892] font-semibold">
                {getTimeAgo(lastFeed?.timestamp)}
              </span>
            </div>
            <div>
              <span className="text-lg font-bold text-[#191C1A] dark:text-[#FAF8F5] block leading-tight tabular-nums">
                {lastFeed?.type === 'bottle'
                  ? `${lastFeed.bottleAmountMl || 120} ml`
                  : `${(lastFeed?.leftDurationMinutes || 10) + (lastFeed?.rightDurationMinutes || 8)}m`}
              </span>
              <span className="text-xs font-bold text-[#99462A] dark:text-[#FFB59E] block">
                {lastFeed?.type === 'bottle' ? 'Bottle Feed' : 'Nursing Session'}
              </span>
            </div>
            <div className="pt-1 bg-[#F1F4F0] dark:bg-[#161C17] px-2 py-1 rounded-xl flex items-center gap-1 text-[#424842] dark:text-[#A8A29E]">
              <Check className="w-3 h-3 text-[#99462A] dark:text-[#FFB59E]" />
              <span className="text-[10.5px] truncate font-medium">
                {lastFeed ? lastFeed.notes || 'Recorded on time' : 'Tap to log feed'}
              </span>
            </div>
          </div>

          {/* Card 2: Diapers */}
          <div
            onClick={() => setActiveModal('diaper')}
            className="tap-feedback bg-white dark:bg-[#1E2520] p-3.5 rounded-2xl shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] flex flex-col justify-between space-y-2 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 rounded-full bg-[#EDF5EE] dark:bg-[#203D24] flex items-center justify-center text-[#44634B] dark:text-[#ADCFB1]">
                <Droplets className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-[#75706B] dark:text-[#9E9892] font-semibold">
                {getTimeAgo(lastDiaper?.timestamp)}
              </span>
            </div>
            <div>
              <span className="text-lg font-bold text-[#191C1A] dark:text-[#FAF8F5] block leading-tight tabular-nums">
                {totalDiapers > 0 ? `${totalDiapers} Changed` : '0 Today'}
              </span>
              <span className="text-xs font-bold text-[#44634B] dark:text-[#ADCFB1] block">
                {wetCount} Wet • {dirtyCount} Dirty
              </span>
            </div>
            <div className="pt-1 flex items-center gap-1 py-0.5">
              {Array.from({ length: Math.min(6, Math.max(1, totalDiapers)) }).map((_, idx) => (
                <span
                  key={idx}
                  className={`w-2 h-2 rounded-full ${
                    idx < wetCount ? 'bg-[#44634B] dark:bg-[#ADCFB1]' : 'bg-[#99462A] dark:bg-[#FE9572]'
                  }`}
                />
              ))}
              <span className="text-[10px] text-[#75706B] dark:text-[#9E9892] ml-auto font-bold">
                {totalDiapers >= 4 ? 'Optimal Hydration' : 'Tracking'}
              </span>
            </div>
          </div>

          {/* Card 3: Sleep */}
          <div
            onClick={() => setActiveModal('sleep')}
            className="tap-feedback bg-white dark:bg-[#1E2520] p-3.5 rounded-2xl shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] flex flex-col justify-between space-y-2 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 rounded-full bg-[#F0EEEC] dark:bg-[#262E28] flex items-center justify-center text-[#44634B] dark:text-[#ADCFB1]">
                <Moon className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-[#44634B] dark:text-[#ADCFB1] font-bold bg-[#EDF5EE] dark:bg-[#203D24] px-1.5 py-0.5 rounded-full">
                {sleepLogs.length > 0 ? `${sleepLogs.length} Naps Logged` : 'Rest'}
              </span>
            </div>
            <div>
              <span className="text-lg font-bold text-[#191C1A] dark:text-[#FAF8F5] block leading-tight tabular-nums">
                {sleepHours > 0 ? `${sleepHours}h ${sleepMinsRem}m` : `${totalSleepMinutes || 0}m`}
              </span>
              <span className="text-xs font-bold text-[#75706B] dark:text-[#9E9892] block">
                Total Sleep Today
              </span>
            </div>
            <div className="bg-[#F1F4F0] dark:bg-[#161C17] px-2 py-1 rounded-xl flex items-center justify-between text-[#424842] dark:text-[#A8A29E]">
              <span className="text-[10px]">Wake window:</span>
              <span className="text-[10.5px] font-bold text-[#191C1A] dark:text-[#FAF8F5]">~1h 30m</span>
            </div>
          </div>

          {/* Card 4: Tummy Time Goal */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('tummy')}
            className="tap-feedback bg-white dark:bg-[#1E2520] p-3.5 rounded-2xl shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] flex flex-col justify-between space-y-2 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 rounded-full bg-[#FFF6E8] dark:bg-[#3D2C12] flex items-center justify-center text-[#7C5400] dark:text-[#F8BC58]">
                <Timer className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-[#7C5400] dark:text-[#F8BC58] font-black">83%</span>
            </div>
            <div>
              <span className="text-lg font-bold text-[#191C1A] dark:text-[#FAF8F5] block leading-tight tabular-nums">
                25 <span className="text-xs font-normal text-[#75706B] dark:text-[#9E9892]">/ 30m</span>
              </span>
              <span className="text-xs font-bold text-[#75706B] dark:text-[#9E9892] block">
                Tummy Time Goal
              </span>
            </div>
            <div className="space-y-1">
              <div className="w-full h-1.5 bg-[#E6E9E4] dark:bg-[#2D382F] rounded-full overflow-hidden">
                <div className="bg-[#7C5400] dark:bg-[#F8BC58] h-full rounded-full w-[83%]" />
              </div>
              <div className="flex justify-between items-center text-[9.5px] text-[#75706B] dark:text-[#9E9892]">
                <span>5m remaining</span>
                <span className="font-bold text-[#7C5400] dark:text-[#F8BC58]">Tap to start coach</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Upcoming Pediatrician Checkup Strip */}
      <div className="bg-[#FAF8F5] dark:bg-[#19221B] rounded-2xl p-3.5 sm:p-4 shadow-xs border border-[#E0E3DF] dark:border-[#2D382F]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFDBD0] dark:bg-[#3E1C12] flex items-center justify-center text-[#99462A] dark:text-[#FFB59E] shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#99462A] dark:text-[#FFB59E] block">
              Pediatric Visit Radar
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5] leading-snug mt-0.5">
              6-Month Well-Child Checkup &amp; Immunizations
            </h3>
            <p className="text-[11px] text-[#75706B] dark:text-[#A8A29E] mt-0.5">
              Dr. Morrison • Westside Pediatrics • Questions prepared
            </p>
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('doctor')}
                className="tap-feedback inline-flex items-center gap-1.5 bg-[#44634B] hover:bg-[#344738] text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs cursor-pointer min-h-[36px]"
              >
                <span>View Pediatric Records</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Care Activity Timeline with Filter Pills */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black tracking-tight text-[#191C1A] dark:text-[#FAF8F5]">
            Recent Care Activity
          </h2>
          <span className="text-[11px] font-bold text-[#44634B] dark:text-[#ADCFB1]">
            {careTimeline.length} events logged
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(['all', 'feed', 'diaper', 'sleep'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setTimelineFilter(filter)}
              className={`tap-feedback px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all cursor-pointer min-h-[36px] ${
                timelineFilter === filter
                  ? 'bg-[#44634B] text-white shadow-2xs'
                  : 'bg-white dark:bg-[#1E2520] text-[#75706B] dark:text-[#A8A29E] border border-[#E8E4DC] dark:border-[#2D382F]'
              }`}
            >
              {filter === 'all' ? 'All Activities' : filter === 'feed' ? '🍼 Feeds' : filter === 'diaper' ? '💧 Diapers' : '🌙 Sleep'}
            </button>
          ))}
        </div>

        {careTimeline.length === 0 ? (
          <div className="bg-white dark:bg-[#1E2520] rounded-[24px] p-6 text-center border border-[#E8E4DC] dark:border-[#2D382F] space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#C8EBCC] dark:bg-[#203D24] text-[#44634B] dark:text-[#ADCFB1] flex items-center justify-center mx-auto">
              <Baby className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5]">
              No care events recorded in this view
            </p>
            <p className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
              Tap any of the Quick Log buttons above to easily track baby&apos;s daily routine.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {careTimeline.slice(0, 10).map((event) => {
              const eventDate = new Date(event.time);
              const timeString = eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const timeAgo = getTimeAgo(event.time);

              if (event.eventType === 'diaper') {
                const d = event as DiaperLog;
                return (
                  <div
                    key={d.id}
                    className="bg-white dark:bg-[#1E2520] p-3 sm:p-3.5 rounded-2xl shadow-2xs border border-[#E8E4DC] dark:border-[#2D382F] flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#C8EBCC]/60 dark:bg-[#203D24]/60 flex items-center justify-center text-[#44634B] dark:text-[#ADCFB1] shrink-0">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5]">
                          {d.type === 'both' ? 'Wet & Dirty Diaper' : d.type === 'wet' ? 'Wet Diaper' : 'Dirty Diaper'}
                        </span>
                        <span className="text-[10px] text-[#75706B] dark:text-[#9E9892] tabular-nums font-medium">
                          {timeString} ({timeAgo})
                        </span>
                      </div>
                      <p className="text-[11px] text-[#75706B] dark:text-[#A8A29E] truncate">
                        {d.notes || 'Recorded on time'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteDiaperLog(d.id)}
                      className="tap-feedback p-2 text-stone-300 hover:text-rose-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                      title="Delete log"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              }

              if (event.eventType === 'feed') {
                const f = event as FeedingLog;
                return (
                  <div
                    key={f.id}
                    className="bg-white dark:bg-[#1E2520] p-3 sm:p-3.5 rounded-2xl shadow-2xs border border-[#E8E4DC] dark:border-[#2D382F] flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#FFDBD0]/60 dark:bg-[#3E1C12]/60 flex items-center justify-center text-[#99462A] dark:text-[#FFB59E] shrink-0">
                      <Milk className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5]">
                          {f.type === 'bottle' ? `Bottle Feed (${f.bottleAmountMl || 120} ml)` : 'Nursing Session'}
                        </span>
                        <span className="text-[10px] text-[#75706B] dark:text-[#9E9892] tabular-nums font-medium">
                          {timeString} ({timeAgo})
                        </span>
                      </div>
                      <p className="text-[11px] text-[#75706B] dark:text-[#A8A29E] truncate">
                        {f.notes || `${(f.leftDurationMinutes || 0) + (f.rightDurationMinutes || 0)} mins total`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteFeedingLog(f.id)}
                      className="tap-feedback p-2 text-stone-300 hover:text-rose-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                      title="Delete log"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              }

              const s = event as SleepLog;
              return (
                <div
                  key={s.id}
                  className="bg-white dark:bg-[#1E2520] p-3 sm:p-3.5 rounded-2xl shadow-2xs border border-[#E8E4DC] dark:border-[#2D382F] flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-[#E6E9E4] dark:bg-[#252D26] flex items-center justify-center text-[#44634B] dark:text-[#ADCFB1] shrink-0">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5]">
                        Nap ({s.durationMinutes || 30} mins)
                      </span>
                      <span className="text-[10px] text-[#75706B] dark:text-[#9E9892] tabular-nums font-medium">
                        {timeString} ({timeAgo})
                      </span>
                    </div>
                    <p className="text-[11px] text-[#75706B] dark:text-[#A8A29E] truncate">
                      {s.notes || 'Slept peacefully'}
                    </p>
                  </div>
                  {onDeleteSleepLog && (
                    <button
                      type="button"
                      onClick={() => onDeleteSleepLog(s.id)}
                      className="tap-feedback p-2 text-stone-300 hover:text-rose-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                      title="Delete log"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          NATIVE BOTTOM SHEET MODALS (BOTTLE, DIAPER, SLEEP)
          Built with 48px min touch targets, iOS grab handle, and 3 AM thumb zone
          ========================================================================= */}

      {/* --- 1. BOTTLE LOGGER BOTTOM SHEET --- */}
      {isMounted && activeModal === 'bottle' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div className="w-full max-w-lg bg-white dark:bg-[#1C1B22] rounded-t-[32px] sm:rounded-3xl border border-[#E8E4DC] dark:border-[#2C2A34] p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto pb-[max(env(safe-area-inset-bottom,0px),24px)] animate-in slide-in-from-bottom duration-200">
            {/* Grab handle */}
            <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-600 rounded-full mx-auto" />

            <div className="flex items-center justify-between border-b border-[#E8E4DC] dark:border-[#2C2A34] pb-3">
              <h3 className="font-bold text-sm sm:text-base text-[#191C1A] dark:text-[#FAF8F5] flex items-center gap-2">
                <Milk className="w-5 h-5 text-[#99462A]" />
                <span>Log Bottle Feed</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="tap-feedback p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Milk Type Toggle: Formula vs Breastmilk */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#75706B] dark:text-[#A8A29E] mb-1.5">
                Milk Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBottleType('breastmilk')}
                  className={`tap-feedback py-3 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 min-h-[48px] cursor-pointer ${
                    bottleType === 'breastmilk'
                      ? 'bg-[#FFDBD0] border-[#99462A] text-[#762C12] shadow-2xs font-black'
                      : 'bg-[#F7FAF5] dark:bg-[#161C17] border-[#E0E3DF] dark:border-[#2D382F] text-[#424842] dark:text-[#FAF8F5]'
                  }`}
                >
                  <Milk className="w-4 h-4 text-[#99462A]" />
                  <span>Expressed Milk</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBottleType('formula')}
                  className={`tap-feedback py-3 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 min-h-[48px] cursor-pointer ${
                    bottleType === 'formula'
                      ? 'bg-[#FFDBD0] border-[#99462A] text-[#762C12] shadow-2xs font-black'
                      : 'bg-[#F7FAF5] dark:bg-[#161C17] border-[#E0E3DF] dark:border-[#2D382F] text-[#424842] dark:text-[#FAF8F5]'
                  }`}
                >
                  <Baby className="w-4 h-4 text-[#99462A]" />
                  <span>Infant Formula</span>
                </button>
              </div>
            </div>

            {/* Instant 1-Tap Volume Presets: 60ml, 90ml, 120ml, 150ml, 180ml, 210ml */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#75706B] dark:text-[#A8A29E] mb-1.5">
                Quick Volume Presets (ml)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {BOTTLE_PRESETS.map((vol) => (
                  <button
                    key={vol}
                    type="button"
                    onClick={() => setBottleMl(vol)}
                    className={`tap-feedback py-3 rounded-2xl border text-xs sm:text-sm font-bold tabular-nums min-h-[48px] flex items-center justify-center cursor-pointer ${
                      bottleMl === vol
                        ? 'bg-[#99462A] text-white border-[#99462A] shadow-xs'
                        : 'bg-[#FAF8F5] dark:bg-[#161C17] border-[#E0E3DF] dark:border-[#2D382F] text-[#191C1A] dark:text-[#FAF8F5] hover:bg-[#FFDBD0]/40'
                    }`}
                  >
                    {vol} ml
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Volume Stepper */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#75706B] dark:text-[#A8A29E] mb-1.5">
                Custom Volume
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBottleMl(Math.max(10, bottleMl - 10))}
                  className="tap-feedback px-4 py-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#202722] border border-[#E0E3DF] dark:border-[#2D382F] text-[#191C1A] dark:text-[#FAF8F5] min-h-[48px] min-w-[52px] flex items-center justify-center font-bold"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={bottleMl}
                    onChange={(e) => setBottleMl(parseInt(e.target.value) || 0)}
                    className="w-full text-center py-3 px-4 rounded-2xl border border-[#E0E3DF] dark:border-[#2D382F] bg-[#FAF8F5] dark:bg-[#161C17] text-base font-black tabular-nums min-h-[48px]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#75706B]">
                    ml
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setBottleMl(bottleMl + 10)}
                  className="tap-feedback px-4 py-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#202722] border border-[#E0E3DF] dark:border-[#2D382F] text-[#191C1A] dark:text-[#FAF8F5] min-h-[48px] min-w-[52px] flex items-center justify-center font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <input
                type="text"
                value={bottleNotes}
                onChange={(e) => setBottleNotes(e.target.value)}
                placeholder="Optional notes (e.g. drank eagerly, spit up slightly)"
                className="w-full py-2.5 px-3.5 rounded-xl border border-[#E0E3DF] dark:border-[#2D382F] bg-[#FAF8F5] dark:bg-[#161C17] text-xs font-medium min-h-[44px]"
              />
            </div>

            {/* 1-Tap Save Action */}
            <button
              type="button"
              onClick={handleSaveBottle}
              className="tap-feedback w-full py-3.5 rounded-full bg-[#99462A] hover:bg-[#7D341D] text-white text-sm font-black shadow-md flex items-center justify-center gap-2 cursor-pointer min-h-[52px]"
            >
              <Check className="w-5 h-5" />
              <span>Save Bottle Feed ({bottleMl} ml)</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* --- 2. DIAPER LOGGER BOTTOM SHEET --- */}
      {isMounted && activeModal === 'diaper' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div className="w-full max-w-lg bg-white dark:bg-[#1C1B22] rounded-t-[32px] sm:rounded-3xl border border-[#E8E4DC] dark:border-[#2C2A34] p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto pb-[max(env(safe-area-inset-bottom,0px),24px)] animate-in slide-in-from-bottom duration-200">
            {/* Grab handle */}
            <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-600 rounded-full mx-auto" />

            <div className="flex items-center justify-between border-b border-[#E8E4DC] dark:border-[#2C2A34] pb-3">
              <h3 className="font-bold text-sm sm:text-base text-[#191C1A] dark:text-[#FAF8F5] flex items-center gap-2">
                <Droplets className="w-5 h-5 text-[#44634B]" />
                <span>Log Diaper Change</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="tap-feedback p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1-Tap Quick Condition Selector: Wet, Dirty, Both */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#75706B] dark:text-[#A8A29E] mb-1.5">
                Diaper Condition
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDiaperType('wet')}
                  className={`tap-feedback flex flex-col items-center justify-center p-3 rounded-2xl border text-center gap-1 min-h-[64px] cursor-pointer ${
                    diaperType === 'wet'
                      ? 'bg-[#C8EBCC] dark:bg-[#203D24] border-[#44634B] text-[#03210E] dark:text-[#ADCFB1] shadow-2xs font-black'
                      : 'bg-[#F7FAF5] dark:bg-[#161C17] border-[#E0E3DF] dark:border-[#2D382F] text-[#424842] dark:text-[#FAF8F5]'
                  }`}
                >
                  <span className="text-xl">💧</span>
                  <span className="text-xs font-bold">Wet Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDiaperType('dirty')}
                  className={`tap-feedback flex flex-col items-center justify-center p-3 rounded-2xl border text-center gap-1 min-h-[64px] cursor-pointer ${
                    diaperType === 'dirty'
                      ? 'bg-[#FFDBD0] dark:bg-[#3E1C12] border-[#99462A] text-[#762C12] dark:text-[#FFB59E] shadow-2xs font-black'
                      : 'bg-[#F7FAF5] dark:bg-[#161C17] border-[#E0E3DF] dark:border-[#2D382F] text-[#424842] dark:text-[#FAF8F5]'
                  }`}
                >
                  <span className="text-xl">💩</span>
                  <span className="text-xs font-bold">Dirty (Poop)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDiaperType('both')}
                  className={`tap-feedback flex flex-col items-center justify-center p-3 rounded-2xl border text-center gap-1 min-h-[64px] cursor-pointer ${
                    diaperType === 'both'
                      ? 'bg-[#FFDDAE] dark:bg-[#382C19] border-[#7C5400] text-[#281800] dark:text-[#F8BC58] shadow-2xs font-black'
                      : 'bg-[#F7FAF5] dark:bg-[#161C17] border-[#E0E3DF] dark:border-[#2D382F] text-[#424842] dark:text-[#FAF8F5]'
                  }`}
                >
                  <span className="text-xl">✨</span>
                  <span className="text-xs font-bold">Both (Wet &amp; Dirty)</span>
                </button>
              </div>
            </div>

            {/* Diaper Rash Clinical Indicator */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#75706B] dark:text-[#A8A29E] mb-1.5">
                Diaper Rash Check
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDiaperRashStatus('none')}
                  className={`tap-feedback py-2.5 px-2 rounded-xl border text-[11px] font-bold text-center min-h-[44px] cursor-pointer ${
                    diaperRashStatus === 'none'
                      ? 'bg-[#C8EBCC]/60 dark:bg-[#203D24] border-[#44634B] text-[#03210E] dark:text-[#ADCFB1]'
                      : 'bg-[#F7FAF5] dark:bg-[#161C17] border-[#E0E3DF] dark:border-[#2D382F]'
                  }`}
                >
                  🟢 Clear / Normal
                </button>
                <button
                  type="button"
                  onClick={() => setDiaperRashStatus('rash_observed')}
                  className={`tap-feedback py-2.5 px-2 rounded-xl border text-[11px] font-bold text-center min-h-[44px] cursor-pointer ${
                    diaperRashStatus === 'rash_observed'
                      ? 'bg-[#FFDBD0] dark:bg-[#3E1C12] border-[#99462A] text-[#762C12] dark:text-[#FFB59E]'
                      : 'bg-[#F7FAF5] dark:bg-[#161C17] border-[#E0E3DF] dark:border-[#2D382F]'
                  }`}
                >
                  ⚠️ Rash Observed
                </button>
                <button
                  type="button"
                  onClick={() => setDiaperRashStatus('cream_applied')}
                  className={`tap-feedback py-2.5 px-2 rounded-xl border text-[11px] font-bold text-center min-h-[44px] cursor-pointer ${
                    diaperRashStatus === 'cream_applied'
                      ? 'bg-[#D1E8FF] dark:bg-[#1A2E44] border-[#2A6AB2] text-[#0D3666] dark:text-[#8EC5FC]'
                      : 'bg-[#F7FAF5] dark:bg-[#161C17] border-[#E0E3DF] dark:border-[#2D382F]'
                  }`}
                >
                  🛡️ Cream Applied
                </button>
              </div>
            </div>

            {/* Consistency Tags (for dirty/both) */}
            {diaperType !== 'wet' && (
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#75706B] dark:text-[#A8A29E] mb-1.5">
                  Stool Texture
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {['Normal', 'Seedy / Mustard', 'Loose / Watery', 'Hard'].map((tex) => (
                    <button
                      key={tex}
                      type="button"
                      onClick={() => setDiaperConsistency(tex)}
                      className={`tap-feedback py-2 px-2 rounded-xl border text-[11px] font-bold text-center min-h-[40px] ${
                        diaperConsistency === tex
                          ? 'bg-[#44634B] text-white border-[#44634B]'
                          : 'bg-[#F7FAF5] dark:bg-[#161C17] border-[#E0E3DF] dark:border-[#2D382F]'
                      }`}
                    >
                      {tex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Optional Notes */}
            <div>
              <input
                type="text"
                value={diaperNotes}
                onChange={(e) => setDiaperNotes(e.target.value)}
                placeholder="Optional notes (e.g. yellow color, after feeding)"
                className="w-full py-2.5 px-3.5 rounded-xl border border-[#E0E3DF] dark:border-[#2D382F] bg-[#FAF8F5] dark:bg-[#161C17] text-xs font-medium min-h-[44px]"
              />
            </div>

            {/* 1-Tap Save Action */}
            <button
              type="button"
              onClick={handleSaveDiaper}
              className="tap-feedback w-full py-3.5 rounded-full bg-[#44634B] hover:bg-[#344738] text-white text-sm font-black shadow-md flex items-center justify-center gap-2 cursor-pointer min-h-[52px]"
            >
              <Check className="w-5 h-5" />
              <span>Save Diaper Change</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* --- 3. SLEEP LOGGER BOTTOM SHEET --- */}
      {isMounted && activeModal === 'sleep' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div className="w-full max-w-lg bg-white dark:bg-[#1C1B22] rounded-t-[32px] sm:rounded-3xl border border-[#E8E4DC] dark:border-[#2C2A34] p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto pb-[max(env(safe-area-inset-bottom,0px),24px)] animate-in slide-in-from-bottom duration-200">
            {/* Grab handle */}
            <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-600 rounded-full mx-auto" />

            <div className="flex items-center justify-between border-b border-[#E8E4DC] dark:border-[#2C2A34] pb-3">
              <h3 className="font-bold text-sm sm:text-base text-[#191C1A] dark:text-[#FAF8F5] flex items-center gap-2">
                <Moon className="w-5 h-5 text-[#55505C]" />
                <span>Log Nap &amp; Sleep</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="tap-feedback p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Option A: 1-Tap Start Live Nap Stopwatch */}
            <div className="p-3.5 rounded-2xl bg-[#F0EEEC] dark:bg-[#201F25] border border-[#E0DCD7] dark:border-[#35333E] flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black text-[#191C1A] dark:text-[#FAF8F5] block">
                  Baby just fell asleep?
                </span>
                <span className="text-[11px] text-[#75706B] dark:text-[#A8A29E] block">
                  Start live timer; tap to wake baby later
                </span>
              </div>
              <button
                type="button"
                onClick={handleStartLiveNap}
                className="tap-feedback px-4 py-2.5 rounded-full bg-[#44634B] hover:bg-[#344738] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer min-h-[48px]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Live Nap</span>
              </button>
            </div>

            {/* Option B: Presets for Completed Naps (30m, 45m, 1h, 1.5h, 2h) */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#75706B] dark:text-[#A8A29E] mb-1.5">
                Quick Duration Presets
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {SLEEP_PRESETS.map((p) => (
                  <button
                    key={p.minutes}
                    type="button"
                    onClick={() => setSleepPresetMinutes(p.minutes)}
                    className={`tap-feedback py-3 rounded-2xl border text-xs font-bold min-h-[48px] flex items-center justify-center cursor-pointer ${
                      sleepPresetMinutes === p.minutes
                        ? 'bg-[#44634B] text-white border-[#44634B] shadow-xs'
                        : 'bg-[#FAF8F5] dark:bg-[#161C17] border-[#E0E3DF] dark:border-[#2D382F] text-[#191C1A] dark:text-[#FAF8F5]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Nap Location */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#75706B] dark:text-[#A8A29E] mb-1.5">
                Sleep Location
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {['Crib', 'Bassinet', 'Contact Nap', 'Stroller'].map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setSleepLocation(loc)}
                    className={`tap-feedback py-2.5 rounded-xl border text-[11px] font-bold text-center min-h-[40px] ${
                      sleepLocation === loc
                        ? 'bg-[#44634B] text-white border-[#44634B]'
                        : 'bg-[#FAF8F5] dark:bg-[#161C17] border-[#E0E3DF] dark:border-[#2D382F]'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Notes */}
            <div>
              <input
                type="text"
                value={customSleepNotes}
                onChange={(e) => setCustomSleepNotes(e.target.value)}
                placeholder="Optional notes (e.g. self-soothed, fell asleep with shusher)"
                className="w-full py-2.5 px-3.5 rounded-xl border border-[#E0E3DF] dark:border-[#2D382F] bg-[#FAF8F5] dark:bg-[#161C17] text-xs font-medium min-h-[44px]"
              />
            </div>

            {/* 1-Tap Save Action */}
            <button
              type="button"
              onClick={() => handleSaveSleepRetrospective(sleepPresetMinutes)}
              className="tap-feedback w-full py-3.5 rounded-full bg-[#44634B] hover:bg-[#344738] text-white text-sm font-black shadow-md flex items-center justify-center gap-2 cursor-pointer min-h-[52px]"
            >
              <Check className="w-5 h-5" />
              <span>Save Nap Session ({sleepPresetMinutes} mins)</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
