"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, type PanInfo } from "framer-motion";

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

function money(product: Product) {
  const symbol = product.currency === "PKR" ? "PKR" : product.currency === "INR" ? "₹" : "$";
  return `${symbol} ${Number(product.price).toLocaleString()}`;
}

function mediaFor(product: Product) {
  return product.media?.[0] || (product.imageUrl ? { url: product.imageUrl, type: "image" as const } : null);
}

function MediaPreview({ product, className }: { product: Product; className: string }) {
  const media = mediaFor(product);
  if (!media) return <span className="text-[9px] font-mono uppercase tracking-widest text-white/30">[ NO PREVIEW ]</span>;
  return media.type === "video" ? <video src={media.url} muted playsInline loop className={className} aria-label={product.title} /> : <img src={media.url} alt={product.title} className={className} />;
}

export default function FeaturedShowcase({ products = [] }: { products: Product[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = products[activeIndex] || products[0];

  const ringCards = useMemo(() => {
    if (!products.length) return [];
    return [-2, -1, 0, 1, 2].map((offset) => {
      const index = (activeIndex + offset + products.length) % products.length;
      return { product: products[index], offset };
    }).filter((item, index, all) => all.findIndex((candidate) => candidate.product.id === item.product.id) === index);
  }, [activeIndex, products]);

  if (!active) return null;

  const move = (direction: 1 | -1) => setActiveIndex((current) => (current + direction + products.length) % products.length);
  const onDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 36 || Math.abs(info.velocity.x) > 280) move(info.offset.x < 0 ? 1 : -1);
  };

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden transition-colors duration-700 ease-out pt-24 pb-12">
      <div className="absolute inset-0 pointer-events-none opacity-25 transition-colors duration-700 bg-[radial-gradient(circle_at_center,rgba(216,163,55,0.22),transparent_48%)]" />
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none"><svg width="100%" height="100%" preserveAspectRatio="none"><defs><pattern id="topo" width="120" height="120" patternUnits="userSpaceOnUse"><path d="M0 60 Q30 20 60 60 T120 60" stroke="white" strokeWidth="1" fill="none" /></pattern></defs><rect width="100%" height="100%" fill="url(#topo)" /></svg></div>
      <div className="absolute top-28 left-6 md:left-12 z-10"><span className="text-[10px] font-mono tracking-[0.3em] uppercase text-white/40">Featured_Drop {"//"} {activeIndex + 1}/{products.length} {"//"} SWIPE_RING</span></div>

      <div className="relative z-10 max-w-7xl w-full px-5 md:px-10 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-14 items-center py-12">
        <div className="relative min-h-[28rem] sm:min-h-[34rem] flex items-center justify-center" style={{ perspective: "1200px" }}>
          <motion.div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center gap-3 sm:gap-6" drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.12} onDragEnd={onDragEnd} whileTap={{ cursor: "grabbing" }}>
            {ringCards.map(({ product, offset }) => {
              const distance = Math.abs(offset);
              const isActive = offset === 0;
              const side = offset < 0 ? -1 : 1;
              const positionStyle = isActive
                ? { transform: "translateZ(80px) scale(1)", zIndex: 20, opacity: 1 }
                : { transform: `translateX(${side * (distance * 38)}px) translateZ(-${distance * 45}px) rotateY(${side * -24}deg) scale(${1 - distance * 0.13})`, zIndex: 20 - distance, opacity: distance === 1 ? 0.62 : 0.28 };
              return (
                <button type="button" key={`${product.id}-${offset}`} onClick={() => setActiveIndex(products.findIndex((candidate) => candidate.id === product.id))} aria-label={`Show ${product.title}`} className={`relative shrink-0 overflow-hidden rounded-2xl border border-amber-100/25 bg-black/50 shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition-[transform,opacity] duration-500 ${isActive ? "h-[25rem] w-[17rem] sm:h-[31rem] sm:w-[22rem]" : "h-[18rem] w-[10rem] sm:h-[23rem] sm:w-[14rem]"}`} style={positionStyle}>
                  <MediaPreview product={product} className="h-full w-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent px-3 pb-3 pt-12 text-left text-[10px] font-mono uppercase tracking-widest text-white/80">{product.title}</span>
                  {isActive ? <span className="absolute left-1/2 top-3 h-1 w-1 -translate-x-1/2 rounded-full bg-amber-200 shadow-[0_0_14px_rgba(255,220,130,0.9)]" /> : null}
                </button>
              );
            })}
          </motion.div>
          <div className="pointer-events-none absolute bottom-2 left-1/2 h-6 w-64 -translate-x-1/2 rounded-full bg-amber-300/20 blur-2xl" />
          <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-3">
            <button type="button" onClick={() => move(-1)} aria-label="Previous featured product" className="liquid-ui h-9 w-9 rounded-full text-amber-100">←</button>
            <span className="text-[9px] font-mono tracking-[0.25em] text-white/45">DRAG / SWIPE</span>
            <button type="button" onClick={() => move(1)} aria-label="Next featured product" className="liquid-ui h-9 w-9 rounded-full text-amber-100">→</button>
          </div>
        </div>

        <motion.div key={active.id} initial={{ opacity: 0, x: 34 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.42, ease: "easeOut" }} className="text-white">
          <span className="mb-3 block text-[10px] font-mono uppercase tracking-[0.3em] text-amber-100/55">{active.category || "Atelier"} {"//"} {active.sku || "SIGNATURE"}</span>
          <h2 className="mb-4 text-3xl leading-tight tracking-tight sm:text-5xl md:text-6xl font-extralight">{active.title}</h2>
          <p className="mb-8 max-w-sm text-sm font-light text-white/50">Limited print run. Direct from the HADX atelier — designed, printed, and shipped globally.</p>
          <div className="mb-10 flex flex-wrap items-center gap-5"><span className="text-2xl font-mono font-semibold">{money(active)}</span><Link href={`/product/${active.sku || active.id}?currency=${active.currency || "USD"}`} className="liquid-ui rounded-full px-6 py-3 text-xs font-bold tracking-widest uppercase text-amber-100">Buy Now</Link></div>
          <div className="flex flex-wrap gap-2">{products.map((product, index) => <button key={product.id} type="button" onClick={() => setActiveIndex(index)} aria-label={`Select ${product.title}`} className={`rounded-full border px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest transition-colors ${index === activeIndex ? "border-amber-100/70 text-amber-100" : "border-white/15 text-white/45 hover:border-amber-100/50 hover:text-white"}`}>{String(index + 1).padStart(2, "0")}</button>)}</div>
        </motion.div>
      </div>
    </section>
  );
}
