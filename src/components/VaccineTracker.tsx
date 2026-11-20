'use client';

import React, { useState, useMemo } from 'react';
import {
  Syringe,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Calendar,
  Download,
  Filter,
  Check,
  Bell,
  Info,
  X,
  Award,
  Sparkles,
  MapPin,
  Building2,
  FileCheck,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { VaccineRecord, ChildProfile } from '@/lib/types';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

interface VaccineTrackerProps {
  vaccines: VaccineRecord[];
  onUpdateVaccine: (id: string, updates: Partial<VaccineRecord>) => void;
  userRole: 'parent' | 'family';
  profile?: ChildProfile;
}

type VaccineFilter = 'all' | 'due' | 'given' | 'upcoming' | 'overdue';

export const VaccineTracker: React.FC<VaccineTrackerProps> = ({
  vaccines,
  onUpdateVaccine,
  userRole,
  profile,
}) => {
  const [filter, setFilter] = useState<VaccineFilter>('all');
  const [editingVaccine, setEditingVaccine] = useState<VaccineRecord | null>(null);
  const [quickMarkDose, setQuickMarkDose] = useState<VaccineRecord | null>(null);
  const [quickAdminDate, setQuickAdminDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [quickClinicName, setQuickClinicName] = useState<string>('City Children’s Clinic');
  const [quickBatchNo, setQuickBatchNo] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // Profile data resolution
  const resolvedProfile = useMemo(() => {
    if (profile) return profile;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dayone_child_profile');
        if (saved) return JSON.parse(saved);
        const store = localStorage.getItem('dayone_store_v1');
        if (store) {
          const parsed = JSON.parse(store);
          if (parsed.profile) return parsed.profile;
        }
      } catch (e) {
        // fallback
      }
    }
    return {
      id: 'default',
      name: 'Baby',
      gender: 'female',
      dob: '2026-04-12',
      birthWeightKg: 3.2,
      birthLengthCm: 50,
      birthHeadCircumferenceCm: 34.5,
      bloodGroup: 'O+',
      pediatricianName: 'Dr. Clara Morrison, MD',
      emergencyHospital: 'Westside Children’s Hospital',
    };
  }, [profile]);

  // Compute status counts & categorization
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const processedVaccines = useMemo(() => {
    return vaccines.map((v) => {
      // Determine if overdue: if not given and dueDate < today
      const isPastDue = v.status !== 'given' && v.dueDate && v.dueDate.split('T')[0] < todayStr;
      const effectiveStatus: 'given' | 'overdue' | 'upcoming' | 'due' =
        v.status === 'given'
          ? 'given'
          : isPastDue
          ? 'overdue'
          : v.status === 'upcoming'
          ? 'upcoming'
          : 'due';

      return {
        ...v,
        computedStatus: effectiveStatus,
      };
    });
  }, [vaccines, todayStr]);

  const totalDoses = processedVaccines.length;
  const totalGiven = processedVaccines.filter((v) => v.computedStatus === 'given').length;
  const totalOverdue = processedVaccines.filter((v) => v.computedStatus === 'overdue').length;
  const totalUpcoming = processedVaccines.filter((v) => v.computedStatus === 'upcoming' || v.computedStatus === 'due').length;
  const progressPct = totalDoses > 0 ? Math.round((totalGiven / totalDoses) * 100) : 0;

  // Next due dose
  const nextDueDose = useMemo(() => {
    const overdue = processedVaccines.find((v) => v.computedStatus === 'overdue');
    if (overdue) return overdue;
    const dueSoon = processedVaccines.find((v) => v.computedStatus === 'due');
    if (dueSoon) return dueSoon;
    const upcoming = processedVaccines.find((v) => v.computedStatus === 'upcoming');
    return upcoming || processedVaccines[0];
  }, [processedVaccines]);

  // Filter doses
  const filteredVaccines = useMemo(() => {
    return processedVaccines.filter((v) => {
      if (filter === 'all') return true;
      if (filter === 'given') return v.computedStatus === 'given';
      if (filter === 'overdue') return v.computedStatus === 'overdue';
      if (filter === 'upcoming') return v.computedStatus === 'upcoming' || v.computedStatus === 'due';
      if (filter === 'due') return v.computedStatus === 'due' || v.computedStatus === 'overdue';
      return true;
    });
  }, [processedVaccines, filter]);

  // Group by milestone age
  const groupedMilestones = useMemo(() => {
    return filteredVaccines.reduce((acc, dose) => {
      const ageKey = dose.ageDueDisplay || 'Scheduled Routine';
      if (!acc[ageKey]) acc[ageKey] = [];
      acc[ageKey].push(dose);
      return acc;
    }, {} as Record<string, typeof processedVaccines>);
  }, [filteredVaccines]);

  // Direct 1-tap open mark given bottom sheet
  const handleOpenMarkGivenModal = (dose: VaccineRecord) => {
    setQuickMarkDose(dose);
    setQuickAdminDate(todayStr);
    setQuickClinicName(dose.clinicName || 'City Children’s Clinic');
    setQuickBatchNo(dose.batchNumber || '');
  };

  const handleConfirmMarkGiven = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickMarkDose) return;

    onUpdateVaccine(quickMarkDose.id, {
      status: 'given',
      dateAdministered: quickAdminDate || todayStr,
      clinicName: quickClinicName || undefined,
      batchNumber: quickBatchNo || undefined,
    });

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }

    showToast(`${quickMarkDose.name} marked as given! 🛡️`);
    setQuickMarkDose(null);
  };

  const handleInstantMarkToday = (dose: VaccineRecord) => {
    onUpdateVaccine(dose.id, {
      status: 'given',
      dateAdministered: todayStr,
    });

    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }

    showToast(`${dose.name} recorded! 🛡️`);
  };

  const handleSaveEditModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVaccine) return;
    onUpdateVaccine(editingVaccine.id, editingVaccine);
    showToast(`${editingVaccine.name} details saved!`);
    setEditingVaccine(null);
  };

  // Clean Immunization Certificate PDF generator
  const handleDownloadCertificatePdf = () => {
    setIsDownloadingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const babyName = resolvedProfile.name || 'Child';
      const dobFormatted = new Date(resolvedProfile.dob).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      // Background Header Bar - Medical Sage
      doc.setFillColor(68, 99, 75); // #44634B
      doc.rect(0, 0, 210, 28, 'F');

      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('OFFICIAL IMMUNIZATION RECORD & CERTIFICATE', 14, 13);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `World Health Organization (WHO) & National Immunization Program Standards • Issued on ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}`,
        14,
        21
      );

      // Patient Demographics Box
      doc.setDrawColor(220, 225, 219);
      doc.setFillColor(248, 250, 247);
      doc.roundedRect(14, 34, 182, 30, 2, 2, 'FD');

      doc.setTextColor(32, 30, 29);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('PATIENT IDENTIFICATION', 18, 41);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Patient Name: ${babyName}`, 18, 47);
      doc.text(`Date of Birth: ${dobFormatted}`, 18, 53);
      doc.text(`Blood Group: ${resolvedProfile.bloodGroup || 'O+'}`, 18, 59);

      doc.text(`Pediatrician: ${resolvedProfile.pediatricianName || 'Dr. Clara Morrison, MD'}`, 105, 47);
      doc.text(`Clinic / Hospital: ${resolvedProfile.emergencyHospital || 'Westside Children’s Clinic'}`, 105, 53);
      doc.text(`Protection Level: ${progressPct}% Completed (${totalGiven}/${totalDoses} Doses)`, 105, 59);

      // Section 1: Administered Vaccines Table
      let currentY = 72;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(68, 99, 75);
      doc.text('1. VERIFIED ADMINISTERED DOSES', 14, currentY);

      currentY += 4;
      doc.setFillColor(235, 241, 234);
      doc.rect(14, currentY, 182, 7, 'F');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(32, 30, 29);
      doc.text('Vaccine Name', 16, currentY + 4.8);
      doc.text('Schedule', 65, currentY + 4.8);
      doc.text('Target Disease Protection', 92, currentY + 4.8);
      doc.text('Date Administered', 145, currentY + 4.8);
      doc.text('Status', 178, currentY + 4.8);

      currentY += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);

      const givenList = processedVaccines.filter((v) => v.computedStatus === 'given');

      if (givenList.length === 0) {
        doc.text('No doses logged as given yet.', 16, currentY + 6);
        currentY += 10;
      } else {
        givenList.forEach((dose) => {
          if (currentY > 265) {
            doc.addPage();
            currentY = 20;
          }
          doc.text(dose.name.slice(0, 30), 16, currentY + 4.5);
          doc.text(dose.ageDueDisplay || 'Routine', 65, currentY + 4.5);
          doc.text(dose.targetDiseases.slice(0, 32), 92, currentY + 4.5);
          doc.text(dose.dateAdministered || 'Recorded', 145, currentY + 4.5);
          doc.setTextColor(46, 125, 50);
          doc.text('GIVEN', 178, currentY + 4.5);
          doc.setTextColor(32, 30, 29);

          doc.setDrawColor(235, 235, 235);
          doc.line(14, currentY + 6.2, 196, currentY + 6.2);
          currentY += 6.5;
        });
      }

      // Section 2: Remaining Scheduled Vaccines
      currentY += 4;
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(153, 70, 42); // Terracotta
      doc.text('2. UPCOMING & ROUTINE SCHEDULED DOSES', 14, currentY);

      currentY += 4;
      doc.setFillColor(254, 240, 236);
      doc.rect(14, currentY, 182, 7, 'F');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(32, 30, 29);
      doc.text('Vaccine Name', 16, currentY + 4.8);
      doc.text('Age Due', 65, currentY + 4.8);
      doc.text('Target Disease Protection', 92, currentY + 4.8);
      doc.text('Estimated Due Date', 145, currentY + 4.8);
      doc.text('Status', 178, currentY + 4.8);

      currentY += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);

      const pendingList = processedVaccines.filter((v) => v.computedStatus !== 'given').slice(0, 8);
      pendingList.forEach((dose) => {
        if (currentY > 265) {
          doc.addPage();
          currentY = 20;
        }
        doc.text(dose.name.slice(0, 30), 16, currentY + 4.5);
        doc.text(dose.ageDueDisplay || 'Routine', 65, currentY + 4.5);
        doc.text(dose.targetDiseases.slice(0, 32), 92, currentY + 4.5);
        doc.text(dose.dueDate ? dose.dueDate.split('T')[0] : 'Scheduled', 145, currentY + 4.5);
        doc.setTextColor(dose.computedStatus === 'overdue' ? 180 : 100, 50, 40);
        doc.text(dose.computedStatus === 'overdue' ? 'OVERDUE' : 'DUE', 178, currentY + 4.5);
        doc.setTextColor(32, 30, 29);

        doc.setDrawColor(235, 235, 235);
        doc.line(14, currentY + 6.2, 196, currentY + 6.2);
        currentY += 6.5;
      });

      // Verification Footnote & Signature block
      if (currentY > 245) {
        doc.addPage();
        currentY = 20;
      } else {
        currentY += 6;
      }

      doc.setDrawColor(200, 200, 200);
      doc.rect(14, currentY, 182, 24);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('PEDIATRIC CLINIC VALIDATION & STAMP', 18, currentY + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('Authorized Pediatrician Signature: _________________________________', 18, currentY + 12);
      doc.text('Date of Verification: _________________________', 18, currentY + 18);
      doc.text('Official Clinic Seal / Stamp', 135, currentY + 12);

      // Save document
      const cleanFileName = `DayOne_Immunization_Certificate_${babyName.replace(/\s+/g, '_')}_${todayStr}.pdf`;
      doc.save(cleanFileName);
      showToast('Immunization Certificate downloaded! 📄');
    } catch (err) {
      console.error('Failed to generate PDF', err);
      showToast('Could not generate PDF. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-reveal">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-200 max-w-[90vw]">
          <div className="bg-[#2D312E]/95 text-[#EFF2ED] dark:bg-[#FAF8F5] dark:text-[#191C1A] backdrop-blur-md px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2.5 text-xs font-semibold border border-white/10 dark:border-black/10">
            <CheckCircle2 className="w-4 h-4 text-[#C8EBCC] dark:text-[#44634B]" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header with Title and PDF Download Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C8EBCC]/60 dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1] text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Pediatric Immunization Vault</span>
            </span>
            <span className="text-[11px] font-semibold text-[#424842] dark:text-[#9E9892]">
              CDC &amp; IAP Aligned
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#191C1A] dark:text-[#FAF8F5]">
            Vaccine Schedule &amp; Protection
          </h2>
          <p className="text-xs text-[#424842] dark:text-[#9E9892] mt-0.5">
            Routine milestone tracker with 1-tap logging &amp; verified certificate
          </p>
        </div>

        {/* Certificate PDF Download Button */}
        <button
          type="button"
          onClick={handleDownloadCertificatePdf}
          disabled={isDownloadingPdf}
          className="tap-feedback min-h-[44px] px-4 py-2 rounded-full bg-white dark:bg-[#1E2520] border border-[#E8E4DC] dark:border-[#2D382F] text-[#191C1A] dark:text-[#FAF8F5] text-xs font-bold shadow-xs flex items-center justify-center gap-2 hover:bg-[#F1F4F0] dark:hover:bg-[#263129] self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#44634B] dark:text-[#ADCFB1]" />
          <span>{isDownloadingPdf ? 'Generating...' : 'Download Certificate'}</span>
        </button>
      </div>

      {/* 1. Next Due / Critical Dose Alert Banner */}
      <div className="relative overflow-hidden rounded-[24px] bg-[#FFDBD0]/40 dark:bg-[#3D1E16]/40 p-4 sm:p-5 shadow-xs border border-[#FE9572]/40 dark:border-[#543830]">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#99462A] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Syringe className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-[#FFDBD0] dark:bg-[#543830] text-[#762C12] dark:text-[#FFB59E] px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#99462A] animate-pulse" />
                <span>
                  {nextDueDose?.computedStatus === 'overdue'
                    ? `Overdue • ${nextDueDose.ageDueDisplay}`
                    : `Next Up • ${nextDueDose?.ageDueDisplay || 'Scheduled'}`}
                </span>
              </span>

              {nextDueDose && (
                <span className="text-[11px] font-semibold text-[#762C12] dark:text-[#FFB59E]">
                  Due: {new Date(nextDueDose.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-[#191C1A] dark:text-[#FAF8F5] leading-snug mt-1.5">
              {nextDueDose ? nextDueDose.name : 'All routine vaccines complete'}
            </h3>
            <p className="text-xs text-[#99462A] dark:text-[#FFB59E] font-medium mt-0.5">
              {nextDueDose ? nextDueDose.targetDiseases : 'Protected against major childhood illnesses'}
            </p>

            {nextDueDose && nextDueDose.computedStatus !== 'given' && (
              <div className="flex items-center gap-2.5 mt-3.5 pt-0.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleOpenMarkGivenModal(nextDueDose)}
                  className="tap-feedback min-h-[44px] px-4 py-2 rounded-full bg-[#44634B] hover:bg-[#344738] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark as Given</span>
                </button>

                <button
                  type="button"
                  onClick={() => showToast(`Reminder set for ${nextDueDose.name}`)}
                  className="tap-feedback min-h-[44px] px-3.5 py-2 rounded-full bg-white dark:bg-[#1E2520] text-[#191C1A] dark:text-[#FAF8F5] text-xs font-semibold border border-[#E8E4DC] dark:border-[#2D382F] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5 text-[#99462A]" />
                  <span>Remind me</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Vaccine Summary Pill & Bento Metric Card */}
      <div className="bg-white dark:bg-[#1E2520] rounded-[24px] p-4 sm:p-5 shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] space-y-4">
        {/* Metric Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#424842] dark:text-[#9E9892]">
              Immunization Protection Level
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-[#191C1A] dark:text-[#FAF8F5] tabular-nums">
                {totalGiven}
              </span>
              <span className="text-sm font-semibold text-[#424842] dark:text-[#9E9892]">
                / {totalDoses} Doses Given
              </span>
              <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full bg-[#C8EBCC] dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1] text-xs font-bold">
                {progressPct}%
              </span>
            </div>
          </div>

          {/* SVG Radial Meter */}
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
                className="stroke-[#44634B] dark:stroke-[#ADCFB1] transition-all duration-500 ease-out"
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

        {/* Status Pills Grid */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="p-2.5 rounded-xl bg-[#F1F4F0] dark:bg-[#161C17] border border-[#E0E3DF]/50 dark:border-[#2D382F]">
            <span className="text-[10px] font-bold text-[#424842] dark:text-[#9E9892] block">Completed</span>
            <span className="text-base font-bold text-[#44634B] dark:text-[#ADCFB1]">{totalGiven}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#F1F4F0] dark:bg-[#161C17] border border-[#E0E3DF]/50 dark:border-[#2D382F]">
            <span className="text-[10px] font-bold text-[#424842] dark:text-[#9E9892] block">Upcoming</span>
            <span className="text-base font-bold text-[#191C1A] dark:text-[#FAF8F5]">{totalUpcoming}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#F1F4F0] dark:bg-[#161C17] border border-[#E0E3DF]/50 dark:border-[#2D382F]">
            <span className="text-[10px] font-bold text-[#424842] dark:text-[#9E9892] block">Overdue</span>
            <span className={`text-base font-bold ${totalOverdue > 0 ? 'text-[#99462A] dark:text-[#FFB59E]' : 'text-[#424842] dark:text-[#9E9892]'}`}>
              {totalOverdue}
            </span>
          </div>
        </div>

        {/* Segmented Filter Controls: Due / Given / Upcoming / Overdue / All */}
        <div className="p-1 bg-[#F1F4F0] dark:bg-[#161C17] rounded-full flex items-center gap-1 overflow-x-auto no-scrollbar border border-[#E0E3DF] dark:border-[#2D382F]">
          {(
            [
              { id: 'all', label: `All (${totalDoses})` },
              { id: 'due', label: `Due (${totalUpcoming})` },
              { id: 'given', label: `Given (${totalGiven})` },
              { id: 'overdue', label: `Overdue (${totalOverdue})` },
            ] as const
          ).map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`tap-feedback flex-1 min-h-[38px] px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap text-center transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#44634B] text-white shadow-xs'
                    : 'text-[#424842] dark:text-[#9E9892] hover:text-[#191C1A] dark:hover:text-[#FAF8F5]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Milestone Timeline & Native Card Rows */}
      <div className="space-y-4 pt-1">
        {Object.keys(groupedMilestones).length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#1E2520] text-center border border-[#E8E4DC] dark:border-[#2D382F]">
            <CheckCircle2 className="w-8 h-8 text-[#44634B] mx-auto mb-2 opacity-60" />
            <p className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5]">No vaccines match this filter</p>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="mt-2 text-xs font-semibold text-[#44634B] dark:text-[#ADCFB1] hover:underline cursor-pointer"
            >
              Reset to all vaccines
            </button>
          </div>
        ) : (
          Object.entries(groupedMilestones).map(([ageGroup, doses]) => {
            const isGroupCompleted = doses.every((d) => d.computedStatus === 'given');

            return (
              <div key={ageGroup} className="space-y-2.5">
                {/* Milestone age header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isGroupCompleted ? 'bg-[#44634B]' : 'bg-[#FE9572]'
                      }`}
                    />
                    <span className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5]">
                      {ageGroup}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isGroupCompleted
                          ? 'bg-[#C8EBCC]/60 dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1]'
                          : 'bg-[#FFDBD0] dark:bg-[#543830] text-[#762C12] dark:text-[#FFB59E]'
                      }`}
                    >
                      {isGroupCompleted ? 'Complete' : 'Pending'}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#424842] dark:text-[#9E9892]">
                    {doses.length} {doses.length === 1 ? 'dose' : 'doses'}
                  </span>
                </div>

                {/* Dose Cards */}
                <div className="space-y-2">
                  {doses.map((dose) => {
                    const isGiven = dose.computedStatus === 'given';
                    const isOverdue = dose.computedStatus === 'overdue';

                    return (
                      <div
                        key={dose.id}
                        className={`bg-white dark:bg-[#1E2520] rounded-2xl p-3.5 sm:p-4 shadow-xs border transition-all ${
                          isOverdue
                            ? 'border-[#FE9572]/70 dark:border-[#762C12]/80'
                            : 'border-[#E8E4DC] dark:border-[#2D382F]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5] leading-snug">
                                {dose.name}
                              </h4>
                              {dose.category && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#F1F4F0] dark:bg-[#161C17] text-[#424842] dark:text-[#9E9892]">
                                  {dose.category === 'government' ? 'Govt UIP' : 'Private IAP'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#424842] dark:text-[#9E9892] mt-0.5">
                              {dose.targetDiseases}
                            </p>
                          </div>

                          {/* Date & Status Badge */}
                          <div className="shrink-0 text-right">
                            {isGiven ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C8EBCC] dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1] text-[11px] font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Given</span>
                              </span>
                            ) : isOverdue ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFDBD0] dark:bg-[#543830] text-[#762C12] dark:text-[#FFB59E] text-[11px] font-bold">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Overdue</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F1F4F0] dark:bg-[#263129] text-[#424842] dark:text-[#9E9892] text-[11px] font-semibold">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Due {dose.dueDate ? new Date(dose.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Date badge details & metadata */}
                        <div className="flex items-center justify-between text-[11px] text-[#424842] dark:text-[#9E9892] pt-2 border-t border-[#E8E4DC]/50 dark:border-[#2D382F]/50 mt-2.5">
                          <div className="flex items-center gap-2 truncate">
                            <Calendar className="w-3.5 h-3.5 shrink-0 text-[#44634B] dark:text-[#ADCFB1]" />
                            <span className="truncate">
                              {isGiven
                                ? `Administered: ${dose.dateAdministered || 'Recorded'}`
                                : `Target Date: ${dose.dueDate ? new Date(dose.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Scheduled'}`}
                            </span>
                            {dose.clinicName && (
                              <span className="truncate text-stone-400">• {dose.clinicName}</span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setEditingVaccine(dose)}
                            className="tap-feedback shrink-0 text-xs font-semibold text-[#44634B] dark:text-[#ADCFB1] hover:underline cursor-pointer"
                          >
                            Details
                          </button>
                        </div>

                        {/* Action buttons with ≥44px touch targets */}
                        <div className="flex items-center gap-2 pt-2.5">
                          {!isGiven ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenMarkGivenModal(dose)}
                                className="tap-feedback flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#44634B] hover:bg-[#344738] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                                <span>Mark Given</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInstantMarkToday(dose)}
                                className="tap-feedback min-h-[44px] px-3 py-2 rounded-xl bg-[#F1F4F0] dark:bg-[#161C17] text-[#424842] dark:text-[#FAF8F5] text-xs font-semibold flex items-center justify-center gap-1 hover:bg-[#E6E9E4] cursor-pointer"
                                title="Quick mark today"
                              >
                                <span>Today</span>
                              </button>
                            </>
                          ) : (
                            <div className="w-full flex items-center justify-between bg-[#F1F4F0]/60 dark:bg-[#161C17]/60 px-3 py-2 rounded-xl text-xs">
                              <span className="font-semibold text-[#44634B] dark:text-[#ADCFB1] flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Verified on {dose.dateAdministered || 'Record'}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingVaccine(dose)}
                                className="font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                              >
                                Edit Record
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Touch-Friendly "Mark Given" Bottom Sheet / Modal */}
      {quickMarkDose && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#1E2520] rounded-t-[28px] sm:rounded-[28px] border border-[#E8E4DC] dark:border-[#2D382F] p-5 sm:p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
            {/* Grab handle */}
            <div className="w-10 h-1 bg-stone-300 dark:bg-stone-600 rounded-full mx-auto mb-1 sm:hidden" />

            <div className="flex items-center justify-between border-b border-[#E8E4DC] dark:border-[#2D382F] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#C8EBCC] dark:bg-[#203D24] text-[#44634B] dark:text-[#ADCFB1] flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#191C1A] dark:text-[#FAF8F5]">
                    Record Dose Administered
                  </h3>
                  <p className="text-[11px] text-[#424842] dark:text-[#9E9892]">
                    {quickMarkDose.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickMarkDose(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmMarkGiven} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">
                  Date Administered
                </label>
                <input
                  type="date"
                  required
                  value={quickAdminDate}
                  onChange={(e) => setQuickAdminDate(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">
                  Clinic or Pediatrician
                </label>
                <input
                  type="text"
                  placeholder="e.g. Westside Pediatrics / Dr. Morrison"
                  value={quickClinicName}
                  onChange={(e) => setQuickClinicName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">
                  Batch Number / Brand (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. GSK Priorix • Batch #89A2"
                  value={quickBatchNo}
                  onChange={(e) => setQuickBatchNo(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setQuickMarkDose(null)}
                  className="tap-feedback flex-1 min-h-[48px] rounded-full border border-stone-200 dark:border-stone-700 font-bold text-stone-600 dark:text-stone-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tap-feedback flex-1 min-h-[48px] rounded-full bg-[#44634B] hover:bg-[#344738] text-white font-bold shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Given</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Complete Edit Vaccine Details Modal */}
      {editingVaccine && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#1E2520] rounded-t-[28px] sm:rounded-[28px] border border-[#E8E4DC] dark:border-[#2D382F] p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
            <div className="w-10 h-1 bg-stone-300 dark:bg-stone-600 rounded-full mx-auto mb-1 sm:hidden" />

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
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditModal} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">Immunization Status</label>
                <select
                  value={editingVaccine.status}
                  onChange={(e) => setEditingVaccine({ ...editingVaccine, status: e.target.value as any })}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] font-semibold text-xs"
                >
                  <option value="upcoming">Upcoming (Scheduled)</option>
                  <option value="given">Given / Administered</option>
                  <option value="overdue">Overdue</option>
                  <option value="skipped">Skipped</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">Date Administered</label>
                <input
                  type="date"
                  value={editingVaccine.dateAdministered || ''}
                  onChange={(e) => setEditingVaccine({ ...editingVaccine, dateAdministered: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">Clinic / Doctor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Morrison (City Pediatrics)"
                  value={editingVaccine.clinicName || ''}
                  onChange={(e) => setEditingVaccine({ ...editingVaccine, clinicName: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">Vaccine Brand / Batch No.</label>
                <input
                  type="text"
                  placeholder="e.g. GSK Priorix • Batch #89A2"
                  value={editingVaccine.batchNumber || ''}
                  onChange={(e) => setEditingVaccine({ ...editingVaccine, batchNumber: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">Notes / Reaction</label>
                <input
                  type="text"
                  placeholder="e.g. Mild low-grade fever post-dose, settled with Paracetamol"
                  value={editingVaccine.notes || ''}
                  onChange={(e) => setEditingVaccine({ ...editingVaccine, notes: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingVaccine(null)}
                  className="tap-feedback flex-1 min-h-[48px] rounded-full border border-stone-200 dark:border-stone-700 font-bold text-stone-600 dark:text-stone-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tap-feedback flex-1 min-h-[48px] rounded-full bg-[#44634B] hover:bg-[#344738] text-white font-bold shadow-xs"
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
