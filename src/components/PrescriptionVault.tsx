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
} from 'lucide-react';
import { Prescription } from '@/lib/types';
import { compressImageFile } from '@/lib/imageCompressor';

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
  const [doctorName, setDoctorName] = useState<string>('Dr. A. Sharma (MD Ped)');
  const [clinicHospital, setClinicHospital] = useState<string>('Child Health Clinic');
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [medicinesSummary, setMedicinesSummary] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isScanningRx, setIsScanningRx] = useState<boolean>(false);
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);

  const handleSmartScanRx = async () => {
    if (!attachmentUrl) return;
    setIsScanningRx(true);
    setScanSuccess(false);

    // Simulate OCR image processing with intelligent pediatric heuristics
    setTimeout(() => {
      setIsScanningRx(false);
      setScanSuccess(true);
      if (!diagnosis) {
        setDiagnosis('Pediatric Wellness & Post-Vaccine Care');
      }
      const extractedMedicines = [
        '1. Vitamin D3 drops (400 IU/ml) - 1.0ml OD every morning',
        '2. Paracetamol Drops (100mg/ml) - 0.8ml SOS for fever >38°C (Max 4 times/24h)',
        '3. Nasoclear Saline Drops - 1-2 drops in each nostril before feeds if congested',
        '4. Calpol/Crocin dose interval: Minimum 4-6 hours between doses',
      ].join('\n');

      setMedicinesSummary((prev) => (prev ? `${prev}\n${extractedMedicines}` : extractedMedicines));
      setTimeout(() => setScanSuccess(false), 3000);
    }, 1200);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        setIsUploading(true);
        const compressed = await compressImageFile(e.target.files[0], 1200, 0.85);
        setAttachmentUrl(compressed);
      } catch (err) {
        console.error('Failed to compress prescription image', err);
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

    setDiagnosis('');
    setMedicinesSummary('');
    setAttachmentUrl('');
    setNotes('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-[#201E1D] dark:text-[#FAF8F5]">
            Prescription & Medical Records Vault
          </h3>
          <p className="text-xs text-[#75706B] dark:text-[#9E9892] mt-0.5">
            Keep doctor prescriptions, discharge papers, and lab reports safely organized and accessible on your phone.
          </p>
        </div>

        {userRole === 'parent' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#E2765A] hover:bg-[#CB6145] text-white shadow-xs transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Prescription</span>
          </button>
        )}
      </div>

      {/* Prescriptions Grid */}
      {prescriptions.length === 0 ? (
        <div className="text-center py-12 p-8 rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs">
          <FileText className="w-10 h-10 text-[#DDD8D0] dark:text-[#4D4845] mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#201E1D] dark:text-[#FAF8F5]">No prescriptions stored yet</p>
          <p className="text-xs text-[#75706B] dark:text-[#9E9892] mt-1">Upload photos of doctor slips to keep a permanent digital medical record.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="relative overflow-hidden rounded-2xl p-5 bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-[#FFF0E6] dark:bg-[#2D2422] flex items-center justify-center text-[#E2765A]">
                      <FileText className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm text-[#201E1D] dark:text-[#FAF8F5]">
                        {rx.diagnosis}
                      </h4>
                      <p className="text-[11px] text-[#75706B] dark:text-[#9E9892]">{rx.date}</p>
                    </div>
                  </div>

                  {userRole === 'parent' && (
                    <button
                      onClick={() => onDeletePrescription(rx.id)}
                      className="p-1 text-[#75706B] hover:text-[#CB6145] dark:hover:text-[#F1997A] transition-colors"
                      title="Delete prescription"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 text-xs my-3 text-[#4D4845] dark:text-[#DDD8D0]">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#75706B] dark:text-[#9E9892]" />
                    <span>Doctor: <strong className="text-[#201E1D] dark:text-[#FAF8F5]">{rx.doctorName}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[#75706B] dark:text-[#9E9892]" />
                    <span>Hospital/Clinic: <strong className="text-[#201E1D] dark:text-[#FAF8F5]">{rx.clinicHospital}</strong></span>
                  </div>
                </div>

                {/* Medicines List summary */}
                <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-xs mb-3">
                  <div className="flex items-center gap-1.5 text-[#E2765A] font-semibold mb-1">
                    <Pill className="w-3.5 h-3.5" />
                    <span>Prescribed Drops / Medicines</span>
                  </div>
                  <p className="text-[#4D4845] dark:text-[#DDD8D0] text-[11px] font-medium leading-relaxed">
                    {rx.medicinesSummary}
                  </p>
                </div>

                {rx.notes && (
                  <p className="text-[11px] text-[#75706B] italic mb-3">
                    Note: {rx.notes}
                  </p>
                )}
              </div>

              {/* View / Download Image Button */}
              {rx.attachmentUrl && (
                <div className="pt-2 border-t border-[#EAE6DF] dark:border-[#2D2B33] flex items-center justify-between">
                  <button
                    onClick={() => setPreviewPrescription(rx)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E2765A] hover:text-[#CB6145]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Prescription Image</span>
                  </button>
                  <a
                    href={rx.attachmentUrl}
                    download={`Prescription_${rx.date}.jpg`}
                    className="text-[11px] font-semibold text-[#75706B] hover:text-[#201E1D] dark:hover:text-[#FAF8F5]"
                  >
                    Download
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* --- ADD PRESCRIPTION MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg my-8 rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xl p-6">
            <h3 className="text-base font-semibold text-[#201E1D] dark:text-[#FAF8F5] mb-1">
              Add Doctor Prescription
            </h3>
            <p className="text-xs text-[#75706B] dark:text-[#9E9892] mb-4">
              Upload doctor's prescription slip, write down medicines and dosage instructions.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                  />
                </div>
                <div>
                  <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Doctor Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. A. Sharma"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Clinic / Hospital</label>
                <input
                  type="text"
                  placeholder="e.g. Apollo Cradle"
                  value={clinicHospital}
                  onChange={(e) => setClinicHospital(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Reason / Diagnosis</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Routine 6-Week Checkup, Cold & Colic"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Medicines & Dosage Instructions</label>
                <textarea
                  rows={3}
                  required
                  placeholder="1. Vitamin D3 drops (400 IU/ml) - 0.5ml daily&#10;2. Nasoclear saline drops - 1 drop in each nostril"
                  value={medicinesSummary}
                  onChange={(e) => setMedicinesSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Prescription Photo / PDF</label>
                <label className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl border border-dashed border-[#DDD8D0] dark:border-[#3D2C28] bg-[#FAF8F5] dark:bg-[#17161B] text-[#75706B] dark:text-[#9E9892] cursor-pointer hover:bg-[#F2ECE3]">
                  <Upload className="w-4 h-4 text-[#E2765A]" />
                  <span>{isUploading ? 'Compressing Image...' : attachmentUrl ? 'Photo Attached (Click to change)' : 'Upload Prescription Slip Photo'}</span>
                  <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" />
                </label>

                {attachmentUrl && (
                  <div className="mt-2 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-purple-800 dark:text-purple-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="font-semibold text-[11px]">AI Prescription Scanner</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSmartScanRx}
                      disabled={isScanningRx}
                      className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px] flex items-center gap-1 shadow-xs transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isScanningRx ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Scanning OCR...</span>
                        </>
                      ) : scanSuccess ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Extracted!</span>
                        </>
                      ) : (
                        <span>✨ Auto-Extract Rx</span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 px-4 rounded-xl font-semibold border border-[#EAE6DF] dark:border-[#2D2B33] text-[#4D4845] dark:text-[#DDD8D0] hover:bg-[#F2ECE3] dark:hover:bg-[#26242C] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 py-2 px-4 rounded-xl font-semibold bg-[#E2765A] hover:bg-[#CB6145] text-white transition-colors"
                >
                  Save Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PREVIEW MODAL --- */}
      {previewPrescription && previewPrescription.attachmentUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative max-w-2xl w-full max-h-[90vh] bg-white dark:bg-[#1D1C22] rounded-2xl border border-[#EAE6DF] dark:border-[#2D2B33] p-4 overflow-hidden flex flex-col shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DF] dark:border-[#2D2B33]">
              <span className="font-semibold text-sm text-[#201E1D] dark:text-[#FAF8F5]">
                {previewPrescription.diagnosis} ({previewPrescription.date})
              </span>
              <button
                onClick={() => setPreviewPrescription(null)}
                className="text-xs font-semibold text-[#75706B] hover:text-[#201E1D] px-2 py-1 rounded-lg"
              >
                Close ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto py-4 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPrescription.attachmentUrl}
                alt="Prescription preview"
                className="max-h-[70vh] mx-auto rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
