"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import InstagramDMButton from "./InstagramDMButton";
import VaultButton from "./VaultButton";
import AudioToggle from "./AudioToggle";
import CartDrawer from "./CartDrawer";
import SecureDropButton from "./SecureDropButton";

// --- Types ---
interface Particle {
  x: number;
  y: number;
  speed: number;
  opacity: number;
  size: number;
}

// --- CyberOrb Component ---
export default function CyberOrb() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);

  // Mock cart items (since no global store exists)
  const [cartItems, setCartItems] = useState<any[]>([]);

  // Handle outside click to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (orbRef.current && !orbRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Module 1: Snow Effect (Canvas2D) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles: Particle[] = Array.from({ length: 12 }, () => ({
      x: Math.random() * 64,
      y: Math.random() * 64,
      speed: 0.2 + Math.random() * 0.5,
      opacity: 0.1 + Math.random() * 0.4,
      size: 0.5 + Math.random() * 1.5,
    }));

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, 64, 64);
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";

      particles.forEach((p) => {
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        p.y += p.speed;
        if (p.y > 64) {
          p.y = -5;
          p.x = Math.random() * 64;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // --- Arc Button Distribution ---
  const buttons = useMemo(() => [
    {
      id: "cart",
      component: (
        <SecureDropButton 
          label="EXECUTE ORDER" 
          onClick={() => setIsCartOpen(true)} 
        />
      ),
      angle: 90,
      distance: 100,
    },
    {
      id: "vault",
      component: <VaultButton />,
      angle: 60,
      distance: 100,
    },
    {
      id: "audio",
      component: <AudioToggle />,
      angle: 30,
      distance: 100,
    },
    {
      id: "instagram",
      component: <InstagramDMButton label="DM" />,
      angle: 0,
      distance: 100,
    },
  ], []);

  const getPosition = (angle: number, distance: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: -Math.cos(rad) * distance,
      y: -Math.sin(rad) * distance,
    };
  };

  return (
    <div ref={orbRef} className="fixed bottom-6 right-6 z-50 flex items-center justify-center">
      {/* Radial Buttons (Always mounted for state persistence) */}
      <div className="absolute pointer-events-none">
        {buttons.map((btn, index) => {
          const pos = getPosition(btn.angle, btn.distance);
          return (
            <motion.div
              key={btn.id}
              initial={false}
              animate={{ 
                x: isOpen ? pos.x : 0, 
                y: isOpen ? pos.y : 0, 
                opacity: isOpen ? 1 : 0, 
                scale: isOpen ? 1 : 0.5,
                pointerEvents: isOpen ? "auto" : "none" as any
              }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20,
                delay: isOpen ? index * 0.05 : 0 
              }}
              className="absolute flex items-center justify-center"
              style={{ 
                width: "max-content",
                height: "max-content"
              }}
            >
              {btn.component}
            </motion.div>
          );
        })}
      </div>

      {/* Main Orb Trigger */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        animate={{ 
          rotate: isOpen ? 360 : 0,
          boxShadow: isOpen 
            ? "0 0 25px rgba(245, 158, 11, 0.5)" 
            : "0 0 15px rgba(245, 158, 11, 0.2)"
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className={`
          relative w-16 h-16 rounded-full flex items-center justify-center
          backdrop-blur-md border transition-colors duration-300
          ${isOpen ? "bg-amber-500/20 border-amber-500" : "bg-black/50 border-amber-500/30"}
        `}
      >
        {/* Snow Canvas */}
        <canvas
          ref={canvasRef}
          width={64}
          height={64}
          className="absolute inset-0 rounded-full pointer-events-none"
        />

        {/* Golden Lightning Flash & Pulse */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <div className="lightning-flash-anim absolute inset-0 bg-amber-500/10 opacity-0" />
          <svg className="w-full h-full" viewBox="0 0 64 64">
            <path
              className="lightning-path-anim"
              d="M32 10 L36 28 L28 36 L32 54"
              stroke="#F59E0B"
              strokeWidth="1.5"
              fill="none"
              strokeDasharray="100"
              strokeDashoffset="100"
            />
          </svg>
        </div>

        {/* Center Icon/Indicator */}
        <div className={`
          w-2 h-2 rounded-full transition-all duration-300
          ${isOpen ? "bg-amber-400 scale-125" : "bg-amber-500/40"}
        `} />
      </motion.button>

      {/* Cart Drawer (Independent state) */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onIncrement={(id) => setCartItems(prev => prev.map(i => i.id === id ? {...i, quantity: i.quantity + 1} : i))}
        onDecrement={(id) => setCartItems(prev => prev.map(i => i.id === id && i.quantity > 1 ? {...i, quantity: i.quantity - 1} : i))}
        onCheckout={() => window.location.href = "/checkout"}
      />

      <style>{`
        @keyframes flash {
          0%, 88%, 92%, 100% { opacity: 0; }
          90% { opacity: 1; }
        }
        @keyframes strike {
          0%, 88% { stroke-dashoffset: 100; opacity: 0; }
          90% { stroke-dashoffset: 0; opacity: 1; }
          92%, 100% { stroke-dashoffset: -100; opacity: 0; }
        }
        .lightning-flash-anim {
          animation: flash 5s infinite;
        }
        .lightning-path-anim {
          animation: strike 5s infinite;
        }
      `}</style>
    </div>
  );
}
