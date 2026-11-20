'use client';

import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ArrowRight,
  WifiOff,
  AlertCircle,
  X,
  ShieldCheck,
  Users,
  Smartphone,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { getSupabaseClient, checkSupabaseConfigStatus } from '@/lib/supabaseClient';
import { DayOneLogo } from './DayOneLogo';

interface LoginPageProps {
  onSuccess: (user: any) => void;
  onContinueOffline: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onContinueOffline,
}) => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [useMagicLink, setUseMagicLink] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const configStatus = checkSupabaseConfigStatus();

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    const client = getSupabaseClient();
    if (!client) {
      setErrorMsg(
        'Supabase cloud URL is unconfigured. You can use Local Mode immediately, or configure NEXT_PUBLIC_SUPABASE_URL.'
      );
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setErrorMsg(err.message || 'Google Sign-In failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const client = getSupabaseClient();
    if (!client) {
      setErrorMsg(
        'Supabase cloud URL is unconfigured. Tap "Continue Without Account" below to start immediately in Local Mode.'
      );
      return;
    }

    setIsLoading(true);

    try {
      if (useMagicLink) {
        // Passwordless Magic Link
        const { error } = await client.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
        });
        if (error) throw error;
        setInfoMsg('A secure magic sign-in link has been sent to your email. Click it to log in without a password.');
      } else if (isSignUp) {
        // Sign Up with Password
        const { data, error } = await client.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) {
          onSuccess(data.user);
        } else {
          setInfoMsg('Account created! Please check your email to confirm registration.');
        }
      } else {
        // Sign In with Password
        const { data, error } = await client.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          onSuccess(data.user);
        }
      }
    } catch (err: any) {
      console.error('Authentication Error:', err);
      const isFetchError =
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('NetworkError') ||
        err?.name === 'AuthRetryableFetchError';

      if (isFetchError) {
        setErrorMsg(
          'Unable to reach server. Check network connection or use Local Mode below.'
        );
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#131217] flex items-center justify-center p-4 sm:p-6 text-[#201E1D] dark:text-[#FAF8F5] select-none transition-colors duration-150">
      
      {/* Container */}
      <div className="w-full max-w-md animate-reveal">

        {/* Top Header Navigation Strip */}
        <div className="flex items-center justify-between mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDF5EE] dark:bg-[#1E3023] border border-[#CFE2D1] dark:border-[#2D4532]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#44634B] dark:bg-[#A8D1B0]" />
            <span className="text-[11px] font-semibold text-[#23522A] dark:text-[#A8D1B0]">
              Gentle Pediatric Care
            </span>
          </div>

          <button
            type="button"
            onClick={onContinueOffline}
            className="tap-feedback text-xs font-semibold text-[#75706B] dark:text-[#9E9892] hover:text-[#201E1D] dark:hover:text-[#FAF8F5] flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-[#EAE6DF]/60 dark:hover:bg-[#201E26]"
          >
            <span>Skip for now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Brand Hero */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-1 rounded-2xl mb-3 shadow-xs">
            <DayOneLogo size={48} variant="mark" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#191C1A] dark:text-[#FAF8F5]">
            Welcome to DayOne
          </h1>
          <p className="text-xs sm:text-sm text-[#75706B] dark:text-[#9E9892] mt-1 max-w-xs mx-auto">
            Clinical-grade pediatric health, WHO growth trajectories &amp; immunization records.
          </p>
        </div>

        {/* Placeholder Config Advisory (If unconfigured) */}
        {configStatus.isPlaceholder && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[#FFF0E6] dark:bg-[#2D1F1A] border border-[#FCDCCB] dark:border-[#4A322A] text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#8A3510] dark:text-[#FFB59E]">
              <AlertCircle className="w-4 h-4 text-[#D97757] shrink-0" />
              <span>Cloud URL Unconfigured</span>
            </div>
            <p className="text-[11px] text-[#75706B] dark:text-[#9E9892] leading-relaxed">
              Cloud sync backend is not yet linked. You can start tracking immediately in Local Device Mode with full offline capabilities.
            </p>
            <button
              type="button"
              onClick={onContinueOffline}
              className="tap-feedback w-full py-2 px-3 rounded-xl bg-[#D97757] hover:bg-[#CB6145] text-white text-xs font-semibold text-center shadow-xs cursor-pointer"
            >
              Continue in Local Mode (Offline Ready)
            </button>
          </div>
        )}

        {/* Auth Card */}
        <div className="bg-white dark:bg-[#1C1B22] rounded-3xl p-5 sm:p-6 shadow-xs border border-[#EAE6DF] dark:border-[#2C2A34] space-y-4">

          {/* Segmented Switcher: Sign In vs Create Account */}
          <div className="p-1 bg-[#FAF8F5] dark:bg-[#151419] rounded-full flex items-center border border-[#EAE6DF] dark:border-[#2C2A34]">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className={`tap-feedback flex-1 py-1.5 rounded-full text-xs font-semibold text-center ${
                !isSignUp
                  ? 'bg-white dark:bg-[#26242E] text-[#191C1A] dark:text-white shadow-xs'
                  : 'text-[#75706B] dark:text-[#9E9892] hover:text-[#191C1A]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className={`tap-feedback flex-1 py-1.5 rounded-full text-xs font-semibold text-center ${
                isSignUp
                  ? 'bg-white dark:bg-[#26242E] text-[#191C1A] dark:text-white shadow-xs'
                  : 'text-[#75706B] dark:text-[#9E9892] hover:text-[#191C1A]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Primary OAuth: Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="tap-feedback w-full h-11 px-4 bg-white dark:bg-[#22202A] hover:bg-[#FAF8F5] dark:hover:bg-[#2A2834] border border-[#EAE6DF] dark:border-[#353340] rounded-2xl flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span className="text-xs font-semibold text-[#201E1D] dark:text-[#FAF8F5]">
              Continue with Google
            </span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="w-full border-t border-[#EAE6DF] dark:border-[#2C2A34]" />
            <span className="absolute bg-white dark:bg-[#1C1B22] px-3 text-[10.5px] font-medium text-[#75706B] dark:text-[#9E9892]">
              or email
            </span>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 text-xs font-medium leading-relaxed animate-reveal">
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="p-3 rounded-2xl bg-[#EDF5EE] border border-[#CFE2D1] text-[#23522A] dark:bg-[#1A2E1F] dark:border-[#2D4A33] dark:text-[#AECDB2] text-xs font-medium leading-relaxed animate-reveal">
              {infoMsg}
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-[#75706B] dark:text-[#9E9892] block mb-1">
                Parent Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#75706B] dark:text-[#9E9892]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="parent@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-[#FAF8F5] dark:bg-[#151419] border border-[#EAE6DF] dark:border-[#2C2A34] rounded-2xl text-xs text-[#201E1D] dark:text-[#FAF8F5] placeholder-[#75706B]/50 font-medium focus:outline-none focus:ring-1 focus:ring-[#44634B] focus:border-[#44634B]"
                />
              </div>
            </div>

            {!useMagicLink && (
              <div>
                <label className="text-[11px] font-semibold text-[#75706B] dark:text-[#9E9892] block mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#75706B] dark:text-[#9E9892]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-[#FAF8F5] dark:bg-[#151419] border border-[#EAE6DF] dark:border-[#2C2A34] rounded-2xl text-xs text-[#201E1D] dark:text-[#FAF8F5] placeholder-[#75706B]/50 font-medium focus:outline-none focus:ring-1 focus:ring-[#44634B] focus:border-[#44634B]"
                  />
                </div>
              </div>
            )}

            {/* Toggle Mode */}
            <div className="flex items-center justify-between pt-0.5">
              <button
                type="button"
                onClick={() => setUseMagicLink(!useMagicLink)}
                className="tap-feedback text-[11px] text-[#44634B] dark:text-[#A8D1B0] hover:underline font-semibold"
              >
                {useMagicLink ? 'Use password instead' : 'Send passwordless Magic Link instead'}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="tap-feedback w-full h-11 bg-[#44634B] hover:bg-[#344738] text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>
                    {useMagicLink
                      ? 'Send Passwordless Magic Link'
                      : isSignUp
                      ? 'Create Family Account'
                      : 'Sign In'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Subtext info */}
          <p className="text-[10.5px] text-center text-[#75706B] dark:text-[#9E9892] pt-1">
            {useMagicLink
              ? 'Magic Link sends a 1-tap sign-in link to your inbox. No passwords to type while holding baby.'
              : 'Credentials encrypted with modern security standards.'}
          </p>

        </div>

        {/* Offline & Local-First Card */}
        <div className="mt-4 p-4 rounded-3xl bg-white dark:bg-[#1C1B22] border border-[#EAE6DF] dark:border-[#2C2A34] shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-[#EDF5EE] dark:bg-[#1E3023] border border-[#CFE2D1] dark:border-[#2D4532] flex items-center justify-center text-[#44634B] dark:text-[#ADCFB1] shrink-0">
              <WifiOff className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5] truncate">
                  Local Offline Mode
                </span>
                <span className="text-[9.5px] font-semibold px-1.5 py-0.2 rounded-full bg-[#EDF5EE] text-[#23522A] dark:bg-[#1E3023] dark:text-[#A8D1B0]">
                  Private
                </span>
              </div>
              <p className="text-[10.5px] text-[#75706B] dark:text-[#9E9892] truncate mt-0.5">
                Store records on device with zero cloud dependency
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onContinueOffline}
            className="tap-feedback shrink-0 px-3 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#151419] border border-[#EAE6DF] dark:border-[#2C2A34] hover:bg-[#EAE6DF] text-xs font-semibold text-[#191C1A] dark:text-[#FAF8F5]"
          >
            Use Offline
          </button>
        </div>

        {/* Quiet Trust Points */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center select-none">
          <div className="p-2.5 rounded-2xl bg-white/70 dark:bg-[#1C1B22]/70 border border-[#EAE6DF]/60 dark:border-[#2C2A34]/60">
            <ShieldCheck className="w-4 h-4 text-[#44634B] dark:text-[#ADCFB1] mx-auto mb-1" />
            <span className="text-[10px] font-medium text-[#75706B] dark:text-[#9E9892] block leading-tight">
              Encrypted
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/70 dark:bg-[#1C1B22]/70 border border-[#EAE6DF]/60 dark:border-[#2C2A34]/60">
            <Users className="w-4 h-4 text-[#D97757] mx-auto mb-1" />
            <span className="text-[10px] font-medium text-[#75706B] dark:text-[#9E9892] block leading-tight">
              Family Sync
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/70 dark:bg-[#1C1B22]/70 border border-[#EAE6DF]/60 dark:border-[#2C2A34]/60">
            <Smartphone className="w-4 h-4 text-[#5393CE] mx-auto mb-1" />
            <span className="text-[10px] font-medium text-[#75706B] dark:text-[#9E9892] block leading-tight">
              Offline PWA
            </span>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-5 text-center text-[10.5px] text-[#75706B] dark:text-[#9E9892] space-y-1">
          <p>DayOne Pediatric Health &amp; Vaccine Companion</p>
          <div className="flex items-center justify-center gap-2">
            <span>WHO Growth Standards</span>
            <span>•</span>
            <span>IAP Schedule</span>
            <span>•</span>
            <span>Zero Lock-In</span>
          </div>
        </footer>

      </div>
    </div>
  );
};
