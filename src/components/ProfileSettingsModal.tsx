'use client';

import React, { useState } from 'react';
import {
  X,
  Settings,
  Database,
  Copy,
  Check,
  RotateCcw,
  Baby,
  Download,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { ChildProfile } from '@/lib/types';
import { SupabaseConfig } from '@/lib/store';
import { SUPABASE_SQL_SCHEMA } from '@/lib/supabaseClient';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ChildProfile;
  profilesList: ChildProfile[];
  onUpdateProfile: (updates: Partial<ChildProfile>) => void;
  onAddChild: (child: ChildProfile) => void;
  supabaseConfig: SupabaseConfig;
  onUpdateSupabaseConfig: (cfg: SupabaseConfig) => void;
  onResetDemo: () => void;
  onSyncToCloud?: () => Promise<{ success: boolean; message: string }>;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  profilesList,
  onUpdateProfile,
  onAddChild,
  supabaseConfig,
  onUpdateSupabaseConfig,
  onResetDemo,
  onSyncToCloud,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'siblings' | 'cloud' | 'pwa' | 'reset'>('profile');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState<boolean>(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const check = () => (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
    setIsPwaInstalled(Boolean(check()));
  }, []);
  
  // Profile form state
  const [name, setName] = useState<string>(profile.name);
  const [nickname, setNickname] = useState<string>(profile.nickname || '');
  const [dob, setDob] = useState<string>(profile.dob.split('T')[0]);
  const [weight, setWeight] = useState<string>(profile.birthWeightKg.toString());
  const [length, setLength] = useState<string>(profile.birthLengthCm.toString());
  const [head, setHead] = useState<string>(profile.birthHeadCircumferenceCm.toString());
  const [bloodGroup, setBloodGroup] = useState<string>(profile.bloodGroup);
  const [pediaName, setPediaName] = useState<string>(profile.pediatricianName || '');
  const [pediaPhone, setPediaPhone] = useState<string>(profile.pediatricianPhone || '');
  const [emergencyHosp, setEmergencyHosp] = useState<string>(profile.emergencyHospital || '');

  // Sibling form state
  const [siblingName, setSiblingName] = useState<string>('');
  const [siblingDob, setSiblingDob] = useState<string>('');
  const [siblingGender, setSiblingGender] = useState<'female' | 'male'>('female');

  // Supabase form state
  const [supaUrl, setSupaUrl] = useState<string>(supabaseConfig.url || '');
  const [supaKey, setSupaKey] = useState<string>(supabaseConfig.anonKey || '');
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name,
      nickname,
      dob: `${dob}T08:00:00.000Z`,
      birthWeightKg: parseFloat(weight) || 3.15,
      birthLengthCm: parseFloat(length) || 49.5,
      birthHeadCircumferenceCm: parseFloat(head) || 34.0,
      bloodGroup,
      pediatricianName: pediaName,
      pediatricianPhone: pediaPhone,
      emergencyHospital: emergencyHosp,
    });
    onClose();
  };

  const handleAddSibling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siblingName || !siblingDob) return;
    const newChild: ChildProfile = {
      id: `child_${Date.now()}`,
      name: siblingName,
      dob: `${siblingDob}T08:00:00.000Z`,
      gender: siblingGender,
      birthWeightKg: 3.2,
      birthLengthCm: 50.0,
      birthHeadCircumferenceCm: 34.5,
      bloodGroup: 'O+',
      pediatricianName: pediaName,
      pediatricianPhone: pediaPhone,
      emergencyHospital: emergencyHosp,
    };
    onAddChild(newChild);
    setSiblingName('');
    setSiblingDob('');
    setActiveTab('profile');
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSupabaseConfig({
      url: supaUrl,
      anonKey: supaKey,
      isSyncEnabled: Boolean(supaUrl && supaKey),
    });
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg my-8 rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] p-6 shadow-xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#75706B] hover:text-[#201E1D] dark:hover:text-[#FAF8F5] hover:bg-[#F2ECE3] dark:hover:bg-[#26242C] transition-colors duration-150"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[#FFF0E6] dark:bg-[#2D2422] flex items-center justify-center text-[#E2765A]">
            <Settings className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-[#201E1D] dark:text-[#FAF8F5]">
            Settings & Child Profile
          </h3>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-[#F2ECE3] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] mb-5 max-w-full overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1 rounded-full transition-colors duration-150 ${
              activeTab === 'profile'
                ? 'bg-[#E2765A] text-white shadow-xs'
                : 'text-[#75706B] dark:text-[#9E9892] hover:text-[#201E1D]'
            }`}
          >
            Baby Profile
          </button>
          <button
            onClick={() => setActiveTab('siblings')}
            className={`px-3 py-1 rounded-full transition-colors duration-150 ${
              activeTab === 'siblings'
                ? 'bg-[#E2765A] text-white shadow-xs'
                : 'text-[#75706B] dark:text-[#9E9892] hover:text-[#201E1D]'
            }`}
          >
            Siblings ({profilesList.length})
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            className={`px-3 py-1 rounded-full transition-colors duration-150 ${
              activeTab === 'cloud'
                ? 'bg-[#E2765A] text-white shadow-xs'
                : 'text-[#75706B] dark:text-[#9E9892] hover:text-[#201E1D]'
            }`}
          >
            Cloud Sync
          </button>
          <button
            onClick={() => setActiveTab('pwa')}
            className={`px-3 py-1 rounded-full transition-colors duration-150 ${
              activeTab === 'pwa'
                ? 'bg-[#E2765A] text-white shadow-xs'
                : 'text-[#75706B] dark:text-[#9E9892] hover:text-[#201E1D]'
            }`}
          >
            PWA App
          </button>
          <button
            onClick={() => setActiveTab('reset')}
            className={`px-3 py-1 rounded-full transition-colors duration-150 ${
              activeTab === 'reset'
                ? 'bg-[#D95D75] text-white shadow-xs'
                : 'text-[#75706B] dark:text-[#9E9892] hover:text-[#D95D75]'
            }`}
          >
            Reset
          </button>
        </div>

        {/* TAB 1: PROFILE DETAILS */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Child's Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                />
              </div>
              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Nickname</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                />
              </div>
              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Blood Group</label>
                <input
                  type="text"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                />
              </div>
            </div>

            {/* Birth Measurements */}
            <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#75706B] dark:text-[#9E9892] block">
                Birth Vital Metrics
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[#75706B] dark:text-[#9E9892] text-[10px] mb-0.5 font-medium">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5] text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[#75706B] dark:text-[#9E9892] text-[10px] mb-0.5 font-medium">Length (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5] text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[#75706B] dark:text-[#9E9892] text-[10px] mb-0.5 font-medium">Head (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={head}
                    onChange={(e) => setHead(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5] text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Doctor & Emergency Info */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Pediatrician Name</label>
                <input
                  type="text"
                  value={pediaName}
                  onChange={(e) => setPediaName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                />
              </div>
              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Phone</label>
                <input
                  type="tel"
                  value={pediaPhone}
                  onChange={(e) => setPediaPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Emergency Hospital</label>
              <input
                type="text"
                value={emergencyHosp}
                onChange={(e) => setEmergencyHosp(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-xl border border-[#EAE6DF] dark:border-[#2D2B33] text-[#4D4845] dark:text-[#DDD8D0] hover:bg-[#F2ECE3] dark:hover:bg-[#26242C] font-semibold transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-[#E2765A] text-white hover:bg-[#CB6145] font-semibold transition-colors duration-150 active:scale-[0.98]"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: MULTI-CHILD & SIBLINGS */}
        {activeTab === 'siblings' && (
          <div className="space-y-4 text-xs">
            <div>
              <h4 className="font-semibold text-[#201E1D] dark:text-[#FAF8F5] text-xs mb-2">Registered Children</h4>
              <div className="space-y-1.5">
                {profilesList.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33]"
                  >
                    <div className="flex items-center gap-2">
                      <Baby className="w-3.5 h-3.5 text-[#E2765A]" />
                      <div>
                        <p className="font-semibold text-[#201E1D] dark:text-[#FAF8F5]">{c.name}</p>
                        <p className="text-[10px] text-[#75706B] dark:text-[#9E9892]">DOB: {c.dob.split('T')[0]}</p>
                      </div>
                    </div>
                    {c.id === profile.id && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border border-[#CFE2D1] bg-[#EDF5EE] text-[#23522A] dark:bg-[#1A2E1F] dark:text-[#AECDB2]">
                        Active Profile
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddSibling} className="border-t border-[#EAE6DF] dark:border-[#2D2B33] pt-3 space-y-2.5">
              <h4 className="font-semibold text-[#201E1D] dark:text-[#FAF8F5] text-xs">Add Child Profile</h4>
              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Child's Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sibling Name"
                  value={siblingName}
                  onChange={(e) => setSiblingName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={siblingDob}
                    onChange={(e) => setSiblingDob(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                  />
                </div>
                <div>
                  <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Gender</label>
                  <select
                    value={siblingGender}
                    onChange={(e) => setSiblingGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                  >
                    <option value="female">Girl</option>
                    <option value="male">Boy</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-[#E2765A] text-white hover:bg-[#CB6145] font-semibold transition-colors duration-150 active:scale-[0.98]"
              >
                + Add Profile
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: SUPABASE CLOUD SYNC */}
        {activeTab === 'cloud' && (
          <div className="space-y-3.5 text-xs">
            <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#4D4845] dark:text-[#DDD8D0] text-xs leading-relaxed">
              DayOne functions completely offline with local storage. Optionally sync records to Supabase for multi-device family access.
            </div>

            <form onSubmit={handleSaveSupabase} className="space-y-2.5">
              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Supabase Project URL</label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supaUrl}
                  onChange={(e) => setSupaUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5] text-xs"
                />
              </div>

              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Anon Public Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOi..."
                  value={supaKey}
                  onChange={(e) => setSupaKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5] text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-[#E2765A] text-white hover:bg-[#CB6145] font-semibold transition-colors duration-150 active:scale-[0.98]"
              >
                Save Configuration
              </button>
            </form>

            {/* Sync Now Action */}
            {onSyncToCloud && (
              <div className="pt-2 border-t border-[#EAE6DF] dark:border-[#2D2B33] space-y-2">
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={async () => {
                    setIsSyncing(true);
                    setSyncStatusMsg(null);
                    const res = await onSyncToCloud();
                    setIsSyncing(false);
                    setSyncStatusMsg({ text: res.message, isError: !res.success });
                  }}
                  className="w-full py-2 rounded-xl border border-[#EAE6DF] dark:border-[#2D2B33] bg-[#FAF8F5] dark:bg-[#17161B] text-[#201E1D] dark:text-[#FAF8F5] hover:bg-[#F2ECE3] font-semibold flex items-center justify-center gap-2 transition-colors duration-150 disabled:opacity-50"
                >
                  <Database className="w-3.5 h-3.5 text-[#E2765A]" />
                  <span>{isSyncing ? 'Syncing...' : 'Sync All Records to Supabase'}</span>
                </button>

                {syncStatusMsg && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-medium ${
                      syncStatusMsg.isError
                        ? 'bg-[#FDF0F2] text-[#8A2338] border border-[#F8D0D6]'
                        : 'bg-[#EDF5EE] text-[#23522A] border border-[#CFE2D1]'
                    }`}
                  >
                    {syncStatusMsg.text}
                  </div>
                )}
              </div>
            )}

            {/* SQL Copy Box */}
            <div className="pt-2 border-t border-[#EAE6DF] dark:border-[#2D2B33]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-[#201E1D] dark:text-[#FAF8F5]">
                  SQL Schema
                </span>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#E2765A] hover:underline"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3 h-3 text-[#5A9663]" />
                      <span className="text-[#5A9663]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy SQL</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
                Execute in your Supabase SQL Editor to initialize tables.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: PWA INSTALL & OFFLINE STATUS */}
        {activeTab === 'pwa' && (
          <div className="space-y-4 text-xs">
            <div
              className={`p-4 rounded-2xl border ${
                isPwaInstalled
                  ? 'bg-[#EDF5EE] dark:bg-[#1A2E1F] border-[#CFE2D1] dark:border-[#2D4A33] text-[#23522A] dark:text-[#AECDB2]'
                  : 'bg-[#FFF7F2] dark:bg-[#261E1C] border-[#FCDCCB] dark:border-[#543830] text-[#8A3510] dark:text-[#F8BCA0]'
              }`}
            >
              <div className="flex items-center gap-2.5 font-semibold text-sm">
                {isPwaInstalled ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-[#5A9663]" />
                    <span>DayOne App is Installed</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-5 h-5 text-[#E2765A]" />
                    <span>Installable Web App (PWA)</span>
                  </>
                )}
              </div>
              <p className="mt-1 text-xs opacity-90 leading-relaxed">
                {isPwaInstalled
                  ? 'DayOne is currently running as an installed standalone app on this device. Offline cache and background sync are active.'
                  : 'Install DayOne onto your home screen or desktop for 1-tap instant launching, full-screen distraction-free care logging, and offline clinical records.'}
              </p>
            </div>

            {!isPwaInstalled && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.dispatchEvent(new CustomEvent('dayone:trigger-pwa-install'));
                }}
                className="w-full py-2.5 rounded-xl bg-[#E2765A] hover:bg-[#CB6145] text-white font-semibold flex items-center justify-center gap-2 transition-colors duration-150 active:scale-[0.98] shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Install DayOne on this Device</span>
              </button>
            )}

            <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] space-y-2.5">
              <h4 className="font-semibold text-[#201E1D] dark:text-[#FAF8F5]">PWA Features Active:</h4>
              <ul className="space-y-2 text-[11px] text-[#75706B] dark:text-[#9E9892]">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5A9663] mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-[#201E1D] dark:text-[#FAF8F5]">Service Worker:</strong> Shell caching & offline asset fallback enabled.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5A9663] mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-[#201E1D] dark:text-[#FAF8F5]">Offline Records:</strong> IndexedDB / LocalStorage holds all nursing, growth & medication logs.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5A9663] mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-[#201E1D] dark:text-[#FAF8F5]">Cross-Platform:</strong> Works seamlessly on iOS Safari, Android Chrome, Mac, Windows & tablets.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 5: RESET DEMO DATA */}
        {activeTab === 'reset' && (
          <div className="space-y-3.5 text-xs">
            <div className="p-3.5 rounded-xl bg-[#FDF0F2] border border-[#F8D0D6] text-[#8A2338]">
              <p className="font-semibold mb-1">Reset to Default Data?</p>
              <p className="text-[11px] leading-relaxed">
                This will reset local database records back to the initial demo state.
              </p>
            </div>

            <button
              onClick={() => {
                if (window.confirm('Restore initial records?')) {
                  onResetDemo();
                  onClose();
                }
              }}
              className="w-full py-2.5 rounded-xl bg-[#D95D75] hover:bg-[#B23A51] text-white font-semibold flex items-center justify-center gap-1.5 transition-colors duration-150 active:scale-[0.98]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Default Records</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
