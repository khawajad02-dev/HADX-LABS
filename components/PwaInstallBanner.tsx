"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if already installed in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show every visit as requested (use session storage to show once per session or every load)
      const dismissedThisSession = sessionStorage.getItem("hadx_pwa_dismissed");
      if (!dismissedThisSession) {
        // Show after 5 seconds as requested
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 5000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Also fallback show banner after 5s for browsers where beforeinstallprompt doesn't fire immediately
    const fallbackTimer = setTimeout(() => {
      const dismissedThisSession = sessionStorage.getItem("hadx_pwa_dismissed");
      if (!dismissedThisSession && !isStandalone) {
        setShowBanner(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setDeferredPrompt(null);
    } else {
      alert("To install HADX LABS, tap your browser menu (...) and select 'Add to Home Screen' or 'Install App'.");
    }
    setShowBanner(false);
    sessionStorage.setItem("hadx_pwa_dismissed", "true");
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem("hadx_pwa_dismissed", "true");
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.4 }}
          className="liquid-panel fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[9999] border-amber-500/40 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/og-image.png" alt="HADX" className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-200">HADX LABS App</h4>
              <p className="text-[11px] text-zinc-400">Install our app for lightning-fast vintage asset drops & offline access.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="liquid-ui px-4 py-2 text-amber-100 text-xs font-bold uppercase tracking-widest rounded-lg shadow-lg cursor-pointer"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="liquid-ui flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
