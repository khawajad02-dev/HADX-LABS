"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import InstagramDMButton from "./InstagramDMButton";
import VaultButton from "./VaultButton";
import AudioToggle from "./AudioToggle";
import CartDrawer from "./CartDrawer";
import SecureDropButton from "./SecureDropButton";

export default function CyberOrb() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const orbRef = useRef<HTMLDivElement>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (orbRef.current && !orbRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={orbRef} className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4">
      {/* Floating Vertical Menu: existing actions, now with the same restrained HUD treatment. */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(6px)" }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="flex flex-col items-end gap-3 mb-2 rounded-2xl border border-amber-400/20 bg-black/50 p-3 shadow-[0_0_35px_rgba(179,112,18,0.12)] backdrop-blur-xl"
          >
            <SecureDropButton label="EXECUTE ORDER" onClick={() => setIsCartOpen(true)} />
            <VaultButton />
            <InstagramDMButton label="INSTAGRAM DM" />
            <AudioToggle />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Trigger Orb: same footprint and behavior, with a restrained HUD ring system. */}
      <motion.button
        type="button"
        aria-label={isOpen ? "Close CyberOrb menu" : "Open CyberOrb menu"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative isolate w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-xl border shadow-2xl transition-all duration-300 ${
          isOpen
            ? "bg-amber-500/20 border-amber-400 shadow-[0_0_30px_rgba(217,158,51,0.35)]"
            : "bg-black/75 border-amber-200/30 shadow-[0_0_22px_rgba(217,158,51,0.18)]"
        }`}
      >
        {/* Thin sci-fi rings echoing the approved ambient mockup. */}
        <span className="pointer-events-none absolute -inset-2 rounded-full border border-amber-300/15" />
        <span className="pointer-events-none absolute -inset-4 rounded-full border border-amber-400/10" />
        <span className="pointer-events-none absolute -inset-[1.15rem] rounded-full border border-dashed border-amber-300/20 animate-[orb-spin_18s_linear_infinite]" />
        <span className="pointer-events-none absolute -top-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
        <span className="pointer-events-none absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-amber-500/80" />

        <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-amber-200/40 bg-black/55 shadow-[inset_0_0_12px_rgba(217,158,51,0.22)]">
          <span className={`h-2 w-2 rounded-full transition-all duration-500 ${isOpen ? "scale-150 bg-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.95)]" : "bg-amber-100/70 shadow-[0_0_9px_rgba(251,191,36,0.45)]"}`} />
          <span className="pointer-events-none absolute inset-1.5 rounded-full border border-amber-300/20" />
        </span>

        {/* Subtle scanline, retained from the original orb. */}
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full opacity-25">
          <span className="absolute top-0 h-px w-full bg-amber-100 animate-[scanline_3s_linear_infinite]" />
        </span>
      </motion.button>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onIncrement={(id) => setCartItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i)))}
        onDecrement={(id) => setCartItems((prev) => prev.map((i) => i.id === id && i.quantity > 1 ? { ...i, quantity: i.quantity - 1 } : i))}
        onCheckout={() => window.location.href = "/checkout"}
      />

      <style jsx global>{`
        @keyframes scanline {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        @keyframes orb-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[orb-spin_18s_linear_infinite\\],
          .animate-\\[scanline_3s_linear_infinite\\] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
