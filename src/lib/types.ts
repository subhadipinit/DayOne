export type Gender = 'female' | 'male';

export interface ChildProfile {
  id: string;
  name: string;
  nickname?: string;
  dob: string; // ISO string e.g. "2026-10-31T00:00:00"
  gender: Gender;
  birthWeightKg: number;
  birthLengthCm: number;
  birthHeadCircumferenceCm: number;
  bloodGroup: string;
  pediatricianName: string;
  pediatricianPhone: string;
  emergencyHospital: string;
  avatarUrl?: string;
  allergies?: string[];
}

export type VaccineCategory = 'government' | 'private' | 'both';
export type VaccineStatus = 'given' | 'upcoming' | 'overdue' | 'skipped';

export interface VaccineRecord {
  id: string;
  childId: string;
  name: string;
  code: string;
  targetDiseases: string;
  category: VaccineCategory; // 'government' (UIP Free) or 'private' (IAP)
  ageDueWeeks: number; // Due age in weeks from DOB
  ageDueDisplay: string; // e.g. "Birth", "6 Weeks", "9 Months"
  dueDate: string; // Calculated ISO date
  status: VaccineStatus;
  dateAdministered?: string;
  isPainless?: boolean; // Painless DTaP Hexavalent vs Painful DTwP
  brandName?: string; // e.g. "Hexaxim", "Prevenar 13", "Typbar TCV"
  batchNumber?: string;
  costInr?: number; // Cost in rupees for private vaccines
  clinicName?: string;
  doctorName?: string;
  receiptUrl?: string; // photo/file of bill
  notes?: string;
}

export interface GrowthRecord {
  id: string;
  childId: string;
  date: string;
  ageInDays: number;
  weightKg: number;
  lengthCm: number;
  headCircumferenceCm: number;
  notes?: string;
}

export interface FeedingLog {
  id: string;
  childId: string;
  timestamp: string;
  type: 'breast' | 'bottle' | 'pump' | 'solids';
  leftDurationMinutes?: number;
  rightDurationMinutes?: number;
  bottleAmountMl?: number;
  notes?: string;
}

export interface DiaperLog {
  id: string;
  childId: string;
  timestamp: string;
  type: 'wet' | 'dirty' | 'both';
  condition?: 'normal' | 'loose' | 'hard';
  color?: string;
  notes?: string;
}

export interface SleepLog {
  id: string;
  childId: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  notes?: string;
}

export interface DoctorQuestion {
  id: string;
  childId: string;
  question: string;
  isAnswered: boolean;
  answer?: string;
  dateCreated: string;
}

export interface SymptomLog {
  id: string;
  childId: string;
  date: string;
  symptom: string;
  temperatureC?: number;
  medicationGiven?: string;
  notes?: string;
}

export interface Prescription {
  id: string;
  childId: string;
  date: string;
  doctorName: string;
  clinicHospital: string;
  diagnosis: string;
  medicinesSummary: string;
  attachmentUrl?: string;
  fileType?: 'image' | 'pdf';
  notes?: string;
}

export interface MemoryMilestone {
  id: string;
  childId: string;
  title: string;
  milestoneTag: string; // "Birth", "Day 7", "First Smile", "1 Month", etc.
  date: string;
  ageDisplay: string;
  caption: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  isFavorite?: boolean;
}

export interface TummyTimeSession {
  id: string;
  childId?: string;
  timestamp: string;
  durationSeconds: number;
  mood: 'happy' | 'calm' | 'fussy';
  notes?: string;
}

export interface MomCareLog {
  id: string;
  date: string; // YYYY-MM-DD
  waterGlasses: number; // 250ml per glass
  moodRating: number; // 1 to 5
  sleepHours: number;
  painLevel: number; // 0 to 10
  supplementsTaken: boolean;
  notes?: string;
}
export type MomCareEntry = MomCareLog;

