"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function IntroSplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if user has already seen the intro in this session
    const hasSeenIntro = sessionStorage.getItem("hadx_intro_seen");
    if (hasSeenIntro) {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("hadx_intro_seen", "true");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="fixed inset-0 z-[10000] bg-black flex items-center justify-center overflow-hidden"
        >
          <video
            autoPlay
            muted
            playsInline
            preload="auto"
            src="/videos/hadx_labs_intro.mp4"
            className="w-full h-full object-cover"
            onEnded={handleDismiss}
          />
          
          {/* Skip Button */}
          <button
            onClick={handleDismiss}
            className="absolute bottom-10 right-10 z-[10001] px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] font-mono tracking-[0.3em] uppercase transition-all backdrop-blur-md"
          >
            SKIP_INTRO
          </button>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60 pointer-events-none" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
