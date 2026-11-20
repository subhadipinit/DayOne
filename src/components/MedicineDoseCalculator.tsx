'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Thermometer,
  ShieldAlert,
  Info,
  Pill,
  Sparkles,
  RotateCcw,
  Plus,
  Minus,
  Trash2,
  Copy,
  Check,
  Calendar,
  User,
  Droplets,
  Heart,
  X,
  History,
  FileText,
  Stethoscope,
  ChevronRight,
  Phone,
  Scale,
  Sun,
  Flame,
  AlertCircle,
  HelpCircle,
  CheckCircle,
} from 'lucide-react';
import { ChildProfile, GrowthRecord, MedicineDoseLog } from '@/lib/types';
import { INITIAL_MEDICINE_LOGS } from '@/lib/initialData';
import { syncSingleRecord, deleteSingleRecord } from '@/lib/syncService';
import { generateUniqueId } from '@/lib/store';
import confetti from 'canvas-confetti';
import { ActiveTab } from './BottomNav';

interface MedicineDoseCalculatorProps {
  profile: ChildProfile;
  latestGrowth?: GrowthRecord;
  userRole?: 'parent' | 'family';
  onNavigateTab?: (tab: ActiveTab) => void;
}

export type MedicineCategory = 'fever' | 'supplement' | 'colic' | 'cold' | 'digestive';

export interface MedicineFormulation {
  id: string;
  brand: string;
  generic: string;
  category: MedicineCategory;
  concentrationMgPerMl: number;
  concentrationDisplay: string;
  isWeightBased: boolean;
  standardDoseMgPerKg?: number;
  fixedDoseDisplay?: string;
  minAgeMonths: number;
  minIntervalHours: number;
  maxDosesPerDay: number;
  formType: 'drops' | 'suspension' | 'sachet';
  usageGuidance: string;
  indication: string;
  highlightPill?: string;
}

