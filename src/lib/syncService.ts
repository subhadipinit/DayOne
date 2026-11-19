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
  MedicationDoseLog,
  SolidFoodItem,
  ToothRecord,
  DevelopmentalMilestone,
  MomCareLog,
  TummyTimeSession,
} from './types';

export interface SyncPayload {
  profile: ChildProfile;
  profilesList?: ChildProfile[];
  vaccines: VaccineRecord[];
  growthRecords: GrowthRecord[];
  feedingLogs: FeedingLog[];
  diaperLogs: DiaperLog[];
  sleepLogs: SleepLog[];
  questions: DoctorQuestion[];
  symptoms: SymptomLog[];
  prescriptions: Prescription[];
  memories: MemoryMilestone[];
  medicineLogs?: MedicationDoseLog[];
  weaningFoods?: SolidFoodItem[];
  teethRecords?: ToothRecord[];
  milestones?: DevelopmentalMilestone[];
  momCareLogs?: MomCareLog[];
  tummyTimeSessions?: TummyTimeSession[];
}

/**
 * Safely upserts records to a table, gracefully ignoring missing table errors
 * if the table has not yet been executed in the Supabase SQL editor.
 */
async function safeUpsert(client: any, table: string, records: any[]): Promise<{ table: string; count: number; error?: string }> {
  if (!records || records.length === 0) {
    return { table, count: 0 };
  }

  try {
    const { error } = await client.from(table).upsert(records);
    if (error) {
      // If table doesn't exist yet, return soft warning without aborting entire sync
      if (error.code === '42P01' || error.message?.includes('schema cache')) {
        console.warn(`[Supabase Sync] Table '${table}' does not exist yet. Run updated SQL schema.`);
        return { table, count: 0, error: `Table '${table}' not found in database.` };
      }
      console.error(`[Supabase Sync] Error in ${table}:`, error.message);
      return { table, count: 0, error: error.message };
    }
    return { table, count: records.length };
  } catch (err: any) {
    console.warn(`[Supabase Sync] Exception in ${table}:`, err?.message);
    return { table, count: 0, error: err?.message };
  }
}

/**
 * Push all local records across all 16 DayOne modules into Supabase Cloud
 */
