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
      {/* Floating Vertical Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="flex flex-col items-end gap-3 mb-2"
          >
            <SecureDropButton label="EXECUTE ORDER" onClick={() => setIsCartOpen(true)} />
            <VaultButton />
            <InstagramDMButton label="INSTAGRAM DM" />
            <AudioToggle />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Trigger Orb */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          w-14 h-14 rounded-full flex items-center justify-center
          backdrop-blur-xl border shadow-2xl transition-all duration-300
          ${isOpen ? "bg-amber-500/20 border-amber-500" : "bg-black/60 border-white/10"}
        `}
      >
        <div className={`w-2 h-2 rounded-full transition-all duration-500 ${isOpen ? "bg-amber-400 scale-150 shadow-[0_0_15px_rgba(251,191,36,0.8)]" : "bg-white/40"}`} />
        
        {/* Subtle Scanline Effect */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none opacity-20">
          <div className="w-full h-[1px] bg-white absolute top-0 animate-[scanline_3s_linear_infinite]" />
        </div>
      </motion.button>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onIncrement={(id) => setCartItems(prev => prev.map(i => i.id === id ? {...i, quantity: i.quantity + 1} : i))}
        onDecrement={(id) => setCartItems(prev => prev.map(i => i.id === id && i.quantity > 1 ? {...i, quantity: i.quantity - 1} : i))}
        onCheckout={() => window.location.href = "/checkout"}
      />

      <style jsx global>{`
        @keyframes scanline {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}
