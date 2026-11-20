'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { ChildProfile, GrowthRecord, MedicineDoseLog } from '@/lib/types';
import { INITIAL_MEDICINE_LOGS } from '@/lib/initialData';
import { syncSingleRecord, deleteSingleRecord } from '@/lib/syncService';
import confetti from 'canvas-confetti';
import { ActiveTab } from './BottomNav';

interface MedicineDoseCalculatorProps {
  profile: ChildProfile;
  latestGrowth?: GrowthRecord;
  userRole?: 'parent' | 'family';
  onNavigateTab?: (tab: ActiveTab) => void;
}

export type MedicineCategory = 'fever' | 'colic' | 'supplement' | 'cold' | 'digestive';

export interface MedicineFormulation {
  id: string;
  brand: string;
  generic: string;
  category: MedicineCategory;
  concentrationMgPerMl: number;
  concentrationDisplay: string;
  isWeightBased: boolean;
  isChildPrescription?: boolean;
  standardDoseMgPerKg?: number;
  fixedDoseDisplay?: string;
  minAgeMonths: number;
  minIntervalHours: number;
  maxDosesPerDay: number;
  formType: 'drops' | 'suspension' | 'sachet';
  usageGuidance: string;
  indication: string;
}

export const COMMON_MEDICATIONS: MedicineFormulation[] = [
  // --- ⭐ PRESCRIBED FOR HER: ACTIVE DAILY & SOS REGIMEN ---
  {
    id: 'kidrich_d3',
    brand: "Dr. Reddy's Kidrich D3 Drops",
    generic: 'Cholecalciferol (Vitamin D3 400 IU / 0.5 ml)',
    category: 'supplement',
    concentrationMgPerMl: 800,
    concentrationDisplay: '400 IU per 0.5 ml',
    isWeightBased: false,
    fixedDoseDisplay: '0.5 mL (400 IU) once daily',
    isChildPrescription: true,
    minAgeMonths: 0,
    minIntervalHours: 24,
    maxDosesPerDay: 1,
    formType: 'drops',
    usageGuidance: "Give exactly 0.5 ml once daily every morning using the marked dropper. Essential Dr. Reddy's Vitamin D3 for infant bone mineralization, teeth buds, and immune strength.",
    indication: "⭐ Baby's Daily Vitamin D3",
  },
  {
    id: 'bavon_drops',
    brand: 'Bavon Drops',
    generic: 'Multivitamins, B-Complex & L-Lysine Amino Acids',
    category: 'supplement',
    concentrationMgPerMl: 0,
    concentrationDisplay: 'Pediatric Multivitamin Drops',
    isWeightBased: false,
    fixedDoseDisplay: '0.5 mL once daily post-feed',
    isChildPrescription: true,
    minAgeMonths: 0,
    minIntervalHours: 24,
    maxDosesPerDay: 1,
    formType: 'drops',
    usageGuidance: 'Give 0.5 ml once daily after feeding. Supports cellular metabolism, weight gain, and infant nutritional appetite.',
    indication: "⭐ Baby's Daily Multivitamin",
  },
  {
    id: 'colimex_df',
    brand: 'Colimex DF Drops (Wallace)',
    generic: 'Simethicone (40 mg/ml) Dill Oil Free',
    category: 'colic',
    concentrationMgPerMl: 40,
    concentrationDisplay: 'Simethicone 40 mg / mL',
    isWeightBased: false,
    fixedDoseDisplay: '4 to 8 drops (0.2–0.4 mL) before feeds',
    isChildPrescription: true,
    minAgeMonths: 0,
    minIntervalHours: 6,
    maxDosesPerDay: 4,
    formType: 'drops',
    usageGuidance: 'Give 4–8 drops 15 minutes before breast/bottle feeds or SOS during acute gas crying spells. Relieves painful trapped gas bubbles gently.',
    indication: "⭐ Baby's Active Colic Relief",
  },

  // --- FEVER & PAIN (WEIGHT-BASED) ---
  {
    id: 'crocin_drops',
    brand: 'Crocin / Calpol Infant Drops',
    generic: 'Paracetamol (Acetaminophen)',
    category: 'fever',
    concentrationMgPerMl: 100,
    concentrationDisplay: '100 mg / 1 mL',
    isWeightBased: true,
    standardDoseMgPerKg: 15,
    minAgeMonths: 0,
    minIntervalHours: 4,
    maxDosesPerDay: 4,
    formType: 'drops',
    usageGuidance: 'Use calibrated 0.1ml dropper. For fever >38.0°C (100.4°F) or post-vaccine pain.',
    indication: 'Post-Vaccine Fever & Teething Pain',
  },
  {
    id: 'calpol_120',
    brand: 'Calpol / Crocin 120 Suspension',
    generic: 'Paracetamol (24 mg/ml)',
    category: 'fever',
    concentrationMgPerMl: 24,
    concentrationDisplay: '120 mg / 5 mL',
    isWeightBased: true,
    standardDoseMgPerKg: 15,
    minAgeMonths: 2,
    minIntervalHours: 4,
    maxDosesPerDay: 4,
    formType: 'suspension',
    usageGuidance: 'Shake bottle well. Measure with pediatric dosing syringe or spoon.',
    indication: 'Infant Fever & Body Aches',
  },
  {
    id: 'calpol_250_ds',
    brand: 'Calpol 250 / Crocin DS Syrup',
    generic: 'Paracetamol (50 mg/ml)',
    category: 'fever',
    concentrationMgPerMl: 50,
    concentrationDisplay: '250 mg / 5 mL (DS)',
    isWeightBased: true,
    standardDoseMgPerKg: 15,
    minAgeMonths: 6,
    minIntervalHours: 4,
    maxDosesPerDay: 4,
    formType: 'suspension',
    usageGuidance: 'Double strength formulation for older infants (>7 kg) to reduce liquid volume.',
    indication: 'Moderate to High Fever',
  },
  {
    id: 'ibugesic_plus',
    brand: 'Ibuprofen / Nurofen Syrup',
    generic: 'Ibuprofen (20 mg/ml)',
    category: 'fever',
    concentrationMgPerMl: 20,
    concentrationDisplay: '100 mg / 5 mL',
    isWeightBased: true,
    standardDoseMgPerKg: 10,
    minAgeMonths: 6,
    minIntervalHours: 6,
    maxDosesPerDay: 3,
    formType: 'suspension',
    usageGuidance: 'Strictly for infants 6 months and older. Give after milk/feed, never on empty stomach.',
    indication: 'High Fever & Inflammation',
  },

  // --- COLIC & DIGESTIVE COMFORT ---
  {
    id: 'colicaid_drops',
    brand: 'Colicaid Gripe Drops',
    generic: 'Simethicone 40mg + Dill Oil + Fennel',
    category: 'colic',
    concentrationMgPerMl: 40,
    concentrationDisplay: 'Simethicone 40 mg / mL',
    isWeightBased: false,
    fixedDoseDisplay: '4 to 8 drops (0.2–0.4 mL)',
    minAgeMonths: 0,
    minIntervalHours: 6,
    maxDosesPerDay: 4,
    formType: 'drops',
    usageGuidance: 'Give 15 minutes before breast/bottle feeds. Breaks down painful trapped gas bubbles.',
    indication: 'Infant Colic, Bloating & Crying Spells',
  },
  {
    id: 'enterogermina',
    brand: 'Enterogermina Probiotic Vials',
    generic: 'Bacillus clausii spores (2 Billion)',
    category: 'digestive',
    concentrationMgPerMl: 0,
    concentrationDisplay: '2 Billion Spores / 5 mL vial',
    isWeightBased: false,
    fixedDoseDisplay: '1 mini bottle (5 mL) daily',
    minAgeMonths: 1,
    minIntervalHours: 24,
    maxDosesPerDay: 1,
    formType: 'suspension',
    usageGuidance: 'Twist plastic cap, shake, and drink directly or mix with milk/water. Restores gut flora.',
    indication: 'Loose Stools & Antibiotic Recovery',
  },

  // --- COLD & NASAL CONGESTION ---
  {
    id: 'nasoclear_saline',
    brand: 'Nasoclear / Baby Saline Drops',
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
    usageGuidance: '100% medication-free! Instill 5 mins before breastfeeds or sleep to clear dried nasal mucus.',
    indication: 'Stuffy Nose, Cold & Congestion',
  },
];