export async function pushAllToSupabase(payload: SyncPayload): Promise<{
  success: boolean;
  message: string;
  syncedTables: string[];
  skippedTables: string[];
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase credentials not configured.',
      syncedTables: [],
      skippedTables: [],
    };
  }

  const childId = payload.profile.id;
  const syncedTables: string[] = [];
  const skippedTables: string[] = [];

  try {
    // 1. Children Profiles (both current child and all siblings)
    const allProfiles = payload.profilesList && payload.profilesList.length > 0
      ? payload.profilesList
      : [payload.profile];

    const childRows = allProfiles.map((p) => ({
      id: p.id,
      name: p.name,
      nickname: p.nickname || null,
      dob: p.dob,
      gender: p.gender || 'female',
      birth_weight_kg: p.birthWeightKg || null,
      birth_length_cm: p.birthLengthCm || null,
      birth_head_cm: p.birthHeadCircumferenceCm || null,
      blood_group: p.bloodGroup || null,
      pediatrician_name: p.pediatricianName || null,
      pediatrician_phone: p.pediatricianPhone || null,
      emergency_hospital: p.emergencyHospital || null,
      avatar_url: p.avatarUrl || null,
    }));
    const childRes = await safeUpsert(client, 'children', childRows);
    if (!childRes.error) syncedTables.push(`children (${childRes.count})`);
    else skippedTables.push('children');

    // 2. Vaccines
    if (payload.vaccines.length > 0) {
      const vaxRows = payload.vaccines.map((v) => ({
        id: v.id,
        child_id: v.childId || childId,
        name: v.name,
        code: v.code,
        target_diseases: v.targetDiseases || null,
        category: v.category,
        age_due_weeks: v.ageDueWeeks,
        age_due_display: v.ageDueDisplay,
        due_date: v.dueDate,
        status: v.status,
        date_administered: v.dateAdministered || null,
        is_painless: v.isPainless ?? null,
        brand_name: v.brandName || null,
        batch_number: v.batchNumber || null,
        cost_inr: v.costInr || 0,
        clinic_name: v.clinicName || null,
        doctor_name: v.doctorName || null,
        receipt_url: v.receiptUrl || null,
        notes: v.notes || null,
      }));
      const vaxRes = await safeUpsert(client, 'vaccines', vaxRows);
      if (!vaxRes.error) syncedTables.push(`vaccines (${vaxRes.count})`);
      else skippedTables.push('vaccines');
    }

    // 3. Growth Records
    if (payload.growthRecords.length > 0) {
      const growthRows = payload.growthRecords.map((g) => ({
        id: g.id,
        child_id: g.childId || childId,
        date: g.date,
        age_in_days: g.ageInDays,
        weight_kg: g.weightKg,
        length_cm: g.lengthCm,
        head_circumference_cm: g.headCircumferenceCm,
        notes: g.notes || null,
      }));
      const growthRes = await safeUpsert(client, 'growth_records', growthRows);
      if (!growthRes.error) syncedTables.push(`growth_records (${growthRes.count})`);
      else skippedTables.push('growth_records');
    }

    // 4. Daily Care: Feeding Logs
    if (payload.feedingLogs.length > 0) {
      const feedRows = payload.feedingLogs.map((f) => ({
        id: f.id,
        child_id: f.childId || childId,
        timestamp: f.timestamp,
        type: f.type,
        left_duration_minutes: f.leftDurationMinutes || 0,
        right_duration_minutes: f.rightDurationMinutes || 0,
        bottle_amount_ml: f.bottleAmountMl || null,
        notes: f.notes || null,
      }));
      const feedRes = await safeUpsert(client, 'feeding_logs', feedRows);
      if (!feedRes.error) syncedTables.push(`feeding_logs (${feedRes.count})`);
      else skippedTables.push('feeding_logs');
    }

    // 5. Daily Care: Diaper Logs
    if (payload.diaperLogs.length > 0) {
      const diaperRows = payload.diaperLogs.map((d) => ({
        id: d.id,
        child_id: d.childId || childId,
        timestamp: d.timestamp,
        type: d.type,
        condition: d.condition || null,
        color: d.color || null,
        notes: d.notes || null,
      }));
      const diaperRes = await safeUpsert(client, 'diaper_logs', diaperRows);
      if (!diaperRes.error) syncedTables.push(`diaper_logs (${diaperRes.count})`);
      else skippedTables.push('diaper_logs');
    }

    // 6. Daily Care: Sleep Logs
    if (payload.sleepLogs.length > 0) {
      const sleepRows = payload.sleepLogs.map((s) => ({
        id: s.id,
        child_id: s.childId || childId,
        start_time: s.startTime,
        end_time: s.endTime || null,
        duration_minutes: s.durationMinutes || null,
        notes: s.notes || null,
      }));
      const sleepRes = await safeUpsert(client, 'sleep_logs', sleepRows);
      if (!sleepRes.error) syncedTables.push(`sleep_logs (${sleepRes.count})`);
      else skippedTables.push('sleep_logs');
    }

    // 7. Doctor Questions
    if (payload.questions.length > 0) {
      const qRows = payload.questions.map((q) => ({
        id: q.id,
        child_id: q.childId || childId,
        question: q.question,
        is_answered: q.isAnswered ?? false,
        answer: q.answer || null,
        date_created: q.dateCreated || new Date().toISOString().split('T')[0],
      }));
      const qRes = await safeUpsert(client, 'doctor_questions', qRows);
      if (!qRes.error) syncedTables.push(`doctor_questions (${qRes.count})`);
      else skippedTables.push('doctor_questions');
    }

    // 8. Symptoms
    if (payload.symptoms.length > 0) {
      const symRows = payload.symptoms.map((sym) => ({
        id: sym.id,
        child_id: sym.childId || childId,
        date: sym.date,
        symptom: sym.symptom,
        temperature_c: sym.temperatureC || null,
        medication_given: sym.medicationGiven || null,
        notes: sym.notes || null,
      }));
      const symRes = await safeUpsert(client, 'symptoms', symRows);
      if (!symRes.error) syncedTables.push(`symptoms (${symRes.count})`);
      else skippedTables.push('symptoms');
    }

    // 9. Prescriptions
    if (payload.prescriptions.length > 0) {
      const rxRows = payload.prescriptions.map((rx) => ({
        id: rx.id,
        child_id: rx.childId || childId,
        date: rx.date,
        doctor_name: rx.doctorName || null,
        clinic_hospital: rx.clinicHospital || null,
        diagnosis: rx.diagnosis || null,
        medicines_summary: rx.medicinesSummary || null,
        attachment_url: rx.attachmentUrl || null,
        notes: rx.notes || null,
      }));
      const rxRes = await safeUpsert(client, 'prescriptions', rxRows);
      if (!rxRes.error) syncedTables.push(`prescriptions (${rxRes.count})`);
      else skippedTables.push('prescriptions');
    }

    // 10. Memories
    if (payload.memories.length > 0) {
      const memRows = payload.memories.map((m) => ({
        id: m.id,
        child_id: m.childId || childId,
        title: m.title,
        milestone_tag: m.milestoneTag || null,
        date: m.date,
        age_display: m.ageDisplay || null,
        caption: m.caption || null,
        media_url: m.mediaUrl,
        media_type: m.mediaType || 'image',
        is_favorite: m.isFavorite ?? false,
      }));
      const memRes = await safeUpsert(client, 'memories', memRows);
      if (!memRes.error) syncedTables.push(`memories (${memRes.count})`);
      else skippedTables.push('memories');
    }

    // 11. Medicine History Logs
    if (payload.medicineLogs && payload.medicineLogs.length > 0) {
      const medRows = payload.medicineLogs.map((med) => ({
        id: med.id,
        child_id: med.childId || childId,
        timestamp: med.timestamp,
        medicine_name: med.medicineName,
        brand_name: med.brandName || null,
        category: med.category || 'other',
        weight_kg_at_time: med.weightKgAtTime || null,
        dosage_mg: med.dosageMg || null,
        dosage_ml: med.dosageMl || 0,
        temperature_c: med.temperatureC || null,
        reason: med.reason || null,
        administered_by: med.administeredBy || null,
        notes: med.notes || null,
      }));
      const medRes = await safeUpsert(client, 'medicine_logs', medRows);
      if (!medRes.error) syncedTables.push(`medicine_logs (${medRes.count})`);
      else skippedTables.push('medicine_logs');
    }

    // 12. Solid Weaning Foods
    if (payload.weaningFoods && payload.weaningFoods.length > 0) {
      const foodRows = payload.weaningFoods.map((wf) => ({
        id: wf.id,
        child_id: wf.childId || childId,
        name: wf.name,
        category: wf.category,
        is_introduced: wf.isIntroduced ?? false,
        first_offered_date: wf.firstOfferedDate || null,
        reaction: wf.reaction || null,
        allergies_observed: wf.allergiesObserved || [],
        times_offered: wf.timesOffered || 0,
        notes: wf.notes || null,
        age_stage_months: wf.ageStageMonths || null,
        is_iron_rich: wf.isIronRich ?? false,
        is_allergen: wf.isAllergen ?? false,
      }));
      const foodRes = await safeUpsert(client, 'weaning_foods', foodRows);
      if (!foodRes.error) syncedTables.push(`weaning_foods (${foodRes.count})`);
      else skippedTables.push('weaning_foods');
    }

    // 13. Teeth Records
    if (payload.teethRecords && payload.teethRecords.length > 0) {
      const toothRows = payload.teethRecords.map((tr) => ({
        id: tr.id,
        child_id: tr.childId || childId,
        tooth_key: tr.toothKey || null,
        name: tr.name,
        arch: tr.arch || tr.jaw || null,
        jaw: tr.jaw || tr.arch || null,
        side: tr.side || null,
        type: tr.type || null,
        typical_age_range_display: tr.typicalAgeRangeDisplay || null,
        status: tr.status || (tr.isErupted ? 'erupted' : 'not_erupted'),
        erupted_date: tr.eruptedDate || null,
        is_erupted: tr.isErupted ?? false,
        symptoms: tr.symptoms || [],
        notes: tr.notes || null,
      }));
      const toothRes = await safeUpsert(client, 'teeth_records', toothRows);
      if (!toothRes.error) syncedTables.push(`teeth_records (${toothRes.count})`);
      else skippedTables.push('teeth_records');
    }

    // 14. Developmental Milestones
    if (payload.milestones && payload.milestones.length > 0) {
      const msRows = payload.milestones.map((ms) => ({
        id: ms.id,
        child_id: ms.childId || childId,
        milestone_key: ms.milestoneKey || null,
        age_month: ms.ageMonth,
        category: ms.category,
        title: ms.title,
        description: ms.description || null,
        is_achieved: ms.isAchieved ?? false,
        achieved_date: ms.achievedDate || null,
        is_red_flag: ms.isRedFlag ?? false,
        notes: ms.notes || null,
      }));
      const msRes = await safeUpsert(client, 'milestone_progress', msRows);
      if (!msRes.error) syncedTables.push(`milestone_progress (${msRes.count})`);
      else skippedTables.push('milestone_progress');
    }

    // 15. Maternal Care & Hydration
    if (payload.momCareLogs && payload.momCareLogs.length > 0) {
      const momRows = payload.momCareLogs.map((m) => ({
        id: m.id,
        date: m.date,
        water_glasses: m.waterGlasses || 0,
        mood_rating: m.moodRating || 3,
        sleep_hours: m.sleepHours || 0,
        pain_level: m.painLevel || 0,
        supplements_taken: m.supplementsTaken ?? false,
        notes: m.notes || null,
      }));
      const momRes = await safeUpsert(client, 'mom_care_logs', momRows);
      if (!momRes.error) syncedTables.push(`mom_care_logs (${momRes.count})`);
      else skippedTables.push('mom_care_logs');
    }

    // 16. Tummy Time Sessions
    if (payload.tummyTimeSessions && payload.tummyTimeSessions.length > 0) {
      const ttRows = payload.tummyTimeSessions.map((tt) => ({
        id: tt.id,
        child_id: tt.childId || childId,
        timestamp: tt.timestamp,
        duration_seconds: tt.durationSeconds || 0,
        mood: tt.mood || 'calm',
        notes: tt.notes || null,
      }));
      const ttRes = await safeUpsert(client, 'tummy_time_logs', ttRows);
      if (!ttRes.error) syncedTables.push(`tummy_time_logs (${ttRes.count})`);
      else skippedTables.push('tummy_time_logs');
    }

    const summary = `${syncedTables.length} categories synced to Supabase Cloud!`;
    return {
      success: true,
      message: summary,
      syncedTables,
      skippedTables,
    };
  } catch (err: any) {
    console.error('Supabase Sync Error:', err);
    return {
      success: false,
      message: err?.message || 'Failed to sync with Supabase.',
      syncedTables,
      skippedTables,
    };
  }
}

