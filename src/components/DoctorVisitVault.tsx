'use client';

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Plus,
  CheckCircle2,
  Circle,
  Thermometer,
  HelpCircle,
  Trash2,
  Sparkles,
  Stethoscope,
  Share2,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Send,
  X,
  Calculator,
} from 'lucide-react';
import {
  ChildProfile,
  GrowthRecord,
  VaccineRecord,
  DoctorQuestion,
  SymptomLog,
} from '@/lib/types';
import { generateDoctorSummaryPdf } from '@/lib/pdfExport';
import { ActiveTab } from './BottomNav';

interface DoctorVisitVaultProps {
  profile: ChildProfile;
  growthRecords: GrowthRecord[];
  vaccines: VaccineRecord[];
  questions: DoctorQuestion[];
  symptoms: SymptomLog[];
  onAddQuestion: (q: string) => void;
  onToggleQuestion: (id: string, ans?: string) => void;
  onDeleteQuestion: (id: string) => void;
  onAddSymptom: (sym: Omit<SymptomLog, 'id'>) => void;
  userRole: 'parent' | 'family';
  onNavigateTab?: (tab: ActiveTab) => void;
}

export const DoctorVisitVault: React.FC<DoctorVisitVaultProps> = ({
  profile,
  growthRecords,
  vaccines,
  questions,
  symptoms,
  onAddQuestion,
  onToggleQuestion,
  onDeleteQuestion,
  onAddSymptom,
  userRole,
  onNavigateTab,
}) => {
  const [newQuestionText, setNewQuestionText] = useState<string>('');
  const [showSymptomModal, setShowSymptomModal] = useState<boolean>(false);

  // Symptom form state
  const [symptomText, setSymptomText] = useState<string>('');
  const [tempC, setTempC] = useState<string>('37.0');
  const [medGiven, setMedGiven] = useState<string>('');
  const [symptomNotes, setSymptomNotes] = useState<string>('');

  // WhatsApp generator state
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const latestGrowth = growthRecords[growthRecords.length - 1];

  const generateWhatsAppMessage = () => {
    const dobDate = new Date(profile.dob);
    const now = new Date();
    const diffDays = Math.max(0, Math.floor((now.getTime() - dobDate.getTime()) / (1000 * 60 * 60 * 24)));
    const months = Math.floor(diffDays / 30.4375);
    const remDays = Math.floor(diffDays % 30.4375);
    const ageStr = `${months}m ${remDays}d`;

    const recentSymptoms = symptoms.slice(0, 3).map((s) => {
      let line = `• ${s.symptom} (${s.date})`;
      if (s.temperatureC) line += ` - Temp: ${s.temperatureC}°C (${((s.temperatureC * 9) / 5 + 32).toFixed(1)}°F)`;
      if (s.medicationGiven) line += ` - Med: ${s.medicationGiven}`;
      return line;
    }).join('\n');

    const pendingQuestions = questions.filter((q) => !q.isAnswered).map((q) => `• ${q.question}`).join('\n');
    const givenCount = vaccines.filter((v) => v.status === 'given').length;

    return `🏥 *DayOne Health Update for Dr. ${profile.pediatricianName || 'Pediatrician'}*

👶 *Patient:* ${profile.name} (${ageStr}, ${profile.gender === 'male' ? 'Boy' : 'Girl'})
⚖️ *Current Weight:* ${latestGrowth ? `${latestGrowth.weightKg} kg` : `${profile.birthWeightKg} kg (Birth)`}
📏 *Length:* ${latestGrowth ? `${latestGrowth.lengthCm} cm` : `${profile.birthLengthCm} cm`}
🧠 *Head Circ:* ${latestGrowth ? `${latestGrowth.headCircumferenceCm} cm` : `${profile.birthHeadCircumferenceCm} cm`}
🩸 *Blood Group:* ${profile.bloodGroup || 'Not specified'}

🌡️ *Recent Symptoms / Vitals:*
${recentSymptoms || '• No active symptoms recorded (Routine wellness)'}

❓ *Parent Questions:*
${pendingQuestions || '• Routine growth & immunization check'}

💉 *Vaccines:* ${givenCount} of ${vaccines.length} doses completed.

_Sent via DayOne Baby Health Vault_`;
  };

  const handleCopyWhatsApp = () => {
    const msg = generateWhatsAppMessage();
    navigator.clipboard.writeText(msg);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const msg = generateWhatsAppMessage();
    const phone = profile.pediatricianPhone ? profile.pediatricianPhone.replace(/\D/g, '') : '';
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleAddQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    onAddQuestion(newQuestionText.trim());
    setNewQuestionText('');
  };

  const handleSymptomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomText) return;
    onAddSymptom({
      childId: profile.id,
      date: new Date().toISOString().split('T')[0],
      symptom: symptomText,
      temperatureC: tempC ? parseFloat(tempC) : undefined,
      medicationGiven: medGiven || undefined,
      notes: symptomNotes || undefined,
    });
    setSymptomText('');
    setMedGiven('');
    setSymptomNotes('');
    setShowSymptomModal(false);
  };

  const handleExportPdf = () => {
    generateDoctorSummaryPdf({
      profile,
      growthRecords,
      vaccines,
      questions,
      symptoms,
    });
  };

  return (
    <div className="space-y-6">
      {/* Quick Navigation to Dose Calculator */}
      {onNavigateTab && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF7F2] dark:bg-[#261E1C] border border-[#FCDCCB] dark:border-[#523A34] text-xs">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#E2765A] shrink-0" />
            <span className="text-[#8A3510] dark:text-[#F8BCA0] font-medium">
              Need weight-based medication doses or fever calculator?
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('dose')}
            className="px-3 py-1.5 rounded-xl bg-[#E2765A] hover:bg-[#CB6145] text-white font-semibold text-[11px] shrink-0 active:scale-[0.97] transition-all"
          >
            Open Calculator →
          </button>
        </div>
      )}

      {/* 1-Click Clinic PDF Download Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#1D1C22] text-[#201E1D] dark:text-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FFF0E6] dark:bg-[#2D2422] flex items-center justify-center text-[#E2765A]">
              <Stethoscope className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm tracking-tight text-[#201E1D] dark:text-[#FAF8F5]">
              Pediatric Clinic Visit Sheet
            </h3>
          </div>
          <p className="text-xs text-[#75706B] dark:text-[#9E9892] max-w-xl">
            Heading to see {profile.pediatricianName || 'the pediatrician'}? Generate a printable 1-page health summary with growth curves, vaccines, and questions.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowWhatsAppModal(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors duration-150 active:scale-[0.98]"
            title="Generate structured WhatsApp update for pediatrician"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Doctor</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#E2765A] hover:bg-[#CB6145] text-white font-semibold text-xs shadow-xs transition-colors duration-150 active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Clinic PDF</span>
          </button>
        </div>
      </div>

      {/* Grid: Questions Notepad & Symptoms Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Questions for Doctor Notepad */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF0E6] dark:bg-[#2D2422] flex items-center justify-center text-[#E2765A]">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h4 className="font-semibold text-sm text-[#201E1D] dark:text-[#FAF8F5]">
                  Questions for Pediatrician ({questions.filter((q) => !q.isAnswered).length} Pending)
                </h4>
              </div>
            </div>

            <p className="text-xs text-[#75706B] dark:text-[#9E9892] mb-4">
              Jot down questions anytime you think of them so you never forget during clinic visits.
            </p>

            {/* Questions List */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {questions.length === 0 ? (
                <p className="text-xs text-[#75706B] italic text-center py-4">No questions saved yet.</p>
              ) : (
                questions.map((q) => (
                  <div
                    key={q.id}
                    className={`p-3 rounded-xl border text-xs transition-all ${q.isAnswered
                      ? 'bg-[#FAF8F5]/60 dark:bg-[#17161B]/40 border-[#EAE6DF]/60 dark:border-[#2D2B33]/60 opacity-60'
                      : 'bg-[#FAF8F5] dark:bg-[#17161B] border-[#EAE6DF] dark:border-[#2D2B33]'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => userRole === 'parent' && onToggleQuestion(q.id)}
                        className="flex items-start gap-2.5 text-left flex-1"
                      >
                        {q.isAnswered ? (
                          <CheckCircle2 className="w-4 h-4 text-[#5A9663] shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-[#9E9892] shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className={`font-medium text-[#201E1D] dark:text-[#FAF8F5] ${q.isAnswered ? 'line-through text-[#75706B]' : ''}`}>
                            {q.question}
                          </p>
                          {q.answer && (
                            <p className="text-[11px] text-[#23522A] dark:text-[#AECDB2] font-semibold mt-1">
                              Doctor: "{q.answer}"
                            </p>
                          )}
                        </div>
                      </button>

                      {userRole === 'parent' && (
                        <button
                          onClick={() => onDeleteQuestion(q.id)}
                          className="p-1 text-[#75706B] hover:text-[#CB6145] dark:hover:text-[#F1997A]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add Question Input */}
          {userRole === 'parent' && (
            <form onSubmit={handleAddQuestionSubmit} className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Ask about feeding, sleep, drops, skin..."
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#E2765A]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#E2765A] text-white text-xs font-semibold hover:bg-[#CB6145] transition-colors shrink-0"
              >
                Add
              </button>
            </form>
          )}
        </div>

        {/* Symptoms & Temperature Log */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FDF6E2] dark:bg-[#292416] flex items-center justify-center text-[#6E4D05] dark:text-[#EECD85]">
                  <Thermometer className="w-4 h-4" />
                </div>
                <h4 className="font-semibold text-sm text-[#201E1D] dark:text-[#FAF8F5]">
                  Symptom & Temperature Log
                </h4>
              </div>
              {userRole === 'parent' && (
                <button
                  onClick={() => setShowSymptomModal(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#E2765A] hover:text-[#CB6145]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Observation</span>
                </button>
              )}
            </div>

            <p className="text-xs text-[#75706B] dark:text-[#9E9892] mb-4">
              Track reactions following vaccines, temperature spikes, or skin observations.
            </p>

            {/* Symptoms list */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {symptoms.length === 0 ? (
                <p className="text-xs text-[#75706B] italic text-center py-4">No symptoms recorded. Baby is thriving!</p>
              ) : (
                symptoms.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#201E1D] dark:text-[#FAF8F5]">{s.symptom}</span>
                      <span className="text-[10px] text-[#75706B] dark:text-[#9E9892]">{s.date}</span>
                    </div>
                    {s.temperatureC && (
                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8A3510] dark:text-[#F8BCA0] bg-[#FFF0E6] dark:bg-[#2D2422] border border-[#FCDCCB] dark:border-[#543830] px-2 py-0.5 rounded-full">
                        <Thermometer className="w-3 h-3 text-[#E2765A]" />
                        <span>{s.temperatureC}°C</span>
                      </div>
                    )}
                    {s.medicationGiven && (
                      <p className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
                        Medication: <span className="font-semibold text-[#201E1D] dark:text-[#FAF8F5]">{s.medicationGiven}</span>
                      </p>
                    )}
                    {s.notes && (
                      <p className="text-[11px] text-[#75706B] italic">{s.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Symptom Modal */}
      {showSymptomModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            {/* Drag indicator */}
            <div className="w-12 h-1 bg-[#EAE6DF] dark:bg-[#2D2B33] rounded-full mx-auto mb-3 sm:hidden" />
            <h4 className="text-sm font-semibold text-[#201E1D] dark:text-[#FAF8F5] mb-2">
              Log Symptom / Temperature
            </h4>
            <form onSubmit={handleSymptomSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Observation / Symptom</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mild fever after 6-week vaccine, runny nose"
                  value={symptomText}
                  onChange={(e) => setSymptomText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Temperature in °C (Optional)</label>
                <input
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  placeholder="37.5"
                  value={tempC}
                  onChange={(e) => setTempC(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Medication Given (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol drops 100mg/ml - 0.6ml"
                  value={medGiven}
                  onChange={(e) => setMedGiven(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Doctor's Remark / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Pediatrician phone advice..."
                  value={symptomNotes}
                  onChange={(e) => setSymptomNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSymptomModal(false)}
                  className="flex-1 py-2 px-3 rounded-xl font-semibold border border-[#EAE6DF] dark:border-[#2D2B33] text-[#4D4845] dark:text-[#DDD8D0] hover:bg-[#F2ECE3] dark:hover:bg-[#26242C] transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl font-semibold bg-[#E2765A] hover:bg-[#CB6145] text-white transition-colors duration-150 active:scale-[0.98]"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Message Generator Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C1A22] border border-[#EAE6DF] dark:border-[#2D2B33] rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Drag indicator */}
            <div className="w-12 h-1 bg-[#EAE6DF] dark:bg-[#2D2B33] rounded-full mx-auto mb-2 sm:hidden" />

            <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DF] dark:border-[#2D2B33]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#201E1D] dark:text-[#FAF8F5]">
                    WhatsApp Pediatrician Update
                  </h3>
                  <p className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
                    Structured medical snapshot ready to send to Dr. {profile.pediatricianName || 'Pediatrician'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#75706B] dark:text-[#9E9892]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formatted Preview Box */}
            <div className="relative">
              <pre className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] text-[11px] text-[#201E1D] dark:text-[#FAF8F5] font-mono whitespace-pre-wrap max-h-60 overflow-y-auto no-scrollbar leading-relaxed">
                {generateWhatsAppMessage()}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopyWhatsApp}
                className="flex-1 py-2.5 rounded-xl font-semibold text-xs border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5] hover:bg-[#F2ECE3] dark:hover:bg-[#26242C] flex items-center justify-center gap-2 transition-colors duration-150"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Open in WhatsApp</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
