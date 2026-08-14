"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function IntroSplashScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const hasSeenIntro = sessionStorage.getItem("hadx_intro_seen");
      if (!hasSeenIntro) {
        setIsVisible(true);
        // Show logo for exactly 800ms before starting video
        const timer = setTimeout(() => {
          setShowVideo(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Handle automatic audio playback
  useEffect(() => {
    if (showVideo && videoRef.current) {
      const playVideo = async () => {
        try {
          // Attempt to play with sound
          videoRef.current!.muted = false;
          await videoRef.current!.play();
        } catch (err) {
          // If blocked by browser, play muted as fallback
          videoRef.current!.muted = true;
          videoRef.current!.play().catch(e => console.error("Video play failed:", e));
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
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[10000] bg-black flex items-center justify-center overflow-hidden w-screen h-screen"
        >
          <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
            
            {/* Phase 1: Logo/Poster (Always Full Screen) */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className={`absolute inset-0 z-[10001] flex items-center justify-center bg-black transition-opacity duration-500 ${videoReady ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
              <img 
                src="/og-image.png" 
                alt="HADX Logo" 
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Phase 2: Video (Always Full Screen) */}
            {showVideo && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                preload="auto"
                src="/videos/hadx_labs_intro.mp4"
                className="w-full h-full object-cover"
                onCanPlayThrough={() => setVideoReady(true)}
                onEnded={handleDismiss}
              />
            )}

            {/* Themed Skip Button - Only visible when video is playing */}
            {videoReady && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleDismiss}
                className="
                  absolute bottom-10 right-8 z-[10005] 
                  group relative overflow-hidden rounded-xl px-8 py-4
                  backdrop-blur-md bg-black/40
                  border border-hadx-border/40
                  transition-all duration-300 ease-out
                  hover:border-hadx-border-glow hover:shadow-gold-glow-lg cursor-pointer
                  active:scale-[0.95] pointer-events-auto
                  min-w-[140px] whitespace-nowrap
                "
              >
                <span className="relative flex items-center justify-center gap-2 text-[10px] font-bold tracking-[0.25em] uppercase text-hadx-gold-light/80 group-hover:text-hadx-gold-light">
                  [&nbsp;
                  <span className="bg-clip-text text-transparent bg-gold-gradient">SKIP_INTRO</span>
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
