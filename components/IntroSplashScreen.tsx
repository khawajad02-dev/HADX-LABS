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
          className="fixed inset-0 z-[10000] bg-black flex items-center justify-center overflow-hidden w-screen h-screen"
        >
          <video
            autoPlay
            muted
            playsInline
            preload="auto"
            src="/videos/hadx_labs_intro.mp4"
            className="absolute inset-0 w-full h-full object-cover"
            onEnded={handleDismiss}
          />
          
          {/* Themed Skip Button */}
          <button
            onClick={handleDismiss}
            className="
              absolute bottom-10 right-6 md:right-12 z-[10001] 
              group relative overflow-hidden rounded-xl px-8 py-4
              backdrop-blur-md bg-black/50
              border border-hadx-border
              transition-all duration-300 ease-out
              hover:border-hadx-border-glow hover:shadow-gold-glow-lg cursor-pointer
              active:scale-[0.98]
            "
          >
            {/* Scratched gold border overlay */}
            <span
              className="pointer-events-none absolute inset-0 rounded-xl opacity-40 group-hover:opacity-70 transition-opacity duration-300"
              style={{
                background:
                  "linear-gradient(115deg, transparent 20%, rgba(245,158,11,0.35) 35%, transparent 45%, transparent 65%, rgba(253,230,138,0.25) 78%, transparent 90%)",
              }}
            />

            <span className="relative flex items-center justify-center gap-2 text-[10px] font-bold tracking-[0.25em] uppercase text-hadx-gold-light group-hover:text-hadx-gold-light">
              [&nbsp;
              <span className="bg-clip-text text-transparent bg-gold-gradient">SKIP_INTRO</span>
              &nbsp;]
            </span>
          </button>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60 pointer-events-none" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
