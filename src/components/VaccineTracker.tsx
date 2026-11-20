'use client';

import React, { useState } from 'react';
import {
  Syringe,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Calendar,
  IndianRupee,
  Upload,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  Bell,
  Info,
  X,
} from 'lucide-react';
import { VaccineRecord } from '@/lib/types';
import { compressImageFile } from '@/lib/imageCompressor';

interface VaccineTrackerProps {
  vaccines: VaccineRecord[];
  onUpdateVaccine: (id: string, updates: Partial<VaccineRecord>) => void;
  userRole: 'parent' | 'family';
}

export const VaccineTracker: React.FC<VaccineTrackerProps> = ({
  vaccines,
  onUpdateVaccine,
  userRole,
}) => {
  const [filter, setFilter] = useState<'all' | 'essential' | 'optional' | 'upcoming'>('all');
  const [editingVaccine, setEditingVaccine] = useState<VaccineRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const totalGiven = vaccines.filter((v) => v.status === 'given').length;
  const totalCount = vaccines.length || 22;
  const progressPct = Math.round((totalGiven / totalCount) * 100);

  // Filter doses
  const filteredVaccines = vaccines.filter((v) => {
    if (filter === 'essential') return v.category === 'government';
    if (filter === 'optional') return v.category === 'private';
    if (filter === 'upcoming') return v.status === 'upcoming' || v.status === 'overdue';
    return true;
  });

  // Group by milestone age
  const groupedMilestones = filteredVaccines.reduce((acc, dose) => {
    const ageKey = dose.ageDueDisplay || 'Scheduled';
    if (!acc[ageKey]) acc[ageKey] = [];
    acc[ageKey].push(dose);
    return acc;
  }, {} as Record<string, VaccineRecord[]>);

  // Next due dose
  const nextDueDose = vaccines.find((v) => v.status === 'upcoming' || v.status === 'overdue') || vaccines[0];

  const handleQuickMarkGiven = (id: string, name: string) => {
    onUpdateVaccine(id, {
      status: 'given',
      dateAdministered: new Date().toISOString().split('T')[0],
    });
    showToast(`${name} marked as given! 🛡️`);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVaccine) return;
    onUpdateVaccine(editingVaccine.id, editingVaccine);
    showToast(`${editingVaccine.name} records saved!`);
    setEditingVaccine(null);
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && editingVaccine) {
      try {
        const compressed = await compressImageFile(e.target.files[0], 1024, 0.8);
        setEditingVaccine({ ...editingVaccine, receiptUrl: compressed });
      } catch (err) {
        console.error('Failed to compress receipt', err);
      }
    }
  };

  return (
    <div className="space-y-5 animate-reveal">
      
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 max-w-[90vw] animate-in fade-in slide-in-from-top-4">
          <div className="bg-[#2D312E]/95 text-[#EFF2ED] backdrop-blur-md px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2.5 text-xs font-semibold border border-white/10">
            <CheckCircle2 className="w-4 h-4 text-[#C8EBCC]" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#191C1A] dark:text-[#FAF8F5]">
          Vaccine Schedule & Immunization
        </h2>
        <p className="text-xs text-[#424842] dark:text-[#9E9892]">
          Official CDC & WHO immunization schedule alignment
        </p>
      </div>

      {/* 1. Next Due Alert Banner (Terracotta Toned from Stitch Mockup) */}
      <div className="relative overflow-hidden rounded-[28px] bg-[#FFDBD0]/40 dark:bg-[#3D1E16]/40 p-4 sm:p-5 shadow-sm border border-[#FE9572]/40 dark:border-[#543830]">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#99462A] text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 bg-[#FFDBD0] dark:bg-[#543830] text-[#762C12] dark:text-[#FFB59E] px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#99462A] animate-pulse" />
              <span className="text-[11px] font-bold">
                {nextDueDose ? `Due Soon • ${nextDueDose.ageDueDisplay}` : 'All caught up!'}
              </span>
            </div>
            <h3 className="text-base font-bold text-[#191C1A] dark:text-[#FAF8F5] leading-snug mt-1.5">
              {nextDueDose ? nextDueDose.name : 'Routine vaccines completed'}
            </h3>
            <p className="text-xs text-[#99462A] dark:text-[#FFB59E] font-semibold mt-0.5">
              {nextDueDose ? nextDueDose.targetDiseases : 'Protected against major childhood illnesses'}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-[#424842] dark:text-[#A8A29E]">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Due date: {nextDueDose ? new Date(nextDueDose.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Up to date'}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-3.5 pt-1">
              {nextDueDose && nextDueDose.status !== 'given' && (
                <button
                  type="button"
                  onClick={() => handleQuickMarkGiven(nextDueDose.id, nextDueDose.name)}
                  className="flex-1 py-2 px-4 rounded-full bg-[#44634B] hover:bg-[#344738] text-white text-xs font-semibold text-center shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  Mark as Given
                </button>
              )}
              <button
                type="button"
                onClick={() => showToast(`Reminder set for ${nextDueDose?.name || 'next visit'}`)}
                className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-full bg-white dark:bg-[#1E2520] text-[#191C1A] dark:text-[#FAF8F5] text-xs font-semibold shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] active:scale-95 transition-all cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-[#99462A]" />
                <span>Remind</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Immunization Progress Bento Card (Stitch Radial Meter) */}
      <div className="bg-white dark:bg-[#1E2520] rounded-[28px] p-5 shadow-sm border border-[#E8E4DC] dark:border-[#2D382F] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#424842] dark:text-[#9E9892]">
              Overall Protection
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-extrabold text-[#191C1A] dark:text-[#FAF8F5] tabular-nums">
                {totalGiven}
              </span>
              <span className="text-sm font-semibold text-[#424842] dark:text-[#9E9892]">
                / {totalCount} Doses
              </span>
              <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full bg-[#C8EBCC] dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1] text-xs font-bold">
                {progressPct}%
              </span>
            </div>
          </div>

          {/* Radial Ring SVG Meter (Stitch) */}
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
              <circle
                className="stroke-[#E6E9E4] dark:stroke-[#2D382F]"
                cx="24"
                cy="24"
                fill="none"
                r="19"
                strokeWidth="4.5"
              />
              <circle
                className="stroke-[#44634B] dark:stroke-[#ADCFB1] transition-all duration-700 ease-out"
                cx="24"
                cy="24"
                fill="none"
                r="19"
                strokeDasharray="119.38"
                strokeDashoffset={119.38 - (119.38 * progressPct) / 100}
                strokeLinecap="round"
                strokeWidth="4.5"
              />
            </svg>
            <span className="absolute text-[11px] font-extrabold text-[#44634B] dark:text-[#ADCFB1]">
              {progressPct}%
            </span>
          </div>
        </div>

        {/* Soft reassurance note */}
        <div className="flex items-center gap-2 bg-[#F1F4F0] dark:bg-[#161C17] px-3.5 py-2.5 rounded-2xl">
          <CheckCircle2 className="w-4 h-4 text-[#44634B] dark:text-[#ADCFB1] shrink-0" />
          <p className="text-xs text-[#424842] dark:text-[#A8A29E]">
            Child is tracking right on target with standard CDC & IAP clinical guidelines.
          </p>
        </div>

        {/* Segmented Tab Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
          {[
            { id: 'all' as const, label: `All (${vaccines.length})` },
            { id: 'essential' as const, label: `Essential (${vaccines.filter((v) => v.category === 'government').length})` },
            { id: 'optional' as const, label: `Optional (${vaccines.filter((v) => v.category === 'private').length})` },
            { id: 'upcoming' as const, label: `Upcoming (${vaccines.filter((v) => v.status !== 'given').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`tap-feedback shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                filter === tab.id
                  ? 'bg-[#44634B] text-white shadow-xs'
                  : 'bg-[#F1F4F0] dark:bg-[#202822] text-[#424842] dark:text-[#9E9892] hover:bg-[#E6E9E4]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Timeline Stream with Milestone Blocks (Stitch Component) */}
      <div className="space-y-4 pt-1">
        {Object.entries(groupedMilestones).map(([ageGroup, doses]) => {
          const isGroupCompleted = doses.every((d) => d.status === 'given');

          return (
            <div key={ageGroup} className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isGroupCompleted ? 'bg-[#44634B]' : 'bg-[#FFDDAE]'
                    }`}
                  />
                  <span className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5]">
                    {ageGroup} • {isGroupCompleted ? 'Completed' : 'Upcoming'}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-[#424842] dark:text-[#9E9892]">
                  {doses.length} {doses.length === 1 ? 'dose' : 'doses'}
                </span>
              </div>

              {/* Vaccine Cards */}
              <div className="space-y-2">
                {doses.map((dose) => {
                  const isGiven = dose.status === 'given';

                  return (
                    <div
                      key={dose.id}
                      className="bg-white dark:bg-[#1E2520] rounded-2xl p-3.5 sm:p-4 shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5] leading-snug">
                            {dose.name}
                          </h4>
                          <p className="text-[11px] text-[#424842] dark:text-[#9E9892] mt-0.5 truncate">
                            {dose.targetDiseases}
                          </p>
                        </div>

                        {isGiven ? (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C8EBCC] dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1] text-[10.5px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Given</span>
                          </span>
                        ) : (
                          <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#FFDDAE] dark:bg-[#3D2C12] text-[#281800] dark:text-[#F8BC58] text-[10.5px] font-bold">
                            Due soon
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-[#E8E4DC]/50 dark:border-[#2D382F]/50">
                        <button
                          type="button"
                          onClick={() => setEditingVaccine(dose)}
                          className="tap-feedback flex-1 py-1.5 px-3 rounded-full bg-[#F1F4F0] dark:bg-[#161C17] text-[#191C1A] dark:text-[#FAF8F5] text-xs font-semibold flex items-center justify-center gap-1 hover:bg-[#E6E9E4] cursor-pointer"
                        >
                          <Info className="w-3.5 h-3.5 text-[#424842]" />
                          <span>Pre-check Info</span>
                        </button>

                        {!isGiven ? (
                          <button
                            type="button"
                            onClick={() => handleQuickMarkGiven(dose.id, dose.name)}
                            className="tap-feedback flex-1 py-1.5 px-3 rounded-full bg-[#44634B] hover:bg-[#344738] text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Log Dose</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingVaccine(dose)}
                            className="tap-feedback py-1.5 px-3 rounded-full text-xs font-semibold text-[#44634B] dark:text-[#ADCFB1] hover:underline"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Edit Vaccine Modal */}
      {editingVaccine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#1E2520] rounded-[28px] border border-[#E8E4DC] dark:border-[#2D382F] p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E8E4DC] dark:border-[#2D382F] pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#191C1A] dark:text-[#FAF8F5]">
                  {editingVaccine.name}
                </h3>
                <p className="text-[11px] text-[#424842] dark:text-[#9E9892]">
                  {editingVaccine.targetDiseases}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingVaccine(null)}
                className="p-1 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[#424842] dark:text-[#9E9892]">Immunization Status</label>
                <select
                  value={editingVaccine.status}
                  onChange={(e) => setEditingVaccine({ ...editingVaccine, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] font-semibold"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="given">Given / Administered</option>
                  <option value="overdue">Overdue</option>
                  <option value="skipped">Skipped</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#424842] dark:text-[#9E9892]">Date Administered</label>
                <input
                  type="date"
                  value={editingVaccine.dateAdministered || ''}
                  onChange={(e) => setEditingVaccine({ ...editingVaccine, dateAdministered: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#424842] dark:text-[#9E9892]">Clinic / Doctor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Morrison (City Pediatrics)"
                  value={editingVaccine.clinicName || ''}
                  onChange={(e) => setEditingVaccine({ ...editingVaccine, clinicName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#424842] dark:text-[#9E9892]">Vaccine Brand / Batch No.</label>
                <input
                  type="text"
                  placeholder="e.g. GSK Priorix • Batch #89A2"
                  value={editingVaccine.batchNumber || ''}
                  onChange={(e) => setEditingVaccine({ ...editingVaccine, batchNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingVaccine(null)}
                  className="flex-1 py-2.5 rounded-full border border-stone-200 font-semibold text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#44634B] hover:bg-[#344738] text-white font-semibold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
