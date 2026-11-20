'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  Info,
  Smile,
  X,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Check,
  RotateCcw,
  LayoutGrid,
  CircleDot,
  Flame,
  ChevronDown,
} from 'lucide-react';
import { ToothRecord, ChildProfile } from '@/lib/types';
import { syncSingleRecord, deleteSingleRecord } from '@/lib/syncService';
import { generateUniqueId } from '@/lib/store';
import confetti from 'canvas-confetti';

interface TeethTrackerProps {
  profile: ChildProfile;
  userRole?: 'parent' | 'family';
}

interface ToothMeta {
  key: string;
  name: string;
  code: string;
  jaw: 'upper' | 'lower';
  side: 'left' | 'right';
  type: 'incisor' | 'lateral' | 'canine' | 'molar1' | 'molar2';
  typicalRange: string;
  ageLabel: string;
  orderEstimate: number;
  // Percentage coordinates for visual arch
  archX: number;
  archY: number;
}

const PRIMARY_TEETH: ToothMeta[] = [
  // Upper Jaw (From back-left to back-right in anatomical horseshoe)
  { key: 'upper-molar2-left', name: 'Upper 2nd Molar (Left)', code: '2M', jaw: 'upper', side: 'left', type: 'molar2', typicalRange: '25–33 months', ageLabel: '25m', orderEstimate: 19, archX: 12, archY: 72 },
  { key: 'upper-molar1-left', name: 'Upper 1st Molar (Left)', code: '1M', jaw: 'upper', side: 'left', type: 'molar1', typicalRange: '13–19 months', ageLabel: '13m', orderEstimate: 9, archX: 19, archY: 50 },
  { key: 'upper-canine-left', name: 'Upper Canine (Left)', code: 'C', jaw: 'upper', side: 'left', type: 'canine', typicalRange: '16–22 months', ageLabel: '16m', orderEstimate: 15, archX: 29, archY: 32 },
  { key: 'upper-lateral-left', name: 'Upper Lateral Incisor (Left)', code: 'LI', jaw: 'upper', side: 'left', type: 'lateral', typicalRange: '9–13 months', ageLabel: '9m', orderEstimate: 5, archX: 39, archY: 18 },
  { key: 'upper-central-left', name: 'Upper Central Incisor (Left)', code: 'CI', jaw: 'upper', side: 'left', type: 'incisor', typicalRange: '8–12 months', ageLabel: '8m', orderEstimate: 3, archX: 47, archY: 12 },
  { key: 'upper-central-right', name: 'Upper Central Incisor (Right)', code: 'CI', jaw: 'upper', side: 'right', type: 'incisor', typicalRange: '8–12 months', ageLabel: '8m', orderEstimate: 4, archX: 53, archY: 12 },
  { key: 'upper-lateral-right', name: 'Upper Lateral Incisor (Right)', code: 'LI', jaw: 'upper', side: 'right', type: 'lateral', typicalRange: '9–13 months', ageLabel: '9m', orderEstimate: 6, archX: 61, archY: 18 },
  { key: 'upper-canine-right', name: 'Upper Canine (Right)', code: 'C', jaw: 'upper', side: 'right', type: 'canine', typicalRange: '16–22 months', ageLabel: '16m', orderEstimate: 16, archX: 71, archY: 32 },
  { key: 'upper-molar1-right', name: 'Upper 1st Molar (Right)', code: '1M', jaw: 'upper', side: 'right', type: 'molar1', typicalRange: '13–19 months', ageLabel: '13m', orderEstimate: 10, archX: 81, archY: 50 },
  { key: 'upper-molar2-right', name: 'Upper 2nd Molar (Right)', code: '2M', jaw: 'upper', side: 'right', type: 'molar2', typicalRange: '25–33 months', ageLabel: '25m', orderEstimate: 20, archX: 88, archY: 72 },

  // Lower Jaw (From back-left to back-right in anatomical horseshoe)
  { key: 'lower-molar2-left', name: 'Lower 2nd Molar (Left)', code: '2M', jaw: 'lower', side: 'left', type: 'molar2', typicalRange: '23–31 months', ageLabel: '23m', orderEstimate: 17, archX: 12, archY: 28 },
  { key: 'lower-molar1-left', name: 'Lower 1st Molar (Left)', code: '1M', jaw: 'lower', side: 'left', type: 'molar1', typicalRange: '14–18 months', ageLabel: '14m', orderEstimate: 11, archX: 19, archY: 50 },
  { key: 'lower-canine-left', name: 'Lower Canine (Left)', code: 'C', jaw: 'lower', side: 'left', type: 'canine', typicalRange: '17–23 months', ageLabel: '17m', orderEstimate: 13, archX: 29, archY: 68 },
  { key: 'lower-lateral-left', name: 'Lower Lateral Incisor (Left)', code: 'LI', jaw: 'lower', side: 'left', type: 'lateral', typicalRange: '10–16 months', ageLabel: '10m', orderEstimate: 7, archX: 39, archY: 82 },
  { key: 'lower-central-left', name: 'Lower Central Incisor (Left)', code: 'CI', jaw: 'lower', side: 'left', type: 'incisor', typicalRange: '6–10 months (Usually First!)', ageLabel: '6m', orderEstimate: 1, archX: 47, archY: 88 },
  { key: 'lower-central-right', name: 'Lower Central Incisor (Right)', code: 'CI', jaw: 'lower', side: 'right', type: 'incisor', typicalRange: '6–10 months', ageLabel: '6m', orderEstimate: 2, archX: 53, archY: 88 },
  { key: 'lower-lateral-right', name: 'Lower Lateral Incisor (Right)', code: 'LI', jaw: 'lower', side: 'right', type: 'lateral', typicalRange: '10–16 months', ageLabel: '10m', orderEstimate: 8, archX: 61, archY: 82 },
  { key: 'lower-canine-right', name: 'Lower Canine (Right)', code: 'C', jaw: 'lower', side: 'right', type: 'canine', typicalRange: '17–23 months', ageLabel: '17m', orderEstimate: 14, archX: 71, archY: 68 },
  { key: 'lower-molar1-right', name: 'Lower 1st Molar (Right)', code: '1M', jaw: 'lower', side: 'right', type: 'molar1', typicalRange: '14–18 months', ageLabel: '14m', orderEstimate: 12, archX: 81, archY: 50 },
  { key: 'lower-molar2-right', name: 'Lower 2nd Molar (Right)', code: '2M', jaw: 'lower', side: 'right', type: 'molar2', typicalRange: '23–31 months', ageLabel: '23m', orderEstimate: 18, archX: 88, archY: 28 },
];

