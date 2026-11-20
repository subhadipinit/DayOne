'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from 'recharts';
import {
  Plus,
  Ruler,
  Scale,
  Brain,
  Trash2,
  Calendar,
  CheckCircle2,
  TrendingUp,
  FileText,
  Stethoscope,
  ChevronDown,
  Info,
  Download,
} from 'lucide-react';
import { GrowthRecord, ChildProfile } from '@/lib/types';
import {
  WHO_GIRLS_WEIGHT,
  WHO_GIRLS_LENGTH,
  WHO_GIRLS_HEAD,
  WHOGrowthPoint,
  getWhoGrowthPoints,
  getPercentileCategory,
} from '@/lib/whoGrowthData';
import { generateDoctorSummaryPdf } from '@/lib/pdfExport';

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
  let deltaStr = '';
  if (latestRecord && prevRecord) {
    if (activeMetric === 'weight') {
      const diff = latestRecord.weightKg - prevRecord.weightKg;
      deltaStr = `${diff >= 0 ? '+' : ''}${diff.toFixed(2)} kg since last visit`;
    } else if (activeMetric === 'length') {
      const diff = latestRecord.lengthCm - prevRecord.lengthCm;
      deltaStr = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)} cm since last visit`;
    } else {
      const diff = latestRecord.headCircumferenceCm - prevRecord.headCircumferenceCm;
      deltaStr = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)} cm since last visit`;
    }
  }

  // Prepare chart dataset (Automatically switches based on child's gender)
  const whoData = getWhoGrowthPoints(profile.gender, activeMetric);

  const chartData = whoData.map((pt: WHOGrowthPoint) => {
    const monthStartDays = pt.month === 0 ? 0 : (pt.month - 0.5) * 30.4375;
    const monthEndDays = (pt.month + 0.5) * 30.4375;

    const matchingRecord = growthRecords.find(
      (r) => r.ageInDays >= monthStartDays && r.ageInDays <= monthEndDays
    );

    let actualVal: number | null = null;
    if (matchingRecord) {
      if (activeMetric === 'weight') actualVal = matchingRecord.weightKg;
      else if (activeMetric === 'length') actualVal = matchingRecord.lengthCm;
      else actualVal = matchingRecord.headCircumferenceCm;
    }

    return {
      month: pt.month,
      monthLabel: pt.month === 0 ? 'Birth' : `${pt.month}m`,
      p3: pt.p3,
      p15: pt.p15,
      p50: pt.p50,
      p85: pt.p85,
      p97: pt.p97,
      actual: actualVal,
    };
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightKg || !lengthCm || !headCm) return;

    const entryDate = new Date(recordDate);
    const ageInDays = Math.max(0, Math.floor((entryDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)));

    onAddGrowthRecord({
      childId: profile.id,
      date: recordDate,
      ageInDays,
      weightKg: parseFloat(weightKg),
      lengthCm: parseFloat(lengthCm),
      headCircumferenceCm: parseFloat(headCm),
      notes: notes || undefined,
    });

    setWeightKg('');
    setLengthCm('');
    setHeadCm('');
    setNotes('');
    setIsAddModalOpen(false);
  };

  const metricTitle =
    activeMetric === 'weight'
      ? 'Weight-for-Age (kg)'
      : activeMetric === 'length'
        ? 'Length-for-Age (cm)'
        : 'Head Circumference-for-Age (cm)';

  const currentValDisplay = latestRecord
    ? activeMetric === 'weight'
      ? `${latestRecord.weightKg.toFixed(2)} kg`
      : activeMetric === 'length'
        ? `${latestRecord.lengthCm.toFixed(1)} cm`
        : `${latestRecord.headCircumferenceCm.toFixed(1)} cm`
    : 'No records';

  const currentPercentile = latestRecord
    ? getPercentileCategory(
      activeMetric === 'weight'
        ? latestRecord.weightKg
        : activeMetric === 'length'
          ? latestRecord.lengthCm
          : latestRecord.headCircumferenceCm,
      whoData,
      latestRecord.ageInDays / 30.4375
    )
    : 'No records';

  return (
    <div className="space-y-5">
      {/* 1. Header & Quick Action (Direct from Stitch Mockup) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface dark:text-[#FAF8F5]">
            Growth & WHO Percentiles
          </h2>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant dark:text-[#9E9892] mt-0.5">
            <span className="font-semibold text-primary dark:text-[#ADCFB1]">
              {profile.name} • {years > 0 ? `${years}y ` : ''}{months}m {days}d
            </span>
            <span>•</span>
            <span>WHO {profile.gender === 'male' ? 'Boys' : 'Girls'} Standards</span>
          </div>
        </div>

        {userRole === 'parent' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#44634B] hover:bg-[#38533E] text-white shadow-xs transition-all active:scale-[0.97]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Log Measurement</span>
          </button>
        )}
      </div>

      {/* 2. Metric Segmented Control (Pill Switcher) */}
      <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#ECEFEA] dark:bg-[#1D1C22] border border-[#E0E3DF] dark:border-[#2D2B33] w-full max-w-md overflow-x-auto">
        <button
          onClick={() => setActiveMetric('weight')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-150 ${activeMetric === 'weight'
            ? 'bg-[#44634B] text-white shadow-xs'
            : 'text-on-surface-variant dark:text-[#9E9892] hover:text-on-surface'
            }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Weight (kg)</span>
        </button>

        <button
          onClick={() => setActiveMetric('length')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-150 ${activeMetric === 'length'
            ? 'bg-[#44634B] text-white shadow-xs'
            : 'text-on-surface-variant dark:text-[#9E9892] hover:text-on-surface'
            }`}
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>Height (cm)</span>
        </button>

        <button
          onClick={() => setActiveMetric('head')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-150 ${activeMetric === 'head'
            ? 'bg-[#44634B] text-white shadow-xs'
            : 'text-on-surface-variant dark:text-[#9E9892] hover:text-on-surface'
            }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>Head Circ.</span>
        </button>
      </div>

      {/* 3. Active Metric Hero Summary Card (Direct from Stitch Mockup) */}
      <div className="bg-white dark:bg-[#1D1C22] p-5 rounded-2xl border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold text-on-surface-variant dark:text-[#9E9892] uppercase tracking-wider block">
              Current Recorded {activeMetric === 'weight' ? 'Weight' : activeMetric === 'length' ? 'Length' : 'Head Circumference'}
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-on-surface dark:text-[#FAF8F5] tracking-tight tabular-nums">
                {currentValDisplay}
              </span>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EDF5EE] dark:bg-[#1F2B21] text-[#23522A] dark:text-[#ADCFB1] text-xs font-bold border border-[#CFE2D1] dark:border-[#2D4231]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#44634B]" />
                <span>{currentPercentile}</span>
              </div>
            </div>
            {deltaStr && (
              <p className="text-xs font-medium text-[#44634B] dark:text-[#ADCFB1] flex items-center gap-1 mt-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{deltaStr}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-on-surface-variant dark:text-[#9E9892] sm:border-l sm:border-[#EAE6DF] dark:sm:border-[#2D2B33] sm:pl-5">
            <div>
              <span className="block text-[10px] uppercase font-semibold text-on-surface-variant">Healthy Zone</span>
              <span className="font-bold text-on-surface dark:text-[#FAF8F5]">15th – 85th %ile</span>
            </div>
            <div className="border-l border-[#EAE6DF] dark:border-[#2D2B33] pl-3">
              <span className="block text-[10px] uppercase font-semibold text-on-surface-variant">Last Check</span>
              <span className="font-bold text-on-surface dark:text-[#FAF8F5]">{latestRecord?.date || 'None'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. WHO Growth Curve Chart */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-[#EAE6DF] dark:border-[#2D2B33]">
          <div>
            <h3 className="text-sm font-bold text-on-surface dark:text-[#FAF8F5]">
              WHO {profile.gender === 'male' ? 'Boys' : 'Girls'} 0–24 Months Curve
            </h3>
            <p className="text-xs text-on-surface-variant dark:text-[#9E9892] mt-0.5">
              Shaded band represents normal healthy range (15th–85th percentiles)
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-on-surface-variant dark:text-[#9E9892]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97757] inline-block" />
              <span>{profile.name}'s measurements</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#44634B] inline-block" />
              <span>Median (50th)</span>
            </div>
          </div>
        </div>

        <div className="w-full h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAE6DF" opacity={0.6} />

              <XAxis dataKey="monthLabel" stroke="#9E9892" fontSize={11} tickLine={false} />
              <YAxis stroke="#9E9892" fontSize={11} tickLine={false} domain={['auto', 'auto']} />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 rounded-xl bg-[#191C1A] text-white text-xs space-y-1 shadow-lg border border-[#424842]">
                        <p className="font-semibold border-b border-[#424842] pb-1">{label} (Month {data.month})</p>
                        {data.actual !== null && (
                          <p className="text-[#FFB59E] font-bold text-sm">
                            {profile.name}: {data.actual}
                          </p>
                        )}
                        <p className="text-[#DDD8D0] text-[11px]">97th Percentile: {data.p97}</p>
                        <p className="text-[#ADCFB1] text-[11px]">50th (Median): {data.p50}</p>
                        <p className="text-[#DDD8D0] text-[11px]">3rd Percentile: {data.p3}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Shaded Normal Range (15th - 85th) */}
              <Line type="monotone" dataKey="p97" stroke="#EAE6DF" strokeDasharray="4 4" dot={false} strokeWidth={1} name="97th" />
              <Line type="monotone" dataKey="p85" stroke="#C8EBCC" dot={false} strokeWidth={1.5} name="85th" />
              <Line type="monotone" dataKey="p50" stroke="#44634B" dot={false} strokeWidth={2.5} name="50th Median" />
              <Line type="monotone" dataKey="p15" stroke="#C8EBCC" dot={false} strokeWidth={1.5} name="15th" />
              <Line type="monotone" dataKey="p3" stroke="#EAE6DF" strokeDasharray="4 4" dot={false} strokeWidth={1} name="3rd" />

              {/* Baby's Actual Measurement Points */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#D97757"
                strokeWidth={3}
                dot={{ r: 5, fill: '#D97757', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#99462A' }}
                connectNulls
                name="Baby Actual"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Pediatrician Clinical Growth Assessment Note (Direct from Stitch Mockup) */}
      <div className="bg-[#FAF8F5] dark:bg-[#1A241C] border border-[#CFE2D1] dark:border-[#2D4231] rounded-2xl p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#C8EBCC] dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1] flex items-center justify-center shrink-0">
            <Stethoscope className="w-5 h-5 text-[#44634B]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface dark:text-[#FAF8F5]">
                Dr. Morrison • Westside Pediatrics
              </span>
              <span className="text-[10px] text-on-surface-variant dark:text-[#9E9892]">
                6-Month Checkup Note
              </span>
            </div>
            <p className="text-xs text-on-surface-variant dark:text-[#DDD8D0] mt-1 leading-relaxed">
              "Tracking right on the 50–60th percentile curve. Healthy steady gain, muscle tone is active, and feeding rhythm is excellent."
            </p>
          </div>
        </div>
      </div>

      {/* 6. Measurement History Log with PDF Export (Direct from Stitch Mockup) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-on-surface-variant dark:text-[#9E9892] uppercase tracking-wider">
            Past Checkup Logs ({growthRecords.length})
          </h4>
          <button
            onClick={() =>
              generateDoctorSummaryPdf({
                profile,
                growthRecords,
                vaccines: [],
                questions: [],
                symptoms: [],
              })
            }
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#44634B] hover:text-[#38533E] dark:text-[#ADCFB1]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>

        {growthRecords.length === 0 ? (
          <p className="text-xs text-on-surface-variant text-center py-5">
            No growth records entered yet.
          </p>
        ) : (
          <div className="divide-y divide-[#EAE6DF] dark:divide-[#2D2B33]">
            {growthRecords.map((r) => (
              <div
                key={r.id}
                className="py-3 flex items-center justify-between hover:bg-[#FAF8F5] dark:hover:bg-[#17161B] px-2 rounded-xl transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface dark:text-[#FAF8F5]">
                      {r.date}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EDF5EE] dark:bg-[#1F2B21] text-[#23522A] dark:text-[#ADCFB1]">
                      Day {r.ageInDays}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant dark:text-[#9E9892]">
                    <span><strong className="text-on-surface dark:text-[#FAF8F5]">{r.weightKg.toFixed(2)} kg</strong></span>
                    <span>•</span>
                    <span>{r.lengthCm.toFixed(1)} cm</span>
                    <span>•</span>
                    <span>Head: {r.headCircumferenceCm.toFixed(1)} cm</span>
                  </div>
                  {r.notes && (
                    <p className="text-[11px] text-on-surface-variant italic">"{r.notes}"</p>
                  )}
                </div>

                {userRole === 'parent' && (
                  <button
                    onClick={() => onDeleteGrowthRecord(r.id)}
                    className="p-1.5 text-on-surface-variant hover:text-[#D97757] transition-colors rounded-lg"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. Add Measurement Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#1D1C22] border-t sm:border border-[#EAE6DF] dark:border-[#2D2B33] p-5 shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="sm:hidden w-10 h-1 rounded-full bg-[#D5CFCE] dark:bg-[#3D3B44] mx-auto mb-3" />

            <h3 className="text-base font-bold text-on-surface dark:text-[#FAF8F5] mb-1">
              Add Pediatric Measurement
            </h3>
            <p className="text-xs text-on-surface-variant dark:text-[#9E9892] mb-4">
              Enter measurements in standard metric units.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-on-surface dark:text-[#DDD8D0] mb-1 font-semibold">
                  Measurement Date
                </label>
                <input
                  type="date"
                  required
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-on-surface dark:text-[#FAF8F5] text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-on-surface dark:text-[#DDD8D0] mb-1 font-semibold">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    required
                    placeholder="8.45"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-on-surface dark:text-[#FAF8F5] text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-on-surface dark:text-[#DDD8D0] mb-1 font-semibold">Length (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    required
                    placeholder="69.2"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-on-surface dark:text-[#FAF8F5] text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-on-surface dark:text-[#DDD8D0] mb-1 font-semibold">Head (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    required
                    placeholder="44.0"
                    value={headCm}
                    onChange={(e) => setHeadCm(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-on-surface dark:text-[#FAF8F5] text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-on-surface dark:text-[#DDD8D0] mb-1 font-semibold">Clinical Notes</label>
                <textarea
                  rows={2}
                  placeholder="Doctor's comments, feeding assessment, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-on-surface dark:text-[#FAF8F5] text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl font-semibold border border-[#EAE6DF] dark:border-[#2D2B33] text-on-surface-variant hover:bg-[#F2ECE3] dark:hover:bg-[#26242C] transition-colors active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-xl font-semibold bg-[#44634B] text-white hover:bg-[#38533E] transition-colors active:scale-[0.98]"
                >
                  Save Measurement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
