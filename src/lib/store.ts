'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ChildProfile,
  VaccineRecord,
  GrowthRecord,
  FeedingLog,
  DiaperLog,
  SleepLog,
  DoctorQuestion,
  SymptomLog,
  Prescription,
  MemoryMilestone,
} from './types';
import {
  INITIAL_CHILD_PROFILE,
  INITIAL_GROWTH_RECORDS,
  INITIAL_MEMORIES,
  INITIAL_DOCTOR_QUESTIONS,
  INITIAL_SYMPTOMS,
  INITIAL_PRESCRIPTIONS,
  getInitialVaccines,
} from './initialData';
import { syncSingleRecord, deleteSingleRecord, pullAllFromSupabase } from './syncService';
import { getSupabaseClient } from './supabaseClient';

const STORAGE_KEYS = {
  PROFILE: 'dayone_child_profile',
  PROFILES_LIST: 'dayone_profiles_list',
  VACCINES: 'dayone_vaccines',
  GROWTH: 'dayone_growth',
  FEEDING: 'dayone_feeding',
  DIAPER: 'dayone_diaper',
  SLEEP: 'dayone_sleep',
  QUESTIONS: 'dayone_questions',
  SYMPTOMS: 'dayone_symptoms',
  PRESCRIPTIONS: 'dayone_prescriptions',
  MEMORIES: 'dayone_memories',
  THEME_MODE: 'dayone_theme_mode',
  USER_ROLE: 'dayone_user_role', // 'parent' or 'family'
  SUPABASE_CONFIG: 'dayone_supabase_config',
};

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isSyncEnabled: boolean;
}

