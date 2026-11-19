'use client';

import React, { useState } from 'react';
import {
  Droplets,
  Heart,
  Moon,
  Pill,
  Sparkles,
  Smile,
  Meh,
  Frown,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Info,
  Calendar,
} from 'lucide-react';
import { MomCareLog, ChildProfile } from '@/lib/types';
import { syncSingleRecord } from '@/lib/syncService';
import confetti from 'canvas-confetti';

interface MomCareTrackerProps {
  profile: ChildProfile;
  userRole?: 'parent' | 'family';
}

const GALACTAGOGUES = [
  {
    name: 'Jeera & Saunf Water (Cumin & Fennel)',
    benefit: 'Aids digestive health, relieves postpartum bloating, and stimulates prolactin for healthy milk supply.',
    prep: 'Boil 1 tsp cumin and 1 tsp fennel seeds in 1 liter of warm water; sip warm throughout the day.',
  },
  {
    name: 'Methi (Fenugreek) Seeds & Leaves',
    benefit: 'The most researched natural herb for increasing breast milk production within 24–72 hours.',
    prep: 'Soak methi seeds overnight and drink the water, or add fresh fenugreek leaves to dal and parathas.',
  },
  {
    name: 'Gondh ke Ladoo & Panjiri',
    benefit: 'Traditional Ayurvedic superfood rich in healthy fats, iron, and calcium to restore maternal bone and pelvic strength.',
    prep: 'Handmade with edible gum (gondh), ghee, whole wheat/ragi, dry fruits, and jaggery.',
  },
  {
    name: 'Ragi (Finger Millet) & Oatmeal',
    benefit: 'Loaded with plant-based calcium, beta-glucan fiber, and iron to prevent postpartum anemia and fatigue.',
    prep: 'Warm ragi malt with milk or wholesome oats topped with almonds and seeds.',
  },
  {
    name: 'Moringa (Drumstick Leaves)',
    benefit: 'Clinically proven galactagogue rich in Vitamin A, C, iron, and potassium.',
    prep: 'Boiled into light soups or sautéed with garlic as a side vegetable.',
  },
];

