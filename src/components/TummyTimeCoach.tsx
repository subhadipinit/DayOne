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
  Volume2,
  VolumeX,
} from 'lucide-react';
import { TummyTimeSession, ChildProfile } from '@/lib/types';
import { syncSingleRecord, deleteSingleRecord } from '@/lib/syncService';
import { generateUniqueId } from '@/lib/store';
import confetti from 'canvas-confetti';

interface TummyTimeCoachProps {
  profile: ChildProfile;
  sessions?: TummyTimeSession[];
  onSaveSession?: (session: Omit<TummyTimeSession, 'id'>) => void;
  onDeleteSession?: (id: string) => void;
  userRole?: 'parent' | 'family';
}

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
          <circle cx="0" cy="0" r="24" fill="#D97757" />
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
        <circle cx="100" cy="105" r="72" fill="#FFFFFF" />
        <circle cx="48" cy="48" r="26" fill="#FFFFFF" />
        <circle cx="48" cy="48" r="18" fill="#000000" />
        <circle cx="152" cy="48" r="26" fill="#FFFFFF" />
        <circle cx="152" cy="48" r="18" fill="#000000" />
        <ellipse cx="72" cy="98" rx="20" ry="15" transform="rotate(-15 72 98)" fill="#000000" />
        <ellipse cx="128" cy="98" rx="20" ry="15" transform="rotate(15 128 98)" fill="#000000" />
        <circle cx="75" cy="98" r="6" fill="#FFFFFF" />
        <circle cx="125" cy="98" r="6" fill="#FFFFFF" />
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
        <path
          d="M 120 30 A 68 68 0 1 0 152 145 A 76 76 0 0 1 120 30 Z"
          fill="#FFFFFF"
        />
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
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // High-Contrast Sensory Deck state
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);

  // Local sessions fallback
  const [localSessions, setLocalSessions] = useState<TummyTimeSession[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`dayone_tummy_sessions_${profile.id}`) || localStorage.getItem('dayone_tummy_sessions');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    const loadSaved = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`dayone_tummy_sessions_${profile.id}`) || localStorage.getItem('dayone_tummy_sessions');
        if (saved) {
          try {
            setLocalSessions(JSON.parse(saved));
          } catch (e) {
            // ignore
          }
        }
      }
    };
    loadSaved();
    window.addEventListener('dayone:data-hydrated', loadSaved);
    return () => window.removeEventListener('dayone:data-hydrated', loadSaved);
  }, [profile.id]);

  const allSessions = sessions.length > 0 ? sessions : localSessions;

  // Calculate today's tummy time total
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysSessions = allSessions.filter((s) => s.timestamp.startsWith(todayStr));
  const todayTotalSeconds = todaysSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const dailyGoalMinutes = 20;
  const dailyGoalSeconds = dailyGoalMinutes * 60;
  const progressPercent = Math.min(100, Math.round((todayTotalSeconds / dailyGoalSeconds) * 100));

  // Synthesize soft cue sound via Web Audio API
  const playCueSound = (freq = 520, duration = 0.2) => {
    if (!isSoundEnabled || typeof window === 'undefined') return;
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + duration);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // ignore
    }
  };

  // Timer interval effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => {
          const next = prev + 1;
          if (next === targetPresetSeconds && next > 0) {
            playCueSound(680, 0.4);
            try {
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 },
                colors: ['#44634B', '#C8EBCC', '#D97757'],
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
  }, [isRunning, targetPresetSeconds, isSoundEnabled]);

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
    playCueSound(isRunning ? 440 : 587, 0.15);
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsElapsed(0);
  };

  const handleSave = () => {
    if (secondsElapsed <= 0) return;
    const newSession: TummyTimeSession = {
      id: generateUniqueId('tt'),
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
      localStorage.setItem(`dayone_tummy_sessions_${profile.id}`, JSON.stringify(updated));
    }

    syncSingleRecord('tummy_time_logs', {
      id: newSession.id,
      child_id: profile?.id || null,
      timestamp: newSession.timestamp,
      duration_seconds: newSession.durationSeconds,
      mood: newSession.mood,
      notes: newSession.notes || null,
    });

    handleReset();
    setNotes('');

    try {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#44634B', '#C8EBCC', '#D97757'],
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
      localStorage.setItem(`dayone_tummy_sessions_${profile.id}`, JSON.stringify(updated));
    }
    deleteSingleRecord('tummy_time_logs', id);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentCard = SENSORY_CARDS[currentCardIndex];

  return (
    <div className="space-y-6 animate-reveal">

      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1E2520] border border-[#E8E4DC] dark:border-[#2D382F] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-xl bg-[#44634B] text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#191C1A] dark:text-[#FAF8F5]">
              Tummy Time Coach &amp; Sensory Play
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#424842] dark:text-[#9E9892] max-w-xl">
            Builds head control, shoulder strength, and prevents flat head syndrome (plagiocephaly). Pair with high-contrast newborn visual cards to keep baby delighted.
          </p>
        </div>

        {/* Daily Goal Gauge */}
        <div className="flex items-center gap-4 bg-[#F7FAF5] dark:bg-[#161C17] p-3.5 rounded-2xl border border-[#E0E3DF] dark:border-[#2D382F] shadow-xs shrink-0">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="currentColor"
                strokeWidth="5"
                fill="transparent"
                className="text-[#E6E9E4] dark:text-[#2D382F]"
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
                className="text-[#44634B] transition-all duration-500"
              />
            </svg>
            <span className="absolute text-[11px] font-bold text-[#191C1A] dark:text-[#FAF8F5]">
              {progressPercent}%
            </span>
          </div>

          <div>
            <div className="text-[10px] font-semibold text-[#424842] dark:text-[#9E9892] uppercase tracking-wider">
              Today's Progress
            </div>
            <div className="text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5]">
              {Math.floor(todayTotalSeconds / 60)}m / {dailyGoalMinutes}m
            </div>
            <div className="text-[10px] text-[#44634B] dark:text-[#ADCFB1] font-semibold">
              {todaysSessions.length} {todaysSessions.length === 1 ? 'session' : 'sessions'} logged today
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Stopwatch on Left, Visual Sensory Deck on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: Live Tummy Time Stopwatch Panel (5 Cols) */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-white dark:bg-[#1E2520] border border-[#E8E4DC] dark:border-[#2D382F] shadow-xs flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D97757]" />
                <span>Session Stopwatch</span>
              </h3>

              <div className="flex items-center gap-2">
                {/* Sound Toggle */}
                <button
                  type="button"
                  onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                  className={`tap-feedback p-1.5 rounded-full border transition-all ${
                    isSoundEnabled
                      ? 'bg-[#C8EBCC] dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1] border-[#44634B]/30'
                      : 'bg-[#F1F4F0] dark:bg-[#161C17] text-[#75706B] border-[#E0E3DF] dark:border-[#2D382F]'
                  }`}
                  title={isSoundEnabled ? 'Chime sound enabled' : 'Muted'}
                >
                  {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>

                {/* Target Preset Selector */}
                <div className="flex items-center gap-1 bg-[#F1F4F0] dark:bg-[#161C17] p-1 rounded-full border border-[#E0E3DF] dark:border-[#2D382F]">
                  {[
                    { label: '2m', secs: 120 },
                    { label: '3m', secs: 180 },
                    { label: '5m', secs: 300 },
                    { label: '10m', secs: 600 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setTargetPresetSeconds(p.secs)}
                      className={`tap-feedback px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                        targetPresetSeconds === p.secs
                          ? 'bg-[#44634B] text-white shadow-xs'
                          : 'text-[#424842] dark:text-[#9E9892]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Large Digital Counter */}
            <div className="py-8 rounded-2xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E0E3DF] dark:border-[#2D382F] text-center relative overflow-hidden">
              <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-[#191C1A] dark:text-[#FAF8F5]">
                {formatTime(secondsElapsed)}
              </div>
              <p className="text-[11px] text-[#424842] dark:text-[#9E9892] mt-1.5">
                Target: {formatTime(targetPresetSeconds)} • {isRunning ? '⏱️ Timing in progress...' : 'Ready'}
              </p>

              {/* Progress bar under counter */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#E6E9E4] dark:bg-[#2D382F]">
                <div
                  className="h-full bg-[#44634B] transition-all duration-300"
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
                className={`tap-feedback flex-1 py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-xs transition-all ${
                  isRunning
                    ? 'bg-[#D97757] hover:bg-[#c36445]'
                    : 'bg-[#44634B] hover:bg-[#344738]'
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
                className="tap-feedback p-3.5 rounded-2xl border border-[#E0E3DF] dark:border-[#2D382F] text-[#75706B] dark:text-[#9E9892] hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-30"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Save Session Form */}
          {secondsElapsed > 0 && (
            <div className="pt-4 border-t border-[#E8E4DC] dark:border-[#2D382F] space-y-3 animate-reveal">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#75706B] dark:text-[#9E9892]">
                  How was baby's mood?
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSessionMood('happy')}
                    className={`tap-feedback p-1.5 rounded-xl border flex items-center gap-1 text-xs font-semibold transition-all ${
                      sessionMood === 'happy'
                        ? 'border-[#44634B] bg-[#C8EBCC]/40 text-[#03210E] dark:bg-[#203D24] dark:text-[#ADCFB1]'
                        : 'border-[#E0E3DF] dark:border-[#2D382F] text-[#75706B]'
                    }`}
                  >
                    <Smile className="w-3.5 h-3.5 text-[#44634B]" />
                    <span>Happy</span>
                  </button>
                  <button
                    onClick={() => setSessionMood('calm')}
                    className={`tap-feedback p-1.5 rounded-xl border flex items-center gap-1 text-xs font-semibold transition-all ${
                      sessionMood === 'calm'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                        : 'border-[#E0E3DF] dark:border-[#2D382F] text-[#75706B]'
                    }`}
                  >
                    <Meh className="w-3.5 h-3.5 text-blue-500" />
                    <span>Calm</span>
                  </button>
                  <button
                    onClick={() => setSessionMood('fussy')}
                    className={`tap-feedback p-1.5 rounded-xl border flex items-center gap-1 text-xs font-semibold transition-all ${
                      sessionMood === 'fussy'
                        ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'border-[#E0E3DF] dark:border-[#2D382F] text-[#75706B]'
                    }`}
                  >
                    <Frown className="w-3.5 h-3.5 text-amber-500" />
                    <span>Fussy</span>
                  </button>
                </div>
              </div>

              <input
                type="text"
                placeholder="Optional notes (e.g. lifted head high, smiled at cards)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E0E3DF] dark:border-[#2D382F] text-[#191C1A] dark:text-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#44634B]"
              />

              <button
                onClick={handleSave}
                className="tap-feedback w-full py-2.5 rounded-xl font-bold text-xs bg-[#44634B] hover:bg-[#344738] text-white flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Session ({formatTime(secondsElapsed)})</span>
              </button>
            </div>
          )}

          {/* Pediatric Guidance Note */}
          <div className="p-3 rounded-2xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E0E3DF] dark:border-[#2D382F] text-[11px] text-[#75706B] dark:text-[#9E9892] space-y-1">
            <div className="font-semibold text-[#191C1A] dark:text-[#FAF8F5] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#44634B]" />
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
        <div className="lg:col-span-7 p-5 rounded-3xl bg-white dark:bg-[#1E2520] border border-[#E8E4DC] dark:border-[#2D382F] shadow-xs flex flex-col justify-between space-y-4">

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5] flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#D97757]" />
                <span>High-Contrast Sensory Deck</span>
              </h3>
              <p className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
                Place phone/tablet 8–12 inches from baby’s eyes during tummy time.
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsAutoAdvancing(!isAutoAdvancing)}
                className={`tap-feedback px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isAutoAdvancing
                    ? 'bg-[#44634B] text-white border-[#344738] shadow-xs'
                    : 'border-[#E0E3DF] dark:border-[#2D382F] text-[#75706B] dark:text-[#9E9892]'
                }`}
                title="Auto advance cards every 6 seconds"
              >
                {isAutoAdvancing ? 'Auto Slideshow (On)' : 'Slideshow (Off)'}
              </button>

              <button
                onClick={() => setIsFullscreen(true)}
                className="tap-feedback p-1.5 rounded-xl border border-[#E0E3DF] dark:border-[#2D382F] text-[#75706B] dark:text-[#9E9892] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
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
              className="tap-feedback absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-black flex items-center justify-center shadow-lg transition-transform"
              title="Previous card"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setCurrentCardIndex((prev) => (prev + 1) % SENSORY_CARDS.length)}
              className="tap-feedback absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-black flex items-center justify-center shadow-lg transition-transform"
              title="Next card"
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
                className={`tap-feedback relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all p-1 bg-black ${
                  currentCardIndex === idx
                    ? 'border-[#44634B] scale-105 shadow-sm'
                    : 'border-[#E0E3DF] dark:border-[#2D382F] opacity-60 hover:opacity-100'
                }`}
              >
                {card.renderSvg()}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* Recent Tummy Time Sessions List */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#1E2520] border border-[#E8E4DC] dark:border-[#2D382F] shadow-xs">
        <h4 className="text-xs font-bold text-[#75706B] dark:text-[#9E9892] mb-3 uppercase tracking-wider">
          Recorded Tummy Time Sessions ({allSessions.length})
        </h4>

        {allSessions.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#75706B] dark:text-[#9E9892]">
            No tummy time sessions recorded yet. Start the stopwatch above to log your first milestone!
          </div>
        ) : (
          <div className="divide-y divide-[#E8E4DC] dark:divide-[#2D382F]">
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
                      <div className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5]">
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
                          ? 'bg-[#C8EBCC] text-[#03210E] dark:bg-[#203D24] dark:text-[#ADCFB1]'
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
                        className="tap-feedback p-1 text-[#75706B] hover:text-rose-500 transition-colors"
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
              className="tap-feedback p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
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
              className="tap-feedback px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold"
            >
              Previous Card
            </button>
            <button
              onClick={() => setCurrentCardIndex((prev) => (prev + 1) % SENSORY_CARDS.length)}
              className="tap-feedback px-4 py-2 rounded-xl bg-white text-black text-xs font-bold"
            >
              Next Card
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
