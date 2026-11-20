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
  Wind,
  Sparkles,
  Utensils,
  Heart,
  Calendar,
  ChevronRight,
  ArrowRight,
  Timer,
  Check,
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
  // --- BREASTFEEDING TIMER STATE ---
  const [activeSide, setActiveSide] = useState<'left' | 'right' | null>(null);
  const [leftSeconds, setLeftSeconds] = useState<number>(0);
  const [rightSeconds, setRightSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // --- MANUAL BOTTLE FORM ---
  const [bottleMl, setBottleMl] = useState<string>('120');
  const [showBottleModal, setShowBottleModal] = useState<boolean>(false);

  // --- MANUAL SLEEP FORM ---
  const [sleepMinutes, setSleepMinutes] = useState<string>('45');

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
    onAddFeedingLog({
      childId,
      timestamp: new Date().toISOString(),
      type: 'breast',
      leftDurationMinutes: Math.round(leftSeconds / 60),
      rightDurationMinutes: Math.round(rightSeconds / 60),
      notes: `Left: ${Math.round(leftSeconds / 60)}m, Right: ${Math.round(rightSeconds / 60)}m`,
    });
    handleResetTimer();
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
    setShowBottleModal(false);
  };

  const handleQuickDiaper = (type: 'wet' | 'dirty' | 'both') => {
    onAddDiaperLog({
      childId,
      timestamp: new Date().toISOString(),
      type,
    });
  };

  const handleSaveSleep = () => {
    const mins = parseInt(sleepMinutes) || 30;
    onAddSleepLog({
      childId,
      startTime: new Date(Date.now() - mins * 60 * 1000).toISOString(),
      endTime: new Date().toISOString(),
      durationMinutes: mins,
      notes: `Nap: ${mins} minutes`,
    });
  };

  // --- STATS CALCULATIONS ---
  const lastFeed = feedingLogs[feedingLogs.length - 1];
  const lastDiaper = diaperLogs[diaperLogs.length - 1];
  const wetCount = diaperLogs.filter((d) => d.type === 'wet' || d.type === 'both').length;
  const dirtyCount = diaperLogs.filter((d) => d.type === 'dirty' || d.type === 'both').length;
  const totalSleepMinutes = sleepLogs.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const sleepHours = Math.floor(totalSleepMinutes / 60);
  const sleepMinsRem = totalSleepMinutes % 60;

  const getTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'No feeds yet';
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
    <div className="space-y-5">
      {/* 1. Quick Log Action Grid (Direct from Stitch Mockup) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-sm font-semibold tracking-tight text-on-surface dark:text-[#FAF8F5]">
            Quick Log
          </h2>
          <span className="text-[11px] font-medium text-on-surface-variant dark:text-[#9E9892]">
            Tap to record
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {/* Feeding Action Button */}
          <button
            type="button"
            onClick={() => {
              if (activeSide) {
                setIsTimerRunning(!isTimerRunning);
              } else {
                handleStartTimer('left');
              }
            }}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FFF0E6] dark:bg-[#2D2422] border border-[#FCDCCB] dark:border-[#543830] hover:bg-[#FCDCCB]/60 active:scale-95 transition-all text-center gap-1.5 shadow-xs group"
          >
            <div className="w-10 h-10 rounded-full bg-white dark:bg-[#1D1C22] flex items-center justify-center text-[#D97757] shadow-xs group-hover:scale-105 transition-transform">
              <Milk className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-on-surface dark:text-[#FAF8F5]">
              Feeding
            </span>
          </button>

          {/* Diaper Action Button */}
          <button
            type="button"
            onClick={() => handleQuickDiaper('wet')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#EDF5EE] dark:bg-[#1F2B21] border border-[#CFE2D1] dark:border-[#2D4231] hover:bg-[#CFE2D1]/60 active:scale-95 transition-all text-center gap-1.5 shadow-xs group"
          >
            <div className="w-10 h-10 rounded-full bg-white dark:bg-[#1D1C22] flex items-center justify-center text-[#44634B] shadow-xs group-hover:scale-105 transition-transform">
              <Droplets className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-on-surface dark:text-[#FAF8F5]">
              Diaper
            </span>
          </button>

          {/* Sleep Action Button */}
          <button
            type="button"
            onClick={handleSaveSleep}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#F4F0FB] dark:bg-[#221C2B] border border-[#E0D4F5] dark:border-[#372A4A] hover:bg-[#E0D4F5]/60 active:scale-95 transition-all text-center gap-1.5 shadow-xs group"
          >
            <div className="w-10 h-10 rounded-full bg-white dark:bg-[#1D1C22] flex items-center justify-center text-[#8E6DC5] shadow-xs group-hover:scale-105 transition-transform">
              <Moon className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-on-surface dark:text-[#FAF8F5]">
              Sleep
            </span>
          </button>

          {/* Tummy Time Action Button */}
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('tummy')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FDF6E2] dark:bg-[#2A2318] border border-[#F6E6B8] dark:border-[#4B3C23] hover:bg-[#F6E6B8]/60 active:scale-95 transition-all text-center gap-1.5 shadow-xs group"
          >
            <div className="w-10 h-10 rounded-full bg-white dark:bg-[#1D1C22] flex items-center justify-center text-[#D4A02A] shadow-xs group-hover:scale-105 transition-transform">
              <Timer className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-on-surface dark:text-[#FAF8F5]">
              Tummy
            </span>
          </button>
        </div>
      </div>

      {/* 2. Today at a Glance Bento Grid (Direct from Stitch Mockup) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-sm font-semibold tracking-tight text-on-surface dark:text-[#FAF8F5]">
            Today at a Glance
          </h2>
          <div className="flex items-center gap-1 bg-[#C8EBCC] dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1] px-2.5 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3 text-[#44634B]" />
            <span className="text-[11px] font-bold">Goal 85%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Card 1: Last Feed */}
          <div className="bg-white dark:bg-[#1D1C22] p-3.5 rounded-2xl border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs flex flex-col justify-between space-y-2">
            <div className="flex items-start justify-between">
              <div className="w-7 h-7 rounded-full bg-[#FFF0E6] dark:bg-[#2D2422] flex items-center justify-center text-[#D97757]">
                <Milk className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-medium text-on-surface-variant dark:text-[#9E9892]">
                {getTimeAgo(lastFeed?.timestamp)}
              </span>
            </div>
            <div>
              <span className="text-xl font-bold text-on-surface dark:text-[#FAF8F5] block leading-tight">
                {lastFeed?.type === 'bottle' ? `${lastFeed.bottleAmountMl} ml` : 'Nursing'}
              </span>
              <span className="text-xs font-medium text-[#D97757] block">
                {lastFeed?.type === 'bottle' ? 'Expressed / Formula' : 'Breastmilk'}
              </span>
            </div>
            <div className="bg-[#FAF8F5] dark:bg-[#17161B] px-2 py-1 rounded-xl flex items-center gap-1 text-on-surface-variant dark:text-[#9E9892]">
              <Check className="w-3 h-3 text-[#D97757]" />
              <span className="text-[10px] truncate">
                {lastFeed ? lastFeed.notes || 'Routine Feed' : 'Ready for next feed'}
              </span>
            </div>
          </div>

          {/* Card 2: Diapers */}
          <div className="bg-white dark:bg-[#1D1C22] p-3.5 rounded-2xl border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs flex flex-col justify-between space-y-2">
            <div className="flex items-start justify-between">
              <div className="w-7 h-7 rounded-full bg-[#EDF5EE] dark:bg-[#1F2B21] flex items-center justify-center text-[#44634B]">
                <Droplets className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-medium text-on-surface-variant dark:text-[#9E9892]">
                {getTimeAgo(lastDiaper?.timestamp)}
              </span>
            </div>
            <div>
              <span className="text-xl font-bold text-on-surface dark:text-[#FAF8F5] block leading-tight">
                {diaperLogs.length} Changed
              </span>
              <span className="text-xs font-medium text-[#44634B] block">
                {wetCount} Wet, {dirtyCount} Dirty
              </span>
            </div>
            <div className="flex items-center gap-1.5 py-1 px-1">
              {Array.from({ length: Math.min(5, diaperLogs.length || 1) }).map((_, idx) => (
                <span
                  key={idx}
                  className={`w-2 h-2 rounded-full ${
                    idx < wetCount ? 'bg-[#44634B]' : 'bg-[#D97757]'
                  }`}
                />
              ))}
              <span className="text-[10px] text-on-surface-variant dark:text-[#9E9892] ml-auto font-medium">
                Healthy
              </span>
            </div>
          </div>

          {/* Card 3: Sleep */}
          <div className="bg-white dark:bg-[#1D1C22] p-3.5 rounded-2xl border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs flex flex-col justify-between space-y-2">
            <div className="flex items-start justify-between">
              <div className="w-7 h-7 rounded-full bg-[#F4F0FB] dark:bg-[#221C2B] flex items-center justify-center text-[#8E6DC5]">
                <Moon className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold bg-[#EDF5EE] dark:bg-[#1F2B21] text-[#44634B] dark:text-[#ADCFB1] px-1.5 py-0.5 rounded-full">
                {sleepLogs.length > 0 ? `Nap ${sleepLogs.length} done` : 'Rest window'}
              </span>
            </div>
            <div>
              <span className="text-xl font-bold text-on-surface dark:text-[#FAF8F5] block leading-tight">
                {sleepHours > 0 ? `${sleepHours}h ` : ''}{sleepMinsRem}m
              </span>
              <span className="text-xs font-medium text-on-surface-variant dark:text-[#9E9892] block">
                Total Rest Today
              </span>
            </div>
            <div className="bg-[#FAF8F5] dark:bg-[#17161B] px-2 py-1 rounded-xl flex items-center justify-between text-on-surface-variant dark:text-[#9E9892]">
              <span className="text-[10px]">Next wake window:</span>
              <span className="text-[10px] font-bold text-on-surface dark:text-[#FAF8F5]">~1h 15m</span>
            </div>
          </div>

          {/* Card 4: Tummy Time */}
          <div className="bg-white dark:bg-[#1D1C22] p-3.5 rounded-2xl border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs flex flex-col justify-between space-y-2">
            <div className="flex items-start justify-between">
              <div className="w-7 h-7 rounded-full bg-[#FDF6E2] dark:bg-[#2A2318] flex items-center justify-center text-[#D4A02A]">
                <Timer className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-[#D4A02A]">83%</span>
            </div>
            <div>
              <span className="text-xl font-bold text-on-surface dark:text-[#FAF8F5] block leading-tight">
                25 <span className="text-xs font-normal text-on-surface-variant dark:text-[#9E9892]">/ 30m</span>
              </span>
              <span className="text-xs font-medium text-on-surface-variant dark:text-[#9E9892] block">
                Tummy Goal
              </span>
            </div>
            <div className="space-y-1">
              <div className="w-full h-1.5 bg-[#EAE6DF] dark:bg-[#2D2B33] rounded-full overflow-hidden">
                <div className="bg-[#D4A02A] h-full rounded-full w-[83%]" />
              </div>
              <div className="flex justify-between items-center text-[10px] text-on-surface-variant dark:text-[#9E9892]">
                <span>5m to goal</span>
                <span className="font-semibold text-[#D4A02A]">almost there</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Alert / Upcoming Pediatrician Visit Card (Direct from Stitch Mockup) */}
      <div className="bg-[#F1F4F0] dark:bg-[#1A241C] border border-[#CFE2D1] dark:border-[#2D4231] rounded-2xl p-4 shadow-xs relative overflow-hidden">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFDBD0] dark:bg-[#3D251C] flex items-center justify-center text-[#99462A] dark:text-[#FFB59E] shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#99462A] dark:text-[#FFB59E] block">
              Upcoming Visit
            </span>
            <h3 className="text-sm font-bold text-on-surface dark:text-[#FAF8F5] leading-snug mt-0.5">
              6-Month Pediatrician Checkup & Vaccines
            </h3>
            <p className="text-xs text-on-surface-variant dark:text-[#9E9892] mt-0.5">
              Next Tuesday, 10:00 AM • Dr. Morrison at Westside Pediatrics
            </p>
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('vaccines')}
                className="inline-flex items-center gap-1.5 bg-[#44634B] hover:bg-[#38533E] text-white px-3.5 py-1.5 rounded-full text-xs font-semibold active:scale-[0.97] transition-all shadow-xs"
              >
                <span>View Details & Records</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Action Bento Panels: Detailed Nursing, Diapers & Sleep */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Nursing Timer Panel */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF0E6] dark:bg-[#2D2422] flex items-center justify-center text-[#E2765A]">
                  <Baby className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm text-[#201E1D] dark:text-[#FAF8F5]">
                  Nursing Timer
                </h3>
              </div>
              <span className="text-[10px] font-medium tracking-tight text-[#8A3510] dark:text-[#F8BCA0] bg-[#FFF0E6] dark:bg-[#2D2422] border border-[#FCDCCB] dark:border-[#543830] px-2 py-0.5 rounded-full">
                Left / Right
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div
                onClick={() => userRole === 'parent' && handleStartTimer('left')}
                className={`cursor-pointer p-3.5 rounded-xl border text-center transition-all duration-150 ${
                  activeSide === 'left' && isTimerRunning
                    ? 'bg-[#FFF0E6] dark:bg-[#2D2422] text-[#8A3510] dark:text-[#F8BCA0] border-2 border-[#E2765A] shadow-xs'
                    : 'bg-[#FAF8F5] dark:bg-[#17161B] border-[#EAE6DF] dark:border-[#2D2B33] hover:bg-[#F2ECE3] dark:hover:bg-[#201E26]'
                }`}
              >
                <span className={`text-[10px] font-semibold uppercase tracking-wider block mb-1 ${
                  activeSide === 'left' && isTimerRunning ? 'text-[#CB6145] dark:text-[#F1997A]' : 'text-[#75706B] dark:text-[#9E9892]'
                }`}>
                  Left Breast
                </span>
                <span className="text-2xl font-bold tabular-nums">
                  {formatTimer(leftSeconds)}
                </span>
                {activeSide === 'left' && isTimerRunning && (
                  <span className="text-[10px] font-semibold tracking-wide block mt-1 text-[#5A9663]">
                    ● Nursing
                  </span>
                )}
              </div>

              <div
                onClick={() => userRole === 'parent' && handleStartTimer('right')}
                className={`cursor-pointer p-3.5 rounded-xl border text-center transition-all duration-150 ${
                  activeSide === 'right' && isTimerRunning
                    ? 'bg-[#FFF0E6] dark:bg-[#2D2422] text-[#8A3510] dark:text-[#F8BCA0] border-2 border-[#E2765A] shadow-xs'
                    : 'bg-[#FAF8F5] dark:bg-[#17161B] border-[#EAE6DF] dark:border-[#2D2B33] hover:bg-[#F2ECE3] dark:hover:bg-[#201E26]'
                }`}
              >
                <span className={`text-[10px] font-semibold uppercase tracking-wider block mb-1 ${
                  activeSide === 'right' && isTimerRunning ? 'text-[#CB6145] dark:text-[#F1997A]' : 'text-[#75706B] dark:text-[#9E9892]'
                }`}>
                  Right Breast
                </span>
                <span className="text-2xl font-bold tabular-nums">
                  {formatTimer(rightSeconds)}
                </span>
                {activeSide === 'right' && isTimerRunning && (
                  <span className="text-[10px] font-semibold tracking-wide block mt-1 text-[#5A9663]">
                    ● Nursing
                  </span>
                )}
              </div>
            </div>
          </div>

          {userRole === 'parent' ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                {isTimerRunning ? (
                  <button
                    onClick={handlePauseTimer}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-xs bg-[#4D4845] hover:bg-[#33302D] text-white flex items-center justify-center gap-1.5 transition-colors duration-150 active:scale-[0.98]"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartTimer(activeSide || 'left')}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-xs bg-[#44634B] text-white hover:bg-[#38533E] shadow-xs flex items-center justify-center gap-1.5 transition-colors duration-150 active:scale-[0.98]"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{leftSeconds > 0 || rightSeconds > 0 ? 'Resume' : 'Start Timer'}</span>
                  </button>
                )}

                <button
                  onClick={handleResetTimer}
                  className="p-2.5 rounded-xl bg-[#F2ECE3] dark:bg-[#26242C] text-[#75706B] dark:text-[#DDD8D0] hover:bg-[#EAE6DF] dark:hover:bg-[#312E38] transition-colors duration-150 active:scale-[0.97]"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {(leftSeconds > 0 || rightSeconds > 0) && (
                <button
                  onClick={handleSaveFeed}
                  className="w-full py-2.5 rounded-xl font-semibold text-xs bg-[#EDF5EE] text-[#23522A] border border-[#CFE2D1] hover:bg-[#E1EFE3] transition-colors duration-150 active:scale-[0.98]"
                >
                  Save Feed ({Math.round((leftSeconds + rightSeconds) / 60)} min)
                </button>
              )}

              <button
                onClick={() => setShowBottleModal(true)}
                className="w-full text-center text-xs text-[#E2765A] hover:text-[#CB6145] pt-1 font-semibold"
              >
                + Log Expressed Milk or Bottle (ml)
              </button>
            </div>
          ) : (
            <p className="text-xs text-[#75706B] text-center">View-only mode</p>
          )}
        </div>

        {/* Diaper Quick-Log Panel */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EEF5FC] dark:bg-[#172330] flex items-center justify-center text-[#5393CE]">
                  <Droplets className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm text-[#201E1D] dark:text-[#FAF8F5]">
                  Diaper Log
                </h3>
              </div>
              <span className="text-[10px] font-medium tracking-tight text-[#184F7D] dark:text-[#A9CBED] bg-[#EEF5FC] dark:bg-[#172330] border border-[#D1E3F6] dark:border-[#233A50] px-2 py-0.5 rounded-full">
                Target: 6+ / day
              </span>
            </div>

            <p className="text-xs text-[#75706B] dark:text-[#9E9892] mb-4">
              Track urinary and bowel frequency to evaluate newborn hydration and digestive regularity.
            </p>

            {userRole === 'parent' ? (
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                <button
                  onClick={() => handleQuickDiaper('wet')}
                  className="p-3.5 rounded-xl border border-[#D1E3F6] dark:border-[#233A50] bg-[#EEF5FC] dark:bg-[#172330] hover:bg-[#E2F0FB] dark:hover:bg-[#1D2C3D] text-center transition-colors duration-150 active:scale-[0.98]"
                >
                  <Droplets className="w-4 h-4 mx-auto mb-1 text-[#5393CE]" />
                  <span className="text-xs font-semibold text-[#184F7D] dark:text-[#A9CBED] block">Wet</span>
                </button>

                <button
                  onClick={() => handleQuickDiaper('dirty')}
                  className="p-3.5 rounded-xl border border-[#F6E6B8] dark:border-[#42371E] bg-[#FDF6E2] dark:bg-[#292416] hover:bg-[#F9EDC7] dark:hover:bg-[#332C1B] text-center transition-colors duration-150 active:scale-[0.98]"
                >
                  <span className="text-xs font-bold text-[#6E4D05] dark:text-[#EECD85] block mb-1">BM</span>
                  <span className="text-xs font-semibold text-[#6E4D05] dark:text-[#EECD85] block">Dirty</span>
                </button>

                <button
                  onClick={() => handleQuickDiaper('both')}
                  className="p-3.5 rounded-xl border border-[#E0D4F5] dark:border-[#372A4A] bg-[#F4F0FB] dark:bg-[#221C2B] hover:bg-[#ECE4F8] dark:hover:bg-[#2A2335] text-center transition-colors duration-150 active:scale-[0.98]"
                >
                  <span className="text-xs font-bold text-[#522F88] dark:text-[#C6B2EA] block mb-1">W+D</span>
                  <span className="text-xs font-semibold text-[#522F88] dark:text-[#C6B2EA] block">Both</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-[#75706B] text-center">View-only mode</p>
            )}
          </div>

          <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-center">
            <span className="text-xs text-[#75706B] dark:text-[#9E9892]">
              Logged events today: <span className="font-bold text-[#201E1D] dark:text-[#FAF8F5]">{diaperLogs.length}</span>
            </span>
          </div>
        </div>

        {/* Sleep Tracker Panel */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F4F0FB] dark:bg-[#221C2B] flex items-center justify-center text-[#8E6DC5]">
                  <Moon className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm text-[#201E1D] dark:text-[#FAF8F5]">
                  Sleep & Naps
                </h3>
              </div>
              <span className="text-[10px] font-medium tracking-tight text-[#522F88] dark:text-[#C6B2EA] bg-[#F4F0FB] dark:bg-[#221C2B] border border-[#E0D4F5] dark:border-[#372A4A] px-2 py-0.5 rounded-full">
                Rest Cycles
              </span>
            </div>

            <p className="text-xs text-[#75706B] dark:text-[#9E9892] mb-4">
              Track sleep duration across daytime naps and overnight rest intervals.
            </p>

            {userRole === 'parent' ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={sleepMinutes}
                    onChange={(e) => setSleepMinutes(e.target.value)}
                    className="w-24 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5] focus:ring-1 focus:ring-[#8E6DC5]"
                  />
                  <span className="text-xs text-[#75706B] dark:text-[#9E9892]">Minutes nap duration</span>
                </div>

                <button
                  onClick={handleSaveSleep}
                  className="w-full py-2.5 rounded-xl font-semibold text-xs bg-[#8E6DC5] text-white hover:bg-[#7B58B5] flex items-center justify-center gap-1.5 shadow-xs transition-colors duration-150 active:scale-[0.98]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Nap ({sleepMinutes}m)</span>
                </button>

                {onOpenShusher && (
                  <button
                    type="button"
                    onClick={onOpenShusher}
                    className="w-full py-2 rounded-xl font-medium text-xs bg-[#F4F0FB] dark:bg-[#251E30] text-[#522F88] dark:text-[#C6B2EA] hover:bg-[#EAE2F7] dark:hover:bg-[#312642] border border-[#E0D4F5] dark:border-[#3E2E55] flex items-center justify-center gap-1.5 transition-colors duration-150"
                  >
                    <Wind className="w-3.5 h-3.5" />
                    <span>Play White Noise / Shusher</span>
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#75706B] text-center">View-only mode</p>
            )}
          </div>

          <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-center">
            <span className="text-xs text-[#75706B] dark:text-[#9E9892]">
              Total Recorded Rest: <span className="font-bold text-[#201E1D] dark:text-[#FAF8F5]">{totalSleepMinutes} min</span>
            </span>
          </div>
        </div>
      </div>

      {/* 5. Recent Care History Timeline */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider">
            Recent Activity ({careTimeline.length})
          </h4>
          <span className="text-[11px] text-[#44634B] dark:text-[#ADCFB1] font-semibold">
            Chronological
          </span>
        </div>

        {careTimeline.length === 0 ? (
          <p className="text-xs text-[#75706B] text-center py-5">
            No entries logged today yet. Record feeds, diapers, or naps above.
          </p>
        ) : (
          <div className="divide-y divide-[#EAE6DF] dark:divide-[#2D2B33]">
            {careTimeline.slice(0, 8).map((ev) => {
              const dateStr = new Date(ev.time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={ev.id}
                  className="flex items-center justify-between py-2.5 text-xs transition-colors duration-150 hover:bg-[#FAF8F5] dark:hover:bg-[#17161B] px-2 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        ev.eventType === 'feed'
                          ? 'bg-[#FFF0E6] dark:bg-[#2D2422] text-[#D97757]'
                          : ev.eventType === 'diaper'
                          ? 'bg-[#EDF5EE] dark:bg-[#1F2B21] text-[#44634B]'
                          : 'bg-[#F4F0FB] dark:bg-[#221C2B] text-[#8E6DC5]'
                      }`}
                    >
                      {ev.eventType === 'feed' ? (
                        <Milk className="w-4 h-4" />
                      ) : ev.eventType === 'diaper' ? (
                        <Droplets className="w-4 h-4" />
                      ) : (
                        <Moon className="w-4 h-4" />
                      )}
                    </span>
                    <div>
                      <p className="font-semibold text-on-surface dark:text-[#FAF8F5]">
                        {ev.eventType === 'feed'
                          ? ev.type === 'breast'
                            ? `Breastfeeding • ${ev.leftDurationMinutes || 0}m L / ${ev.rightDurationMinutes || 0}m R`
                            : `Bottle Feed • ${ev.bottleAmountMl} ml`
                          : ev.eventType === 'diaper'
                          ? `Diaper Change • ${ev.type}`
                          : `Nap • ${ev.durationMinutes} min`}
                      </p>
                      <p className="text-[11px] text-on-surface-variant dark:text-[#9E9892]">{dateStr}</p>
                    </div>
                  </div>

                  {userRole === 'parent' && (
                    <button
                      onClick={() => {
                        if (ev.eventType === 'feed') onDeleteFeedingLog(ev.id);
                        else if (ev.eventType === 'diaper') onDeleteDiaperLog(ev.id);
                      }}
                      className="p-1.5 text-[#75706B] hover:text-[#CB6145] dark:hover:text-[#F1997A] transition-colors rounded-lg"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottle Feeding Modal */}
      {showBottleModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#1D1C22] border-t sm:border border-[#EAE6DF] dark:border-[#2D2B33] p-5 shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="sm:hidden w-10 h-1 rounded-full bg-[#D5CFCE] dark:bg-[#3D3B44] mx-auto mb-3" />

            <h4 className="text-sm font-bold text-on-surface dark:text-[#FAF8F5] mb-2">
              Log Bottle Feed
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-on-surface-variant dark:text-[#9E9892] mb-1 font-semibold">
                  Volume (ml)
                </label>
                <input
                  type="number"
                  step="5"
                  inputMode="numeric"
                  value={bottleMl}
                  onChange={(e) => setBottleMl(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm font-semibold bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-on-surface dark:text-[#FAF8F5]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBottleModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-xs border border-[#EAE6DF] dark:border-[#2D2B33] text-[#4D4845] dark:text-[#DDD8D0] hover:bg-[#F2ECE3] dark:hover:bg-[#26242C] transition-colors active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBottle}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-xs bg-[#44634B] text-white hover:bg-[#38533E] transition-colors active:scale-[0.98]"
                >
                  Save Feed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
