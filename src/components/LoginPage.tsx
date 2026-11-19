'use client';

import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, WifiOff, AlertCircle } from 'lucide-react';
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
  const [useMagicLink, setUseMagicLink] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const configStatus = checkSupabaseConfigStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const client = getSupabaseClient();
    if (!client) {
      setErrorMsg(
        'Supabase cloud URL is unconfigured or set to placeholder (your-project-id). Click "Continue in Local Mode" below to use DayOne immediately without login, or update NEXT_PUBLIC_SUPABASE_URL in your hosting settings.'
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
        setInfoMsg('A secure magic login link has been sent to your email. Click it to log in.');
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
          setInfoMsg('Account created. Please check your email to confirm registration.');
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
          'Unable to reach Supabase server. Check your network or verify NEXT_PUBLIC_SUPABASE_URL in your hosting settings. You can also click "Continue in Local Mode" below.'
        );
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF8F5] dark:bg-[#141317] text-[#201E1D] dark:text-[#FAF8F5] transition-colors duration-150">
      
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] p-6 shadow-sm">
        
        {/* App Logo & Header */}
        <div className="text-center space-y-1 mb-5">
          <div className="flex justify-center mb-2.5">
            <DayOneLogo size={42} variant="mark" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-[#201E1D] dark:text-[#FAF8F5]">
            Day<span className="text-[#E2765A]">One</span>
          </h2>
          <p className="text-xs text-[#75706B] dark:text-[#9E9892]">
            Gentle Pediatric Health & Growth Records
          </p>
        </div>

        {/* Placeholder / Unconfigured Notice */}
        {configStatus.isPlaceholder && (
          <div className="mb-4 p-3 rounded-xl bg-[#FFF7F2] dark:bg-[#2A1E1C] border border-[#FCDCCB] dark:border-[#523A34] text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-[#E2765A]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Placeholder URL Detected</span>
            </div>
            <p className="text-[11px] text-[#75706B] dark:text-[#A8A29E] leading-relaxed">
              Your hosting environment is currently set to <code className="px-1 py-0.5 rounded bg-[#F2ECE3] dark:bg-[#342724] text-[10px]">your-project-id.supabase.co</code>.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={onContinueOffline}
                className="w-full py-1.5 px-2 rounded-lg bg-[#E2765A] hover:bg-[#CB6145] text-white text-[11px] font-semibold text-center transition-colors"
              >
                Continue in Local Mode (Works Offline)
              </button>
            </div>
          </div>
        )}

        {/* Tab: Sign In vs Sign Up */}
        <div className="flex p-1 rounded-full bg-[#F2ECE3] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-full transition-colors duration-150 ${
              !isSignUp
                ? 'bg-[#E2765A] text-white shadow-xs'
                : 'text-[#75706B] hover:text-[#201E1D] dark:text-[#9E9892]'
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
            className={`flex-1 py-1.5 rounded-full transition-colors duration-150 ${
              isSignUp
                ? 'bg-[#E2765A] text-white shadow-xs'
                : 'text-[#75706B] hover:text-[#201E1D] dark:text-[#9E9892]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-[#FDF0F2] border border-[#F8D0D6] text-[#8A2338] dark:bg-[#2B171A] dark:border-[#4D2329] dark:text-[#F1ABB6] text-xs font-medium leading-relaxed">
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-[#EDF5EE] border border-[#CFE2D1] text-[#23522A] dark:bg-[#1A2E1F] dark:border-[#2D4A33] dark:text-[#AECDB2] text-xs font-medium leading-relaxed">
            {infoMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-[#9E9892] absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="parents@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5] focus:outline-none"
              />
            </div>
          </div>

          {!useMagicLink && (
            <div>
              <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-[#9E9892] absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Toggle between Password and Magic Link */}
          <div className="flex items-center justify-between pt-0.5">
            <button
              type="button"
              onClick={() => setUseMagicLink(!useMagicLink)}
              className="text-xs text-[#E2765A] hover:underline font-semibold"
            >
              {useMagicLink ? 'Use standard password' : 'Send passwordless Magic Link'}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-3 rounded-xl font-semibold text-xs bg-[#E2765A] text-white hover:bg-[#CB6145] transition-colors duration-150 flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <span>{isLoading ? 'Processing...' : useMagicLink ? 'Send Magic Link' : isSignUp ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Offline / Guest Mode Fallback */}
        <div className="mt-5 pt-4 border-t border-[#EAE6DF] dark:border-[#2D2B33] text-center space-y-2">
          <p className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
            Want to use DayOne without creating a cloud account?
          </p>
          <button
            type="button"
            onClick={onContinueOffline}
            className="w-full py-2 px-3 rounded-xl font-semibold text-xs bg-[#FAF8F5] dark:bg-[#17161B] hover:bg-[#F2ECE3] dark:hover:bg-[#26242C] text-[#4D4845] dark:text-[#DDD8D0] border border-[#EAE6DF] dark:border-[#2D2B33] transition-colors duration-150 flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
          >
            <WifiOff className="w-3.5 h-3.5 text-[#E2765A]" />
            <span>Continue in Local Mode (Offline)</span>
          </button>
        </div>

      </div>

    </div>
  );
};
