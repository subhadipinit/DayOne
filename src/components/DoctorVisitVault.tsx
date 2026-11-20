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
  Calendar,
  Phone,
  Mic,
  Edit3,
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
  const [activeAnsweringId, setActiveAnsweringId] = useState<string | null>(null);
  const [liveAnswerText, setLiveAnswerText] = useState<string>('');

  // Symptom form state
  const [symptomText, setSymptomText] = useState<string>('');
  const [tempC, setTempC] = useState<string>('37.8');
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

    return `🏥 *DayOne Health Dossier for Dr. ${profile.pediatricianName || 'Pediatrician'}*

👶 *Patient:* ${profile.name} (${ageStr}, ${profile.gender === 'male' ? 'Boy' : 'Girl'})
⚖️ *Current Weight:* ${latestGrowth ? `${latestGrowth.weightKg} kg` : `${profile.birthWeightKg || 3.2} kg (Birth)`}
📏 *Length:* ${latestGrowth ? `${latestGrowth.lengthCm} cm` : `${profile.birthLengthCm || 50} cm`}
🧠 *Head Circ:* ${latestGrowth ? `${latestGrowth.headCircumferenceCm} cm` : `${profile.birthHeadCircumferenceCm || 34} cm`}
🩸 *Blood Group:* ${profile.bloodGroup || 'O+'}

🌡️ *Recent Symptoms / Vitals:*
${recentSymptoms || '• No active acute symptoms (Routine wellness)'}

❓ *Consultation Questions:*
${pendingQuestions || '• Routine developmental milestone & growth review'}

💉 *Vaccines:* ${givenCount} of ${vaccines.length} completed.

_Sent via DayOne Pediatric Vault_`;
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

  const handleSaveLiveAnswer = (id: string) => {
    if (liveAnswerText.trim()) {
      onToggleQuestion(id, liveAnswerText.trim());
    } else {
      onToggleQuestion(id);
    }
    setActiveAnsweringId(null);
    setLiveAnswerText('');
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

  const pendingQuestionsCount = questions.filter((q) => !q.isAnswered).length;

  return (
    <div className="flex flex-col w-full pb-8 space-y-6">
      {/* Quick Navigation to Dose Calculator */}
      {onNavigateTab && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">calculate</span>
            <span className="text-on-surface font-medium">
              Need weight-based medication doses or fever calculator?
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('dose')}
            className="px-3.5 py-1.5 rounded-full bg-primary text-on-primary font-semibold text-[11px] shrink-0 active:scale-95 transition-all shadow-xs"
          >
            Open Calculator →
          </button>
        </div>
      )}

      {/* Screen Title & Action Bar */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm mb-1 font-semibold">
              <span className="material-symbols-outlined text-[14px]">local_hospital</span>
              Pediatric Portal
            </span>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface tracking-tight font-bold">
              Doctor Visit &amp; Rx Vault
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Pediatric records &amp; visit prep questions for {profile.name}
            </p>
          </div>
          <button
            onClick={() => setShowSymptomModal(true)}
            className="shrink-0 inline-flex items-center gap-1.5 bg-primary text-on-primary font-label-md text-label-md px-4 py-2.5 rounded-full shadow-xs hover:bg-primary-container active:scale-95 transition-all font-semibold"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">note_add</span>
            <span>+ Symptom</span>
          </button>
        </div>
      </div>

      {/* Hero Card: Upcoming Visit Reminder */}
      <div className="rounded-3xl bg-surface-container-lowest shadow-sm p-5 border border-outline-variant/30 flex flex-col gap-4">
        {/* Status Badge & Counter */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">
            <span className="material-symbols-outlined text-[15px] text-secondary">event</span>
            Upcoming Checkup • Routine Wellness
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            Active Patient File
          </span>
        </div>

        {/* Main Headline */}
        <div className="flex flex-col gap-1">
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
            Pediatric Consultation &amp; Wellness Checkup
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
            Recommended every 2–3 months during baby&apos;s 1st year
          </p>
        </div>

        {/* Clinic & Doctor Location Tile */}
        <div className="rounded-2xl bg-surface-container-low p-4 flex flex-col gap-3 border border-outline-variant/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-primary-fixed-variant text-[20px]">person</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-label-lg text-label-lg text-on-surface font-bold truncate">
                  Dr. {profile.pediatricianName || 'Clara Morrison, MD'}
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant truncate text-xs">
                  Lead Pediatrician • Westside Children&apos;s Clinic
                </div>
              </div>
            </div>
            {profile.pediatricianPhone && (
              <a
                href={`tel:${profile.pediatricianPhone}`}
                className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-xs active:scale-95 transition-all"
                title="Call Doctor"
              >
                <span className="material-symbols-outlined text-[18px]">phone</span>
              </a>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm text-xs">
            <span className="material-symbols-outlined text-[16px] text-tertiary">location_on</span>
            <span className="truncate">Suite 304, Pediatric Care Tower • Westside Clinic</span>
          </div>
        </div>

        {/* PDF Summary & Sharing Action Card */}
        <div className="rounded-2xl bg-surface-container p-4 flex flex-col gap-2 border border-outline-variant/20">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]">auto_stories</span>
              <span className="font-label-lg text-label-lg text-on-surface font-bold">
                WHO Trajectory &amp; Growth Dossier
              </span>
            </div>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-semibold">
              Auto-synced
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant text-xs leading-relaxed">
            Pre-assembles WHO percentile curves, vaccine records, feeding volume, and active fever/symptom history for the consultation.
          </p>

          <div className="pt-2 flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportPdf}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-secondary text-on-secondary font-label-md text-label-md shadow-xs hover:opacity-90 active:scale-95 transition-all font-semibold"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              <span>Generate Visit Brief (PDF)</span>
            </button>
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-xs hover:bg-primary-container active:scale-95 transition-all font-semibold"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              <span>WhatsApp Doctor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pediatric Consultation Guide / Questions Checklist */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                Questions for Dr. {profile.pediatricianName ? profile.pediatricianName.split(' ')[0] : 'Morrison'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                {pendingQuestionsCount} pending
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Check off in the room so quick 15-minute consultations miss nothing.
            </p>
          </div>
        </div>

        {/* Add Question Input */}
        <form onSubmit={handleAddQuestionSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Type question for pediatrician (e.g. night-waking, weaning rash)..."
            value={newQuestionText}
            onChange={(e) => setNewQuestionText(e.target.value)}
            className="flex-1 h-11 px-4 rounded-full bg-surface-container-lowest text-on-surface font-body-sm shadow-xs border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-outline"
          />
          <button
            type="submit"
            className="px-4 h-11 rounded-full bg-primary text-on-primary font-label-md font-semibold shrink-0 shadow-xs active:scale-95 transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add</span>
          </button>
        </form>

        {/* Questions List */}
        <div className="space-y-2.5">
          {questions.length === 0 ? (
            <div className="p-6 rounded-2xl bg-surface-container-lowest text-center text-on-surface-variant font-body-sm border border-outline-variant/30">
              No questions added yet. Type your questions above to prep for the clinic visit!
            </div>
          ) : (
            questions.map((q) => {
              const isAnswering = activeAnsweringId === q.id;
              return (
                <div
                  key={q.id}
                  className={`rounded-2xl bg-surface-container-lowest p-4 shadow-xs border border-outline-variant/30 flex flex-col gap-2 transition-all ${
                    q.isAnswered ? 'opacity-70 bg-surface-container-low' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => onToggleQuestion(q.id)}
                      className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        q.isAnswered
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container text-primary hover:bg-primary-fixed border border-outline-variant/40'
                      }`}
                      type="button"
                      aria-label="Toggle question status"
                    >
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    </button>

                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span
                          className={`font-label-sm text-label-sm px-2.5 py-0.5 rounded-full font-semibold ${
                            q.isAnswered
                              ? 'bg-surface-container text-on-surface-variant'
                              : 'bg-secondary-fixed text-on-secondary-fixed'
                          }`}
                        >
                          {q.isAnswered ? 'Answered' : 'Pending • Priority'}
                        </span>
                        <button
                          onClick={() => onDeleteQuestion(q.id)}
                          className="text-outline hover:text-error text-xs"
                          type="button"
                          aria-label="Delete question"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>

                      <p
                        className={`font-label-lg text-label-lg text-on-surface leading-snug ${
                          q.isAnswered ? 'line-through text-outline' : 'font-medium'
                        }`}
                      >
                        {q.question}
                      </p>

                      {/* Doctor's answer note */}
                      {q.answer && (
                        <div className="mt-1 p-2.5 rounded-xl bg-primary-fixed/30 border border-primary-fixed/40 text-on-primary-fixed-variant font-body-sm text-xs leading-relaxed">
                          <strong>Doctor&apos;s Advice:</strong> {q.answer}
                        </div>
                      )}

                      {/* Live recording / note area */}
                      {!q.isAnswered && !isAnswering && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAnsweringId(q.id);
                            setLiveAnswerText(q.answer || '');
                          }}
                          className="mt-1 rounded-xl bg-surface-container-low p-2.5 flex items-center justify-between gap-2 text-left hover:bg-surface-container transition-colors"
                        >
                          <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5 truncate text-xs">
                            <span className="material-symbols-outlined text-[16px] text-tertiary">edit_note</span>
                            Tap to record doctor&apos;s answer live...
                          </span>
                          <span className="material-symbols-outlined text-primary text-[18px]">mic</span>
                        </button>
                      )}

                      {isAnswering && (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={liveAnswerText}
                            onChange={(e) => setLiveAnswerText(e.target.value)}
                            placeholder="Type doctor's advice or notes here..."
                            rows={2}
                            className="w-full p-2.5 rounded-xl bg-surface-container text-on-surface font-body-sm text-xs border border-primary/40 focus:outline-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveAnsweringId(null)}
                              className="px-3 py-1 rounded-full text-xs bg-surface-container text-on-surface"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveLiveAnswer(q.id)}
                              className="px-3 py-1 rounded-full text-xs bg-primary text-white font-semibold"
                            >
                              Save &amp; Mark Done
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Symptoms & Clinical Observations Log */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">healing</span>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
              Recent Symptoms &amp; Vitals History
            </h3>
          </div>
          <span className="font-label-sm text-label-sm text-outline">
            {symptoms.length} records
          </span>
        </div>

        <div className="space-y-2.5">
          {symptoms.length === 0 ? (
            <div className="p-5 rounded-2xl bg-surface-container-lowest text-center text-on-surface-variant font-body-sm border border-outline-variant/30 text-xs">
              No active symptoms recorded. Tap &quot;+ Symptom&quot; at the top to log fevers, rashes, or coughs.
            </div>
          ) : (
            symptoms.map((s) => (
              <div
                key={s.id}
                className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary font-bold text-sm shrink-0">
                    🌡️
                  </div>
                  <div>
                    <div className="font-label-md text-label-md text-on-surface font-bold flex items-center gap-2">
                      <span>{s.symptom}</span>
                      {s.temperatureC && (
                        <span className="text-[11px] px-2 py-0.2 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-semibold">
                          {s.temperatureC}°C ({((s.temperatureC * 9) / 5 + 32).toFixed(1)}°F)
                        </span>
                      )}
                    </div>
                    <div className="font-label-sm text-label-sm text-outline flex items-center gap-2 mt-0.5 text-xs">
                      <span>{s.date}</span>
                      {s.medicationGiven && (
                        <>
                          <span>•</span>
                          <span>Med: {s.medicationGiven}</span>
                        </>
                      )}
                      {s.notes && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[150px]">{s.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/40 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">chat</span>
                <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                  WhatsApp Health Dossier
                </h3>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto text-on-surface">
              {generateWhatsAppMessage()}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleCopyWhatsApp}
                className="flex-1 h-12 rounded-full bg-surface-container text-on-surface font-label-md font-semibold flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isCopied ? 'check' : 'content_copy'}
                </span>
                <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
              </button>
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="flex-1 h-12 rounded-full bg-[#25D366] text-white font-label-md font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>Open in WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Symptom Modal */}
      {showSymptomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/40 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">healing</span>
                <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                  Log Symptom / Observation
                </h3>
              </div>
              <button
                onClick={() => setShowSymptomModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSymptomSubmit} className="space-y-4">
              <div>
                <label className="font-label-sm text-label-sm text-outline block mb-1">Symptom Description</label>
                <input
                  type="text"
                  placeholder="e.g. Mild fever, dry cough, diaper rash..."
                  value={symptomText}
                  onChange={(e) => setSymptomText(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-sm border border-outline-variant/30 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label-sm text-label-sm text-outline block mb-1">Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="37.8"
                    value={tempC}
                    onChange={(e) => setTempC(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-sm border border-outline-variant/30 focus:outline-none text-center"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-outline block mb-1">Medication Given</label>
                  <input
                    type="text"
                    placeholder="e.g. Calpol 5.3 mL"
                    value={medGiven}
                    onChange={(e) => setMedGiven(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-sm border border-outline-variant/30 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-outline block mb-1">Doctor Notes / Context</label>
                <textarea
                  rows={2}
                  placeholder="Appeared after morning walk; baby active and nursing normally..."
                  value={symptomNotes}
                  onChange={(e) => setSymptomNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface font-body-sm border border-outline-variant/30 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSymptomModal(false)}
                  className="flex-1 h-12 rounded-full bg-surface-container text-on-surface font-label-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 rounded-full bg-primary text-on-primary font-label-lg font-bold shadow-md hover:bg-primary-container"
                >
                  Save Symptom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
