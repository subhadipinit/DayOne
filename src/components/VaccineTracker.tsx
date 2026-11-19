'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  IndianRupee,
  Building2,
  Syringe,
  Check,
  ChevronRight,
  Upload,
  Receipt,
  Info,
  ExternalLink,
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
  const [filter, setFilter] = useState<'all' | 'government' | 'private' | 'upcoming' | 'given'>('all');
  const [editingVaccine, setEditingVaccine] = useState<VaccineRecord | null>(null);

  // Categorized counts
  const govtVaccines = vaccines.filter((v) => v.category === 'government');
  const privateVaccines = vaccines.filter((v) => v.category === 'private');

  // Stats calculation
  const totalGiven = vaccines.filter((v) => v.status === 'given').length;
  const totalPrivateSpent = vaccines
    .filter((v) => v.category === 'private' && v.status === 'given' && v.costInr)
    .reduce((sum, v) => sum + (v.costInr || 0), 0);
  
  const estimatedTotalPrivate = privateVaccines.reduce((sum, v) => sum + (v.costInr || 0), 0);

  // All pending vaccines (upcoming or overdue), sorted by due date ascending
  const pendingVaccines = vaccines
    .filter((v) => v.status === 'upcoming' || v.status === 'overdue')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Group pending vaccines by unique session date (YYYY-MM-DD)
  const sessionDates: string[] = [];
  const sessionMap = new Map<string, VaccineRecord[]>();

  pendingVaccines.forEach((v) => {
    const dateKey = v.dueDate.split('T')[0];
    if (!sessionMap.has(dateKey)) {
      sessionMap.set(dateKey, []);
      sessionDates.push(dateKey);
    }
    sessionMap.get(dateKey)!.push(v);
  });

  // Nearest upcoming session
  const nearestDateKey = sessionDates[0] || null;
  const nextSessionVaccines = nearestDateKey ? sessionMap.get(nearestDateKey) || [] : [];

  // Active selected session for the "upcoming" tab:
  // 'nearest' (default: the immediate upcoming session showing all multiple doses due on that date)
  // or a specific dateKey from sessionDates, or 'all_future'
  const [selectedUpcomingSession, setSelectedUpcomingSession] = useState<string>('nearest');

  // Filtered vaccines list
  const filteredVaccines = vaccines.filter((v) => {
    if (filter === 'government') return v.category === 'government';
    if (filter === 'private') return v.category === 'private';
    if (filter === 'upcoming') {
      if (selectedUpcomingSession === 'all_future') {
        return v.status === 'upcoming' || v.status === 'overdue';
      }
      const targetDate = selectedUpcomingSession === 'nearest' ? nearestDateKey : selectedUpcomingSession;
      if (!targetDate) return false;
      return (v.status === 'upcoming' || v.status === 'overdue') && v.dueDate.split('T')[0] === targetDate;
    }
    if (filter === 'given') return v.status === 'given';
    return true;
  });

  const activeTargetDate = selectedUpcomingSession === 'nearest' ? nearestDateKey : selectedUpcomingSession;
  const currentSessionDoses = activeTargetDate && sessionMap.has(activeTargetDate) ? sessionMap.get(activeTargetDate)! : [];
  const currentSessionAge = currentSessionDoses[0]?.ageDueDisplay || 'Upcoming';
  const currentSessionDateFormatted = activeTargetDate
    ? new Date(activeTargetDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVaccine) return;
    onUpdateVaccine(editingVaccine.id, editingVaccine);
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
    <div className="space-y-5">
      
      {/* Top Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Next Due Metric: Shows Multiple Vaccines if due on same date */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#75706B] dark:text-[#9E9892]">
              Next Scheduled Visit
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FDF6E2] dark:bg-[#292416] flex items-center justify-center text-[#6E4D05] dark:text-[#EECD85]">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          {nextSessionVaccines.length > 0 ? (
            <div>
              <div className="flex items-baseline justify-between gap-1">
                <p className="font-bold text-sm text-[#201E1D] dark:text-[#FAF8F5] truncate">
                  {nextSessionVaccines[0].ageDueDisplay} Session
                </p>
                <span className="text-[10px] font-semibold text-[#8A3510] dark:text-[#F8BCA0] bg-[#FFF0E6] dark:bg-[#2D2422] px-2 py-0.5 rounded-full border border-[#FCDCCB] dark:border-[#543830]">
                  {nextSessionVaccines.length} {nextSessionVaccines.length === 1 ? 'dose' : 'doses due'}
                </span>
              </div>
              <p className="text-xs text-[#75706B] dark:text-[#9E9892] mt-0.5">
                Due: {new Date(nextSessionVaccines[0].dueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>

              {/* Multiple doses list on this same date */}
              <div className="flex flex-wrap gap-1 mt-2">
                {nextSessionVaccines.map((v) => (
                  <span
                    key={v.id}
                    title={v.name}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                      v.category === 'government'
                        ? 'bg-[#EDF5EE] text-[#23522A] border-[#CFE2D1] dark:bg-[#1A2E1F] dark:text-[#AECDB2] dark:border-[#2D4A33]'
                        : 'bg-[#FFF0E6] text-[#8A3510] border-[#FCDCCB] dark:bg-[#2D2422] dark:text-[#F8BCA0] dark:border-[#543830]'
                    }`}
                  >
                    {v.code}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs font-medium text-[#23522A] dark:text-[#AECDB2]">All scheduled doses completed.</p>
          )}
        </div>

        {/* Immunization Progress */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#75706B] dark:text-[#9E9892]">
              Immunization Progress
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#EDF5EE] dark:bg-[#19261C] flex items-center justify-center text-[#23522A] dark:text-[#AECDB2]">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-[#201E1D] dark:text-[#FAF8F5] tabular-nums">
              {totalGiven}
            </span>
            <span className="text-xs text-[#75706B] dark:text-[#9E9892]">
              of {vaccines.length} total doses ({govtVaccines.length} free + {privateVaccines.length} private)
            </span>
          </div>
          <div className="w-full bg-[#EAE6DF] dark:bg-[#26242C] h-2 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-[#5A9663] h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.round((totalGiven / (vaccines.length || 1)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Private Vaccine Out-of-Pocket */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#75706B] dark:text-[#9E9892]">
              Private Clinic Out-of-Pocket
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#EEF5FC] dark:bg-[#172330] flex items-center justify-center text-[#184F7D] dark:text-[#A9CBED]">
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold text-[#201E1D] dark:text-[#FAF8F5] tabular-nums">
            ₹{totalPrivateSpent.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-[#75706B] dark:text-[#9E9892] mt-0.5">
            Spent so far (Est. ~₹{estimatedTotalPrivate.toLocaleString('en-IN')} for all private shots)
          </p>
        </div>

      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#F2ECE3] dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] overflow-x-auto max-w-full">
          
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150 shrink-0 ${
              filter === 'all'
                ? 'bg-[#E2765A] text-white shadow-xs'
                : 'text-[#75706B] dark:text-[#9E9892] hover:text-[#201E1D] dark:hover:text-white'
            }`}
          >
            All Doses ({vaccines.length})
          </button>

          <button
            onClick={() => setFilter('government')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors duration-150 shrink-0 ${
              filter === 'government'
                ? 'bg-[#23522A] text-white shadow-xs'
                : 'text-[#23522A] dark:text-[#AECDB2] hover:bg-[#E2EDE3] dark:hover:bg-[#203323]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>WB Govt (Free • {govtVaccines.length})</span>
          </button>

          <button
            onClick={() => setFilter('private')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors duration-150 shrink-0 ${
              filter === 'private'
                ? 'bg-[#8A3510] text-white shadow-xs'
                : 'text-[#8A3510] dark:text-[#F8BCA0] hover:bg-[#FEEAE0] dark:hover:bg-[#33221E]'
            }`}
          >
            <Syringe className="w-3.5 h-3.5" />
            <span>Private Only (Must Buy • {privateVaccines.length})</span>
          </button>

          <button
            onClick={() => {
              setFilter('upcoming');
              setSelectedUpcomingSession('nearest');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors duration-150 shrink-0 ${
              filter === 'upcoming'
                ? 'bg-[#E2765A] text-white shadow-xs'
                : 'text-[#75706B] dark:text-[#9E9892] hover:text-[#201E1D] dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Upcoming ({nextSessionVaccines.length} due next)</span>
          </button>

          <button
            onClick={() => setFilter('given')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150 shrink-0 ${
              filter === 'given'
                ? 'bg-[#E2765A] text-white shadow-xs'
                : 'text-[#75706B] dark:text-[#9E9892] hover:text-[#201E1D] dark:hover:text-white'
            }`}
          >
            Administered ({totalGiven})
          </button>

        </div>

        <span className="text-xs text-[#75706B] dark:text-[#9E9892]">
          Showing {filteredVaccines.length} {filter === 'upcoming' && selectedUpcomingSession !== 'all_future' ? 'doses due on this date' : 'vaccines'}
        </span>
      </div>

      {/* Informative Guidance Banner for WB Govt Free Schedule */}
      {filter === 'government' && (
        <div className="p-4 rounded-2xl border border-[#CFE2D1] dark:border-[#2D4A33] bg-[#EDF5EE]/90 dark:bg-[#1A2E1F]/80 text-xs text-[#23522A] dark:text-[#AECDB2] flex items-start gap-3">
          <Building2 className="w-5 h-5 shrink-0 text-[#2E6836] mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm text-[#1A4220] dark:text-[#CBE9CF]">
              West Bengal Government Universal Immunization Programme (UIP) • 100% Free
            </p>
            <p className="leading-relaxed text-[#23522A]/90 dark:text-[#AECDB2]/90">
              All <strong>{govtVaccines.length} doses</strong> listed below are provided <strong>completely free of cost</strong> by the Department of Health & Family Welfare (Swasthya Bhawan), Government of West Bengal. You can receive these at any local Sub-centre, Anganwadi centre, Urban PHC, BPHC, Sub-divisional Hospital, District Hospital, or State Medical College (e.g., SSKM Hospital, Kolkata Medical College, B.C. Roy Post Graduate Institute of Paediatric Sciences).
            </p>
          </div>
        </div>
      )}

      {/* Informative Guidance Banner for Private Clinic Must-Buy Schedule */}
      {filter === 'private' && (
        <div className="p-4 rounded-2xl border border-[#FCDCCB] dark:border-[#543830] bg-[#FFF0E6]/90 dark:bg-[#2D2422]/80 text-xs text-[#8A3510] dark:text-[#F8BCA0] flex items-start gap-3">
          <Syringe className="w-5 h-5 shrink-0 text-[#E2765A] mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm text-[#6E2B0D] dark:text-[#FFA985]">
              Private Clinic Only Schedule • Must Buy Out-of-Pocket
            </p>
            <p className="leading-relaxed text-[#8A3510]/90 dark:text-[#F8BCA0]/90">
              The <strong>{privateVaccines.length} vaccines</strong> shown below are <strong>NOT provided by the West Bengal Government</strong> for free. They are strongly recommended by the Indian Academy of Pediatrics (IAP) for full protection against seasonal swine flu (Influenza), typhoid fever (TCV), food & waterborne hepatitis (Hep A), chickenpox (Varicella), mumps (MMR), and cervical cancer (HPV). Parents must purchase these at private pediatric clinics or private hospitals (e.g., Apollo Gleneagles, Bhagirathi Neotia, Fortis, Woodlands).
            </p>
          </div>
        </div>
      )}

      {/* Upcoming Session Guidance Banner with Multi-Dose & Session Picker */}
      {filter === 'upcoming' && (
        <div className="p-4 rounded-2xl border border-[#F6E6B8] dark:border-[#42371E] bg-[#FDF6E2]/90 dark:bg-[#292416]/80 text-xs text-[#6E4D05] dark:text-[#EECD85] space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-2.5 min-w-0">
              <Calendar className="w-5 h-5 shrink-0 text-[#E2765A] mt-0.5" />
              <div>
                <p className="font-bold text-sm text-[#4D3502] dark:text-[#F3D797]">
                  {selectedUpcomingSession === 'all_future' ? (
                    `All Upcoming Future Vaccines (${pendingVaccines.length} pending doses)`
                  ) : (
                    `Upcoming Visit: ${currentSessionAge} Session • Due ${currentSessionDateFormatted}`
                  )}
                </p>
                <p className="mt-0.5 leading-relaxed text-[#6E4D05]/90 dark:text-[#EECD85]/90">
                  {selectedUpcomingSession === 'all_future' ? (
                    'Viewing all future pending vaccines. Click any visit session below to focus on doses due together.'
                  ) : (
                    <>
                      <strong>Multiple Doses Due:</strong> There are <strong>{filteredVaccines.length} vaccines</strong> scheduled for administration during this same pediatric visit.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Switcher: Next Due Session vs All Future */}
            <div className="flex items-center gap-1 bg-white/70 dark:bg-black/20 p-1 rounded-xl border border-[#F6E6B8] dark:border-[#42371E] shrink-0">
              <button
                type="button"
                onClick={() => setSelectedUpcomingSession('nearest')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  selectedUpcomingSession === 'nearest'
                    ? 'bg-[#E2765A] text-white shadow-xs'
                    : 'text-[#6E4D05] dark:text-[#EECD85] hover:bg-white/50 dark:hover:bg-black/30'
                }`}
              >
                Next Due ({nextSessionVaccines.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedUpcomingSession('all_future')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  selectedUpcomingSession === 'all_future'
                    ? 'bg-[#E2765A] text-white shadow-xs'
                    : 'text-[#6E4D05] dark:text-[#EECD85] hover:bg-white/50 dark:hover:bg-black/30'
                }`}
              >
                All Future ({pendingVaccines.length})
              </button>
            </div>
          </div>

          {/* Visit Session Pills (e.g. 6 Weeks, 10 Weeks, 14 Weeks) */}
          {sessionDates.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar">
              <span className="text-[11px] font-semibold text-[#6E4D05]/80 dark:text-[#EECD85]/80 shrink-0">
                Scheduled Visits:
              </span>
              {sessionDates.map((dateKey, idx) => {
                const dosesInSession = sessionMap.get(dateKey) || [];
                const ageDisplay = dosesInSession[0]?.ageDueDisplay || dateKey;
                const isSelected =
                  (selectedUpcomingSession === 'nearest' && idx === 0) ||
                  selectedUpcomingSession === dateKey;
                const isOverdue = dosesInSession.some((d) => d.status === 'overdue');

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedUpcomingSession(dateKey)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] transition-all shrink-0 border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#6E4D05] dark:bg-[#EECD85] text-white dark:text-[#292416] border-[#6E4D05] dark:border-[#EECD85] font-bold shadow-xs'
                        : 'bg-white/80 dark:bg-[#1D1C22]/80 text-[#6E4D05] dark:text-[#EECD85] border-[#F6E6B8] dark:border-[#42371E] hover:bg-white dark:hover:bg-[#1D1C22]'
                    }`}
                  >
                    {isOverdue && <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="Overdue" />}
                    <span>{ageDisplay}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                        isSelected
                          ? 'bg-white/25 dark:bg-black/25 text-white dark:text-[#292416]'
                          : 'bg-[#F6E6B8] dark:bg-[#42371E] text-[#6E4D05] dark:text-[#EECD85]'
                      }`}
                    >
                      {dosesInSession.length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Vaccine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredVaccines.length === 0 ? (
          <div className="col-span-full p-8 rounded-2xl border border-dashed border-[#EAE6DF] dark:border-[#2D2B33] bg-white/60 dark:bg-[#1D1C22]/60 text-center">
            <CheckCircle2 className="w-8 h-8 text-[#5A9663] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#201E1D] dark:text-[#FAF8F5]">
              No pending vaccines for this selection!
            </p>
            <p className="text-xs text-[#75706B] dark:text-[#9E9892] mt-1">
              All doses for this round are up to date.
            </p>
          </div>
        ) : (
          filteredVaccines.map((vax) => {
            const isGiven = vax.status === 'given';
            const isOverdue = vax.status === 'overdue';
            const isGovt = vax.category === 'government';

            return (
              <div
                key={vax.id}
                className={`rounded-2xl p-4 border transition-colors duration-150 shadow-xs space-y-3 ${
                  isGovt
                    ? 'bg-white dark:bg-[#1D1C22] border-[#EAE6DF] dark:border-[#2D2B33] hover:border-[#CFE2D1]'
                    : 'bg-white dark:bg-[#1D1C22] border-[#EAE6DF] dark:border-[#2D2B33] hover:border-[#FCDCCB]'
                }`}
              >
                {/* Header Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    
                    {/* Category Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        isGovt
                          ? 'bg-[#EDF5EE] text-[#23522A] border-[#CFE2D1] dark:bg-[#1A2E1F] dark:text-[#AECDB2] dark:border-[#2D4A33]'
                          : 'bg-[#FFF0E6] text-[#8A3510] border-[#FCDCCB] dark:bg-[#2D2422] dark:text-[#F8BCA0] dark:border-[#543830]'
                      }`}
                    >
                      {isGovt ? (
                        <>
                          <Building2 className="w-3 h-3 text-[#2E6836]" />
                          <span>WB Govt • Free</span>
                        </>
                      ) : (
                        <>
                          <Syringe className="w-3 h-3 text-[#E2765A]" />
                          <span>Private Only • Must Buy</span>
                        </>
                      )}
                    </span>

                    {/* Cost Badge */}
                    {isGovt ? (
                      <span className="text-[10px] font-semibold text-[#23522A] dark:text-[#AECDB2] px-2 py-0.5 rounded-full border border-[#CFE2D1] dark:border-[#2D4A33] bg-[#EDF5EE] dark:bg-[#1A2E1F]">
                        ₹0 Free
                      </span>
                    ) : vax.costInr ? (
                      <span className="text-[11px] font-semibold text-[#8A3510] dark:text-[#F8BCA0] px-2 py-0.5 rounded-full border border-[#FCDCCB] dark:border-[#543830] bg-[#FFF0E6] dark:bg-[#2D2422]">
                        ~₹{vax.costInr.toLocaleString('en-IN')}
                      </span>
                    ) : null}

                  </div>

                  {/* Status Indicator */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      isGiven
                        ? 'bg-[#EDF5EE] text-[#23522A] border-[#CFE2D1] dark:bg-[#1A2E1F] dark:text-[#AECDB2] dark:border-[#2D4A33]'
                        : isOverdue
                        ? 'bg-[#FDF0F2] text-[#8A2338] border-[#F8D0D6] dark:bg-[#2B171A] dark:text-[#F1ABB6] dark:border-[#4D2329]'
                        : 'bg-[#FDF6E2] text-[#6E4D05] border-[#F6E6B8] dark:bg-[#292416] dark:text-[#EECD85] dark:border-[#42371E]'
                    }`}
                  >
                    {isGiven ? (
                      <>
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        <span>Administered</span>
                      </>
                    ) : isOverdue ? (
                      <>
                        <AlertCircle className="w-3 h-3" />
                        <span>Overdue</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" />
                        <span>Upcoming</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Title & Diseases */}
                <div>
                  <h4 className="text-sm font-semibold text-[#201E1D] dark:text-[#FAF8F5]">
                    {vax.name}
                  </h4>
                  <p className="text-xs text-[#75706B] dark:text-[#9E9892] mt-0.5">
                    Protects against: <span className="text-[#4D4845] dark:text-[#DDD8D0] font-medium">{vax.targetDiseases}</span>
                  </p>
                </div>

                {/* Due Date & Brand Details */}
                <div className="grid grid-cols-2 gap-2 text-xs py-2.5 px-3 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33]">
                  <div>
                    <span className="text-[#75706B] dark:text-[#9E9892] block text-[10px] uppercase font-medium">Due Age</span>
                    <span className="font-semibold text-[#201E1D] dark:text-[#FAF8F5]">{vax.ageDueDisplay}</span>
                  </div>
                  <div>
                    <span className="text-[#75706B] dark:text-[#9E9892] block text-[10px] uppercase font-medium">Due Date</span>
                    <span className="font-semibold text-[#201E1D] dark:text-[#FAF8F5]">
                      {new Date(vax.dueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {vax.brandName && (
                    <div className="col-span-2 border-t border-[#EAE6DF] dark:border-[#2D2B33] pt-1.5 flex items-center justify-between">
                      <span className="text-[#75706B] dark:text-[#9E9892] text-[10px] uppercase font-medium">Brand:</span>
                      <span className="text-[#201E1D] dark:text-[#FAF8F5] font-medium truncate max-w-[200px]">{vax.brandName}</span>
                    </div>
                  )}
                  {vax.dateAdministered && (
                    <div className="col-span-2 flex items-center justify-between">
                      <span className="text-[#75706B] dark:text-[#9E9892] text-[10px] uppercase font-medium">Administered:</span>
                      <span className="text-[#23522A] dark:text-[#AECDB2] font-semibold">{vax.dateAdministered}</span>
                    </div>
                  )}
                </div>

                {/* Notes / Advice */}
                {vax.notes && (
                  <p className="text-[11px] text-[#75706B] dark:text-[#9E9892] leading-relaxed bg-[#FAF8F5]/60 dark:bg-[#18171C]/60 p-2 rounded-lg border border-[#EAE6DF]/60 dark:border-[#2D2B33]/60">
                    {vax.notes}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-0.5">
                  {vax.receiptUrl ? (
                    <a
                      href={vax.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#E2765A] hover:underline font-semibold"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>View Bill</span>
                    </a>
                  ) : (
                    <span />
                  )}

                  {userRole === 'parent' && (
                    <button
                      onClick={() => setEditingVaccine(vax)}
                      className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#E2765A] hover:bg-[#CB6145] text-white shadow-xs transition-colors duration-150 active:scale-[0.98]"
                    >
                      <span>{isGiven ? 'Edit Log' : 'Record Dose'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* --- EDIT / RECORD VACCINE MODAL --- */}
      {editingVaccine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md my-8 rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] p-5 shadow-xl">
            
            <h3 className="text-sm font-semibold text-[#201E1D] dark:text-[#FAF8F5] mb-1">
              Record Vaccine: {editingVaccine.name}
            </h3>
            <p className="text-xs text-[#75706B] dark:text-[#9E9892] mb-4">
              {editingVaccine.category === 'government'
                ? 'Free WB Government UIP dose at Health Centre / Hospital.'
                : 'Private clinic out-of-pocket dose.'}
            </p>

            <form onSubmit={handleSaveModal} className="space-y-3.5 text-xs">
              
              {/* Status Selector */}
              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['given', 'upcoming', 'overdue'] as const).map((st) => (
                    <button
                      type="button"
                      key={st}
                      onClick={() =>
                        setEditingVaccine({
                          ...editingVaccine,
                          status: st,
                          dateAdministered:
                            st === 'given' && !editingVaccine.dateAdministered
                              ? new Date().toISOString().split('T')[0]
                              : editingVaccine.dateAdministered,
                        })
                      }
                      className={`py-2 px-2.5 rounded-xl border capitalize text-xs font-semibold transition-colors duration-150 ${
                        editingVaccine.status === st
                          ? 'bg-[#E2765A] text-white border-[#E2765A] shadow-xs'
                          : 'bg-[#FAF8F5] dark:bg-[#17161B] border-[#EAE6DF] dark:border-[#2D2B33] text-[#75706B] dark:text-[#9E9892]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Administered */}
              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Date Administered</label>
                <input
                  type="date"
                  value={editingVaccine.dateAdministered || ''}
                  onChange={(e) => setEditingVaccine({ ...editingVaccine, dateAdministered: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                />
              </div>

              {/* Brand & Batch */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Brand / Manufacturer</label>
                  <input
                    type="text"
                    value={editingVaccine.brandName || ''}
                    placeholder="e.g. FluQuadri, Typbar"
                    onChange={(e) => setEditingVaccine({ ...editingVaccine, brandName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                  />
                </div>
                <div>
                  <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Batch Number</label>
                  <input
                    type="text"
                    value={editingVaccine.batchNumber || ''}
                    placeholder="BATCH-782"
                    onChange={(e) => setEditingVaccine({ ...editingVaccine, batchNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                  />
                </div>
              </div>

              {/* Clinic & Cost */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Clinic / Hospital</label>
                  <input
                    type="text"
                    value={editingVaccine.clinicName || ''}
                    placeholder={editingVaccine.category === 'government' ? 'Local Swasthya Kendra / Hospital' : 'Private Clinic name'}
                    onChange={(e) => setEditingVaccine({ ...editingVaccine, clinicName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                  />
                </div>
                <div>
                  <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Cost in ₹</label>
                  <input
                    type="number"
                    value={editingVaccine.costInr !== undefined ? editingVaccine.costInr : ''}
                    placeholder="0"
                    onChange={(e) => setEditingVaccine({ ...editingVaccine, costInr: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                  />
                </div>
              </div>

              {/* Bill / Receipt Photo Upload */}
              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Receipt / Immunization Card Photo</label>
                <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-[#DDD8D0] dark:border-[#3D2C28] bg-[#FAF8F5] dark:bg-[#17161B] text-[#75706B] dark:text-[#9E9892] cursor-pointer hover:bg-[#F2ECE3] transition-colors duration-150">
                  <Upload className="w-3.5 h-3.5 text-[#E2765A]" />
                  <span>{editingVaccine.receiptUrl ? 'Bill Attached (Click to Replace)' : 'Attach Bill / Govt Card Photo'}</span>
                  <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Doctor / Post-Shot Notes</label>
                <textarea
                  rows={2}
                  value={editingVaccine.notes || ''}
                  placeholder="Notes, mild fever, paracetamol advice..."
                  onChange={(e) => setEditingVaccine({ ...editingVaccine, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingVaccine(null)}
                  className="flex-1 py-2 px-3 rounded-xl font-semibold border border-[#EAE6DF] dark:border-[#2D2B33] text-[#4D4845] dark:text-[#DDD8D0] hover:bg-[#F2ECE3] dark:hover:bg-[#26242C] transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl font-semibold bg-[#E2765A] text-white hover:bg-[#CB6145] transition-colors duration-150 active:scale-[0.98]"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
