import { createClient } from '@supabase/supabase-js';

const defaultUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const defaultKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let cachedClient: ReturnType<typeof createClient> | null = null;
let cachedUrl = '';
let cachedKey = '';

export function getSupabaseClient(customUrl?: string, customKey?: string) {
  const url = customUrl || defaultUrl;
  const key = customKey || defaultKey;

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

/**
 * SQL Schema definition for Supabase Postgres
 * Users can copy and run this in Supabase SQL editor to create the cloud database
 */
export const SUPABASE_SQL_SCHEMA = `
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists children (
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

-- 2. Vaccines Table
create table if not exists vaccines (
  id text primary key,
  child_id text references children(id) on delete cascade,
  name text not null,
  code text not null,
  target_diseases text,
  category text, -- 'government' or 'private'
  due_date timestamp with time zone,
  status text default 'upcoming',
  date_administered date,
  is_painless boolean,
  brand_name text,
  batch_number text,
  cost_inr numeric,
  clinic_name text,
  notes text,
  receipt_url text
);

-- 3. Growth Measurements Table
create table if not exists growth_records (
  id text primary key,
  child_id text references children(id) on delete cascade,
  date date not null,
  age_in_days int,
  weight_kg numeric not null,
  length_cm numeric not null,
  head_circumference_cm numeric not null,
  notes text
);

-- 4. Prescriptions & Medical Vault
create table if not exists prescriptions (
  id text primary key,
  child_id text references children(id) on delete cascade,
  date date not null,
  doctor_name text,
  clinic_hospital text,
  diagnosis text,
  medicines_summary text,
  attachment_url text,
  notes text
);

-- 5. Memories & Milestone Timeline
create table if not exists memories (
  id text primary key,
  child_id text references children(id) on delete cascade,
  title text not null,
  milestone_tag text,
  date date not null,
  age_display text,
  caption text,
  media_url text,
  media_type text default 'image',
  is_favorite boolean default false
);

-- Storage bucket for photos and receipts
insert into storage.buckets (id, name, public) 
values ('baby-media', 'baby-media', true)
on conflict (id) do nothing;
`;
