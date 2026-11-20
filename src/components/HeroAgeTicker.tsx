'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Share2,
  Clock,
  ChevronDown,
  ChevronUp,
  PartyPopper,
  Flame,
  Award,
} from 'lucide-react';
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

  // Live precision ticker updating every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const birthDate = useMemo(() => new Date(profile.dob), [profile.dob]);
  const diffMs = Math.max(0, now.getTime() - birthDate.getTime());

  // Precision time math
  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  // Exact calendar months and days
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

  // Birthday & Monthiversary celebrations
  const isBirthday = now.getMonth() === birthDate.getMonth() && now.getDate() === birthDate.getDate();
  const isMonthiversary = now.getDate() === birthDate.getDate() && totalDays > 0;

  let nextMilestoneDate = new Date(now.getFullYear(), now.getMonth(), birthDate.getDate());
  if (nextMilestoneDate <= now) {
    nextMilestoneDate = new Date(now.getFullYear(), now.getMonth() + 1, birthDate.getDate());
  }
  const daysUntilNextMonthiversary = Math.max(
    0,
    Math.ceil((nextMilestoneDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Milestone Teaser by developmental stage (CDC / AAP guidelines)
  const milestoneTeaser = useMemo(() => {
    const ageInMonths = years * 12 + months;
    if (ageInMonths < 1) {
      return {
        stage: '0–1 Month',
        title: 'Sensory Wonder & Latching',
        highlight: 'Focuses on parent faces 8–12" away • Lifting chin briefly during tummy time',
      };
    } else if (ageInMonths < 2) {
      return {
        stage: '1–2 Months',
        title: 'First Social Smiles',
        highlight: 'Smiling in response to your voice • Cooing and gentle vowel sounds',
      };
    } else if (ageInMonths < 3) {
      return {
        stage: '2–3 Months',
        title: 'Forearm Push-Ups & Tracking',
        highlight: 'Pushing up on elbows • Smoothly following moving objects across visual field',
      };
    } else if (ageInMonths < 4) {
      return {
        stage: '3–4 Months',
        title: 'Reaching & Bilateral Play',
        highlight: 'Reaching for hanging rattles • Bringing hands together at midline',
      };
    } else if (ageInMonths < 5) {
      return {
        stage: '4–5 Months',
        title: 'Rolling Over Milestone',
        highlight: 'Rolling tummy-to-back • Babbling with intentional rhythm & squeals',
      };
    } else if (ageInMonths < 6) {
      return {
        stage: '5–6 Months',
        title: 'Tripod Sitting & Voice Recognition',
        highlight: 'Sitting with brief hand support • Responding eagerly to own name',
      };
    } else if (ageInMonths < 7) {
      return {
        stage: '6–7 Months',
        title: 'First Solids & Flavor Tasting',
        highlight: 'Starting iron-rich single purees • Transferring toys hand-to-hand',
      };
    } else if (ageInMonths < 9) {
      return {
        stage: '7–9 Months',
        title: 'Independent Sitting & Scooting',
        highlight: 'Sitting steadily without support • Army scooting & exploring room',
      };
    } else if (ageInMonths < 12) {
      return {
        stage: '9–12 Months',
        title: 'Pincer Grasp & Cruising',
        highlight: 'Using index finger and thumb • Pulling up on sofa & cruising',
      };
    } else {
      return {
        stage: '12+ Months',
        title: 'First Independent Steps',
        highlight: 'Standing alone, taking bold first steps • Saying first intentional words',
      };
    }
  }, [years, months]);

  const fireConfetti = () => {
    confetti({
      particleCount: 55,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#44634B', '#D97757', '#EBB04D', '#5C7C62', '#FE9572'],
    });
  };

  const currentWeightDisplay = latestGrowth
    ? `${latestGrowth.weightKg} kg`
    : profile.birthWeightKg > 0
    ? `${profile.birthWeightKg} kg`
    : '5.8 kg';

  const initial = profile?.name ? profile.name.trim().charAt(0).toUpperCase() : 'B';

  return (
    <div className="relative overflow-hidden bg-white dark:bg-[#1C1B22] rounded-3xl p-4 sm:p-5 shadow-xs border border-[#EAE6DF] dark:border-[#2C2A34] animate-reveal">
      
      {/* Top Banner: Birthday or Monthiversary Special Alert */}
      {(isBirthday || isMonthiversary) && (
        <div className="mb-3 px-3.5 py-2 rounded-2xl bg-[#FFF0E8] dark:bg-[#2D1F1A] border border-[#FCDCCB] dark:border-[#4A322A] text-[#8A3510] dark:text-[#FFB59E] flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-[#D97757] shrink-0 animate-pulse" />
            <span className="font-bold truncate">
              {isBirthday
                ? `Happy Birthday! ${profile.name} turns ${years} today 🎉`
                : `Milestone: ${profile.name} is ${months} months old today! 🎉`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              fireConfetti();
              onOpenCelebration();
            }}
            className="tap-feedback text-[11px] font-bold px-3 py-1.5 bg-white dark:bg-[#1C1B22] text-[#8A3510] dark:text-[#FFB59E] rounded-full border border-[#FCDCCB] dark:border-[#4A322A] hover:bg-[#FAF8F5] shrink-0 ml-2 shadow-xs cursor-pointer"
          >
            Celebrate 🎉
          </button>
        </div>
      )}

      {/* Main Hero Header: Baby Avatar + Live Age Header */}
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          
          {/* Status Pill Badge: Live Days Counter */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full mb-1.5 bg-[#EDF5EE] dark:bg-[#1E3023] border border-[#CFE2D1] dark:border-[#2D4532]">
            <span className="w-2 h-2 rounded-full bg-[#44634B] dark:bg-[#A8D1B0] animate-pulse" />
            <span className="text-[11px] font-bold text-[#23522A] dark:text-[#A8D1B0] tabular-nums">
              {totalDays} days earthside
            </span>
          </div>

          {/* Baby Name & Prominent Age Display */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-[#191C1A] dark:text-[#FAF8F5] tracking-tight">
              {profile.name}
            </h1>
            <span className="text-xs sm:text-sm font-bold text-[#75706B] dark:text-[#A8A29E] tabular-nums">
              {years > 0 ? `${years}y ` : ''}{months} mos, {days} days
            </span>
          </div>

          {/* Vitals Summary Strip */}
          <p className="text-xs text-[#75706B] dark:text-[#9E9892] mt-1 flex items-center gap-1.5 flex-wrap">
            <span>
              Weight: <strong className="font-bold text-[#191C1A] dark:text-[#FAF8F5] tabular-nums">{currentWeightDisplay}</strong>
            </span>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            <span>
              Week <strong className="font-bold text-[#44634B] dark:text-[#A8D1B0] tabular-nums">{totalWeeks + 1}</strong>
            </span>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            <span className="text-[#8A3510] dark:text-[#FFB59E] font-semibold tabular-nums">
              {daysUntilNextMonthiversary}d to {months + 1}m milestone
            </span>
          </p>
        </div>

        {/* Baby Avatar Frame with Gentle Glow */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-0.5 bg-white dark:bg-[#202722] shadow-xs flex items-center justify-center border border-[#EAE6DF] dark:border-[#2D382F]">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-full h-full rounded-[14px] object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-[#E1EDE4] to-[#C8EBCC] dark:from-[#203D24] dark:to-[#172D1B] flex items-center justify-center overflow-hidden">
                <span className="text-xl sm:text-2xl font-black text-[#344738] dark:text-[#A8D1B0]">
                  {initial}
                </span>
              </div>
            )}
          </div>
          <span
            className="absolute -bottom-1 -right-1 bg-[#FFF0E6] text-[#8A3510] dark:bg-[#332522] dark:text-[#F8BCA0] border border-[#FCDCCB] dark:border-[#523A34] w-5 h-5 rounded-full shadow-xs flex items-center justify-center cursor-pointer"
            onClick={fireConfetti}
            title="Celebrate"
          >
            <Sparkles className="w-3 h-3 text-[#D97757]" />
          </span>
        </div>
      </div>

      {/* Pediatric Milestone Radar Teaser Strip */}
      <div className="mt-3.5 bg-[#FAF8F5] dark:bg-[#17161C] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 border border-[#EAE6DF]/80 dark:border-[#2C2A34]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#FFF0E6] dark:bg-[#2D1F1A] border border-[#FCDCCB]/60 dark:border-[#4A322A]/60 flex items-center justify-center shrink-0 text-[#D97757]">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FFF0E6] dark:bg-[#3E1C12] text-[#99462A] dark:text-[#FFB59E] px-1.5 py-0.5 rounded-md">
                {milestoneTeaser.stage}
              </span>
              <p className="text-xs font-bold text-[#201E1D] dark:text-[#FAF8F5] truncate">
                {milestoneTeaser.title}
              </p>
            </div>
            <p className="text-[11px] text-[#75706B] dark:text-[#9E9892] truncate mt-0.5">
              {milestoneTeaser.highlight}
            </p>
          </div>
        </div>

        {/* Quick Action Buttons: Share & Celebrate */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenShareCard}
            className="tap-feedback p-2.5 rounded-xl bg-white dark:bg-[#201E26] text-[#44634B] dark:text-[#A8D1B0] hover:bg-[#E1EDE4] border border-[#EAE6DF] dark:border-[#2C2A34] shadow-2xs min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            title="Share Milestone Card"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              fireConfetti();
              onOpenCelebration();
            }}
            className="tap-feedback p-2.5 rounded-xl bg-white dark:bg-[#201E26] text-[#8A3510] dark:text-[#FFB59E] hover:bg-[#FFF0E6] border border-[#EAE6DF] dark:border-[#2C2A34] shadow-2xs min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            title="Celebrate Milestone"
          >
            <PartyPopper className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Precision Age Clock */}
      <div className="mt-2.5 pt-2 border-t border-[#EAE6DF]/70 dark:border-[#2C2A34]/70">
        <button
          type="button"
          onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
          className="tap-feedback w-full flex items-center justify-between text-xs font-semibold text-[#44634B] dark:text-[#A8D1B0] hover:opacity-90 py-1 min-h-[36px] cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{isDetailsExpanded ? 'Hide precision clock' : 'View live precision age counter'}</span>
          </span>
          {isDetailsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {isDetailsExpanded && (
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5 animate-reveal">
            <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#17161C] border border-[#EAE6DF] dark:border-[#2C2A34] text-center">
              <span className="text-[10px] font-semibold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider block">
                Total Weeks
              </span>
              <p className="text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5] tabular-nums mt-0.5">
                {totalWeeks}w {remDaysInWeek}d
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#17161C] border border-[#EAE6DF] dark:border-[#2C2A34] text-center">
              <span className="text-[10px] font-semibold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider block">
                Total Hours
              </span>
              <p className="text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5] tabular-nums mt-0.5">
                {totalHours.toLocaleString()}h
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#17161C] border border-[#EAE6DF] dark:border-[#2C2A34] text-center">
              <span className="text-[10px] font-semibold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider block">
                Total Minutes
              </span>
              <p className="text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5] tabular-nums mt-0.5">
                {totalMinutes.toLocaleString()}m
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#EDF5EE] dark:bg-[#1E3023] border border-[#CFE2D1] dark:border-[#2D4532] text-center">
              <span className="text-[10px] font-semibold text-[#23522A] dark:text-[#A8D1B0] uppercase tracking-wider block">
                Live Seconds
              </span>
              <p className="text-sm font-bold text-[#44634B] dark:text-[#A8D1B0] tabular-nums mt-0.5">
                {seconds}s
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
