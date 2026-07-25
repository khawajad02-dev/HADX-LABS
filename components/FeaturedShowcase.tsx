"use client";

import { useState } from "react";

export type Product = {
  id: string;
  title: string;
  price: number;
  imageUrl: string | null;
  category?: string | null;
};

const BG_PALETTE = ["#1a1a2e", "#2e1a1a", "#16211c", "#1a2436", "#241a2e"];
function tintFor(id: string) {
  const hash = id.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return BG_PALETTE[hash % BG_PALETTE.length];
}

export default function FeaturedShowcase({ products = [] }: { products: Product[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!products || products.length === 0) return null;

  const active = products[activeIndex] || products[0];

  return (
    <section
      className="relative min-h-[85vh] flex items-center justify-center overflow-hidden transition-colors duration-700 ease-out pt-24"
      style={{ backgroundColor: tintFor(active.id) }}
    >
      {/* Topographic Background */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
        <svg width="100%" height="100%" preserveAspectRatio="none">
          <defs>
            <pattern id="topo" width="120" height="120" patternUnits="userSpaceOnUse">
              <path d="M0 60 Q30 20 60 60 T120 60" stroke="white" strokeWidth="1" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#topo)" />
        </svg>
      </div>

      {/* Section Label */}
      <div className="absolute top-28 left-6 md:left-12 z-10">
        <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-white/40">
          Featured_Drop // {activeIndex + 1}/{products.length}
        </span>
      </div>

      <div className="relative z-10 max-w-6xl w-full px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-12">
        {/* Main Product Display Card - Built-in Pure Glassmorphism */}
        <div className="flex items-center justify-center">
          <div
            key={active.id}
            className="relative w-72 h-80 md:w-96 md:h-[28rem] rounded-2xl p-3 flex items-center justify-center transition-all duration-700 ease-out hover:scale-[1.02]"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
            }}
          >
            {active.imageUrl ? (
              <img
                src={active.imageUrl}
                alt={active.title}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <span className="text-white/20 text-xs font-mono uppercase">
                [ NO_IMAGE_PREVIEW ]
              </span>
            )}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-2 bg-black/40 blur-md rounded-full" />
          </div>
        </div>

        {/* Copy + Controls */}
        <div className="text-white">
          <h2 className="text-3xl md:text-5xl font-extralight tracking-tight mb-4 leading-tight">
            {active.title}
          </h2>
          <p className="text-sm text-white/50 font-light mb-8 max-w-sm">
            Limited print run. Direct from the HADX atelier — designed, printed, and shipped locally.
          </p>

          <div className="flex items-center gap-6 mb-10">
            <span className="text-2xl font-mono font-semibold">
              PKR {Number(active.price).toLocaleString()}
            </span>
            <button className="px-6 py-2.5 bg-white text-black text-xs font-bold tracking-widest uppercase rounded-full hover:bg-white/90 transition-colors">
              Buy Now
            </button>
          </div>

          {/* Thumbnails with Glass Effect */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {products.slice(0, 6).map((p, i) => (
              <button
                key={p.id}
                onClick={() => setActiveIndex(i)}
                className={`w-14 h-14 shrink-0 rounded-lg transition-all duration-300 flex items-center justify-center p-1 ${
                  i === activeIndex
                    ? "border-white bg-white/20 scale-105"
                    : "border-white/10 bg-white/5 hover:border-white/40"
                }`}
                style={{
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover rounded-md" />
                ) : (
                  <span className="text-[8px] font-mono text-white/30">{i + 1}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
