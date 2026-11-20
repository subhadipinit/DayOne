'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Share2, Award, Clock, ChevronDown, ChevronUp, PartyPopper } from 'lucide-react';
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
      particleCount: 50,
      spread: 55,
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
    <div className="relative overflow-hidden bg-white dark:bg-[#1C1B22] rounded-3xl p-4 sm:p-5 shadow-xs border border-[#EAE6DF] dark:border-[#2C2A34] animate-reveal">
      
      {/* Top Birthday / Monthiversary Banner */}
      {(isBirthday || isMonthiversary) && (
        <div className="mb-3.5 px-3.5 py-2 rounded-2xl bg-[#FFF0E8] dark:bg-[#2D1F1A] border border-[#FCDCCB] dark:border-[#4A322A] text-[#8A3510] dark:text-[#FFB59E] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-[#D97757] shrink-0" />
            <span className="font-semibold truncate">
              {isBirthday
                ? `Milestone: ${profile.name} turns year ${years} today`
                : `Milestone: ${profile.name} completes ${months} months`}
            </span>
          </div>
          <button
            onClick={() => {
              fireConfetti();
              onOpenCelebration();
            }}
            className="tap-feedback text-xs font-semibold px-3 py-1 bg-white dark:bg-[#1C1B22] text-[#8A3510] dark:text-[#FFB59E] rounded-full border border-[#FCDCCB] dark:border-[#4A322A] hover:bg-[#FAF8F5] shrink-0 ml-2"
          >
            Celebrate
          </button>
        </div>
      )}

      {/* Main Hero Header: Ticker & Baby Card */}
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          
          {/* Calm Status Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full mb-1.5 bg-[#EDF5EE] dark:bg-[#1E3023] border border-[#CFE2D1] dark:border-[#2D4532]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#44634B] dark:bg-[#A8D1B0]" />
            <span className="text-[11px] font-semibold text-[#23522A] dark:text-[#A8D1B0] tabular-nums">
              {totalDays} days of wonder
            </span>
          </div>

          {/* Baby Name & Age */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-[#191C1A] dark:text-[#FAF8F5] tracking-tight">
              {profile.name}
            </h1>
            <span className="text-xs sm:text-sm font-medium text-[#75706B] dark:text-[#9E9892]">
              {years > 0 ? `${years}y ` : ''}{months} mos, {days} days
            </span>
          </div>

          {/* Vitals Summary Line */}
          <p className="text-xs text-[#75706B] dark:text-[#9E9892] mt-1 flex items-center gap-1.5 flex-wrap">
            <span>Weight: <strong className="font-semibold text-[#191C1A] dark:text-[#FAF8F5] tabular-nums">{currentWeightDisplay}</strong></span>
            <span>•</span>
            <span>Sleep: <strong className="text-[#44634B] dark:text-[#A8D1B0] font-semibold">On track</strong></span>
            <span>•</span>
            <span className="text-[#8A3510] dark:text-[#FFB59E] font-medium tabular-nums">{daysUntilNextMonthiversary}d to next milestone</span>
          </p>
        </div>

        {/* Baby Avatar Frame with Subtle Badge */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-0.5 bg-white dark:bg-[#202722] shadow-xs flex items-center justify-center border border-[#EAE6DF] dark:border-[#2D382F]">
            <div className="w-full h-full rounded-[14px] bg-[#E1EDE4] dark:bg-[#203D24] flex items-center justify-center overflow-hidden">
              <span className="text-xl sm:text-2xl font-bold text-[#344738] dark:text-[#A8D1B0]">
                {initial}
              </span>
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 bg-[#FFF0E6] text-[#8A3510] dark:bg-[#332522] dark:text-[#F8BCA0] border border-[#FCDCCB] dark:border-[#523A34] w-5 h-5 rounded-full shadow-xs flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-[#D97757]" />
          </span>
        </div>
      </div>

      {/* Milestone Highlight Strip */}
      <div className="mt-3.5 bg-[#FAF8F5] dark:bg-[#17161C] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 border border-[#EAE6DF]/70 dark:border-[#2C2A34]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-[#FFF0E6] dark:bg-[#2D1F1A] border border-[#FCDCCB]/60 dark:border-[#4A322A]/60 flex items-center justify-center shrink-0 text-[#D97757]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#201E1D] dark:text-[#FAF8F5] truncate">
              {totalWeeks} weeks {remDaysInWeek > 0 ? `+ ${remDaysInWeek}d` : ''} • Active growth
            </p>
            <p className="text-[11px] text-[#75706B] dark:text-[#9E9892] truncate mt-0.5">
              Milestones, rest cycles &amp; gentle care logged
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onOpenShareCard}
            className="tap-feedback p-2 rounded-xl bg-white dark:bg-[#201E26] text-[#44634B] dark:text-[#A8D1B0] hover:bg-[#E1EDE4] border border-[#EAE6DF] dark:border-[#2C2A34]"
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
            className="tap-feedback p-2 rounded-xl bg-white dark:bg-[#201E26] text-[#8A3510] dark:text-[#FFB59E] hover:bg-[#FFF0E6] border border-[#EAE6DF] dark:border-[#2C2A34]"
            title="Celebration"
          >
            <PartyPopper className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable Precision Breakdown */}
      <div className="mt-2.5 pt-2 border-t border-[#EAE6DF]/70 dark:border-[#2C2A34]/70">
        <button
          type="button"
          onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
          className="tap-feedback w-full flex items-center justify-between text-xs font-medium text-[#44634B] dark:text-[#A8D1B0] hover:opacity-85 py-0.5"
        >
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{isDetailsExpanded ? 'Hide precision clock' : 'View live precision clock'}</span>
          </span>
          {isDetailsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {isDetailsExpanded && (
          <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5 animate-reveal">
            <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#17161C] border border-[#EAE6DF] dark:border-[#2C2A34] text-center">
              <span className="text-[10px] font-medium text-[#75706B] dark:text-[#9E9892]">Total weeks</span>
              <p className="text-sm font-semibold text-[#191C1A] dark:text-[#FAF8F5] tabular-nums mt-0.5">
                {totalWeeks}w {remDaysInWeek}d
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#17161C] border border-[#EAE6DF] dark:border-[#2C2A34] text-center">
              <span className="text-[10px] font-medium text-[#75706B] dark:text-[#9E9892]">Total hours</span>
              <p className="text-sm font-semibold text-[#191C1A] dark:text-[#FAF8F5] tabular-nums mt-0.5">
                {totalHours.toLocaleString()}h
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#17161C] border border-[#EAE6DF] dark:border-[#2C2A34] text-center">
              <span className="text-[10px] font-medium text-[#75706B] dark:text-[#9E9892]">Total minutes</span>
              <p className="text-sm font-semibold text-[#191C1A] dark:text-[#FAF8F5] tabular-nums mt-0.5">
                {totalMinutes.toLocaleString()}m
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#EDF5EE] dark:bg-[#1E3023] border border-[#CFE2D1] dark:border-[#2D4532] text-center">
              <span className="text-[10px] font-medium text-[#23522A] dark:text-[#A8D1B0]">Live seconds</span>
              <p className="text-sm font-semibold text-[#44634B] dark:text-[#A8D1B0] tabular-nums mt-0.5">
                {seconds}s
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
