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
