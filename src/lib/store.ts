'use client';

import { useState, useEffect } from 'react';
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

  // Initialize from LocalStorage
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

      const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (savedProfile) {
        setProfileState(JSON.parse(savedProfile));
      }

      const savedProfilesList = localStorage.getItem(STORAGE_KEYS.PROFILES_LIST);
      if (savedProfilesList) {
        setProfilesListState(JSON.parse(savedProfilesList));
      }

      const isWbVaxUpdated = localStorage.getItem('dayone_wb_vax_v4');
      const savedVaccines = localStorage.getItem(STORAGE_KEYS.VACCINES);
      const activeChildId = savedProfile ? JSON.parse(savedProfile).id : INITIAL_CHILD_PROFILE.id;
      const activeDob = savedProfile ? JSON.parse(savedProfile).dob : INITIAL_CHILD_PROFILE.dob;

      if (!isWbVaxUpdated || !savedVaccines) {
        // Generate new clean West Bengal UIP & Private Schedule (zero duplicates)
        const freshVax = getInitialVaccines(activeDob, activeChildId);
        
        // Preserve any previously marked given records by code
        if (savedVaccines) {
          try {
            const oldList: VaccineRecord[] = JSON.parse(savedVaccines);
            const givenMap = new Map<string, VaccineRecord>();
            oldList.forEach((v) => {
              if (v.status === 'given') givenMap.set(v.code, v);
            });
            freshVax.forEach((v) => {
              const matched = givenMap.get(v.code);
              if (matched) {
                v.status = 'given';
                v.dateAdministered = matched.dateAdministered;
                v.brandName = matched.brandName;
                v.costInr = matched.costInr;
                v.notes = matched.notes;
                v.batchNumber = matched.batchNumber;
                v.clinicName = matched.clinicName;
                v.receiptUrl = matched.receiptUrl;
              }
            });
          } catch (e) {
            console.error('Error merging legacy vaccines', e);
          }
        }

        setVaccinesState(freshVax);
        localStorage.setItem(STORAGE_KEYS.VACCINES, JSON.stringify(freshVax));
        localStorage.setItem('dayone_wb_vax_v4', 'true');
      } else {
        setVaccinesState(JSON.parse(savedVaccines));
      }

      const savedGrowth = localStorage.getItem(STORAGE_KEYS.GROWTH);
      if (savedGrowth) setGrowthRecordsState(JSON.parse(savedGrowth));

      const savedFeeding = localStorage.getItem(STORAGE_KEYS.FEEDING);
      if (savedFeeding) setFeedingLogsState(JSON.parse(savedFeeding));

      const savedDiaper = localStorage.getItem(STORAGE_KEYS.DIAPER);
      if (savedDiaper) setDiaperLogsState(JSON.parse(savedDiaper));

      const savedSleep = localStorage.getItem(STORAGE_KEYS.SLEEP);
      if (savedSleep) setSleepLogsState(JSON.parse(savedSleep));

      const savedQuestions = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
      if (savedQuestions) setQuestionsState(JSON.parse(savedQuestions));

      const savedSymptoms = localStorage.getItem(STORAGE_KEYS.SYMPTOMS);
      if (savedSymptoms) setSymptomsState(JSON.parse(savedSymptoms));

      const savedPrescriptions = localStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS);
      if (savedPrescriptions) setPrescriptionsState(JSON.parse(savedPrescriptions));

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

      return updated;
    });
  };

  // Add Sibling / Switch Child
  const switchChild = (childId: string) => {
    const found = profilesList.find((c) => c.id === childId);
    if (found) {
      setProfileState(found);
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(found));
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
  };

  // Vaccines
  const updateVaccine = (vaccineId: string, updates: Partial<VaccineRecord>) => {
    setVaccinesState((prev) => {
      const updated = prev.map((v) => (v.id === vaccineId ? { ...v, ...updates } : v));
      localStorage.setItem(STORAGE_KEYS.VACCINES, JSON.stringify(updated));
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
      return updated;
    });
  };

  const deleteGrowthRecord = (id: string) => {
    setGrowthRecordsState((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      localStorage.setItem(STORAGE_KEYS.GROWTH, JSON.stringify(updated));
      return updated;
    });
  };

  // Feeding
  const addFeedingLog = (log: Omit<FeedingLog, 'id'>) => {
    const newLog: FeedingLog = { ...log, id: `feed_${Date.now()}` };
    setFeedingLogsState((prev) => {
      const updated = [newLog, ...prev];
      localStorage.setItem(STORAGE_KEYS.FEEDING, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteFeedingLog = (id: string) => {
    setFeedingLogsState((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      localStorage.setItem(STORAGE_KEYS.FEEDING, JSON.stringify(updated));
      return updated;
    });
  };

  // Diapers
  const addDiaperLog = (log: Omit<DiaperLog, 'id'>) => {
    const newLog: DiaperLog = { ...log, id: `diaper_${Date.now()}` };
    setDiaperLogsState((prev) => {
      const updated = [newLog, ...prev];
      localStorage.setItem(STORAGE_KEYS.DIAPER, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteDiaperLog = (id: string) => {
    setDiaperLogsState((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      localStorage.setItem(STORAGE_KEYS.DIAPER, JSON.stringify(updated));
      return updated;
    });
  };

  // Sleep
  const addSleepLog = (log: Omit<SleepLog, 'id'>) => {
    const newLog: SleepLog = { ...log, id: `sleep_${Date.now()}` };
    setSleepLogsState((prev) => {
      const updated = [newLog, ...prev];
      localStorage.setItem(STORAGE_KEYS.SLEEP, JSON.stringify(updated));
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
      return updated;
    });
  };

  const toggleDoctorQuestion = (id: string, answer?: string) => {
    setQuestionsState((prev) => {
      const updated = prev.map((q) =>
        q.id === id ? { ...q, isAnswered: !q.isAnswered, answer: answer !== undefined ? answer : q.answer } : q
      );
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteDoctorQuestion = (id: string) => {
    setQuestionsState((prev) => {
      const updated = prev.filter((q) => q.id !== id);
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(updated));
      return updated;
    });
  };

  // Symptoms
  const addSymptom = (sym: Omit<SymptomLog, 'id'>) => {
    const newSym: SymptomLog = { ...sym, id: `sym_${Date.now()}` };
    setSymptomsState((prev) => {
      const updated = [newSym, ...prev];
      localStorage.setItem(STORAGE_KEYS.SYMPTOMS, JSON.stringify(updated));
      return updated;
    });
  };

  // Prescriptions
  const addPrescription = (rx: Omit<Prescription, 'id'>) => {
    const newRx: Prescription = { ...rx, id: `rx_${Date.now()}` };
    setPrescriptionsState((prev) => {
      const updated = [newRx, ...prev];
      localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(updated));
      return updated;
    });
  };

  const deletePrescription = (id: string) => {
    setPrescriptionsState((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(updated));
      return updated;
    });
  };

  // Memories
  const addMemory = (mem: Omit<MemoryMilestone, 'id'>) => {
    const newMem: MemoryMilestone = { ...mem, id: `mem_${Date.now()}` };
    setMemoriesState((prev) => {
      const updated = [newMem, ...prev];
      localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteMemory = (id: string) => {
    setMemoriesState((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(updated));
      return updated;
    });
  };

  const toggleFavoriteMemory = (id: string) => {
    setMemoriesState((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, isFavorite: !m.isFavorite } : m));
      localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(updated));
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
    localStorage.clear();
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
    setUserRole('parent');
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
    addPrescription,
    deletePrescription,
    addMemory,
    deleteMemory,
    toggleFavoriteMemory,
    toggleTheme,
    toggleUserRole,
    updateSupabaseConfig,
    resetToDemoData,
  };
}