export const COMMON_MEDICATIONS: MedicineFormulation[] = [
  // --- PARACETAMOL / FEVER ---
  {
    id: 'crocin_drops',
    brand: 'Crocin / Calpol Infant Drops',
    generic: 'Paracetamol (100 mg / 1 mL)',
    category: 'fever',
    concentrationMgPerMl: 100,
    concentrationDisplay: '100 mg / 1 mL',
    isWeightBased: true,
    standardDoseMgPerKg: 15,
    minAgeMonths: 0,
    minIntervalHours: 4,
    maxDosesPerDay: 4,
    formType: 'drops',
    usageGuidance: 'Use calibrated oral dropper. For fever >38.0°C (100.4°F) or post-immunization discomfort.',
    indication: 'Infant Fever & Teething',
    highlightPill: 'Rapid Infant Drops',
  },
  {
    id: 'calpol_120',
    brand: 'Calpol / Crocin 120 Suspension',
    generic: 'Paracetamol (120 mg / 5 mL)',
    category: 'fever',
    concentrationMgPerMl: 24,
    concentrationDisplay: '120 mg / 5 mL (24 mg/ml)',
    isWeightBased: true,
    standardDoseMgPerKg: 15,
    minAgeMonths: 2,
    minIntervalHours: 4,
    maxDosesPerDay: 4,
    formType: 'suspension',
    usageGuidance: 'Shake bottle thoroughly. Measure with oral syringe. Minimum 4 hours between doses.',
    indication: 'Infant Fever & Pain Relief',
    highlightPill: 'Syrup 120',
  },
  {
    id: 'calpol_250_ds',
    brand: 'Calpol 250 / Crocin DS Syrup',
    generic: 'Paracetamol (250 mg / 5 mL Double Strength)',
    category: 'fever',
    concentrationMgPerMl: 50,
    concentrationDisplay: '250 mg / 5 mL (50 mg/ml)',
    isWeightBased: true,
    standardDoseMgPerKg: 15,
    minAgeMonths: 6,
    minIntervalHours: 4,
    maxDosesPerDay: 4,
    formType: 'suspension',
    usageGuidance: 'Double-strength formulation for older infants (>7 kg) to reduce liquid swallow volume.',
    indication: 'High Fever (>38.5°C)',
    highlightPill: 'Double Strength DS',
  },
  {
    id: 'ibugesic_plus',
    brand: 'Ibuprofen / Ibugesic Suspension',
    generic: 'Ibuprofen (100 mg / 5 mL)',
    category: 'fever',
    concentrationMgPerMl: 20,
    concentrationDisplay: '100 mg / 5 mL (20 mg/ml)',
    isWeightBased: true,
    standardDoseMgPerKg: 10,
    minAgeMonths: 6,
    minIntervalHours: 6,
    maxDosesPerDay: 3,
    formType: 'suspension',
    usageGuidance: 'Strictly for infants 6 months and older. Give after breastfeed/milk, never on empty stomach.',
    indication: 'High Fever & Inflammation',
    highlightPill: '6+ Months Only',
  },

  // --- VITAMIN D3 & ESSENTIAL SUPPLEMENTS ---
  {
    id: 'kidrich_d3',
    brand: "Kidrich / D3 Infant Drops",
    generic: 'Cholecalciferol (Vitamin D3 400 IU / 0.5 mL)',
    category: 'supplement',
    concentrationMgPerMl: 800,
    concentrationDisplay: '400 IU per 0.5 mL',
    isWeightBased: false,
    fixedDoseDisplay: '0.5 mL (400 IU) once daily',
    minAgeMonths: 0,
    minIntervalHours: 24,
    maxDosesPerDay: 1,
    formType: 'drops',
    usageGuidance: 'Give exactly 0.5 mL once daily every morning using marked dropper. Essential for bone mineralization and immune health.',
    indication: "Baby's Daily Vitamin D3",
    highlightPill: 'Daily Essential',
  },
  {
    id: 'bavon_drops',
    brand: 'Bavon Pediatric Drops',
    generic: 'Multivitamins, B-Complex & Lysine',
    category: 'supplement',
    concentrationMgPerMl: 0,
    concentrationDisplay: 'Pediatric Multivitamin Drops',
    isWeightBased: false,
    fixedDoseDisplay: '0.5 mL once daily post-feed',
    minAgeMonths: 0,
    minIntervalHours: 24,
    maxDosesPerDay: 1,
    formType: 'drops',
    usageGuidance: 'Give 0.5 mL once daily after morning feed. Supports healthy infant appetite and cell metabolism.',
    indication: 'Daily Multivitamin',
    highlightPill: 'Multivitamin',
  },

  // --- COLIC & DIGESTIVE ---
  {
    id: 'colimex_df',
    brand: 'Colimex / Colicaid Drops',
    generic: 'Simethicone (40 mg / mL) Dill Oil Free',
    category: 'colic',
    concentrationMgPerMl: 40,
    concentrationDisplay: 'Simethicone 40 mg / mL',
    isWeightBased: false,
    fixedDoseDisplay: '4 to 8 drops (0.2–0.4 mL)',
    minAgeMonths: 0,
    minIntervalHours: 6,
    maxDosesPerDay: 4,
    formType: 'drops',
    usageGuidance: 'Give 4–8 drops 15 minutes before breast or bottle feed or SOS during acute gas crying spells.',
    indication: 'Colic & Trapped Gas Spells',
    highlightPill: 'Gas & Colic Relief',
  },
  {
    id: 'nasoclear_saline',
    brand: 'Nasoclear / Purified Saline Drops',
    generic: '0.9% Purified Sodium Chloride',
    category: 'cold',
    concentrationMgPerMl: 9,
    concentrationDisplay: '0.9% Purified Saline',
    isWeightBased: false,
    fixedDoseDisplay: '1 to 2 drops each nostril',
    minAgeMonths: 0,
    minIntervalHours: 3,
    maxDosesPerDay: 6,
    formType: 'drops',
    usageGuidance: '100% medication-free! Instill 5 mins before breastfeeds or sleep to clear dried nasal congestion.',
    indication: 'Stuffy Nose & Cold',
    highlightPill: 'Congestion Relief',
  },
];

const DOSE_REASONS = [
  'Viral Fever (>38°C)',
  'Post-Vaccine Fever',
  'Teething Pain & Fussiness',
  'Daily Morning Supplement',
  'Colic & Trapped Gas',
  'Stuffy Nose / Cold',
  'Doctor Advised Dose',
];

const CAREGIVERS = ['Mom 👩', 'Dad 👨', 'Grandparent 👵', 'Doctor/Nurse 🩺'];

