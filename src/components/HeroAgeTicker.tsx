'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Heart, Sparkles, Share2, Award, Clock } from 'lucide-react';
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

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] p-5 sm:p-6 shadow-sm transition-colors duration-150">
      
      {/* Top Banner: Milestone Alert */}
      {(isBirthday || isMonthiversary) && (
        <div className="mb-5 px-4 py-2.5 rounded-xl bg-[#FFF0E6] dark:bg-[#2D2422] border border-[#FCDCCB] dark:border-[#543830] text-[#8A3510] dark:text-[#F8BCA0] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#E2765A] shrink-0" />
            <span className="font-medium">
              {isBirthday 
                ? `Birthday Milestone: ${profile.name} completes year ${years}!`
                : `Month Milestone: ${profile.name} completes ${months} calendar months!`}
            </span>
          </div>
          <button
            onClick={() => {
              fireConfetti();
              onOpenCelebration();
            }}
            className="text-xs font-semibold px-2.5 py-1 bg-white dark:bg-[#1D1C22] text-[#8A3510] dark:text-[#F8BCA0] rounded-lg border border-[#FCDCCB] dark:border-[#543830] hover:bg-[#FFF7F2] transition-colors duration-150 active:scale-[0.98]"
          >
            Summary & Wishes
          </button>
        </div>
      )}

      {/* Main Gentle Pastel Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Identity & Age Counters (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FFF7F2] dark:bg-[#261E1C] text-[#8A3510] dark:text-[#F8BCA0] border border-[#FCDCCB] dark:border-[#543830]">
              <Calendar className="w-3.5 h-3.5 text-[#E2765A]" />
              DOB: {new Date(profile.dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-xs text-[#75706B] dark:text-[#9E9892]">
              Next milestone in {daysUntilNextMonthiversary}d
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#201E1D] dark:text-[#FAF8F5]">
              {profile.name}
            </h1>
            <p className="text-xs text-[#75706B] dark:text-[#9E9892] mt-1">
              {profile.nickname ? `"${profile.nickname}" • ` : ''}{totalDays} cumulative days of love
            </p>
          </div>

          {/* Precision Age Grid - Quiet Warm Editorial */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            
            {years > 0 && (
              <div className="p-3.5 rounded-xl border border-[#FCDCCB] dark:border-[#3D2C28] bg-[#FFF7F2] dark:bg-[#261E1C]">
                <span className="text-[11px] font-semibold text-[#8A3510] dark:text-[#F8BCA0] uppercase tracking-wider block mb-0.5">
                  Years
                </span>
                <span className="text-2xl font-bold text-[#8A3510] dark:text-[#F8BCA0] tabular-nums">
                  {years}
                </span>
              </div>
            )}

            <div className={`p-3.5 rounded-xl border transition-colors ${
              years === 0 
                ? 'border-[#FCDCCB] dark:border-[#3D2C28] bg-[#FFF7F2] dark:bg-[#261E1C]' 
                : 'border-[#EAE6DF] dark:border-[#2D2B33] bg-[#FAF8F5] dark:bg-[#18171C]'
            }`}>
              <span className={`text-[11px] font-semibold uppercase tracking-wider block mb-0.5 ${
                years === 0
                  ? 'text-[#8A3510] dark:text-[#F8BCA0]'
                  : 'text-[#75706B] dark:text-[#9E9892]'
              }`}>
                Months
              </span>
              <span className={`text-2xl font-bold tabular-nums ${
                years === 0
                  ? 'text-[#8A3510] dark:text-[#F8BCA0]'
                  : 'text-[#201E1D] dark:text-[#FAF8F5]'
              }`}>
                {months}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-[#EAE6DF] dark:border-[#2D2B33] bg-[#FAF8F5] dark:bg-[#18171C]">
              <span className="text-[11px] font-semibold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider block mb-0.5">
                Days
              </span>
              <span className="text-2xl font-bold text-[#201E1D] dark:text-[#FAF8F5] tabular-nums">
                {days}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-[#EAE6DF] dark:border-[#2D2B33] bg-[#FAF8F5] dark:bg-[#18171C]">
              <span className="text-[11px] font-semibold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider block mb-0.5">
                Total Weeks
              </span>
              <span className="text-xl font-bold text-[#201E1D] dark:text-[#FAF8F5] tabular-nums">
                {totalWeeks}w <span className="text-sm font-normal text-[#75706B] dark:text-[#9E9892]">{remDaysInWeek}d</span>
              </span>
            </div>

            {/* Live Ticking Time */}
            <div
              onClick={() => setShowLiveSeconds(!showLiveSeconds)}
              className="cursor-pointer p-3.5 rounded-xl border border-[#EAE6DF] dark:border-[#2D2B33] bg-[#FAF8F5] dark:bg-[#18171C] hover:border-[#D5CFCE] dark:hover:border-[#3D3B44] transition-all"
              title="Click to toggle live seconds"
            >
              <span className="text-[11px] font-semibold text-[#75706B] dark:text-[#9E9892] flex items-center gap-1 mb-0.5 uppercase tracking-wider">
                <Clock className="w-3 h-3 text-[#E2765A]" />
                <span>Elapsed</span>
              </span>
              <span className="text-xl font-bold tracking-tight text-[#201E1D] dark:text-[#FAF8F5] tabular-nums">
                {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
                {showLiveSeconds && <span className="text-xs text-[#E2765A]">:{String(seconds).padStart(2, '0')}</span>}
              </span>
            </div>

          </div>
        </div>

        {/* Right Column: Vitals Summary & Actions (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4 pt-1 lg:pt-0">
          
          {/* Gentle Vitals Panel */}
          <div className="p-4 rounded-xl border border-[#EAE6DF] dark:border-[#2D2B33] bg-[#FAF8F5] dark:bg-[#17161B] space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#75706B] dark:text-[#9E9892] block">
              Health & Vitals Overview
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="text-[#75706B] dark:text-[#9E9892] text-[11px] block">Birth Wt</span>
                <span className="text-sm font-semibold text-[#201E1D] dark:text-[#FAF8F5]">
                  {profile.birthWeightKg > 0 ? `${profile.birthWeightKg} kg` : '—'}
                </span>
              </div>
              <div className="border-l border-[#EAE6DF] dark:border-[#2D2B33] pl-3">
                <span className="text-[#75706B] dark:text-[#9E9892] text-[11px] block">Current Wt</span>
                <span className="text-sm font-bold text-[#E2765A]">
                  {latestGrowth ? `${latestGrowth.weightKg} kg` : (profile.birthWeightKg > 0 ? `${profile.birthWeightKg} kg` : '—')}
                </span>
              </div>
              <div className="border-l border-[#EAE6DF] dark:border-[#2D2B33] pl-3">
                <span className="text-[#75706B] dark:text-[#9E9892] text-[11px] block">Blood Group</span>
                <span className="text-sm font-semibold text-[#201E1D] dark:text-[#FAF8F5]">
                  {profile.bloodGroup || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenShareCard}
              className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#E2765A] text-white hover:bg-[#CB6145] shadow-sm transition-colors duration-150 active:scale-[0.98]"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Milestone</span>
            </button>

            <button
              onClick={() => {
                fireConfetti();
                onOpenCelebration();
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#4D4845] dark:text-[#DDD8D0] hover:text-[#201E1D] dark:hover:text-white hover:bg-[#F2ECE3] dark:hover:bg-[#26242C] border border-[#EAE6DF] dark:border-[#2D2B33] transition-colors duration-150 active:scale-[0.98]"
              title="View Celebrations"
            >
              <Award className="w-3.5 h-3.5 text-[#E2765A]" />
              <span>Wishes</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