export const MomCareTracker: React.FC<MomCareTrackerProps> = ({
  profile,
  userRole = 'parent',
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Daily tracker states
  const [waterGlasses, setWaterGlasses] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`dayone_mom_water_${todayStr}`);
      return saved ? parseInt(saved, 10) : 6;
    }
    return 6;
  });

  const [moodRating, setMoodRating] = useState<number>(4);
  const [sleepHours, setSleepHours] = useState<number>(5.5);
  const [painLevel, setPainLevel] = useState<number>(2);
  const [supplementsTaken, setSupplementsTaken] = useState<boolean>(true);
  const [momNotes, setMomNotes] = useState<string>('');
  const [isSavedToday, setIsSavedToday] = useState<boolean>(false);

  const TARGET_GLASSES = 12; // 12 glasses x 250ml = 3,000ml (3 Liters)
  const hydrationMl = waterGlasses * 250;
  const hydrationPercent = Math.min(100, Math.round((waterGlasses / TARGET_GLASSES) * 100));

  const handleUpdateWater = (delta: number) => {
    const next = Math.max(0, Math.min(20, waterGlasses + delta));
    setWaterGlasses(next);
    localStorage.setItem(`dayone_mom_water_${todayStr}`, next.toString());
    if (next >= TARGET_GLASSES && delta > 0) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {
        // ignore
      }
    }
  };

  const handleSaveDayLog = () => {
    const log: MomCareLog = {
      id: `mom_${todayStr}`,
      date: todayStr,
      waterGlasses,
      moodRating,
      sleepHours,
      painLevel,
      supplementsTaken,
      notes: momNotes.trim() || undefined,
    };
    localStorage.setItem(`dayone_mom_log_${todayStr}`, JSON.stringify(log));
    setIsSavedToday(true);

    syncSingleRecord('mom_care_logs', {
      id: `mom_${todayStr}`,
      date: todayStr,
      water_glasses: waterGlasses,
      mood_rating: moodRating,
      sleep_hours: sleepHours,
      pain_level: painLevel,
      supplements_taken: supplementsTaken,
      notes: momNotes.trim() || null,
    });
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
    setTimeout(() => setIsSavedToday(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-purple-500/10 border border-[#EAE6DF] dark:border-[#2D2B33] flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-xl bg-rose-500 text-white">
              <Heart className="w-4 h-4 fill-current" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#201E1D] dark:text-[#FAF8F5]">
              Maternal Postpartum Recovery & Care
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#75706B] dark:text-[#9E9892] max-w-xl">
            "A baby is born, and so is a mother." Caring for yourself is the single greatest gift you can give your baby. Track hydration, recovery vitals, and Ayurvedic nourishing nutrition.
          </p>
        </div>

        {/* Daily Hydration Progress Badge */}
        <div className="bg-white dark:bg-[#1D1C22] p-4 rounded-2xl border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs flex items-center gap-4 shrink-0">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="currentColor"
                strokeWidth="5"
                fill="transparent"
                className="text-blue-100 dark:text-blue-950/40"
              />
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="currentColor"
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 22}
                strokeDashoffset={2 * Math.PI * 22 * (1 - hydrationPercent / 100)}
                strokeLinecap="round"
                className="text-blue-500 transition-all duration-500"
              />
            </svg>
            <Droplets className="w-5 h-5 absolute text-blue-500" />
          </div>

          <div>
            <div className="text-[10px] font-semibold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider">
              Hydration Today
            </div>
            <div className="text-sm font-bold text-[#201E1D] dark:text-[#FAF8F5]">
              {hydrationMl} ml / 3,000 ml
            </div>
            <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
              {waterGlasses} of {TARGET_GLASSES} glasses (250ml each)
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Hydration & Recovery Vitals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: Interactive Hydration Station (5 Cols) */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-sm flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#201E1D] dark:text-[#FAF8F5] flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-500" />
                <span>Nursing Hydration Station</span>
              </h3>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {hydrationPercent}% Goal
              </span>
            </div>
            <p className="text-xs text-[#75706B] dark:text-[#9E9892] mb-4">
              Breast milk is 87% water. Staying well-hydrated prevents postpartum headaches and keeps milk supply abundant.
            </p>

            {/* Visual Glass Tracker */}
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-center space-y-3">
              <div className="text-4xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {waterGlasses} <span className="text-sm font-sans font-medium text-[#75706B]">glasses</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                {Array.from({ length: TARGET_GLASSES }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const next = idx + 1;
                      setWaterGlasses(next);
                      localStorage.setItem(`dayone_mom_water_${todayStr}`, next.toString());
                    }}
                    className={`w-7 h-9 rounded-md border transition-all flex items-center justify-center ${
                      idx < waterGlasses
                        ? 'bg-blue-500 border-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-[#141317] border-blue-200 dark:border-blue-900/40 text-blue-300'
                    }`}
                    title={`Glass ${idx + 1} (250ml)`}
                  >
                    <Droplets className="w-3.5 h-3.5 fill-current" />
                  </button>
                ))}
              </div>

              {/* Quick Increment Buttons */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => handleUpdateWater(-1)}
                  disabled={waterGlasses === 0}
                  className="p-2 rounded-xl border border-[#EAE6DF] dark:border-[#2D2B33] text-[#75706B] hover:text-[#201E1D] dark:hover:text-white disabled:opacity-40"
                  title="Remove 1 glass"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleUpdateWater(1)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+1 Glass (250ml)</span>
                </button>
                <button
                  onClick={() => handleUpdateWater(2)}
                  className="px-3 py-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 text-blue-800 dark:text-blue-200 font-semibold text-xs transition-colors"
                >
                  +500ml
                </button>
              </div>
            </div>
          </div>

          {/* Quick Doctor Note */}
          <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] text-[11px] text-[#75706B] dark:text-[#9E9892] flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <span>
              <strong>Tip:</strong> Keep a full 1-liter bottle beside the nursing chair and take a sip every time baby latches!
            </span>
          </div>
        </div>

        {/* RIGHT: Maternal Daily Wellness & Recovery Vitals (7 Cols) */}
        <div className="lg:col-span-7 p-5 rounded-3xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#201E1D] dark:text-[#FAF8F5] flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500 fill-current" />
              <span>Daily Recovery & Mood Check</span>
            </h3>
            <span className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
              Today: {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Mood Selector */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] space-y-2">
              <span className="text-xs font-semibold text-[#75706B] dark:text-[#9E9892]">
                How are you feeling today?
              </span>
              <div className="flex items-center justify-between gap-1 pt-1">
                {[
                  { rating: 1, label: 'Exhausted', icon: Frown, color: 'text-rose-500' },
                  { rating: 2, label: 'Low', icon: Meh, color: 'text-amber-500' },
                  { rating: 3, label: 'Okay', icon: Smile, color: 'text-blue-500' },
                  { rating: 4, label: 'Good', icon: Smile, color: 'text-emerald-500' },
                  { rating: 5, label: 'Supported', icon: Sparkles, color: 'text-purple-500' },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = moodRating === m.rating;
                  return (
                    <button
                      key={m.rating}
                      onClick={() => setMoodRating(m.rating)}
                      className={`flex-1 p-2 rounded-xl flex flex-col items-center gap-1 border transition-all ${
                        isSelected
                          ? 'border-[#E2765A] bg-white dark:bg-[#1D1C22] shadow-xs scale-105'
                          : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${m.color}`} />
                      <span className="text-[10px] font-medium text-[#75706B] dark:text-[#9E9892]">
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rest / Sleep Hours */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#75706B] dark:text-[#9E9892]">
                  Total Sleep (Across Naps)
                </span>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                  {sleepHours} hrs
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="10"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#EAE6DF] dark:bg-[#2D2B33] rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <p className="text-[10px] text-[#75706B] dark:text-[#9E9892]">
                Sleep in shifts when possible; even 90-minute consolidated rest cycles restore cognitive focus.
              </p>
            </div>

            {/* Pain / Discomfort Score */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#75706B] dark:text-[#9E9892]">
                  Physical Pain / Discomfort
                </span>
                <span className={`text-xs font-bold ${painLevel > 5 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {painLevel} / 10
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={painLevel}
                onChange={(e) => setPainLevel(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#EAE6DF] dark:bg-[#2D2B33] rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[10px] text-[#75706B]">
                <span>0 (No pain)</span>
                <span>5 (Moderate)</span>
                <span>10 (Severe)</span>
              </div>
            </div>

            {/* Postnatal Supplements Checkbox */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#201E1D] dark:text-[#FAF8F5] flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Postnatal Supplements</span>
                </div>
                <div className="text-[10px] text-[#75706B] dark:text-[#9E9892]">
                  Iron, Calcium, Vit D3
                </div>
              </div>
              <button
                onClick={() => setSupplementsTaken(!supplementsTaken)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  supplementsTaken
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#EAE6DF] dark:bg-[#2D2B33] text-[#75706B]'
                }`}
              >
                {supplementsTaken ? '✓ Taken' : 'Not yet'}
              </button>
            </div>

          </div>

          {/* Notes & Save Button */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="How are you feeling mentally or physically today?..."
              value={momNotes}
              onChange={(e) => setMomNotes(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl text-xs bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <button
              onClick={handleSaveDayLog}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shrink-0 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSavedToday ? 'Saved! ✨' : 'Save Check-in'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Ayurvedic & Traditional Lactation Nutrition Deck */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#201E1D] dark:text-[#FAF8F5]">
                Traditional Indian Lactation & Recovery Foods (Galactagogues)
              </h3>
              <p className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
                Time-honored nutritional wisdom recommended by pediatricians and Indian grandmothers.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {GALACTAGOGUES.map((food) => (
            <div
              key={food.name}
              className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-bold text-[#8A3510] dark:text-[#F8BCA0]">
                  {food.name}
                </div>
                <p className="text-[11px] text-[#201E1D] dark:text-[#DDD8D0] mt-1 leading-relaxed">
                  {food.benefit}
                </p>
              </div>

              <div className="pt-2 border-t border-[#EAE6DF]/60 dark:border-[#2D2B33]/60 text-[10px] text-[#75706B] dark:text-[#9E9892] italic">
                🍲 <strong>How to take:</strong> {food.prep}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
