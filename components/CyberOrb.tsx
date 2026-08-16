"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import InstagramDMButton from "./InstagramDMButton";
import VaultButton from "./VaultButton";
import AudioToggle from "./AudioToggle";
import CartDrawer from "./CartDrawer";
import SecureDropButton from "./SecureDropButton";

export default function CyberOrb() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lightningPulse, setLightningPulse] = useState(0);
  const orbRef = useRef<HTMLDivElement>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);

  useEffect(() => {
    const handlePointerDownOutside = (event: PointerEvent) => {
      if (orbRef.current && !orbRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDownOutside);
    return () => document.removeEventListener("pointerdown", handlePointerDownOutside);
  }, []);

  const pulseLightning = () => setLightningPulse((current) => current + 1);

  const handleOrbPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pulseLightning();
  };

  return (
    <div ref={orbRef} className="fixed bottom-[11%] right-4 z-[9999] flex flex-col items-end gap-3 sm:bottom-[12%] sm:right-6">
      {/* The actions remain in the same vertical floating panel; only the surface language is shared. */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(6px)" }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="liquid-panel mb-1 flex flex-col items-end gap-3 rounded-2xl p-3 shadow-[0_0_35px_rgba(179,112,18,0.12)]"
          >
            <SecureDropButton label="EXECUTE ORDER" onClick={() => setIsCartOpen(true)} />
            <VaultButton />
            <InstagramDMButton label="INSTAGRAM DM" />
            <AudioToggle />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Original circular HUD footprint: a compact core surrounded by visible orbital rings. */}
      <div className="relative flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28">
        <span className="pointer-events-none absolute inset-3 rounded-full border border-amber-200/20 shadow-[0_0_22px_rgba(218,173,76,0.12)]" />
        <span className="pointer-events-none absolute inset-1 rounded-full border border-amber-300/25" />
        <span className="pointer-events-none absolute -inset-1 rounded-full border border-dashed border-amber-300/30 animate-[orb-spin-reverse_22s_linear_infinite]" />
        <span className="pointer-events-none absolute -inset-3 rounded-full border border-amber-400/15" />
        <span className="pointer-events-none absolute -inset-5 rounded-full border border-dotted border-amber-200/20 animate-[orb-spin_26s_linear_infinite]" />

        {/* Fixed HUD markers echo the old target/orbit diagram instead of a flat gold button. */}
        <span className="pointer-events-none absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-amber-200 shadow-[0_0_9px_rgba(255,222,139,0.9)]" />
        <span className="pointer-events-none absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-amber-400/80" />
        <span className="pointer-events-none absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-amber-200/85 shadow-[0_0_8px_rgba(255,222,139,0.75)]" />
        <span className="pointer-events-none absolute left-0 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-amber-400/70" />

        <motion.button
          type="button"
          aria-label={isOpen ? "Close CyberOrb menu" : "Open CyberOrb menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          onPointerDown={handleOrbPointerDown}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          className={`liquid-ui relative isolate flex h-[4.35rem] w-[4.35rem] items-center justify-center rounded-full border shadow-2xl sm:h-20 sm:w-20 ${
            isOpen
              ? "border-amber-200/75 shadow-[0_0_34px_rgba(217,158,51,0.42)]"
              : "border-amber-200/40 shadow-[0_0_26px_rgba(217,158,51,0.22)]"
          }`}
        >
          {/* Local water ripple that confirms a finger/mouse press directly on the Orb. */}
          <span className="pointer-events-none absolute inset-0 rounded-full border border-amber-100/25 animate-[orb-ripple_2.8s_ease-out_infinite]" />
          <span className="pointer-events-none absolute inset-2 rounded-full border border-amber-200/30" />
          <span className="pointer-events-none absolute inset-3 rounded-full border border-amber-300/15" />

          {/* Crosshair core and orbital micro-dots from the original HUD treatment. */}
          <span className="pointer-events-none absolute h-px w-12 bg-amber-200/25 sm:w-14" />
          <span className="pointer-events-none absolute h-12 w-px bg-amber-200/25 sm:h-14" />
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-amber-200/45 bg-transparent shadow-[inset_0_0_16px_rgba(217,158,51,0.26)] sm:h-11 sm:w-11">
            <span className="pointer-events-none absolute inset-1 rounded-full border border-amber-300/25" />
            <span className="pointer-events-none absolute -right-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-amber-200 shadow-[0_0_8px_rgba(255,222,139,0.95)]" />
            <span className="pointer-events-none absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-amber-400/90" />
            <span className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${isOpen ? "scale-125 bg-amber-200 shadow-[0_0_18px_rgba(255,222,139,1)]" : "bg-amber-100/80 shadow-[0_0_12px_rgba(255,222,139,0.7)]"}`} />
          </span>

          <AnimatePresence mode="sync">
            {lightningPulse > 0 && (
              <motion.svg
                key={lightningPulse}
                aria-hidden="true"
                viewBox="0 0 72 72"
                className="pointer-events-none absolute inset-1 h-[calc(100%-0.5rem)] w-[calc(100%-0.5rem)] overflow-visible"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.82, 0] }}
                transition={{ duration: 0.72, times: [0, 0.12, 0.38, 1], ease: "easeOut" }}
              >
                <motion.path
                  d="M38 7 L32 23 L39 28 L27 43 L34 46 L24 65"
                  fill="none"
                  stroke="#ffdf8b"
                  strokeWidth="1.35"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: [0, 1, 0.8, 0] }}
                  transition={{ duration: 0.62, times: [0, 0.25, 0.58, 1], ease: "easeOut" }}
                  style={{ filter: "drop-shadow(0 0 5px rgba(255, 202, 92, 0.95))" }}
                />
                <motion.path
                  d="M33 24 L22 18 M35 35 L49 30 M29 48 L16 55"
                  fill="none"
                  stroke="#d99e33"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: [0, 0.9, 0] }}
                  transition={{ duration: 0.56, delay: 0.08, ease: "easeOut" }}
                />
              </motion.svg>
            )}
          </AnimatePresence>

          <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full opacity-30">
            <span className="absolute left-0 top-0 h-px w-full bg-amber-100 animate-[scanline_3s_linear_infinite]" />
          </span>
        </motion.button>
      </div>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onIncrement={(id) => setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item)))}
        onDecrement={(id) => setCartItems((prev) => prev.map((item) => (item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item)))}
        onCheckout={() => (window.location.href = "/checkout")}
      />

      <style jsx global>{`
        @keyframes scanline {
          0% { top: 0%; opacity: 0; }
          18% { opacity: 1; }
          82% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes orb-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orb-spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes orb-ripple {
          0%, 62%, 100% { transform: scale(0.96); opacity: 0.15; }
          72% { transform: scale(1.04); opacity: 0.52; }
          84% { transform: scale(1.12); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[orb-spin_26s_linear_infinite\\],
          .animate-\\[orb-spin-reverse_22s_linear_infinite\\],
          .animate-\\[scanline_3s_linear_infinite\\],
          .animate-\\[orb-ripple_2.8s_ease-out_infinite\\] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
