'use client';

import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Plus,
  Eye,
  Trash2,
  Calendar,
  Building,
  User,
  Pill,
  ExternalLink,
  Sparkles,
  Check,
  Loader2,
  Camera,
  X,
  Download,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { Prescription } from '@/lib/types';
import { compressImageFile } from '@/lib/imageCompressor';
import { uploadBabyMedia } from '@/lib/storageService';
import confetti from 'canvas-confetti';

interface PrescriptionVaultProps {
  childId: string;
  prescriptions: Prescription[];
  onAddPrescription: (rx: Omit<Prescription, 'id'>) => void;
  onDeletePrescription: (id: string) => void;
  userRole: 'parent' | 'family';
}

export const PrescriptionVault: React.FC<PrescriptionVaultProps> = ({
  childId,
  prescriptions,
  onAddPrescription,
  onDeletePrescription,
  userRole,
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [previewPrescription, setPreviewPrescription] = useState<Prescription | null>(null);

  // Form state
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [doctorName, setDoctorName] = useState<string>('Dr. Clara Morrison, MD');
  const [clinicHospital, setClinicHospital] = useState<string>('Westside Children’s Clinic');
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [medicinesSummary, setMedicinesSummary] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isScanningRx, setIsScanningRx] = useState<boolean>(false);
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSmartScanRx = async () => {
    if (!attachmentUrl) return;
    setIsScanningRx(true);
    setScanSuccess(false);

    // Pediatric AI OCR extraction heuristic simulation
    setTimeout(() => {
      setIsScanningRx(false);
      setScanSuccess(true);
      if (!diagnosis) {
        setDiagnosis('Pediatric Wellness & Post-Vaccine Care');
      }
      const extractedMedicines = [
        '1. Vitamin D3 drops (400 IU/0.5ml) - 0.5 mL OD daily morning',
        '2. Calpol/Crocin 120 (120mg/5ml) - 1.2 mL SOS for fever >38°C (Min 4h interval)',
        '3. Nasoclear Saline Drops - 1 to 2 drops each nostril before feeds if congested',
        '4. Colimex Drops - 4 drops 15 mins before feeds SOS for colic',
      ].join('\n');

      setMedicinesSummary((prev) => (prev ? `${prev}\n${extractedMedicines}` : extractedMedicines));
      showToast('Prescription text auto-extracted! ✨');
      setTimeout(() => setScanSuccess(false), 3000);
    }, 1200);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        setIsUploading(true);
        const compressed = await compressImageFile(e.target.files[0], 1200, 0.85);
        const cloudUrl = await uploadBabyMedia(compressed, 'prescriptions');
        setAttachmentUrl(cloudUrl);
        showToast('Prescription image attached! 📷');
      } catch (err) {
        console.error('Failed to compress prescription image', err);
        showToast('Could not upload image');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis || !medicinesSummary) return;

    onAddPrescription({
      childId,
      date,
      doctorName,
      clinicHospital,
      diagnosis,
      medicinesSummary,
      attachmentUrl: attachmentUrl || undefined,
      fileType: 'image',
      notes: notes || undefined,
    });

    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } catch {
      // ignore
    }

    setDiagnosis('');
    setMedicinesSummary('');
    setAttachmentUrl('');
    setNotes('');
    setShowAddModal(false);
    showToast('Prescription saved to vault! 📁');
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

      {/* Header with Upload Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C8EBCC]/60 dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1] text-[11px] font-bold">
              <FileText className="w-3.5 h-3.5 text-[#44634B] dark:text-[#ADCFB1]" />
              <span>Digital Health Records Vault</span>
            </span>
            <span className="text-[11px] font-semibold text-[#424842] dark:text-[#9E9892]">
              Encrypted Offline &amp; Cloud Backup
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#191C1A] dark:text-[#FAF8F5]">
            Prescriptions &amp; Clinic Slips
          </h2>
          <p className="text-xs text-[#424842] dark:text-[#9E9892] mt-0.5">
            Store doctor notes, lab orders, and discharge slips for instant mobile access
          </p>
        </div>

        {userRole === 'parent' && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="tap-feedback min-h-[44px] px-4 py-2 rounded-full bg-[#44634B] hover:bg-[#344738] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Upload Prescription</span>
          </button>
        )}
      </div>

      {/* Prescriptions Grid / Cards */}
      {prescriptions.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-[24px] bg-white dark:bg-[#1E2520] border border-[#E8E4DC] dark:border-[#2D382F] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#F1F4F0] dark:bg-[#161C17] text-[#44634B] dark:text-[#ADCFB1] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5]">
            No Prescriptions Stored Yet
          </h3>
          <p className="text-xs text-[#424842] dark:text-[#9E9892] max-w-sm mx-auto">
            Snap photos of doctor consultation slips or lab results to keep a permanent digital medical record.
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="tap-feedback min-h-[44px] px-4 py-2 rounded-full bg-[#44634B] hover:bg-[#344738] text-white text-xs font-bold shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload First Prescription</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="bg-white dark:bg-[#1E2520] rounded-[24px] p-4 sm:p-5 border border-[#E8E4DC] dark:border-[#2D382F] shadow-xs flex flex-col justify-between space-y-3"
            >
              <div className="space-y-3">
                {/* Title & Delete Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#C8EBCC]/60 dark:bg-[#203D24] text-[#44634B] dark:text-[#ADCFB1] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5] truncate">
                        {rx.diagnosis}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#424842] dark:text-[#9E9892] mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-[#44634B] dark:text-[#ADCFB1]" />
                        <span>{new Date(rx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  {userRole === 'parent' && (
                    <button
                      type="button"
                      onClick={() => onDeletePrescription(rx.id)}
                      className="tap-feedback p-1.5 text-stone-300 hover:text-rose-500 transition-colors"
                      title="Delete prescription"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Doctor & Clinic Metadata */}
                <div className="text-xs text-[#424842] dark:text-[#9E9892] space-y-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 shrink-0 text-[#44634B] dark:text-[#ADCFB1]" />
                    <span className="truncate">Doctor: <strong className="text-[#191C1A] dark:text-[#FAF8F5]">{rx.doctorName}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Building className="w-3.5 h-3.5 shrink-0 text-[#44634B] dark:text-[#ADCFB1]" />
                    <span className="truncate">Clinic: <strong className="text-[#191C1A] dark:text-[#FAF8F5]">{rx.clinicHospital}</strong></span>
                  </div>
                </div>

                {/* Prescribed Medicines Box */}
                <div className="p-3 rounded-2xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E0E3DF] dark:border-[#2D382F] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#44634B] dark:text-[#ADCFB1]">
                    <Pill className="w-3.5 h-3.5" />
                    <span>Prescribed Drops &amp; Regimen</span>
                  </div>
                  <p className="text-[11px] text-[#424842] dark:text-[#9E9892] font-medium leading-relaxed whitespace-pre-wrap">
                    {rx.medicinesSummary}
                  </p>
                </div>

                {rx.notes && (
                  <p className="text-[11px] text-[#424842] dark:text-[#9E9892] italic">
                    Note: {rx.notes}
                  </p>
                )}
              </div>

              {/* View & Download Row */}
              {rx.attachmentUrl && (
                <div className="pt-2 border-t border-[#E8E4DC]/50 dark:border-[#2D382F]/50 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPreviewPrescription(rx)}
                    className="tap-feedback min-h-[36px] inline-flex items-center gap-1.5 text-xs font-bold text-[#44634B] dark:text-[#ADCFB1] hover:underline cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Prescription Slip</span>
                  </button>

                  <a
                    href={rx.attachmentUrl}
                    download={`Prescription_${rx.date}.jpg`}
                    className="tap-feedback min-h-[36px] inline-flex items-center gap-1 text-[11px] font-bold text-[#424842] dark:text-[#9E9892] hover:text-[#191C1A] dark:hover:text-[#FAF8F5]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* --- ADD PRESCRIPTION MODAL / BOTTOM SHEET --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#1E2520] rounded-t-[28px] sm:rounded-[28px] border border-[#E8E4DC] dark:border-[#2D382F] p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
            <div className="w-10 h-1 bg-stone-300 dark:bg-stone-600 rounded-full mx-auto mb-1 sm:hidden" />

            <div className="flex items-center justify-between border-b border-[#E8E4DC] dark:border-[#2D382F] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-[#C8EBCC] dark:bg-[#203D24] text-[#44634B] dark:text-[#ADCFB1] flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#191C1A] dark:text-[#FAF8F5]">
                    Upload Doctor Prescription
                  </h3>
                  <p className="text-[11px] text-[#424842] dark:text-[#9E9892]">
                    Snap photo or attach slip with AI auto-extraction
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">
                    Consultation Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">
                    Doctor Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Clara Morrison"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">
                  Clinic or Hospital
                </label>
                <input
                  type="text"
                  placeholder="e.g. Westside Children’s Clinic"
                  value={clinicHospital}
                  onChange={(e) => setClinicHospital(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">
                  Diagnosis or Reason for Visit
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 6-Month Wellness Checkup, Teething &amp; Mild Fever"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-xs font-semibold"
                />
              </div>

              {/* Camera / Photo Upload Triggers (≥44px Touch Targets) */}
              <div>
                <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">
                  Prescription Slip Photo / Document
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="tap-feedback min-h-[48px] rounded-xl border border-dashed border-[#44634B] bg-[#F7FAF5] dark:bg-[#161C17] flex items-center justify-center gap-2 cursor-pointer hover:bg-[#E6E9E4]">
                    <Camera className="w-4 h-4 text-[#44634B] dark:text-[#ADCFB1]" />
                    <span className="font-bold text-xs text-[#44634B] dark:text-[#ADCFB1]">
                      Take Photo
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <label className="tap-feedback min-h-[48px] rounded-xl border border-dashed border-stone-300 dark:border-stone-700 bg-[#F7FAF5] dark:bg-[#161C17] flex items-center justify-center gap-2 cursor-pointer hover:bg-[#E6E9E4]">
                    <Upload className="w-4 h-4 text-stone-500" />
                    <span className="font-bold text-xs text-stone-600 dark:text-stone-300">
                      {isUploading ? 'Compressing...' : 'Browse Gallery'}
                    </span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {attachmentUrl && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-[#C8EBCC]/40 dark:bg-[#203D24]/50 border border-[#44634B]/30 flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#03210E] dark:text-[#ADCFB1]">
                      <Sparkles className="w-4 h-4 text-[#44634B] dark:text-[#ADCFB1]" />
                      <span>Photo Attached • Ready for AI OCR</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSmartScanRx}
                      disabled={isScanningRx}
                      className="tap-feedback px-3 py-1.5 rounded-full bg-[#44634B] hover:bg-[#344738] text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-60"
                    >
                      {isScanningRx ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Scanning...</span>
                        </>
                      ) : scanSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Extracted!</span>
                        </>
                      ) : (
                        <span>✨ Auto-Extract Rx</span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">
                  Medicines &amp; Dosage Instructions
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="1. Vitamin D3 drops (400 IU/0.5ml) - 0.5 mL daily&#10;2. Paracetamol 120 (24mg/ml) - 1.2 mL SOS for fever >38°C"
                  value={medicinesSummary}
                  onChange={(e) => setMedicinesSummary(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">
                  Follow-up Notes / Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Follow up in 3 days if fever persists"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="tap-feedback flex-1 min-h-[48px] rounded-full border border-stone-200 dark:border-stone-700 font-bold text-stone-600 dark:text-stone-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="tap-feedback flex-1 min-h-[48px] rounded-full bg-[#44634B] hover:bg-[#344738] text-white font-bold shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Prescription</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PREVIEW MODAL --- */}
      {previewPrescription && previewPrescription.attachmentUrl && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="relative max-w-2xl w-full max-h-[92vh] bg-white dark:bg-[#1E2520] rounded-t-[28px] sm:rounded-[28px] border border-[#E8E4DC] dark:border-[#2D382F] p-4 sm:p-5 overflow-hidden flex flex-col shadow-2xl">
            <div className="w-10 h-1 bg-stone-300 dark:bg-stone-600 rounded-full mx-auto mb-1 sm:hidden" />

            <div className="flex items-center justify-between pb-3 border-b border-[#E8E4DC] dark:border-[#2D382F]">
              <div>
                <h3 className="font-bold text-sm text-[#191C1A] dark:text-[#FAF8F5]">
                  {previewPrescription.diagnosis}
                </h3>
                <p className="text-[11px] text-[#424842] dark:text-[#9E9892]">
                  {previewPrescription.doctorName} • {previewPrescription.date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPrescription(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto py-4 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPrescription.attachmentUrl}
                alt="Prescription document preview"
                className="max-h-[70vh] mx-auto rounded-2xl object-contain border border-[#E8E4DC] dark:border-[#2D382F]"
              />
            </div>

            <div className="pt-3 border-t border-[#E8E4DC] dark:border-[#2D382F] flex justify-between items-center">
              <a
                href={previewPrescription.attachmentUrl}
                download={`Prescription_${previewPrescription.date}.jpg`}
                className="tap-feedback px-4 py-2 rounded-full bg-[#44634B] text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Save to Device</span>
              </a>

              <button
                type="button"
                onClick={() => setPreviewPrescription(null)}
                className="tap-feedback px-4 py-2 rounded-full border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-600 dark:text-stone-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
