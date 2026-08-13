'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export type CheckoutState = 'payment_failed' | 'network_error' | 'timeout' | 'order_confirmed' | null;

interface CheckoutVideoModalProps {
  state: CheckoutState;
  onClose: () => void;
  onRetry?: () => void;
  orderId?: string;
}

const VIDEO_SOURCES: Record<NonNullable<CheckoutState>, string> = {
  payment_failed: '/videos/payment-failed.mp4',
  network_error: '/videos/network-error.mp4',
  timeout: '/videos/timeout.mp4',
  order_confirmed: '/videos/order-confirmed.mp4',
};

const STATE_CONFIG: Record<
  NonNullable<CheckoutState>,
  {
    primaryBtnText: string;
    secondaryBtnText?: string;
  }
> = {
  payment_failed: {
    primaryBtnText: 'Try Another Card',
    secondaryBtnText: 'Change Payment Method',
  },
  network_error: {
    primaryBtnText: 'Retry Connection',
    secondaryBtnText: 'Return to Shop',
  },
  timeout: {
    primaryBtnText: 'Refresh Cart',
    secondaryBtnText: 'Return to Shop',
  },
  order_confirmed: {
    primaryBtnText: 'Continue Shopping',
  },
};

export const CheckoutVideoModal: React.FC<CheckoutVideoModalProps> = ({
  state,
  onClose,
  onRetry,
  orderId,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (state && videoRef.current) {
      setIsVideoLoaded(false);
      videoRef.current.currentTime = 0;
      
      const playVideo = async () => {
        try {
          videoRef.current!.muted = false;
          await videoRef.current!.play();
          setIsMuted(false);
        } catch (err) {
          videoRef.current!.muted = true;
          setIsMuted(true);
          videoRef.current!.play().catch(() => {});
        }
      };
      playVideo();
    }
  }, [state]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  if (!mounted || !state) return null;

  const config = STATE_CONFIG[state];
  const videoSrc = VIDEO_SOURCES[state];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10007] bg-black flex flex-col items-center justify-center overflow-hidden w-screen h-screen"
      >
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          loop={state !== 'order_confirmed'}
          playsInline
          muted={isMuted}
          preload="auto"
          onLoadedData={() => setIsVideoLoaded(true)}
          onClick={toggleMute}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            isVideoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Mute Toggle Hint */}
        {isMuted && isVideoLoaded && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-8 left-1/2 -translate-x-1/2 z-[10009] pointer-events-none"
          >
            <span className="text-[10px] font-mono tracking-[0.3em] text-white/60 uppercase bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
              Tap for sound
            </span>
          </motion.div>
        )}

        {/* Themed Action Buttons */}
        <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 z-[10008] flex flex-col gap-4 w-full max-w-xs px-6">
          <button
            onClick={onRetry || onClose}
            className="
              group relative overflow-hidden rounded-xl px-8 py-4
              backdrop-blur-md bg-black/30
              border border-hadx-border/40
              transition-all duration-300 ease-out
              hover:border-hadx-border-glow hover:shadow-gold-glow-lg cursor-pointer
              active:scale-[0.95] pointer-events-auto
              w-full
            "
          >
            <span className="relative flex items-center justify-center gap-2 text-[10px] font-bold tracking-[0.25em] uppercase text-hadx-gold-light group-hover:text-hadx-gold-light">
              [&nbsp;
              <span className="bg-clip-text text-transparent bg-gold-gradient">{config.primaryBtnText}</span>
              &nbsp;]
            </span>
          </button>

          {config.secondaryBtnText && (
            <button
              onClick={onClose}
              className="
                group relative overflow-hidden rounded-xl px-8 py-3
                backdrop-blur-md bg-white/5
                border border-white/10
                transition-all duration-300 ease-out
                hover:border-white/30 cursor-pointer
                active:scale-[0.95] pointer-events-auto
                w-full
              "
            >
              <span className="relative flex items-center justify-center gap-2 text-[9px] font-medium tracking-[0.2em] uppercase text-zinc-400 group-hover:text-white">
                {config.secondaryBtnText}
              </span>
            </button>
          )}
          
          {state === 'order_confirmed' && orderId && (
            <div className="text-center pt-2">
              <span className="text-[9px] font-mono text-hadx-gold-light/60 tracking-widest uppercase">
                ORDER ID: {orderId}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
