'use client';

import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, WifiOff, AlertCircle, X, ShieldCheck, Users, Smartphone } from 'lucide-react';
import { getSupabaseClient, checkSupabaseConfigStatus } from '@/lib/supabaseClient';

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
        'Supabase cloud URL is unconfigured. Please use Local Mode or configure NEXT_PUBLIC_SUPABASE_URL.'
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
        'Supabase cloud URL is unconfigured or set to placeholder. Click "Continue in Local Mode" below to use DayOne immediately without login, or update NEXT_PUBLIC_SUPABASE_URL in your hosting settings.'
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
        setInfoMsg('A secure magic login link has been sent to your email. Click it to log in without a password.');
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
          setInfoMsg('Family account created! Please check your email inbox to confirm registration.');
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
          'Unable to reach Supabase server. Check your network or verify NEXT_PUBLIC_SUPABASE_URL. You can also click "Continue in Local Mode" below.'
        );
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#141317] flex justify-center p-0 sm:py-6 selection:bg-[#E1EDE4] selection:text-[#2C3A2F] text-[#2D3748] dark:text-[#FAF8F5] relative overflow-hidden transition-colors">

      {/* Ambient organic gradient blurs */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#E1EDE4] dark:bg-[#203D24]/30 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute top-1/3 -left-28 w-56 h-56 bg-[#FAECE5] dark:bg-[#52291E]/30 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-16 -right-20 w-60 h-60 bg-[#FDF6E2] dark:bg-[#483416]/30 rounded-full blur-3xl opacity-40 pointer-events-none" />

      {/* Mobile Container */}
      <main className="w-full max-w-[420px] min-h-screen bg-[#FDFBF7] dark:bg-[#141317] flex flex-col justify-between px-5 pt-6 pb-8 relative z-10">

        {/* Main Content Flow */}
        <div className="flex-1 flex flex-col">

          {/* Top Bar: Status / Quick Dismiss */}
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F2F7F3] dark:bg-[#1E2E21] border border-[#C5DCCE]/60 dark:border-[#2E4733] text-[11px] font-semibold text-[#3F5743] dark:text-[#A8D1B0] tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#44634B] animate-pulse" />
              <span>NURTURING COMPANION</span>
            </div>

            <button
              type="button"
              onClick={onContinueOffline}
              aria-label="Skip or use offline"
              className="p-2 rounded-full hover:bg-[#F5F2EC] dark:hover:bg-[#232028] transition-colors text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Top Branding & Welcome Section */}
          <div className="flex flex-col items-center text-center mb-5 pt-1">
            {/* Minimal Organic Sunrise Mark */}
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#44634B] via-[#608066] to-[#EBB04D] p-[2px] shadow-sm mb-3 flex items-center justify-center">
              <div className="w-full h-full bg-[#FDFBF7] dark:bg-[#1D1C22] rounded-[22px] flex items-center justify-center relative overflow-hidden">
                <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="18" cy="23" r="8" fill="#EBB04D" fillOpacity="0.25" />
                  <circle cx="18" cy="23" r="5" fill="#EBB04D" />
                  <path d="M7 25C7 25 11 20 18 20C25 20 29 25 29 25" stroke="#44634B" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M18 7V10" stroke="#44634B" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M9.5 11.5L11.5 13.5" stroke="#44634B" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M26.5 11.5L24.5 13.5" stroke="#44634B" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M4 27H32" stroke="#44634B" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#1F2937] dark:text-[#FAF8F5] flex items-center gap-1.5">
              <span>DayOne</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FDF6E2] dark:bg-[#3E2F13] text-[#9E6E16] dark:text-[#F3CE79] tracking-normal align-middle">
                v2.4
              </span>
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed text-[#5A6578] dark:text-[#9E9892] max-w-[310px] font-normal">
              The calm, private baby care & milestone companion for mindful families.
            </p>
          </div>

          {/* Placeholder Notice */}
          {configStatus.isPlaceholder && (
            <div className="mb-4 p-3 rounded-2xl bg-[#FFF7F2] dark:bg-[#2A1E1C] border border-[#FCDCCB] dark:border-[#523A34] text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-[#D97757]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Placeholder Cloud URL Detected</span>
              </div>
              <p className="text-[11px] text-[#75706B] dark:text-[#A8A29E] leading-relaxed">
                Hosting environment is set to <code className="px-1 py-0.5 rounded bg-[#F2ECE3] dark:bg-[#342724] text-[10px]">your-project-id.supabase.co</code>. You can use full functionality in Local Mode.
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onContinueOffline}
                  className="w-full py-1.5 px-3 rounded-full bg-[#D97757] hover:bg-[#C16142] text-white text-[11px] font-semibold text-center transition-colors shadow-xs"
                >
                  Continue in Local Mode (Offline Ready)
                </button>
              </div>
            </div>
          )}

          {/* Sign In Card */}
          <section className="bg-white dark:bg-[#1D1C22] rounded-[28px] border border-[#E8E4DC] dark:border-[#2D2B33] p-5 shadow-sm mb-4">

            {/* Segmented Toggle: Sign In | Create Family Account */}
            <div className="p-1 bg-[#F5F2EC] dark:bg-[#17161B] rounded-full flex items-center mb-4">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className={`flex-1 py-2 rounded-full text-xs font-semibold transition-all text-center ${!isSignUp
                  ? 'text-[#2C3A2F] bg-white dark:bg-[#26242E] dark:text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:text-stone-400'
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
                className={`flex-1 py-2 rounded-full text-xs font-semibold transition-all text-center ${isSignUp
                  ? 'text-[#2C3A2F] bg-white dark:bg-[#26242E] dark:text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:text-stone-400'
                  }`}
              >
                Create Family Account
              </button>
            </div>

            {/* Primary OAuth: Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-white dark:bg-[#26242E] hover:bg-stone-50 dark:hover:bg-[#2F2C38] active:scale-[0.99] border border-stone-200 dark:border-stone-700 rounded-full flex items-center justify-center gap-2.5 transition-all shadow-2xs mb-3 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="text-[12.5px] font-semibold text-stone-800 dark:text-stone-100">
                Continue with Google
              </span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-3.5">
              <div className="w-full border-t border-[#EAE6DE] dark:border-[#2D2B33]" />
              <span className="absolute bg-white dark:bg-[#1D1C22] px-2.5 text-[10.5px] font-medium text-stone-400">
                or email link
              </span>
            </div>

            {/* Alerts */}
            {errorMsg && (
              <div className="mb-3 p-2.5 rounded-2xl bg-[#FDF0F2] border border-[#F8D0D6] text-[#8A2338] dark:bg-[#2B171A] dark:border-[#4D2329] dark:text-[#F1ABB6] text-xs font-medium leading-relaxed">
                {errorMsg}
              </div>
            )}

            {infoMsg && (
              <div className="mb-3 p-2.5 rounded-2xl bg-[#EDF5EE] border border-[#CFE2D1] text-[#23522A] dark:bg-[#1A2E1F] dark:border-[#2D4A33] dark:text-[#AECDB2] text-xs font-medium leading-relaxed">
                {infoMsg}
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="parents@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] dark:bg-[#17161B] border border-[#E8E4DC] dark:border-[#2D2B33] rounded-full text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#44634B]/30 focus:border-[#44634B] transition-all"
                />
              </div>

              {!useMagicLink && (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] dark:bg-[#17161B] border border-[#E8E4DC] dark:border-[#2D2B33] rounded-full text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#44634B]/30 focus:border-[#44634B] transition-all"
                  />
                </div>
              )}

              {/* Passwordless Toggle */}
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => setUseMagicLink(!useMagicLink)}
                  className="text-[11px] text-[#44634B] dark:text-[#83B08B] hover:underline font-semibold"
                >
                  {useMagicLink ? 'Use standard password instead' : 'Send passwordless Magic Link instead'}
                </button>
              </div>

              {/* Sage Green CTA Pill Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#44634B] hover:bg-[#344738] active:scale-[0.99] text-white rounded-full text-[13px] font-semibold flex items-center justify-center gap-2 shadow-xs transition-all duration-150 disabled:opacity-50 cursor-pointer"
              >
                <span>
                  {isLoading
                    ? 'Processing...'
                    : useMagicLink
                      ? 'Send Passwordless Magic Link'
                      : isSignUp
                        ? 'Create Family Account'
                        : 'Sign In'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <p className="text-[11px] text-center text-stone-400 mt-3 font-normal">
              {useMagicLink
                ? 'We send a one-tap secure link. No passwords to remember while holding baby.'
                : 'Your password is encrypted with modern auth standards.'}
            </p>
          </section>

          {/* Offline / Local-First Reassurance Banner */}
          <section className="bg-[#FAF7F2] dark:bg-[#1C1A20] rounded-[24px] border border-[#EBB04D]/30 p-4 mb-4 relative overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#FDF6E2] dark:bg-[#382B17] flex items-center justify-center shrink-0 text-[#EBB04D] mt-0.5">
                <WifiOff className="w-4 h-4" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[13px] font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                    No Account? Use 100% Locally
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#E1EDE4] dark:bg-[#1E2E21] text-[#344738] dark:text-[#A8D1B0] text-[10px] font-semibold">
                    Zero Lock-in
                  </span>
                </div>

                <p className="text-[11.5px] leading-relaxed text-[#5A6578] dark:text-[#9E9892] mt-1 mb-2.5">
                  Your baby records, growth charts, and care logs are stored privately on this device. You can sync to cloud whenever you are ready.
                </p>

                <button
                  type="button"
                  onClick={onContinueOffline}
                  className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-full border border-[#D97757]/70 hover:bg-[#FAECE5] dark:hover:bg-[#3D251C] text-[#D97757] dark:text-[#F39A7F] text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>Continue in Local Mode (Offline Ready)</span>
                  <span className="font-bold">→</span>
                </button>
              </div>
            </div>
          </section>

          {/* Security & Family Sharing Highlights */}
          <section className="mb-4 px-1">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/70 dark:bg-[#1D1C22]/70 border border-[#E8E4DC]/80 dark:border-[#2D2B33] text-xs text-stone-700 dark:text-stone-300">
                <ShieldCheck className="w-4 h-4 text-[#44634B] shrink-0" />
                <span className="font-medium text-[11.5px]">
                  <strong className="text-stone-900 dark:text-stone-100 font-semibold">End-to-end privacy:</strong> Encrypted AES-256 cloud backup
                </span>
              </div>

              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/70 dark:bg-[#1D1C22]/70 border border-[#E8E4DC]/80 dark:border-[#2D2B33] text-xs text-stone-700 dark:text-stone-300">
                <Users className="w-4 h-4 text-[#D97757] shrink-0" />
                <span className="font-medium text-[11.5px]">
                  <strong className="text-stone-900 dark:text-stone-100 font-semibold">Seamless family sync:</strong> Live handoff between Mom, Dad & Nanny
                </span>
              </div>

              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/70 dark:bg-[#1D1C22]/70 border border-[#E8E4DC]/80 dark:border-[#2D2B33] text-xs text-stone-700 dark:text-stone-300">
                <Smartphone className="w-4 h-4 text-[#EBB04D] shrink-0" />
                <span className="font-medium text-[11.5px]">
                  <strong className="text-stone-900 dark:text-stone-100 font-semibold">Instant offline PWA:</strong> Logs feedings & sleep without cell reception
                </span>
              </div>
            </div>
          </section>

        </div>

        {/* Calm Footer */}
        <footer className="pt-2 text-center border-t border-[#E8E4DC]/60 dark:border-[#2D2B33]/60 relative z-10">
          <p className="text-[11px] font-medium text-stone-400">
            DayOne Pediatric Companion • Built for restful parents
          </p>
          <div className="flex items-center justify-center gap-3 mt-1.5 text-[10.5px] text-stone-400">
            <span className="hover:text-[#44634B] cursor-pointer">Privacy Promise</span>
            <span>•</span>
            <span className="hover:text-[#44634B] cursor-pointer">Pediatric Data Standard</span>
            <span>•</span>
            <span className="hover:text-[#44634B] cursor-pointer">Export JSON/PDF</span>
          </div>
        </footer>

      </main>
    </div>
  );
};