/**
 * Real-time background sync for an individual record as actions occur
 */
export async function syncSingleRecord(table: string, record: any): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !record) return;

  try {
    const { error } = await (client as any).from(table).upsert(record);
    if (error && error.code !== '42P01') {
      console.warn(`[AutoSync] Error upserting to ${table}:`, error.message);
    }
  } catch (err) {
    // Non-blocking background catch
  }
}

/**
 * Real-time background delete for an individual record
 */
export async function deleteSingleRecord(table: string, id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !id) return;

  try {
    const { error } = await (client as any).from(table).delete().eq('id', id);
    if (error && error.code !== '42P01') {
      console.warn(`[AutoSync] Error deleting from ${table}:`, error.message);
    }
  } catch (err) {
    // Non-blocking background catch
  }
}

/**
 * Pull all records for a child from Supabase Cloud to hydrate local state
 */
export async function pullAllFromSupabase(childId: string) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const [
      profileRes,
      allChildrenRes,
      vaxRes,
      growthRes,
      feedRes,
      diaperRes,
      sleepRes,
      qRes,
      symRes,
      rxRes,
      memRes,
      medRes,
      foodRes,
      toothRes,
      msRes,
      momRes,
      ttRes,
    ] = await Promise.all([
      client.from('children').select('*').eq('id', childId).maybeSingle(),
      client.from('children').select('*'),
      client.from('vaccines').select('*').eq('child_id', childId),
      client.from('growth_records').select('*').eq('child_id', childId),
      client.from('feeding_logs').select('*').eq('child_id', childId),
      client.from('diaper_logs').select('*').eq('child_id', childId),
      client.from('sleep_logs').select('*').eq('child_id', childId),
      client.from('doctor_questions').select('*').eq('child_id', childId),
      client.from('symptoms').select('*').eq('child_id', childId),
      client.from('prescriptions').select('*').eq('child_id', childId),
      client.from('memories').select('*').eq('child_id', childId),
      client.from('medicine_logs').select('*').eq('child_id', childId),
      client.from('weaning_foods').select('*').eq('child_id', childId),
      client.from('teeth_records').select('*').eq('child_id', childId),
      client.from('milestone_progress').select('*').eq('child_id', childId),
      client.from('mom_care_logs').select('*'),
      client.from('tummy_time_logs').select('*').eq('child_id', childId),
    ]);

    // Format Children profiles
    let profilesList: ChildProfile[] = [];
    if (allChildrenRes.data && Array.isArray(allChildrenRes.data)) {
      profilesList = (allChildrenRes.data as any[]).map((c: any) => ({
        id: c.id,
        name: c.name,
        nickname: c.nickname || undefined,
        dob: c.dob,
        gender: c.gender || 'female',
        birthWeightKg: Number(c.birth_weight_kg) || 0,
        birthLengthCm: Number(c.birth_length_cm) || 0,
        birthHeadCircumferenceCm: Number(c.birth_head_cm) || 0,
        bloodGroup: c.blood_group || 'O+',
        pediatricianName: c.pediatrician_name || '',
        pediatricianPhone: c.pediatrician_phone || '',
        emergencyHospital: c.emergency_hospital || '',
        avatarUrl: c.avatar_url || '',
      }));
    }

    // Format Active Child profile
    let profile: ChildProfile | null = null;
    if (profileRes.data) {
      const c = profileRes.data as any;
      profile = {
        id: c.id,
        name: c.name,
        nickname: c.nickname || undefined,
        dob: c.dob,
        gender: c.gender || 'female',
        birthWeightKg: Number(c.birth_weight_kg) || 0,
        birthLengthCm: Number(c.birth_length_cm) || 0,
        birthHeadCircumferenceCm: Number(c.birth_head_cm) || 0,
        bloodGroup: c.blood_group || 'O+',
        pediatricianName: c.pediatrician_name || '',
        pediatricianPhone: c.pediatrician_phone || '',
        emergencyHospital: c.emergency_hospital || '',
        avatarUrl: c.avatar_url || '',
      };
    }

    // Format Vaccines
    const vaccines: VaccineRecord[] = (vaxRes.data || []).map((v: any) => ({
      id: v.id,
      childId: v.child_id,
      name: v.name,
      code: v.code,
      targetDiseases: v.target_diseases || '',
      category: v.category || 'government',
      ageDueWeeks: Number(v.age_due_weeks) || 0,
      ageDueDisplay: v.age_due_display || '',
      dueDate: v.due_date,
      status: v.status || 'upcoming',
      dateAdministered: v.date_administered || undefined,
      isPainless: v.is_painless ?? undefined,
      brandName: v.brand_name || undefined,
      batchNumber: v.batch_number || undefined,
      costInr: Number(v.cost_inr) || 0,
      clinicName: v.clinic_name || undefined,
      doctorName: v.doctor_name || undefined,
      receiptUrl: v.receipt_url || undefined,
      notes: v.notes || undefined,
    }));

    // Format Growth
    const growthRecords: GrowthRecord[] = (growthRes.data || []).map((g: any) => ({
      id: g.id,
      childId: g.child_id,
      date: g.date,
      ageInDays: Number(g.age_in_days) || 0,
      weightKg: Number(g.weight_kg) || 0,
      lengthCm: Number(g.lengthCm || g.length_cm) || 0,
      headCircumferenceCm: Number(g.headCircumferenceCm || g.head_circumference_cm) || 0,
      notes: g.notes || undefined,
    }));

    // Format Feeding
    const feedingLogs: FeedingLog[] = (feedRes.data || []).map((f: any) => ({
      id: f.id,
      childId: f.child_id,
      timestamp: f.timestamp,
      type: f.type,
      leftDurationMinutes: Number(f.left_duration_minutes) || 0,
      rightDurationMinutes: Number(f.right_duration_minutes) || 0,
      bottleAmountMl: f.bottle_amount_ml ? Number(f.bottle_amount_ml) : undefined,
      notes: f.notes || undefined,
    }));

    // Format Diaper
    const diaperLogs: DiaperLog[] = (diaperRes.data || []).map((d: any) => ({
      id: d.id,
      childId: d.child_id,
      timestamp: d.timestamp,
      type: d.type,
      condition: d.condition || undefined,
      color: d.color || undefined,
      notes: d.notes || undefined,
    }));

    // Format Sleep
    const sleepLogs: SleepLog[] = (sleepRes.data || []).map((s: any) => ({
      id: s.id,
      childId: s.child_id,
      startTime: s.start_time,
      endTime: s.end_time || undefined,
      durationMinutes: s.duration_minutes ? Number(s.duration_minutes) : undefined,
      notes: s.notes || undefined,
    }));

    // Format Questions
    const questions: DoctorQuestion[] = (qRes.data || []).map((q: any) => ({
      id: q.id,
      childId: q.child_id,
      question: q.question,
      isAnswered: Boolean(q.is_answered),
      answer: q.answer || undefined,
      dateCreated: q.date_created || '',
    }));

    // Format Symptoms
    const symptoms: SymptomLog[] = (symRes.data || []).map((sym: any) => ({
      id: sym.id,
      childId: sym.child_id,
      date: sym.date,
      symptom: sym.symptom,
      temperatureC: sym.temperature_c ? Number(sym.temperature_c) : undefined,
      medicationGiven: sym.medication_given || undefined,
      notes: sym.notes || undefined,
    }));

    // Format Prescriptions
    const prescriptions: Prescription[] = (rxRes.data || []).map((rx: any) => ({
      id: rx.id,
      childId: rx.child_id,
      date: rx.date,
      doctorName: rx.doctor_name || '',
      clinicHospital: rx.clinic_hospital || '',
      diagnosis: rx.diagnosis || '',
      medicinesSummary: rx.medicines_summary || '',
      attachmentUrl: rx.attachment_url || undefined,
      notes: rx.notes || undefined,
    }));

    // Format Memories
    const memories: MemoryMilestone[] = (memRes.data || []).map((m: any) => ({
      id: m.id,
      childId: m.child_id,
      title: m.title,
      milestoneTag: m.milestone_tag || '',
      date: m.date,
      ageDisplay: m.age_display || '',
      caption: m.caption || '',
      mediaUrl: m.media_url,
      mediaType: m.media_type || 'image',
      isFavorite: Boolean(m.is_favorite),
    }));

    // Format Medicines
    const medicineLogs: MedicationDoseLog[] = (medRes.data || []).map((med: any) => ({
      id: med.id,
      childId: med.child_id,
      timestamp: med.timestamp,
      medicineName: med.medicine_name,
      brandName: med.brand_name || undefined,
      category: med.category || 'other',
      weightKgAtTime: Number(med.weight_kg_at_time) || 0,
      dosageMg: med.dosage_mg ? Number(med.dosage_mg) : undefined,
      dosageMl: Number(med.dosage_ml) || 0,
      temperatureC: med.temperature_c ? Number(med.temperature_c) : undefined,
      reason: med.reason || undefined,
      administeredBy: med.administered_by || undefined,
      notes: med.notes || undefined,
    }));

    // Format Weaning Foods
    const weaningFoods: SolidFoodItem[] = (foodRes.data || []).map((wf: any) => ({
      id: wf.id,
      childId: wf.child_id,
      name: wf.name,
      category: wf.category || 'grain',
      isIntroduced: Boolean(wf.is_introduced),
      firstOfferedDate: wf.first_offered_date || undefined,
      reaction: wf.reaction || undefined,
      allergiesObserved: wf.allergies_observed || [],
      timesOffered: Number(wf.times_offered) || 0,
      notes: wf.notes || undefined,
      ageStageMonths: wf.age_stage_months || undefined,
      isIronRich: Boolean(wf.is_iron_rich),
      isAllergen: Boolean(wf.is_allergen),
    }));

    // Format Teeth
    const teethRecords: ToothRecord[] = (toothRes.data || []).map((tr: any) => ({
      id: tr.id,
      childId: tr.child_id,
      toothKey: tr.tooth_key || undefined,
      name: tr.name,
      arch: tr.arch || undefined,
      jaw: tr.jaw || undefined,
      side: tr.side || undefined,
      type: tr.type || undefined,
      typicalAgeRangeDisplay: tr.typical_age_range_display || undefined,
      status: tr.status || 'not_erupted',
      eruptedDate: tr.erupted_date || undefined,
      isErupted: Boolean(tr.is_erupted),
      symptoms: tr.symptoms || [],
      notes: tr.notes || undefined,
    }));

    // Format Milestones
    const milestones: DevelopmentalMilestone[] = (msRes.data || []).map((ms: any) => ({
      id: ms.id,
      childId: ms.child_id,
      milestoneKey: ms.milestone_key || undefined,
      ageMonth: Number(ms.age_month) || 2,
      category: ms.category || 'motor',
      title: ms.title,
      description: ms.description || '',
      isAchieved: Boolean(ms.is_achieved),
      achievedDate: ms.achieved_date || undefined,
      isRedFlag: Boolean(ms.is_red_flag),
      notes: ms.notes || undefined,
    }));

    // Format Mom Care
    const momCareLogs: MomCareLog[] = (momRes.data || []).map((m: any) => ({
      id: m.id,
      date: m.date,
      waterGlasses: Number(m.water_glasses) || 0,
      moodRating: Number(m.mood_rating) || 3,
      sleepHours: Number(m.sleep_hours) || 0,
      painLevel: Number(m.pain_level) || 0,
      supplementsTaken: Boolean(m.supplements_taken),
      notes: m.notes || undefined,
    }));

    // Format Tummy Time
    const tummyTimeSessions: TummyTimeSession[] = (ttRes.data || []).map((tt: any) => ({
      id: tt.id,
      childId: tt.child_id,
      timestamp: tt.timestamp,
      durationSeconds: Number(tt.duration_seconds) || 0,
      mood: tt.mood || 'calm',
      notes: tt.notes || undefined,
    }));

    return {
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
      medicineLogs,
      weaningFoods,
      teethRecords,
      milestones,
      momCareLogs,
      tummyTimeSessions,
    };
  } catch (err) {
    console.error('Supabase Pull Error:', err);
    return null;
  }
}
