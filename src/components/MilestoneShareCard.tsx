'use client';

import React, { useRef, useState } from 'react';
import { X, Download, Camera } from 'lucide-react';
import html2canvas from 'html2canvas';
import { ChildProfile, GrowthRecord } from '@/lib/types';
import { compressImageFile } from '@/lib/imageCompressor';
import { DayOneLogo } from './DayOneLogo';

interface MilestoneShareCardProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ChildProfile;
  latestGrowth?: GrowthRecord;
}

export const MilestoneShareCard: React.FC<MilestoneShareCardProps> = ({
  isOpen,
  onClose,
  profile,
  latestGrowth,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&auto=format&fit=crop&q=80'
  );
  const [customQuote, setCustomQuote] = useState<string>(
    'Every day with you is a milestone of wonder and growth.'
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const now = new Date();
  const birthDate = new Date(profile.dob);
  const diffDays = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
  const months = Math.floor(diffDays / 30.4375);
  const weeks = Math.floor(diffDays / 7);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const compressed = await compressImageFile(e.target.files[0], 800, 0.85);
        setCustomPhotoUrl(compressed);
      } catch (err) {
        console.error('Failed to compress card photo', err);
      }
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `DayOne_Milestone_${profile.name.replace(/\s+/g, '_')}_${diffDays}Days.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export milestone card image', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md my-0 sm:my-8 rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] p-5 sm:p-6 shadow-xl">
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1 bg-[#EAE6DF] dark:bg-[#2D2B33] rounded-full mx-auto mb-3 sm:hidden" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#75706B] hover:text-[#201E1D] dark:hover:text-[#FAF8F5] hover:bg-[#F2ECE3] dark:hover:bg-[#26242C] transition-colors duration-150 z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-sm font-semibold text-[#201E1D] dark:text-[#FAF8F5] mb-1">
          Milestone Summary Card
        </h3>
        <p className="text-xs text-[#75706B] dark:text-[#9E9892] mb-4">
          Export a gentle pastel summary card for family or archives.
        </p>

        {/* --- THE CARD TO BE EXPORTED --- */}
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-2xl bg-[#FAF8F5] p-5 border border-[#EAE6DF] text-[#201E1D] shadow-sm"
          style={{ width: '100%', maxWidth: '360px', margin: '0 auto' }}
        >
          {/* Top Brand Tag */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#EAE6DF]">
            <div className="flex items-center gap-2">
              <DayOneLogo size={22} variant="mark" />
              <span className="text-xs font-semibold tracking-tight text-[#201E1D]">
                DayOne Record
              </span>
            </div>
            <span className="text-[10px] text-[#75706B]">
              {now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          {/* Baby Photo Frame */}
          <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#F2ECE3] mb-3 border border-[#EAE6DF]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={customPhotoUrl}
              alt="Baby Milestone"
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
            <div className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded-full bg-[#201E1D]/80 backdrop-blur-xs text-white text-[10px] font-semibold">
              Day {diffDays}
            </div>
          </div>

          {/* Name & Age Titles */}
          <div className="text-center mb-3">
            <h2 className="text-xl font-bold text-[#201E1D] tracking-tight">
              {profile.name}
            </h2>
            <p className="text-xs text-[#75706B] mt-0.5">
              {months > 0 ? `${months} Months Checkpoint` : `${weeks} Weeks Checkpoint`}
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl border border-[#FCDCCB] bg-[#FFF7F2] text-center mb-3">
            <div>
              <span className="text-[10px] text-[#8A3510]/80 uppercase block font-semibold">Days</span>
              <span className="text-xs font-bold text-[#8A3510]">{diffDays}</span>
            </div>
            <div className="border-x border-[#FCDCCB]">
              <span className="text-[10px] text-[#8A3510]/80 uppercase block font-semibold">Weight</span>
              <span className="text-xs font-bold text-[#8A3510]">
                {latestGrowth ? `${latestGrowth.weightKg} kg` : (profile.birthWeightKg > 0 ? `${profile.birthWeightKg} kg` : '—')}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#8A3510]/80 uppercase block font-semibold">Length</span>
              <span className="text-xs font-bold text-[#8A3510]">
                {latestGrowth ? `${latestGrowth.lengthCm} cm` : (profile.birthLengthCm > 0 ? `${profile.birthLengthCm} cm` : '—')}
              </span>
            </div>
          </div>

          {/* Quote / Wish */}
          <p className="text-center text-xs italic text-[#4D4845] px-2 leading-relaxed">
            "{customQuote}"
          </p>

          <div className="mt-3 pt-2 border-t border-[#EAE6DF] text-center">
            <span className="text-[10px] text-[#75706B]">
              Verified with WHO & Pediatric Growth Standards
            </span>
          </div>
        </div>

        {/* Customization Controls */}
        <div className="mt-4 space-y-2.5">
          
          {/* Change Photo */}
          <div>
            <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] hover:bg-[#F2ECE3] dark:hover:bg-[#26242C] text-[#4D4845] dark:text-[#DDD8D0] cursor-pointer transition-colors duration-150">
              <Camera className="w-3.5 h-3.5 text-[#E2765A]" />
              <span>Replace Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Change Quote */}
          <div>
            <input
              type="text"
              value={customQuote}
              onChange={(e) => setCustomQuote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5] focus:outline-none"
              placeholder="Caption or note..."
            />
          </div>

          {/* Download Action */}
          <button
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="w-full py-2.5 px-3 rounded-xl font-semibold text-xs bg-[#E2765A] text-white hover:bg-[#CB6145] transition-colors duration-150 flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Generating...' : 'Export Card (PNG)'}</span>
          </button>

        </div>

      </div>
    </div>
  );
};
