"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductData {
  id: string;
  name: string;
  price: string;
  image: string;
  brandColor: string;
}

interface ViewportProps {
  activeProduct: ProductData;
  isInitialHero?: boolean;
}

export default function Hadx3dViewport({ activeProduct, isInitialHero = true }: ViewportProps) {
  return (
    <div
      className="relative w-full h-[55vh] rounded-3xl overflow-hidden flex items-center justify-center bg-[#05020c]"
      style={{ perspective: 1200, transformStyle: "preserve-3d" }}
    >
      {/* Dynamic Background Aura Transition Engine */}
      <div className={`absolute inset-0 bg-gradient-to-b ${activeProduct.brandColor} opacity-40 transition-all duration-700 ease-in-out z-0`} />

      {/* 🧭 Top Navigation Row */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
        <Link href="/" className="text-[10px] tracking-[0.4em] font-black text-[#d4af37] select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#d4af37] rounded">
          HADX LABS
        </Link>
        <div className="flex gap-4 text-[10px] tracking-widest text-gray-400 font-medium">
          <Link href="/products" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded px-1">PRODUCTS</Link>
          <Link href="/series" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded px-1">SERIES</Link>
          <Link href="/contact" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded px-1">CONTACT</Link>
        </div>
      </div>

      {/* Main Core Catwalk Stage */}
      <div className="relative w-full h-full flex items-center justify-center z-10 p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeProduct.id}
            initial={{ scale: 0.3, opacity: 0, y: 30 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: [0, -8, 8, 0],
              rotateY: [0, 5, -5, 0],
              transition: {
                scale: { type: "spring", stiffness: 70, damping: 14 },
                y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
                rotateY: { repeat: Infinity, duration: 6, ease: "easeInOut" }
              }
            }}
            exit={{ scale: 0.4, opacity: 0, y: -20, transition: { duration: 0.3 } }}
            style={{ transformStyle: "preserve-3d" }}
            className="relative w-72 h-72 flex items-center justify-center"
          >
            <div
              aria-hidden="true"
              className="absolute bottom-[-10px] w-48 h-4 bg-black/40 blur-xl rounded-full mix-blend-multiply pointer-events-none"
            />

            <Image
              src={activeProduct.image}
              alt={activeProduct.name}
              fill
              priority={isInitialHero}
              sizes="(max-width: 768px) 100vw, 288px"
              className="object-contain filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Left Utility Information */}
      <div className="absolute left-6 bottom-8 z-20 max-w-[200px]">
        <h2 className="text-2xl font-black uppercase leading-none tracking-tight text-white mb-2">
          Wear Your Style With Comfort
        </h2>
        <p className="text-[9px] text-gray-400 leading-relaxed">
          High-density custom production garment engineered for premium utility.
        </p>
      </div>

      {/* Right Pricing & Direct Interactive Buy Trigger */}
      <div className="absolute right-6 bottom-8 z-20 flex flex-col items-end gap-2">
        <span className="text-xl font-mono font-bold text-white tracking-tight">
          {activeProduct.price}
        </span>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          aria-label={`Buy ${activeProduct.name} instantly`}
          className="bg-white text-black text-[9px] font-black uppercase px-5 py-2.5 rounded-full shadow-[0_4px_15px_rgba(255,255,255,0.1)] tracking-widest hover:bg-gray-200 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
        >
          Buy Now
        </motion.button>
      </div>
    </div>
  );
}
