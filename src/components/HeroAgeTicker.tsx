'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Share2, Award, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChildProfile, GrowthRecord } from '@/lib/types';

interface HeroAgeTickerProps {
  profile: ChildProfile;
  latestGrowth?: GrowthRecord;
  onOpenShareCard: () => void;
  onOpenCelebration: () => void;
}

export const HeroAgeTicker: React.FC<HeroAgeTickerProps> = ({
  profile,
  latestGrowth,
  onOpenShareCard,
  onOpenCelebration,
}) => {
  const [now, setNow] = useState<Date>(new Date());
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(false);

  // Update live ticking clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const birthDate = new Date(profile.dob);
  const diffMs = Math.max(0, now.getTime() - birthDate.getTime());

  // Precision breakdown
  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  // Calculate Calendar Months and Days
  let years = now.getFullYear() - birthDate.getFullYear();
  let months = now.getMonth() - birthDate.getMonth();
  let days = now.getDate() - birthDate.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;
  const totalWeeks = Math.floor(totalDays / 7);
  const remDaysInWeek = totalDays % 7;

  // Birthday & Milestone calculations
  const isBirthday = now.getMonth() === birthDate.getMonth() && now.getDate() === birthDate.getDate();
  const isMonthiversary = now.getDate() === birthDate.getDate() && totalDays > 0;

  let nextMilestoneDate = new Date(now.getFullYear(), now.getMonth(), birthDate.getDate());
  if (nextMilestoneDate <= now) {
    nextMilestoneDate = new Date(now.getFullYear(), now.getMonth() + 1, birthDate.getDate());
  }
  const daysUntilNextMonthiversary = Math.ceil((nextMilestoneDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const fireConfetti = () => {
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#44634B', '#D97757', '#EBB04D', '#5C7C62', '#FE9572'],
    });
  };

  const currentWeightDisplay = latestGrowth
    ? `${latestGrowth.weightKg} kg`
    : profile.birthWeightKg > 0
    ? `${profile.birthWeightKg} kg`
    : '18.4 lbs';
  const initial = profile?.name ? profile.name.trim().charAt(0).toUpperCase() : 'B';

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#F1F4F0] via-[#ECEFEA] to-[#E6E9E4] dark:from-[#1A221C] dark:via-[#161D18] dark:to-[#121713] rounded-[28px] p-5 shadow-sm border border-[#E0E3DF] dark:border-[#2D382F] animate-reveal">
      
      {/* Top Birthday / Monthiversary Banner */}
      {(isBirthday || isMonthiversary) && (
        <div className="mb-4 px-4 py-2.5 rounded-2xl bg-[#FFDBD0] dark:bg-[#3E1C12] border border-[#FE9572]/50 text-[#762C12] dark:text-[#FFB59E] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#99462A] shrink-0" />
            <span className="font-semibold truncate">
              {isBirthday
                ? `Birthday Milestone: ${profile.name} completes year ${years}!`
                : `Month Milestone: ${profile.name} completes ${months} months!`}
            </span>
          </div>
          <button
            onClick={() => {
              fireConfetti();
              onOpenCelebration();
            }}
            className="text-xs font-semibold px-3 py-1 bg-white dark:bg-[#201E26] text-[#99462A] dark:text-[#FFB59E] rounded-full border border-[#FE9572]/40 hover:bg-[#FFF7F2] shrink-0 ml-2 transition-all active:scale-[0.98]"
          >
            Wishes 🎉
          </button>
        </div>
      )}

      {/* Main Hero Header: Ticker & Baby Card */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          
          {/* Shimmer Pill Badge: DAYS OF WONDER */}
          <div className="inline-flex items-center gap-1.5 pill-shimmer px-3 py-1 rounded-full mb-2 shadow-2xs border border-[#44634B]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#44634B] status-dot-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#03210E] dark:text-[#ADCFB1]">
              {totalDays} DAYS OF WONDER
            </span>
          </div>

          {/* Baby Name & Age */}
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191C1A] dark:text-[#FAF8F5] tracking-tight">
              {profile.name}
            </h1>
            <span className="text-xs sm:text-sm font-semibold text-[#424842] dark:text-[#9E9892]">
              {years > 0 ? `${years}y ` : ''}{months} mos, {days} days
            </span>
          </div>

          {/* Vitals Summary Line */}
          <p className="text-xs sm:text-[13px] text-[#424842] dark:text-[#A8A29E] mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span>Weight: <strong className="font-bold text-[#191C1A] dark:text-[#FAF8F5]">{currentWeightDisplay}</strong></span>
            <span>•</span>
            <span>Sleep: <strong className="text-[#44634B] dark:text-[#ADCFB1] font-bold">On track</strong></span>
            <span>•</span>
            <span className="text-[#99462A] dark:text-[#FFB59E] font-medium">{daysUntilNextMonthiversary}d to next milestone</span>
          </p>
        </div>

        {/* Baby Avatar Frame with Sun Badge */}
        <div className="relative shrink-0">
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-[24px] p-1 bg-white dark:bg-[#202722] shadow-sm flex items-center justify-center border border-[#E0E3DF] dark:border-[#2D382F]">
            <div className="w-full h-full rounded-[20px] bg-[#C8EBCC] dark:bg-[#243528] flex items-center justify-center overflow-hidden">
              <span className="text-2xl sm:text-3xl font-black text-[#03210E] dark:text-[#ADCFB1]">
                {initial}
              </span>
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 bg-[#FE9572] text-[#762C12] text-xs font-bold w-6 h-6 rounded-full shadow-sm sun-badge-pulse flex items-center justify-center cursor-default select-none">
            ☀️
          </span>
        </div>
      </div>

      {/* Milestone Highlight Pill (Stitch Component) */}
      <div className="mt-4 bg-white/90 dark:bg-[#1D251F]/90 backdrop-blur-md rounded-2xl p-3 flex items-start gap-2.5 shadow-2xs border border-[#E0E3DF]/60 dark:border-[#2D382F]">
        <div className="w-7 h-7 rounded-full bg-[#FFDBD0] dark:bg-[#3E1C12] flex items-center justify-center shrink-0 mt-0.5 text-[#99462A] dark:text-[#FFB59E]">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-[#99462A] dark:text-[#FFB59E]">
              Joyful Growth Journey 🐾
            </span>
            <span className="text-[10px] text-[#727972] dark:text-[#8D968D]">
              • {totalWeeks} weeks {remDaysInWeek > 0 ? `+ ${remDaysInWeek}d` : ''}
            </span>
          </div>
          <p className="text-[11.5px] text-[#424842] dark:text-[#A8A29E] truncate mt-0.5">
            Active milestones, healthy rest cycles & smiling interactions logged
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onOpenShareCard}
            className="p-1.5 rounded-full bg-[#F1F4F0] dark:bg-[#243026] text-[#44634B] dark:text-[#ADCFB1] hover:bg-[#C8EBCC] transition-colors"
            title="Share Milestone"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              fireConfetti();
              onOpenCelebration();
            }}
            className="p-1.5 rounded-full bg-[#F1F4F0] dark:bg-[#243026] text-[#99462A] dark:text-[#FFB59E] hover:bg-[#FFDBD0] transition-colors"
            title="Celebration"
          >
            <Award className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable Precision Breakdown */}
      <div className="mt-3 pt-2 border-t border-[#E0E3DF]/70 dark:border-[#2D382F]/70">
        <button
          type="button"
          onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
          className="w-full flex items-center justify-between text-xs font-semibold text-[#44634B] dark:text-[#ADCFB1] hover:underline"
        >
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{isDetailsExpanded ? 'Hide Precision Age' : 'View Live Precision Clock & Detailed Days'}</span>
          </span>
          {isDetailsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {isDetailsExpanded && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 animate-in fade-in duration-200">
            <div className="p-2.5 rounded-2xl bg-white/70 dark:bg-[#1D251F]/70 border border-[#E0E3DF] dark:border-[#2D382F] text-center">
              <span className="text-[10px] uppercase font-bold text-[#727972] dark:text-[#8D968D]">Total Weeks</span>
              <p className="text-base font-black text-[#191C1A] dark:text-[#FAF8F5] tabular-nums mt-0.5">
                {totalWeeks}w {remDaysInWeek}d
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/70 dark:bg-[#1D251F]/70 border border-[#E0E3DF] dark:border-[#2D382F] text-center">
              <span className="text-[10px] uppercase font-bold text-[#727972] dark:text-[#8D968D]">Total Hours</span>
              <p className="text-base font-black text-[#191C1A] dark:text-[#FAF8F5] tabular-nums mt-0.5">
                {totalHours.toLocaleString()}h
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/70 dark:bg-[#1D251F]/70 border border-[#E0E3DF] dark:border-[#2D382F] text-center">
              <span className="text-[10px] uppercase font-bold text-[#727972] dark:text-[#8D968D]">Total Minutes</span>
              <p className="text-base font-black text-[#191C1A] dark:text-[#FAF8F5] tabular-nums mt-0.5">
                {totalMinutes.toLocaleString()}m
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#C8EBCC]/60 dark:bg-[#203D24]/60 border border-[#44634B]/30 text-center">
              <span className="text-[10px] uppercase font-bold text-[#03210E] dark:text-[#ADCFB1]">Live Seconds</span>
              <p className="text-base font-black text-[#44634B] dark:text-[#ADCFB1] tabular-nums mt-0.5">
                {seconds}s
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
