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
  const [videoReady, setVideoReady] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (state && videoRef.current) {
      setVideoReady(false);
      videoRef.current.currentTime = 0;
      
      const playVideo = async () => {
        try {
          videoRef.current!.muted = false;
          await videoRef.current!.play();
        } catch (err) {
          videoRef.current!.muted = true;
          videoRef.current!.play().catch(() => {});
        }
      };
      playVideo();
    }
  }, [state]);

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
        <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
          
          {/* Logo Placeholder while loading */}
          <div className={`absolute inset-0 z-[10008] flex items-center justify-center bg-black transition-opacity duration-700 ${videoReady ? 'opacity-0' : 'opacity-100'}`}>
            <img src="/og-image.png" alt="HADX Logo" className="w-full h-full object-contain md:object-cover opacity-50" />
          </div>

          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            loop={state !== 'order_confirmed'}
            playsInline
            preload="auto"
            onCanPlayThrough={() => setVideoReady(true)}
            className="w-full h-full object-cover"
          />

          {/* Themed Action Buttons */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[10009] flex flex-col gap-4 w-full max-w-xs px-6">
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
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
