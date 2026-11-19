import { createClient } from '@supabase/supabase-js';

const defaultUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const defaultKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let cachedClient: ReturnType<typeof createClient> | null = null;
let cachedUrl = '';
let cachedKey = '';

export function isValidSupabaseUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (
    trimmed === '' ||
    trimmed.includes('your-project-id') ||
    trimmed.includes('xyzcompany') ||
    trimmed.includes('placeholder')
  ) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isValidSupabaseKey(key?: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (
    trimmed === '' ||
    trimmed.includes('your-publishable-or-anon-key') ||
    trimmed.includes('eyJhbGciOi...') ||
    trimmed.length < 20
  ) {
    return false;
  }
  return true;
}

export function getResolvedSupabaseCredentials(customUrl?: string, customKey?: string) {
  // 1. Explicit parameter
  if (customUrl && customKey && isValidSupabaseUrl(customUrl) && isValidSupabaseKey(customKey)) {
    return { url: customUrl.trim(), key: customKey.trim() };
  }

  // 2. Environment variables from process.env
  if (isValidSupabaseUrl(defaultUrl) && isValidSupabaseKey(defaultKey)) {
    return { url: defaultUrl.trim(), key: defaultKey.trim() };
  }

  // 3. Fallback from localStorage (user configured in Settings)
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('dayone_supabase_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (isValidSupabaseUrl(parsed.url) && isValidSupabaseKey(parsed.anonKey)) {
          return { url: parsed.url.trim(), key: parsed.anonKey.trim() };
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  return { url: '', key: '' };
}

export function getSupabaseClient(customUrl?: string, customKey?: string) {
  const { url, key } = getResolvedSupabaseCredentials(customUrl, customKey);

  if (!url || !key) {
    return null;
  }

  if (cachedClient && cachedUrl === url && cachedKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    cachedUrl = url;
    cachedKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function checkSupabaseConfigStatus(): {
  isConfigured: boolean;
  isPlaceholder: boolean;
  activeUrl: string;
} {
  const rawUrl = defaultUrl.trim();
  if (rawUrl.includes('your-project-id') || defaultKey.includes('your-publishable-or-anon-key')) {
    return { isConfigured: false, isPlaceholder: true, activeUrl: rawUrl };
  }
  const { url } = getResolvedSupabaseCredentials();
  return {
    isConfigured: Boolean(url),
    isPlaceholder: false,
    activeUrl: url || rawUrl,
  };
}

/**
 * SQL Schema definition for Supabase Postgres
 * Users can copy and run this in Supabase SQL editor to create the cloud database
 */
export const SUPABASE_SQL_SCHEMA = `
-- ============================================================
-- DayOne Baby Tracker - Complete Supabase Schema & Security
-- Paste this script into Supabase SQL Editor and click "Run"
-- ============================================================

create extension if not exists "uuid-ossp";

create table if not exists public.children (
  id text primary key,
  name text not null,
  nickname text,
  dob timestamp with time zone not null,
  gender text default 'female',
  birth_weight_kg numeric,
  birth_length_cm numeric,
  birth_head_cm numeric,
  blood_group text,
  pediatrician_name text,
  pediatrician_phone text,
  emergency_hospital text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

create table if not exists public.vaccines (
  id text primary key,
  child_id text references public.children(id) on delete cascade,
  name text not null,
  code text not null,
  target_diseases text,
  category text,
  age_due_weeks numeric,
  age_due_display text,
  due_date timestamp with time zone,
  status text default 'upcoming',
  date_administered date,
  is_painless boolean,
  brand_name text,
  batch_number text,
  cost_inr numeric default 0,
  clinic_name text,
  doctor_name text,
  receipt_url text,
  notes text,
  updated_at timestamp with time zone default now()
);

create table if not exists public.growth_records (
  id text primary key,
  child_id text references public.children(id) on delete cascade,
  date date not null,
  age_in_days int,
  weight_kg numeric not null,
  length_cm numeric not null,
  head_circumference_cm numeric not null,
  notes text,
  created_at timestamp with time zone default now()
);

create table if not exists public.feeding_logs (
  id text primary key,
  child_id text references public.children(id) on delete cascade,
  timestamp timestamp with time zone not null,
  type text not null,
  left_duration_minutes int default 0,
  right_duration_minutes int default 0,
  bottle_amount_ml numeric,
  notes text,
  created_at timestamp with time zone default now()
);

create table if not exists public.diaper_logs (
  id text primary key,
  child_id text references public.children(id) on delete cascade,
  timestamp timestamp with time zone not null,
  type text not null,
  condition text,
  color text,
  notes text,
  created_at timestamp with time zone default now()
);

create table if not exists public.sleep_logs (
  id text primary key,
  child_id text references public.children(id) on delete cascade,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  duration_minutes int,
  notes text,
  created_at timestamp with time zone default now()
);

create table if not exists public.doctor_questions (
  id text primary key,
  child_id text references public.children(id) on delete cascade,
  question text not null,
  is_answered boolean default false,
  answer text,
  date_created date default current_date
);

create table if not exists public.symptoms (
  id text primary key,
  child_id text references public.children(id) on delete cascade,
  date date not null,
  symptom text not null,
  temperature_c numeric,
  medication_given text,
  notes text,
  created_at timestamp with time zone default now()
);

create table if not exists public.prescriptions (
  id text primary key,
  child_id text references public.children(id) on delete cascade,
  date date not null,
  doctor_name text,
  clinic_hospital text,
  diagnosis text,
  medicines_summary text,
  attachment_url text,
  notes text,
  created_at timestamp with time zone default now()
);

create table if not exists public.memories (
  id text primary key,
  child_id text references public.children(id) on delete cascade,
  title text not null,
  milestone_tag text,
  date date not null,
  age_display text,
  caption text,
  media_url text,
  media_type text default 'image',
  is_favorite boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists public.medicine_logs (
  id text primary key,
  child_id text references public.children(id) on delete cascade,
  timestamp timestamp with time zone not null,
  medicine_name text not null,
  brand_name text,
  category text default 'other',
  weight_kg_at_time numeric,
  dosage_mg numeric,
  dosage_ml numeric not null,
  temperature_c numeric,
  reason text,
  administered_by text,
  notes text,
  created_at timestamp with time zone default now()
);

create table if not exists public.weaning_foods (
  id text primary key,
  child_id text references public.children(id) on delete cascade,
  name text not null,
  category text not null,
  is_introduced boolean default false,
  first_offered_date date,
  reaction text,
  allergies_observed text[],
  times_offered int default 0,
  notes text,
  age_stage_months text,
  is_iron_rich boolean default false,
  is_allergen boolean default false,
  updated_at timestamp with time zone default now()
);

create table if not exists public.teeth_records (
  id text primary key,
  child_id text references public.children(id) on delete cascade,
  tooth_key text,
  name text not null,
  arch text,
  jaw text,
  side text,
  type text,
  typical_age_range_display text,
  status text default 'not_erupted',
  erupted_date date,
  is_erupted boolean default false,
  symptoms text[],
  notes text,
  updated_at timestamp with time zone default now()
);

create table if not exists public.milestone_progress (
  id text primary key,
  child_id text references public.children(id) on delete cascade,
  milestone_key text,
  age_month int not null,
  category text not null,
  title text not null,
  description text,
  is_achieved boolean default false,
  achieved_date date,
  is_red_flag boolean default false,
  notes text,
  updated_at timestamp with time zone default now()
);

create table if not exists public.mom_care_logs (
  id text primary key,
  date date not null,
  water_glasses int default 0,
  mood_rating int default 3,
  sleep_hours numeric default 0,
  pain_level int default 0,
  supplements_taken boolean default false,
  notes text,
  updated_at timestamp with time zone default now()
);

create table if not exists public.tummy_time_logs (
  id text primary key,
  child_id text references public.children(id) on delete cascade,
  timestamp timestamp with time zone not null,
  duration_seconds int not null,
  mood text default 'calm',
  notes text,
  created_at timestamp with time zone default now()
);

insert into storage.buckets (id, name, public) 
values ('baby-media', 'baby-media', true)
on conflict (id) do update set public = true;

alter table public.children enable row level security;
alter table public.vaccines enable row level security;
alter table public.growth_records enable row level security;
alter table public.feeding_logs enable row level security;
alter table public.diaper_logs enable row level security;
alter table public.sleep_logs enable row level security;
alter table public.doctor_questions enable row level security;
alter table public.symptoms enable row level security;
alter table public.prescriptions enable row level security;
alter table public.memories enable row level security;
alter table public.medicine_logs enable row level security;
alter table public.weaning_foods enable row level security;
alter table public.teeth_records enable row level security;
alter table public.milestone_progress enable row level security;
alter table public.mom_care_logs enable row level security;
alter table public.tummy_time_logs enable row level security;

create policy "Allow all actions for anon users" on public.children for all using (true) with check (true);
create policy "Allow all actions for anon users" on public.vaccines for all using (true) with check (true);
create policy "Allow all actions for anon users" on public.growth_records for all using (true) with check (true);
create policy "Allow all actions for anon users" on public.feeding_logs for all using (true) with check (true);
create policy "Allow all actions for anon users" on public.diaper_logs for all using (true) with check (true);
create policy "Allow all actions for anon users" on public.sleep_logs for all using (true) with check (true);
create policy "Allow all actions for anon users" on public.doctor_questions for all using (true) with check (true);
create policy "Allow all actions for anon users" on public.symptoms for all using (true) with check (true);
create policy "Allow all actions for anon users" on public.prescriptions for all using (true) with check (true);
create policy "Allow all actions for anon users" on public.memories for all using (true) with check (true);
create policy "Allow all actions for anon users" on public.medicine_logs for all using (true) with check (true);
create policy "Allow all actions for anon users" on public.weaning_foods for all using (true) with check (true);
create policy "Allow all actions for anon users" on public.teeth_records for all using (true) with check (true);
create policy "Allow all actions for anon users" on public.milestone_progress for all using (true) with check (true);
create policy "Allow all actions for anon users" on public.mom_care_logs for all using (true) with check (true);
create policy "Allow all actions for anon users" on public.tummy_time_logs for all using (true) with check (true);
create policy "Public Access to baby-media" on storage.objects for all using (bucket_id = 'baby-media') with check (bucket_id = 'baby-media');
`;
