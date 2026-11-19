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
} from 'lucide-react';
import { ToothRecord, ChildProfile } from '@/lib/types';
import confetti from 'canvas-confetti';

interface TeethTrackerProps {
  profile: ChildProfile;
  userRole?: 'parent' | 'family';
}

interface ToothMeta {
  key: string;
  name: string;
  jaw: 'upper' | 'lower';
  side: 'left' | 'right';
  type: 'incisor' | 'lateral' | 'canine' | 'molar1' | 'molar2';
  typicalRange: string;
  orderEstimate: number;
}

const PRIMARY_TEETH: ToothMeta[] = [
  // Upper Jaw (From back-left to back-right)
  { key: 'upper-molar2-left', name: 'Upper 2nd Molar (Left)', jaw: 'upper', side: 'left', type: 'molar2', typicalRange: '25–33 months', orderEstimate: 19 },
  { key: 'upper-molar1-left', name: 'Upper 1st Molar (Left)', jaw: 'upper', side: 'left', type: 'molar1', typicalRange: '13–19 months', orderEstimate: 9 },
  { key: 'upper-canine-left', name: 'Upper Canine (Left)', jaw: 'upper', side: 'left', type: 'canine', typicalRange: '16–22 months', orderEstimate: 15 },
  { key: 'upper-lateral-left', name: 'Upper Lateral Incisor (Left)', jaw: 'upper', side: 'left', type: 'lateral', typicalRange: '9–13 months', orderEstimate: 5 },
  { key: 'upper-central-left', name: 'Upper Central Incisor (Left)', jaw: 'upper', side: 'left', type: 'incisor', typicalRange: '8–12 months', orderEstimate: 3 },
  { key: 'upper-central-right', name: 'Upper Central Incisor (Right)', jaw: 'upper', side: 'right', type: 'incisor', typicalRange: '8–12 months', orderEstimate: 4 },
  { key: 'upper-lateral-right', name: 'Upper Lateral Incisor (Right)', jaw: 'upper', side: 'right', type: 'lateral', typicalRange: '9–13 months', orderEstimate: 6 },
  { key: 'upper-canine-right', name: 'Upper Canine (Right)', jaw: 'upper', side: 'right', type: 'canine', typicalRange: '16–22 months', orderEstimate: 16 },
  { key: 'upper-molar1-right', name: 'Upper 1st Molar (Right)', jaw: 'upper', side: 'right', type: 'molar1', typicalRange: '13–19 months', orderEstimate: 10 },
  { key: 'upper-molar2-right', name: 'Upper 2nd Molar (Right)', jaw: 'upper', side: 'right', type: 'molar2', typicalRange: '25–33 months', orderEstimate: 20 },

  // Lower Jaw (From back-left to back-right)
  { key: 'lower-molar2-left', name: 'Lower 2nd Molar (Left)', jaw: 'lower', side: 'left', type: 'molar2', typicalRange: '23–31 months', orderEstimate: 17 },
  { key: 'lower-molar1-left', name: 'Lower 1st Molar (Left)', jaw: 'lower', side: 'left', type: 'molar1', typicalRange: '14–18 months', orderEstimate: 11 },
  { key: 'lower-canine-left', name: 'Lower Canine (Left)', jaw: 'lower', side: 'left', type: 'canine', typicalRange: '17–23 months', orderEstimate: 13 },
  { key: 'lower-lateral-left', name: 'Lower Lateral Incisor (Left)', jaw: 'lower', side: 'left', type: 'lateral', typicalRange: '10–16 months', orderEstimate: 7 },
  { key: 'lower-central-left', name: 'Lower Central Incisor (Left)', jaw: 'lower', side: 'left', type: 'incisor', typicalRange: '6–10 months (Usually First!)', orderEstimate: 1 },
  { key: 'lower-central-right', name: 'Lower Central Incisor (Right)', jaw: 'lower', side: 'right', type: 'incisor', typicalRange: '6–10 months', orderEstimate: 2 },
  { key: 'lower-lateral-right', name: 'Lower Lateral Incisor (Right)', jaw: 'lower', side: 'right', type: 'lateral', typicalRange: '10–16 months', orderEstimate: 8 },
  { key: 'lower-canine-right', name: 'Lower Canine (Right)', jaw: 'lower', side: 'right', type: 'canine', typicalRange: '17–23 months', orderEstimate: 14 },
  { key: 'lower-molar1-right', name: 'Lower 1st Molar (Right)', jaw: 'lower', side: 'right', type: 'molar1', typicalRange: '14–18 months', orderEstimate: 12 },
  { key: 'lower-molar2-right', name: 'Lower 2nd Molar (Right)', jaw: 'lower', side: 'right', type: 'molar2', typicalRange: '23–31 months', orderEstimate: 18 },
];

