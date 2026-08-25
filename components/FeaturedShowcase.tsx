"use client";

import Link from "next/link";
import { useState } from "react";

export type Product = {
  id: string;
  sku?: string;
  title: string;
  price: number;
  currency?: "USD" | "PKR" | "INR";
  prices?: { USD?: number; PKR?: number; INR?: number };
  imageUrl: string | null;
  media?: Array<{ url: string; type: "image" | "video"; fileName?: string }>;
  category?: string | null;
};

const BG_PALETTE = ["#1a1a2e", "#2e1a1a", "#16211c", "#1a2436", "#241a2e"];
function tintFor(id: string) {
  const hash = id.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return BG_PALETTE[hash % BG_PALETTE.length];
}

function money(product: Product) {
  const symbol = product.currency === "PKR" ? "PKR" : product.currency === "INR" ? "₹" : "$";
  return `${symbol} ${Number(product.price).toLocaleString()}`;
}

export default function FeaturedShowcase({ products = [] }: { products: Product[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  if (!products || products.length === 0) return null;
  const active = products[activeIndex] || products[0];
  const primaryMedia = active.media?.[0];

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden transition-colors duration-700 ease-out pt-24">
      <div className="absolute inset-0 pointer-events-none opacity-25 transition-colors duration-700" style={{ backgroundColor: tintFor(active.id) }} />
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none"><svg width="100%" height="100%" preserveAspectRatio="none"><defs><pattern id="topo" width="120" height="120" patternUnits="userSpaceOnUse"><path d="M0 60 Q30 20 60 60 T120 60" stroke="white" strokeWidth="1" fill="none" /></pattern></defs><rect width="100%" height="100%" fill="url(#topo)" /></svg></div>
      <div className="absolute top-28 left-6 md:left-12 z-10"><span className="text-[10px] font-mono tracking-[0.3em] uppercase text-white/40">Featured_Drop // {activeIndex + 1}/{products.length}</span></div>
      <div className="relative z-10 max-w-6xl w-full px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-12">
        <div className="flex items-center justify-center"><div key={active.id} data-liquid-surface className="liquid-panel relative w-72 h-80 md:w-96 md:h-[28rem] overflow-hidden rounded-2xl p-6 flex items-center justify-center transition-all duration-700 ease-out hover:scale-[1.02]">{primaryMedia?.type === "video" ? <video src={primaryMedia.url} controls playsInline className="w-full h-full object-cover rounded-xl" /> : primaryMedia?.url || active.imageUrl ? <img src={primaryMedia?.url || active.imageUrl || ""} alt={active.title} className="w-full h-full object-cover rounded-xl" /> : <span className="text-white/20 text-xs font-mono uppercase">[ NO_IMAGE_PREVIEW ]</span>}<div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-2 bg-black/40 blur-md rounded-full" /></div></div>
        <div className="text-white"><h2 className="text-3xl md:text-5xl font-extralight tracking-tight mb-4 leading-tight">{active.title}</h2><p className="text-sm text-white/50 font-light mb-8 max-w-sm">Limited print run. Direct from the HADX atelier — designed, printed, and shipped globally.</p><div className="flex items-center gap-6 mb-10"><span className="text-2xl font-mono font-semibold">{money(active)}</span><Link href={`/product/${active.sku || active.id}?currency=${active.currency || "USD"}`} className="liquid-ui px-6 py-2.5 text-amber-100 text-xs font-bold tracking-widest uppercase rounded-full">Buy Now</Link></div><div className="flex gap-3 overflow-x-auto pb-2">{products.slice(0, 6).map((product, index) => { const thumb = product.media?.[0]; return <button key={product.id} onClick={() => setActiveIndex(index)} className={`liquid-ui w-14 h-14 shrink-0 rounded-lg transition-all duration-300 flex items-center justify-center p-1 ${index === activeIndex ? "border-amber-200 shadow-gold-glow scale-105" : "border-hadx-border"}`}>{thumb?.type === "video" ? <video src={thumb.url} muted playsInline className="w-full h-full object-cover rounded-md" /> : thumb?.url || product.imageUrl ? <img src={thumb?.url || product.imageUrl || ""} alt={product.title} className="w-full h-full object-cover rounded-md" /> : <span className="text-[8px] font-mono text-white/30">{index + 1}</span>}</button>; })}</div></div>
      </div>
    </section>
  );
}
