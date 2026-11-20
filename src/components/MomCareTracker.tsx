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
  Check,
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
      return saved ? parseInt(saved, 10) : 9; // 9 * 250 = 2.25 L
    }
    return 9;
  });

  const [activeMood, setActiveMood] = useState<MoodType>('content');
  const [sleepHours, setSleepHours] = useState<number>(6.5);
  const [kegelSessions, setKegelSessions] = useState<number>(2);
  const [painLevel, setPainLevel] = useState<number>(1);
  const [supplementsTaken, setSupplementsTaken] = useState<boolean>(true);
  const [momNotes, setMomNotes] = useState<string>('');
  const [isSavedToday, setIsSavedToday] = useState<boolean>(false);

  const TARGET_GLASSES = 12; // 12 glasses x 250ml = 3,000ml (3 Liters)
  const hydrationLiters = ((waterGlasses * 250) / 1000).toFixed(2);
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
      });
    } catch (e) {
      // ignore
    }
    setTimeout(() => setIsSavedToday(false), 3000);
  };

  return (
    <div className="flex flex-col w-full pb-8 space-y-6">
      {/* Top Greeting & Maternal Affirmation Header */}
      <section className="flex flex-col gap-2 pt-1">
        <div className="inline-flex items-center gap-1.5 self-start px-3.5 py-1 rounded-full bg-primary-fixed/60 text-on-primary-fixed-variant shadow-xs">
          <span className="material-symbols-outlined text-[16px] text-primary">auto_awesome</span>
          <span className="font-label-md text-label-md font-semibold">You are doing amazing, Mama</span>
          <span className="text-[13px]">🌸</span>
        </div>
        <div className="flex flex-col">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">
            Mom Care &amp; Recovery
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Postpartum Wellness, Lactation Hydration &amp; Daily Self-Care
          </p>
        </div>
      </section>

      {/* Daily Maternal Wellness Bento */}
      <section className="flex flex-col gap-4">
        {/* Mood & Emotional Status */}
        <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-sm border border-outline-variant/30 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">spa</span>
              <span className="font-label-lg text-label-lg text-on-surface font-bold">
                How are you feeling today?
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-primary font-semibold">
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
                  className={`flex items-center justify-between px-4 py-3 rounded-full transition-all text-left ${
                    isSelected
                      ? 'bg-primary text-on-primary font-bold shadow-xs'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container border border-outline-variant/20'
                  }`}
                  type="button"
                >
                  <span className="font-label-md text-label-md">{mood.label}</span>
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-on-primary text-primary' : 'bg-surface-container-high text-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hydration Tracker (Lactation Hydration) */}
        <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-sm border border-outline-variant/30 flex flex-col gap-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">water_drop</span>
              </div>
              <span className="font-label-lg text-label-lg text-on-surface font-bold">
                Lactation Hydration
              </span>
            </div>
            <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-primary-fixed/60 text-on-primary-fixed-variant font-semibold">
              {hydrationPercent}% of Daily Goal
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div>
              <span className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
                {hydrationLiters}
              </span>
              <span className="font-body-md text-body-md text-on-surface-variant font-medium">
                {' '}
                / 3.0 Liters
              </span>
              <span className="font-label-sm text-label-sm text-outline block mt-0.5">
                {waterGlasses} of {TARGET_GLASSES} glasses (250 mL each)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpdateWater(-1)}
                disabled={waterGlasses === 0}
                className="w-10 h-10 rounded-full bg-surface-container text-on-surface flex items-center justify-center active:scale-95 transition-all disabled:opacity-40"
                type="button"
                title="Subtract 1 glass"
              >
                <span className="material-symbols-outlined text-[18px]">remove</span>
              </button>
              <button
                onClick={() => handleUpdateWater(1)}
                className="h-10 px-4 rounded-full bg-primary text-on-primary font-label-md text-label-md flex items-center gap-1 active:scale-95 transition-all shadow-xs font-semibold"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>250 mL</span>
              </button>
            </div>
          </div>

          {/* Water intake progress bar */}
          <div className="w-full h-3 rounded-full bg-surface-container mt-1 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${hydrationPercent}%` }}
            ></div>
          </div>

          <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5 pt-0.5 text-xs">
            <span className="material-symbols-outlined text-[16px] text-primary shrink-0">info</span>
            <span>Optimal hydration directly supports healthy breast milk volume and maternal energy.</span>
          </p>
        </div>

        {/* Rest & Sleep Breakdown */}
        <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-sm border border-outline-variant/30 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-[18px]">bedtime</span>
              </div>
              <span className="font-label-lg text-label-lg text-on-surface font-bold">
                Rest &amp; Nocturnal Recovery
              </span>
            </div>
            <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-semibold">
              Last Night
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="font-headline-xl text-headline-xl text-on-surface font-bold">
                {sleepHours}h
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant block text-xs">
                Total sleep (broken nocturnal stretches)
              </span>
            </div>
            <div className="text-right">
              <span className="font-label-sm text-label-sm px-3 py-1 rounded-full bg-tertiary-fixed/60 text-on-tertiary-fixed font-bold inline-block">
                Longest stretch: 3h 15m
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant block mt-1 text-xs">
                Deep restoration: 1h 45m
              </span>
            </div>
          </div>

          {/* Segmented nocturnal sleep timeline visual */}
          <div className="flex gap-1 h-3 w-full rounded-full overflow-hidden bg-surface-container mt-1">
            <div className="bg-tertiary-container h-full rounded-full" style={{ width: '25%' }} title="Deep Sleep"></div>
            <div className="bg-surface-container-highest h-full" style={{ width: '10%' }} title="Awake / Feeding"></div>
            <div className="bg-primary-container h-full rounded-full" style={{ width: '45%' }} title="Core Sleep"></div>
            <div className="bg-surface-container-highest h-full" style={{ width: '8%' }} title="Awake / Diaper"></div>
            <div className="bg-primary-fixed-dim h-full rounded-full" style={{ width: '12%' }} title="Morning Nap"></div>
          </div>
          <div className="flex justify-between text-[11px] text-on-surface-variant px-0.5 font-label-sm">
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
            <span className="material-symbols-outlined text-primary text-[22px]">self_improvement</span>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
              Pelvic Floor &amp; Core Recovery
            </h3>
          </div>
          <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-bold">
            Week 6+ Safe
          </span>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-sm border border-outline-variant/30 flex flex-col gap-4">
          {/* Daily Kegel Reminder Widget */}
          <div className="flex items-center justify-between pb-3 border-b border-surface-container">
            <div>
              <span className="font-label-lg text-label-lg text-on-surface font-bold block">
                Daily Kegel Activations
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                {kegelSessions} of 3 sets completed today
              </span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => toggleKegelSession(num)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shadow-xs transition-all ${
                    kegelSessions >= num
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-outline hover:bg-surface-container-high'
                  }`}
                  title={`Session ${num}`}
                >
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </button>
              ))}
            </div>
          </div>

          {/* Daily Supplements Checkbox */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-[18px]">pill</span>
              </div>
              <div>
                <span className="font-label-md text-label-md text-on-surface font-bold block">
                  Postnatal Vitamins &amp; Calcium
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                  Iron, Calcium &amp; Omega-3 DHA
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSupplementsTaken(!supplementsTaken)}
              className={`px-3.5 py-1.5 rounded-full font-label-sm text-label-sm font-semibold transition-all flex items-center gap-1 ${
                supplementsTaken
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {supplementsTaken ? 'check' : 'close'}
              </span>
              <span>{supplementsTaken ? 'Taken' : 'Not yet'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Ayurvedic Nourishment & Galactagogues */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-[22px]">restaurant</span>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
              Ayurvedic Healing &amp; Galactagogues
            </h3>
          </div>
          <span className="font-label-sm text-label-sm text-outline">Traditional Wisdom</span>
        </div>

        <div className="space-y-3">
          {GALACTAGOGUES.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <h4 className="font-label-lg text-label-lg text-on-surface font-bold">
                  {item.name}
                </h4>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-xs leading-relaxed">
                {item.benefit}
              </p>
              <div className="mt-1 p-2.5 rounded-xl bg-surface-container-low text-xs text-on-surface-variant font-medium">
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
          className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold shadow-md hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">
            {isSavedToday ? 'check' : 'favorite'}
          </span>
          <span>{isSavedToday ? 'Saved Today’s Wellness Log!' : 'Save Mom Care Log'}</span>
        </button>
      </div>
    </div>
  );
};
