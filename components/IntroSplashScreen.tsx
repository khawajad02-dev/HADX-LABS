"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function IntroSplashScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showSoundHint, setShowSoundHint] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const hasSeenIntro = sessionStorage.getItem("hadx_intro_seen");
      if (!hasSeenIntro) {
        setIsVisible(true);
      }
    }
  }, []);

  // Handle audio autoplay policy
  useEffect(() => {
    if (isVisible && videoRef.current) {
      const playVideo = async () => {
        try {
          // Try to play with sound first
          videoRef.current!.muted = false;
          await videoRef.current!.play();
          setIsMuted(false);
          setShowSoundHint(false);
        } catch (err) {
          // If blocked, play muted
          console.log("Autoplay with sound blocked, playing muted");
          videoRef.current!.muted = true;
          setIsMuted(true);
          setShowSoundHint(true);
          videoRef.current!.play().catch(e => console.error("Video play failed:", e));
        }
      };
      playVideo();
    }
  }, [isVisible]);

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !videoRef.current.muted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      if (!newMutedState) setShowSoundHint(false);
    }
  };

  if (!mounted) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem("hadx_intro_seen", "true");
    }
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
          <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isMuted}
              preload="auto"
              poster="/og-image.png"
              src="/videos/hadx_labs_intro.mp4"
              className="w-full h-full object-contain md:object-cover"
              onEnded={handleDismiss}
              onClick={toggleMute}
            />
            
            {/* Poster Overlay (Fade out when video starts) */}
            <div className="absolute inset-0 pointer-events-none bg-black/20" />

            {/* Mute Toggle Hint */}
            {showSoundHint && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-8 left-1/2 -translate-x-1/2 z-[10006]"
              >
                <button 
                  onClick={toggleMute}
                  className="text-[10px] font-mono tracking-[0.3em] text-hadx-gold-light/90 uppercase bg-black/60 px-6 py-3 rounded-full backdrop-blur-md border border-hadx-gold/40 hover:bg-hadx-gold/20 transition-colors"
                >
                  Tap to Unmute
                </button>
              </motion.div>
            )}

            {/* Themed Skip Button - Fixed to Bottom Right */}
            <button
              onClick={handleDismiss}
              className="
                absolute bottom-8 right-8 z-[10005] 
                group relative overflow-hidden rounded-xl px-8 py-4
                backdrop-blur-md bg-black/40
                border border-hadx-border/40
                transition-all duration-300 ease-out
                hover:border-hadx-border-glow hover:shadow-gold-glow-lg cursor-pointer
                active:scale-[0.95] pointer-events-auto
                w-[auto] min-w-[140px] whitespace-nowrap
              "
            >
              <span className="relative flex items-center justify-center gap-2 text-[10px] font-bold tracking-[0.25em] uppercase text-hadx-gold-light/80 group-hover:text-hadx-gold-light">
                [&nbsp;
                <span className="bg-clip-text text-transparent bg-gold-gradient">SKIP_INTRO</span>
                &nbsp;]
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