const DOSE_REASONS = [
  'Post-Vaccine Fever',
  'Teething Pain & Fussiness',
  'Viral Fever (>38°C)',
  'Colic & Trapped Gas',
  'Daily Morning Supplement',
  'Stuffy Nose / Cold',
  'Loose Stools / Diarrhea',
  'Doctor Advised Dose',
];

const CAREGIVERS = ['Mom 👩', 'Dad 👨', 'Grandparent 👵', 'Doctor/Nurse 🩺'];

export const MedicineDoseCalculator: React.FC<MedicineDoseCalculatorProps> = ({
  profile,
  latestGrowth,
  userRole = 'parent',
  onNavigateTab,
}) => {
  // Baby's active weight in kg
  const defaultWeight = latestGrowth?.weightKg || profile.birthWeightKg || 8.45;
  const [weightKg, setWeightKg] = useState<number>(defaultWeight);
  const [isEditingWeight, setIsEditingWeight] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedFormulationId, setSelectedFormulationId] = useState<string>('calpol_120');

  // Temperature state
  const [currentTempC, setCurrentTempC] = useState<number>(38.2);
  const [tempSite, setTempSite] = useState<'ear' | 'armpit' | 'forehead'>('ear');

  // Log dose modal & form state
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [customDoseMl, setCustomDoseMl] = useState<number>(5.3);
  const [doseTemperatureC, setDoseTemperatureC] = useState<string>('38.2');
  const [doseReason, setDoseReason] = useState<string>('Viral Fever (>38°C)');
  const [administeredBy, setAdministeredBy] = useState<string>('Mom 👩');
  const [doseNotes, setDoseNotes] = useState<string>('');
  const [doseTime, setDoseTime] = useState<string>(() => new Date().toISOString().slice(0, 16));

  // Stored medication history list
  const [medHistory, setMedHistory] = useState<MedicineDoseLog[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`dayone_med_history_${profile.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_MEDICINE_LOGS;
  });

  const [copiedHistory, setCopiedHistory] = useState<boolean>(false);

  // Active selected formulation
  const activeFormulation = COMMON_MEDICATIONS.find((f) => f.id === selectedFormulationId) || COMMON_MEDICATIONS[0];

  // Exact dose calculation
  let calculatedMl = 0;
  let calculatedMg = 0;
  if (activeFormulation.isWeightBased && activeFormulation.standardDoseMgPerKg) {
    calculatedMg = Math.round(weightKg * activeFormulation.standardDoseMgPerKg);
    calculatedMl = parseFloat((calculatedMg / activeFormulation.concentrationMgPerMl).toFixed(1));
  }

  // Active Safety Interval Lock check
  const lastDoseForActiveMed = medHistory.find((m) => m.brandName === activeFormulation.brand);
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

  const openLogModal = () => {
    let initialMl = 0.5;
    if (activeFormulation.isWeightBased && calculatedMl > 0) {
      initialMl = calculatedMl;
    } else if (activeFormulation.id === 'colimex_df') {
      initialMl = 0.3;
    } else if (activeFormulation.id === 'kidrich_d3' || activeFormulation.id === 'bavon_drops') {
      initialMl = 0.5;
    } else {
      initialMl = 1.0;
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
      id: `med_${Date.now()}`,
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
    localStorage.setItem(`dayone_med_history_${profile.id}`, JSON.stringify(updated));
    setShowLogModal(false);
    setDoseNotes('');

    // Real-time Cloud Sync
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
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  };

  const handleDeleteLog = (id: string) => {
    const updated = medHistory.filter((m) => m.id !== id);
    setMedHistory(updated);
    localStorage.setItem(`dayone_med_history_${profile.id}`, JSON.stringify(updated));
    deleteSingleRecord('medicine_logs', id);
  };

  const handleCopyHistoryForDoctor = () => {
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
👶 *Patient:* ${profile.name} (Weight: ${weightKg} kg)

${lines.join('\n')}

_Generated via DayOne Dose Assistant_`;

    navigator.clipboard.writeText(summary);
    setCopiedHistory(true);
    setTimeout(() => setCopiedHistory(false), 2500);
  };

  // Temperature status calculation
  const getTempStatus = (temp: number) => {
    if (temp >= 39.0) return { label: 'High Fever', color: 'bg-error-container text-on-error-container', pulse: 'bg-error' };
    if (temp >= 37.8) return { label: 'Mild Fever', color: 'bg-tertiary-fixed text-on-tertiary-fixed', pulse: 'bg-tertiary' };
    return { label: 'Normal Temp', color: 'bg-primary-fixed text-on-primary-fixed-variant', pulse: 'bg-primary' };
  };

  const tempStatus = getTempStatus(currentTempC);

  // Thermal bar position (36.0 to 40.0 range)
  const tempPercent = Math.min(100, Math.max(0, ((currentTempC - 36.0) / (40.0 - 36.0)) * 100));

  // Syringe fill calculation (up to 10ml)
  const syringeMl = activeFormulation.isWeightBased ? calculatedMl : (activeFormulation.id === 'colimex_df' ? 0.3 : 0.5);
  const syringePercent = Math.min(100, Math.max(5, (syringeMl / 10) * 100));

  // Wait time string
  const waitMinutes = Math.floor(secondsUntilNextDose / 60);
  const waitHours = Math.floor(waitMinutes / 60);
  const remMinutes = waitMinutes % 60;
  const waitDisplay = `${waitHours.toString().padStart(2, '0')}:${remMinutes.toString().padStart(2, '0')}`;

  const filteredMeds = COMMON_MEDICATIONS.filter((m) => {
    if (activeCategory === 'fever') return m.category === 'fever';
    if (activeCategory === 'supplements') return m.category === 'supplement';
    if (activeCategory === 'colic') return m.category === 'colic';
    return true;
  });

  return (
    <div className="flex flex-col w-full pb-8 space-y-6">
      {/* Quick Navigation to Doctor Visit Vault */}
      {onNavigateTab && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary">local_hospital</span>
            <span className="text-on-surface font-medium">
              Need to check prescriptions or notes from the pediatrician?
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('doctor')}
            className="px-3 py-1.5 rounded-full bg-secondary text-on-secondary font-semibold text-[11px] shrink-0 active:scale-95 transition-all shadow-xs"
          >
            Clinic &amp; Rx →
          </button>
        </div>
      )}

      {/* Safety Disclaimer & Child Context Banner */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-primary tracking-wide uppercase font-bold">
              Weight-Based Care
            </span>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">
              {profile.name}&apos;s Dose Assistant
            </h2>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm shadow-xs font-semibold">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span>Pediatric Dosing</span>
          </div>
        </div>

        {/* Warning Pill Badge */}
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-tertiary-fixed/30 text-on-tertiary-fixed-variant border border-tertiary-fixed/40">
          <div className="w-7 h-7 rounded-full bg-tertiary-fixed-dim/50 flex items-center justify-center shrink-0 text-tertiary">
            <span className="material-symbols-outlined text-[18px]">warning</span>
          </div>
          <p className="font-body-sm text-body-sm flex-1 leading-snug">
            Always double-check formulation with the bottle label &amp; consult your pediatrician before administering.
          </p>
        </div>

        {/* Child Weight Chip & Override Row */}
        <div className="flex items-center justify-between bg-surface-container-lowest p-3.5 rounded-2xl shadow-sm border border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold">
              <span className="material-symbols-outlined text-[20px]">scale</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                {isEditingWeight ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.05"
                      value={weightKg}
                      onChange={(e) => setWeightKg(parseFloat(e.target.value) || 4.5)}
                      className="w-20 px-2 py-0.5 rounded-lg border border-primary text-sm font-bold bg-surface-container-low"
                    />
                    <span className="text-sm font-bold">kg</span>
                    <button
                      type="button"
                      onClick={() => setIsEditingWeight(false)}
                      className="ml-1 text-xs px-2 py-0.5 rounded-full bg-primary text-white font-semibold"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="font-headline-md text-headline-md text-on-surface font-bold">
                      {weightKg} kg
                    </span>
                    <span className="font-label-sm text-label-sm text-outline">• Active weight</span>
                  </>
                )}
              </div>
              <span className="font-label-sm text-label-sm text-outline">
                {latestGrowth ? `Recorded from ${latestGrowth.date} checkup` : 'Standard default calculation'}
              </span>
            </div>
          </div>
          {!isEditingWeight && (
            <button
              onClick={() => setIsEditingWeight(true)}
              className="px-3.5 py-1.5 rounded-full bg-surface-container text-primary font-label-md text-label-md active:scale-95 transition-all flex items-center gap-1 hover:bg-surface-container-high"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">edit</span>
              <span>Override</span>
            </button>
          )}
        </div>
      </section>

      {/* Medication Formulation Selector (Horizontal Scroll) */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-label-md text-label-md text-outline uppercase tracking-wider font-semibold">
            Select Formulation
          </span>
          <span className="font-label-sm text-label-sm text-primary font-semibold">
            {activeFormulation.isWeightBased ? `${activeFormulation.standardDoseMgPerKg} mg/kg calculator active` : 'Fixed pediatric protocol'}
          </span>
        </div>

        {/* Formulation pills */}
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
          {filteredMeds.map((form) => {
            const isSelected = selectedFormulationId === form.id;
            return (
              <button
                key={form.id}
                onClick={() => setSelectedFormulationId(form.id)}
                className={`shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-xs active:scale-95 transition-all text-left ${
                  isSelected
                    ? 'bg-primary text-on-primary font-semibold ring-2 ring-primary/20'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container border border-outline-variant/30'
                }`}
                type="button"
              >
                <span className={`material-symbols-outlined text-[18px] ${isSelected ? 'text-on-primary' : 'text-primary'}`}>
                  {form.category === 'fever' ? 'water_drop' : form.category === 'supplement' ? 'wb_sunny' : 'medication_liquid'}
                </span>
                <div className="flex flex-col text-left">
                  <span className="font-label-md text-label-md leading-tight truncate max-w-[170px]">
                    {form.brand}
                  </span>
                  <span className={`font-label-sm text-label-sm ${isSelected ? 'text-on-primary/80' : 'text-outline'}`}>
                    {form.concentrationDisplay}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Calculated Dosage Hero Card */}
      <section className="flex flex-col gap-2">
        <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm relative overflow-hidden border border-outline-variant/30">
          {/* Atmospheric Sage Glow */}
          <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-primary-fixed/30 blur-2xl pointer-events-none"></div>

          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
              <span className="font-label-md text-label-md text-primary font-semibold">
                Recommended Single Dose
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">
              {activeFormulation.isWeightBased ? `Standard ${activeFormulation.standardDoseMgPerKg} mg/kg` : 'Fixed Routine Protocol'}
            </span>
          </div>

          {/* Core Figure Highlight */}
          <div className="flex items-baseline gap-2 mb-1.5 relative z-10">
            <span className="font-headline-xl text-headline-xl text-primary font-bold tracking-tight">
              {activeFormulation.isWeightBased ? calculatedMl : activeFormulation.fixedDoseDisplay?.split(' ')[0] || '0.5'}
            </span>
            <span className="font-headline-md text-headline-md text-primary font-semibold">
              {activeFormulation.formType === 'drops' && !activeFormulation.isWeightBased ? 'drops / mL' : 'mL'}
            </span>
            {activeFormulation.isWeightBased && (
              <span className="font-label-md text-label-md text-outline ml-1">
                ({calculatedMg} mg active ingredient)
              </span>
            )}
          </div>

          <p className="font-body-sm text-body-sm text-on-surface-variant mb-4 relative z-10 leading-relaxed">
            {activeFormulation.isWeightBased
              ? `Calculated specifically for ${weightKg} kg child using ${activeFormulation.brand} (${activeFormulation.concentrationDisplay}).`
              : activeFormulation.usageGuidance}
          </p>

          {/* Visual Syringe Guide Bar */}
          <div className="p-3.5 bg-surface-container-low rounded-2xl mb-4 relative z-10 border border-outline-variant/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-on-surface font-label-sm text-label-sm font-medium">
                <span className="material-symbols-outlined text-[16px] text-primary">colorize</span>
                <span>Oral Dispenser Syringe Guide</span>
              </div>
              <span className="font-label-sm text-label-sm text-primary font-semibold">
                Mark at {syringeMl} mL
              </span>
            </div>

            {/* Syringe Barrel Graphic */}
            <div className="relative w-full h-8 bg-surface-container-lowest rounded-xl flex items-center px-2 overflow-hidden border border-outline-variant/40">
              {/* Fluid fill level */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-primary-fixed-dim/60 transition-all duration-700"
                style={{ width: `${syringePercent}%` }}
              ></div>
              {/* Target indicator line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 transition-all duration-700"
                style={{ left: `${syringePercent}%` }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-primary -translate-x-[4px] -translate-y-1"></div>
              </div>
              {/* Syringe hash marks */}
              <div className="w-full flex justify-between text-outline text-[10px] font-label-sm relative z-10 select-none">
                <span>0</span>
                <span className="opacity-40">|</span>
                <span>2.5</span>
                <span className="opacity-40">|</span>
                <span className="text-primary font-bold">5.0</span>
                <span className="opacity-40">|</span>
                <span>7.5</span>
                <span className="opacity-40">|</span>
                <span>10 mL</span>
              </div>
            </div>
          </div>

          {/* Administration Protocol Tag */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container text-on-surface-variant font-body-sm text-body-sm relative z-10">
            <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
            <span>
              Every <strong>{activeFormulation.minIntervalHours} hours</strong> as needed • Max <strong>{activeFormulation.maxDosesPerDay} times</strong> in 24h
            </span>
          </div>
        </div>
      </section>

      {/* Safety Timer Card (Double-Dose Prevention) */}
      <section className="flex flex-col gap-2">
        <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm border border-outline-variant/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[18px]">lock_clock</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-md text-headline-md text-on-surface font-semibold">
                  Dose Guard
                </span>
                <span className="font-label-sm text-label-sm text-outline">
                  Prevents accidental double-dosing
                </span>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm font-semibold ${
                secondsUntilNextDose > 0
                  ? 'bg-secondary-fixed text-on-secondary-fixed'
                  : 'bg-primary-fixed text-on-primary-fixed-variant'
              }`}
            >
              {secondsUntilNextDose > 0 ? 'Wait Interval Active' : 'Safe Window Open'}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-3 items-center mb-5">
            {/* Circular Progress Ring */}
            <div className="col-span-2 flex flex-col items-center justify-center relative">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-surface-container-high"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                ></path>
                <path
                  className={secondsUntilNextDose > 0 ? 'text-secondary' : 'text-primary'}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={`${secondsUntilNextDose > 0 ? Math.min(100, Math.round((secondsUntilNextDose / (activeFormulation.minIntervalHours * 3600)) * 100)) : 100}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                ></path>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {secondsUntilNextDose > 0 ? (
                  <>
                    <span className="font-label-sm text-label-sm text-outline text-[10px]">Wait</span>
                    <span className="font-headline-md text-headline-md text-on-surface font-bold leading-none">
                      {waitDisplay}
                    </span>
                    <span className="font-label-sm text-label-sm text-outline text-[10px]">remains</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-primary text-[24px]">done_all</span>
                    <span className="font-label-sm text-label-sm text-primary font-bold">Ready</span>
                  </>
                )}
              </div>
            </div>

            {/* Dose Timing Metadata */}
            <div className="col-span-3 flex flex-col gap-2">
              <div className="flex flex-col bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/20">
                <span className="font-label-sm text-label-sm text-outline">Last Administered</span>
                <span className="font-label-md text-label-md text-on-surface font-semibold">
                  {lastDoseForActiveMed
                    ? new Date(lastDoseForActiveMed.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'No dose logged today'}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                  {lastDoseForActiveMed
                    ? `${lastDoseForActiveMed.dosageMl} mL • ${lastDoseForActiveMed.administeredBy || 'Caregiver'}`
                    : 'Ready for initial dose'}
                </span>
              </div>
              <div className="flex flex-col bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/20">
                <span className="font-label-sm text-label-sm text-outline">Next Permissible Window</span>
                <span className="font-label-md text-label-md text-primary font-semibold">
                  {secondsUntilNextDose > 0
                    ? `Safe in ${waitDisplay}`
                    : 'Permissible Now (SOS/Fever)'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Button to Log Dose Now */}
          <button
            onClick={openLogModal}
            className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm font-semibold hover:bg-primary-container"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>
              Log Dose Given Now ({activeFormulation.isWeightBased ? `${calculatedMl} mL` : activeFormulation.fixedDoseDisplay?.split(' ')[0] || '0.5 mL'})
            </span>
          </button>
        </div>
      </section>

      {/* Fever & Temperature Log Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">device_thermostat</span>
            <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Fever &amp; Temperature Log
            </h3>
          </div>
          <button
            onClick={() => {
              const newTemp = parseFloat((currentTempC + 0.2).toFixed(1));
              setCurrentTempC(newTemp > 40.5 ? 36.5 : newTemp);
            }}
            className="font-label-md text-label-md text-primary font-semibold flex items-center gap-1 hover:underline"
            type="button"
          >
            <span>Adjust Temp</span>
            <span className="material-symbols-outlined text-[16px]">tune</span>
          </button>
        </div>

        {/* Current Temperature Gauge Card */}
        <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm border border-outline-variant/30">
          <div className="flex items-start justify-between mb-3">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-outline">
                Current Reading • {tempSite.toUpperCase()} Sensor
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-headline-xl text-headline-xl text-on-surface font-bold">
                  {currentTempC.toFixed(1)}°
                </span>
                <span className="font-headline-md text-headline-md text-on-surface">C</span>
                <span className="font-body-sm text-body-sm text-outline ml-1">
                  ({((currentTempC * 9) / 5 + 32).toFixed(1)}°F)
                </span>
              </div>
            </div>

            {/* Status Indicator Pill */}
            <span
              className={`px-3 py-1 rounded-full font-label-md text-label-md font-semibold flex items-center gap-1.5 shadow-xs ${tempStatus.color}`}
            >
              <span className={`w-2 h-2 rounded-full ${tempStatus.pulse} animate-pulse`}></span>
              <span>{tempStatus.label}</span>
            </span>
          </div>

          {/* Thermal Gradient Visualizer Bar */}
          <div className="flex flex-col gap-1.5 mb-4">
            <div className="relative w-full h-3 rounded-full bg-gradient-to-r from-primary-fixed via-tertiary-fixed to-secondary-container">
              {/* Marker pin */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-surface-container-lowest shadow-md flex items-center justify-center transition-all duration-300"
                style={{ left: `${tempPercent}%` }}
              >
                <div className="w-2 h-2 rounded-full bg-secondary"></div>
              </div>
            </div>
            <div className="flex justify-between font-label-sm text-label-sm text-outline px-0.5">
              <span>Normal 36.5°</span>
              <span>Mild 37.8°</span>
              <span>High 39.0°+</span>
            </div>
          </div>

          {/* Quick-Log Site Selectors */}
          <div className="flex flex-col gap-2 pt-2">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">
              Recording Sensor Site
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ear', label: 'Ear', icon: 'hearing' },
                { id: 'armpit', label: 'Armpit', icon: 'front_hand' },
                { id: 'forehead', label: 'Forehead', icon: 'face' },
              ].map((site) => (
                <button
                  key={site.id}
                  onClick={() => setTempSite(site.id as any)}
                  className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl active:scale-95 transition-all ${
                    tempSite === site.id
                      ? 'bg-surface-container text-on-surface ring-1 ring-primary font-bold shadow-xs'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px] text-primary">{site.icon}</span>
                  <span className="font-label-sm text-label-sm">{site.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pediatric Alert Box (Clinical Protocol) */}
        <div className="p-4 rounded-3xl bg-secondary-fixed/40 text-on-secondary-fixed flex flex-col gap-2.5 shadow-xs border border-secondary-fixed/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">medical_services</span>
            <span className="font-label-lg text-label-lg text-secondary font-bold">
              When to Seek Immediate Care
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant leading-relaxed">
            Notify your doctor immediately if {profile.name}’s temperature exceeds <strong>39.0°C (102.2°F)</strong>, breathing is labored, soft spot is bulging, or baby refuses all liquids.
          </p>
          <a
            className="self-start flex items-center gap-1.5 font-label-md text-label-md text-secondary font-bold underline decoration-secondary/40 hover:text-secondary-container"
            href={`tel:${profile.pediatricianPhone || '112'}`}
          >
            <span>Call Pediatric Triage / On-Call Doctor</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </a>
        </div>
      </section>

      {/* Today's Dose History Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">history</span>
            <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Today&apos;s Dose History
            </h3>
          </div>
          <button
            onClick={handleCopyHistoryForDoctor}
            className="font-label-sm text-label-sm text-primary font-bold flex items-center gap-1 hover:underline"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px]">
              {copiedHistory ? 'check' : 'content_copy'}
            </span>
            <span>{copiedHistory ? 'Copied summary!' : 'Copy for Doctor'}</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {medHistory.length === 0 ? (
            <div className="p-6 rounded-2xl bg-surface-container-lowest text-center text-on-surface-variant font-body-sm text-body-sm border border-outline-variant/30">
              No medications logged yet today.
            </div>
          ) : (
            medHistory.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    💧
                  </div>
                  <div>
                    <div className="font-label-md text-label-md text-on-surface font-bold">
                      {log.brandName || log.medicineName} • {log.dosageMl} mL
                    </div>
                    <div className="font-label-sm text-label-sm text-outline flex items-center gap-2 mt-0.5">
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span>{log.reason || 'Dose given'}</span>
                      {log.administeredBy && (
                        <>
                          <span>•</span>
                          <span>by {log.administeredBy}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteLog(log.id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-error hover:bg-error-container/30 transition-colors"
                  type="button"
                  aria-label="Delete dose record"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Log Dose Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/40 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">medication</span>
                <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                  Log Dose Given
                </h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveDoseLog} className="space-y-4">
              <div>
                <label className="font-label-sm text-label-sm text-outline block mb-1">Medication</label>
                <div className="p-2.5 rounded-xl bg-surface-container font-label-md text-label-md text-on-surface font-semibold">
                  {activeFormulation.brand}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label-sm text-label-sm text-outline block mb-1">Volume Given (mL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customDoseMl}
                    onChange={(e) => setCustomDoseMl(parseFloat(e.target.value) || 0)}
                    className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface font-headline-md font-bold text-center border border-outline-variant/30"
                    required
                  />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-outline block mb-1">Baby Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={doseTemperatureC}
                    onChange={(e) => setDoseTemperatureC(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface font-headline-md font-bold text-center border border-outline-variant/30"
                  />
                </div>
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-outline block mb-1">Reason for Dose</label>
                <select
                  value={doseReason}
                  onChange={(e) => setDoseReason(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface font-body-sm border border-outline-variant/30"
                >
                  {DOSE_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-outline block mb-1">Administered By</label>
                <div className="grid grid-cols-2 gap-2">
                  {CAREGIVERS.map((cg) => (
                    <button
                      key={cg}
                      type="button"
                      onClick={() => setAdministeredBy(cg)}
                      className={`py-2 px-3 rounded-xl font-label-sm text-label-sm font-semibold transition-all ${
                        administeredBy === cg
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      {cg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="flex-1 h-12 rounded-full bg-surface-container text-on-surface font-label-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 rounded-full bg-primary text-on-primary font-label-lg font-bold shadow-md hover:bg-primary-container"
                >
                  Confirm &amp; Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