const TEETHING_SYMPTOMS = [
  'Heavy Drooling',
  'Chewing on hands/toys',
  'Tender swollen gums',
  'Mild fussiness',
  'Cheek flushing',
  'Disturbed sleep',
  'Slightly reduced appetite',
];

export const TeethTracker: React.FC<TeethTrackerProps> = ({
  profile,
  userRole = 'parent',
}) => {
  // Tooth records stored in localStorage by childId
  const [teethRecords, setTeethRecords] = useState<Record<string, ToothRecord>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`dayone_teeth_${profile.id}`);
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const [selectedToothKey, setSelectedToothKey] = useState<string | null>(null);
  const [eruptDate, setEruptDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [toothNotes, setToothNotes] = useState<string>('');

  const selectedToothMeta = selectedToothKey
    ? PRIMARY_TEETH.find((t) => t.key === selectedToothKey)
    : null;

  const eruptedCount = Object.values(teethRecords).filter((t) => t.isErupted).length;

  const handleOpenToothModal = (tooth: ToothMeta) => {
    setSelectedToothKey(tooth.key);
    const existing = teethRecords[tooth.key];
    if (existing) {
      setEruptDate(existing.eruptedDate || new Date().toISOString().split('T')[0]);
      setSelectedSymptoms(existing.symptoms || []);
      setToothNotes(existing.notes || '');
    } else {
      setEruptDate(new Date().toISOString().split('T')[0]);
      setSelectedSymptoms([]);
      setToothNotes('');
    }
  };

  const handleToggleSymptom = (sym: string) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  const handleSaveTooth = (isErupted: boolean) => {
    if (!selectedToothKey || !selectedToothMeta) return;

    const updated: Record<string, ToothRecord> = {
      ...teethRecords,
      [selectedToothKey]: {
        id: `tooth_${selectedToothKey}`,
        childId: profile.id,
        toothKey: selectedToothKey,
        name: selectedToothMeta.name,
        jaw: selectedToothMeta.jaw,
        type: selectedToothMeta.type,
        isErupted,
        eruptedDate: isErupted ? eruptDate : undefined,
        symptoms: isErupted ? selectedSymptoms : undefined,
        notes: isErupted && toothNotes.trim() ? toothNotes.trim() : undefined,
      },
    };

    if (!isErupted) {
      delete updated[selectedToothKey];
    }

    setTeethRecords(updated);
    localStorage.setItem(`dayone_teeth_${profile.id}`, JSON.stringify(updated));
    setSelectedToothKey(null);

    if (isErupted) {
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

  // Group teeth into upper and lower arches
  const upperTeeth = PRIMARY_TEETH.filter((t) => t.jaw === 'upper');
  const lowerTeeth = PRIMARY_TEETH.filter((t) => t.jaw === 'lower');

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-teal-500/10 border border-[#EAE6DF] dark:border-[#2D2B33] flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-xl bg-[#E2765A] text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#201E1D] dark:text-[#FAF8F5]">
              Interactive 20-Baby-Teeth Eruption Map
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#75706B] dark:text-[#9E9892] max-w-xl">
            Track baby’s dental milestones! Tap any tooth on the dental arches to mark when it erupted, record symptoms, and view soothing pediatric teething remedies.
          </p>
        </div>

        {/* Eruption Progress Counter */}
        <div className="bg-white dark:bg-[#1D1C22] p-4 rounded-2xl border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs flex items-center gap-4 shrink-0">
          <div className="text-center">
            <div className="text-2xl font-black text-[#E2765A] font-mono">
              {eruptedCount} <span className="text-xs font-medium text-[#75706B]">/ 20</span>
            </div>
            <div className="text-[10px] text-[#75706B] dark:text-[#9E9892] uppercase font-bold tracking-wider">
              Teeth Erupted
            </div>
          </div>
          <div className="w-24 bg-[#EAE6DF] dark:bg-[#2D2B33] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#E2765A] h-full transition-all duration-500 rounded-full"
              style={{ width: `${(eruptedCount / 20) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Dental Arch Presentation Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-sm space-y-8">
        
        {/* UPPER JAW (Maxilla) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#EAE6DF] dark:border-[#2D2B33] pb-2">
            <span className="text-xs font-bold text-[#201E1D] dark:text-[#FAF8F5] uppercase tracking-wider">
              Upper Dental Arch (Top 10 Teeth)
            </span>
            <span className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
              {upperTeeth.filter((t) => teethRecords[t.key]?.isErupted).length} / 10 Erupted
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 pt-2">
            {upperTeeth.map((tooth) => {
              const record = teethRecords[tooth.key];
              const isErupted = record?.isErupted;

              return (
                <button
                  key={tooth.key}
                  onClick={() => handleOpenToothModal(tooth)}
                  className={`group relative p-2.5 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center gap-1.5 ${
                    isErupted
                      ? 'bg-gradient-to-b from-amber-50 to-white dark:from-[#2A2322] dark:to-[#1D1C22] border-[#E2765A] shadow-md scale-102 ring-2 ring-[#E2765A]/20'
                      : 'bg-[#FAF8F5] dark:bg-[#17161B] border-dashed border-[#EAE6DF] dark:border-[#2D2B33] hover:border-[#D0C9BE] dark:hover:border-[#3D3A44] opacity-80 hover:opacity-100'
                  }`}
                >
                  {/* Tooth SVG Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
                    isErupted
                      ? 'bg-[#E2765A] text-white shadow-xs'
                      : 'bg-white dark:bg-[#201E26] text-[#75706B] dark:text-[#9E9892]'
                  }`}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M12 2C8 2 6 5 6 9C6 13 8 16 9 20C9.5 21.5 10 22 11 22C11.5 22 12 21 12 19C12 21 12.5 22 13 22C14 22 14.5 21.5 15 20C16 16 18 13 18 9C18 5 16 2 12 2Z" />
                    </svg>
                  </div>

                  <span className="text-[10px] font-bold text-center leading-tight truncate w-full text-[#201E1D] dark:text-[#FAF8F5]">
                    {tooth.name.split(' (')[0].replace('Upper ', '')}
                  </span>

                  <span className="text-[9px] text-[#75706B] dark:text-[#9E9892] leading-none">
                    {isErupted ? '✓ Erupted' : tooth.typicalRange.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* LOWER JAW (Mandible) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-[#EAE6DF] dark:border-[#2D2B33] pb-2">
            <span className="text-xs font-bold text-[#201E1D] dark:text-[#FAF8F5] uppercase tracking-wider">
              Lower Dental Arch (Bottom 10 Teeth)
            </span>
            <span className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
              {lowerTeeth.filter((t) => teethRecords[t.key]?.isErupted).length} / 10 Erupted
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 pt-2">
            {lowerTeeth.map((tooth) => {
              const record = teethRecords[tooth.key];
              const isErupted = record?.isErupted;

              return (
                <button
                  key={tooth.key}
                  onClick={() => handleOpenToothModal(tooth)}
                  className={`group relative p-2.5 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center gap-1.5 ${
                    isErupted
                      ? 'bg-gradient-to-t from-amber-50 to-white dark:from-[#2A2322] dark:to-[#1D1C22] border-[#E2765A] shadow-md scale-102 ring-2 ring-[#E2765A]/20'
                      : 'bg-[#FAF8F5] dark:bg-[#17161B] border-dashed border-[#EAE6DF] dark:border-[#2D2B33] hover:border-[#D0C9BE] dark:hover:border-[#3D3A44] opacity-80 hover:opacity-100'
                  }`}
                >
                  {/* Tooth SVG Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
                    isErupted
                      ? 'bg-[#E2765A] text-white shadow-xs'
                      : 'bg-white dark:bg-[#201E26] text-[#75706B] dark:text-[#9E9892]'
                  }`}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current transform rotate-180">
                      <path d="M12 2C8 2 6 5 6 9C6 13 8 16 9 20C9.5 21.5 10 22 11 22C11.5 22 12 21 12 19C12 21 12.5 22 13 22C14 22 14.5 21.5 15 20C16 16 18 13 18 9C18 5 16 2 12 2Z" />
                    </svg>
                  </div>

                  <span className="text-[10px] font-bold text-center leading-tight truncate w-full text-[#201E1D] dark:text-[#FAF8F5]">
                    {tooth.name.split(' (')[0].replace('Lower ', '')}
                  </span>

                  <span className="text-[9px] text-[#75706B] dark:text-[#9E9892] leading-none">
                    {isErupted ? '✓ Erupted' : tooth.typicalRange.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Pediatric Teething Remedies & Safety Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Recommended Teething Soothing Methods</span>
          </div>
          <ul className="text-xs text-[#75706B] dark:text-[#9E9892] space-y-1.5 list-disc pl-4">
            <li><strong>Chilled Silicone Teethers:</strong> Cool in the fridge (not freezer, as frozen plastic can bruise tender gums).</li>
            <li><strong>Clean Finger Gum Massage:</strong> Gently rub baby's gums in small circular motions to counter gum pressure.</li>
            <li><strong>Cold Cotton Washcloth:</strong> Wet a clean cloth in boiled, cooled water and let baby gnaw on it.</li>
            <li><strong>Frequent Bib Changes:</strong> Wipe drool gently to prevent skin rash (*drool rash*) around chin and neck.</li>
          </ul>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
            <AlertCircle className="w-4 h-4" />
            <span>Safety Warnings (Indian Academy of Pediatrics)</span>
          </div>
          <ul className="text-xs text-[#75706B] dark:text-[#9E9892] space-y-1.5 list-disc pl-4">
            <li><strong>Avoid Amber Necklaces:</strong> Severe strangulation and choking hazards with zero medical evidence.</li>
            <li><strong>No Numbing Gels:</strong> Teething gels containing lidocaine or benzocaine are unsafe for infants under 2 years.</li>
            <li><strong>High Fever is NOT from Teething:</strong> Teething causes slight fussiness or low warmth (&lt;38°C). Any fever &gt;38°C (100.4°F), diarrhea, or vomiting requires a pediatrician visit.</li>
          </ul>
        </div>

      </div>

      {/* TOOTH LOGGING MODAL */}
      {selectedToothMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C1A22] border border-[#EAE6DF] dark:border-[#2D2B33] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DF] dark:border-[#2D2B33]">
              <div>
                <h3 className="font-bold text-sm text-[#201E1D] dark:text-[#FAF8F5]">
                  {selectedToothMeta.name}
                </h3>
                <p className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
                  Typical Eruption Window: {selectedToothMeta.typicalRange}
                </p>
              </div>
              <button
                onClick={() => setSelectedToothKey(null)}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#75706B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Date Erupted */}
            <div>
              <label className="block text-xs font-semibold text-[#75706B] dark:text-[#9E9892] mb-1">
                Date Tooth Appeared
              </label>
              <input
                type="date"
                value={eruptDate}
                onChange={(e) => setEruptDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
              />
            </div>

            {/* Symptoms Tag Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#75706B] dark:text-[#9E9892] mb-1.5">
                Teething Symptoms Observed
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TEETHING_SYMPTOMS.map((sym) => {
                  const isChecked = selectedSymptoms.includes(sym);
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => handleToggleSymptom(sym)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all ${
                        isChecked
                          ? 'bg-[#E2765A] text-white border-[#E2765A] shadow-xs'
                          : 'bg-[#FAF8F5] dark:bg-[#141317] border-[#EAE6DF] dark:border-[#2D2B33] text-[#75706B] dark:text-[#9E9892]'
                      }`}
                    >
                      {sym}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#75706B] dark:text-[#9E9892] mb-1">
                Optional Notes
              </label>
              <input
                type="text"
                placeholder="e.g. First tooth cut through lower gum on Sunday morning!"
                value={toothNotes}
                onChange={(e) => setToothNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              {teethRecords[selectedToothMeta.key]?.isErupted && (
                <button
                  type="button"
                  onClick={() => handleSaveTooth(false)}
                  className="py-2.5 px-3 rounded-xl border border-rose-300 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 font-semibold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/20"
                >
                  Unmark
                </button>
              )}

              <button
                type="button"
                onClick={() => handleSaveTooth(true)}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-[#E2765A] hover:bg-[#CB6145] text-white shadow-sm transition-all active:scale-[0.98]"
              >
                Mark Tooth as Erupted ✨
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
