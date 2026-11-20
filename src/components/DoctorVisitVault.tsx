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
  MapPin,
  Clock,
  User,
  Activity,
  CheckSquare,
  Square,
  Building,
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
import confetti from 'canvas-confetti';

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
  onDeleteSymptom?: (id: string) => void;
  userRole: 'parent' | 'family';
  onNavigateTab?: (tab: ActiveTab) => void;
}

const QUESTION_SUGGESTIONS = [
  'Weaning solids & food allergy introduction',
  'Night-waking & 6-month sleep regression',
  'Teething gum pain & safe remedies',
  'Weight percentile & WHO trajectory check',
  'Motor milestones: sitting without support',
];

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
  onDeleteSymptom,
  userRole,
  onNavigateTab,
}) => {
  const [newQuestionText, setNewQuestionText] = useState<string>('');
  const [showSymptomModal, setShowSymptomModal] = useState<boolean>(false);
  const [activeAnsweringId, setActiveAnsweringId] = useState<string | null>(null);
  const [liveAnswerText, setLiveAnswerText] = useState<string>('');
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);

  // Symptom form state
  const [symptomText, setSymptomText] = useState<string>('');
  const [tempC, setTempC] = useState<string>('37.8');
  const [medGiven, setMedGiven] = useState<string>('');
  const [symptomNotes, setSymptomNotes] = useState<string>('');

  // WhatsApp generator state
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

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
    showToast('Clinical summary copied to clipboard! 📋');
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
    showToast('Question added to visit checklist! 📝');
  };

  const handleAddPresetQuestion = (text: string) => {
    onAddQuestion(text);
    showToast(`Added "${text}"!`);
  };

  const handleSimulateVoiceDictation = () => {
    setIsRecordingAudio(true);
    setTimeout(() => {
      setIsRecordingAudio(false);
      setLiveAnswerText(
        (prev) =>
          (prev ? `${prev} ` : '') +
          'Dr. advised continuing Vitamin D3 drops every morning. Start mashed sweet potato and avocado for solid weaning. Schedule next visit at 9 months.'
      );
    }, 1500);
  };

  const handleSaveLiveAnswer = (id: string) => {
    if (liveAnswerText.trim()) {
      onToggleQuestion(id, liveAnswerText.trim());
      showToast('Doctor’s advice recorded & saved! 🩺');
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
    showToast('Symptom logged to clinical timeline! 🌡️');
  };

  const handleExportPdf = () => {
    try {
      generateDoctorSummaryPdf({
        profile,
        growthRecords,
        vaccines,
        questions,
        symptoms,
      });
      showToast('Pediatrician clinic brief PDF generated! 📄');
    } catch (err) {
      console.error(err);
      showToast('Error generating PDF');
    }
  };

  const pendingQuestionsCount = questions.filter((q) => !q.isAnswered).length;

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

      {/* Screen Title & Quick Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C8EBCC]/60 dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1] text-[11px] font-bold">
              <Stethoscope className="w-3.5 h-3.5 text-[#44634B] dark:text-[#ADCFB1]" />
              <span>Pediatric Visit Portal</span>
            </span>
            <span className="text-[11px] font-semibold text-[#424842] dark:text-[#9E9892]">
              Consultation Prep &amp; Dossier
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#191C1A] dark:text-[#FAF8F5]">
            Doctor Visit &amp; Clinical Notes
          </h2>
          <p className="text-xs text-[#424842] dark:text-[#9E9892] mt-0.5">
            15-minute consultation questions checklist &amp; direct pediatrician summary
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('dose')}
              className="tap-feedback min-h-[44px] px-3.5 py-2 rounded-full bg-white dark:bg-[#1E2520] border border-[#E8E4DC] dark:border-[#2D382F] text-[#191C1A] dark:text-[#FAF8F5] text-xs font-bold shadow-xs flex items-center gap-1.5 hover:bg-[#F1F4F0] dark:hover:bg-[#263129] cursor-pointer"
            >
              <Calculator className="w-4 h-4 text-[#44634B] dark:text-[#ADCFB1]" />
              <span>Dose Assistant</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowSymptomModal(true)}
            className="tap-feedback min-h-[44px] px-4 py-2 rounded-full bg-[#44634B] hover:bg-[#344738] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Symptom</span>
          </button>
        </div>
      </div>

      {/* 1. Hero Card: Pediatrician Profile & Clinic Summary */}
      <div className="bg-white dark:bg-[#1E2520] rounded-[24px] p-4 sm:p-5 shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFDBD0]/60 dark:bg-[#543830] text-[#762C12] dark:text-[#FFB59E] text-xs font-bold">
            <Calendar className="w-3.5 h-3.5" />
            <span>Routine Wellness Checkup Scheduled</span>
          </span>

          <span className="text-xs font-bold text-[#44634B] dark:text-[#ADCFB1] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#44634B] animate-pulse" />
            <span>Active Patient Dossier</span>
          </span>
        </div>

        {/* Doctor Identity Tile */}
        <div className="rounded-2xl bg-[#F7FAF5] dark:bg-[#161C17] p-3.5 sm:p-4 border border-[#E0E3DF] dark:border-[#2D382F] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#C8EBCC] dark:bg-[#203D24] text-[#44634B] dark:text-[#ADCFB1] flex items-center justify-center shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-[#191C1A] dark:text-[#FAF8F5] truncate">
                Dr. {profile.pediatricianName || 'Clara Morrison, MD'}
              </h3>
              <p className="text-xs text-[#424842] dark:text-[#9E9892] truncate mt-0.5">
                Lead Pediatrician • {profile.emergencyHospital || 'Westside Children’s Clinic'}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-[#424842] dark:text-[#9E9892] mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#99462A] shrink-0" />
                <span className="truncate">Suite 304, Pediatric Care Tower</span>
              </div>
            </div>
          </div>

          {profile.pediatricianPhone && (
            <a
              href={`tel:${profile.pediatricianPhone}`}
              className="tap-feedback w-11 h-11 rounded-full bg-[#44634B] text-white flex items-center justify-center shrink-0 shadow-xs hover:bg-[#344738]"
              title="Call Pediatrician"
            >
              <Phone className="w-5 h-5" />
            </a>
          )}
        </div>

        {/* Export Dossier & WhatsApp Triggers */}
        <div className="flex items-center gap-2.5 flex-wrap pt-1">
          <button
            type="button"
            onClick={handleExportPdf}
            className="tap-feedback flex-1 min-h-[44px] px-4 py-2 rounded-full bg-white dark:bg-[#202822] border border-[#E8E4DC] dark:border-[#2D382F] text-[#191C1A] dark:text-[#FAF8F5] text-xs font-bold shadow-xs flex items-center justify-center gap-2 hover:bg-[#F1F4F0] cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#44634B] dark:text-[#ADCFB1]" />
            <span>Generate Visit PDF Brief</span>
          </button>

          <button
            type="button"
            onClick={() => setShowWhatsAppModal(true)}
            className="tap-feedback flex-1 min-h-[44px] px-4 py-2 rounded-full bg-[#44634B] hover:bg-[#344738] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp Dossier</span>
          </button>
        </div>
      </div>

      {/* 2. Questions Checklist for Consultation */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5]">
                Consultation Questions
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FFDBD0] dark:bg-[#543830] text-[#762C12] dark:text-[#FFB59E]">
                {pendingQuestionsCount} Pending
              </span>
            </div>
            <p className="text-xs text-[#424842] dark:text-[#9E9892] mt-0.5">
              Check off in the examination room so quick visits miss nothing
            </p>
          </div>
        </div>

        {/* Add Question Input Form (≥44px touch targets) */}
        <form onSubmit={handleAddQuestionSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Type question for pediatrician (e.g. night-waking, weaning rash)..."
            value={newQuestionText}
            onChange={(e) => setNewQuestionText(e.target.value)}
            className="flex-1 min-h-[44px] px-4 rounded-xl bg-white dark:bg-[#1E2520] border border-[#E8E4DC] dark:border-[#2D382F] text-xs font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#44634B]/30"
          />
          <button
            type="submit"
            className="tap-feedback min-h-[44px] px-4 rounded-xl bg-[#44634B] hover:bg-[#344738] text-white text-xs font-bold shrink-0 shadow-xs flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>

        {/* Question Quick Presets Chips */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {QUESTION_SUGGESTIONS.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => handleAddPresetQuestion(sug)}
              className="tap-feedback shrink-0 px-3 py-1.5 rounded-full bg-[#F1F4F0] dark:bg-[#161C17] text-[#424842] dark:text-[#9E9892] hover:bg-[#E6E9E4] text-[11px] font-medium border border-[#E0E3DF] dark:border-[#2D382F] flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3 text-[#44634B]" />
              <span>{sug}</span>
            </button>
          ))}
        </div>

        {/* Questions Cards List */}
        <div className="space-y-2">
          {questions.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-[#1E2520] text-center border border-[#E8E4DC] dark:border-[#2D382F]">
              <HelpCircle className="w-8 h-8 text-[#44634B] mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5]">
                No questions recorded yet
              </p>
              <p className="text-[11px] text-[#424842] dark:text-[#9E9892] mt-1">
                Type questions above or pick suggestions to prep for your visit!
              </p>
            </div>
          ) : (
            questions.map((q) => {
              const isAnswering = activeAnsweringId === q.id;

              return (
                <div
                  key={q.id}
                  className={`rounded-2xl p-4 border transition-all ${
                    q.isAnswered
                      ? 'bg-[#F7FAF5] dark:bg-[#161C17] border-[#E0E3DF] dark:border-[#2D382F] opacity-75'
                      : 'bg-white dark:bg-[#1E2520] border-[#E8E4DC] dark:border-[#2D382F] shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Toggle Checkbox Button (≥44px Touch Zone) */}
                    <button
                      type="button"
                      onClick={() => onToggleQuestion(q.id)}
                      className="tap-feedback w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 cursor-pointer"
                      title={q.isAnswered ? 'Mark unanswered' : 'Mark answered'}
                    >
                      {q.isAnswered ? (
                        <CheckCircle2 className="w-6 h-6 text-[#44634B] dark:text-[#ADCFB1]" />
                      ) : (
                        <Circle className="w-6 h-6 text-stone-300 dark:text-stone-600 hover:text-[#44634B]" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            q.isAnswered
                              ? 'bg-[#C8EBCC]/50 dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1]'
                              : 'bg-[#FFDBD0] dark:bg-[#543830] text-[#762C12] dark:text-[#FFB59E]'
                          }`}
                        >
                          {q.isAnswered ? 'Addressed with Doctor' : 'Pending in Room'}
                        </span>

                        <button
                          type="button"
                          onClick={() => onDeleteQuestion(q.id)}
                          className="tap-feedback p-1 text-stone-300 hover:text-rose-500 transition-colors"
                          title="Delete question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p
                        className={`text-xs sm:text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5] leading-snug ${
                          q.isAnswered ? 'line-through opacity-70' : ''
                        }`}
                      >
                        {q.question}
                      </p>

                      {/* Recorded Doctor Advice Note */}
                      {q.answer && (
                        <div className="p-3 rounded-xl bg-[#C8EBCC]/30 dark:bg-[#203D24]/40 border border-[#44634B]/20 text-xs text-[#191C1A] dark:text-[#FAF8F5] leading-relaxed">
                          <strong className="text-[#44634B] dark:text-[#ADCFB1] block mb-0.5">
                            Doctor&apos;s Advice / Next Steps:
                          </strong>
                          {q.answer}
                        </div>
                      )}

                      {/* Interactive In-Room Live Note Recording Trigger */}
                      {!q.isAnswered && !isAnswering && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAnsweringId(q.id);
                            setLiveAnswerText(q.answer || '');
                          }}
                          className="tap-feedback min-h-[38px] w-full p-2.5 rounded-xl bg-[#F1F4F0] dark:bg-[#161C17] flex items-center justify-between gap-2 text-xs text-[#424842] dark:text-[#9E9892] hover:bg-[#E6E9E4] cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5 font-medium truncate">
                            <Edit3 className="w-3.5 h-3.5 text-[#44634B] dark:text-[#ADCFB1]" />
                            <span>Record doctor&apos;s answer live in room...</span>
                          </span>
                          <span className="text-[11px] font-bold text-[#44634B] dark:text-[#ADCFB1]">
                            Record Notes
                          </span>
                        </button>
                      )}

                      {/* Expanded In-Room Answer Recording Box */}
                      {isAnswering && (
                        <div className="pt-2 space-y-2 animate-in fade-in duration-150">
                          <textarea
                            rows={3}
                            value={liveAnswerText}
                            onChange={(e) => setLiveAnswerText(e.target.value)}
                            placeholder="Type advice given by pediatrician in the room..."
                            className="w-full p-3 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#44634B] text-xs font-medium focus:outline-none"
                          />

                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={handleSimulateVoiceDictation}
                              className={`tap-feedback px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                                isRecordingAudio
                                  ? 'bg-rose-500 text-white animate-pulse'
                                  : 'bg-white dark:bg-[#202822] text-[#44634B] dark:text-[#ADCFB1] border-[#44634B]/30'
                              }`}
                            >
                              <Mic className="w-3.5 h-3.5" />
                              <span>{isRecordingAudio ? 'Listening...' : 'Voice Dictate'}</span>
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setActiveAnsweringId(null)}
                                className="px-3 py-1.5 rounded-full text-xs font-bold text-stone-500 hover:text-stone-700"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveLiveAnswer(q.id)}
                                className="tap-feedback px-4 py-1.5 rounded-full bg-[#44634B] hover:bg-[#344738] text-white text-xs font-bold shadow-xs"
                              >
                                Save &amp; Mark Done
                              </button>
                            </div>
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

      {/* 3. Recent Symptoms & Temperature Observations */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-[#99462A]" />
            <h3 className="text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5]">
              Recent Symptoms &amp; Vitals History
            </h3>
          </div>
          <span className="text-xs text-[#424842] dark:text-[#9E9892]">
            {symptoms.length} logs
          </span>
        </div>

        <div className="space-y-2">
          {symptoms.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1E2520] text-center text-xs text-[#424842] dark:text-[#9E9892] border border-[#E8E4DC] dark:border-[#2D382F]">
              No active symptoms logged. Tap &quot;Log Symptom&quot; at the top to record fevers, rashes, or runny noses.
            </div>
          ) : (
            symptoms.map((s) => (
              <div
                key={s.id}
                className="bg-white dark:bg-[#1E2520] p-3.5 rounded-2xl border border-[#E8E4DC] dark:border-[#2D382F] shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#FFDBD0]/60 dark:bg-[#3E1C12]/60 text-[#762C12] dark:text-[#FFB59E] flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5]">
                        {s.symptom}
                      </span>
                      {s.temperatureC && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFDBD0] text-[#762C12]">
                          {s.temperatureC}°C ({((s.temperatureC * 9) / 5 + 32).toFixed(1)}°F)
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#424842] dark:text-[#9E9892] block mt-0.5 truncate">
                      {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {s.medicationGiven ? ` • Med: ${s.medicationGiven}` : ''}
                      {s.notes ? ` • ${s.notes}` : ''}
                    </span>
                  </div>
                </div>

                {onDeleteSymptom && (
                  <button
                    type="button"
                    onClick={() => onDeleteSymptom(s.id)}
                    className="tap-feedback p-2 text-stone-300 hover:text-rose-500 transition-colors"
                    title="Delete symptom"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Add Symptom Modal */}
      {showSymptomModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#1E2520] rounded-t-[28px] sm:rounded-[28px] border border-[#E8E4DC] dark:border-[#2D382F] p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
            <div className="w-10 h-1 bg-stone-300 dark:bg-stone-600 rounded-full mx-auto mb-1 sm:hidden" />

            <div className="flex items-center justify-between border-b border-[#E8E4DC] dark:border-[#2D382F] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-[#FFDBD0] dark:bg-[#543830] text-[#762C12] dark:text-[#FFB59E] flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#191C1A] dark:text-[#FAF8F5]">
                    Log Symptom or Observation
                  </h3>
                  <p className="text-[11px] text-[#424842] dark:text-[#9E9892]">
                    Recorded for {profile.name}&apos;s clinical chart
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSymptomModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSymptomSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">
                  Symptom / Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mild viral fever &amp; clear runny nose"
                  value={symptomText}
                  onChange={(e) => setSymptomText(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">
                    Body Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="38.0"
                    value={tempC}
                    onChange={(e) => setTempC(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] font-bold text-sm text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">
                    Medication Given
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Calpol 120 (1.2 ml)"
                    value={medGiven}
                    onChange={(e) => setMedGiven(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-[#191C1A] dark:text-[#FAF8F5]">
                  Additional Clinical Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Started after 4 PM nap, sleeping comfortably"
                  value={symptomNotes}
                  onChange={(e) => setSymptomNotes(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSymptomModal(false)}
                  className="tap-feedback flex-1 min-h-[48px] rounded-full border border-stone-200 dark:border-stone-700 font-bold text-stone-600 dark:text-stone-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tap-feedback flex-1 min-h-[48px] rounded-full bg-[#44634B] hover:bg-[#344738] text-white font-bold shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Symptom</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. WhatsApp Dossier Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#1E2520] rounded-t-[28px] sm:rounded-[28px] border border-[#E8E4DC] dark:border-[#2D382F] p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
            <div className="w-10 h-1 bg-stone-300 dark:bg-stone-600 rounded-full mx-auto mb-1 sm:hidden" />

            <div className="flex items-center justify-between border-b border-[#E8E4DC] dark:border-[#2D382F] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-[#C8EBCC] dark:bg-[#203D24] text-[#44634B] dark:text-[#ADCFB1] flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#191C1A] dark:text-[#FAF8F5]">
                    Pediatrician Consultation Dossier
                  </h3>
                  <p className="text-[11px] text-[#424842] dark:text-[#9E9892]">
                    Pre-assembled WhatsApp message
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E0E3DF] dark:border-[#2D382F] text-xs font-mono whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed text-[#191C1A] dark:text-[#FAF8F5]">
              {generateWhatsAppMessage()}
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleCopyWhatsApp}
                className="tap-feedback flex-1 min-h-[48px] rounded-full border border-stone-200 dark:border-stone-700 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                <span>{isCopied ? 'Copied!' : 'Copy Text'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="tap-feedback flex-1 min-h-[48px] rounded-full bg-[#44634B] hover:bg-[#344738] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Open WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
