'use client';

import React, { useState } from 'react';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { DayOneLogo } from './DayOneLogo';

interface LoginPageProps {
  onSuccess: (user: any) => void;
  onContinueOffline: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onContinueOffline,
}) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [useMagicLink, setUseMagicLink] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const client = getSupabaseClient();
    if (!client) {
      setErrorMsg(
        'Cloud sync is not configured. You can continue in offline mode.'
      );
      return;
    }

    setIsLoading(true);

    try {
      if (useMagicLink) {
        const { error } = await client.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo:
              typeof window !== 'undefined' ? window.location.origin : undefined,
          },
        });
        if (error) throw error;
        setInfoMsg('Sign-in link sent to your email.');
      } else {
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
        setErrorMsg('Unable to connect. Check connection or continue offline.');
      } else {
        setErrorMsg(err.message || 'Invalid email or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#131217] flex items-center justify-center p-4 text-[#201E1D] dark:text-[#FAF8F5] select-none transition-colors duration-150">
      <div className="w-full max-w-[360px] animate-reveal">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <DayOneLogo size={42} variant="mark" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#191C1A] dark:text-[#FAF8F5]">
            DayOne
          </h1>
          <p className="text-xs text-[#75706B] dark:text-[#9E9892] mt-1">
            Sign in to access your baby&apos;s records
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#1C1B22] rounded-3xl p-6 shadow-xs border border-[#EAE6DF] dark:border-[#2C2A34]">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 text-xs font-medium leading-relaxed animate-reveal">
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-[#EDF5EE] border border-[#CFE2D1] text-[#23522A] dark:bg-[#1A2E1F] dark:border-[#2D4A33] dark:text-[#AECDB2] text-xs font-medium leading-relaxed animate-reveal">
              {infoMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-semibold text-[#75706B] dark:text-[#9E9892] block mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#75706B] dark:text-[#9E9892]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="parent@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-3.5 bg-[#FAF8F5] dark:bg-[#151419] border border-[#EAE6DF] dark:border-[#2C2A34] rounded-2xl text-[15px] sm:text-xs text-[#201E1D] dark:text-[#FAF8F5] placeholder-[#75706B]/50 font-medium focus:outline-none focus:ring-1 focus:ring-[#44634B] focus:border-[#44634B] transition-colors"
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
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-3.5 bg-[#FAF8F5] dark:bg-[#151419] border border-[#EAE6DF] dark:border-[#2C2A34] rounded-2xl text-[15px] sm:text-xs text-[#201E1D] dark:text-[#FAF8F5] placeholder-[#75706B]/50 font-medium focus:outline-none focus:ring-1 focus:ring-[#44634B] focus:border-[#44634B] transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setUseMagicLink(!useMagicLink);
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className="tap-feedback text-[11px] text-[#44634B] dark:text-[#A8D1B0] hover:underline font-semibold"
              >
                {useMagicLink ? 'Use password instead' : 'Sign in with magic link'}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="tap-feedback w-full h-11 bg-[#44634B] hover:bg-[#344738] text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>{useMagicLink ? 'Send Magic Link' : 'Sign In'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 mt-4 border-t border-[#EAE6DF] dark:border-[#2C2A34] text-center">
            <button
              type="button"
              onClick={onContinueOffline}
              className="tap-feedback inline-flex items-center justify-center text-xs font-semibold text-[#75706B] dark:text-[#9E9892] hover:text-[#201E1D] dark:hover:text-[#FAF8F5] transition-colors py-1 px-3 rounded-lg hover:bg-[#FAF8F5] dark:hover:bg-[#151419]"
            >
              Continue in Offline Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
