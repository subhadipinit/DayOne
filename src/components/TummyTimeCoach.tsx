'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Award,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Clock,
  Heart,
  Smile,
  Meh,
  Frown,
  CheckCircle2,
  Trash2,
  Eye,
  Info,
} from 'lucide-react';
import { TummyTimeSession, ChildProfile } from '@/lib/types';
import { syncSingleRecord, deleteSingleRecord } from '@/lib/syncService';
import confetti from 'canvas-confetti';

interface TummyTimeCoachProps {
  profile: ChildProfile;
  sessions?: TummyTimeSession[];
  onSaveSession?: (session: Omit<TummyTimeSession, 'id'>) => void;
  onDeleteSession?: (id: string) => void;
  userRole?: 'parent' | 'family';
}

// 8 High-Contrast Sensory Graphics (SVG based, crisp at any resolution)
interface SensoryCard {
  id: string;
  name: string;
  theme: 'black-white' | 'red-accent';
  description: string;
  renderSvg: () => React.ReactNode;
}

const SENSORY_CARDS: SensoryCard[] = [
  {
    id: 'bullseye',
    name: 'Concentric Bullseye',
    theme: 'black-white',
    description: 'Focuses newborn macular vision and visual tracking.',
    renderSvg: () => (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <circle cx="100" cy="100" r="95" fill="#000000" />
        <circle cx="100" cy="100" r="76" fill="#FFFFFF" />
        <circle cx="100" cy="100" r="57" fill="#000000" />
        <circle cx="100" cy="100" r="38" fill="#FFFFFF" />
        <circle cx="100" cy="100" r="19" fill="#000000" />
      </svg>
    ),
  },
  {
    id: 'checkerboard',
    name: 'High-Contrast Checkerboard',
    theme: 'black-white',
    description: 'Sharp grid edges stimulate primary visual cortex neurons.',
    renderSvg: () => (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <rect width="200" height="200" fill="#FFFFFF" />
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2, 3].map((col) =>
            (row + col) % 2 === 0 ? (
              <rect key={`${row}-${col}`} x={col * 50} y={row * 50} width="50" height="50" fill="#000000" />
            ) : null
          )
        )}
      </svg>
    ),
  },
  {
    id: 'spiral',
    name: 'Hypnotic Spiral Rays',
    theme: 'black-white',
    description: 'Promotes head turning and neck muscle engagement.',
    renderSvg: () => (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <rect width="200" height="200" fill="#FFFFFF" />
        <g transform="translate(100,100)">
          {Array.from({ length: 12 }).map((_, i) => (
            <path
              key={i}
              d="M 0 0 L 80 -25 A 95 95 0 0 1 80 25 Z"
              fill="#000000"
              transform={`rotate(${i * 30})`}
            />
          ))}
          <circle cx="0" cy="0" r="24" fill="#E2765A" />
        </g>
      </svg>
    ),
  },
  {
    id: 'panda',
    name: 'Sensory Panda Face',
    theme: 'black-white',
    description: 'Infants are biologically wired to seek face-like shapes.',
    renderSvg: () => (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <rect width="200" height="200" fill="#000000" />
        {/* White head */}
        <circle cx="100" cy="105" r="72" fill="#FFFFFF" />
        {/* Ears */}
        <circle cx="48" cy="48" r="26" fill="#FFFFFF" />
        <circle cx="48" cy="48" r="18" fill="#000000" />
        <circle cx="152" cy="48" r="26" fill="#FFFFFF" />
        <circle cx="152" cy="48" r="18" fill="#000000" />
        {/* Eye Patches */}
        <ellipse cx="72" cy="98" rx="20" ry="15" transform="rotate(-15 72 98)" fill="#000000" />
        <ellipse cx="128" cy="98" rx="20" ry="15" transform="rotate(15 128 98)" fill="#000000" />
        {/* Eye pupils */}
        <circle cx="75" cy="98" r="6" fill="#FFFFFF" />
        <circle cx="125" cy="98" r="6" fill="#FFFFFF" />
        {/* Nose & Smile */}
        <ellipse cx="100" cy="122" rx="14" ry="10" fill="#000000" />
        <path d="M 88 135 Q 100 148 112 135" stroke="#000000" strokeWidth="6" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  {
    id: 'heart-red',
    name: 'Bold Red Center Heart',
    theme: 'red-accent',
    description: 'Red is the very first color wavelength newborn cones perceive.',
    renderSvg: () => (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <rect width="200" height="200" fill="#000000" />
        <circle cx="100" cy="100" r="88" fill="#FFFFFF" />
        <path
          d="M 100 152 C 55 120 40 85 58 64 C 74 46 92 56 100 70 C 108 56 126 46 142 64 C 160 85 145 120 100 152 Z"
          fill="#E22E42"
        />
      </svg>
    ),
  },
  {
    id: 'stripes',
    name: 'Vertical Zebra Bars',
    theme: 'black-white',
    description: 'Encourages horizontal eye saccades and tracking.',
    renderSvg: () => (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <rect width="200" height="200" fill="#FFFFFF" />
        {[0, 40, 80, 120, 160].map((x) => (
          <rect key={x} x={x} y="0" width="20" height="200" fill="#000000" />
        ))}
      </svg>
    ),
  },
  {
    id: 'star-burst',
    name: 'Radiant Starburst',
    theme: 'red-accent',
    description: 'High contrast radial expansion for depth perception.',
    renderSvg: () => (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <rect width="200" height="200" fill="#000000" />
        <g transform="translate(100,100)">
          {Array.from({ length: 8 }).map((_, i) => (
            <polygon
              key={i}
              points="0,-85 18,-25 0,0 -18,-25"
              fill={i % 2 === 0 ? '#FFFFFF' : '#E22E42'}
              transform={`rotate(${i * 45})`}
            />
          ))}
          <circle cx="0" cy="0" r="22" fill="#FFFFFF" />
          <circle cx="0" cy="0" r="10" fill="#000000" />
        </g>
      </svg>
    ),
  },
  {
    id: 'moon-stars',
    name: 'Cosmic Moon & Stars',
    theme: 'black-white',
    description: 'Soft curved and pointed geometries for visual exploration.',
    renderSvg: () => (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <rect width="200" height="200" fill="#000000" />
        {/* Crescent Moon */}
        <path
          d="M 120 30 A 68 68 0 1 0 152 145 A 76 76 0 0 1 120 30 Z"
          fill="#FFFFFF"
        />
        {/* Small stars */}
        <polygon points="50,45 53,53 62,55 55,60 57,69 50,64 43,69 45,60 38,55 47,53" fill="#FFFFFF" />
        <polygon points="155,50 157,56 163,58 158,62 160,68 155,64 150,68 152,62 147,58 153,56" fill="#FFFFFF" />
        <polygon points="60,140 62,145 68,147 64,150 65,155 60,152 55,155 56,150 52,147 58,145" fill="#FFFFFF" />
      </svg>
    ),
  },
];

export const TummyTimeCoach: React.FC<TummyTimeCoachProps> = ({
  profile,
  sessions = [],
  onSaveSession,
  onDeleteSession,
  userRole = 'parent',
}) => {
  // Timer state
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [targetPresetSeconds, setTargetPresetSeconds] = useState<number>(180); // 3 mins default
  const [sessionMood, setSessionMood] = useState<'happy' | 'calm' | 'fussy'>('happy');
  const [notes, setNotes] = useState<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // High-Contrast Sensory Deck state
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);

  // Local sessions fallback if store not wired yet
  const [localSessions, setLocalSessions] = useState<TummyTimeSession[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dayone_tummy_sessions');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const allSessions = sessions.length > 0 ? sessions : localSessions;

  // Calculate today's tummy time total
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysSessions = allSessions.filter((s) => s.timestamp.startsWith(todayStr));
  const todayTotalSeconds = todaysSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const dailyGoalMinutes = 20; // 20 mins standard recommendation
  const dailyGoalSeconds = dailyGoalMinutes * 60;
  const progressPercent = Math.min(100, Math.round((todayTotalSeconds / dailyGoalSeconds) * 100));

  // Timer interval effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => {
          const next = prev + 1;
          // Trigger confetti on hitting target preset
          if (next === targetPresetSeconds && next > 0) {
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
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, targetPresetSeconds]);

  // Slideshow auto-advance effect (every 6 seconds)
  useEffect(() => {
    if (isAutoAdvancing) {
      autoAdvanceRef.current = setInterval(() => {
        setCurrentCardIndex((prev) => (prev + 1) % SENSORY_CARDS.length);
      }, 6000);
    } else {
      if (autoAdvanceRef.current) {
        clearInterval(autoAdvanceRef.current);
        autoAdvanceRef.current = null;
      }
    }
    return () => {
      if (autoAdvanceRef.current) {
        clearInterval(autoAdvanceRef.current);
        autoAdvanceRef.current = null;
      }
    };
  }, [isAutoAdvancing]);

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsElapsed(0);
  };

  const handleSave = () => {
    if (secondsElapsed <= 0) return;
    const newSession: TummyTimeSession = {
      id: `tt_${Date.now()}`,
      childId: profile.id,
      timestamp: new Date().toISOString(),
      durationSeconds: secondsElapsed,
      mood: sessionMood,
      notes: notes.trim() || undefined,
    };

    if (onSaveSession) {
      onSaveSession(newSession);
    } else {
      const updated = [newSession, ...localSessions];
      setLocalSessions(updated);
      localStorage.setItem('dayone_tummy_sessions', JSON.stringify(updated));
    }

    syncSingleRecord('tummy_time_logs', {
      id: newSession.id,
      child_id: profile?.id || null,
      timestamp: newSession.timestamp,
      duration_seconds: newSession.durationSeconds,
      mood: newSession.mood,
      notes: newSession.notes || null,
    });

    // Reset timer
    handleReset();
    setNotes('');

    // Confetti celebration
    try {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  };

  const handleDelete = (id: string) => {
    if (onDeleteSession) {
      onDeleteSession(id);
    } else {
      const updated = localSessions.filter((s) => s.id !== id);
      setLocalSessions(updated);
      localStorage.setItem('dayone_tummy_sessions', JSON.stringify(updated));
    }
    deleteSingleRecord('tummy_time_logs', id);
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentCard = SENSORY_CARDS[currentCardIndex];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-[#E2765A]/10 border border-[#EAE6DF] dark:border-[#2D2B33] flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-xl bg-[#E2765A] text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#201E1D] dark:text-[#FAF8F5]">
              Tummy Time Coach & Sensory Play
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#75706B] dark:text-[#9E9892] max-w-xl">
            Builds head control, shoulder strength, and prevents flat head syndrome (plagiocephaly). Pair with high-contrast newborn visual cards to keep baby delighted.
          </p>
        </div>

        {/* Daily Goal Gauge */}
        <div className="flex items-center gap-4 bg-white dark:bg-[#1D1C22] p-3.5 rounded-2xl border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs shrink-0">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="currentColor"
                strokeWidth="5"
                fill="transparent"
                className="text-[#EAE6DF] dark:text-[#2D2B33]"
              />
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="currentColor"
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 22}
                strokeDashoffset={2 * Math.PI * 22 * (1 - progressPercent / 100)}
                strokeLinecap="round"
                className="text-[#E2765A] transition-all duration-500"
              />
            </svg>
            <span className="absolute text-[11px] font-bold text-[#201E1D] dark:text-[#FAF8F5]">
              {progressPercent}%
            </span>
          </div>

          <div>
            <div className="text-[10px] font-semibold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider">
              Today's Progress
            </div>
            <div className="text-sm font-bold text-[#201E1D] dark:text-[#FAF8F5]">
              {Math.floor(todayTotalSeconds / 60)}m / {dailyGoalMinutes}m
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              {todaysSessions.length} {todaysSessions.length === 1 ? 'session' : 'sessions'} logged today
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Stopwatch on Left, Visual Sensory Deck on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: Live Tummy Time Stopwatch Panel (5 Cols) */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-sm flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#201E1D] dark:text-[#FAF8F5] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#E2765A]" />
                <span>Session Stopwatch</span>
              </h3>

              {/* Target Preset Selector */}
              <div className="flex items-center gap-1 bg-[#FAF8F5] dark:bg-[#141317] p-1 rounded-xl border border-[#EAE6DF] dark:border-[#2D2B33]">
                {[
                  { label: '2m', secs: 120 },
                  { label: '3m', secs: 180 },
                  { label: '5m', secs: 300 },
                  { label: '10m', secs: 600 },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setTargetPresetSeconds(p.secs)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                      targetPresetSeconds === p.secs
                        ? 'bg-[#E2765A] text-white shadow-xs'
                        : 'text-[#75706B] dark:text-[#9E9892] hover:text-[#201E1D] dark:hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Large Digital Counter */}
            <div className="py-8 rounded-2xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] text-center relative overflow-hidden">
              <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-[#201E1D] dark:text-[#FAF8F5]">
                {formatTime(secondsElapsed)}
              </div>
              <p className="text-[11px] text-[#75706B] dark:text-[#9E9892] mt-1.5">
                Target: {formatTime(targetPresetSeconds)} • {isRunning ? '⏱️ Timing in progress...' : 'Ready'}
              </p>

              {/* Progress bar under counter */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#EAE6DF] dark:bg-[#2D2B33]">
                <div
                  className="h-full bg-[#E2765A] transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (secondsElapsed / targetPresetSeconds) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Stopwatch Controls */}
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={handleStartPause}
                className={`flex-1 py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] ${
                  isRunning
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                    : 'bg-[#E2765A] hover:bg-[#D26549] shadow-[#E2765A]/25'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause Session</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 ml-0.5 fill-current" />
                    <span>{secondsElapsed > 0 ? 'Resume Session' : 'Start Tummy Time'}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                disabled={secondsElapsed === 0}
                className="p-3 rounded-2xl border border-[#EAE6DF] dark:border-[#2D2B33] text-[#75706B] dark:text-[#9E9892] hover:text-[#201E1D] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-40"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Save Session Form */}
          {secondsElapsed > 0 && (
            <div className="pt-4 border-t border-[#EAE6DF] dark:border-[#2D2B33] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#75706B] dark:text-[#9E9892]">
                  How was baby's mood?
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSessionMood('happy')}
                    className={`p-1.5 rounded-xl border flex items-center gap-1 text-xs font-semibold transition-all ${
                      sessionMood === 'happy'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-[#EAE6DF] dark:border-[#2D2B33] text-[#75706B]'
                    }`}
                  >
                    <Smile className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Happy</span>
                  </button>
                  <button
                    onClick={() => setSessionMood('calm')}
                    className={`p-1.5 rounded-xl border flex items-center gap-1 text-xs font-semibold transition-all ${
                      sessionMood === 'calm'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                        : 'border-[#EAE6DF] dark:border-[#2D2B33] text-[#75706B]'
                    }`}
                  >
                    <Meh className="w-3.5 h-3.5 text-blue-500" />
                    <span>Calm</span>
                  </button>
                  <button
                    onClick={() => setSessionMood('fussy')}
                    className={`p-1.5 rounded-xl border flex items-center gap-1 text-xs font-semibold transition-all ${
                      sessionMood === 'fussy'
                        ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'border-[#EAE6DF] dark:border-[#2D2B33] text-[#75706B]'
                    }`}
                  >
                    <Frown className="w-3.5 h-3.5 text-amber-500" />
                    <span>Fussy</span>
                  </button>
                </div>
              </div>

              <input
                type="text"
                placeholder="Optional notes (e.g. rolled towel under chest, lifted head high)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#E2765A]"
              />

              <button
                onClick={handleSave}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Session ({formatTime(secondsElapsed)})</span>
              </button>
            </div>
          )}

          {/* Pediatric Guidance Note */}
          <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] text-[11px] text-[#75706B] dark:text-[#9E9892] space-y-1">
            <div className="font-semibold text-[#201E1D] dark:text-[#FAF8F5] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#E2765A]" />
              <span>Age-Appropriate Milestones:</span>
            </div>
            <p>
              • <strong>0–1 Month:</strong> 1–3 min bursts on parent's chest or lap.
              <br />• <strong>2–3 Months:</strong> 15–20 mins daily total; lifts head to 45°–90°.
              <br />• <strong>4–6 Months:</strong> 30+ mins daily; pushes up onto straight arms and pivots.
            </p>
          </div>
        </div>

        {/* RIGHT: High-Contrast Visual Sensory Deck (7 Cols) */}
        <div className="lg:col-span-7 p-5 rounded-3xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-sm flex flex-col justify-between space-y-4">
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#201E1D] dark:text-[#FAF8F5] flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#E2765A]" />
                <span>High-Contrast Sensory Deck</span>
              </h3>
              <p className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
                Place phone/tablet 8–12 inches from baby’s eyes during tummy time.
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsAutoAdvancing(!isAutoAdvancing)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isAutoAdvancing
                    ? 'bg-[#E2765A] text-white border-[#E2765A] shadow-xs'
                    : 'border-[#EAE6DF] dark:border-[#2D2B33] text-[#75706B] dark:text-[#9E9892] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                title="Auto advance cards every 6 seconds"
              >
                {isAutoAdvancing ? 'Auto Slideshow (On)' : 'Slideshow (Off)'}
              </button>

              <button
                onClick={() => setIsFullscreen(true)}
                className="p-1.5 rounded-xl border border-[#EAE6DF] dark:border-[#2D2B33] text-[#75706B] dark:text-[#9E9892] hover:text-[#201E1D] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                title="Full-Screen Sensory Mode"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card Presentation Frame */}
          <div className="relative aspect-square max-h-[380px] w-full mx-auto rounded-3xl overflow-hidden border-4 border-black dark:border-white/20 shadow-xl flex items-center justify-center bg-black">
            <div className="w-full h-full p-4 flex items-center justify-center">
              {currentCard.renderSvg()}
            </div>

            {/* Left / Right Navigation Overlays */}
            <button
              onClick={() => setCurrentCardIndex((prev) => (prev - 1 + SENSORY_CARDS.length) % SENSORY_CARDS.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-black flex items-center justify-center shadow-lg transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setCurrentCardIndex((prev) => (prev + 1) % SENSORY_CARDS.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-black flex items-center justify-center shadow-lg transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Bottom Card Label */}
            <div className="absolute bottom-3 left-4 right-4 px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md text-white text-center flex items-center justify-between">
              <span className="text-xs font-semibold">{currentCard.name}</span>
              <span className="text-[10px] text-zinc-300">
                Card {currentCardIndex + 1} of {SENSORY_CARDS.length}
              </span>
            </div>
          </div>

          {/* Thumbnail Navigation Strip */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {SENSORY_CARDS.map((card, idx) => (
              <button
                key={card.id}
                onClick={() => {
                  setCurrentCardIndex(idx);
                  setIsAutoAdvancing(false);
                }}
                className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all p-1 bg-black ${
                  currentCardIndex === idx
                    ? 'border-[#E2765A] scale-105 shadow-sm'
                    : 'border-[#EAE6DF] dark:border-[#2D2B33] opacity-60 hover:opacity-100'
                }`}
              >
                {card.renderSvg()}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* Recent Tummy Time Sessions List */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs">
        <h4 className="text-xs font-semibold text-[#75706B] dark:text-[#9E9892] mb-3 uppercase tracking-wider">
          Recorded Tummy Time Sessions ({allSessions.length})
        </h4>

        {allSessions.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#75706B] dark:text-[#9E9892]">
            No tummy time sessions recorded yet. Start the stopwatch above to log your first milestone!
          </div>
        ) : (
          <div className="divide-y divide-[#EAE6DF] dark:divide-[#2D2B33]">
            {allSessions.slice(0, 5).map((s) => {
              const dateObj = new Date(s.timestamp);
              const dateStr = dateObj.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });
              const timeStr = dateObj.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#201E1D] dark:text-[#FAF8F5]">
                        {formatTime(s.durationSeconds)} Tummy Time
                      </div>
                      <div className="text-[10px] text-[#75706B] dark:text-[#9E9892]">
                        {dateStr} at {timeStr}
                        {s.notes && ` • "${s.notes}"`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                        s.mood === 'happy'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : s.mood === 'calm'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}
                    >
                      {s.mood === 'happy' && <Smile className="w-3 h-3" />}
                      {s.mood === 'calm' && <Meh className="w-3 h-3" />}
                      {s.mood === 'fussy' && <Frown className="w-3 h-3" />}
                      <span className="capitalize">{s.mood}</span>
                    </span>

                    {userRole === 'parent' && (
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1 text-[#75706B] hover:text-[#CB6145] transition-colors"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FULLSCREEN SENSORY MODAL */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between p-6 animate-in fade-in duration-200">
          <div className="w-full flex items-center justify-between text-white/80">
            <span className="text-sm font-semibold">{currentCard.name}</span>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              title="Exit Fullscreen"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          <div className="w-full max-w-lg aspect-square flex items-center justify-center p-4">
            {currentCard.renderSvg()}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentCardIndex((prev) => (prev - 1 + SENSORY_CARDS.length) % SENSORY_CARDS.length)}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold"
            >
              Previous Card
            </button>
            <button
              onClick={() => setCurrentCardIndex((prev) => (prev + 1) % SENSORY_CARDS.length)}
              className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold"
            >
              Next Card
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
