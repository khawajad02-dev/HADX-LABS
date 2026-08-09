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
    title: string;
    subtitle: string;
    primaryBtnText: string;
    secondaryBtnText?: string;
    accentColor: string;
    badgeText: string;
  }
> = {
  payment_failed: {
    title: 'PAYMENT FAILED',
    subtitle: 'Your transaction could not be processed. Please try another card.',
    primaryBtnText: 'Try Another Card',
    secondaryBtnText: 'Change Payment Method',
    accentColor: 'from-red-600/40 via-red-500/10 to-transparent',
    badgeText: 'TRANSACTION DECLINED',
  },
  network_error: {
    title: 'NETWORK DISCONNECTED',
    subtitle: 'Connection lost during checkout. Please check your internet connection.',
    primaryBtnText: 'Retry Connection',
    secondaryBtnText: 'Save Cart & Exit',
    accentColor: 'from-amber-500/40 via-amber-500/10 to-transparent',
    badgeText: 'CONNECTION ERROR',
  },
  timeout: {
    title: 'RESERVATION EXPIRED',
    subtitle: 'Your cart hold time ended. Items have been updated in your cart.',
    primaryBtnText: 'Refresh Cart',
    secondaryBtnText: 'Return to Shop',
    accentColor: 'from-orange-600/40 via-orange-500/10 to-transparent',
    badgeText: 'SESSION TIMEOUT',
  },
  order_confirmed: {
    title: 'ORDER CONFIRMED!',
    subtitle: 'Thank you for shopping with HADX LABS. Your order is on its way.',
    primaryBtnText: 'View Order Status',
    secondaryBtnText: 'Continue Shopping',
    accentColor: 'from-emerald-500/40 via-yellow-500/20 to-transparent',
    badgeText: 'SUCCESSFUL CHECKOUT',
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

  useEffect(() => {
    if (state) {
      setIsVideoLoaded(false);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [state]);

  if (!state) return null;

  const config = STATE_CONFIG[state];
  const videoSrc = VIDEO_SOURCES[state];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-all duration-500"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg rounded-3xl overflow-hidden bg-gradient-to-b from-[#18181b] to-[#09090b] border border-amber-500/30 shadow-[0_0_60px_rgba(212,175,55,0.15)] z-10"
        >
          <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${config.accentColor} pointer-events-none`} />

          <div className="relative flex items-center justify-between px-6 pt-5 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest text-amber-300 uppercase">
                HADX LABS // {config.badgeText}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          <div className="relative w-full aspect-[9/12] sm:aspect-square bg-black overflow-hidden group">
            {!isVideoLoaded && (
              <div className="absolute inset-0 z-10 bg-[#121214] flex flex-col items-center justify-center space-y-3 animate-pulse">
                <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin" />
                <span className="text-[10px] font-mono text-amber-500/60 uppercase tracking-wider">
                  Loading HADX Visual...
                </span>
              </div>
            )}

            <video
              ref={videoRef}
              src={videoSrc}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onLoadedData={() => setIsVideoLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-500 ${
                isVideoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />

            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent pointer-events-none" />
          </div>

          <div className="relative p-6 pt-2 space-y-5 text-center">
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 uppercase">
                {config.title}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 max-w-sm mx-auto leading-relaxed font-light">
                {config.subtitle}
              </p>
              {state === 'order_confirmed' && orderId && (
                <p className="text-xs font-mono text-amber-400/80 pt-1">
                  ORDER ID: <span className="text-white font-bold">{orderId}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2">
              <button
                onClick={onRetry || onClose}
                className="group relative w-full py-3.5 px-6 rounded-xl font-semibold text-sm tracking-wide text-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:brightness-110 shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all duration-300 active:scale-[0.98]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {config.primaryBtnText}
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </button>

              {config.secondaryBtnText && (
                <button
                  onClick={onClose}
                  className="w-full py-3 px-6 rounded-xl font-medium text-xs tracking-wider text-neutral-200 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/15 hover:border-amber-500/40 shadow-inner transition-all duration-300 active:scale-[0.98]"
                >
                  {config.secondaryBtnText}
                </button>
              )}
            </div>

            <div className="pt-1">
              <span className="text-[9px] font-mono tracking-widest text-neutral-500 uppercase">
                SECURE CHECKOUT BY HADX LABS DIGITAL SHIELD
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
