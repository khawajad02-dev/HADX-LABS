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
          className="fixed inset-0 z-[10000] bg-black flex items-center justify-center overflow-hidden w-screen h-[100dvh]"
        >
          {/* Phase 1: Logo Pre-loader */}
          <div className={`absolute inset-0 z-[10001] flex items-center justify-center bg-black transition-opacity duration-500 ${showVideo && videoStarted ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="w-full h-full flex items-center justify-center p-4">
              <img 
                src="/og-image.png" 
                alt="HADX Logo" 
                className="max-w-[85vw] max-h-[45vh] w-auto h-auto object-contain drop-shadow-[0_0_35px_rgba(212,175,55,0.35)]"
              />
            </div>
          </div>

          {/* Phase 2: Intro Video */}
          <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
            <video
              ref={videoRef}
              playsInline
              preload="auto"
              src="/videos/hadx_labs_intro.mp4"
              className={`absolute inset-0 w-full h-full object-contain bg-black transition-opacity duration-700 ${showVideo ? 'opacity-100' : 'opacity-0'}`}
              onEnded={handleDismiss}
            />
          </div>

          {/* Themed Skip Button - Anchored directly to root fixed overlay at bottom-right (bottom-6 right-12) */}
          {videoStarted && (
            <motion.button
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              onClick={handleDismiss}
              className="
                absolute bottom-6 right-12 z-[10005] 
                group relative overflow-hidden rounded-xl px-6 py-3
                backdrop-blur-md bg-black/80
                border border-amber-500/50
                shadow-[0_4px_30px_rgba(0,0,0,0.9)]
                transition-all duration-300 ease-out
                hover:border-amber-400 hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] cursor-pointer
                active:scale-[0.95] pointer-events-auto
                whitespace-nowrap
              "
            >
              <span className="relative flex items-center justify-center gap-2 text-xs font-bold tracking-[0.25em] uppercase text-amber-200 group-hover:text-amber-100">
                [&nbsp;
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">SKIP_INTRO</span>
                &nbsp;]
              </span>
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