export interface ToothRecord {
  id: string;
  childId?: string;
  toothKey?: string; // e.g. 'lower-central-incisor-left'
  name: string;
  arch?: 'upper' | 'lower';
  jaw?: 'upper' | 'lower';
  side?: 'left' | 'right';
  type?:
    | 'incisor'
    | 'lateral'
    | 'canine'
    | 'molar1'
    | 'molar2'
    | 'molar_first'
    | 'molar_second'
    | 'incisor_central'
    | 'incisor_lateral';
  typicalAgeRangeDisplay?: string;
  status?: 'not_erupted' | 'erupted' | 'erupting';
  eruptedDate?: string;
  isErupted?: boolean;
  symptoms?: string[];
  notes?: string;
}

export interface SolidFoodItem {
  id: string;
  childId?: string;
  name: string;
  category: 'grain' | 'vegetable' | 'fruit' | 'protein' | 'dairy' | 'spice';
  isIntroduced?: boolean;
  firstOfferedDate?: string;
  reaction?: 'loved' | 'neutral' | 'disliked' | 'allergic';
  allergiesObserved?: string[]; // 'rash', 'diarrhea', 'vomiting', 'gas'
  timesOffered?: number;
  notes?: string;
  ageStageMonths?: '6-7m' | '7-8m' | '8-10m' | '10-12m' | '12m+';
  isIronRich?: boolean;
  isAllergen?: boolean;
}

export interface WeaningRecipeIngredient {
  item: string;
  amount: string;
  note?: string;
}

export interface WeaningRecipe {
  id: string;
  title: string;
  bengaliName?: string;
  hindiName?: string;
  stage: '6-7 Months' | '7-8 Months' | '8-10 Months' | '10-12 Months' | '12+ Months';
  stageKey: '6-7m' | '7-8m' | '8-10m' | '10-12m' | '12m+';
  category: 'porridge' | 'khichdi' | 'puree' | 'fingerfood' | 'soup' | 'snack';
  texture: string;
  prepTime: string;
  cookTime: string;
  difficulty: 'Quick & Gentle' | 'Easy 1-Pot' | 'Batch Cook';
  isIronRich: boolean;
  keyNutrients: string[];
  ingredients: WeaningRecipeIngredient[];
  instructions: string[];
  pediatricTip: string;
  storageGuidance: string;
  linkedFoodId?: string;
}

export interface WeaningStageInfo {
  stageId: '6-7m' | '7-8m' | '8-10m' | '10-12m' | '12m+';
  title: string;
  ageRange: string;
  subtitle: string;
  recommendedTexture: string;
  mealFrequency: string;
  servingSize: string;
  milkVsSolidsRatio: string;
  keyMilestones: string[];
  bestFirstFoods: string[];
  foodsToAvoid: string[];
  pediatricGoldenRules: string[];
  sampleDaySchedule: { time: string; activity: string; type: 'milk' | 'solid' | 'nap' | 'snack' }[];
}

export interface DevelopmentalMilestone {
  id: string;
  childId?: string;
  milestoneKey?: string;
  ageMonth: number; // 2, 4, 6, 9, 12, 18, 24
  category: 'motor' | 'cognitive' | 'language' | 'social';
  title: string;
  description: string;
  isAchieved: boolean;
  achievedDate?: string;
  isRedFlag?: boolean;
  notes?: string;
}
export type MilestoneCheckRecord = DevelopmentalMilestone;

export interface MedicineDoseLog {
  id: string;
  childId?: string;
  timestamp: string;
  medicineName: string; // e.g. "Paracetamol (Crocin Infant Drops 100mg/ml)"
  brandName?: string;
  category?: 'fever' | 'colic' | 'supplement' | 'cold' | 'digestive' | 'other';
  weightKgAtTime: number;
  dosageMg?: number;
  dosageMl: number;
  temperatureC?: number;
  reason?: string; // e.g. "Post-Vaccine Fever", "Teething", "Daily Morning Routine"
  administeredBy?: string; // "Mom", "Dad", "Grandparent", "Doctor/Nurse"
  notes?: string;
}
export type MedicationDoseLog = MedicineDoseLog;
