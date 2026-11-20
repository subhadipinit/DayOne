'use client';

import React, { useState, useEffect } from 'react';
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
  Check,
  RotateCcw,
  GlassWater,
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

type MoodType = 'energized' | 'content' | 'sleepy' | 'overwhelmed';

export const MomCareTracker: React.FC<MomCareTrackerProps> = ({
  profile,
  userRole = 'parent',
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Daily tracker states
  const [waterGlasses, setWaterGlasses] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`dayone_mom_water_${todayStr}`);
      return saved ? parseInt(saved, 10) : 8; // 8 * 250 = 2.0 L
    }
    return 8;
  });

  const [activeMood, setActiveMood] = useState<MoodType>('content');
  const [sleepHours, setSleepHours] = useState<number>(6.5);
  const [kegelSessions, setKegelSessions] = useState<number>(2);
  const [painLevel, setPainLevel] = useState<number>(1);
  const [supplementsTaken, setSupplementsTaken] = useState<boolean>(true);
  const [momNotes, setMomNotes] = useState<string>('');
  const [isSavedToday, setIsSavedToday] = useState<boolean>(false);
  const [animatingGlassIndex, setAnimatingGlassIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadSaved = () => {
      if (typeof window !== 'undefined') {
        const savedWater = localStorage.getItem(`dayone_mom_water_${todayStr}`);
        if (savedWater) setWaterGlasses(parseInt(savedWater, 10));

        const savedLog = localStorage.getItem(`dayone_mom_log_${todayStr}`);
        if (savedLog) {
          try {
            const parsed = JSON.parse(savedLog);
            if (parsed.sleepHours) setSleepHours(parsed.sleepHours);
            if (parsed.painLevel !== undefined) setPainLevel(parsed.painLevel);
            if (parsed.supplementsTaken !== undefined) setSupplementsTaken(parsed.supplementsTaken);
            if (parsed.notes) setMomNotes(parsed.notes);
            setIsSavedToday(true);
          } catch (e) {
            // ignore
          }
        }
      }
    };
    loadSaved();
    window.addEventListener('dayone:data-hydrated', loadSaved);
    return () => window.removeEventListener('dayone:data-hydrated', loadSaved);
  }, [todayStr]);

  const TARGET_GLASSES = 12; // 12 glasses x 250ml = 3,000ml (3 Liters)
  const hydrationLiters = ((waterGlasses * 250) / 1000).toFixed(2);
  const hydrationPercent = Math.min(100, Math.round((waterGlasses / TARGET_GLASSES) * 100));

  const handleUpdateWater = (delta: number) => {
    const next = Math.max(0, Math.min(TARGET_GLASSES + 4, waterGlasses + delta));
    setWaterGlasses(next);
    localStorage.setItem(`dayone_mom_water_${todayStr}`, next.toString());
    if (next >= TARGET_GLASSES && delta > 0) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#38BDF8', '#0284C7', '#44634B'],
        });
      } catch (e) {
        // ignore
      }
    }
  };

  const handleGlassTap = (glassIndex: number) => {
    // If clicking on an already filled glass, toggle or set to that glass
    setAnimatingGlassIndex(glassIndex);
    setTimeout(() => setAnimatingGlassIndex(null), 350);

    const targetVal = glassIndex === waterGlasses ? glassIndex - 1 : glassIndex;
    setWaterGlasses(targetVal);
    localStorage.setItem(`dayone_mom_water_${todayStr}`, targetVal.toString());

    if (targetVal >= TARGET_GLASSES) {
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#38BDF8', '#0284C7', '#44634B'],
        });
      } catch (e) {
        // ignore
      }
    }
  };

  const toggleKegelSession = (sessionIndex: number) => {
    const next = kegelSessions >= sessionIndex ? sessionIndex - 1 : sessionIndex;
    setKegelSessions(next);
  };

  const handleSaveDayLog = () => {
    const log: MomCareLog = {
      id: `mom_${todayStr}`,
      date: todayStr,
      waterGlasses,
      moodRating: activeMood === 'energized' ? 5 : activeMood === 'content' ? 4 : activeMood === 'sleepy' ? 3 : 2,
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
      mood_rating: log.moodRating,
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
        colors: ['#44634B', '#C8EBCC', '#D97757'],
      });
    } catch (e) {
      // ignore
    }
    setTimeout(() => setIsSavedToday(false), 3000);
  };

  return (
    <div className="flex flex-col w-full pb-8 space-y-6 animate-reveal">
      
      {/* Top Greeting & Maternal Affirmation Header */}
      <section className="flex flex-col gap-2 pt-1">
        <div className="inline-flex items-center gap-1.5 self-start px-3.5 py-1 rounded-full bg-[#C8EBCC]/60 dark:bg-[#203D24]/60 text-[#03210E] dark:text-[#ADCFB1] shadow-2xs border border-[#44634B]/20">
          <Sparkles className="w-3.5 h-3.5 text-[#44634B] dark:text-[#ADCFB1]" />
          <span className="text-xs font-semibold">You are doing amazing, Mama</span>
          <span className="text-xs">🌸</span>
        </div>
        <div className="flex flex-col">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#191C1A] dark:text-[#FAF8F5]">
            Mom Care &amp; Recovery
          </h2>
          <p className="text-xs text-[#424842] dark:text-[#9E9892]">
            Postpartum Wellness, Lactation Hydration &amp; Daily Self-Care
          </p>
        </div>
      </section>

      {/* Daily Maternal Wellness Bento */}
      <section className="flex flex-col gap-4">
        
        {/* Mood & Emotional Status */}
        <div className="bg-white dark:bg-[#1E2520] p-5 rounded-3xl shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌿</span>
              <span className="text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5]">
                How are you feeling today?
              </span>
            </div>
            <span className="text-[11px] font-semibold text-[#44634B] dark:text-[#ADCFB1]">
              Daily Check-in
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {[
              { id: 'energized', label: 'Energized ☀️' },
              { id: 'content', label: 'Content 🌿' },
              { id: 'sleepy', label: 'Sleepy 🥱' },
              { id: 'overwhelmed', label: 'Overwhelmed 🌧️' },
            ].map((mood) => {
              const isSelected = activeMood === mood.id;
              return (
                <button
                  key={mood.id}
                  onClick={() => setActiveMood(mood.id as MoodType)}
                  className={`tap-feedback flex items-center justify-between px-4 py-3 rounded-2xl transition-all text-left border ${
                    isSelected
                      ? 'bg-[#44634B] text-white border-[#344738] font-bold shadow-xs'
                      : 'bg-[#F7FAF5] dark:bg-[#161C17] text-[#191C1A] dark:text-[#FAF8F5] border-[#E0E3DF] dark:border-[#2D382F]'
                  }`}
                  type="button"
                >
                  <span className="text-xs font-semibold">{mood.label}</span>
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-white text-[#44634B]' : 'bg-[#E0E3DF] dark:bg-[#2D382F] text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Hydration Counter with Interactive Glass Tap Animation */}
        <div className="bg-white dark:bg-[#1E2520] p-5 rounded-3xl shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] flex flex-col gap-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 flex items-center justify-center">
                <Droplets className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5]">
                Lactation Hydration
              </span>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300">
              {hydrationPercent}% of Daily 3L Goal
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div>
              <span className="text-3xl font-black text-[#191C1A] dark:text-[#FAF8F5] tracking-tight tabular-nums">
                {hydrationLiters}
              </span>
              <span className="text-xs text-[#75706B] dark:text-[#9E9892] font-semibold">
                {' '}
                / 3.0 Liters
              </span>
              <span className="text-[11px] text-[#75706B] dark:text-[#9E9892] block mt-0.5">
                {waterGlasses} of {TARGET_GLASSES} glasses (250 mL each)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpdateWater(-1)}
                disabled={waterGlasses === 0}
                className="tap-feedback w-10 h-10 rounded-full bg-[#F1F4F0] dark:bg-[#161C17] text-[#191C1A] dark:text-[#FAF8F5] border border-[#E0E3DF] dark:border-[#2D382F] flex items-center justify-center disabled:opacity-30"
                type="button"
                title="Subtract 1 glass"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleUpdateWater(1)}
                className="tap-feedback h-10 px-4 rounded-full bg-[#44634B] hover:bg-[#344738] text-white text-xs flex items-center gap-1.5 shadow-xs font-bold"
                type="button"
              >
                <Plus className="w-4 h-4" />
                <span>+250 mL</span>
              </button>
            </div>
          </div>

          {/* 12 Interactive Water Glasses Grid (Tap any glass to set count) */}
          <div className="pt-2">
            <div className="text-[11px] font-semibold text-[#75706B] dark:text-[#9E9892] mb-1.5 flex items-center justify-between">
              <span>Tap glasses to log:</span>
              <span className="text-[10px]">1 glass = 250 mL</span>
            </div>
            
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
              {Array.from({ length: TARGET_GLASSES }).map((_, idx) => {
                const glassNum = idx + 1;
                const isFilled = waterGlasses >= glassNum;
                const isAnimating = animatingGlassIndex === glassNum;

                return (
                  <button
                    key={glassNum}
                    type="button"
                    onClick={() => handleGlassTap(glassNum)}
                    className={`tap-feedback h-11 rounded-xl flex flex-col items-center justify-center p-1 border cursor-pointer transition-transform ${
                      isFilled
                        ? 'bg-gradient-to-t from-sky-500 to-sky-400 text-white border-sky-600 shadow-xs ring-1 ring-sky-300'
                        : 'bg-[#F7FAF5] dark:bg-[#161C17] border-[#E0E3DF] dark:border-[#2D382F] text-[#75706B] dark:text-[#9E9892]'
                    } ${isAnimating ? 'scale-110' : ''}`}
                    title={`Glass ${glassNum} (250 mL)`}
                  >
                    <Droplets className={`w-3.5 h-3.5 ${isFilled ? 'fill-current' : 'opacity-40'}`} />
                    <span className="text-[9px] font-bold mt-0.5 leading-none">{glassNum}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Liquid intake progress bar */}
          <div className="w-full h-2.5 rounded-full bg-[#F1F4F0] dark:bg-[#161C17] mt-1 overflow-hidden border border-[#E0E3DF] dark:border-[#2D382F]">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-[#44634B] rounded-full transition-all duration-500"
              style={{ width: `${hydrationPercent}%` }}
            ></div>
          </div>

          <p className="text-[11px] text-[#75706B] dark:text-[#9E9892] flex items-center gap-1.5 pt-0.5">
            <Info className="w-3.5 h-3.5 text-[#44634B] shrink-0" />
            <span>Optimal hydration directly supports healthy breast milk volume and maternal energy.</span>
          </p>
        </div>

        {/* Rest & Sleep Breakdown */}
        <div className="bg-white dark:bg-[#1E2520] p-5 rounded-3xl shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5]">
                Rest &amp; Nocturnal Recovery
              </span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F1F4F0] dark:bg-[#161C17] text-[#424842] dark:text-[#9E9892]">
              Last Night
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-black text-[#191C1A] dark:text-[#FAF8F5] tabular-nums">
                {sleepHours}h
              </span>
              <span className="text-xs text-[#75706B] dark:text-[#9E9892] block mt-0.5">
                Total sleep (broken nocturnal stretches)
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSleepHours((prev) => Math.max(0, prev - 0.5))}
                className="tap-feedback w-8 h-8 rounded-full bg-[#F1F4F0] dark:bg-[#161C17] text-[#191C1A] dark:text-[#FAF8F5] border border-[#E0E3DF] dark:border-[#2D382F] flex items-center justify-center text-xs font-bold"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setSleepHours((prev) => Math.min(14, prev + 0.5))}
                className="tap-feedback w-8 h-8 rounded-full bg-[#F1F4F0] dark:bg-[#161C17] text-[#191C1A] dark:text-[#FAF8F5] border border-[#E0E3DF] dark:border-[#2D382F] flex items-center justify-center text-xs font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Segmented nocturnal sleep timeline visual */}
          <div className="flex gap-1 h-3 w-full rounded-full overflow-hidden bg-[#F1F4F0] dark:bg-[#161C17] mt-1 border border-[#E0E3DF] dark:border-[#2D382F]">
            <div className="bg-[#44634B] h-full rounded-full" style={{ width: '25%' }} title="Deep Sleep"></div>
            <div className="bg-amber-400 h-full" style={{ width: '10%' }} title="Awake / Feeding"></div>
            <div className="bg-[#44634B]/70 h-full rounded-full" style={{ width: '45%' }} title="Core Sleep"></div>
            <div className="bg-amber-400 h-full" style={{ width: '8%' }} title="Awake / Diaper"></div>
            <div className="bg-[#C8EBCC] dark:bg-[#203D24] h-full rounded-full" style={{ width: '12%' }} title="Morning Nap"></div>
          </div>
          <div className="flex justify-between text-[11px] text-[#75706B] dark:text-[#9E9892] px-0.5 font-medium">
            <span>10:30 PM</span>
            <span>2:15 AM (Feed)</span>
            <span>5:30 AM (Diaper)</span>
            <span>7:10 AM</span>
          </div>
        </div>
      </section>

      {/* Postpartum Recovery & Pelvic Health Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧘‍♀️</span>
            <h3 className="text-sm sm:text-base font-bold text-[#191C1A] dark:text-[#FAF8F5]">
              Pelvic Floor &amp; Core Recovery
            </h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#C8EBCC] text-[#03210E] dark:bg-[#203D24] dark:text-[#ADCFB1]">
            Week 6+ Safe
          </span>
        </div>

        <div className="bg-white dark:bg-[#1E2520] p-5 rounded-3xl shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] flex flex-col gap-4">
          
          {/* Daily Kegel Reminder Widget */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E4DC] dark:border-[#2D382F]">
            <div>
              <span className="text-xs sm:text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5] block">
                Daily Kegel Activations
              </span>
              <span className="text-xs text-[#75706B] dark:text-[#9E9892]">
                {kegelSessions} of 3 sets completed today
              </span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => toggleKegelSession(num)}
                  className={`tap-feedback w-9 h-9 rounded-full flex items-center justify-center shadow-xs transition-all border ${
                    kegelSessions >= num
                      ? 'bg-[#44634B] text-white border-[#344738]'
                      : 'bg-[#F7FAF5] dark:bg-[#161C17] text-stone-400 border-[#E0E3DF] dark:border-[#2D382F]'
                  }`}
                  title={`Session ${num}`}
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </button>
              ))}
            </div>
          </div>

          {/* Daily Supplements Checkbox */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E4DC] dark:border-[#2D382F]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Pill className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5] block">
                  Postnatal Vitamins &amp; Calcium
                </span>
                <span className="text-xs text-[#75706B] dark:text-[#9E9892]">
                  Iron, Calcium &amp; Omega-3 DHA
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSupplementsTaken(!supplementsTaken)}
              className={`tap-feedback px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1 border ${
                supplementsTaken
                  ? 'bg-[#44634B] text-white border-[#344738]'
                  : 'bg-[#F7FAF5] dark:bg-[#161C17] text-[#75706B] border-[#E0E3DF] dark:border-[#2D382F]'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{supplementsTaken ? 'Taken' : 'Not yet'}</span>
            </button>
          </div>

          {/* Recovery & Pain Level Rating */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#191C1A] dark:text-[#FAF8F5]">
                Comfort &amp; Recovery Rating
              </span>
              <span className="font-semibold text-[#44634B] dark:text-[#ADCFB1]">
                {painLevel === 0 ? 'No Pain / Healed' : painLevel <= 2 ? 'Mild Soreness' : 'Noticeable Discomfort'}
              </span>
            </div>
            <div className="flex gap-2">
              {[
                { val: 0, label: '0 Normal' },
                { val: 1, label: '1 Mild' },
                { val: 2, label: '2 Sore' },
                { val: 3, label: '3 Tender' },
              ].map((lvl) => (
                <button
                  key={lvl.val}
                  type="button"
                  onClick={() => setPainLevel(lvl.val)}
                  className={`tap-feedback flex-1 py-1.5 rounded-xl text-xs font-semibold border ${
                    painLevel === lvl.val
                      ? 'bg-[#44634B] text-white border-[#344738]'
                      : 'bg-[#F7FAF5] dark:bg-[#161C17] text-[#75706B] border-[#E0E3DF] dark:border-[#2D382F]'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Ayurvedic Nourishment & Galactagogues */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🥣</span>
            <h3 className="text-sm sm:text-base font-bold text-[#191C1A] dark:text-[#FAF8F5]">
              Ayurvedic Healing &amp; Galactagogues
            </h3>
          </div>
          <span className="text-xs text-[#75706B] dark:text-[#9E9892]">Traditional Wisdom</span>
        </div>

        <div className="space-y-3">
          {GALACTAGOGUES.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white dark:bg-[#1E2520] border border-[#E8E4DC] dark:border-[#2D382F] shadow-xs flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#44634B]"></span>
                <h4 className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5]">
                  {item.name}
                </h4>
              </div>
              <p className="text-xs text-[#424842] dark:text-[#9E9892] leading-relaxed">
                {item.benefit}
              </p>
              <div className="mt-1 p-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] text-xs text-[#191C1A] dark:text-[#FAF8F5] font-medium border border-[#E0E3DF] dark:border-[#2D382F]">
                <strong>Preparation:</strong> {item.prep}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Save Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleSaveDayLog}
          className="tap-feedback w-full h-12 rounded-full bg-[#44634B] hover:bg-[#344738] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>{isSavedToday ? 'Saved Today’s Wellness Log!' : 'Save Mom Care Log'}</span>
        </button>
      </div>

    </div>
  );
};
