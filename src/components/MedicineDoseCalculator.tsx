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
    concentrationDisplay: '400 IU per 0.5 ml (Dr. Reddy’s)',
    isWeightBased: false,
    fixedDoseDisplay: '0.5 ml (400 IU) once daily every morning',
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
    concentrationDisplay: 'Pediatric Multivitamin & Amino Acid Drops',
    isWeightBased: false,
    fixedDoseDisplay: '0.5 ml once daily after morning feed',
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
    concentrationDisplay: 'Simethicone 40 mg / ml (Dill Free Formula)',
    isWeightBased: false,
    fixedDoseDisplay: '4 to 8 drops (approx 0.2–0.4 ml) before feeds',
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
    concentrationMgPerMl: 100, // 100mg in 1ml
    concentrationDisplay: '100 mg / 1 ml (with calibrated dropper)',
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
    concentrationMgPerMl: 24, // 120mg in 5ml = 24mg/ml
    concentrationDisplay: '120 mg / 5 ml (Pediatric Suspension)',
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
    concentrationMgPerMl: 50, // 250mg in 5ml = 50mg/ml
    concentrationDisplay: '250 mg / 5 ml (Double Strength DS)',
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
    brand: 'Ibugesic / Combiflam Syrup',
    generic: 'Ibuprofen (20 mg/ml)',
    category: 'fever',
    concentrationMgPerMl: 20, // 100mg in 5ml = 20mg/ml
    concentrationDisplay: '100 mg / 5 ml (6+ Months Only)',
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
    brand: 'Colicaid / Woodwards Gripe Drops',
    generic: 'Simethicone 40mg + Dill Oil + Fennel',
    category: 'colic',
    concentrationMgPerMl: 40,
    concentrationDisplay: 'Simethicone 40 mg / ml carminative drops',
    isWeightBased: false,
    fixedDoseDisplay: '4 to 8 drops (approx 0.2–0.4 ml)',
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
    concentrationDisplay: '2 Billion Spores / 5 ml mini bottle',
    isWeightBased: false,
    fixedDoseDisplay: '1 mini bottle (5 ml) once daily',
    minAgeMonths: 1,
    minIntervalHours: 24,
    maxDosesPerDay: 1,
    formType: 'suspension',
    usageGuidance: 'Twist plastic cap, shake, and drink directly or mix with milk/water. Restores gut flora.',
    indication: 'Loose Stools, Antibiotic Recovery & Diarrhea',
  },

  // --- DAILY SUPPLEMENTS ---
  {
    id: 'vit_d3_drops',
    brand: 'Ultra-D3 / D-360 Infant Drops',
    generic: 'Cholecalciferol (Vitamin D3 400 IU/ml)',
    category: 'supplement',
    concentrationMgPerMl: 400,
    concentrationDisplay: '400 IU / 1 ml (Standard Indian Protocol)',
    isWeightBased: false,
    fixedDoseDisplay: '1.0 ml (400 IU) once daily every morning',
    minAgeMonths: 0,
    minIntervalHours: 24,
    maxDosesPerDay: 1,
    formType: 'drops',
    usageGuidance: 'Mandatory daily supplement from birth to 12 months for bone, teeth & immune development.',
    indication: 'Daily Bone & Immune Health (Mandatory)',
  },
  {
    id: 'zincovit_drops',
    brand: 'Zinconia / Zincovit Pediatric Drops',
    generic: 'Zinc Gluconate (10 mg/ml)',
    category: 'supplement',
    concentrationMgPerMl: 10,
    concentrationDisplay: '10 mg / 1 ml elemental zinc',
    isWeightBased: false,
    fixedDoseDisplay: '1.0 ml (10 mg) daily for 14 days during diarrhea',
    minAgeMonths: 1,
    minIntervalHours: 24,
    maxDosesPerDay: 1,
    formType: 'drops',
    usageGuidance: 'Reduces diarrhea duration and builds gut epithelial lining (WHO standard protocol).',
    indication: 'Gut Repair & Diarrhea Recovery',
  },

  // --- COLD & NASAL CONGESTION ---
  {
    id: 'nasoclear_saline',
    brand: 'Nasoclear / Otrivin Baby Saline Drops',
    generic: '0.9% Purified Sodium Chloride (Normal Saline)',
    category: 'cold',
    concentrationMgPerMl: 9,
    concentrationDisplay: '0.9% w/v Isotonic Purified Saline',
    isWeightBased: false,
    fixedDoseDisplay: '1 to 2 drops in each nostril before feeds',
    minAgeMonths: 0,
    minIntervalHours: 3,
    maxDosesPerDay: 6,
    formType: 'drops',
    usageGuidance: '100% medication-free! Instill 5 mins before breastfeeds or sleep to clear dried nasal mucus.',
    indication: 'Stuffy Nose, Cold & Congestion',
  },

  // --- ORS FOR DEHYDRATION ---
  {
    id: 'ors_electral',
    brand: 'Electral / Prolyte WHO ORS',
    generic: 'Low Osmolarity Oral Rehydration Salts',
    category: 'digestive',
    concentrationMgPerMl: 0,
    concentrationDisplay: 'Dissolve 1 sachet in 1 Litre boiled cooled water',
    isWeightBased: true,
    standardDoseMgPerKg: 10, // ~10ml/kg per episode
    minAgeMonths: 0,
    minIntervalHours: 2,
    maxDosesPerDay: 10,
    formType: 'sachet',
    usageGuidance: 'Offer in small sips (50–100 ml) using a spoon or syringe after every loose watery stool.',
    indication: 'Dehydration Prevention & Loose Stools',
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
  const defaultWeight = latestGrowth?.weightKg || profile.birthWeightKg || 4.5;
  const [weightKg, setWeightKg] = useState<number>(defaultWeight);
  const [activeCategory, setActiveCategory] = useState<string>('baby_regimen');
  const [selectedFormulationId, setSelectedFormulationId] = useState<string>('kidrich_d3');

  // Log dose modal & form state
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [customDoseMl, setCustomDoseMl] = useState<number>(0.5);
  const [doseTemperatureC, setDoseTemperatureC] = useState<string>('38.2');
  const [doseReason, setDoseReason] = useState<string>('Daily Morning Supplement');
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
    if (activeFormulation.id === 'ors_electral') {
      calculatedMl = Math.round(weightKg * 10); // 10ml per kg
      calculatedMg = 0;
    } else {
      calculatedMg = Math.round(weightKg * activeFormulation.standardDoseMgPerKg);
      calculatedMl = parseFloat((calculatedMg / activeFormulation.concentrationMgPerMl).toFixed(2));
    }
  }

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

    // Contextual reason default
    if (activeFormulation.id === 'kidrich_d3' || activeFormulation.id === 'bavon_drops') {
      setDoseReason('Daily Morning Supplement');
    } else if (activeFormulation.id === 'colimex_df') {
      setDoseReason('Colic & Trapped Gas');
    } else if (activeFormulation.category === 'fever') {
      setDoseReason('Post-Vaccine Fever');
    } else if (activeFormulation.category === 'cold') {
      setDoseReason('Stuffy Nose / Cold');
    } else {
      setDoseReason('Doctor Advised Dose');
    }

    setDoseTime(new Date().toISOString().slice(0, 16));
    setShowLogModal(true);
  };

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

  // Calculate 24-hour doses count for active formulation
  const now = Date.now();
  const past24hMs = now - 24 * 60 * 60 * 1000;
  const dosesLast24h = medHistory.filter(
    (m) => m.brandName === activeFormulation.brand && new Date(m.timestamp).getTime() >= past24hMs
  ).length;

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

  // 1-Click Copy Medication Summary for Pediatrician
  const handleCopyHistoryForDoctor = () => {
    if (medHistory.length === 0) return;

    const lines = medHistory.slice(0, 6).map((m) => {
      const dt = new Date(m.timestamp);
      const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = dt.toLocaleDateString([], { month: 'short', day: 'numeric' });
      let text = `• ${dateStr} ${timeStr}: ${m.brandName || m.medicineName} (${m.dosageMl} ml)`;
      if (m.temperatureC) text += ` - Temp: ${m.temperatureC}°C (${((m.temperatureC * 9) / 5 + 32).toFixed(1)}°F)`;
      if (m.reason) text += ` [${m.reason}]`;
      if (m.administeredBy) text += ` (by ${m.administeredBy})`;
      return text;
    });

    const summary = `📋 *Medication History for Dr. ${profile.pediatricianName || 'Pediatrician'}*
👶 *Patient:* ${profile.name} (Weight: ${weightKg} kg)

${lines.join('\n')}

_Generated via DayOne Baby Care Vault_`;

    navigator.clipboard.writeText(summary);
    setCopiedHistory(true);
    setTimeout(() => setCopiedHistory(false), 2500);
  };

  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h}h ${m}m ${s}s`;
  };

  // Filter formulation list
  const filteredFormulations = COMMON_MEDICATIONS.filter((f) => {
    if (activeCategory === 'baby_regimen') return f.isChildPrescription === true;
    if (activeCategory === 'all') return true;
    return f.category === activeCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Quick Navigation to Doctor Visit Vault */}
      {onNavigateTab && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF7F2] dark:bg-[#261E1C] border border-[#FCDCCB] dark:border-[#523A34] text-xs">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-[#E2765A] shrink-0" />
            <span className="text-[#8A3510] dark:text-[#F8BCA0] font-medium">
              Need to check prescriptions or notes from the pediatrician?
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('doctor')}
            className="px-3 py-1.5 rounded-xl bg-[#E2765A] hover:bg-[#CB6145] text-white font-semibold text-[11px] shrink-0 active:scale-[0.97] transition-all"
          >
            Clinic & Rx →
          </button>
        </div>
      )}
      
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-purple-500/10 border border-[#EAE6DF] dark:border-[#2D2B33] flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-xl bg-rose-600 text-white">
              <Calculator className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#201E1D] dark:text-[#FAF8F5]">
              Pediatric Weight-Based Fever & Medication Calculator
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#75706B] dark:text-[#9E9892] max-w-xl">
            Calculates precise dosages for common Indian infant medications based on weight. Includes 24-hour limits, safety intervals, and dose history tracking.
          </p>
        </div>

        {/* Current Baby Weight Pill */}
        <div className="bg-white dark:bg-[#1D1C22] p-4 rounded-2xl border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center font-bold text-lg">
            ⚖️
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider">
              Calculation Weight
            </div>
            <div className="text-sm font-bold text-[#201E1D] dark:text-[#FAF8F5]">
              {weightKg} kg
            </div>
            <div className="text-[10px] text-[#75706B] dark:text-[#9E9892]">
              {latestGrowth ? `From ${latestGrowth.date} visit` : 'Birth weight default'}
            </div>
          </div>
        </div>
      </div>

      {/* Baby's Active Prescribed Regimen Quick Action Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-amber-500 text-white text-xs">⭐</span>
            <h3 className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-100">
              Baby's Active Prescribed Regimen
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
            Dr. Reddy's Kidrich D3 • Bavon • Colimex DF
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {COMMON_MEDICATIONS.filter((m) => m.isChildPrescription).map((item) => {
            const isCurrent = selectedFormulationId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedFormulationId(item.id);
                  setActiveCategory('baby_regimen');
                }}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isCurrent
                    ? 'bg-white dark:bg-[#1E1C24] border-amber-500 shadow-xs ring-2 ring-amber-500/20'
                    : 'bg-white/80 dark:bg-[#18161D]/80 border-amber-200/60 dark:border-amber-900/40 hover:border-amber-400'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-[#201E1D] dark:text-[#FAF8F5] truncate">
                    {item.brand}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 shrink-0">
                    {item.category === 'colic' ? 'SOS' : 'Daily'}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 mt-1">
                  {item.fixedDoseDisplay}
                </div>
                <div className="text-[10px] text-[#75706B] dark:text-[#9E9892] mt-0.5 truncate">
                  {item.indication}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'baby_regimen', label: "⭐ Baby's Regimen (Kidrich, Bavon, Colimex DF)" },
          { id: 'all', label: 'All Medications' },
          { id: 'fever', label: '🌡️ Fever & Pain (Weight-Based)' },
          { id: 'colic', label: '🍼 Colic & Trapped Gas' },
          { id: 'supplement', label: '☀️ Daily Supplements' },
          { id: 'cold', label: '💧 Cold & Saline Drops' },
          { id: 'digestive', label: '🥤 ORS & Probiotics' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? cat.id === 'baby_regimen'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#75706B] dark:text-[#9E9892] hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Prescribed Regimen Context Hint */}
      {activeCategory === 'baby_regimen' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300/40 dark:border-amber-700/40 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-950 dark:text-amber-100 space-y-1">
            <div className="font-bold">Prescription Routine for {profile.name}</div>
            <p className="text-[11px] text-[#75706B] dark:text-[#9E9892] leading-relaxed">
              • <strong>☀️ Morning:</strong> Give <strong>Dr. Reddy's Kidrich D3</strong> (0.5 ml / 400 IU) and <strong>Bavon Drops</strong> (0.5 ml) post-feed for bone density, multivitamin, & appetite support.<br />
              • <strong>🍼 SOS / As Needed:</strong> Give <strong>Colimex DF Drops</strong> (4 to 8 drops / ~0.2–0.4 ml) 15 mins before feed or during painful colic crying to gently break trapped gas.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Calculator on Left, Safety Intervals & Guide on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: Live Dose Calculator (6 Cols) */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-sm space-y-5">
          
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#201E1D] dark:text-[#FAF8F5] flex items-center gap-2">
              <Pill className="w-4 h-4 text-rose-600" />
              <span>Select Medication Formulation</span>
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
              {activeFormulation.isWeightBased ? 'Weight-Based Dose' : 'Standard Pediatric Dose'}
            </span>
          </div>

          {/* Medicine Formulation Selector */}
          <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar pr-1">
            {filteredFormulations.map((form) => {
              const isSelected = selectedFormulationId === form.id;
              return (
                <button
                  key={form.id}
                  onClick={() => setSelectedFormulationId(form.id)}
                  className={`w-full p-3 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? form.isChildPrescription
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-500 shadow-xs ring-1 ring-amber-500/20'
                        : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-500 shadow-xs ring-1 ring-rose-500/20'
                      : form.isChildPrescription
                        ? 'bg-amber-50/20 dark:bg-amber-950/10 border-amber-200/70 dark:border-amber-900/40 hover:border-amber-400'
                        : 'bg-[#FAF8F5] dark:bg-[#141317] border-[#EAE6DF] dark:border-[#2D2B33] hover:border-[#D0C9BE]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#201E1D] dark:text-[#FAF8F5] flex items-center gap-1.5 flex-wrap">
                      <span>{form.brand}</span>
                      {form.isChildPrescription ? (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-700/50">
                          ⭐ Prescribed for Baby
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/5 dark:bg-white/10 text-[#75706B] dark:text-[#9E9892] font-normal">
                          {form.indication}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#75706B] dark:text-[#9E9892] mt-0.5">
                      {form.concentrationDisplay}
                    </div>
                  </div>
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected
                      ? form.isChildPrescription
                        ? 'border-amber-600 bg-amber-600 text-white'
                        : 'border-rose-600 bg-rose-600 text-white'
                      : 'border-[#D0C9BE]'
                  }`}>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Weight Adjuster Slider (Only for weight-based medications) */}
          {activeFormulation.isWeightBased && (
            <div className="space-y-2 pt-2 border-t border-[#EAE6DF] dark:border-[#2D2B33]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#75706B] dark:text-[#9E9892]">
                  Baby's Weight Slider
                </span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">
                  {weightKg} kg
                </span>
              </div>
              <input
                type="range"
                min="2.5"
                max="16.0"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#EAE6DF] dark:bg-[#2D2B33] rounded-lg appearance-none cursor-pointer accent-rose-600"
              />
              <div className="flex justify-between text-[10px] text-[#75706B]">
                <span>2.5 kg (Newborn)</span>
                <span>8.0 kg (6 Months)</span>
                <span>16.0 kg (Toddler)</span>
              </div>
            </div>
          )}

          {/* LARGE OUTPUT DISPLAY CARD */}
          <div className={`p-5 rounded-2xl border text-center space-y-2 ${
            activeFormulation.isChildPrescription
              ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-[#251F18] dark:to-[#221A15] border-amber-300 dark:border-amber-800/50'
              : 'bg-gradient-to-br from-rose-50 to-amber-50 dark:from-[#251A1C] dark:to-[#221A15] border-rose-200 dark:border-rose-900/40'
          }`}>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {activeFormulation.isChildPrescription && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white uppercase tracking-wider">
                  ⭐ Prescribed Regimen
                </span>
              )}
              <span className="text-[10px] font-bold tracking-wider text-rose-800 dark:text-rose-300 uppercase">
                {activeFormulation.isWeightBased
                  ? `Recommended Single Dose for ${weightKg} kg`
                  : 'Standard Pediatric Administration'}
              </span>
            </div>

            {activeFormulation.isWeightBased ? (
              <>
                <div className="text-4xl sm:text-5xl font-black text-rose-600 dark:text-rose-400 font-mono">
                  {calculatedMl} <span className="text-lg font-sans font-bold text-[#201E1D] dark:text-white">ml</span>
                </div>
                {calculatedMg > 0 && (
                  <p className="text-xs text-[#75706B] dark:text-[#9E9892]">
                    Delivers <strong>{calculatedMg} mg</strong> of active {activeFormulation.generic}
                  </p>
                )}
                {activeFormulation.formType === 'drops' && (
                  <div className="inline-block px-3 py-1 rounded-full bg-white dark:bg-black/40 text-[11px] font-bold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/30">
                    💧 Fill dropper to the <strong>{calculatedMl} ml</strong> mark
                  </div>
                )}
              </>
            ) : (
              <div className="py-2 space-y-1.5">
                <div className={`text-2xl sm:text-3xl font-black ${
                  activeFormulation.isChildPrescription ? 'text-amber-700 dark:text-amber-300' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {activeFormulation.fixedDoseDisplay}
                </div>
                <p className="text-xs text-[#75706B] dark:text-[#9E9892] max-w-md mx-auto">
                  {activeFormulation.usageGuidance}
                </p>
                {activeFormulation.isChildPrescription && (
                  <div className="pt-1 flex items-center justify-center gap-2 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                    <span>⏰ Interval: {activeFormulation.minIntervalHours === 24 ? 'Once every 24 hours' : `Every ${activeFormulation.minIntervalHours} hours`}</span>
                    <span>•</span>
                    <span>Max: {activeFormulation.maxDosesPerDay} {activeFormulation.maxDosesPerDay === 1 ? 'dose/day' : 'doses/day'}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Log Dose Button */}
          {userRole === 'parent' && (
            <button
              onClick={openLogModal}
              className="w-full py-3 rounded-2xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Log Medication Given to Baby</span>
            </button>
          )}

        </div>

        {/* RIGHT: Safety Intervals & 24h Lock (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Active Safety Interval Lock & Countdown */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#201E1D] dark:text-[#FAF8F5] flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Safety Interval & Re-Dose Lock</span>
              </h3>
              <span className="text-[10px] font-semibold text-[#75706B]">
                {activeFormulation.brand}
              </span>
            </div>

            {lastDoseForActiveMed ? (
              secondsUntilNextDose > 0 ? (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-900 dark:text-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Safety Lock Active (Do Not Re-Dose Yet)</span>
                  </div>
                  <p className="text-xs opacity-90">
                    Last dose administered at {new Date(lastDoseForActiveMed.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {lastDoseForActiveMed.administeredBy || 'parent'}.
                  </p>
                  <div className="text-2xl font-black font-mono text-amber-700 dark:text-amber-300">
                    {formatCountdown(secondsUntilNextDose)}
                  </div>
                  <p className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
                    Next dose safe after {new Date(new Date(lastDoseForActiveMed.timestamp).getTime() + activeFormulation.minIntervalHours * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Minimum {activeFormulation.minIntervalHours} hours interval).
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-900 dark:text-emerald-200 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Safety Interval Satisfied</div>
                    <div className="text-[11px] opacity-85">
                      Over {activeFormulation.minIntervalHours} hours have passed since the previous dose. Safe to administer again if symptoms persist.
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] text-center text-xs text-[#75706B] dark:text-[#9E9892]">
                No doses of {activeFormulation.brand} recorded today.
              </div>
            )}

            {/* 24-Hour Dose Safety Counter */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#201E1D] dark:text-[#FAF8F5]">
                  24-Hour Dosage Limit Check
                </div>
                <div className="text-[10px] text-[#75706B] dark:text-[#9E9892]">
                  Maximum {activeFormulation.maxDosesPerDay} doses allowed in any 24-hour window
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                dosesLast24h >= activeFormulation.maxDosesPerDay
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
              }`}>
                {dosesLast24h} / {activeFormulation.maxDosesPerDay} Doses
              </span>
            </div>

          </div>

          {/* Post-Vaccination Fever & Pediatric Protocol */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#201E1D] dark:text-[#FAF8F5] flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-rose-500" />
              <span>Pediatric Fever Golden Rules</span>
            </h4>
            <div className="text-xs text-[#75706B] dark:text-[#9E9892] space-y-2 leading-relaxed">
              <p>
                • <strong>When to treat:</strong> Treat the child's discomfort, not just the thermometer number. Give medicine if baby is irritable, in pain, or fever &gt;38.5°C.
              </p>
              <p>
                • <strong>Never Alternate Without Advice:</strong> Do not alternate Paracetamol and Ibuprofen without explicit doctor instructions.
              </p>
              <p>
                • <strong>Emergency Signs:</strong> Rush to clinic if fever &gt;39°C (&gt;102.2°F), baby is unusually limp/lethargic, crying inconsolably for &gt;3 hours, or shows a dark purple rash.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* MEDICATION HISTORY TIMELINE SECTION */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE6DF] dark:border-[#2D2B33] pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-rose-500/10 text-rose-600">
              <History className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#201E1D] dark:text-[#FAF8F5]">
                Medication Given History ({medHistory.length})
              </h3>
              <p className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
                Detailed log of all doses administered to {profile.name}
              </p>
            </div>
          </div>

          {medHistory.length > 0 && (
            <button
              onClick={handleCopyHistoryForDoctor}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5] hover:bg-black/5 dark:hover:bg-white/5 transition-colors self-start sm:self-auto"
            >
              {copiedHistory ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedHistory ? 'Copied to Clipboard!' : 'Copy Summary for Doctor'}</span>
            </button>
          )}
        </div>

        {medHistory.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#75706B] dark:text-[#9E9892]">
            No medication doses recorded yet. When you administer a dose, tap "Log Medication Given to Baby" to build your medical history.
          </div>
        ) : (
          <div className="divide-y divide-[#EAE6DF] dark:divide-[#2D2B33]">
            {medHistory.map((log) => {
              const dt = new Date(log.timestamp);
              const dateStr = dt.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const timeStr = dt.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={log.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Pill className="w-4 h-4" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#201E1D] dark:text-[#FAF8F5]">
                          {log.brandName || log.medicineName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                          {log.dosageMl} ml {log.dosageMg ? `(${log.dosageMg} mg)` : ''}
                        </span>
                        {log.reason && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#75706B]">
                            {log.reason}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-[#75706B] dark:text-[#9E9892] flex items-center gap-2 flex-wrap">
                        <span>🗓️ {dateStr} at {timeStr}</span>
                        {log.administeredBy && <span>• Given by {log.administeredBy}</span>}
                        {log.temperatureC && (
                          <span className="text-rose-600 font-semibold">
                            • Temp: {log.temperatureC}°C ({((log.temperatureC * 9) / 5 + 32).toFixed(1)}°F)
                          </span>
                        )}
                        {log.notes && <span>• "{log.notes}"</span>}
                      </div>
                    </div>
                  </div>

                  {userRole === 'parent' && (
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="p-1.5 text-[#75706B] hover:text-[#CB6145] self-end sm:self-auto transition-colors"
                      title="Delete log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* LOG MEDICATION DOSE MODAL (Mobile Bottom-Sheet & Desktop Centered) */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C1A22] border-t sm:border border-[#EAE6DF] dark:border-[#2D2B33] rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            {/* Mobile Sheet Drag Pill */}
            <div className="sm:hidden w-10 h-1 rounded-full bg-[#D5CFCE] dark:bg-[#3D3B44] mx-auto mb-2" />
            
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DF] dark:border-[#2D2B33]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#201E1D] dark:text-[#FAF8F5]">
                    Record Medication Given
                  </h3>
                  <p className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
                    {activeFormulation.brand}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#75706B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDoseLog} className="space-y-3.5 text-xs">
              
              {/* Dosage Summary Box & Volume Input */}
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-rose-800 dark:text-rose-300 font-semibold uppercase">
                      Administered Medicine
                    </div>
                    <div className="text-xs font-bold text-[#201E1D] dark:text-[#FAF8F5]">
                      {activeFormulation.brand}
                    </div>
                  </div>
                  <div className="text-[11px] text-right text-[#75706B] dark:text-[#9E9892]">
                    Weight: <strong>{weightKg} kg</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#4D4845] dark:text-[#DDD8D0] block">
                      Administered Volume
                    </label>
                    <span className="text-[10px] text-[#75706B]">
                      {activeFormulation.isWeightBased ? `Calculated: ${calculatedMl} ml` : activeFormulation.fixedDoseDisplay}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.05"
                      min="0.05"
                      max="30"
                      required
                      value={customDoseMl}
                      onChange={(e) => setCustomDoseMl(parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 text-right font-mono font-bold rounded-xl bg-white dark:bg-[#141317] border border-rose-300 dark:border-rose-800 text-[#201E1D] dark:text-[#FAF8F5]"
                    />
                    <span className="text-xs font-bold text-[#75706B]">ml</span>
                  </div>
                </div>
              </div>

              {/* Reason Selector */}
              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1.5 font-semibold">
                  Reason for Medication
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DOSE_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setDoseReason(r)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all ${
                        doseReason === r
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-[#FAF8F5] dark:bg-[#141317] border-[#EAE6DF] dark:border-[#2D2B33] text-[#75706B] dark:text-[#9E9892]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Temperature & Date-Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">
                    Temperature (°C) [Optional]
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 38.2"
                    value={doseTemperatureC}
                    onChange={(e) => setDoseTemperatureC(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                  />
                  {doseTemperatureC && (
                    <span className="text-[10px] text-[#75706B] mt-0.5 block">
                      = {((parseFloat(doseTemperatureC) * 9) / 5 + 32).toFixed(1)}°F
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">
                    Administered By
                  </label>
                  <select
                    value={administeredBy}
                    onChange={(e) => setAdministeredBy(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                  >
                    {CAREGIVERS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Exact Time */}
              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">
                  Administration Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={doseTime}
                  onChange={(e) => setDoseTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">
                  Notes / Observations
                </label>
                <input
                  type="text"
                  placeholder="e.g. Took full dropper with milk, fell asleep shortly after..."
                  value={doseNotes}
                  onChange={(e) => setDoseNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-semibold border border-[#EAE6DF] dark:border-[#2D2B33] text-[#4D4845] dark:text-[#DDD8D0] hover:bg-[#F2ECE3] dark:hover:bg-[#26242C] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all active:scale-[0.98]"
                >
                  Save Dose Log
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
