"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function NetworkErrorOverlay() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10002] bg-black flex flex-col items-center justify-center overflow-hidden"
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            src="/videos/network-error.mp4"
            className="w-full h-full max-h-screen object-cover md:object-contain opacity-60"
          />
          
          <div className="absolute inset-0 bg-red-900/10 pointer-events-none" />
          
          <div className="absolute z-[10003] text-center space-y-4 px-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              <span className="text-[10px] font-mono tracking-[0.4em] text-red-500 uppercase">
                CRITICAL_SYSTEM_FAILURE
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extralight tracking-tighter text-white uppercase">
              Connection Lost
            </h2>
            <p className="text-[11px] font-mono text-zinc-500 tracking-widest max-w-md mx-auto leading-relaxed">
              HADX ARCHITECTURE TERMINAL HAS DISCONNECTED FROM THE GRID. RE-ESTABLISHING UPLINK...
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
