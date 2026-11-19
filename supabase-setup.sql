-- ============================================================
-- DayOne Baby Tracker - Complete Supabase Schema & Security
-- Paste this script into Supabase SQL Editor and click "Run"
-- ============================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Children Profiles Table
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

-- 5. Daily Care: Feeding Logs
create table if not exists public.feeding_logs (
  id text primary key,
  child_id text references public.children(id) on delete cascade,
  timestamp timestamp with time zone not null,
  type text not null, -- 'breast', 'bottle', 'pump'
  left_duration_minutes int,
  right_duration_minutes int,
  bottle_amount_ml numeric,
  notes text,
  created_at timestamp with time zone default now()
);

-- 6. Daily Care: Diaper Logs
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

-- 12. Storage Bucket for Baby Photos, Prescriptions & Receipts
insert into storage.buckets (id, name, public) 
values ('baby-media', 'baby-media', true)
on conflict (id) do update set public = true;

-- 13. Enable Row-Level Security (RLS) with Public Access policies for fast family use
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

-- Allow anonymous access with publishable key (or authenticated)
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

-- Storage bucket access policy
create policy "Public Access to baby-media" on storage.objects for all using (bucket_id = 'baby-media') with check (bucket_id = 'baby-media');
