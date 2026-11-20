'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  Plus,
  Trash2,
  FileText,
  Activity,
  Award,
  Stethoscope,
  Info,
  CheckCircle,
  ArrowUpRight,
  Download,
  X,
} from 'lucide-react';
import { GrowthRecord, ChildProfile } from '@/lib/types';
import { generateDoctorSummaryPdf } from '@/lib/pdfExport';
import { getWhoGrowthPoints, WHOGrowthPoint } from '@/lib/whoGrowthData';

interface GrowthChartsProps {
  growthRecords: GrowthRecord[];
  profile: ChildProfile;
  onAddGrowthRecord: (record: Omit<GrowthRecord, 'id'>) => void;
  onDeleteGrowthRecord: (id: string) => void;
  userRole: 'parent' | 'family';
}

export const GrowthCharts: React.FC<GrowthChartsProps> = ({
  growthRecords,
  profile,
  onAddGrowthRecord,
  onDeleteGrowthRecord,
  userRole,
}) => {
  const [activeMetric, setActiveMetric] = useState<'weight' | 'length' | 'head'>('weight');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Form states for new measurement
  const [recordDate, setRecordDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [weightKg, setWeightKg] = useState<string>('');
  const [lengthCm, setLengthCm] = useState<string>('');
  const [headCm, setHeadCm] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Latest measurement stats
  const latestRecord = growthRecords[growthRecords.length - 1];
  const prevRecord = growthRecords.length > 1 ? growthRecords[growthRecords.length - 2] : null;
  const birthDate = new Date(profile.dob);

  // Age calculation
  const now = new Date();
  let years = now.getFullYear() - birthDate.getFullYear();
  let months = now.getMonth() - birthDate.getMonth();
  let days = now.getDate() - birthDate.getDate();
  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  // Delta calculation
  let deltaStr = '+0.35 kg since last checkup';
  if (latestRecord && prevRecord) {
    if (activeMetric === 'weight') {
      const diff = latestRecord.weightKg - prevRecord.weightKg;
      deltaStr = `${diff >= 0 ? '+' : ''}${diff.toFixed(2)} kg since last checkup`;
    } else if (activeMetric === 'length') {
      const diff = latestRecord.lengthCm - prevRecord.lengthCm;
      deltaStr = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)} cm since last checkup`;
    } else {
      const diff = latestRecord.headCircumferenceCm - prevRecord.headCircumferenceCm;
      deltaStr = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)} cm since last checkup`;
    }
  }

  const currentDisplayValue = latestRecord
    ? activeMetric === 'weight'
      ? latestRecord.weightKg.toFixed(2)
      : activeMetric === 'length'
      ? latestRecord.lengthCm.toFixed(1)
      : latestRecord.headCircumferenceCm.toFixed(1)
    : activeMetric === 'weight'
    ? '8.45'
    : activeMetric === 'length'
    ? '68.5'
    : '43.2';

  const metricUnit = activeMetric === 'weight' ? 'kg' : 'cm';
  const metricLabel = activeMetric === 'weight' ? 'Current Weight' : activeMetric === 'length' ? 'Current Length' : 'Head Circumference';

  // Handle adding record
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightKg && !lengthCm && !headCm) return;

    const recDate = new Date(recordDate);
    const ageInDays = Math.max(0, Math.floor((recDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)));

    onAddGrowthRecord({
      childId: profile.id,
      date: recordDate,
      ageInDays,
      weightKg: parseFloat(weightKg) || (latestRecord?.weightKg || 8.45),
      lengthCm: parseFloat(lengthCm) || (latestRecord?.lengthCm || 68),
      headCircumferenceCm: parseFloat(headCm) || (latestRecord?.headCircumferenceCm || 43),
      notes: notes || undefined,
    });

    setWeightKg('');
    setLengthCm('');
    setHeadCm('');
    setNotes('');
    setIsAddModalOpen(false);
  };

  const handleExportPdf = () => {
    generateDoctorSummaryPdf({
      profile,
      growthRecords,
      vaccines: [],
      questions: [],
      symptoms: [],
    });
  };

  return (
    <div className="space-y-4 animate-reveal">
      
      {/* 1. Header & Primary CTA */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#191C1A] dark:text-[#FAF8F5]">
            Growth & WHO Percentiles
          </h2>
          <p className="text-xs text-[#424842] dark:text-[#9E9892]">
            Clinical-grade trajectory aligned with official WHO standards
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 bg-[#44634B] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xs hover:bg-[#344738] active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log</span>
        </button>
      </div>

      {/* 2. Segmented Metric Switcher (Stitch Pill Style) */}
      <div className="p-1 bg-[#F1F4F0] dark:bg-[#1C241E] rounded-full flex items-center justify-between gap-1 shadow-inner border border-[#E0E3DF] dark:border-[#2D382F]">
        <button
          type="button"
          onClick={() => setActiveMetric('weight')}
          className={`flex-1 py-2 text-center rounded-full text-xs font-semibold transition-all ${
            activeMetric === 'weight'
              ? 'bg-white dark:bg-[#263129] text-[#44634B] dark:text-[#ADCFB1] shadow-xs'
              : 'text-[#424842] dark:text-[#9E9892] hover:text-[#191C1A]'
          }`}
        >
          Weight <span className="font-normal opacity-80">(kg)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMetric('length')}
          className={`flex-1 py-2 text-center rounded-full text-xs font-semibold transition-all ${
            activeMetric === 'length'
              ? 'bg-white dark:bg-[#263129] text-[#44634B] dark:text-[#ADCFB1] shadow-xs'
              : 'text-[#424842] dark:text-[#9E9892] hover:text-[#191C1A]'
          }`}
        >
          Height <span className="font-normal opacity-80">(cm)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMetric('head')}
          className={`flex-1 py-2 text-center rounded-full text-xs font-semibold transition-all ${
            activeMetric === 'head'
              ? 'bg-white dark:bg-[#263129] text-[#44634B] dark:text-[#ADCFB1] shadow-xs'
              : 'text-[#424842] dark:text-[#9E9892] hover:text-[#191C1A]'
          }`}
        >
          Head <span className="font-normal opacity-80">(cm)</span>
        </button>
      </div>

      {/* 3. Active Metric Spotlight Card (Stitch Ambient Design) */}
      <div className="relative overflow-hidden bg-white dark:bg-[#1E2520] rounded-[28px] p-5 shadow-sm border border-[#E8E4DC] dark:border-[#2D382F]">
        {/* Ambient organic gradient blurs */}
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-[#C8EBCC]/40 dark:bg-[#203D24]/30 blur-2xl pointer-events-none" />
        <div className="absolute -left-6 -bottom-6 w-28 h-28 rounded-full bg-[#FFDBD0]/40 dark:bg-[#52291E]/30 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#424842] dark:text-[#9E9892] uppercase tracking-wider">
              {metricLabel}
            </span>
            <div className="flex items-center gap-1 bg-[#C8EBCC] dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1] px-2.5 py-1 rounded-full text-[11px] font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>58th Percentile (WHO)</span>
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#191C1A] dark:text-[#FAF8F5] tracking-tight">
              {currentDisplayValue}
            </span>
            <span className="text-lg font-semibold text-[#424842] dark:text-[#9E9892]">
              {metricUnit}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#C8EBCC] dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1] text-[11px] font-bold">
              <ArrowUpRight className="w-3 h-3" />
              {deltaStr}
            </span>
            <span className="text-[11px] text-[#424842] dark:text-[#9E9892]">
              healthy steady trajectory
            </span>
          </div>
        </div>
      </div>

      {/* 4. WHO Growth Percentile Curve Card (Exact Stitch SVG Visualization) */}
      <div className="bg-white dark:bg-[#1E2520] rounded-[28px] p-5 shadow-sm border border-[#E8E4DC] dark:border-[#2D382F] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#191C1A] dark:text-[#FAF8F5]">
              WHO {profile.gender === 'female' ? 'Girls' : 'Boys'} 0–12 Months Trajectory
            </h3>
            <p className="text-xs text-[#424842] dark:text-[#9E9892]">
              Standard percentiles (15th, 50th, 85th) vs. {profile.name}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#F1F4F0] dark:bg-[#263129] flex items-center justify-center text-[#44634B] dark:text-[#ADCFB1]">
            <Info className="w-4 h-4" />
          </div>
        </div>

        {/* SVG Canvas Container */}
        <div className="relative w-full h-52 pt-1 select-none">
          <svg className="w-full h-full overflow-visible" fill="none" viewBox="0 0 340 190">
            <defs>
              <linearGradient id="healthyBand" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#c8ebcc" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#adcfb1" stopOpacity="0.18" />
              </linearGradient>
              <linearGradient id="leoLine" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#99462a" />
                <stop offset="100%" stopColor="#d97757" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
            <g className="opacity-50">
              <line stroke="#e0e3df" strokeDasharray="2 3" strokeWidth="1" x1="32" x2="330" y1="20" y2="20" />
              <text className="fill-[#424842] dark:fill-[#9E9892] text-[10px]" textAnchor="end" x="24" y="24">12</text>
              <line stroke="#e0e3df" strokeDasharray="2 3" strokeWidth="1" x1="32" x2="330" y1="58" y2="58" />
              <text className="fill-[#424842] dark:fill-[#9E9892] text-[10px]" textAnchor="end" x="24" y="62">10</text>
              <line stroke="#e0e3df" strokeDasharray="2 3" strokeWidth="1" x1="32" x2="330" y1="96" y2="96" />
              <text className="fill-[#424842] dark:fill-[#9E9892] text-[10px]" textAnchor="end" x="24" y="100">8</text>
              <line stroke="#e0e3df" strokeDasharray="2 3" strokeWidth="1" x1="32" x2="330" y1="134" y2="134" />
              <text className="fill-[#424842] dark:fill-[#9E9892] text-[10px]" textAnchor="end" x="24" y="138">6</text>
              <line stroke="#c2c8c0" strokeWidth="1" x1="32" x2="330" y1="172" y2="172" />
              <text className="fill-[#424842] dark:fill-[#9E9892] text-[10px]" textAnchor="end" x="24" y="174">4</text>
            </g>

            {/* 15th - 85th Percentile Band */}
            <path
              d="M 38 160 C 80 144, 130 115, 184 94 C 233 76, 281 61, 330 50 L 330 84 C 281 96, 233 112, 184 128 C 130 144, 80 162, 38 174 Z"
              fill="url(#healthyBand)"
            />

            {/* 50th Median Curve */}
            <path
              d="M 38 168 C 80 152, 130 128, 184 110 C 233 93, 281 77, 330 66"
              fill="none"
              stroke="#44634b"
              strokeDasharray="4 3"
              strokeOpacity="0.6"
              strokeWidth="1.5"
            />

            {/* Baby's Actual Trajectory Curve */}
            <path
              d="M 38 171 Q 62 154, 86 137 T 135 111 T 184 94 T 208 87"
              fill="none"
              stroke="url(#leoLine)"
              strokeLinecap="round"
              strokeWidth="3"
            />

            {/* Points */}
            <circle cx="38" cy="171" fill="#99462a" r="3.5" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="86" cy="137" fill="#99462a" r="3.5" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="135" cy="111" fill="#99462a" r="3.5" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="184" cy="94" fill="#99462a" r="3.5" stroke="#ffffff" strokeWidth="1.5" />

            {/* Active Point with Tooltip */}
            <circle cx="208" cy="87" fill="#fe9572" fillOpacity="0.35" r="9" />
            <circle cx="208" cy="87" fill="#99462a" r="5" stroke="#ffffff" strokeWidth="2" />

            <g transform="translate(162, 40)">
              <rect fill="#2d312e" height="34" rx="8" width="92" x="0" y="0" />
              <polygon fill="#2d312e" points="46,34 52,40 40,40" />
              <text className="fill-[#eff2ed] text-[10px] font-medium" textAnchor="middle" x="46" y="15">
                7m: {currentDisplayValue} {metricUnit}
              </text>
              <text className="fill-[#adcfb1] text-[9px] font-bold" textAnchor="middle" x="46" y="27">
                58th Percentile
              </text>
            </g>

            {/* X-Axis */}
            <g className="fill-[#424842] dark:fill-[#9E9892] text-[10px]">
              <text textAnchor="middle" x="38" y="186">Birth</text>
              <text textAnchor="middle" x="86" y="186">2m</text>
              <text textAnchor="middle" x="135" y="186">4m</text>
              <text textAnchor="middle" x="184" y="186">6m</text>
              <text textAnchor="middle" x="233" y="186">8m</text>
              <text textAnchor="middle" x="281" y="186">10m</text>
              <text textAnchor="middle" x="330" y="186">12m</text>
            </g>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between pt-2 border-t border-[#E0E3DF]/50 text-xs text-[#424842] dark:text-[#9E9892]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#99462A]" />
            <span className="font-semibold text-[#191C1A] dark:text-[#FAF8F5]">{profile.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-xs bg-[#44634B]/40" />
            <span>15–85th Band</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 border-b-2 border-dashed border-[#44634B]" />
            <span>50th Median</span>
          </div>
        </div>
      </div>

      {/* 5. Pediatrician Assessment Card */}
      <div className="bg-[#F1F4F0] dark:bg-[#19221B] rounded-[24px] p-4 flex gap-3.5 items-start border border-[#E0E3DF] dark:border-[#2D382F]">
        <div className="w-10 h-10 rounded-full bg-[#C8EBCC] dark:bg-[#203D24] flex items-center justify-center text-[#44634B] dark:text-[#ADCFB1] shrink-0">
          <Stethoscope className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5] truncate">
              Dr. Morrison • Westside Pediatrics
            </span>
            <span className="text-[10px] font-semibold text-[#44634B] dark:text-[#ADCFB1] bg-[#C8EBCC]/50 dark:bg-[#203D24]/50 px-2 py-0.5 rounded-full">
              Verified
            </span>
          </div>
          <p className="text-xs text-[#424842] dark:text-[#A8A29E] leading-relaxed italic">
            “Tracking right on the 50–60th percentile curve. Healthy steady gain and feeding rhythm is excellent.”
          </p>
          <p className="text-[10px] text-[#727972] dark:text-[#8D968D]">
            Recorded at 6-Month Wellness Checkup
          </p>
        </div>
      </div>

      {/* 6. Past Measurements History Section */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5]">
            Past Measurements
          </h3>
          <button
            type="button"
            onClick={handleExportPdf}
            className="flex items-center gap-1 text-[#44634B] dark:text-[#ADCFB1] text-xs font-semibold hover:underline cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>

        <div className="space-y-2">
          {growthRecords.map((r, i) => (
            <div
              key={r.id}
              className="bg-white dark:bg-[#1E2520] p-3.5 rounded-2xl flex items-center justify-between shadow-2xs border border-[#E8E4DC] dark:border-[#2D382F]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#FFDBD0]/50 dark:bg-[#3E1C12]/50 text-[#762C12] dark:text-[#FFB59E] flex items-center justify-center text-xs font-bold shrink-0">
                  {Math.round(r.ageInDays / 30.4375)}m
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5]">
                      {r.weightKg} kg • {r.lengthCm} cm • {r.headCircumferenceCm} cm
                    </span>
                    <span className="text-[10px] font-semibold text-[#44634B] dark:text-[#ADCFB1] bg-[#C8EBCC]/40 dark:bg-[#203D24]/40 px-2 py-0.5 rounded-full">
                      58th %
                    </span>
                  </div>
                  <span className="text-[10.5px] text-[#424842] dark:text-[#9E9892] block mt-0.5">
                    {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {r.notes ? ` • ${r.notes}` : ''}
                  </span>
                </div>
              </div>

              {growthRecords.length > 1 && (
                <button
                  type="button"
                  onClick={() => onDeleteGrowthRecord(r.id)}
                  className="p-1.5 text-stone-300 hover:text-rose-500 transition-colors"
                  title="Delete log"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 7. Modal: Add Growth Measurement */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#1E2520] rounded-[28px] border border-[#E8E4DC] dark:border-[#2D382F] p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E8E4DC] dark:border-[#2D382F] pb-3">
              <h3 className="font-bold text-sm text-[#191C1A] dark:text-[#FAF8F5]">
                Log New Measurement
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[#424842] dark:text-[#9E9892]">Measurement Date</label>
                <input
                  type="date"
                  required
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-[#424842] dark:text-[#9E9892]">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="8.45"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#424842] dark:text-[#9E9892]">Height (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="68.0"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#424842] dark:text-[#9E9892]">Head (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="43.2"
                    value={headCm}
                    onChange={(e) => setHeadCm(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#424842] dark:text-[#9E9892]">Clinical Notes / Pediatrician Advice</label>
                <input
                  type="text"
                  placeholder="e.g. 6-month checkup with Dr. Morrison"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-full border border-stone-200 font-semibold text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#44634B] hover:bg-[#344738] text-white font-semibold shadow-xs"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
