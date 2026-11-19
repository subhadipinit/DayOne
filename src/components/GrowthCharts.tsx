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
} from 'recharts';
import { Plus, Ruler, Scale, Brain, Trash2, Calendar } from 'lucide-react';
import { GrowthRecord, ChildProfile } from '@/lib/types';
import {
  WHO_GIRLS_WEIGHT,
  WHO_GIRLS_LENGTH,
  WHO_GIRLS_HEAD,
  WHOGrowthPoint,
  getWhoGrowthPoints,
  getPercentileCategory,
} from '@/lib/whoGrowthData';

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
  const birthDate = new Date(profile.dob);

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
      monthLabel: pt.month === 0 ? 'Birth' : `M${pt.month}`,
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

      {/* Metric Selector & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

        {/* Metric Segment Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-[#F2ECE3] dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] max-w-full overflow-x-auto">
          <button
            onClick={() => setActiveMetric('weight')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150 ${activeMetric === 'weight'
              ? 'bg-[#E2765A] text-white shadow-xs'
              : 'text-[#75706B] dark:text-[#9E9892] hover:text-[#201E1D]'
              }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Weight (kg)</span>
          </button>

          <button
            onClick={() => setActiveMetric('length')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150 ${activeMetric === 'length'
              ? 'bg-[#E2765A] text-white shadow-xs'
              : 'text-[#75706B] dark:text-[#9E9892] hover:text-[#201E1D]'
              }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Length (cm)</span>
          </button>

          <button
            onClick={() => setActiveMetric('head')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150 ${activeMetric === 'head'
              ? 'bg-[#E2765A] text-white shadow-xs'
              : 'text-[#75706B] dark:text-[#9E9892] hover:text-[#201E1D]'
              }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Head Circ. (cm)</span>
          </button>
        </div>

        {/* Add Measurement Button */}
        {userRole === 'parent' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#E2765A] text-white hover:bg-[#CB6145] shadow-xs transition-colors duration-150 active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Measurement</span>
          </button>
        )}

      </div>

      {/* Main Chart Box */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs">

        {/* Chart Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-[#EAE6DF] dark:border-[#2D2B33]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#201E1D] dark:text-[#FAF8F5]">
                WHO Standard Growth Curve: {metricTitle}
              </h3>
              <span className="text-[10px] font-semibold tracking-tight px-2 py-0.5 rounded-full border border-[#CFE2D1] dark:border-[#2D4A33] bg-[#EDF5EE] text-[#23522A] dark:bg-[#1A2E1F] dark:text-[#AECDB2]">
                {profile.gender === 'male' ? 'WHO Male (0–24M)' : 'WHO Female (0–24M)'}
              </span>
            </div>
            <p className="text-xs text-[#75706B] dark:text-[#9E9892] mt-0.5">
              Current Percentile: <span className="font-semibold text-[#201E1D] dark:text-[#FAF8F5]">{currentPercentile}</span>
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#75706B] dark:text-[#9E9892]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E2765A] inline-block" />
              <span>Baby measurements</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#5A9663] inline-block" />
              <span>WHO Median (50th)</span>
            </div>
          </div>
        </div>

        {/* Responsive Line Chart */}
        <div className="w-full h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAE6DF" opacity={0.8} />

              <XAxis
                dataKey="monthLabel"
                stroke="#9E9892"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="#9E9892"
                fontSize={11}
                tickLine={false}
                domain={['auto', 'auto']}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 rounded-xl bg-[#201E1D] text-white text-xs space-y-1 shadow-lg border border-[#4D4845]">
                        <p className="font-semibold border-b border-[#4D4845] pb-1">{label} (Month {data.month})</p>
                        {data.actual !== null && (
                          <p className="text-[#F1997A] font-bold">
                            {profile.name}: {data.actual}
                          </p>
                        )}
                        <p className="text-[#DDD8D0] text-[11px]">97th Percentile: {data.p97}</p>
                        <p className="text-[#AECDB2] text-[11px]">50th (Median): {data.p50}</p>
                        <p className="text-[#DDD8D0] text-[11px]">3rd Percentile: {data.p3}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Percentile Curves */}
              <Line type="monotone" dataKey="p97" stroke="#DDD8D0" strokeDasharray="4 4" dot={false} strokeWidth={1} name="97th" />
              <Line type="monotone" dataKey="p85" stroke="#BFB9B2" strokeDasharray="2 2" dot={false} strokeWidth={1} name="85th" />
              <Line type="monotone" dataKey="p50" stroke="#5A9663" dot={false} strokeWidth={2} name="50th Median" />
              <Line type="monotone" dataKey="p15" stroke="#BFB9B2" strokeDasharray="2 2" dot={false} strokeWidth={1} name="15th" />
              <Line type="monotone" dataKey="p3" stroke="#DDD8D0" strokeDasharray="4 4" dot={false} strokeWidth={1} name="3rd" />

              {/* Baby's Actual Measurement Points */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#E2765A"
                strokeWidth={2.5}
                dot={{ r: 5, fill: '#E2765A', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#CB6145' }}
                connectNulls
                name="Baby Actual"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Measurement History Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs">
        <h4 className="text-xs font-semibold text-[#75706B] dark:text-[#9E9892] mb-3 uppercase tracking-wider">
          Growth Checkup Records ({growthRecords.length})
        </h4>

        {growthRecords.length === 0 ? (
          <p className="text-xs text-[#75706B] text-center py-5">
            No growth records entered yet.
          </p>
        ) : (
          <>
            {/* Mobile Card List View (< sm) */}
            <div className="sm:hidden space-y-2.5">
              {growthRecords.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl border border-[#EAE6DF] dark:border-[#2D2B33] bg-[#FAF8F5] dark:bg-[#18171C] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#201E1D] dark:text-[#FAF8F5]">
                        {r.date}
                      </span>
                      <span className="text-[11px] text-[#75706B] dark:text-[#9E9892] ml-2">
                        Day {r.ageInDays}
                      </span>
                    </div>

                    {userRole === 'parent' && (
                      <button
                        onClick={() => onDeleteGrowthRecord(r.id)}
                        className="p-1 rounded-lg text-[#75706B] hover:text-[#CB6145] dark:hover:text-[#F1997A] transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
                    <div className="p-2 rounded-lg bg-white dark:bg-[#201E26] border border-[#EAE6DF] dark:border-[#2D2B33]">
                      <span className="text-[10px] text-[#75706B] dark:text-[#9E9892] uppercase block font-semibold">Weight</span>
                      <span className="text-xs font-bold text-[#E2765A] tabular-nums">{r.weightKg.toFixed(2)} kg</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#201E26] border border-[#EAE6DF] dark:border-[#2D2B33]">
                      <span className="text-[10px] text-[#75706B] dark:text-[#9E9892] uppercase block font-semibold">Length</span>
                      <span className="text-xs font-bold text-[#201E1D] dark:text-[#FAF8F5] tabular-nums">{r.lengthCm.toFixed(1)} cm</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#201E26] border border-[#EAE6DF] dark:border-[#2D2B33]">
                      <span className="text-[10px] text-[#75706B] dark:text-[#9E9892] uppercase block font-semibold">Head</span>
                      <span className="text-xs font-bold text-[#201E1D] dark:text-[#FAF8F5] tabular-nums">{r.headCircumferenceCm.toFixed(1)} cm</span>
                    </div>
                  </div>

                  {r.notes && (
                    <p className="text-[11px] text-[#75706B] dark:text-[#9E9892] italic pt-0.5">
                      "{r.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#EAE6DF] dark:border-[#2D2B33] text-[#75706B] dark:text-[#9E9892] text-[11px] uppercase tracking-wider">
                    <th className="pb-2.5 pl-2 font-medium">Date</th>
                    <th className="pb-2.5 font-medium">Age</th>
                    <th className="pb-2.5 font-medium">Weight (kg)</th>
                    <th className="pb-2.5 font-medium">Length (cm)</th>
                    <th className="pb-2.5 font-medium">Head (cm)</th>
                    <th className="pb-2.5 font-medium">Notes</th>
                    {userRole === 'parent' && <th className="pb-2.5 text-right pr-2 font-medium">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE6DF] dark:divide-[#2D2B33]">
                  {growthRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-[#FAF8F5] dark:hover:bg-[#17161B] transition-colors duration-150">
                      <td className="py-2.5 pl-2 font-medium text-[#201E1D] dark:text-[#FAF8F5]">{r.date}</td>
                      <td className="py-2.5 text-[#75706B] dark:text-[#9E9892]">Day {r.ageInDays}</td>
                      <td className="py-2.5 font-bold text-[#E2765A] tabular-nums">{r.weightKg.toFixed(2)}</td>
                      <td className="py-2.5 text-[#201E1D] dark:text-[#FAF8F5] tabular-nums">{r.lengthCm.toFixed(1)}</td>
                      <td className="py-2.5 text-[#201E1D] dark:text-[#FAF8F5] tabular-nums">{r.headCircumferenceCm.toFixed(1)}</td>
                      <td className="py-2.5 text-[#75706B] dark:text-[#9E9892] italic max-w-xs truncate">{r.notes || '—'}</td>
                      {userRole === 'parent' && (
                        <td className="py-2.5 text-right pr-2">
                          <button
                            onClick={() => onDeleteGrowthRecord(r.id)}
                            className="p-1 rounded-lg text-[#75706B] hover:text-[#CB6145] dark:hover:text-[#F1997A] transition-colors duration-150"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* --- ADD MEASUREMENT MODAL (Mobile Bottom-Sheet & Desktop Centered) --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#1D1C22] border-t sm:border border-[#EAE6DF] dark:border-[#2D2B33] p-5 shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            {/* Mobile Sheet Drag Pill */}
            <div className="sm:hidden w-10 h-1 rounded-full bg-[#D5CFCE] dark:bg-[#3D3B44] mx-auto mb-3" />

            <h3 className="text-sm sm:text-base font-bold text-[#201E1D] dark:text-[#FAF8F5] mb-1">
              Add Pediatric Measurement
            </h3>
            <p className="text-xs text-[#75706B] dark:text-[#9E9892] mb-4">
              Enter measurements in standard metric units.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Measurement Date</label>
                <input
                  type="date"
                  required
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5] text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    required
                    placeholder="3.45"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Length (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    required
                    placeholder="51.5"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Head (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    required
                    placeholder="35.0"
                    value={headCm}
                    onChange={(e) => setHeadCm(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Clinical Notes</label>
                <textarea
                  rows={2}
                  placeholder="Doctor's comments, feeding assessment, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5] text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl font-semibold border border-[#EAE6DF] dark:border-[#2D2B33] text-[#4D4845] dark:text-[#DDD8D0] hover:bg-[#F2ECE3] dark:hover:bg-[#26242C] transition-colors duration-150 active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-xl font-semibold bg-[#E2765A] text-white hover:bg-[#CB6145] transition-colors duration-150 active:scale-[0.98]"
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
