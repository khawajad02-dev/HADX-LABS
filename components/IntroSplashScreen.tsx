"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function IntroSplashScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
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
        } catch (err) {
          // If blocked, play muted
          console.log("Autoplay with sound blocked, playing muted");
          videoRef.current!.muted = true;
          setIsMuted(true);
          videoRef.current!.play().catch(e => console.error("Video play failed:", e));
        }
      };
      playVideo();
    }
  }, [isVisible]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
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
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isMuted}
              preload="auto"
              src="/videos/hadx_labs_intro.mp4"
              className="absolute inset-0 w-full h-full object-cover"
              onEnded={handleDismiss}
              onClick={toggleMute}
            />
            
            {/* Mute Toggle Hint */}
            {isMuted && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-8 left-1/2 -translate-x-1/2 z-[10006] pointer-events-none"
              >
                <span className="text-[10px] font-mono tracking-[0.3em] text-hadx-gold-light/60 uppercase bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm border border-hadx-gold/20">
                  Tap for sound
                </span>
              </motion.div>
            )}

            {/* Themed Skip Button */}
            <button
              onClick={handleDismiss}
              className="
                absolute bottom-[10%] left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-12 z-[10005] 
                group relative overflow-hidden rounded-xl px-8 py-4
                backdrop-blur-md bg-black/20
                border border-hadx-border/30
                transition-all duration-300 ease-out
                hover:border-hadx-border-glow hover:shadow-gold-glow-lg cursor-pointer
                active:scale-[0.95] pointer-events-auto
                w-[auto] min-w-[160px] whitespace-nowrap
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
