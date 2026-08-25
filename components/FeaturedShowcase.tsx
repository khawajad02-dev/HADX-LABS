"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
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
  availableSizes?: string[];
};

type StageTone = {
  accent: string;
  glow: string;
  background: string;
};

const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"];
const STAGE_TONES: StageTone[] = [
  { accent: "#e6b65b", glow: "rgba(212, 139, 30, 0.35)", background: "#080603" },
  { accent: "#b3c78f", glow: "rgba(109, 143, 75, 0.3)", background: "#050805" },
  { accent: "#c5a5dc", glow: "rgba(146, 96, 173, 0.28)", background: "#08050b" },
  { accent: "#8ec9de", glow: "rgba(63, 135, 164, 0.28)", background: "#04080b" },
];

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
  return media.type === "video" ? (
    <video src={media.url} muted playsInline loop autoPlay className={className} aria-label={product.title} />
  ) : (
    <img src={media.url} alt={product.title} className={className} />
  );
}

function productPath(product: Product, currency: string | undefined, size?: string) {
  const params = new URLSearchParams({ currency: currency || "USD" });
  if (size) params.set("size", size);
  return `/product/${product.sku || product.id}?${params.toString()}`;
}

export default function FeaturedShowcase({ products = [] }: { products: Product[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const active = products[activeIndex] || products[0];
  const tone = STAGE_TONES[activeIndex % STAGE_TONES.length];
  const sizes = active?.availableSizes?.length ? active.availableSizes : DEFAULT_SIZES;

  const ringCards = useMemo(() => {
    if (!products.length) return [];
    const unique = new Map<string, { product: Product; offset: number }>();
    for (const offset of [-2, -1, 0, 1, 2]) {
      const index = (activeIndex + offset + products.length) % products.length;
      const product = products[index];
      const existing = unique.get(product.id);
      if (!existing || Math.abs(offset) < Math.abs(existing.offset) || offset === 0) unique.set(product.id, { product, offset });
    }
    return Array.from(unique.values()).sort((left, right) => left.offset - right.offset);
  }, [activeIndex, products]);

  if (!active) return null;

  const move = (direction: 1 | -1) => {
    setSelectedSize("");
    setActiveIndex((current) => (current + direction + products.length) % products.length);
  };

  const onDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 36 || Math.abs(info.velocity.x) > 280) move(info.offset.x < 0 ? 1 : -1);
  };

  const stageStyle = {
    "--stage-accent": tone.accent,
    "--stage-glow": tone.glow,
    backgroundColor: tone.background,
    backgroundImage: `radial-gradient(circle at 50% 44%, ${tone.glow}, transparent 34%), radial-gradient(circle at 14% 86%, rgba(255,255,255,0.04), transparent 30%), linear-gradient(135deg, ${tone.background}, #020202 72%)`,
  } as CSSProperties;

  return (
    <section className="relative isolate min-h-[calc(100svh-4.5rem)] overflow-hidden pt-24 pb-10 text-white transition-[background-color,background-image] duration-700 ease-out" style={stageStyle}>
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="pointer-events-none absolute left-1/2 top-[43%] h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 opacity-80 shadow-[0_0_100px_var(--stage-glow)] sm:h-[38rem] sm:w-[38rem]" />
      <div className="pointer-events-none absolute left-1/2 top-[43%] h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color:var(--stage-accent)]/20 opacity-90 sm:h-[26rem] sm:w-[26rem]" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-8 px-5 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 text-[9px] font-mono uppercase tracking-[0.28em] text-white/55">
          <span className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full border border-[color:var(--stage-accent)]/60 text-[color:var(--stage-accent)]">H</span><span>HADX LABS / ATELIER</span></span>
          <span className="hidden gap-5 sm:flex"><span className="rounded-full bg-white px-3 py-1 text-black">Products</span><span>About</span><span>Category</span><span>Contact</span></span>
          <span className="text-[color:var(--stage-accent)]">Drop {String(activeIndex + 1).padStart(2, "0")} / {String(products.length).padStart(2, "0")}</span>
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-[minmax(210px,0.78fr)_minmax(420px,1.35fr)_minmax(240px,0.82fr)] lg:gap-10">
          <motion.div key={`${active.id}-copy`} initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }} className="order-2 max-w-sm lg:order-1">
            <span className="mb-5 block text-[9px] font-mono uppercase tracking-[0.34em] text-[color:var(--stage-accent)]/75">Luxury Digital / Limited Edition</span>
            <h2 className="max-w-xs text-4xl font-light uppercase leading-[0.94] tracking-[-0.05em] sm:text-5xl">Streetwear<br /><span className="text-white/55">Atelier</span></h2>
            <p className="mt-6 max-w-[18rem] text-xs leading-6 text-white/50">A collectible garment system for people who move with intent. Heavyweight fabric, custom graphics, and a limited HADX production run.</p>
            <Link href="#catalog" className="mt-7 inline-flex items-center gap-3 text-[9px] font-mono uppercase tracking-[0.26em] text-white/70 transition-colors hover:text-white"><span className="grid h-8 w-8 place-items-center rounded-full border border-white/30">↘</span> Scroll to explore</Link>
          </motion.div>

          <div className="order-1 flex min-h-[25rem] items-center justify-center sm:min-h-[32rem] lg:order-2" style={{ perspective: "1400px" }}>
            <motion.div className="relative flex w-full items-center justify-center gap-2 sm:gap-5" drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.14} onDragEnd={onDragEnd} whileTap={{ cursor: "grabbing" }} style={{ transformStyle: "preserve-3d" }}>
              {ringCards.map(({ product, offset }) => {
                const distance = Math.abs(offset);
                const isActive = offset === 0;
                const side = offset < 0 ? -1 : 1;
                return (
                  <motion.button
                    type="button"
                    key={`${product.id}-${offset}`}
                    onClick={() => { setSelectedSize(""); setActiveIndex(products.findIndex((candidate) => candidate.id === product.id)); }}
                    aria-label={`Show ${product.title}`}
                    className={`relative shrink-0 overflow-hidden rounded-[1.6rem] border text-left shadow-2xl transition-[height,width] duration-500 ${isActive ? "h-[25rem] w-[16rem] border-white/35 bg-black/70 sm:h-[31rem] sm:w-[21rem]" : "h-[18rem] w-[8rem] border-white/15 bg-black/45 sm:h-[23rem] sm:w-[12.5rem]"}`}
                    style={{
                      transform: isActive ? "translateZ(100px) scale(1)" : `translateX(${side * distance * 22}px) translateZ(-${distance * 55}px) rotateY(${side * -22}deg) scale(${1 - distance * 0.12})`,
                      zIndex: 20 - distance,
                      opacity: isActive ? 1 : distance === 1 ? 0.62 : 0.27,
                      transformStyle: "preserve-3d",
                    }}
                  >
                    <MediaPreview product={product} className="h-full w-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/45 to-transparent px-4 pb-4 pt-20 text-[9px] font-mono uppercase tracking-[0.18em] text-white/85">{product.title}</span>
                    {isActive ? <span className="absolute left-1/2 top-5 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[color:var(--stage-accent)] shadow-[0_0_18px_var(--stage-accent)]" /> : null}
                  </motion.button>
                );
              })}
            </motion.div>
            <div className="pointer-events-none absolute bottom-4 h-8 w-64 rounded-full bg-[color:var(--stage-glow)] blur-2xl" />
            <div className="pointer-events-none absolute bottom-1 h-3 w-44 rounded-[50%] border border-[color:var(--stage-accent)]/40 bg-black/60 shadow-[0_0_30px_var(--stage-glow)]" />
          </div>

          <motion.aside key={`${active.id}-panel`} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }} className="order-3 rounded-2xl border border-white/15 bg-black/35 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-md lg:p-6">
            <div className="flex items-start justify-between gap-4"><span className="text-[9px] font-mono uppercase tracking-[0.24em] text-[color:var(--stage-accent)]/80">Limited Drop</span><span className="text-[9px] font-mono text-white/35">{active.sku || "SIGNATURE"}</span></div>
            <h3 className="mt-4 text-2xl font-light uppercase leading-tight tracking-[-0.035em]">{active.title}</h3>
            <div className="mt-5 flex items-end justify-between gap-4"><span className="font-mono text-lg font-semibold text-white">{money(active)}</span><span className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/35">Worldwide shipping</span></div>
            <div className="mt-6"><div className="mb-3 flex items-center justify-between"><span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/45">Choose size</span><span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[color:var(--stage-accent)]">{selectedSize || "Required"}</span></div><div className="grid grid-cols-5 gap-1.5">{sizes.map((size) => <button key={size} type="button" onClick={() => setSelectedSize(size)} aria-pressed={selectedSize === size} className={`rounded-md border px-2 py-2 text-[9px] font-mono transition-colors ${selectedSize === size ? "border-white bg-white text-black" : "border-white/20 text-white/65 hover:border-white/60 hover:text-white"}`}>{size}</button>)}</div></div>
            <Link href={productPath(active, active.currency, selectedSize || undefined)} className="liquid-ui mt-6 flex w-full items-center justify-between rounded-full bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"><span>{selectedSize ? "Buy now" : "View drop"}</span><span>↗</span></Link>
            <div className="mt-5 divide-y divide-white/10 border-t border-white/10 text-[9px] font-mono uppercase tracking-[0.18em] text-white/45"><div className="flex items-center justify-between py-3"><span>Edition</span><span className="text-white/75">Limited / {activeIndex + 1}</span></div><div className="flex items-center justify-between py-3"><span>Media</span><span className="text-white/75">{active.media?.length || 1} assets</span></div></div>
          </motion.aside>
        </div>

        <div className="flex flex-col items-center justify-between gap-5 border-t border-white/10 pt-5 sm:flex-row">
          <div className="flex items-center gap-3 text-[9px] font-mono uppercase tracking-[0.22em] text-white/45"><button type="button" onClick={() => move(-1)} aria-label="Previous featured product" className="liquid-ui grid h-9 w-9 place-items-center rounded-full text-[color:var(--stage-accent)]">←</button><span>Swipe / drag to rotate</span><button type="button" onClick={() => move(1)} aria-label="Next featured product" className="liquid-ui grid h-9 w-9 place-items-center rounded-full text-[color:var(--stage-accent)]">→</button></div>
          <div className="flex flex-wrap items-center justify-center gap-2">{products.map((product, index) => <button key={product.id} type="button" onClick={() => { setSelectedSize(""); setActiveIndex(index); }} aria-label={`Select ${product.title}`} className={`h-1.5 rounded-full transition-all duration-300 ${index === activeIndex ? "w-10 bg-[color:var(--stage-accent)]" : "w-2 bg-white/25 hover:bg-white/60"}`} />)}</div>
          <div className="grid grid-cols-3 gap-3 text-[8px] font-mono uppercase tracking-[0.18em] text-white/40 sm:gap-5"><span>Premium quality</span><span>Global shipping</span><span>Secure checkout</span></div>
        </div>
      </div>
    </section>
  );
}
