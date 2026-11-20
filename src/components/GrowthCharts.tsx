'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  Plus,
  Trash2,
  Activity,
  Award,
  Stethoscope,
  Info,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  X,
  Scale,
  Ruler,
  Brain,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { GrowthRecord, ChildProfile } from '@/lib/types';
import { generateDoctorSummaryPdf } from '@/lib/pdfExport';
import { getWHOGrowthData, WHOGrowthPoint } from '@/lib/whoGrowthData';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

interface GrowthChartsProps {
  growthRecords: GrowthRecord[];
  profile: ChildProfile;
  onAddGrowthRecord: (record: Omit<GrowthRecord, 'id'>) => void;
  onDeleteGrowthRecord: (id: string) => void;
  userRole: 'parent' | 'family';
}

type GrowthMetric = 'weight' | 'length' | 'head';

export const GrowthCharts: React.FC<GrowthChartsProps> = ({
  growthRecords,
  profile,
  onAddGrowthRecord,
  onDeleteGrowthRecord,
  userRole,
}) => {
  const [activeMetric, setActiveMetric] = useState<GrowthMetric>('weight');
  const [isAddBottomSheetOpen, setIsAddBottomSheetOpen] = useState<boolean>(false);
  const [selectedRecordIndex, setSelectedRecordIndex] = useState<number | null>(null);

  // Form states for new measurement
  const [recordDate, setRecordDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [weightInput, setWeightInput] = useState<string>('');
  const [lengthInput, setLengthInput] = useState<string>('');
  const [headInput, setHeadInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Birth date and age calculations
  const birthDate = useMemo(() => new Date(profile.dob), [profile.dob]);

  // Sorted records by date
  const sortedRecords = useMemo(() => {
    return [...growthRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [growthRecords]);

  // Selected or latest record
  const latestRecord = sortedRecords[sortedRecords.length - 1];
  const activeRecord =
    selectedRecordIndex !== null && sortedRecords[selectedRecordIndex]
      ? sortedRecords[selectedRecordIndex]
      : latestRecord;

  const prevRecord = useMemo(() => {
    if (selectedRecordIndex !== null && selectedRecordIndex > 0) {
      return sortedRecords[selectedRecordIndex - 1];
    }
    return sortedRecords.length > 1 ? sortedRecords[sortedRecords.length - 2] : null;
  }, [sortedRecords, selectedRecordIndex]);

  // WHO Standards Data
  const whoPoints = useMemo(() => {
    return getWHOGrowthData(activeMetric, profile.gender || 'female');
  }, [activeMetric, profile.gender]);

  // Helper to calculate exact percentile estimate
  const calculateExactPercentile = (val: number, ageInMonths: number, metric: GrowthMetric): { pct: number; label: string; status: 'healthy' | 'warning' | 'alert' } => {
    if (!val || val <= 0) return { pct: 50, label: '50th Percentile (WHO Median)', status: 'healthy' };
    const roundedMonth = Math.min(24, Math.max(0, Math.round(ageInMonths)));
    const pt = whoPoints.find((p) => p.month === roundedMonth) || whoPoints[whoPoints.length - 1];

    if (val < pt.p3) {
      const p = Math.max(1, Math.round((val / pt.p3) * 3));
      return { pct: p, label: `< 3rd Percentile (Below Standard)`, status: 'warning' };
    }
    if (val < pt.p15) {
      const frac = (val - pt.p3) / (pt.p15 - pt.p3);
      const p = Math.round(3 + frac * 12);
      return { pct: p, label: `${p}th Percentile (Mildly Low)`, status: 'healthy' };
    }
    if (val < pt.p50) {
      const frac = (val - pt.p15) / (pt.p50 - pt.p15);
      const p = Math.round(15 + frac * 35);
      return { pct: p, label: `${p}th Percentile (Normal Healthy Range)`, status: 'healthy' };
    }
    if (val < pt.p85) {
      const frac = (val - pt.p50) / (pt.p85 - pt.p50);
      const p = Math.round(50 + frac * 35);
      return { pct: p, label: `${p}th Percentile (Normal Healthy Range)`, status: 'healthy' };
    }
    if (val < pt.p97) {
      const frac = (val - pt.p85) / (pt.p97 - pt.p85);
      const p = Math.round(85 + frac * 12);
      return { pct: p, label: `${p}th Percentile (Above Average)`, status: 'healthy' };
    }
    return { pct: 98, label: `> 97th Percentile (Above Standard)`, status: 'warning' };
  };

  // Current metric value & delta
  const metricConfig = useMemo(() => {
    switch (activeMetric) {
      case 'weight':
        return {
          title: 'Weight-for-Age',
          unit: 'kg',
          shortLabel: 'Weight',
          icon: Scale,
          color: '#44634B',
          accent: '#99462A',
          currentVal: activeRecord ? activeRecord.weightKg.toFixed(2) : '8.45',
          prevVal: prevRecord?.weightKg,
          valNumber: activeRecord?.weightKg || 8.45,
          yMin: 2,
          yMax: 14,
          yStep: 2,
        };
      case 'length':
        return {
          title: 'Length/Height-for-Age',
          unit: 'cm',
          shortLabel: 'Height',
          icon: Ruler,
          color: '#28587B',
          accent: '#D97757',
          currentVal: activeRecord ? activeRecord.lengthCm.toFixed(1) : '68.5',
          prevVal: prevRecord?.lengthCm,
          valNumber: activeRecord?.lengthCm || 68.5,
          yMin: 45,
          yMax: 90,
          yStep: 10,
        };
      case 'head':
        return {
          title: 'Head Circumference',
          unit: 'cm',
          shortLabel: 'Head Circ.',
          icon: Brain,
          color: '#5C4033',
          accent: '#E2765A',
          currentVal: activeRecord ? activeRecord.headCircumferenceCm.toFixed(1) : '43.2',
          prevVal: prevRecord?.headCircumferenceCm,
          valNumber: activeRecord?.headCircumferenceCm || 43.2,
          yMin: 30,
          yMax: 52,
          yStep: 5,
        };
    }
  }, [activeMetric, activeRecord, prevRecord]);

  // Delta calculation string
  const deltaInfo = useMemo(() => {
    if (!activeRecord || !prevRecord) {
      return { text: '+0.35 kg steady trajectory', isGain: true };
    }
    const curr =
      activeMetric === 'weight'
        ? activeRecord.weightKg
        : activeMetric === 'length'
        ? activeRecord.lengthCm
        : activeRecord.headCircumferenceCm;
    const prev =
      activeMetric === 'weight'
        ? prevRecord.weightKg
        : activeMetric === 'length'
        ? prevRecord.lengthCm
        : prevRecord.headCircumferenceCm;

    const diff = curr - prev;
    const diffFormatted = Math.abs(diff).toFixed(activeMetric === 'weight' ? 2 : 1);
    const text = `${diff >= 0 ? '+' : '-'}${diffFormatted} ${metricConfig.unit} since prior log`;
    return { text, isGain: diff >= 0 };
  }, [activeRecord, prevRecord, activeMetric, metricConfig.unit]);

  // Percentile info for active record
  const activeAgeMonths = activeRecord ? activeRecord.ageInDays / 30.4375 : 7;
  const activePercentile = useMemo(() => {
    return calculateExactPercentile(metricConfig.valNumber, activeAgeMonths, activeMetric);
  }, [metricConfig.valNumber, activeAgeMonths, activeMetric, whoPoints]);

  // Live WHO Percentile calculation inside Add Bottom Sheet
  const liveFormAgeMonths = useMemo(() => {
    const selectedD = new Date(recordDate);
    const diffDays = Math.max(0, Math.floor((selectedD.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)));
    return diffDays / 30.4375;
  }, [recordDate, birthDate]);

  const livePercentilePreview = useMemo(() => {
    const val =
      activeMetric === 'weight'
        ? parseFloat(weightInput)
        : activeMetric === 'length'
        ? parseFloat(lengthInput)
        : parseFloat(headInput);

    if (isNaN(val) || val <= 0) return null;
    return calculateExactPercentile(val, liveFormAgeMonths, activeMetric);
  }, [weightInput, lengthInput, headInput, activeMetric, liveFormAgeMonths, whoPoints]);

  // SVG Chart Coordinate mapping
  // ViewBox: 0 0 360 210
  // X: Month 0 -> 40, Month 12 -> 330
  // Y: yMax -> 25, yMin -> 180
  const chartWidth = 360;
  const chartHeight = 210;
  const padLeft = 40;
  const padRight = 330;
  const padTop = 22;
  const padBottom = 175;

  const mapX = (month: number) => {
    const clamped = Math.min(12, Math.max(0, month));
    return padLeft + (clamped / 12) * (padRight - padLeft);
  };

  const mapY = (val: number) => {
    const { yMin, yMax } = metricConfig;
    const clamped = Math.min(yMax, Math.max(yMin, val));
    const pct = (clamped - yMin) / (yMax - yMin);
    return padBottom - pct * (padBottom - padTop);
  };

  // Generate WHO Curves Path Data up to month 12
  const who12Months = useMemo(() => {
    return whoPoints.filter((p) => p.month <= 12);
  }, [whoPoints]);

  const path15to85 = useMemo(() => {
    if (who12Months.length === 0) return '';
    // Forward along p85
    let d = `M ${mapX(who12Months[0].month)} ${mapY(who12Months[0].p85)}`;
    for (let i = 1; i < who12Months.length; i++) {
      d += ` L ${mapX(who12Months[i].month)} ${mapY(who12Months[i].p85)}`;
    }
    // Backward along p15
    for (let i = who12Months.length - 1; i >= 0; i--) {
      d += ` L ${mapX(who12Months[i].month)} ${mapY(who12Months[i].p15)}`;
    }
    d += ' Z';
    return d;
  }, [who12Months, metricConfig]);

  const path50 = useMemo(() => {
    if (who12Months.length === 0) return '';
    let d = `M ${mapX(who12Months[0].month)} ${mapY(who12Months[0].p50)}`;
    for (let i = 1; i < who12Months.length; i++) {
      d += ` L ${mapX(who12Months[i].month)} ${mapY(who12Months[i].p50)}`;
    }
    return d;
  }, [who12Months, metricConfig]);

  // Child's Actual Trajectory Path
  const childTrajectoryPoints = useMemo(() => {
    return sortedRecords
      .map((r, idx) => {
        const month = r.ageInDays / 30.4375;
        const val =
          activeMetric === 'weight'
            ? r.weightKg
            : activeMetric === 'length'
            ? r.lengthCm
            : r.headCircumferenceCm;
        return {
          idx,
          record: r,
          month,
          val,
          cx: mapX(month),
          cy: mapY(val),
        };
      })
      .filter((p) => p.month <= 12.5);
  }, [sortedRecords, activeMetric, metricConfig]);

  const childPath = useMemo(() => {
    if (childTrajectoryPoints.length === 0) return '';
    let d = `M ${childTrajectoryPoints[0].cx} ${childTrajectoryPoints[0].cy}`;
    for (let i = 1; i < childTrajectoryPoints.length; i++) {
      d += ` L ${childTrajectoryPoints[i].cx} ${childTrajectoryPoints[i].cy}`;
    }
    return d;
  }, [childTrajectoryPoints]);

  // Handle Form Submit
  const handleAddMeasurementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weightInput);
    const l = parseFloat(lengthInput);
    const h = parseFloat(headInput);

    if (isNaN(w) && isNaN(l) && isNaN(h)) {
      showToast('Please enter at least one measurement');
      return;
    }

    const recDate = new Date(recordDate);
    const ageInDays = Math.max(0, Math.floor((recDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)));

    onAddGrowthRecord({
      childId: profile.id,
      date: recordDate,
      ageInDays,
      weightKg: !isNaN(w) ? w : latestRecord?.weightKg || 8.45,
      lengthCm: !isNaN(l) ? l : latestRecord?.lengthCm || 68.0,
      headCircumferenceCm: !isNaN(h) ? h : latestRecord?.headCircumferenceCm || 43.2,
      notes: notesInput.trim() || undefined,
    });

    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    showToast('New growth record logged! 📈');
    setWeightInput('');
    setLengthInput('');
    setHeadInput('');
    setNotesInput('');
    setIsAddBottomSheetOpen(false);
  };

  // Clean PDF Export
  const handleExportGrowthPdf = () => {
    try {
      generateDoctorSummaryPdf({
        profile,
        growthRecords: sortedRecords,
        vaccines: [],
        questions: [],
        symptoms: [],
      });
      showToast('Growth report PDF exported! 📄');
    } catch (err) {
      console.error(err);
      showToast('Error exporting PDF');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-reveal">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-200 max-w-[90vw]">
          <div className="bg-[#2D312E]/95 text-[#EFF2ED] dark:bg-[#FAF8F5] dark:text-[#191C1A] backdrop-blur-md px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2.5 text-xs font-semibold border border-white/10 dark:border-black/10">
            <CheckCircle className="w-4 h-4 text-[#C8EBCC] dark:text-[#44634B]" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 1. Header with Add CTA & PDF Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C8EBCC]/60 dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1] text-[11px] font-bold">
              <Activity className="w-3.5 h-3.5" />
              <span>WHO Child Growth Standards</span>
            </span>
            <span className="text-[11px] font-semibold text-[#424842] dark:text-[#9E9892]">
              {profile.gender === 'female' ? 'Girls 0–24M' : 'Boys 0–24M'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#191C1A] dark:text-[#FAF8F5]">
            Growth Trajectory &amp; Percentiles
          </h2>
          <p className="text-xs text-[#424842] dark:text-[#9E9892] mt-0.5">
            Clinical trajectory tracker for {profile.name} with WHO reference bands
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportGrowthPdf}
            className="tap-feedback min-h-[44px] px-3.5 py-2 rounded-full bg-white dark:bg-[#1E2520] border border-[#E8E4DC] dark:border-[#2D382F] text-[#191C1A] dark:text-[#FAF8F5] text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 hover:bg-[#F1F4F0] dark:hover:bg-[#263129] cursor-pointer"
            title="Export Doctor PDF"
          >
            <Download className="w-4 h-4 text-[#44634B] dark:text-[#ADCFB1]" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddBottomSheetOpen(true)}
            className="tap-feedback min-h-[44px] px-4 py-2 rounded-full bg-[#44634B] hover:bg-[#344738] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Growth</span>
          </button>
        </div>
      </div>

      {/* 2. Segmented Metric Switcher: Weight / Height / Head Circumference */}
      <div className="p-1.5 bg-[#F1F4F0] dark:bg-[#161C17] rounded-full flex items-center justify-between gap-1 border border-[#E0E3DF] dark:border-[#2D382F] select-none">
        {[
          { id: 'weight' as const, label: 'Weight', unit: 'kg', icon: Scale },
          { id: 'length' as const, label: 'Height', unit: 'cm', icon: Ruler },
          { id: 'head' as const, label: 'Head Circ.', unit: 'cm', icon: Brain },
        ].map((tab) => {
          const isActive = activeMetric === tab.id;
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveMetric(tab.id);
                setSelectedRecordIndex(null);
              }}
              className={`tap-feedback flex-1 min-h-[44px] py-2 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-[#263129] text-[#44634B] dark:text-[#ADCFB1] shadow-xs'
                  : 'text-[#424842] dark:text-[#9E9892] hover:text-[#191C1A] dark:hover:text-[#FAF8F5]'
              }`}
            >
              <IconComponent className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              <span className="font-normal opacity-70">({tab.unit})</span>
            </button>
          );
        })}
      </div>

      {/* 3. Metric Spotlight Card */}
      <div className="relative overflow-hidden bg-white dark:bg-[#1E2520] rounded-[24px] p-5 shadow-xs border border-[#E8E4DC] dark:border-[#2D382F]">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#424842] dark:text-[#9E9892] uppercase tracking-wider">
              {metricConfig.title}
            </span>
            {activeRecord && (
              <span className="text-[11px] text-stone-400">
                • {new Date(activeRecord.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-[#C8EBCC]/60 dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1] px-3 py-1 rounded-full text-xs font-bold">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{activePercentile.label.split('(')[0].trim()}</span>
          </div>
        </div>

        <div className="flex items-baseline gap-2.5 mt-2">
          <span className="text-4xl sm:text-5xl font-extrabold text-[#191C1A] dark:text-[#FAF8F5] tracking-tight tabular-nums">
            {metricConfig.currentVal}
          </span>
          <span className="text-xl font-bold text-[#424842] dark:text-[#9E9892]">
            {metricConfig.unit}
          </span>
        </div>

        <div className="flex items-center gap-2.5 pt-2 flex-wrap text-xs">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold ${
              deltaInfo.isGain
                ? 'bg-[#C8EBCC] dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1]'
                : 'bg-[#FFDBD0] dark:bg-[#543830] text-[#762C12] dark:text-[#FFB59E]'
            }`}
          >
            {deltaInfo.isGain ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            <span>{deltaInfo.text}</span>
          </span>

          <span className="text-stone-500 dark:text-stone-400">
            {activePercentile.label.includes('Normal')
              ? 'Tracking right in the optimal WHO median corridor'
              : 'Consistent steady development'}
          </span>
        </div>
      </div>

      {/* 4. WHO Growth Percentile SVG Chart with Interactive Touch Points */}
      <div className="bg-white dark:bg-[#1E2520] rounded-[24px] p-4 sm:p-5 shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#191C1A] dark:text-[#FAF8F5]">
              WHO {profile.gender === 'female' ? 'Girls' : 'Boys'} 0–12 Months Trajectory
            </h3>
            <p className="text-xs text-[#424842] dark:text-[#9E9892]">
              Tap any point to inspect measurement &amp; percentile
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#F1F4F0] dark:bg-[#263129] flex items-center justify-center text-[#44634B] dark:text-[#ADCFB1]">
            <Info className="w-4 h-4" />
          </div>
        </div>

        {/* SVG Container */}
        <div className="relative w-full h-56 pt-1 select-none">
          <svg className="w-full h-full overflow-visible" fill="none" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            <defs>
              <linearGradient id="growthBandGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#C8EBCC" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#ADCFB1" stopOpacity="0.18" />
              </linearGradient>
              <linearGradient id="childTrajectoryGrad" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#99462A" />
                <stop offset="100%" stopColor="#D97757" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines & Y-Axis Labels */}
            <g className="opacity-40">
              {[0, 1, 2, 3, 4].map((stepIdx) => {
                const { yMin, yMax } = metricConfig;
                const val = yMin + ((yMax - yMin) / 4) * stepIdx;
                const yPos = mapY(val);
                return (
                  <g key={stepIdx}>
                    <line
                      stroke="#E0E3DF"
                      strokeDasharray="2 3"
                      strokeWidth="1"
                      x1={padLeft}
                      x2={padRight}
                      y1={yPos}
                      y2={yPos}
                    />
                    <text
                      className="fill-[#424842] dark:fill-[#9E9892] text-[10px] font-medium"
                      textAnchor="end"
                      x={padLeft - 6}
                      y={yPos + 3}
                    >
                      {val.toFixed(metricConfig.unit === 'kg' ? 0 : 0)}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* 15th - 85th Percentile Healthy Band */}
            {path15to85 && <path d={path15to85} fill="url(#growthBandGrad)" />}

            {/* 50th Median Curve */}
            {path50 && (
              <path
                d={path50}
                fill="none"
                stroke="#44634B"
                strokeDasharray="4 3"
                strokeOpacity="0.75"
                strokeWidth="1.5"
              />
            )}

            {/* Child's Actual Trajectory Line */}
            {childPath && (
              <path
                d={childPath}
                fill="none"
                stroke="url(#childTrajectoryGrad)"
                strokeLinecap="round"
                strokeWidth="3"
              />
            )}

            {/* Interactive Data Points */}
            {childTrajectoryPoints.map((pt) => {
              const isSelected =
                selectedRecordIndex !== null
                  ? selectedRecordIndex === pt.idx
                  : pt.idx === sortedRecords.length - 1;

              return (
                <g
                  key={pt.idx}
                  onClick={() => setSelectedRecordIndex(pt.idx)}
                  className="cursor-pointer"
                  style={{ touchAction: 'manipulation' }}
                >
                  {/* Invisible larger touch target (44px) */}
                  <circle cx={pt.cx} cy={pt.cy} r="22" fill="transparent" />

                  {isSelected && (
                    <circle cx={pt.cx} cy={pt.cy} fill="#FE9572" fillOpacity="0.35" r="11">
                      <animate
                        attributeName="r"
                        values="8;13;8"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  <circle
                    cx={pt.cx}
                    cy={pt.cy}
                    fill="#99462A"
                    r={isSelected ? 5.5 : 4}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                </g>
              );
            })}

            {/* Floating Info Tooltip for Selected Point */}
            {(() => {
              const activePt =
                childTrajectoryPoints.find((p) =>
                  selectedRecordIndex !== null
                    ? p.idx === selectedRecordIndex
                    : p.idx === sortedRecords.length - 1
                ) || childTrajectoryPoints[childTrajectoryPoints.length - 1];

              if (!activePt) return null;

              // Tooltip positioning
              const tooltipX = Math.min(270, Math.max(10, activePt.cx - 48));
              const tooltipY = Math.max(8, activePt.cy - 48);

              return (
                <g transform={`translate(${tooltipX}, ${tooltipY})`} className="pointer-events-none">
                  <rect
                    fill="#2D312E"
                    height="36"
                    rx="8"
                    width="96"
                    x="0"
                    y="0"
                    className="drop-shadow-md"
                  />
                  <polygon fill="#2D312E" points="48,36 53,41 43,41" />
                  <text
                    className="fill-[#EFF2ED] text-[10px] font-bold"
                    textAnchor="middle"
                    x="48"
                    y="15"
                  >
                    {Math.round(activePt.month)}m: {activePt.val} {metricConfig.unit}
                  </text>
                  <text
                    className="fill-[#ADCFB1] text-[9.5px] font-bold"
                    textAnchor="middle"
                    x="48"
                    y="28"
                  >
                    {activePercentile.pct}th Percentile
                  </text>
                </g>
              );
            })()}

            {/* X-Axis Month Markers */}
            <g className="fill-[#424842] dark:fill-[#9E9892] text-[10px] font-medium">
              {[0, 2, 4, 6, 8, 10, 12].map((m) => (
                <text key={m} textAnchor="middle" x={mapX(m)} y={padBottom + 16}>
                  {m === 0 ? 'Birth' : `${m}m`}
                </text>
              ))}
            </g>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between pt-2.5 border-t border-[#E0E3DF]/50 dark:border-[#2D382F] text-xs text-[#424842] dark:text-[#9E9892]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#99462A]" />
            <span className="font-bold text-[#191C1A] dark:text-[#FAF8F5]">{profile.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2 rounded-xs bg-[#44634B]/40" />
            <span>15–85th Band</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 border-b-2 border-dashed border-[#44634B]" />
            <span>50th Median</span>
          </div>
        </div>
      </div>

      {/* 5. Measurements History Table */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5]">
            Past Measurement Logs
          </h3>
          <span className="text-xs text-[#424842] dark:text-[#9E9892]">
            {sortedRecords.length} checkups
          </span>
        </div>

        <div className="space-y-2">
          {sortedRecords.map((r, i) => {
            const ageMonths = Math.round(r.ageInDays / 30.4375);
            const isSelected = selectedRecordIndex === i;

            return (
              <div
                key={r.id}
                onClick={() => setSelectedRecordIndex(i)}
                className={`tap-feedback p-3.5 rounded-2xl flex items-center justify-between shadow-xs border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#F1F4F0] dark:bg-[#202822] border-[#44634B] dark:border-[#ADCFB1]'
                    : 'bg-white dark:bg-[#1E2520] border-[#E8E4DC] dark:border-[#2D382F]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#FFDBD0]/60 dark:bg-[#3E1C12]/60 text-[#762C12] dark:text-[#FFB59E] flex items-center justify-center text-xs font-bold shrink-0">
                    {ageMonths}m
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5]">
                        {r.weightKg} kg • {r.lengthCm} cm • {r.headCircumferenceCm} cm
                      </span>
                      <span className="text-[10px] font-bold text-[#44634B] dark:text-[#ADCFB1] bg-[#C8EBCC]/50 dark:bg-[#203D24]/50 px-2 py-0.5 rounded-full">
                        WHO Aligned
                      </span>
                    </div>
                    <span className="text-[11px] text-[#424842] dark:text-[#9E9892] block mt-0.5 truncate">
                      {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {r.notes ? ` • ${r.notes}` : ''}
                    </span>
                  </div>
                </div>

                {sortedRecords.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteGrowthRecord(r.id);
                    }}
                    className="tap-feedback p-2 text-stone-400 hover:text-rose-500 transition-colors"
                    title="Delete log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Clean Bottom Sheet for Logging New Measurements with Immediate WHO Calculation */}
      {isAddBottomSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#1E2520] rounded-t-[28px] sm:rounded-[28px] border border-[#E8E4DC] dark:border-[#2D382F] p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
            {/* Grab handle */}
            <div className="w-10 h-1 bg-stone-300 dark:bg-stone-600 rounded-full mx-auto mb-1 sm:hidden" />

            <div className="flex items-center justify-between border-b border-[#E8E4DC] dark:border-[#2D382F] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-[#C8EBCC] dark:bg-[#203D24] text-[#44634B] dark:text-[#ADCFB1] flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#191C1A] dark:text-[#FAF8F5]">
                    Log Growth Measurement
                  </h3>
                  <p className="text-[11px] text-[#424842] dark:text-[#9E9892]">
                    Immediate WHO percentile calculation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBottomSheetOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMeasurementSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">
                  Measurement Date
                </label>
                <input
                  type="date"
                  required
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-sm font-semibold"
                />
              </div>

              {/* 3 Metric Inputs */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="8.45"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="68.0"
                    value={lengthInput}
                    onChange={(e) => setLengthInput(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">
                    Head (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="43.2"
                    value={headInput}
                    onChange={(e) => setHeadInput(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] font-bold text-sm"
                  />
                </div>
              </div>

              {/* Immediate Real-Time WHO Percentile Feedback Box */}
              {livePercentilePreview ? (
                <div className="p-3 rounded-2xl bg-[#C8EBCC]/40 dark:bg-[#203D24]/50 border border-[#44634B]/30 flex items-center justify-between gap-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#44634B] dark:text-[#ADCFB1] shrink-0" />
                    <div>
                      <span className="font-bold text-[#191C1A] dark:text-[#FAF8F5] block">
                        {livePercentilePreview.pct}th Percentile ({activeMetric.toUpperCase()})
                      </span>
                      <span className="text-[11px] text-[#424842] dark:text-[#ADCFB1]">
                        {livePercentilePreview.label}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[#44634B] dark:text-[#ADCFB1] shrink-0">
                    WHO Standard
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-[#F1F4F0] dark:bg-[#161C17] border border-[#E0E3DF] dark:border-[#2D382F] text-[11px] text-[#424842] dark:text-[#9E9892]">
                  Type a measurement above to preview instant WHO percentile ranking for age {Math.round(liveFormAgeMonths)} months.
                </div>
              )}

              <div>
                <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">
                  Pediatrician Advice / Clinical Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. 6-Month Wellness Checkup with Dr. Morrison"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddBottomSheetOpen(false)}
                  className="tap-feedback flex-1 min-h-[48px] rounded-full border border-stone-200 dark:border-stone-700 font-bold text-stone-600 dark:text-stone-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tap-feedback flex-1 min-h-[48px] rounded-full bg-[#44634B] hover:bg-[#344738] text-white font-bold shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
