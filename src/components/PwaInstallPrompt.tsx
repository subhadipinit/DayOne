'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Share,
  PlusSquare,
  CheckCircle2,
  Smartphone,
  X,
  Sparkles,
  ArrowDown,
  ArrowUp,
  MoreVertical,
  ShieldAlert,
  Info
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __dayoneDeferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

const SNOOZE_KEY = 'dayone_pwa_dismissed_until';
const SNOOZE_DAYS = 3;

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isHttps, setIsHttps] = useState<boolean>(true);
  const [showPromptBanner, setShowPromptBanner] = useState<boolean>(false);
  const [showIosModal, setShowIosModal] = useState<boolean>(false);
  const [showAndroidModal, setShowAndroidModal] = useState<boolean>(false);
  const [installedToast, setInstalledToast] = useState<boolean>(false);

  // Initialize and check environment
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Check standalone mode (already installed PWA)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    const standalone = checkStandalone();

    // 2. Platform checks
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);

    // 3. HTTPS check (Android Chrome requires HTTPS or localhost)
    const secure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    setIsHttps(secure);

    // 4. Check if early layout script already captured the prompt
    if (window.__dayoneDeferredPrompt) {
      setDeferredPrompt(window.__dayoneDeferredPrompt);
    }

    // 5. Ensure service worker is registered
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[DayOne PWA] Active Service Worker scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[DayOne PWA] SW register warning:', err);
        });
    }

    // Check snooze in localStorage
    const snoozeUntil = localStorage.getItem(SNOOZE_KEY);
    const isSnoozed = snoozeUntil ? Date.now() < parseInt(snoozeUntil, 10) : false;

    // Listen for Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__dayoneDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);

      if (!standalone && !isSnoozed) {
        setShowPromptBanner(true);
      }
    };

    // Listen for custom event if captured early by layout script
    const handleEarlyPromptReady = () => {
      if (window.__dayoneDeferredPrompt) {
        setDeferredPrompt(window.__dayoneDeferredPrompt);
        if (!standalone && !isSnoozed) {
          setShowPromptBanner(true);
        }
      }
    };

    // Listen for app installed completion
    const handleAppInstalled = () => {
      window.__dayoneDeferredPrompt = null;
      setDeferredPrompt(null);
      setShowPromptBanner(false);
      setShowIosModal(false);
      setShowAndroidModal(false);
      setIsStandalone(true);
      setInstalledToast(true);
      setTimeout(() => setInstalledToast(false), 5000);
    };

    // Listen for manual trigger from Navbar or Settings
    const handleManualTrigger = () => {
      if (checkStandalone()) {
        setInstalledToast(true);
        setTimeout(() => setInstalledToast(false), 4000);
        return;
      }

      const activePrompt = deferredPrompt || window.__dayoneDeferredPrompt;
      if (activePrompt) {
        activePrompt
          .prompt()
          .then(() => activePrompt.userChoice)
          .then((choice) => {
            if (choice.outcome === 'accepted') {
              console.log('[DayOne PWA] User accepted installation');
            }
            setDeferredPrompt(null);
            window.__dayoneDeferredPrompt = null;
            setShowPromptBanner(false);
          })
          .catch(() => {
            if (isAndroidDevice) setShowAndroidModal(true);
            else if (isIosDevice) setShowIosModal(true);
          });
      } else if (isIosDevice) {
        setShowIosModal(true);
      } else if (isAndroidDevice || !secure) {
        setShowAndroidModal(true);
      } else {
        setShowPromptBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('dayone:pwa-prompt-ready', handleEarlyPromptReady);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('dayone:trigger-pwa-install', handleManualTrigger);

    // Initial banner check for mobile users
    if (!standalone && !isSnoozed) {
      const timer = setTimeout(() => {
        setShowPromptBanner(true);
      }, 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('dayone:pwa-prompt-ready', handleEarlyPromptReady);
        window.removeEventListener('appinstalled', handleAppInstalled);
        window.removeEventListener('dayone:trigger-pwa-install', handleManualTrigger);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('dayone:pwa-prompt-ready', handleEarlyPromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('dayone:trigger-pwa-install', handleManualTrigger);
    };
  }, []);

  // Handle clicking Install on banner
  const handleInstallClick = useCallback(async () => {
    const activePrompt = deferredPrompt || (typeof window !== 'undefined' ? window.__dayoneDeferredPrompt : null);

    if (activePrompt) {
      try {
        await activePrompt.prompt();
        const choice = await activePrompt.userChoice;
        if (choice.outcome === 'accepted') {
          console.log('[DayOne PWA] User accepted installation');
        }
        setDeferredPrompt(null);
        if (typeof window !== 'undefined') window.__dayoneDeferredPrompt = null;
        setShowPromptBanner(false);
      } catch (err) {
        console.warn('[DayOne PWA] Prompt failed, showing manual guide:', err);
        if (isAndroid) setShowAndroidModal(true);
        else if (isIOS) setShowIosModal(true);
      }
    } else if (isIOS) {
      setShowIosModal(true);
    } else {
      // If Android Chrome hasn't fired beforeinstallprompt or non-https
      setShowAndroidModal(true);
    }
  }, [deferredPrompt, isIOS, isAndroid]);

  // Handle Snooze / Dismiss
  const handleDismiss = () => {
    setShowPromptBanner(false);
    const snoozeUntil = Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem(SNOOZE_KEY, snoozeUntil.toString());
    } catch (e) {
      // Ignore storage errors
    }
  };

  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* 1. FLOATING INSTALL BANNER (Comfortably above mobile bottom nav) */}
      {showPromptBanner && (
        <div
          role="dialog"
          aria-label="Install DayOne App"
          className="fixed z-40 bottom-24 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm transition-all duration-300 ease-out transform-gpu animate-in fade-in slide-in-from-bottom-5"
        >
          <div className="relative rounded-2xl bg-white/95 dark:bg-[#1E1C24]/95 backdrop-blur-md border border-[#EAE6DF] dark:border-[#2F2C37] p-4 shadow-2xl shadow-black/10 dark:shadow-black/40">
            {/* Top Close Button */}
            <button
              onClick={handleDismiss}
              aria-label="Dismiss install banner"
              className="absolute top-3 right-3 p-1 rounded-full text-[#75706B] hover:text-[#201E1D] dark:hover:text-[#FAF8F5] hover:bg-[#F2ECE3] dark:hover:bg-[#2A2832] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3.5 pr-5">
              {/* DayOne App Icon */}
              <div className="relative shrink-0 w-12 h-12 rounded-2xl bg-[#FFF0E6] dark:bg-[#332522] border border-[#FCDCCB] dark:border-[#523A34] flex items-center justify-center shadow-xs overflow-hidden">
                <svg viewBox="0 0 100 100" fill="none" className="w-8 h-8">
                  <path
                    d="M50 18C44 26 34 30 24 30C24 48 34 68 50 82C66 68 76 48 76 30C66 30 56 26 50 18Z"
                    fill="#E2765A"
                  />
                  <path
                    d="M50 35C47 38 41 40 36 40C36 50 42 62 50 70C58 62 64 50 64 40C59 40 53 38 50 35Z"
                    fill="#FAF8F5"
                  />
                  <circle cx="50" cy="50" r="5" fill="#E2765A" />
                </svg>
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#E2765A] border-2 border-white dark:border-[#1E1C24] flex items-center justify-center">
                  <Sparkles className="w-2 h-2 text-white" />
                </div>
              </div>

              {/* Text Information */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-[#201E1D] dark:text-[#FAF8F5] tracking-tight">
                    Install DayOne
                  </h4>
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-[#FFF0E6] dark:bg-[#332522] text-[#E2765A]">
                    Mobile App
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[#75706B] dark:text-[#A8A29E] leading-relaxed">
                  Fast 1-tap launch, full-screen nursing timers & works offline without signal.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-3.5 flex items-center gap-2 pt-2 border-t border-[#F2ECE3] dark:border-[#2A2832]">
              <button
                onClick={handleInstallClick}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-[#E2765A] hover:bg-[#D0664B] active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all duration-150 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install DayOne</span>
              </button>

              <button
                onClick={handleDismiss}
                className="py-2 px-3 rounded-xl bg-[#F2ECE3] dark:bg-[#2A2832] hover:bg-[#EAE4DB] dark:hover:bg-[#34323E] text-[#75706B] dark:text-[#A8A29E] text-xs font-medium transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ANDROID CHROME MANUAL INSTALLATION GUIDE MODAL */}
      {showAndroidModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowAndroidModal(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#1E1C24] border border-[#EAE6DF] dark:border-[#2F2C37] p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowAndroidModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#75706B] hover:text-[#201E1D] dark:hover:text-[#FAF8F5] hover:bg-[#F2ECE3] dark:hover:bg-[#2A2832] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#FFF0E6] dark:bg-[#332522] border border-[#FCDCCB] dark:border-[#523A34] flex items-center justify-center text-[#E2765A]">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#201E1D] dark:text-[#FAF8F5]">
                  Install on Android Chrome
                </h3>
                <p className="text-xs text-[#75706B] dark:text-[#A8A29E]">
                  Install directly in 2 quick taps:
                </p>
              </div>
            </div>

            {/* Steps Visual List */}
            <div className="space-y-3 pt-2">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#151419] border border-[#EAE6DF] dark:border-[#2A2832]">
                <div className="w-6 h-6 rounded-full bg-[#E2765A] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-xs text-[#201E1D] dark:text-[#DDD8D0] leading-relaxed">
                  Tap Chrome's <strong className="font-semibold text-[#E2765A]">menu</strong>{' '}
                  <span className="inline-flex items-center justify-center w-5 h-5 align-middle rounded bg-[#EAE6DF] dark:bg-[#2F2C37] mx-1">
                    <MoreVertical className="w-3.5 h-3.5 text-[#201E1D] dark:text-[#FAF8F5]" />
                  </span>{' '}
                  (the 3 vertical dots in top-right corner of Chrome).
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#151419] border border-[#EAE6DF] dark:border-[#2A2832]">
                <div className="w-6 h-6 rounded-full bg-[#E2765A] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-xs text-[#201E1D] dark:text-[#DDD8D0] leading-relaxed">
                  Select <strong className="font-semibold text-[#E2765A]">"Install app"</strong> or <strong className="font-semibold text-[#E2765A]">"Add to Home screen"</strong> from the menu.
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#151419] border border-[#EAE6DF] dark:border-[#2A2832]">
                <div className="w-6 h-6 rounded-full bg-[#E2765A] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-xs text-[#201E1D] dark:text-[#DDD8D0] leading-relaxed">
                  Tap <strong className="font-semibold text-[#E2765A]">Install</strong> on the confirmation prompt to add DayOne to your phone.
                </div>
              </div>
            </div>

            {/* HTTPS Notice */}
            {!isHttps && (
              <div className="p-2.5 rounded-xl bg-[#FFF7F2] dark:bg-[#2A1E1C] border border-[#FCDCCB] dark:border-[#523A34] text-[11px] text-[#8A3510] dark:text-[#F8BCA0] flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-[#E2765A] mt-0.5" />
                <span>
                  <strong>Tip:</strong> Android Chrome requires a secure <strong>HTTPS</strong> address (e.g. deployed on Vercel) or <code>localhost</code> to install PWAs.
                </span>
              </div>
            )}

            {/* Visual Arrow Hint pointing to top right */}
            <div className="pt-1 flex items-center justify-center gap-1.5 text-xs text-[#75706B] dark:text-[#A8A29E]">
              <ArrowUp className="w-3.5 h-3.5 animate-bounce text-[#E2765A]" />
              <span>Menu (⋮) is located in the top-right of Chrome</span>
            </div>

            {/* Got It Button */}
            <button
              onClick={() => setShowAndroidModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#E2765A] hover:bg-[#D0664B] active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all duration-150 cursor-pointer"
            >
              Got it, let me install
            </button>
          </div>
        </div>
      )}

      {/* 3. iOS STEP-BY-STEP INSTALLATION MODAL */}
      {showIosModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowIosModal(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#1E1C24] border border-[#EAE6DF] dark:border-[#2F2C37] p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowIosModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#75706B] hover:text-[#201E1D] dark:hover:text-[#FAF8F5] hover:bg-[#F2ECE3] dark:hover:bg-[#2A2832] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#FFF0E6] dark:bg-[#332522] border border-[#FCDCCB] dark:border-[#523A34] flex items-center justify-center text-[#E2765A]">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#201E1D] dark:text-[#FAF8F5]">
                  Install on iPhone / iPad
                </h3>
                <p className="text-xs text-[#75706B] dark:text-[#A8A29E]">
                  Safari requires 3 quick taps:
                </p>
              </div>
            </div>

            {/* Steps Visual List */}
            <div className="space-y-3 pt-2">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#151419] border border-[#EAE6DF] dark:border-[#2A2832]">
                <div className="w-6 h-6 rounded-full bg-[#E2765A] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-xs text-[#201E1D] dark:text-[#DDD8D0] leading-relaxed">
                  Tap the <strong className="font-semibold text-[#E2765A]">Share</strong> icon{' '}
                  <span className="inline-flex items-center justify-center w-5 h-5 align-middle rounded bg-[#EAE6DF] dark:bg-[#2F2C37] mx-1">
                    <Share className="w-3.5 h-3.5 text-[#201E1D] dark:text-[#FAF8F5]" />
                  </span>{' '}
                  in Safari navigation bar.
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#151419] border border-[#EAE6DF] dark:border-[#2A2832]">
                <div className="w-6 h-6 rounded-full bg-[#E2765A] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-xs text-[#201E1D] dark:text-[#DDD8D0] leading-relaxed">
                  Scroll down and tap{' '}
                  <strong className="font-semibold text-[#E2765A]">
                    Add to Home Screen
                  </strong>{' '}
                  <span className="inline-flex items-center justify-center w-5 h-5 align-middle rounded bg-[#EAE6DF] dark:bg-[#2F2C37] mx-1">
                    <PlusSquare className="w-3.5 h-3.5 text-[#201E1D] dark:text-[#FAF8F5]" />
                  </span>.
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#151419] border border-[#EAE6DF] dark:border-[#2A2832]">
                <div className="w-6 h-6 rounded-full bg-[#E2765A] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-xs text-[#201E1D] dark:text-[#DDD8D0] leading-relaxed">
                  Tap <strong className="font-semibold text-[#E2765A]">Add</strong> in the top-right corner to save DayOne onto your home screen!
                </div>
              </div>
            </div>

            {/* Visual Arrow Hint for Mobile Safari */}
            <div className="pt-1 flex items-center justify-center gap-1.5 text-xs text-[#75706B] dark:text-[#A8A29E]">
              <ArrowDown className="w-3.5 h-3.5 animate-bounce text-[#E2765A]" />
              <span>Share button is typically at the bottom of Safari</span>
            </div>

            {/* Got It Button */}
            <button
              onClick={() => setShowIosModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#E2765A] hover:bg-[#D0664B] active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all duration-150 cursor-pointer"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}

      {/* 4. APP INSTALLED CELEBRATION TOAST */}
      {installedToast && (
        <div className="fixed z-50 top-5 left-1/2 -translate-x-1/2 max-w-sm w-[90%] px-4 py-3 rounded-2xl bg-[#1B3624] text-[#E8F5E9] border border-[#4CAF50]/30 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-3">
          <div className="w-8 h-8 rounded-full bg-[#4CAF50] text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white">DayOne is ready!</p>
            <p className="text-[11px] text-[#A5D6A7] truncate">
              Launched from your home screen with offline sync.
            </p>
          </div>
          <button
            onClick={() => setInstalledToast(false)}
            className="p-1 rounded-full text-[#A5D6A7] hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
};