export const MedicineDoseCalculator: React.FC<MedicineDoseCalculatorProps> = ({
  profile,
  latestGrowth,
  userRole = 'parent',
  onNavigateTab,
}) => {
  // Baby's active weight in kg (bounded between 2.0 and 25.0 kg)
  const defaultWeight = latestGrowth?.weightKg || profile.birthWeightKg || 8.45;
  const [weightKg, setWeightKg] = useState<number>(() => {
    return Math.min(25.0, Math.max(2.0, parseFloat(defaultWeight.toFixed(2))));
  });

  const [selectedFormulationId, setSelectedFormulationId] = useState<string>('crocin_drops');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Temperature state
  const [currentTempC, setCurrentTempC] = useState<number>(38.2);
  const [tempSite, setTempSite] = useState<'ear' | 'armpit' | 'forehead'>('ear');

  // Log dose modal
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [customDoseMl, setCustomDoseMl] = useState<number>(1.2);
  const [doseTemperatureC, setDoseTemperatureC] = useState<string>('38.2');
  const [doseReason, setDoseReason] = useState<string>('Viral Fever (>38°C)');
  const [administeredBy, setAdministeredBy] = useState<string>('Mom 👩');
  const [doseNotes, setDoseNotes] = useState<string>('');
  const [doseTime, setDoseTime] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [copiedHistory, setCopiedHistory] = useState<boolean>(false);

  // Stored dose history
  const [medHistory, setMedHistory] = useState<MedicineDoseLog[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`dayone_med_history_${profile.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_MEDICINE_LOGS;
  });

  // Active formulation
  const activeFormulation = useMemo(() => {
    return COMMON_MEDICATIONS.find((f) => f.id === selectedFormulationId) || COMMON_MEDICATIONS[0];
  }, [selectedFormulationId]);

  // Exact Dose Calculation
  // Standard paracetamol: 15 mg/kg. Ibuprofen: 10 mg/kg.
  const { calculatedMg, calculatedMl } = useMemo(() => {
    if (!activeFormulation.isWeightBased || !activeFormulation.standardDoseMgPerKg) {
      return { calculatedMg: 0, calculatedMl: 0 };
    }
    const mg = Math.round(weightKg * activeFormulation.standardDoseMgPerKg);
    const ml = parseFloat((mg / activeFormulation.concentrationMgPerMl).toFixed(1));
    return { calculatedMg: mg, calculatedMl: ml };
  }, [weightKg, activeFormulation]);

  // Double-dose prevention countdown timer
  const lastDoseForActiveMed = useMemo(() => {
    return medHistory.find((m) => m.brandName === activeFormulation.brand || m.medicineName.includes(activeFormulation.brand));
  }, [medHistory, activeFormulation]);

  const [secondsUntilNextDose, setSecondsUntilNextDose] = useState<number>(0);

  useEffect(() => {
    if (!lastDoseForActiveMed) {
      setSecondsUntilNextDose(0);
      return;
    }

    const checkInterval = () => {
      const lastTimeMs = new Date(lastDoseForActiveMed.timestamp).getTime();
      const requiredWaitMs = activeFormulation.minIntervalHours * 60 * 60 * 1000;
      const unlockTimeMs = lastTimeMs + requiredWaitMs;
      const remainingMs = unlockTimeMs - Date.now();

      if (remainingMs <= 0) {
        setSecondsUntilNextDose(0);
      } else {
        setSecondsUntilNextDose(Math.floor(remainingMs / 1000));
      }
    };

    checkInterval();
    const timer = setInterval(checkInterval, 1000);
    return () => clearInterval(timer);
  }, [lastDoseForActiveMed, activeFormulation]);

  // Adjust weight helpers
  const handleWeightStep = (delta: number) => {
    setWeightKg((prev) => {
      const next = parseFloat((prev + delta).toFixed(2));
      return Math.min(25.0, Math.max(2.0, next));
    });
  };

  // Open Log Modal
  const openLogModal = () => {
    let initialMl = 1.2;
    if (activeFormulation.isWeightBased && calculatedMl > 0) {
      initialMl = calculatedMl;
    } else if (activeFormulation.id === 'colimex_df') {
      initialMl = 0.3;
    } else if (activeFormulation.id === 'kidrich_d3' || activeFormulation.id === 'bavon_drops') {
      initialMl = 0.5;
    }
    setCustomDoseMl(initialMl);
    setDoseTemperatureC(currentTempC.toString());
    setDoseTime(new Date().toISOString().slice(0, 16));
    setShowLogModal(true);
  };

  const handleSaveDoseLog = (e: React.FormEvent) => {
    e.preventDefault();
    const finalMl = customDoseMl > 0 ? customDoseMl : (calculatedMl > 0 ? calculatedMl : 0.5);

    const newLog: MedicineDoseLog = {
      id: generateUniqueId('med'),
      childId: profile.id,
      timestamp: new Date(doseTime).toISOString(),
      medicineName: `${activeFormulation.brand} (${activeFormulation.generic})`,
      brandName: activeFormulation.brand,
      category: activeFormulation.category,
      weightKgAtTime: weightKg,
      dosageMg: calculatedMg > 0 ? calculatedMg : undefined,
      dosageMl: finalMl,
      temperatureC: doseTemperatureC ? parseFloat(doseTemperatureC) : undefined,
      reason: doseReason,
      administeredBy,
      notes: doseNotes.trim() || undefined,
    };

    const updated = [newLog, ...medHistory];
    setMedHistory(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`dayone_med_history_${profile.id}`, JSON.stringify(updated));
    }
    setShowLogModal(false);
    setDoseNotes('');

    // Sync
    syncSingleRecord('medicine_logs', {
      id: newLog.id,
      child_id: profile.id,
      timestamp: newLog.timestamp,
      medicine_name: newLog.medicineName,
      brand_name: newLog.brandName || null,
      category: newLog.category || 'other',
      weight_kg_at_time: newLog.weightKgAtTime || null,
      dosage_mg: newLog.dosageMg || null,
      dosage_ml: newLog.dosageMl,
      temperature_c: newLog.temperatureC || null,
      reason: newLog.reason || null,
      administered_by: newLog.administeredBy || null,
      notes: newLog.notes || null,
    });

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  const handleDeleteLog = (id: string) => {
    const updated = medHistory.filter((m) => m.id !== id);
    setMedHistory(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`dayone_med_history_${profile.id}`, JSON.stringify(updated));
    }
    deleteSingleRecord('medicine_logs', id);
  };

  const handleCopyHistory = () => {
    if (medHistory.length === 0) return;
    const lines = medHistory.slice(0, 6).map((m) => {
      const dt = new Date(m.timestamp);
      const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = dt.toLocaleDateString([], { month: 'short', day: 'numeric' });
      let text = `• ${dateStr} ${timeStr}: ${m.brandName || m.medicineName} (${m.dosageMl} mL)`;
      if (m.temperatureC) text += ` - Temp: ${m.temperatureC}°C (${((m.temperatureC * 9) / 5 + 32).toFixed(1)}°F)`;
      if (m.reason) text += ` [${m.reason}]`;
      if (m.administeredBy) text += ` (by ${m.administeredBy})`;
      return text;
    });

    const summary = `📋 *Medication History for Dr. ${profile.pediatricianName || 'Pediatrician'}*
👶 *Patient:* ${profile.name} (Active Weight: ${weightKg} kg)

${lines.join('\n')}

_Generated via DayOne Dose Assistant_`;

    navigator.clipboard.writeText(summary);
    setCopiedHistory(true);
    setTimeout(() => setCopiedHistory(false), 2500);
  };

  // Temperature calculations
  const tempStatus = useMemo(() => {
    if (currentTempC >= 39.0) {
      return { label: 'High Fever Danger', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200', isHigh: true };
    }
    if (currentTempC >= 37.8) {
      return { label: 'Mild Fever', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200', isHigh: false };
    }
    return { label: 'Normal Temperature', color: 'bg-[#C8EBCC] text-[#03210E] dark:bg-[#203D24] dark:text-[#ADCFB1]', isHigh: false };
  }, [currentTempC]);

  const waitMinutes = Math.floor(secondsUntilNextDose / 60);
  const waitHours = Math.floor(waitMinutes / 60);
  const remMinutes = waitMinutes % 60;
  const waitDisplay = `${waitHours.toString().padStart(2, '0')}:${remMinutes.toString().padStart(2, '0')}`;

  // Syringe fill calculation
  const syringeDisplayMl = activeFormulation.isWeightBased
    ? calculatedMl
    : activeFormulation.id === 'colimex_df'
    ? 0.3
    : 0.5;
  const syringePercent = Math.min(100, Math.max(8, (syringeDisplayMl / 10) * 100));

  return (
    <div className="space-y-4 sm:space-y-5 animate-reveal">
      {/* 1. Header with Safety Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C8EBCC]/60 dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1] text-[11px] font-bold">
              <ShieldAlert className="w-3.5 h-3.5 text-[#44634B] dark:text-[#ADCFB1]" />
              <span>Pediatric Safe Dosing Guide</span>
            </span>
            <span className="text-[11px] font-semibold text-[#424842] dark:text-[#9E9892]">
              Standard 15 mg/kg Formula
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#191C1A] dark:text-[#FAF8F5]">
            Medicine &amp; Dose Calculator
          </h2>
          <p className="text-xs text-[#424842] dark:text-[#9E9892] mt-0.5">
            Weight-calibrated infant syrup &amp; drop volumes with double-dose safety guard
          </p>
        </div>

        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('doctor')}
            className="tap-feedback min-h-[44px] px-3.5 py-2 rounded-full bg-white dark:bg-[#1E2520] border border-[#E8E4DC] dark:border-[#2D382F] text-[#191C1A] dark:text-[#FAF8F5] text-xs font-bold shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Stethoscope className="w-4 h-4 text-[#44634B] dark:text-[#ADCFB1]" />
            <span>Doctor Vault &amp; Rx →</span>
          </button>
        )}
      </div>

      {/* 2. Pediatric Weight Stepper & Slider with High-Visibility Output */}
      <div className="bg-white dark:bg-[#1E2520] rounded-[24px] p-4 sm:p-5 shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#C8EBCC] dark:bg-[#203D24] text-[#44634B] dark:text-[#ADCFB1] flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5]">
                {profile.name}&apos;s Active Weight
              </span>
              <span className="text-[11px] text-[#424842] dark:text-[#9E9892] block">
                {latestGrowth ? `From ${latestGrowth.date} wellness checkup` : 'Adjust to current scale weight'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#44634B] dark:text-[#ADCFB1] tabular-nums">
              {weightKg.toFixed(2)}
            </span>
            <span className="text-sm font-bold text-[#424842] dark:text-[#9E9892] ml-1">kg</span>
          </div>
        </div>

        {/* Smooth Weight Slider */}
        <div className="space-y-1 pt-1">
          <input
            type="range"
            min="2.0"
            max="22.0"
            step="0.05"
            value={weightKg}
            onChange={(e) => setWeightKg(parseFloat(parseFloat(e.target.value).toFixed(2)))}
            className="w-full h-2.5 bg-[#E0E3DF] dark:bg-[#2D382F] rounded-lg appearance-none cursor-pointer accent-[#44634B] dark:accent-[#ADCFB1]"
          />
          <div className="flex justify-between text-[10px] text-[#424842] dark:text-[#9E9892] font-semibold px-1">
            <span>Newborn (2.5 kg)</span>
            <span>6m (7.5 kg)</span>
            <span>12m (9.5 kg)</span>
            <span>2yr (12+ kg)</span>
          </div>
        </div>

        {/* Stepper Buttons (≥44px Touch Targets) */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleWeightStep(-0.5)}
            className="tap-feedback min-h-[44px] rounded-xl bg-[#F1F4F0] dark:bg-[#161C17] text-[#191C1A] dark:text-[#FAF8F5] text-xs font-bold flex items-center justify-center border border-[#E0E3DF] dark:border-[#2D382F] hover:bg-[#E6E9E4] cursor-pointer"
          >
            -0.5 kg
          </button>
          <button
            type="button"
            onClick={() => handleWeightStep(-0.1)}
            className="tap-feedback min-h-[44px] rounded-xl bg-[#F1F4F0] dark:bg-[#161C17] text-[#191C1A] dark:text-[#FAF8F5] text-xs font-bold flex items-center justify-center border border-[#E0E3DF] dark:border-[#2D382F] hover:bg-[#E6E9E4] cursor-pointer"
          >
            -0.1 kg
          </button>
          <button
            type="button"
            onClick={() => handleWeightStep(0.1)}
            className="tap-feedback min-h-[44px] rounded-xl bg-[#F1F4F0] dark:bg-[#161C17] text-[#191C1A] dark:text-[#FAF8F5] text-xs font-bold flex items-center justify-center border border-[#E0E3DF] dark:border-[#2D382F] hover:bg-[#E6E9E4] cursor-pointer"
          >
            +0.1 kg
          </button>
          <button
            type="button"
            onClick={() => handleWeightStep(0.5)}
            className="tap-feedback min-h-[44px] rounded-xl bg-[#F1F4F0] dark:bg-[#161C17] text-[#191C1A] dark:text-[#FAF8F5] text-xs font-bold flex items-center justify-center border border-[#E0E3DF] dark:border-[#2D382F] hover:bg-[#E6E9E4] cursor-pointer"
          >
            +0.5 kg
          </button>
        </div>
      </div>

      {/* 3. Rapid Drug Selector Chips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-[#424842] dark:text-[#9E9892] uppercase tracking-wider">
            Select Pediatric Medication
          </span>
          <span className="text-[11px] font-semibold text-[#44634B] dark:text-[#ADCFB1]">
            {activeFormulation.isWeightBased ? 'Weight-Calibrated' : 'Standard Routine'}
          </span>
        </div>

        {/* Horizontal Scroll Rapid Drug Cards */}
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {COMMON_MEDICATIONS.map((med) => {
            const isSelected = selectedFormulationId === med.id;
            return (
              <button
                key={med.id}
                type="button"
                onClick={() => setSelectedFormulationId(med.id)}
                className={`tap-feedback shrink-0 min-h-[48px] px-3.5 py-2.5 rounded-2xl flex items-center gap-2.5 text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#44634B] text-white border-[#44634B] shadow-sm'
                    : 'bg-white dark:bg-[#1E2520] text-[#191C1A] dark:text-[#FAF8F5] border-[#E8E4DC] dark:border-[#2D382F] hover:bg-[#F1F4F0] dark:hover:bg-[#263129]'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-[#C8EBCC]/60 dark:bg-[#203D24] text-[#44634B] dark:text-[#ADCFB1]'
                  }`}
                >
                  <Pill className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0 pr-1">
                  <span className="text-xs font-bold truncate max-w-[160px] leading-tight">
                    {med.brand}
                  </span>
                  <span
                    className={`text-[10px] font-medium truncate max-w-[160px] ${
                      isSelected ? 'text-white/80' : 'text-[#424842] dark:text-[#9E9892]'
                    }`}
                  >
                    {med.concentrationDisplay}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Calculated Dosage Hero Spotlight (Clear Bold Dosage) */}
      <div className="bg-white dark:bg-[#1E2520] rounded-[24px] p-5 shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#44634B] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#44634B] dark:text-[#ADCFB1]">
              Recommended Single Dose
            </span>
          </div>

          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F1F4F0] dark:bg-[#161C17] text-[#424842] dark:text-[#9E9892]">
            {activeFormulation.isWeightBased
              ? `${activeFormulation.standardDoseMgPerKg} mg/kg standard`
              : 'Routine dose'}
          </span>
        </div>

        {/* Clear Bold Dosages Callout */}
        <div className="flex items-baseline gap-2.5">
          <span className="text-5xl sm:text-6xl font-black text-[#191C1A] dark:text-[#FAF8F5] tracking-tight tabular-nums">
            {activeFormulation.isWeightBased
              ? `${calculatedMl}`
              : activeFormulation.fixedDoseDisplay?.split(' ')[0] || '0.5'}
          </span>
          <span className="text-2xl font-bold text-[#44634B] dark:text-[#ADCFB1]">
            {activeFormulation.formType === 'drops' && !activeFormulation.isWeightBased ? 'drops/mL' : 'mL'}
          </span>
          {activeFormulation.isWeightBased && (
            <span className="text-xs font-semibold text-[#424842] dark:text-[#9E9892] ml-1">
              ({calculatedMg} mg active ingredient)
            </span>
          )}
        </div>

        <p className="text-xs text-[#424842] dark:text-[#A8A29E] leading-relaxed">
          {activeFormulation.isWeightBased
            ? `Exact dose for ${weightKg} kg child using ${activeFormulation.brand} (${activeFormulation.concentrationDisplay}).`
            : activeFormulation.usageGuidance}
        </p>

        {/* Visual Syringe Guide Bar */}
        <div className="p-3.5 rounded-2xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E0E3DF] dark:border-[#2D382F] space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[#191C1A] dark:text-[#FAF8F5] flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-[#44634B] dark:text-[#ADCFB1]" />
              <span>Oral Dispenser Syringe Guide</span>
            </span>
            <span className="text-[#44634B] dark:text-[#ADCFB1]">
              Mark at {syringeDisplayMl} mL
            </span>
          </div>

          {/* Syringe barrel graphic */}
          <div className="relative w-full h-8 bg-white dark:bg-[#202822] rounded-xl overflow-hidden border border-[#E0E3DF] dark:border-[#2D382F] flex items-center px-2">
            {/* Fluid fill */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-[#C8EBCC] dark:bg-[#203D24] transition-all duration-300"
              style={{ width: `${syringePercent}%` }}
            />
            {/* Marker pin */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#44634B] dark:bg-[#ADCFB1] z-20 transition-all duration-300"
              style={{ left: `${syringePercent}%` }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#44634B] dark:bg-[#ADCFB1] -translate-x-1 -translate-y-1" />
            </div>
            {/* Hash ticks */}
            <div className="w-full flex justify-between text-[10px] font-bold text-stone-400 relative z-10 select-none">
              <span>0</span>
              <span>2.5</span>
              <span>5.0</span>
              <span>7.5</span>
              <span>10 mL</span>
            </div>
          </div>
        </div>

        {/* Administration Interval Pill */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F1F4F0] dark:bg-[#161C17] text-xs font-semibold text-[#424842] dark:text-[#9E9892]">
          <Clock className="w-4 h-4 text-[#44634B] dark:text-[#ADCFB1] shrink-0" />
          <span>
            Every <strong>{activeFormulation.minIntervalHours} hours</strong> as needed • Max{' '}
            <strong>{activeFormulation.maxDosesPerDay} times</strong> in 24 hours
          </span>
        </div>

        {/* Log Dose CTA Button (≥48px touch target) */}
        <button
          type="button"
          onClick={openLogModal}
          className="tap-feedback w-full min-h-[48px] rounded-full bg-[#44634B] hover:bg-[#344738] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>
            Log Dose Given Now ({activeFormulation.isWeightBased ? `${calculatedMl} mL` : `${activeFormulation.fixedDoseDisplay?.split(' ')[0] || '0.5 mL'}`})
          </span>
        </button>
      </div>

      {/* 5. Fever Danger Red-Flags Banner (Crucial Clinical Safety) */}
      <div className="rounded-[24px] bg-[#FFDBD0]/40 dark:bg-[#3D1E16]/40 p-4 sm:p-5 border border-[#FE9572]/50 dark:border-[#543830] space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#99462A] text-white flex items-center justify-center shrink-0 shadow-sm">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#762C12] dark:text-[#FFB59E]">
              Fever Danger Red-Flags • When to Seek Immediate Care
            </h3>
            <p className="text-[11px] text-[#99462A] dark:text-[#FFB59E]">
              Clinical safety thresholds for infants and toddlers
            </p>
          </div>
        </div>

        {/* Red flags checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-[#762C12] dark:text-[#FFB59E]">
          <div className="flex items-center gap-1.5 bg-white/60 dark:bg-black/20 p-2.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-[#99462A] shrink-0" />
            <span>Temperature &gt; 39.0°C (102.2°F)</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/60 dark:bg-black/20 p-2.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-[#99462A] shrink-0" />
            <span>Infant under 3 months with ANY fever</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/60 dark:bg-black/20 p-2.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-[#99462A] shrink-0" />
            <span>Fast or labored breathing / chest retractions</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/60 dark:bg-black/20 p-2.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-[#99462A] shrink-0" />
            <span>Extreme lethargy, refusal to drink, or dry diapers (&gt;8h)</span>
          </div>
        </div>

        {/* Emergency Call Action */}
        <div className="flex items-center gap-2.5 pt-1 flex-wrap">
          <a
            href={`tel:${profile.pediatricianPhone || '112'}`}
            className="tap-feedback min-h-[44px] px-4 py-2 rounded-full bg-[#99462A] hover:bg-[#7D3821] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4" />
            <span>Call Pediatrician: {profile.pediatricianName || 'On-Call Clinic'}</span>
          </a>

          <a
            href={`tel:${profile.emergencyHospital ? '112' : '112'}`}
            className="tap-feedback min-h-[44px] px-4 py-2 rounded-full bg-white dark:bg-[#1E2520] text-[#762C12] dark:text-[#FFB59E] border border-[#FE9572]/40 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <span>Emergency Hospital: {profile.emergencyHospital || 'Westside Children’s Hospital'}</span>
          </a>
        </div>
      </div>

      {/* 6. Temperature Tracker & Double-Dose Prevention Guard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Double-dose guard */}
        <div className="bg-white dark:bg-[#1E2520] rounded-[24px] p-4 sm:p-5 shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#44634B] dark:text-[#ADCFB1]" />
              <span className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5]">
                Dose Guard (Interval Safety)
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                secondsUntilNextDose > 0
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200'
                  : 'bg-[#C8EBCC] text-[#03210E] dark:bg-[#203D24] dark:text-[#ADCFB1]'
              }`}
            >
              {secondsUntilNextDose > 0 ? 'Wait Interval Active' : 'Window Open'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E0E3DF] dark:border-[#2D382F]">
            <span className="text-[11px] text-[#424842] dark:text-[#9E9892] block font-medium">
              Next Permissible {activeFormulation.brand}:
            </span>
            <div className="text-xl font-extrabold text-[#191C1A] dark:text-[#FAF8F5] mt-0.5">
              {secondsUntilNextDose > 0 ? `Safe to administer in ${waitDisplay}` : 'Safe to administer if fever recurs'}
            </div>
            <span className="text-[10px] text-stone-400 block mt-1">
              {lastDoseForActiveMed
                ? `Last given: ${new Date(lastDoseForActiveMed.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'No dose logged yet today'}
            </span>
          </div>
        </div>

        {/* Temperature reading */}
        <div className="bg-white dark:bg-[#1E2520] rounded-[24px] p-4 sm:p-5 shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-[#99462A]" />
              <span className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5]">
                Baby Temperature
              </span>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${tempStatus.color}`}>
              {tempStatus.label}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-3xl font-extrabold text-[#191C1A] dark:text-[#FAF8F5] tabular-nums">
                {currentTempC.toFixed(1)}°C
              </span>
              <span className="text-xs text-stone-400 block mt-0.5">
                ({((currentTempC * 9) / 5 + 32).toFixed(1)}°F) • {tempSite.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentTempC((t) => parseFloat(Math.max(35.5, t - 0.2).toFixed(1)))}
                className="tap-feedback w-10 h-10 rounded-xl bg-[#F1F4F0] dark:bg-[#161C17] flex items-center justify-center font-bold text-sm"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setCurrentTempC((t) => parseFloat(Math.min(41.0, t + 0.2).toFixed(1)))}
                className="tap-feedback w-10 h-10 rounded-xl bg-[#F1F4F0] dark:bg-[#161C17] flex items-center justify-center font-bold text-sm"
              >
                +
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {(['ear', 'armpit', 'forehead'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTempSite(s)}
                className={`tap-feedback min-h-[36px] py-1 text-center rounded-xl text-[11px] font-bold capitalize transition-all ${
                  tempSite === s
                    ? 'bg-[#44634B] text-white shadow-xs'
                    : 'bg-[#F1F4F0] dark:bg-[#161C17] text-[#424842] dark:text-[#9E9892]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 7. Medication History Section */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#44634B] dark:text-[#ADCFB1]" />
            <h3 className="text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5]">
              Recent Dose Logs
            </h3>
          </div>
          <button
            type="button"
            onClick={handleCopyHistory}
            className="tap-feedback flex items-center gap-1 text-xs font-bold text-[#44634B] dark:text-[#ADCFB1] hover:underline cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedHistory ? 'Copied Summary!' : 'Copy for Doctor'}</span>
          </button>
        </div>

        <div className="space-y-2">
          {medHistory.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1E2520] text-center text-xs text-[#424842] dark:text-[#9E9892] border border-[#E8E4DC] dark:border-[#2D382F]">
              No medication doses logged today.
            </div>
          ) : (
            medHistory.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="bg-white dark:bg-[#1E2520] p-3.5 rounded-2xl border border-[#E8E4DC] dark:border-[#2D382F] shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#C8EBCC]/60 dark:bg-[#203D24] text-[#44634B] dark:text-[#ADCFB1] flex items-center justify-center shrink-0">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5] block truncate">
                      {log.brandName || log.medicineName} • {log.dosageMl} mL
                    </span>
                    <span className="text-[11px] text-[#424842] dark:text-[#9E9892] block mt-0.5 truncate">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {log.temperatureC ? ` • ${log.temperatureC}°C` : ''}
                      {log.reason ? ` • ${log.reason}` : ''}
                      {log.administeredBy ? ` • by ${log.administeredBy}` : ''}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteLog(log.id)}
                  className="tap-feedback p-2 text-stone-300 hover:text-rose-500 transition-colors"
                  title="Delete log"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 8. Log Dose Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#1E2520] rounded-t-[28px] sm:rounded-[28px] border border-[#E8E4DC] dark:border-[#2D382F] p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
            <div className="w-10 h-1 bg-stone-300 dark:bg-stone-600 rounded-full mx-auto mb-1 sm:hidden" />

            <div className="flex items-center justify-between border-b border-[#E8E4DC] dark:border-[#2D382F] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-[#C8EBCC] dark:bg-[#203D24] text-[#44634B] dark:text-[#ADCFB1] flex items-center justify-center">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#191C1A] dark:text-[#FAF8F5]">
                    Log Medicine Given
                  </h3>
                  <p className="text-[11px] text-[#424842] dark:text-[#9E9892]">
                    {activeFormulation.brand}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDoseLog} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">
                    Volume Given (mL)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={customDoseMl}
                    onChange={(e) => setCustomDoseMl(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] font-black text-center text-base"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">
                    Baby Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={doseTemperatureC}
                    onChange={(e) => setDoseTemperatureC(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] font-black text-center text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">
                  Reason for Dose
                </label>
                <select
                  value={doseReason}
                  onChange={(e) => setDoseReason(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] font-semibold text-xs"
                >
                  {DOSE_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">
                  Administered By
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CAREGIVERS.map((cg) => (
                    <button
                      key={cg}
                      type="button"
                      onClick={() => setAdministeredBy(cg)}
                      className={`min-h-[44px] rounded-xl font-bold text-xs transition-all ${
                        administeredBy === cg
                          ? 'bg-[#44634B] text-white shadow-xs'
                          : 'bg-[#F1F4F0] dark:bg-[#161C17] text-[#191C1A] dark:text-[#FAF8F5] border border-[#E0E3DF] dark:border-[#2D382F]'
                      }`}
                    >
                      {cg}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">
                  Clinical Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Settled to sleep within 25 minutes"
                  value={doseNotes}
                  onChange={(e) => setDoseNotes(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="tap-feedback flex-1 min-h-[48px] rounded-full border border-stone-200 dark:border-stone-700 font-bold text-stone-600 dark:text-stone-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tap-feedback flex-1 min-h-[48px] rounded-full bg-[#44634B] hover:bg-[#344738] text-white font-bold shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Log</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
