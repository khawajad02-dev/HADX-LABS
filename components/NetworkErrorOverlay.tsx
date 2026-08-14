"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function NetworkErrorOverlay() {
  const [isOffline, setIsOffline] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
    
    const updateOnlineStatus = () => {
      const status = !navigator.onLine;
      setIsOffline(status);
      if (!status) setVideoReady(false);
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Initial check
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (isOffline && videoRef.current) {
      const playVideo = async () => {
        try {
          videoRef.current!.muted = false;
          await videoRef.current!.play();
        } catch (err) {
          videoRef.current!.muted = true;
          videoRef.current!.play().catch(e => console.error("Offline video play failed:", e));
        }
      };
      playVideo();
    }
  }, [isOffline]);

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
          <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
            
            {/* Logo Placeholder while loading (Full Screen) */}
            <div className={`absolute inset-0 z-[10003] flex items-center justify-center bg-black transition-opacity duration-700 ${videoReady ? 'opacity-0' : 'opacity-100'}`}>
              <img src="/og-image.png" alt="HADX Logo" className="w-full h-full object-cover opacity-50" />
            </div>

            <video
              ref={videoRef}
              autoPlay
              loop
              playsInline
              preload="auto"
              src="/videos/network-error.mp4"
              className="w-full h-full object-cover"
              onCanPlayThrough={() => setVideoReady(true)}
            />
            
            {/* Subtle Red Overlay for Mood */}
            <div className="absolute inset-0 bg-red-950/10 pointer-events-none z-[10004]" />

            {/* Themed Retry Button */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[10005]">
              <button 
                onClick={() => window.location.reload()}
                className="
                  group relative overflow-hidden rounded-xl px-10 py-4
                  backdrop-blur-md bg-black/30
                  border border-hadx-border/40
                  transition-all duration-300 ease-out
                  hover:border-hadx-border-glow hover:shadow-gold-glow-lg cursor-pointer
                  active:scale-[0.95] pointer-events-auto
                  min-w-[220px]
                "
              >
                <span className="relative flex items-center justify-center gap-2 text-[10px] font-bold tracking-[0.3em] uppercase text-hadx-gold-light group-hover:text-hadx-gold-light">
                  [&nbsp;
                  <span className="bg-clip-text text-transparent bg-gold-gradient">RETRY_CONNECTION</span>
                  &nbsp;]
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
