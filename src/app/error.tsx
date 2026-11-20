'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { DayOneLogo } from '@/components/DayOneLogo';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[DayOne Global Error]:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] dark:bg-[#141317] text-[#201E1D] dark:text-[#FAF8F5] p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#1C1B22] border border-[#EAE6DF] dark:border-[#2C2A34] rounded-3xl p-6 sm:p-8 shadow-md text-center">
        <div className="flex justify-center mb-4">
          <DayOneLogo size={44} variant="mark" />
        </div>
        <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold mb-2">DayOne encountered an issue</h2>
        <p className="text-xs text-[#75706B] dark:text-[#9E9892] mb-6 leading-relaxed">
          {error?.message || 'An unexpected error occurred while loading this view. Your offline and saved baby data remains secure.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-container text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reload App</span>
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#F1F4F0] dark:bg-[#25232A] hover:bg-[#E6E9E4] dark:hover:bg-[#2D2B33] text-on-surface text-xs font-semibold rounded-xl transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}
