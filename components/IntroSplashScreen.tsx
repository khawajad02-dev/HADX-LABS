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
        // Show the golden-light logo briefly (500ms) then start video load
        const timer = setTimeout(() => {
          setShowVideo(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

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
            console.error("Video autoplay blocked:", e);
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
          {/* Second Picture: Golden Light Logo Pre-loader */}
          <div className={`absolute inset-0 z-[10002] flex items-center justify-center bg-black transition-opacity duration-500 ${videoStarted ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="w-full h-[100dvh] flex items-center justify-center bg-black p-4">
              <img 
                src="/og-image.png" 
                alt="HADX Logo" 
                className="max-w-[70vw] max-h-[35vh] w-auto h-auto object-contain drop-shadow-[0_0_45px_rgba(255,215,0,0.6)] filter brightness-110"
              />
            </div>
          </div>

          {/* Intro Video Layer */}
          <div className="absolute inset-0 w-full h-[100dvh] overflow-hidden bg-black flex items-center justify-center z-[10001]">
            <video
              ref={videoRef}
              playsInline
              preload="auto"
              src="/videos/hadx_labs_intro.mp4"
              className="w-full h-full object-contain bg-black"
              onPlaying={() => setVideoStarted(true)}
              onEnded={handleDismiss}
            />
          </div>

          {/* Skip Button */}
          {videoStarted && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 z-[10005] pointer-events-auto"
            >
              <button
                onClick={handleDismiss}
                className="
                  group relative overflow-hidden rounded-xl px-6 py-3
                  backdrop-blur-md bg-black/75
                  border border-amber-500/50
                  shadow-[0_4px_25px_rgba(0,0,0,0.8)]
                  transition-all duration-300 ease-out
                  hover:border-amber-400 hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] cursor-pointer
                  active:scale-[0.95]
                "
              >
                <span className="relative flex items-center justify-center gap-2 text-xs font-bold tracking-[0.25em] uppercase text-amber-200 group-hover:text-amber-100">
                  [&nbsp;
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">SKIP_INTRO</span>
                  &nbsp;]
                </span>
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
