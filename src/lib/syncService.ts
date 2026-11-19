import { getSupabaseClient } from './supabaseClient';
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

export interface SyncPayload {
  profile: ChildProfile;
  vaccines: VaccineRecord[];
  growthRecords: GrowthRecord[];
  feedingLogs: FeedingLog[];
  diaperLogs: DiaperLog[];
  sleepLogs: SleepLog[];
  questions: DoctorQuestion[];
  symptoms: SymptomLog[];
  prescriptions: Prescription[];
  memories: MemoryMilestone[];
}

export async function pushAllToSupabase(payload: SyncPayload): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase credentials not configured.' };
  }

  try {
    // 1. Sync Child Profile
    const { error: profileErr } = await (client as any).from('children').upsert({
      id: payload.profile.id,
      name: payload.profile.name,
      nickname: payload.profile.nickname,
      dob: payload.profile.dob,
      gender: payload.profile.gender,
      birth_weight_kg: payload.profile.birthWeightKg,
      birth_length_cm: payload.profile.birthLengthCm,
      birth_head_cm: payload.profile.birthHeadCircumferenceCm,
      blood_group: payload.profile.bloodGroup,
      pediatrician_name: payload.profile.pediatricianName,
      pediatrician_phone: payload.profile.pediatricianPhone,
      emergency_hospital: payload.profile.emergencyHospital,
      avatar_url: payload.profile.avatarUrl,
    });
    if (profileErr) throw profileErr;

    // 2. Sync Vaccines
    if (payload.vaccines.length > 0) {
      const vaxRecords = payload.vaccines.map((v) => ({
        id: v.id,
        child_id: v.childId,
        name: v.name,
        code: v.code,
        target_diseases: v.targetDiseases,
        category: v.category,
        age_due_weeks: v.ageDueWeeks,
        age_due_display: v.ageDueDisplay,
        due_date: v.dueDate,
        status: v.status,
        date_administered: v.dateAdministered || null,
        is_painless: v.isPainless,
        brand_name: v.brandName,
        batch_number: v.batchNumber,
        cost_inr: v.costInr,
        clinic_name: v.clinicName,
        notes: v.notes,
        receipt_url: v.receiptUrl,
      }));
      const { error: vaxErr } = await (client as any).from('vaccines').upsert(vaxRecords);
      if (vaxErr) throw vaxErr;
    }

    // 3. Sync Growth Records
    if (payload.growthRecords.length > 0) {
      const growthRecs = payload.growthRecords.map((g) => ({
        id: g.id,
        child_id: g.childId,
        date: g.date,
        age_in_days: g.ageInDays,
        weight_kg: g.weightKg,
        length_cm: g.lengthCm,
        head_circumference_cm: g.headCircumferenceCm,
        notes: g.notes,
      }));
      const { error: gErr } = await (client as any).from('growth_records').upsert(growthRecs);
      if (gErr) throw gErr;
    }

    // 4. Sync Prescriptions
    if (payload.prescriptions.length > 0) {
      const rxRecs = payload.prescriptions.map((rx) => ({
        id: rx.id,
        child_id: rx.childId,
        date: rx.date,
        doctor_name: rx.doctorName,
        clinic_hospital: rx.clinicHospital,
        diagnosis: rx.diagnosis,
        medicines_summary: rx.medicinesSummary,
        attachment_url: rx.attachmentUrl,
        notes: rx.notes,
      }));
      const { error: rxErr } = await (client as any).from('prescriptions').upsert(rxRecs);
      if (rxErr) throw rxErr;
    }

    // 5. Sync Memories
    if (payload.memories.length > 0) {
      const memRecs = payload.memories.map((m) => ({
        id: m.id,
        child_id: m.childId,
        title: m.title,
        milestone_tag: m.milestoneTag,
        date: m.date,
        age_display: m.ageDisplay,
        caption: m.caption,
        media_url: m.mediaUrl,
        media_type: m.mediaType,
        is_favorite: m.isFavorite,
      }));
      const { error: memErr } = await (client as any).from('memories').upsert(memRecs);
      if (memErr) throw memErr;
    }

    return { success: true, message: 'All records synced to Supabase Cloud!' };
  } catch (err: any) {
    console.error('Supabase Sync Error:', err);
    return { success: false, message: err?.message || 'Failed to sync with Supabase.' };
  }
}

export async function pullAllFromSupabase(childId: string) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const [profileRes, vaxRes, growthRes, rxRes, memRes] = await Promise.all([
      client.from('children').select('*').eq('id', childId).maybeSingle(),
      client.from('vaccines').select('*').eq('child_id', childId),
      client.from('growth_records').select('*').eq('child_id', childId),
      client.from('prescriptions').select('*').eq('child_id', childId),
      client.from('memories').select('*').eq('child_id', childId),
    ]);

    return {
      profile: profileRes.data,
      vaccines: vaxRes.data,
      growthRecords: growthRes.data,
      prescriptions: rxRes.data,
      memories: memRes.data,
    };
  } catch (err) {
    console.error('Supabase Pull Error:', err);
    return null;
  }
}
