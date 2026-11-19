'use client';

import React, { useEffect } from 'react';
import { X, Sparkles, Heart, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChildProfile, GrowthRecord } from '@/lib/types';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ChildProfile;
  latestGrowth?: GrowthRecord;
  onOpenShareCard: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  profile,
  latestGrowth,
  onOpenShareCard,
}) => {
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#E2765A', '#F6C85F', '#5A9663', '#5393CE', '#8E6DC5'],
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const now = new Date();
  const birthDate = new Date(profile.dob);
  const diffDays = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
  const months = Math.floor(diffDays / 30.4375);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] p-6 shadow-xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#75706B] hover:text-[#201E1D] dark:hover:text-[#FAF8F5] hover:bg-[#F2ECE3] dark:hover:bg-[#26242C] transition-colors duration-150"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1 mb-5">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-[#FFF0E6] dark:bg-[#2D2422] text-[#E2765A] mx-auto mb-2 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-[#201E1D] dark:text-[#FAF8F5]">
            Milestone Summary & Wishes
          </h2>
          <p className="text-xs text-[#75706B] dark:text-[#9E9892]">
            {profile.name} • {diffDays} cumulative days
          </p>
        </div>

        {/* Dignified Message Card */}
        <div className="my-4 p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-center space-y-2">
          <p className="text-xs text-[#4D4845] dark:text-[#DDD8D0] leading-relaxed font-medium">
            "To our precious baby: May your growth continue with health, curiosity, and warmth. Every day spent caring for you is our greatest privilege."
          </p>
          <div className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
            — With love from Family
          </div>
        </div>

        {/* Quick Highlights - Pastel Bento Cards */}
        <div className="grid grid-cols-3 gap-2.5 text-center mb-5">
          <div className="p-3 rounded-xl bg-[#FFF7F2] dark:bg-[#261E1C] border border-[#FCDCCB] dark:border-[#3D2C28]">
            <span className="text-[10px] font-semibold text-[#8A3510] dark:text-[#F8BCA0] uppercase tracking-wider block">Age</span>
            <span className="text-sm font-bold text-[#8A3510] dark:text-[#F8BCA0] tabular-nums">{diffDays} Days</span>
          </div>
          <div className="p-3 rounded-xl bg-[#EDF5EE] dark:bg-[#19261C] border border-[#CFE2D1] dark:border-[#27402C]">
            <span className="text-[10px] font-semibold text-[#23522A] dark:text-[#AECDB2] uppercase tracking-wider block">Weight</span>
            <span className="text-sm font-bold text-[#23522A] dark:text-[#AECDB2] tabular-nums">
              {latestGrowth ? `${latestGrowth.weightKg} kg` : (profile.birthWeightKg > 0 ? `${profile.birthWeightKg} kg` : '—')}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#EEF5FC] dark:bg-[#172330] border border-[#D1E3F6] dark:border-[#233A50]">
            <span className="text-[10px] font-semibold text-[#184F7D] dark:text-[#A9CBED] uppercase tracking-wider block">Interval</span>
            <span className="text-sm font-bold text-[#184F7D] dark:text-[#A9CBED] tabular-nums">
              {months === 0 ? 'Newborn' : `${months} Mos`}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.6 },
                colors: ['#E2765A', '#F6C85F', '#5A9663', '#5393CE', '#8E6DC5'],
              });
            }}
            className="flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs border border-[#EAE6DF] dark:border-[#2D2B33] text-[#4D4845] dark:text-[#DDD8D0] hover:bg-[#F2ECE3] dark:hover:bg-[#26242C] transition-colors duration-150 active:scale-[0.98] flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E2765A]" />
            <span>Celebrate</span>
          </button>
          <button
            onClick={() => {
              onClose();
              onOpenShareCard();
            }}
            className="flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs bg-[#E2765A] text-white hover:bg-[#CB6145] shadow-xs transition-colors duration-150 active:scale-[0.98] flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Card</span>
          </button>
        </div>

      </div>
    </div>
  );
};