const TEETHING_SYMPTOMS = [
  'Heavy Drooling',
  'Chewing on hands/toys',
  'Tender swollen gums',
  'Mild fussiness',
  'Cheek flushing',
  'Disturbed sleep',
  'Ear pulling (same side)',
  'Loss of appetite for solids',
];

type ToothStateFilter = 'all' | 'upper' | 'lower';
type ViewMode = 'arch' | 'grid';

export const TeethTracker: React.FC<TeethTrackerProps> = ({
  profile,
  userRole = 'parent',
}) => {
  const [teethRecords, setTeethRecords] = useState<Record<string, ToothRecord>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`dayone_teeth_${profile.id}`);
      return saved ? JSON.parse(saved) : {
        'lower-central-left': {
          id: 'tooth_init_1',
          childId: profile.id,
          toothId: 'lower-central-left',
          toothName: 'Lower Central Incisor (Left)',
          isErupted: true,
          eruptedDate: '2026-10-28',
          symptoms: ['Heavy Drooling', 'Chewing on hands/toys'],
        },
        'lower-central-right': {
          id: 'tooth_init_2',
          childId: profile.id,
          toothId: 'lower-central-right',
          toothName: 'Lower Central Incisor (Right)',
          isErupted: false,
          notes: 'Budding / Erupting',
          symptoms: ['Tender swollen gums'],
        },
      };
    }
    return {};
  });

  const [selectedToothKey, setSelectedToothKey] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'not_erupted' | 'budding' | 'erupted'>('erupted');
  const [eruptDate, setEruptDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [toothNotes, setToothNotes] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('arch');
  const [jawFilter, setJawFilter] = useState<ToothStateFilter>('all');

  useEffect(() => {
    const loadSaved = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`dayone_teeth_${profile.id}`);
        if (saved) {
          try {
            setTeethRecords(JSON.parse(saved));
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

  const selectedToothMeta = selectedToothKey
    ? PRIMARY_TEETH.find((t) => t.key === selectedToothKey)
    : null;

  const eruptedCount = Object.values(teethRecords).filter((t) => t.isErupted).length;
  const eruptingCount = Object.values(teethRecords).filter((t) => !t.isErupted && t.notes?.includes('Erupting')).length;
  const expectedCount = 20 - eruptedCount - eruptingCount;
  const eruptionPercent = Math.round((eruptedCount / 20) * 100);

  const handleOpenToothModal = (tooth: ToothMeta) => {
    setSelectedToothKey(tooth.key);
    const existing = teethRecords[tooth.key];
    if (existing) {
      if (existing.isErupted) {
        setSelectedStatus('erupted');
      } else if (existing.notes?.includes('Erupting')) {
        setSelectedStatus('budding');
      } else {
        setSelectedStatus('not_erupted');
      }
      setEruptDate(existing.eruptedDate || new Date().toISOString().split('T')[0]);
      setSelectedSymptoms(existing.symptoms || []);
      setToothNotes(existing.notes || '');
    } else {
      setSelectedStatus('erupted');
      setEruptDate(new Date().toISOString().split('T')[0]);
      setSelectedSymptoms([]);
      setToothNotes('');
    }
  };

  const handleSaveTooth = () => {
    if (!selectedToothMeta) return;

    const isErupted = selectedStatus === 'erupted';
    const isBudding = selectedStatus === 'budding';
    const toothId = teethRecords[selectedToothMeta.key]?.id || generateUniqueId('tooth');

    if (selectedStatus === 'not_erupted') {
      handleResetTooth();
      return;
    }

    const updatedRecord: ToothRecord = {
      id: toothId,
      childId: profile.id,
      toothKey: selectedToothMeta.key,
      name: selectedToothMeta.name,
      isErupted,
      eruptedDate: isErupted ? eruptDate : undefined,
      symptoms: selectedSymptoms,
      notes: isBudding ? 'Budding / Erupting' + (toothNotes ? ` - ${toothNotes}` : '') : toothNotes || undefined,
    };

    const newRecords = {
      ...teethRecords,
      [selectedToothMeta.key]: updatedRecord,
    };

    setTeethRecords(newRecords);
    localStorage.setItem(`dayone_teeth_${profile.id}`, JSON.stringify(newRecords));

    syncSingleRecord('teeth_records', {
      id: toothId,
      child_id: profile.id,
      tooth_key: selectedToothMeta.key,
      name: selectedToothMeta.name,
      arch: selectedToothMeta.jaw || null,
      jaw: selectedToothMeta.jaw || null,
      side: selectedToothMeta.side || null,
      type: selectedToothMeta.type || null,
      typical_age_range_display: selectedToothMeta.typicalRange || null,
      status: isErupted ? 'erupted' : isBudding ? 'erupting' : 'not_erupted',
      erupted_date: isErupted && eruptDate ? eruptDate : null,
      is_erupted: isErupted,
      symptoms: selectedSymptoms || [],
      notes: toothNotes.trim() || null,
    });

    if (isErupted) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#44634B', '#C8EBCC', '#D97757', '#EBB04D'],
        });
      } catch (e) {
        // ignore
      }
    }

    setSelectedToothKey(null);
  };

  const handleResetTooth = () => {
    if (!selectedToothMeta) return;
    const existing = teethRecords[selectedToothMeta.key];
    const newRecords = { ...teethRecords };
    delete newRecords[selectedToothMeta.key];
    setTeethRecords(newRecords);
    localStorage.setItem(`dayone_teeth_${profile.id}`, JSON.stringify(newRecords));
    if (existing?.id) {
      deleteSingleRecord('teeth_records', existing.id);
    }
    setSelectedToothKey(null);
  };

  // Helper to render crown glyph
  const renderToothCrownIcon = (type: ToothMeta['type'], isErupted: boolean, isBudding: boolean) => {
    const strokeColor = isErupted ? '#FFFFFF' : isBudding ? '#B45309' : '#75706B';
    const fillColor = isErupted ? '#FFFFFF' : isBudding ? '#FDE68A' : 'none';

    if (type === 'molar1' || type === 'molar2') {
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill={fillColor} stroke={strokeColor} strokeWidth="1.8">
          <path d="M5 6C5 4.5 6 3 8 3C9.5 3 10.5 4 12 4C13.5 4 14.5 3 16 3C18 3 19 4.5 19 6C19 8.5 20 13 18.5 18C17.5 21 16 21 15 18C14.5 16 13.5 13 12 13C10.5 13 9.5 16 9 18C8 21 6.5 21 5.5 18C4 13 5 8.5 5 6Z" strokeLinejoin="round" />
        </svg>
      );
    }
    if (type === 'canine') {
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill={fillColor} stroke={strokeColor} strokeWidth="1.8">
          <path d="M7 7C7 4.5 9 2.5 12 2C15 2.5 17 4.5 17 7C17 10 18 15 16.5 19C15.5 21.5 14 21 12 15C10 21 8.5 21.5 7.5 19C6 15 7 10 7 7Z" strokeLinejoin="round" />
        </svg>
      );
    }
    // Incisors
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill={fillColor} stroke={strokeColor} strokeWidth="1.8">
        <path d="M7 5C7 3.5 8.5 3 12 3C15.5 3 17 3.5 17 5C17 8.5 17.5 14 16 19C15 22 13.5 21.5 12 16C10.5 21.5 9 22 8 19C6.5 14 7 8.5 7 5Z" strokeLinejoin="round" />
      </svg>
    );
  };

  const nextToothToExpect = PRIMARY_TEETH.find((t) => {
    const rec = teethRecords[t.key];
    return !rec?.isErupted;
  });

  return (
    <div className="space-y-5 animate-reveal">
      
      {/* 1. Header & Milestone Banner */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#191C1A] dark:text-[#FAF8F5]">
              Baby Teeth &amp; Dental Eruption
            </h2>
            <p className="text-xs text-[#424842] dark:text-[#9E9892]">
              Interactive 20-baby-teeth eruption arch with touch hit targets
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#C8EBCC] dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1] font-bold text-xs shadow-2xs">
            <span className="tabular-nums font-black">{eruptedCount}</span>
            <span className="font-normal text-[11px]">/ 20 Erupted</span>
          </div>
        </div>

        {/* Milestone highlight pill */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F1F4F0] dark:bg-[#1C241E] text-[#191C1A] dark:text-[#FAF8F5] border border-[#E0E3DF] dark:border-[#2D382F] shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1 rounded-full bg-[#FFDDAE] dark:bg-[#3D2C12] text-[#99462A] dark:text-[#F8BC58] shrink-0">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold truncate">
              {eruptedCount > 0
                ? `${eruptedCount} teeth erupted (${eruptionPercent}%). Gums developing on track.`
                : nextToothToExpect
                ? `Watching for first ${nextToothToExpect.name} (typical: ${nextToothToExpect.typicalRange}).`
                : 'Watching for the first lower central incisor budding (typically 6–10m).'}
            </span>
          </div>
          <CheckCircle2 className="w-4 h-4 text-[#44634B] dark:text-[#ADCFB1] shrink-0" />
        </div>
      </div>

      {/* 2. Interactive Dental Arch Chart Container */}
      <div className="bg-white dark:bg-[#1E2520] rounded-3xl p-4 sm:p-5 shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] space-y-4">
        
        {/* Controls Bar: View Switcher & Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#E8E4DC] dark:border-[#2D382F]">
          <div>
            <span className="text-sm sm:text-base font-bold text-[#191C1A] dark:text-[#FAF8F5] block">
              Pediatric Primary Dental Arch
            </span>
            <span className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
              Tap any tooth (≥44px target) to view developmental stats or log eruption
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#F1F4F0] dark:bg-[#161C17] p-1 rounded-full border border-[#E0E3DF] dark:border-[#2D382F]">
              <button
                type="button"
                onClick={() => setViewMode('arch')}
                className={`tap-feedback px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'arch'
                    ? 'bg-white dark:bg-[#202822] text-[#191C1A] dark:text-[#FAF8F5] shadow-xs font-bold'
                    : 'text-[#424842] dark:text-[#9E9892]'
                }`}
              >
                <CircleDot className="w-3.5 h-3.5 text-[#44634B]" />
                <span>Arch</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`tap-feedback px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-[#202822] text-[#191C1A] dark:text-[#FAF8F5] shadow-xs font-bold'
                    : 'text-[#424842] dark:text-[#9E9892]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-[#44634B]" />
                <span>Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Legend Pills with Counts */}
        <div className="flex items-center gap-2 flex-wrap text-xs select-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#44634B] text-white font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span>Erupted ({eruptedCount})</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFDDAE] text-[#281800] dark:bg-[#3D2C12] dark:text-[#F8BC58] font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#7C5400] dark:bg-[#F8BC58]" />
            <span>Budding ({eruptingCount})</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1F4F0] dark:bg-[#202822] text-[#424842] dark:text-[#9E9892] font-semibold border border-[#E0E3DF] dark:border-[#2D382F]">
            <span className="w-2 h-2 rounded-full bg-[#A8A29E]" />
            <span>Expected ({expectedCount})</span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* VIEW A: ANATOMICAL VISUAL ARCH */}
        {/* ================================================================= */}
        {viewMode === 'arch' && (
          <div className="p-4 sm:p-6 rounded-3xl bg-[#F7FAF5] dark:bg-[#141A15] border border-[#E0E3DF] dark:border-[#2D382F] space-y-6">
            
            {/* UPPER JAW (MAXILLA) ARCH */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#424842] dark:text-[#9E9892] px-2">
                <span className="uppercase tracking-wider text-[11px]">Upper Jaw • Maxilla (10)</span>
                <span className="text-[10px] font-normal">Left ➔ Right</span>
              </div>

              {/* Horseshoe Arch Visual Container */}
              <div className="relative w-full max-w-sm sm:max-w-md mx-auto aspect-[16/9] min-h-[190px] border border-dashed border-[#D5DCD3] dark:border-[#2D382F] rounded-3xl p-3 flex items-center justify-center bg-white/60 dark:bg-[#1E2520]/50 shadow-inner">
                {/* Visual arch curvature guideline */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M 12 75 C 15 25, 85 25, 88 75" fill="none" stroke="#44634B" strokeWidth="2" strokeDasharray="3,3" />
                </svg>

                {PRIMARY_TEETH.filter((t) => t.jaw === 'upper').map((tooth) => {
                  const rec = teethRecords[tooth.key];
                  const isErupted = rec?.isErupted;
                  const isBudding = !rec?.isErupted && rec?.notes?.includes('Erupting');

                  return (
                    <button
                      key={tooth.key}
                      type="button"
                      onClick={() => handleOpenToothModal(tooth)}
                      style={{
                        left: `${tooth.archX}%`,
                        top: `${tooth.archY}%`,
                      }}
                      title={`${tooth.name} (${tooth.typicalRange})`}
                      className={`tap-feedback absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex flex-col items-center justify-center p-0.5 border cursor-pointer transition-transform ${
                        isErupted
                          ? 'bg-[#44634B] text-white border-[#344738] shadow-md ring-2 ring-[#44634B]/30'
                          : isBudding
                          ? 'bg-[#FFDDAE] text-[#281800] border-[#F8BC58] dark:bg-[#3D2C12] dark:text-[#F8BC58] shadow-sm animate-pulse'
                          : 'bg-white dark:bg-[#1E2520] border-[#D0D6CF] dark:border-[#38443B] text-[#191C1A] dark:text-[#FAF8F5] hover:border-[#44634B]'
                      }`}
                    >
                      <div className="leading-none">
                        {renderToothCrownIcon(tooth.type, !!isErupted, !!isBudding)}
                      </div>
                      <span className="text-[10px] font-black leading-none mt-0.5">{tooth.code}</span>
                      <span className={`text-[8px] leading-none ${isErupted ? 'text-white/80' : 'text-[#75706B] dark:text-[#9E9892]'}`}>
                        {tooth.ageLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* LOWER JAW (MANDIBLE) ARCH */}
            <div className="space-y-2 pt-2 border-t border-[#E0E3DF] dark:border-[#2D382F]">
              <div className="flex items-center justify-between text-xs font-bold text-[#424842] dark:text-[#9E9892] px-2">
                <span className="uppercase tracking-wider text-[11px]">Lower Jaw • Mandible (10)</span>
                <span className="text-[10px] font-normal">Left ➔ Right</span>
              </div>

              {/* Horseshoe Arch Visual Container */}
              <div className="relative w-full max-w-sm sm:max-w-md mx-auto aspect-[16/9] min-h-[190px] border border-dashed border-[#D5DCD3] dark:border-[#2D382F] rounded-3xl p-3 flex items-center justify-center bg-white/60 dark:bg-[#1E2520]/50 shadow-inner">
                {/* Visual arch curvature guideline */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M 12 25 C 15 75, 85 75, 88 25" fill="none" stroke="#44634B" strokeWidth="2" strokeDasharray="3,3" />
                </svg>

                {PRIMARY_TEETH.filter((t) => t.jaw === 'lower').map((tooth) => {
                  const rec = teethRecords[tooth.key];
                  const isErupted = rec?.isErupted;
                  const isBudding = !rec?.isErupted && rec?.notes?.includes('Erupting');

                  return (
                    <button
                      key={tooth.key}
                      type="button"
                      onClick={() => handleOpenToothModal(tooth)}
                      style={{
                        left: `${tooth.archX}%`,
                        top: `${tooth.archY}%`,
                      }}
                      title={`${tooth.name} (${tooth.typicalRange})`}
                      className={`tap-feedback absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex flex-col items-center justify-center p-0.5 border cursor-pointer transition-transform ${
                        isErupted
                          ? 'bg-[#44634B] text-white border-[#344738] shadow-md ring-2 ring-[#44634B]/30'
                          : isBudding
                          ? 'bg-[#FFDDAE] text-[#281800] border-[#F8BC58] dark:bg-[#3D2C12] dark:text-[#F8BC58] shadow-sm animate-pulse'
                          : 'bg-white dark:bg-[#1E2520] border-[#D0D6CF] dark:border-[#38443B] text-[#191C1A] dark:text-[#FAF8F5] hover:border-[#44634B]'
                      }`}
                    >
                      <div className="leading-none">
                        {renderToothCrownIcon(tooth.type, !!isErupted, !!isBudding)}
                      </div>
                      <span className="text-[10px] font-black leading-none mt-0.5">{tooth.code}</span>
                      <span className={`text-[8px] leading-none ${isErupted ? 'text-white/80' : 'text-[#75706B] dark:text-[#9E9892]'}`}>
                        {tooth.ageLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW B: COMPACT GRID VIEW (ROW BY ROW) */}
        {/* ================================================================= */}
        {viewMode === 'grid' && (
          <div className="p-4 rounded-2xl bg-[#F1F4F0] dark:bg-[#161C17] space-y-5">
            
            {/* Upper Jaw (Maxilla) */}
            <div className="space-y-2">
              <div className="text-center">
                <span className="text-[11px] font-bold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider">
                  Upper Jaw • Maxilla (10)
                </span>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {PRIMARY_TEETH.filter((t) => t.jaw === 'upper').map((tooth) => {
                  const rec = teethRecords[tooth.key];
                  const isErupted = rec?.isErupted;
                  const isBudding = !rec?.isErupted && rec?.notes?.includes('Erupting');

                  return (
                    <button
                      key={tooth.key}
                      type="button"
                      onClick={() => handleOpenToothModal(tooth)}
                      className={`tap-feedback min-h-[52px] rounded-2xl flex flex-col items-center justify-center p-1 border cursor-pointer transition-transform ${
                        isErupted
                          ? 'bg-[#44634B] text-white border-[#344738] shadow-xs'
                          : isBudding
                          ? 'bg-[#FFDDAE] text-[#281800] border-[#F8BC58] dark:bg-[#3D2C12] dark:text-[#F8BC58]'
                          : 'bg-white dark:bg-[#1E2520] border-[#E8E4DC] dark:border-[#2D382F] hover:border-[#44634B]'
                      }`}
                    >
                      <span className="text-xs font-bold leading-none">{tooth.code}</span>
                      <span className={`text-[9px] mt-1 ${isErupted ? 'text-white/80' : 'text-[#727972]'}`}>
                        {tooth.ageLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lower Jaw (Mandible) */}
            <div className="space-y-2.5 pt-2 border-t border-[#E0E3DF] dark:border-[#2D382F]">
              <div className="text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#424842] dark:text-[#9E9892]">
                  Lower Jaw • Mandible (10)
                </span>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {PRIMARY_TEETH.filter((t) => t.jaw === 'lower').map((tooth) => {
                  const rec = teethRecords[tooth.key];
                  const isErupted = rec?.isErupted;
                  const isBudding = !rec?.isErupted && rec?.notes?.includes('Erupting');

                  return (
                    <button
                      key={tooth.key}
                      type="button"
                      onClick={() => handleOpenToothModal(tooth)}
                      className={`tap-feedback min-h-[52px] rounded-2xl flex flex-col items-center justify-center p-1 border cursor-pointer transition-transform ${
                        isErupted
                          ? 'bg-[#44634B] text-white border-[#344738] shadow-xs'
                          : isBudding
                          ? 'bg-[#FFDDAE] text-[#281800] border-[#F8BC58] dark:bg-[#3D2C12] dark:text-[#F8BC58]'
                          : 'bg-white dark:bg-[#1E2520] border-[#E8E4DC] dark:border-[#2D382F] hover:border-[#44634B]'
                      }`}
                    >
                      <span className="text-xs font-bold leading-none">{tooth.code}</span>
                      <span className={`text-[9px] mt-1 ${isErupted ? 'text-white/80' : 'text-[#727972]'}`}>
                        {tooth.ageLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* 3. Teething Relief & Symptoms Bento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="p-4 rounded-[24px] bg-white dark:bg-[#1E2520] border border-[#E8E4DC] dark:border-[#2D382F] space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧊</span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#191C1A] dark:text-[#FAF8F5]">
              Safe Pediatric Teething Relief
            </h4>
          </div>
          <p className="text-xs text-[#424842] dark:text-[#9E9892] leading-relaxed">
            Offer chilled silicone teething rings, clean wet washcloths, or gentle gum massage with clean fingers. Avoid benzocaine gels or amber necklaces (choking hazard).
          </p>
        </div>

        <div className="p-4 rounded-[24px] bg-[#FFDBD0]/40 dark:bg-[#3D1E16]/40 border border-[#FE9572]/40 dark:border-[#543830] space-y-2">
          <div className="flex items-center gap-2 text-[#99462A] dark:text-[#FFB59E]">
            <AlertCircle className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Teething Fever Caution
            </h4>
          </div>
          <p className="text-xs text-[#762C12] dark:text-[#FFB59E] leading-relaxed">
            Teething causes slight gum temperature elevation (&lt;100.4°F). A true fever (&ge;100.4°F), diarrhea, or vomiting is NOT caused by teething and requires pediatric check.
          </p>
        </div>
      </div>

      {/* 4. TAP-TO-INSPECT TOOTH SHEET (NATIVE BOTTOM SHEET DRAWER) */}
      {selectedToothMeta && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white dark:bg-[#1E2520] rounded-t-[32px] sm:rounded-[32px] border-t sm:border border-[#E8E4DC] dark:border-[#2D382F] p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
            
            {/* Sheet Handle for Mobile */}
            <div className="w-12 h-1 bg-[#E0E3DF] dark:bg-[#2D382F] rounded-full mx-auto -mt-1 mb-2 sm:hidden" />

            {/* Sheet Header */}
            <div className="flex items-start justify-between border-b border-[#E8E4DC] dark:border-[#2D382F] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#C8EBCC] dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1] flex items-center justify-center font-black text-sm">
                  {selectedToothMeta.code}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#191C1A] dark:text-[#FAF8F5]">
                    {selectedToothMeta.name}
                  </h3>
                  <p className="text-[11px] text-[#424842] dark:text-[#9E9892]">
                    Typical eruption: <span className="font-semibold text-[#191C1A] dark:text-[#FAF8F5]">{selectedToothMeta.typicalRange}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedToothKey(null)}
                className="tap-feedback p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3-State Segmented Control: Not Erupted -> Budding -> Erupted */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#424842] dark:text-[#9E9892]">
                Eruption Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStatus('not_erupted')}
                  className={`tap-feedback py-2.5 px-2 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-1 border ${
                    selectedStatus === 'not_erupted'
                      ? 'bg-white dark:bg-[#2A342C] text-[#191C1A] dark:text-white border-[#44634B] shadow-xs'
                      : 'bg-[#F1F4F0] dark:bg-[#161C17] text-[#424842] dark:text-[#9E9892] border-transparent'
                  }`}
                >
                  <CircleDot className="w-4 h-4 text-stone-400" />
                  <span>Not Erupted</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus('budding')}
                  className={`tap-feedback py-2.5 px-2 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-1 border ${
                    selectedStatus === 'budding'
                      ? 'bg-[#FFDDAE] text-[#281800] dark:bg-[#3D2C12] dark:text-[#F8BC58] border-[#F8BC58] shadow-xs'
                      : 'bg-[#F1F4F0] dark:bg-[#161C17] text-[#424842] dark:text-[#9E9892] border-transparent'
                  }`}
                >
                  <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Teething / Soon</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus('erupted')}
                  className={`tap-feedback py-2.5 px-2 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-1 border ${
                    selectedStatus === 'erupted'
                      ? 'bg-[#44634B] text-white border-[#344738] shadow-xs'
                      : 'bg-[#F1F4F0] dark:bg-[#161C17] text-[#424842] dark:text-[#9E9892] border-transparent'
                  }`}
                >
                  <Check className="w-4 h-4 text-white" />
                  <span>✓ Erupted</span>
                </button>
              </div>
            </div>

            {/* Eruption Date Section (Visible when Erupted) */}
            {selectedStatus === 'erupted' && (
              <div className="space-y-2 pt-1 animate-reveal">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#424842] dark:text-[#9E9892]">
                    Eruption Date
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEruptDate(new Date().toISOString().split('T')[0])}
                      className="tap-feedback px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F1F4F0] dark:bg-[#202822] text-[#44634B] dark:text-[#ADCFB1]"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const yest = new Date();
                        yest.setDate(yest.getDate() - 1);
                        setEruptDate(yest.toISOString().split('T')[0]);
                      }}
                      className="tap-feedback px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F1F4F0] dark:bg-[#202822] text-[#44634B] dark:text-[#ADCFB1]"
                    >
                      Yesterday
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  value={eruptDate}
                  onChange={(e) => setEruptDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-xs font-medium text-[#191C1A] dark:text-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#44634B]"
                />
              </div>
            )}

            {/* Teething Symptoms Multi-Select */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#424842] dark:text-[#9E9892]">
                Observed Teething Symptoms
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TEETHING_SYMPTOMS.map((sym) => {
                  const isChecked = selectedSymptoms.includes(sym);
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
                        } else {
                          setSelectedSymptoms([...selectedSymptoms, sym]);
                        }
                      }}
                      className={`tap-feedback p-2.5 rounded-xl text-[11px] font-semibold text-left transition-colors flex items-center justify-between border ${
                        isChecked
                          ? 'bg-[#C8EBCC] text-[#03210E] dark:bg-[#203D24] dark:text-[#ADCFB1] border-[#44634B]/30'
                          : 'bg-[#F1F4F0] dark:bg-[#161C17] text-[#424842] dark:text-[#9E9892] border-transparent'
                      }`}
                    >
                      <span className="truncate">{sym}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes Input */}
            <div>
              <label className="block text-xs font-semibold text-[#424842] dark:text-[#9E9892] mb-1">
                Parent Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Sharp white tip felt through gum today..."
                value={toothNotes}
                onChange={(e) => setToothNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-[#191C1A] dark:text-[#FAF8F5]"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-2">
              {teethRecords[selectedToothMeta.key] && (
                <button
                  type="button"
                  onClick={handleResetTooth}
                  className="tap-feedback py-3 px-4 rounded-full border border-rose-300 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/20"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveTooth}
                className="tap-feedback flex-1 py-3 rounded-full bg-[#44634B] hover:bg-[#344738] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Tooth Status</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
