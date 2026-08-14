"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function IntroSplashScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const hasSeenIntro = sessionStorage.getItem("hadx_intro_seen");
      if (!hasSeenIntro) {
        setIsVisible(true);
        // Show logo for exactly 1000ms (1s), then trigger video
        const timer = setTimeout(() => {
          setShowVideo(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Handle video playback automatically when showVideo becomes true
  useEffect(() => {
    if (showVideo && videoRef.current) {
      const playVideo = async () => {
        try {
          videoRef.current!.muted = false;
          await videoRef.current!.play();
          setVideoStarted(true);
        } catch (err) {
          // Fallback to muted autoplay if browser blocks audio
          try {
            videoRef.current!.muted = true;
            await videoRef.current!.play();
            setVideoStarted(true);
          } catch (e) {
            console.error("Video autoplay completely blocked:", e);
            handleDismiss();
          }
        }
      };
      playVideo();
    }
  }, [showVideo]);

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
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[10000] bg-black flex items-center justify-center overflow-hidden w-screen h-screen"
        >
          <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
            
            {/* Phase 1: Logo Display (Normal Size, Centered, No Clipping) */}
            <div className={`absolute inset-0 z-[10001] flex items-center justify-center bg-black transition-opacity duration-500 ${showVideo && videoStarted ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <div className="w-48 h-48 sm:w-64 sm:h-64 relative flex items-center justify-center">
                <img 
                  src="/og-image.png" 
                  alt="HADX Logo" 
                  className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(212,175,55,0.4)]"
                />
              </div>
            </div>

            {/* Phase 2: Intro Video (True Full-Screen Scaling) */}
            <video
              ref={videoRef}
              playsInline
              preload="auto"
              src="/videos/hadx_labs_intro.mp4"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${showVideo ? 'opacity-100' : 'opacity-0'}`}
              onEnded={handleDismiss}
            />

            {/* Themed Skip Button - Only visible when video has actually started playing */}
            {videoStarted && (
              <motion.button
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onClick={handleDismiss}
                className="
                  absolute bottom-8 right-8 z-[10005] 
                  group relative overflow-hidden rounded-xl px-6 py-3
                  backdrop-blur-md bg-black/50
                  border border-amber-500/30
                  transition-all duration-300 ease-out
                  hover:border-amber-400 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] cursor-pointer
                  active:scale-[0.95] pointer-events-auto
                  whitespace-nowrap
                "
              >
                <span className="relative flex items-center justify-center gap-2 text-[10px] font-bold tracking-[0.25em] uppercase text-amber-200/90 group-hover:text-amber-100">
                  [&nbsp;
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">SKIP_INTRO</span>
                  &nbsp;]
                </span>
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
