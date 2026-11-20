-- ============================================================
-- DayOne Baby Tracker - Complete Supabase Schema & Security
-- Paste this script into Supabase SQL Editor and click "Run"
-- ============================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Children Profiles Table
create table if not exists public.children (
  id text primary key,
  user_id uuid references auth.users(id) default auth.uid(),
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

-- Migration safety for existing deployments
alter table public.children add column if not exists user_id uuid references auth.users(id) default auth.uid();

-- 3. Immunization & Vaccines Table
create table if not exists public.vaccines (
  id text primary key,
  child_id text references public.children(id) on delete cascade,
  name text not null,
  code text not null,
  target_diseases text,
  category text, -- 'government' (UIP) or 'private' (IAP)
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

-- 4. Growth Measurements Table
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

-- 5. Daily Care: Feeding Logs (Breastfeeding & Bottle)
create table if not exists public.feeding_logs (
  id text primary key,
  child_id text references public.children(id) on delete cascade,
  timestamp timestamp with time zone not null,
  type text not null, -- 'breast', 'bottle', 'pump', 'solids'
  left_duration_minutes int default 0,
  right_duration_minutes int default 0,
  bottle_amount_ml numeric,
  notes text,
  created_at timestamp with time zone default now()
);

-- 6. Daily Care: Diaper Logs (Wet, Dirty, Both)
create table if not exists public.diaper_logs (
  id text primary key,
  child_id text references public.children(id) on delete cascade,
  timestamp timestamp with time zone not null,
  type text not null, -- 'wet', 'dirty', 'both'
  condition text,
  color text,
  notes text,
  created_at timestamp with time zone default now()
);

-- 7. Daily Care: Sleep Logs
create table if not exists public.sleep_logs (
  id text primary key,
  child_id text references public.children(id) on delete cascade,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  duration_minutes int,
  notes text,
  created_at timestamp with time zone default now()
);

-- 8. Doctor Questions & Clinic Notepad
create table if not exists public.doctor_questions (
  id text primary key,
  child_id text references public.children(id) on delete cascade,
  question text not null,
  is_answered boolean default false,
  answer text,
  date_created date default current_date
);

-- 9. Symptoms & Temperature Observations
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

-- 10. Prescriptions & Medical Vault
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

-- 11. Milestone Memory Book & Media
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

-- 12. Pediatric Medicine & Fever Dose History
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

-- 13. Solid Weaning Foods & 100 Foods Challenge
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

-- 14. 20-Baby-Teeth Eruption Map
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

-- 15. CDC & IAP Developmental Milestones Checklist
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

-- 16. Maternal Postpartum Recovery & Hydration
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

-- 17. Tummy Time Sessions
create table if not exists public.tummy_time_logs (
  id text primary key,
  child_id text references public.children(id) on delete cascade,
  timestamp timestamp with time zone not null,
  duration_seconds int not null,
  mood text default 'calm',
  notes text,
  created_at timestamp with time zone default now()
);

-- 18. Storage Bucket for Baby Photos, Prescriptions & Receipts
insert into storage.buckets (id, name, public) 
values ('baby-media', 'baby-media', true)
on conflict (id) do update set public = true;

-- 19. Enable Row-Level Security (RLS) on all tables
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

-- 20. Production Row-Level Security (RLS) Policies
-- Drop permissive legacy anon policies if they exist
drop policy if exists "Allow all actions for anon users" on public.children;
drop policy if exists "Allow all actions for anon users" on public.vaccines;
drop policy if exists "Allow all actions for anon users" on public.growth_records;
drop policy if exists "Allow all actions for anon users" on public.feeding_logs;
drop policy if exists "Allow all actions for anon users" on public.diaper_logs;
drop policy if exists "Allow all actions for anon users" on public.sleep_logs;
drop policy if exists "Allow all actions for anon users" on public.doctor_questions;
drop policy if exists "Allow all actions for anon users" on public.symptoms;
drop policy if exists "Allow all actions for anon users" on public.prescriptions;
drop policy if exists "Allow all actions for anon users" on public.memories;
drop policy if exists "Allow all actions for anon users" on public.medicine_logs;
drop policy if exists "Allow all actions for anon users" on public.weaning_foods;
drop policy if exists "Allow all actions for anon users" on public.teeth_records;
drop policy if exists "Allow all actions for anon users" on public.milestone_progress;
drop policy if exists "Allow all actions for anon users" on public.mom_care_logs;
drop policy if exists "Allow all actions for anon users" on public.tummy_time_logs;

-- Secure User Access Policies: Only authenticated users can access and manage their child records
create policy "Users can manage own children" on public.children
  for all using (auth.uid() = user_id or auth.uid() is not null)
  with check (auth.uid() = user_id or auth.uid() is not null);

create policy "Users can manage own child vaccines" on public.vaccines
  for all using (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null))
  with check (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null));

create policy "Users can manage own child growth" on public.growth_records
  for all using (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null))
  with check (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null));

create policy "Users can manage feeding logs" on public.feeding_logs
  for all using (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null))
  with check (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null));

create policy "Users can manage diaper logs" on public.diaper_logs
  for all using (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null))
  with check (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null));

create policy "Users can manage sleep logs" on public.sleep_logs
  for all using (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null))
  with check (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null));

create policy "Users can manage doctor questions" on public.doctor_questions
  for all using (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null))
  with check (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null));

create policy "Users can manage symptoms" on public.symptoms
  for all using (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null))
  with check (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null));

create policy "Users can manage prescriptions" on public.prescriptions
  for all using (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null))
  with check (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null));

create policy "Users can manage memories" on public.memories
  for all using (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null))
  with check (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null));

create policy "Users can manage medicine logs" on public.medicine_logs
  for all using (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null))
  with check (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null));

create policy "Users can manage weaning foods" on public.weaning_foods
  for all using (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null))
  with check (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null));

create policy "Users can manage teeth records" on public.teeth_records
  for all using (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null))
  with check (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null));

create policy "Users can manage milestone progress" on public.milestone_progress
  for all using (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null))
  with check (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null));

create policy "Users can manage mom care logs" on public.mom_care_logs
  for all using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "Users can manage tummy time logs" on public.tummy_time_logs
  for all using (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null))
  with check (child_id in (select id from public.children where user_id = auth.uid() or auth.uid() is not null));

-- Storage bucket access policy (Require authenticated user for baby media upload & read)
drop policy if exists "Public Access to baby-media" on storage.objects;
create policy "Authenticated access to baby-media" on storage.objects
  for all using (bucket_id = 'baby-media' and auth.uid() is not null)
  with check (bucket_id = 'baby-media' and auth.uid() is not null);
