'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Heart, Sparkles, Share2, Award, Clock, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showLiveSeconds, setShowLiveSeconds] = useState<boolean>(false);
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

  // Next month-iversary date
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
      colors: ['#E2765A', '#F6C85F', '#5A9663', '#5393CE', '#8E6DC5'],
    });
  };

  const currentWeightDisplay = latestGrowth ? `${latestGrowth.weightKg} kg` : (profile.birthWeightKg > 0 ? `${profile.birthWeightKg} kg` : '—');
  const initial = profile?.name ? profile.name.trim().charAt(0).toUpperCase() : 'B';

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] p-3.5 sm:p-5 shadow-xs transition-colors duration-150">
      
      {/* Top Banner: Milestone Alert */}
      {(isBirthday || isMonthiversary) && (
        <div className="mb-3 sm:mb-4 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#FFF0E6] dark:bg-[#2D2422] border border-[#FCDCCB] dark:border-[#543830] text-[#8A3510] dark:text-[#F8BCA0] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#E2765A] shrink-0" />
            <span className="font-semibold text-xs truncate">
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
            className="text-xs font-semibold px-2.5 py-1 bg-white dark:bg-[#1D1C22] text-[#8A3510] dark:text-[#F8BCA0] rounded-lg border border-[#FCDCCB] dark:border-[#543830] hover:bg-[#FFF7F2] shrink-0 ml-2 transition-colors duration-150 active:scale-[0.98]"
          >
            Wishes 🎉
          </button>
        </div>
      )}

      {/* MOBILE-FIRST HEADER GLANCE (Compact on mobile, fully visible) */}
      <div className="flex flex-col gap-3">
        {/* Row 1: Baby Info & Quick Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FFF0E6] dark:bg-[#2D2422] border border-[#FCDCCB] dark:border-[#543830] flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-[#8A3510] dark:text-[#F8BCA0]">
                {initial}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-2xl font-bold tracking-tight text-[#201E1D] dark:text-[#FAF8F5] truncate">
                  {profile.name}
                </h1>
                {profile.nickname && (
                  <span className="hidden sm:inline text-xs text-[#75706B] dark:text-[#9E9892]">
                    ({profile.nickname})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#75706B] dark:text-[#9E9892]">
                <span>DOB: {new Date(profile.dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span>•</span>
                <span className="text-[#E2765A] font-medium">{daysUntilNextMonthiversary}d to next milestone</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onOpenShareCard}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-[#E2765A] text-white hover:bg-[#CB6145] transition-all active:scale-[0.96]"
              title="Share Milestone Card"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={() => {
                fireConfetti();
                onOpenCelebration();
              }}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold text-[#4D4845] dark:text-[#DDD8D0] bg-[#F2ECE3] dark:bg-[#26242C] hover:bg-[#EAE6DF] transition-all active:scale-[0.96]"
              title="Birthday Wishes & Summary"
            >
              <Award className="w-3.5 h-3.5 text-[#E2765A]" />
              <span className="hidden sm:inline ml-1">Wishes</span>
            </button>
          </div>
        </div>

        {/* Row 2: Prominent Age & Quick Vitals */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#18171C] border border-[#EAE6DF] dark:border-[#2D2B33]">
          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#201E1D] dark:text-[#FAF8F5] tabular-nums">
              {years > 0 ? `${years}y ` : ''}{months}m {days}d
            </div>
            <div className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
              {totalDays} cumulative days of love
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right border-l border-[#EAE6DF] dark:border-[#2D2B33] pl-3">
              <span className="text-[10px] text-[#75706B] dark:text-[#9E9892] uppercase block font-semibold">Weight</span>
              <span className="text-xs sm:text-sm font-bold text-[#E2765A] tabular-nums">{currentWeightDisplay}</span>
            </div>
            {profile.bloodGroup && (
              <div className="text-right border-l border-[#EAE6DF] dark:border-[#2D2B33] pl-3 hidden xs:block">
                <span className="text-[10px] text-[#75706B] dark:text-[#9E9892] uppercase block font-semibold">Blood</span>
                <span className="text-xs sm:text-sm font-bold text-[#201E1D] dark:text-[#FAF8F5]">{profile.bloodGroup}</span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Toggle Trigger */}
        <button
          type="button"
          onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
          className="md:hidden flex items-center justify-center gap-1.5 py-1 text-xs font-semibold text-[#75706B] dark:text-[#9E9892] hover:text-[#E2765A] dark:hover:text-[#F1997A] transition-colors"
        >
          <span>{isDetailsExpanded ? 'Hide Precision Breakdown' : 'Precision Breakdown & Live Clock'}</span>
          {isDetailsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {/* Precision Age Grid & Vitals (Always visible on desktop md:, collapsible on mobile) */}
        <div className={`${isDetailsExpanded ? 'block' : 'hidden'} md:block pt-1 space-y-4`}>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {years > 0 && (
              <div className="p-2.5 sm:p-3 rounded-xl border border-[#FCDCCB] dark:border-[#3D2C28] bg-[#FFF7F2] dark:bg-[#261E1C]">
                <span className="text-[10px] font-semibold text-[#8A3510] dark:text-[#F8BCA0] uppercase tracking-wider block mb-0.5">
                  Years
                </span>
                <span className="text-lg sm:text-xl font-bold text-[#8A3510] dark:text-[#F8BCA0] tabular-nums">
                  {years}
                </span>
              </div>
            )}

            <div className={`p-2.5 sm:p-3 rounded-xl border transition-colors ${
              years === 0 
                ? 'border-[#FCDCCB] dark:border-[#3D2C28] bg-[#FFF7F2] dark:bg-[#261E1C]' 
                : 'border-[#EAE6DF] dark:border-[#2D2B33] bg-[#FAF8F5] dark:bg-[#18171C]'
            }`}>
              <span className={`text-[10px] font-semibold uppercase tracking-wider block mb-0.5 ${
                years === 0 ? 'text-[#8A3510] dark:text-[#F8BCA0]' : 'text-[#75706B] dark:text-[#9E9892]'
              }`}>
                Months
              </span>
              <span className={`text-lg sm:text-xl font-bold tabular-nums ${
                years === 0 ? 'text-[#8A3510] dark:text-[#F8BCA0]' : 'text-[#201E1D] dark:text-[#FAF8F5]'
              }`}>
                {months}
              </span>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl border border-[#EAE6DF] dark:border-[#2D2B33] bg-[#FAF8F5] dark:bg-[#18171C]">
              <span className="text-[10px] font-semibold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider block mb-0.5">
                Days
              </span>
              <span className="text-lg sm:text-xl font-bold text-[#201E1D] dark:text-[#FAF8F5] tabular-nums">
                {days}
              </span>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl border border-[#EAE6DF] dark:border-[#2D2B33] bg-[#FAF8F5] dark:bg-[#18171C]">
              <span className="text-[10px] font-semibold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider block mb-0.5">
                Total Weeks
              </span>
              <span className="text-lg sm:text-xl font-bold text-[#201E1D] dark:text-[#FAF8F5] tabular-nums">
                {totalWeeks}w <span className="text-xs font-normal text-[#75706B] dark:text-[#9E9892]">{remDaysInWeek}d</span>
              </span>
            </div>

            {/* Live Ticking Time */}
            <div
              onClick={() => setShowLiveSeconds(!showLiveSeconds)}
              className="cursor-pointer p-2.5 sm:p-3 rounded-xl border border-[#EAE6DF] dark:border-[#2D2B33] bg-[#FAF8F5] dark:bg-[#18171C] hover:border-[#D5CFCE] transition-all col-span-2 sm:col-span-1"
              title="Click to toggle live seconds"
            >
              <span className="text-[10px] font-semibold text-[#75706B] dark:text-[#9E9892] flex items-center gap-1 mb-0.5 uppercase tracking-wider">
                <Clock className="w-3 h-3 text-[#E2765A]" />
                <span>Elapsed</span>
              </span>
              <span className="text-lg sm:text-xl font-bold tracking-tight text-[#201E1D] dark:text-[#FAF8F5] tabular-nums">
                {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
                {showLiveSeconds && <span className="text-xs text-[#E2765A]">:{String(seconds).padStart(2, '0')}</span>}
              </span>
            </div>
          </div>

          {/* Vitals Overview */}
          <div className="p-3 rounded-xl border border-[#EAE6DF] dark:border-[#2D2B33] bg-[#FAF8F5] dark:bg-[#17161B]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#75706B] dark:text-[#9E9892] block mb-2">
              Health & Vitals Overview
            </span>
            <div className="grid grid-cols-4 gap-2 text-center sm:text-left">
              <div>
                <span className="text-[#75706B] dark:text-[#9E9892] text-[10px] block">Birth Wt</span>
                <span className="text-xs sm:text-sm font-semibold text-[#201E1D] dark:text-[#FAF8F5]">
                  {profile.birthWeightKg > 0 ? `${profile.birthWeightKg} kg` : '—'}
                </span>
              </div>
              <div className="border-l border-[#EAE6DF] dark:border-[#2D2B33] pl-2">
                <span className="text-[#75706B] dark:text-[#9E9892] text-[10px] block">Current Wt</span>
                <span className="text-xs sm:text-sm font-bold text-[#E2765A]">
                  {currentWeightDisplay}
                </span>
              </div>
              <div className="border-l border-[#EAE6DF] dark:border-[#2D2B33] pl-2">
                <span className="text-[#75706B] dark:text-[#9E9892] text-[10px] block">Blood</span>
                <span className="text-xs sm:text-sm font-semibold text-[#201E1D] dark:text-[#FAF8F5]">
                  {profile.bloodGroup || '—'}
                </span>
              </div>
              <div className="border-l border-[#EAE6DF] dark:border-[#2D2B33] pl-2">
                <span className="text-[#75706B] dark:text-[#9E9892] text-[10px] block">Doctor</span>
                <span className="text-xs sm:text-sm font-semibold text-[#201E1D] dark:text-[#FAF8F5] truncate block">
                  {profile.pediatricianName || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