export function useBabyStore() {
  const [profile, setProfileState] = useState<ChildProfile>(INITIAL_CHILD_PROFILE);
  const [profilesList, setProfilesListState] = useState<ChildProfile[]>([INITIAL_CHILD_PROFILE]);
  const [vaccines, setVaccinesState] = useState<VaccineRecord[]>([]);
  const [growthRecords, setGrowthRecordsState] = useState<GrowthRecord[]>(INITIAL_GROWTH_RECORDS);
  const [feedingLogs, setFeedingLogsState] = useState<FeedingLog[]>([]);
  const [diaperLogs, setDiaperLogsState] = useState<DiaperLog[]>([]);
  const [sleepLogs, setSleepLogsState] = useState<SleepLog[]>([]);
  const [questions, setQuestionsState] = useState<DoctorQuestion[]>(INITIAL_DOCTOR_QUESTIONS);
  const [symptoms, setSymptomsState] = useState<SymptomLog[]>(INITIAL_SYMPTOMS);
  const [prescriptions, setPrescriptionsState] = useState<Prescription[]>(INITIAL_PRESCRIPTIONS);
  const [memories, setMemoriesState] = useState<MemoryMilestone[]>(INITIAL_MEMORIES);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'parent' | 'family'>('parent');
  const [supabaseConfig, setSupabaseConfigState] = useState<SupabaseConfig>({
    url: '',
    anonKey: '',
    isSyncEnabled: false,
  });
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Pull from Cloud Database to sync across devices
  const hydrateFromCloud = useCallback(async (targetChildId?: string) => {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      const activeId = targetChildId || profile.id;
      const cloud = await pullAllFromSupabase(activeId);
      if (!cloud) return;

      if (cloud.profile) {
        setProfileState(cloud.profile);
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(cloud.profile));
      }

      if (cloud.profilesList && cloud.profilesList.length > 0) {
        setProfilesListState(cloud.profilesList);
        localStorage.setItem(STORAGE_KEYS.PROFILES_LIST, JSON.stringify(cloud.profilesList));
      }

      if (cloud.vaccines && cloud.vaccines.length > 0) {
        setVaccinesState(cloud.vaccines);
        localStorage.setItem(STORAGE_KEYS.VACCINES, JSON.stringify(cloud.vaccines));
      }

      if (cloud.growthRecords && cloud.growthRecords.length > 0) {
        setGrowthRecordsState(cloud.growthRecords);
        localStorage.setItem(STORAGE_KEYS.GROWTH, JSON.stringify(cloud.growthRecords));
      }

      if (cloud.feedingLogs && cloud.feedingLogs.length > 0) {
        setFeedingLogsState(cloud.feedingLogs);
        localStorage.setItem(STORAGE_KEYS.FEEDING, JSON.stringify(cloud.feedingLogs));
      }

      if (cloud.diaperLogs && cloud.diaperLogs.length > 0) {
        setDiaperLogsState(cloud.diaperLogs);
        localStorage.setItem(STORAGE_KEYS.DIAPER, JSON.stringify(cloud.diaperLogs));
      }

      if (cloud.sleepLogs && cloud.sleepLogs.length > 0) {
        setSleepLogsState(cloud.sleepLogs);
        localStorage.setItem(STORAGE_KEYS.SLEEP, JSON.stringify(cloud.sleepLogs));
      }

      if (cloud.questions && cloud.questions.length > 0) {
        setQuestionsState(cloud.questions);
        localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(cloud.questions));
      }

      if (cloud.symptoms && cloud.symptoms.length > 0) {
        setSymptomsState(cloud.symptoms);
        localStorage.setItem(STORAGE_KEYS.SYMPTOMS, JSON.stringify(cloud.symptoms));
      }

      if (cloud.prescriptions && cloud.prescriptions.length > 0) {
        setPrescriptionsState(cloud.prescriptions);
        localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(cloud.prescriptions));
      }

      if (cloud.memories && cloud.memories.length > 0) {
        setMemoriesState(cloud.memories);
        localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(cloud.memories));
      }

      console.log('[Supabase Sync] Hydrated cloud records successfully.');
    } catch (e) {
      console.warn('[Supabase Sync] Could not hydrate from cloud:', e);
    }
  }, [profile.id]);

  // Initialize from LocalStorage and Cloud
  useEffect(() => {
    try {
      // Auto-cleanup legacy dummy data if previously loaded
      const isCleaned = localStorage.getItem('dayone_clean_v1');
      if (!isCleaned) {
        localStorage.removeItem(STORAGE_KEYS.GROWTH);
        localStorage.removeItem(STORAGE_KEYS.MEMORIES);
        localStorage.removeItem(STORAGE_KEYS.QUESTIONS);
        localStorage.removeItem(STORAGE_KEYS.SYMPTOMS);
        localStorage.removeItem(STORAGE_KEYS.PRESCRIPTIONS);
        localStorage.removeItem(STORAGE_KEYS.FEEDING);
        localStorage.removeItem(STORAGE_KEYS.DIAPER);
        localStorage.removeItem(STORAGE_KEYS.SLEEP);
        localStorage.setItem('dayone_clean_v1', 'true');
      }

      // 1. Profile
      const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
      let currentProf = INITIAL_CHILD_PROFILE;
      if (savedProfile) {
        currentProf = JSON.parse(savedProfile);
        setProfileState(currentProf);
      }

      // 1b. Profiles List
      const savedProfilesList = localStorage.getItem(STORAGE_KEYS.PROFILES_LIST);
      if (savedProfilesList) {
        setProfilesListState(JSON.parse(savedProfilesList));
      } else {
        setProfilesListState([currentProf]);
      }

      // 2. Vaccines
      const savedVaccines = localStorage.getItem(STORAGE_KEYS.VACCINES);
      if (savedVaccines) {
        setVaccinesState(JSON.parse(savedVaccines));
      } else {
        const initialVax = getInitialVaccines(currentProf.dob, currentProf.id);
        setVaccinesState(initialVax);
        localStorage.setItem(STORAGE_KEYS.VACCINES, JSON.stringify(initialVax));
      }

      // 3. Growth
      const savedGrowth = localStorage.getItem(STORAGE_KEYS.GROWTH);
      if (savedGrowth) {
        setGrowthRecordsState(JSON.parse(savedGrowth));
      } else {
        const birthRecord: GrowthRecord = {
          id: `growth_${Date.now()}`,
          childId: currentProf.id,
          date: currentProf.dob.split('T')[0],
          ageInDays: 0,
          weightKg: currentProf.birthWeightKg,
          lengthCm: currentProf.birthLengthCm,
          headCircumferenceCm: currentProf.birthHeadCircumferenceCm,
          notes: 'Birth measurement recorded at hospital delivery.',
        };
        setGrowthRecordsState([birthRecord]);
        localStorage.setItem(STORAGE_KEYS.GROWTH, JSON.stringify([birthRecord]));
      }

      // 4. Care Logs
      const savedFeeding = localStorage.getItem(STORAGE_KEYS.FEEDING);
      if (savedFeeding) setFeedingLogsState(JSON.parse(savedFeeding));

      const savedDiaper = localStorage.getItem(STORAGE_KEYS.DIAPER);
      if (savedDiaper) setDiaperLogsState(JSON.parse(savedDiaper));

      const savedSleep = localStorage.getItem(STORAGE_KEYS.SLEEP);
      if (savedSleep) setSleepLogsState(JSON.parse(savedSleep));

      // 5. Medical & Notes
      const savedQuestions = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
      if (savedQuestions) setQuestionsState(JSON.parse(savedQuestions));

      const savedSymptoms = localStorage.getItem(STORAGE_KEYS.SYMPTOMS);
      if (savedSymptoms) setSymptomsState(JSON.parse(savedSymptoms));

      const savedPrescriptions = localStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS);
      if (savedPrescriptions) setPrescriptionsState(JSON.parse(savedPrescriptions));

      // 6. Memories
      const savedMemories = localStorage.getItem(STORAGE_KEYS.MEMORIES);
      if (savedMemories) setMemoriesState(JSON.parse(savedMemories));

      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME_MODE);
      if (savedTheme) {
        const dark = savedTheme === 'dark';
        setIsDarkMode(dark);
        if (dark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }

      const savedRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
      if (savedRole === 'parent' || savedRole === 'family') {
        setUserRole(savedRole);
      }

      const savedSupa = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
      if (savedSupa) setSupabaseConfigState(JSON.parse(savedSupa));
    } catch (e) {
      console.error('Failed to load store data from localStorage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Set Profile
  const updateProfile = (newProfile: Partial<ChildProfile>) => {
    setProfileState((prev) => {
      const updated = { ...prev, ...newProfile };
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));

      // Update in profiles list too
      setProfilesListState((pList) => {
        const updatedList = pList.map((p) => (p.id === updated.id ? updated : p));
        localStorage.setItem(STORAGE_KEYS.PROFILES_LIST, JSON.stringify(updatedList));
        return updatedList;
      });

      // If DOB changed, recalculate vaccines
      if (newProfile.dob && newProfile.dob !== prev.dob) {
        const recalculated = getInitialVaccines(newProfile.dob, updated.id);
        setVaccinesState(recalculated);
        localStorage.setItem(STORAGE_KEYS.VACCINES, JSON.stringify(recalculated));
      }

      // Background Cloud Sync
      syncSingleRecord('children', {
        id: updated.id,
        name: updated.name,
        nickname: updated.nickname || null,
        dob: updated.dob,
        gender: updated.gender || 'female',
        birth_weight_kg: updated.birthWeightKg || null,
        birth_length_cm: updated.birthLengthCm || null,
        birth_head_cm: updated.birthHeadCircumferenceCm || null,
        blood_group: updated.bloodGroup || null,
        pediatrician_name: updated.pediatricianName || null,
        pediatrician_phone: updated.pediatricianPhone || null,
        emergency_hospital: updated.emergencyHospital || null,
        avatar_url: updated.avatarUrl || null,
      });

      return updated;
    });
  };

  // Add Sibling / Switch Child
  const switchChild = (childId: string) => {
    const found = profilesList.find((c) => c.id === childId);
    if (found) {
      setProfileState(found);
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(found));
      hydrateFromCloud(childId);
    }
  };

  const addChildProfile = (child: ChildProfile) => {
    const updatedList = [...profilesList, child];
    setProfilesListState(updatedList);
    localStorage.setItem(STORAGE_KEYS.PROFILES_LIST, JSON.stringify(updatedList));
    setProfileState(child);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(child));
    const newVaccines = getInitialVaccines(child.dob, child.id);
    setVaccinesState(newVaccines);
    localStorage.setItem(STORAGE_KEYS.VACCINES, JSON.stringify(newVaccines));

    // Background Cloud Sync
    syncSingleRecord('children', {
      id: child.id,
      name: child.name,
      nickname: child.nickname || null,
      dob: child.dob,
      gender: child.gender || 'female',
      birth_weight_kg: child.birthWeightKg || null,
      birth_length_cm: child.birthLengthCm || null,
      birth_head_cm: child.birthHeadCircumferenceCm || null,
      blood_group: child.bloodGroup || null,
      pediatrician_name: child.pediatricianName || null,
      pediatrician_phone: child.pediatricianPhone || null,
      emergency_hospital: child.emergencyHospital || null,
      avatar_url: child.avatarUrl || null,
    });
  };

  // Vaccines
  const updateVaccine = (vaccineId: string, updates: Partial<VaccineRecord>) => {
    setVaccinesState((prev) => {
      const updated = prev.map((v) => (v.id === vaccineId ? { ...v, ...updates } : v));
      localStorage.setItem(STORAGE_KEYS.VACCINES, JSON.stringify(updated));

      const updatedItem = updated.find((v) => v.id === vaccineId);
      if (updatedItem) {
        syncSingleRecord('vaccines', {
          id: updatedItem.id,
          child_id: updatedItem.childId || profile.id,
          name: updatedItem.name,
          code: updatedItem.code,
          target_diseases: updatedItem.targetDiseases || null,
          category: updatedItem.category,
          age_due_weeks: updatedItem.ageDueWeeks,
          age_due_display: updatedItem.ageDueDisplay,
          due_date: updatedItem.dueDate,
          status: updatedItem.status,
          date_administered: updatedItem.dateAdministered || null,
          is_painless: updatedItem.isPainless ?? null,
          brand_name: updatedItem.brandName || null,
          batch_number: updatedItem.batchNumber || null,
          cost_inr: updatedItem.costInr || 0,
          clinic_name: updatedItem.clinicName || null,
          doctor_name: updatedItem.doctorName || null,
          receipt_url: updatedItem.receiptUrl || null,
          notes: updatedItem.notes || null,
        });
      }

      return updated;
    });
  };

  // Growth Records
  const addGrowthRecord = (rec: Omit<GrowthRecord, 'id'>) => {
    const newRecord: GrowthRecord = {
      ...rec,
      id: `growth_${Date.now()}`,
    };
    setGrowthRecordsState((prev) => {
      const updated = [...prev, newRecord].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      localStorage.setItem(STORAGE_KEYS.GROWTH, JSON.stringify(updated));

      syncSingleRecord('growth_records', {
        id: newRecord.id,
        child_id: newRecord.childId || profile.id,
        date: newRecord.date,
        age_in_days: newRecord.ageInDays,
        weight_kg: newRecord.weightKg,
        length_cm: newRecord.lengthCm,
        head_circumference_cm: newRecord.headCircumferenceCm,
        notes: newRecord.notes || null,
      });

      return updated;
    });
  };

  const deleteGrowthRecord = (id: string) => {
    setGrowthRecordsState((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      localStorage.setItem(STORAGE_KEYS.GROWTH, JSON.stringify(updated));
      deleteSingleRecord('growth_records', id);
      return updated;
    });
  };

  // Feeding
  const addFeedingLog = (log: Omit<FeedingLog, 'id'>) => {
    const newLog: FeedingLog = { ...log, id: `feed_${Date.now()}` };
    setFeedingLogsState((prev) => {
      const updated = [newLog, ...prev];
      localStorage.setItem(STORAGE_KEYS.FEEDING, JSON.stringify(updated));

      syncSingleRecord('feeding_logs', {
        id: newLog.id,
        child_id: newLog.childId || profile.id,
        timestamp: newLog.timestamp,
        type: newLog.type,
        left_duration_minutes: newLog.leftDurationMinutes || 0,
        right_duration_minutes: newLog.rightDurationMinutes || 0,
        bottle_amount_ml: newLog.bottleAmountMl || null,
        notes: newLog.notes || null,
      });

      return updated;
    });
  };

  const deleteFeedingLog = (id: string) => {
    setFeedingLogsState((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      localStorage.setItem(STORAGE_KEYS.FEEDING, JSON.stringify(updated));
      deleteSingleRecord('feeding_logs', id);
      return updated;
    });
  };

  // Diapers
  const addDiaperLog = (log: Omit<DiaperLog, 'id'>) => {
    const newLog: DiaperLog = { ...log, id: `diaper_${Date.now()}` };
    setDiaperLogsState((prev) => {
      const updated = [newLog, ...prev];
      localStorage.setItem(STORAGE_KEYS.DIAPER, JSON.stringify(updated));

      syncSingleRecord('diaper_logs', {
        id: newLog.id,
        child_id: newLog.childId || profile.id,
        timestamp: newLog.timestamp,
        type: newLog.type,
        condition: newLog.condition || null,
        color: newLog.color || null,
        notes: newLog.notes || null,
      });

      return updated;
    });
  };

  const deleteDiaperLog = (id: string) => {
    setDiaperLogsState((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      localStorage.setItem(STORAGE_KEYS.DIAPER, JSON.stringify(updated));
      deleteSingleRecord('diaper_logs', id);
      return updated;
    });
  };

  // Sleep
  const addSleepLog = (log: Omit<SleepLog, 'id'>) => {
    const newLog: SleepLog = { ...log, id: `sleep_${Date.now()}` };
    setSleepLogsState((prev) => {
      const updated = [newLog, ...prev];
      localStorage.setItem(STORAGE_KEYS.SLEEP, JSON.stringify(updated));

      syncSingleRecord('sleep_logs', {
        id: newLog.id,
        child_id: newLog.childId || profile.id,
        start_time: newLog.startTime,
        end_time: newLog.endTime || null,
        duration_minutes: newLog.durationMinutes || null,
        notes: newLog.notes || null,
      });

      return updated;
    });
  };

  // Doctor Questions
  const addDoctorQuestion = (question: string) => {
    const newQ: DoctorQuestion = {
      id: `dq_${Date.now()}`,
      childId: profile.id,
      question,
      isAnswered: false,
      dateCreated: new Date().toISOString().split('T')[0],
    };
    setQuestionsState((prev) => {
      const updated = [newQ, ...prev];
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(updated));

      syncSingleRecord('doctor_questions', {
        id: newQ.id,
        child_id: newQ.childId,
        question: newQ.question,
        is_answered: newQ.isAnswered,
        answer: newQ.answer || null,
        date_created: newQ.dateCreated,
      });

      return updated;
    });
  };

  const toggleDoctorQuestion = (id: string, answer?: string) => {
    setQuestionsState((prev) => {
      const updated = prev.map((q) =>
        q.id === id ? { ...q, isAnswered: !q.isAnswered, answer: answer !== undefined ? answer : q.answer } : q
      );
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(updated));

      const updatedItem = updated.find((q) => q.id === id);
      if (updatedItem) {
        syncSingleRecord('doctor_questions', {
          id: updatedItem.id,
          child_id: updatedItem.childId || profile.id,
          question: updatedItem.question,
          is_answered: updatedItem.isAnswered,
          answer: updatedItem.answer || null,
          date_created: updatedItem.dateCreated,
        });
      }

      return updated;
    });
  };

  const deleteDoctorQuestion = (id: string) => {
    setQuestionsState((prev) => {
      const updated = prev.filter((q) => q.id !== id);
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(updated));
      deleteSingleRecord('doctor_questions', id);
      return updated;
    });
  };

  // Symptoms
  const addSymptom = (sym: Omit<SymptomLog, 'id'>) => {
    const newSym: SymptomLog = { ...sym, id: `sym_${Date.now()}` };
    setSymptomsState((prev) => {
      const updated = [newSym, ...prev];
      localStorage.setItem(STORAGE_KEYS.SYMPTOMS, JSON.stringify(updated));

      syncSingleRecord('symptoms', {
        id: newSym.id,
        child_id: newSym.childId || profile.id,
        date: newSym.date,
        symptom: newSym.symptom,
        temperature_c: newSym.temperatureC || null,
        medication_given: newSym.medicationGiven || null,
        notes: newSym.notes || null,
      });

      return updated;
    });
  };

  const deleteSymptom = (id: string) => {
    setSymptomsState((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      localStorage.setItem(STORAGE_KEYS.SYMPTOMS, JSON.stringify(updated));
      deleteSingleRecord('symptoms', id);
      return updated;
    });
  };

  // Prescriptions
  const addPrescription = (rx: Omit<Prescription, 'id'>) => {
    const newRx: Prescription = { ...rx, id: `rx_${Date.now()}` };
    setPrescriptionsState((prev) => {
      const updated = [newRx, ...prev];
      localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(updated));

      syncSingleRecord('prescriptions', {
        id: newRx.id,
        child_id: newRx.childId || profile.id,
        date: newRx.date,
        doctor_name: newRx.doctorName || null,
        clinic_hospital: newRx.clinicHospital || null,
        diagnosis: newRx.diagnosis || null,
        medicines_summary: newRx.medicinesSummary || null,
        attachment_url: newRx.attachmentUrl || null,
        notes: newRx.notes || null,
      });

      return updated;
    });
  };

  const deletePrescription = (id: string) => {
    setPrescriptionsState((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(updated));
      deleteSingleRecord('prescriptions', id);
      return updated;
    });
  };

  // Memories
  const addMemory = (mem: Omit<MemoryMilestone, 'id'>) => {
    const newMem: MemoryMilestone = { ...mem, id: `mem_${Date.now()}` };
    setMemoriesState((prev) => {
      const updated = [newMem, ...prev];
      localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(updated));

      syncSingleRecord('memories', {
        id: newMem.id,
        child_id: newMem.childId || profile.id,
        title: newMem.title,
        milestone_tag: newMem.milestoneTag || null,
        date: newMem.date,
        age_display: newMem.ageDisplay || null,
        caption: newMem.caption || null,
        media_url: newMem.mediaUrl,
        media_type: newMem.mediaType || 'image',
        is_favorite: newMem.isFavorite ?? false,
      });

      return updated;
    });
  };

  const deleteMemory = (id: string) => {
    setMemoriesState((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(updated));
      deleteSingleRecord('memories', id);
      return updated;
    });
  };

  const toggleFavoriteMemory = (id: string) => {
    setMemoriesState((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, isFavorite: !m.isFavorite } : m));
      localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(updated));

      const updatedItem = updated.find((m) => m.id === id);
      if (updatedItem) {
        syncSingleRecord('memories', {
          id: updatedItem.id,
          child_id: updatedItem.childId || profile.id,
          title: updatedItem.title,
          milestone_tag: updatedItem.milestoneTag || null,
          date: updatedItem.date,
          age_display: updatedItem.ageDisplay || null,
          caption: updatedItem.caption || null,
          media_url: updatedItem.mediaUrl,
          media_type: updatedItem.mediaType || 'image',
          is_favorite: updatedItem.isFavorite ?? false,
        });
      }

      return updated;
    });
  };

  // Toggle Theme
  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem(STORAGE_KEYS.THEME_MODE, 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem(STORAGE_KEYS.THEME_MODE, 'light');
      }
      return next;
    });
  };

  // Toggle Role (Parent vs Family)
  const toggleUserRole = () => {
    setUserRole((prev) => {
      const next = prev === 'parent' ? 'family' : 'parent';
      localStorage.setItem(STORAGE_KEYS.USER_ROLE, next);
      return next;
    });
  };

  // Supabase Config
  const updateSupabaseConfig = (cfg: SupabaseConfig) => {
    setSupabaseConfigState(cfg);
    localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(cfg));
  };

  // Reset to initial demo data
  const resetToDemoData = () => {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    setProfileState(INITIAL_CHILD_PROFILE);
    setProfilesListState([INITIAL_CHILD_PROFILE]);
    const vax = getInitialVaccines(INITIAL_CHILD_PROFILE.dob, INITIAL_CHILD_PROFILE.id);
    setVaccinesState(vax);
    setGrowthRecordsState(INITIAL_GROWTH_RECORDS);
    setFeedingLogsState([]);
    setDiaperLogsState([]);
    setSleepLogsState([]);
    setQuestionsState(INITIAL_DOCTOR_QUESTIONS);
    setSymptomsState(INITIAL_SYMPTOMS);
    setPrescriptionsState(INITIAL_PRESCRIPTIONS);
    setMemoriesState(INITIAL_MEMORIES);
  };

  return {
    isLoaded,
    profile,
    profilesList,
    vaccines,
    growthRecords,
    feedingLogs,
    diaperLogs,
    sleepLogs,
    questions,
    symptoms,
    prescriptions,
    memories,
    isDarkMode,
    userRole,
    supabaseConfig,
    updateProfile,
    switchChild,
    addChildProfile,
    updateVaccine,
    addGrowthRecord,
    deleteGrowthRecord,
    addFeedingLog,
    deleteFeedingLog,
    addDiaperLog,
    deleteDiaperLog,
    addSleepLog,
    addDoctorQuestion,
    toggleDoctorQuestion,
    deleteDoctorQuestion,
    addSymptom,
    deleteSymptom,
    addPrescription,
    deletePrescription,
    addMemory,
    deleteMemory,
    toggleFavoriteMemory,
    toggleTheme,
    toggleUserRole,
    updateSupabaseConfig,
    resetToDemoData,
    hydrateFromCloud,
  };
}
