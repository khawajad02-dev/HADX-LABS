"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function NetworkErrorOverlay() {
  const [isOffline, setIsOffline] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
    
    const updateOnlineStatus = () => {
      const status = !navigator.onLine;
      setIsOffline(status);
      if (!status) setVideoStarted(false);
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

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
          setVideoStarted(true);
        } catch (err) {
          try {
            videoRef.current!.muted = true;
            await videoRef.current!.play();
            setVideoStarted(true);
          } catch (e) {
            console.error("Offline video play failed:", e);
          }
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
          className="fixed inset-0 z-[10002] bg-black flex flex-col items-center justify-center overflow-hidden w-full h-[100dvh]"
        >
          {/* Logo Placeholder with precise sizing */}
          <div className={`absolute inset-0 z-[10003] flex items-center justify-center bg-black transition-opacity duration-700 ${videoStarted ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="w-full h-[100dvh] flex items-center justify-center bg-black p-4">
              <img src="/og-image.png" alt="HADX Logo" className="max-w-[70vw] max-h-[35vh] w-auto h-auto object-contain drop-shadow-[0_0_35px_rgba(212,175,55,0.35)]" />
            </div>
          </div>

          <div className="w-full h-[100dvh] overflow-hidden bg-black flex items-center justify-center relative">
            <video
              ref={videoRef}
              autoPlay
              loop
              playsInline
              preload="auto"
              src="/videos/network-error.mp4"
              className="w-full h-full object-contain bg-black"
              onPlaying={() => setVideoStarted(true)}
            />
          </div>
          
          {/* Subtle Red Overlay */}
          <div className="absolute inset-0 bg-red-950/10 pointer-events-none z-[10004]" />

          {/* Retry Button - Bottom Center */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[10005]">
            <button 
              onClick={() => window.location.reload()}
              data-liquid-surface
              className="liquid-ui group relative overflow-hidden rounded-xl px-8 py-3.5 cursor-pointer pointer-events-auto min-w-[220px]"
            >
              <span className="relative flex items-center justify-center gap-2 text-xs font-bold tracking-[0.3em] uppercase text-amber-200 group-hover:text-amber-100">
                [&nbsp;
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">RETRY_CONNECTION</span>
                &nbsp;]
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
