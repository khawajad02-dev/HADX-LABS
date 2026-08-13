"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function NetworkErrorOverlay() {
  const [isOffline, setIsOffline] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOffline && videoRef.current) {
      const playVideo = async () => {
        try {
          videoRef.current!.muted = false;
          await videoRef.current!.play();
          setIsMuted(false);
        } catch (err) {
          videoRef.current!.muted = true;
          setIsMuted(true);
          videoRef.current!.play().catch(e => console.error("Offline video play failed:", e));
        }
      };
      playVideo();
    }
  }, [isOffline]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10002] bg-black flex flex-col items-center justify-center overflow-hidden w-screen h-screen"
        >
          <video
            ref={videoRef}
            autoPlay
            loop
            playsInline
            muted={isMuted}
            preload="auto"
            src="/videos/network-error.mp4"
            className="absolute inset-0 w-full h-full object-cover"
            onClick={toggleMute}
          />
          
          {/* Subtle Red Overlay for Mood */}
          <div className="absolute inset-0 bg-red-950/10 pointer-events-none z-[10003]" />
          
          {/* Mute Toggle Hint */}
          {isMuted && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-8 left-1/2 -translate-x-1/2 z-[10006] pointer-events-none"
            >
              <span className="text-[10px] font-mono tracking-[0.3em] text-white/60 uppercase bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
                Tap for sound
              </span>
            </motion.div>
          )}

          {/* Themed Retry Button */}
          <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 z-[10004]">
            <button 
              onClick={() => window.location.reload()}
              className="
                group relative overflow-hidden rounded-xl px-10 py-4
                backdrop-blur-md bg-black/30
                border border-hadx-border/40
                transition-all duration-300 ease-out
                hover:border-hadx-border-glow hover:shadow-gold-glow-lg cursor-pointer
                active:scale-[0.95] pointer-events-auto
                min-w-[200px]
              "
            >
              <span className="relative flex items-center justify-center gap-2 text-[10px] font-bold tracking-[0.3em] uppercase text-hadx-gold-light group-hover:text-hadx-gold-light">
                [&nbsp;
                <span className="bg-clip-text text-transparent bg-gold-gradient">RETRY_CONNECTION</span>
                &nbsp;]
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
