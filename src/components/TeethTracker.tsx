'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { ToothRecord, ChildProfile } from '@/lib/types';
import { syncSingleRecord, deleteSingleRecord } from '@/lib/syncService';
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
}

const PRIMARY_TEETH: ToothMeta[] = [
  // Upper Jaw (From back-left to back-right)
  { key: 'upper-molar2-left', name: 'Upper 2nd Molar (Left)', code: '2M', jaw: 'upper', side: 'left', type: 'molar2', typicalRange: '25–33 months', ageLabel: '25m', orderEstimate: 19 },
  { key: 'upper-molar1-left', name: 'Upper 1st Molar (Left)', code: '1M', jaw: 'upper', side: 'left', type: 'molar1', typicalRange: '13–19 months', ageLabel: '13m', orderEstimate: 9 },
  { key: 'upper-canine-left', name: 'Upper Canine (Left)', code: 'C', jaw: 'upper', side: 'left', type: 'canine', typicalRange: '16–22 months', ageLabel: '16m', orderEstimate: 15 },
  { key: 'upper-lateral-left', name: 'Upper Lateral Incisor (Left)', code: 'LI', jaw: 'upper', side: 'left', type: 'lateral', typicalRange: '9–13 months', ageLabel: '9m', orderEstimate: 5 },
  { key: 'upper-central-left', name: 'Upper Central Incisor (Left)', code: 'CI', jaw: 'upper', side: 'left', type: 'incisor', typicalRange: '8–12 months', ageLabel: '8m', orderEstimate: 3 },
  { key: 'upper-central-right', name: 'Upper Central Incisor (Right)', code: 'CI', jaw: 'upper', side: 'right', type: 'incisor', typicalRange: '8–12 months', ageLabel: '8m', orderEstimate: 4 },
  { key: 'upper-lateral-right', name: 'Upper Lateral Incisor (Right)', code: 'LI', jaw: 'upper', side: 'right', type: 'lateral', typicalRange: '9–13 months', ageLabel: '9m', orderEstimate: 6 },
  { key: 'upper-canine-right', name: 'Upper Canine (Right)', code: 'C', jaw: 'upper', side: 'right', type: 'canine', typicalRange: '16–22 months', ageLabel: '16m', orderEstimate: 16 },
  { key: 'upper-molar1-right', name: 'Upper 1st Molar (Right)', code: '1M', jaw: 'upper', side: 'right', type: 'molar1', typicalRange: '13–19 months', ageLabel: '13m', orderEstimate: 10 },
  { key: 'upper-molar2-right', name: 'Upper 2nd Molar (Right)', code: '2M', jaw: 'upper', side: 'right', type: 'molar2', typicalRange: '25–33 months', ageLabel: '25m', orderEstimate: 20 },

  // Lower Jaw (From back-left to back-right)
  { key: 'lower-molar2-left', name: 'Lower 2nd Molar (Left)', code: '2M', jaw: 'lower', side: 'left', type: 'molar2', typicalRange: '23–31 months', ageLabel: '23m', orderEstimate: 17 },
  { key: 'lower-molar1-left', name: 'Lower 1st Molar (Left)', code: '1M', jaw: 'lower', side: 'left', type: 'molar1', typicalRange: '14–18 months', ageLabel: '14m', orderEstimate: 11 },
  { key: 'lower-canine-left', name: 'Lower Canine (Left)', code: 'C', jaw: 'lower', side: 'left', type: 'canine', typicalRange: '17–23 months', ageLabel: '17m', orderEstimate: 13 },
  { key: 'lower-lateral-left', name: 'Lower Lateral Incisor (Left)', code: 'LI', jaw: 'lower', side: 'left', type: 'lateral', typicalRange: '10–16 months', ageLabel: '10m', orderEstimate: 7 },
  { key: 'lower-central-left', name: 'Lower Central Incisor (Left)', code: 'CI', jaw: 'lower', side: 'left', type: 'incisor', typicalRange: '6–10 months (Usually First!)', ageLabel: '6m', orderEstimate: 1 },
  { key: 'lower-central-right', name: 'Lower Central Incisor (Right)', code: 'CI', jaw: 'lower', side: 'right', type: 'incisor', typicalRange: '6–10 months', ageLabel: '6m', orderEstimate: 2 },
  { key: 'lower-lateral-right', name: 'Lower Lateral Incisor (Right)', code: 'LI', jaw: 'lower', side: 'right', type: 'lateral', typicalRange: '10–16 months', ageLabel: '10m', orderEstimate: 8 },
  { key: 'lower-canine-right', name: 'Lower Canine (Right)', code: 'C', jaw: 'lower', side: 'right', type: 'canine', typicalRange: '17–23 months', ageLabel: '17m', orderEstimate: 14 },
  { key: 'lower-molar1-right', name: 'Lower 1st Molar (Right)', code: '1M', jaw: 'lower', side: 'right', type: 'molar1', typicalRange: '14–18 months', ageLabel: '14m', orderEstimate: 12 },
  { key: 'lower-molar2-right', name: 'Lower 2nd Molar (Right)', code: '2M', jaw: 'lower', side: 'right', type: 'molar2', typicalRange: '23–31 months', ageLabel: '23m', orderEstimate: 18 },
];

