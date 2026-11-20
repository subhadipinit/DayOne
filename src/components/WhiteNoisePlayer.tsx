'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Clock,
  Waves,
  Heart,
  CloudRain,
  Wind,
  Radio,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  Sliders,
  AudioWaveform,
} from 'lucide-react';

export type SoundType = 'shusher' | 'pink' | 'brown' | 'white' | 'heartbeat' | 'rain';

interface SoundOption {
  id: SoundType;
  name: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

const SOUND_OPTIONS: SoundOption[] = [
  {
    id: 'shusher',
    name: 'Infant Shusher',
    subtitle: 'Rhythmic "Shhh... Shhh"',
    icon: Wind,
    color: 'from-amber-400 to-rose-400',
    description: 'Mimics the rhythmic breathing & shushing parents naturally make to calm fussiness.',
  },
  {
    id: 'pink',
    name: 'Warm Pink Noise',
    subtitle: 'Soft Rain & Waterfall',
    icon: Waves,
    color: 'from-rose-400 to-pink-500',
    description: 'Gentler on infant ears than white noise; scientifically proven to deepen baby sleep.',
  },
  {
    id: 'heartbeat',
    name: 'Womb Heartbeat',
    subtitle: '72 BPM Lub-Dub Pulse',
    icon: Heart,
    color: 'from-red-400 to-rose-500',
    description: 'Low-frequency maternal pulse that recreates the soothing safety of the womb.',
  },
  {
    id: 'brown',
    name: 'Deep Brown Noise',
    subtitle: 'Low Ocean Surf',
    icon: CloudRain,
    color: 'from-orange-400 to-amber-600',
    description: 'Deep, rumbling low-frequency sound resembling distant surf or an airplane cabin.',
  },
  {
    id: 'rain',
    name: 'Gentle Rain',
    subtitle: 'Window Droplets',
    icon: CloudRain,
    color: 'from-teal-400 to-cyan-600',
    description: 'Steady, calming rainfall pattern with soft ambient frequencies.',
  },
  {
    id: 'white',
    name: 'Classic White Noise',
    subtitle: 'Crisp Sound Blocker',
    icon: Radio,
    color: 'from-blue-400 to-indigo-500',
    description: 'Full-spectrum noise designed to mask sudden doorbells, dog barks, and footsteps.',
  },
];

const TIMER_OPTIONS = [
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
  { label: '60m', minutes: 60 },
  { label: 'Continuous ∞', minutes: 0 },
];

interface WhiteNoisePlayerProps {
  isOpen: boolean;
  onClose: () => void;
  isFloatingPill?: boolean;
}

export const WhiteNoisePlayer: React.FC<WhiteNoisePlayerProps> = ({
  isOpen,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedSound, setSelectedSound] = useState<SoundType>('shusher');
  const [volume, setVolume] = useState<number>(0.65);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [selectedTimerMinutes, setSelectedTimerMinutes] = useState<number>(30);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(30 * 60);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Web Audio Context & Node Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const shusherGainRef = useRef<GainNode | null>(null);

  // Initialize or resume AudioContext safely
  const getAudioContext = (): AudioContext => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Stop active synthesis
  const stopAudio = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {
        // Ignore if already stopped
      }
      sourceNodeRef.current = null;
    }
  };

  // Generate buffer for Pink Noise (Paul Kellet's filter)
  const createPinkNoiseBuffer = (ctx: AudioContext, seconds = 6): AudioBuffer => {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  };

  // Generate buffer for Brown Noise (integrated white noise)
  const createBrownNoiseBuffer = (ctx: AudioContext, seconds = 6): AudioBuffer => {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    return buffer;
  };

  // Generate buffer for White Noise
  const createWhiteNoiseBuffer = (ctx: AudioContext, seconds = 6): AudioBuffer => {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }
    return buffer;
  };

  // Play synthesized audio
  const startAudio = (sound: SoundType) => {
    stopAudio();
    const ctx = getAudioContext();

    if (!masterGainRef.current) {
      masterGainRef.current = ctx.createGain();
      masterGainRef.current.connect(ctx.destination);
    }
    masterGainRef.current.gain.setValueAtTime(isMuted ? 0 : volume, ctx.currentTime);

    if (sound === 'heartbeat') {
      const playBeat = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        const now = audioCtxRef.current.currentTime;

        const osc1 = audioCtxRef.current.createOscillator();
        const gain1 = audioCtxRef.current.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(65, now);
        osc1.frequency.exponentialRampToValueAtTime(35, now + 0.15);
        gain1.gain.setValueAtTime(0.7, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc1.connect(gain1);
        gain1.connect(masterGainRef.current!);
        osc1.start(now);
        osc1.stop(now + 0.18);

        const osc2 = audioCtxRef.current.createOscillator();
        const gain2 = audioCtxRef.current.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(80, now + 0.14);
        osc2.frequency.exponentialRampToValueAtTime(40, now + 0.27);
        gain2.gain.setValueAtTime(0.5, now + 0.14);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc2.connect(gain2);
        gain2.connect(masterGainRef.current!);
        osc2.start(now + 0.14);
        osc2.stop(now + 0.3);
      };

      playBeat();
      heartbeatIntervalRef.current = setInterval(playBeat, 833);
      return;
    }

    if (sound === 'shusher') {
      const buffer = createPinkNoiseBuffer(ctx, 5);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2400;
      filter.Q.value = 1.2;

      const shushGain = ctx.createGain();
      shusherGainRef.current = shushGain;

      const now = ctx.currentTime;
      const cycleLength = 2.6;
      const cyclesToSchedule = 60;

      for (let i = 0; i < cyclesToSchedule; i++) {
        const start = now + i * cycleLength;
        shushGain.gain.setValueAtTime(0.001, start);
        shushGain.gain.linearRampToValueAtTime(0.85, start + 0.4);
        shushGain.gain.exponentialRampToValueAtTime(0.001, start + 1.4);
        shushGain.gain.setValueAtTime(0.001, start + cycleLength);
      }

      source.connect(filter);
      filter.connect(shushGain);
      shushGain.connect(masterGainRef.current!);
      source.start();
      sourceNodeRef.current = source;
      return;
    }

    let buffer: AudioBuffer;
    let filter: BiquadFilterNode | null = null;

    if (sound === 'pink') {
      buffer = createPinkNoiseBuffer(ctx, 6);
    } else if (sound === 'brown') {
      buffer = createBrownNoiseBuffer(ctx, 6);
    } else if (sound === 'rain') {
      buffer = createPinkNoiseBuffer(ctx, 6);
      filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1400;
    } else {
      buffer = createWhiteNoiseBuffer(ctx, 6);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    if (filter) {
      source.connect(filter);
      filter.connect(masterGainRef.current!);
    } else {
      source.connect(masterGainRef.current!);
    }

    source.start();
    sourceNodeRef.current = source;
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      startAudio(selectedSound);
      setIsPlaying(true);
      if (selectedTimerMinutes > 0) {
        setRemainingSeconds(selectedTimerMinutes * 60);
      } else {
        setRemainingSeconds(null);
      }
    }
  };

  const handleSelectSound = (sound: SoundType) => {
    setSelectedSound(sound);
    if (isPlaying) {
      startAudio(sound);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(
        isMuted ? 0 : newVol,
        audioCtxRef.current.currentTime
      );
    }
    if (isMuted && newVol > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(
        nextMuted ? 0 : volume,
        audioCtxRef.current.currentTime
      );
    }
  };

  useEffect(() => {
    if (isPlaying && remainingSeconds !== null && remainingSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            stopAudio();
            setIsPlaying(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isPlaying, remainingSeconds]);

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try {
          audioCtxRef.current.close();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  const currentSoundMeta = SOUND_OPTIONS.find((s) => s.id === selectedSound)!;

  return (
    <div className="fixed bottom-20 md:bottom-5 right-3 sm:right-5 z-50 max-w-sm w-[calc(100vw-1.5rem)] sm:w-[380px] animate-reveal">
      <div className="bg-white/95 dark:bg-[#1C1A22]/95 border border-[#E8E4DC] dark:border-[#2D2B33] rounded-[28px] shadow-2xl overflow-hidden backdrop-blur-xl">
        
        {/* Floating Drawer Header Bar */}
        <div className="px-4 py-3 bg-[#F7FAF5]/80 dark:bg-[#161C17]/80 border-b border-[#E8E4DC] dark:border-[#2D2B33] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-[#C8EBCC] dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1] shadow-2xs`}>
              <Wind className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5]">
                  White Noise &amp; Shusher
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#C8EBCC] dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1]">
                  Offline
                </span>
              </div>
              <p className="text-[10px] text-[#75706B] dark:text-[#9E9892]">
                {isPlaying ? (remainingSeconds !== null ? `Timer: ${formatTime(remainingSeconds)} remaining` : 'Playing continuously') : 'Paused'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="tap-feedback p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#75706B] dark:text-[#9E9892]"
              title={isMinimized ? 'Expand Drawer' : 'Minimize to Pill'}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="tap-feedback p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#75706B] dark:text-[#9E9892]"
              title="Close Player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Minimized Quick Control Floating Pill */}
        {isMinimized ? (
          <div className="p-3 flex items-center justify-between gap-3 animate-reveal">
            <div className="flex items-center gap-2.5 min-w-0">
              {isPlaying && (
                <div className="flex items-end gap-0.5 h-4 shrink-0">
                  <span className="w-1 bg-[#44634B] rounded-full animate-pulse h-3"></span>
                  <span className="w-1 bg-[#44634B] rounded-full animate-pulse h-4"></span>
                  <span className="w-1 bg-[#44634B] rounded-full animate-pulse h-2"></span>
                </div>
              )}
              <span className="text-xs font-bold truncate text-[#191C1A] dark:text-[#FAF8F5]">
                {currentSoundMeta.name}
              </span>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={togglePlay}
                className="tap-feedback w-9 h-9 rounded-full bg-[#44634B] text-white flex items-center justify-center hover:bg-[#344738] shadow-xs"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
            </div>
          </div>
        ) : (
          /* Expanded Full Drawer Controls */
          <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar animate-reveal">
            
            {/* Active Sound Card with Waveform Animation */}
            <div className="relative p-3.5 rounded-2xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] flex items-center justify-between overflow-hidden">
              <div className="flex items-center gap-3 z-10">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${currentSoundMeta.color} flex items-center justify-center text-white shadow-xs relative`}>
                  <currentSoundMeta.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5]">
                    {currentSoundMeta.name}
                  </h4>
                  <p className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
                    {currentSoundMeta.subtitle}
                  </p>
                </div>
              </div>

              {/* Master Tactile Play/Pause Action Button */}
              <button
                onClick={togglePlay}
                className={`tap-feedback z-10 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm transition-all ${
                  isPlaying
                    ? 'bg-[#D97757] hover:bg-[#c36445]'
                    : 'bg-[#44634B] hover:bg-[#344738]'
                }`}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
              </button>
            </div>

            {/* Sound Selector Grid */}
            <div>
              <div className="text-[11px] font-bold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider mb-2">
                Soothing Sound Options
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SOUND_OPTIONS.map((opt) => {
                  const isSelected = selectedSound === opt.id;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectSound(opt.id)}
                      className={`tap-feedback p-2.5 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? 'border-[#44634B] bg-[#C8EBCC]/30 dark:bg-[#203D24]/30 text-[#191C1A] dark:text-white shadow-xs ring-1 ring-[#44634B]/20'
                          : 'border-[#E8E4DC] dark:border-[#2D382F] hover:bg-black/5 dark:hover:bg-white/5 text-[#75706B] dark:text-[#9E9892]'
                      }`}
                    >
                      <div className={`p-1.5 rounded-xl shrink-0 ${isSelected ? 'bg-[#44634B] text-white' : 'bg-black/5 dark:bg-white/10'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate leading-tight">
                          {opt.name}
                        </div>
                        <div className="text-[10px] text-[#75706B] dark:text-[#9E9892] truncate mt-0.5">
                          {opt.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Volume & Sleep Timer Controls */}
            <div className="space-y-3 pt-1 border-t border-[#E8E4DC] dark:border-[#2D382F]">
              
              {/* Volume Slider with Mute Toggle */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#75706B] dark:text-[#9E9892] mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <button onClick={toggleMute} className="tap-feedback hover:text-[#191C1A] dark:hover:text-white">
                      {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <span>Volume</span>
                  </span>
                  <span>{isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#E0E3DF] dark:bg-[#2D382F] rounded-lg appearance-none cursor-pointer accent-[#44634B]"
                />
              </div>

              {/* Sleep Auto-Fade Timer */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#75706B] dark:text-[#9E9892] mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#44634B]" />
                    <span>Auto-Sleep Timer</span>
                  </span>
                  {remainingSeconds !== null && isPlaying && (
                    <span className="text-[#44634B] dark:text-[#ADCFB1] font-bold">
                      {formatTime(remainingSeconds)} left
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-5 gap-1.5">
                  {TIMER_OPTIONS.map((t) => {
                    const isSelected = selectedTimerMinutes === t.minutes;
                    return (
                      <button
                        key={t.label}
                        onClick={() => {
                          setSelectedTimerMinutes(t.minutes);
                          if (t.minutes > 0) {
                            setRemainingSeconds(t.minutes * 60);
                          } else {
                            setRemainingSeconds(null);
                          }
                        }}
                        className={`tap-feedback py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                          isSelected
                            ? 'bg-[#44634B] text-white border-[#344738] shadow-xs'
                            : 'bg-white dark:bg-[#1E2520] border-[#E8E4DC] dark:border-[#2D382F] text-[#75706B] dark:text-[#9E9892]'
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Helpful Calming Tip */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
              <span>
                <strong>Pediatric Sleep Tip:</strong> Keep phone at least 4–6 feet from baby's crib at moderate volume (&lt;60 dB) to protect delicate hearing while calming the Moro startle reflex.
              </span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