const TEETHING_SYMPTOMS = [
  'Heavy Drooling',
  'Chewing on hands/toys',
  'Tender swollen gums',
  'Mild fussiness',
  'Cheek flushing',
  'Disturbed sleep',
];

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
  const [eruptDate, setEruptDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [toothNotes, setToothNotes] = useState<string>('');
  const [isEruptedState, setIsEruptedState] = useState<boolean>(true);

  const selectedToothMeta = selectedToothKey
    ? PRIMARY_TEETH.find((t) => t.key === selectedToothKey)
    : null;

  const eruptedCount = Object.values(teethRecords).filter((t) => t.isErupted).length;
  const eruptingCount = Object.values(teethRecords).filter((t) => !t.isErupted && t.notes?.includes('Erupting')).length;

  const handleOpenToothModal = (tooth: ToothMeta) => {
    setSelectedToothKey(tooth.key);
    const existing = teethRecords[tooth.key];
    if (existing) {
      setIsEruptedState(!!existing.isErupted);
      setEruptDate(existing.eruptedDate || new Date().toISOString().split('T')[0]);
      setSelectedSymptoms(existing.symptoms || []);
      setToothNotes(existing.notes || '');
    } else {
      setIsEruptedState(true);
      setEruptDate(new Date().toISOString().split('T')[0]);
      setSelectedSymptoms([]);
      setToothNotes('');
    }
  };

  const handleSaveTooth = () => {
    if (!selectedToothMeta) return;

    const updatedRecord: ToothRecord = {
      id: teethRecords[selectedToothMeta.key]?.id || `tooth_${Date.now()}`,
      childId: profile.id,
      toothKey: selectedToothMeta.key,
      name: selectedToothMeta.name,
      isErupted: isEruptedState,
      eruptedDate: isEruptedState ? eruptDate : undefined,
      symptoms: selectedSymptoms,
      notes: toothNotes,
    };

    const newRecords = {
      ...teethRecords,
      [selectedToothMeta.key]: updatedRecord,
    };

    setTeethRecords(newRecords);
    localStorage.setItem(`dayone_teeth_${profile.id}`, JSON.stringify(newRecords));
    syncSingleRecord('teeth_records', updatedRecord);

    if (isEruptedState) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#44634B', '#C8EBCC', '#D97757'],
      });
    }

    setSelectedToothKey(null);
  };

  const handleResetTooth = () => {
    if (!selectedToothMeta) return;
    const newRecords = { ...teethRecords };
    delete newRecords[selectedToothMeta.key];
    setTeethRecords(newRecords);
    localStorage.setItem(`dayone_teeth_${profile.id}`, JSON.stringify(newRecords));
    deleteSingleRecord('teeth_records', selectedToothMeta.key);
    setSelectedToothKey(null);
  };

  return (
    <div className="space-y-5 animate-reveal">
      
      {/* 1. Header & Milestone Banner (Stitch Component) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#191C1A] dark:text-[#FAF8F5]">
              Baby Teeth & Dental Eruption
            </h2>
            <p className="text-xs text-[#424842] dark:text-[#9E9892]">
              Interactive 20-tooth pediatric developmental chart
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C8EBCC] dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1] font-bold text-xs">
            <span>{eruptedCount} / 20</span>
            <span className="font-normal text-[11px]">Erupted</span>
          </div>
        </div>

        {/* Milestone highlight pill */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F1F4F0] dark:bg-[#1C241E] text-[#191C1A] dark:text-[#FAF8F5] border border-[#E0E3DF] dark:border-[#2D382F]">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-[#D97757] shrink-0" />
            <span className="text-xs font-semibold truncate">
              {eruptedCount > 0
                ? `First tooth erupted in month 6. Gums developing on track.`
                : 'Watching for the first lower central incisor budding (typically 6–10m).'}
            </span>
          </div>
          <CheckCircle2 className="w-4 h-4 text-[#44634B] dark:text-[#ADCFB1] shrink-0" />
        </div>
      </div>

      {/* 2. Interactive Primary Dental Arch Chart */}
      <div className="bg-white dark:bg-[#1E2520] rounded-3xl p-5 shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] space-y-4">
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-base font-bold text-[#191C1A] dark:text-[#FAF8F5] block">
              Pediatric Dental Arch
            </span>
            <span className="text-xs text-[#75706B] dark:text-[#9E9892]">
              Tap any tooth node to view developmental stats or log eruption
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#F1F4F0] dark:bg-[#263129] flex items-center justify-center text-[#44634B] dark:text-[#ADCFB1]">
            <Info className="w-4 h-4" />
          </div>
        </div>

        {/* Legend Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-semibold select-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#44634B] text-white">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span>Erupted ({eruptedCount})</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFDDAE] text-[#281800] dark:bg-[#3D2C12] dark:text-[#F8BC58] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#7C5400]" />
            <span>Budding ({eruptingCount})</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1F4F0] dark:bg-[#202822] text-[#424842] dark:text-[#9E9892]">
            <span className="w-2 h-2 rounded-full bg-[#C2C8C0]" />
            <span>Expected ({20 - eruptedCount - eruptingCount})</span>
          </div>
        </div>

        {/* Arch Segment Container */}
        <div className="p-4 rounded-2xl bg-[#F1F4F0] dark:bg-[#161C17] space-y-5">
          
          {/* Upper Jaw (Maxilla) */}
          <div className="space-y-2">
            <div className="text-center">
              <span className="text-[11px] font-semibold text-[#75706B] dark:text-[#9E9892]">
                Upper Jaw • Maxilla (10)
              </span>
            </div>

            {/* Upper Teeth Row */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {PRIMARY_TEETH.filter((t) => t.jaw === 'upper').map((tooth) => {
                const rec = teethRecords[tooth.key];
                const isErupted = rec?.isErupted;
                const isErupting = !rec?.isErupted && rec?.notes?.includes('Erupting');

                return (
                  <button
                    key={tooth.key}
                    type="button"
                    onClick={() => handleOpenToothModal(tooth)}
                    className={`tap-feedback h-14 rounded-2xl flex flex-col items-center justify-center p-1 border cursor-pointer ${
                      isErupted
                        ? 'bg-[#44634B] text-white border-[#344738] shadow-xs'
                        : isErupting
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

            {/* Lower Teeth Row */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {PRIMARY_TEETH.filter((t) => t.jaw === 'lower').map((tooth) => {
                const rec = teethRecords[tooth.key];
                const isErupted = rec?.isErupted;
                const isErupting = !rec?.isErupted && rec?.notes?.includes('Erupting');

                return (
                  <button
                    key={tooth.key}
                    type="button"
                    onClick={() => handleOpenToothModal(tooth)}
                    className={`tap-feedback h-14 rounded-2xl flex flex-col items-center justify-center p-1 border cursor-pointer ${
                      isErupted
                        ? 'bg-[#44634B] text-white border-[#344738] shadow-xs'
                        : isErupting
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
      </div>

      {/* 3. Teething Relief & Symptoms Bento (Stitch UI) */}
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

      {/* 4. Tooth Modal */}
      {selectedToothMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#1E2520] rounded-[28px] border border-[#E8E4DC] dark:border-[#2D382F] p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-[#E8E4DC] dark:border-[#2D382F] pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#191C1A] dark:text-[#FAF8F5]">
                  {selectedToothMeta.name}
                </h3>
                <p className="text-[11px] text-[#424842] dark:text-[#9E9892]">
                  Typical Eruption: {selectedToothMeta.typicalRange}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedToothKey(null)}
                className="p-1 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEruptedState(true);
                    setToothNotes('Fully erupted');
                  }}
                  className={`flex-1 py-2 rounded-full font-bold transition-all ${
                    isEruptedState
                      ? 'bg-[#44634B] text-white shadow-xs'
                      : 'bg-[#F1F4F0] text-[#424842]'
                  }`}
                >
                  ✓ Erupted
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEruptedState(false);
                    setToothNotes('Budding / Erupting');
                  }}
                  className={`flex-1 py-2 rounded-full font-bold transition-all ${
                    !isEruptedState && toothNotes.includes('Erupting')
                      ? 'bg-[#FFDDAE] text-[#281800] shadow-xs'
                      : 'bg-[#F1F4F0] text-[#424842]'
                  }`}
                >
                  ⚡ Budding / Soon
                </button>
              </div>

              {isEruptedState && (
                <div>
                  <label className="block font-semibold mb-1 text-[#424842] dark:text-[#9E9892]">Eruption Date</label>
                  <input
                    type="date"
                    value={eruptDate}
                    onChange={(e) => setEruptDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F]"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1 text-[#424842] dark:text-[#9E9892]">Noticed Symptoms</label>
                <div className="grid grid-cols-2 gap-1.5">
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
                        className={`p-2 rounded-xl text-[11px] font-semibold text-left transition-colors ${
                          isChecked
                            ? 'bg-[#C8EBCC] text-[#03210E] dark:bg-[#203D24] dark:text-[#ADCFB1]'
                            : 'bg-[#F1F4F0] dark:bg-[#161C17] text-[#424842] dark:text-[#9E9892]'
                        }`}
                      >
                        {sym}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                {teethRecords[selectedToothMeta.key] && (
                  <button
                    type="button"
                    onClick={handleResetTooth}
                    className="py-2.5 px-3 rounded-full border border-rose-300 text-rose-600 font-semibold"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveTooth}
                  className="flex-1 py-2.5 rounded-full bg-[#44634B] hover:bg-[#344738] text-white font-semibold shadow-xs"
                >
                  Save Tooth Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
