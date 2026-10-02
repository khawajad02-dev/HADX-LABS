"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { currencySymbol, regionalPrice, type DisplayCurrency } from "@/lib/currency";

export type RelatedProduct = {
  id: string;
  sku: string;
  title: string;
  category: string | null;
  imageUrl: string | null;
  media: Array<{ url: string; type: "image" | "video" }>;
  priceInCents: number;
  regionalPrices: { USD?: number; PKR?: number; INR?: number };
};

type RelatedProductsProps = {
  products: RelatedProduct[];
  currency: DisplayCurrency;
};

export default function RelatedProducts({ products, currency }: RelatedProductsProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const scrollFrame = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const symbol = currencySymbol(currency);

  const syncActive = () => {
    if (scrollFrame.current !== null) return;
    scrollFrame.current = window.requestAnimationFrame(() => {
      scrollFrame.current = null;
      const rail = railRef.current;
      if (!rail) return;
      const cards = Array.from(rail.querySelectorAll<HTMLElement>("[data-radar-card]"));
      const center = rail.scrollLeft + rail.clientWidth / 2;
      let closest = 0;
      let distance = Number.POSITIVE_INFINITY;
      cards.forEach((card, index) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const nextDistance = Math.abs(cardCenter - center);
        if (nextDistance < distance) {
          distance = nextDistance;
          closest = index;
        }
      });
      setActiveIndex(closest);
    });
  };

  return (
    <section className="relative mx-auto mt-20 max-w-6xl border-t border-white/10 pt-10" aria-labelledby="related-products-title">
      <div className="mb-8 text-center">
        <p className="mb-3 text-[10px] font-mono uppercase tracking-[0.34em] text-amber-200/75">ARCHIVE_RELAY // CURATED PAIRINGS</p>
        <h2 id="related-products-title" className="text-3xl font-extralight tracking-tight text-white md:text-5xl">Complete the Silhouette.</h2>
        <p className="mx-auto mt-3 max-w-xl text-xs leading-6 text-zinc-500">A curated selection of garments crafted to complement this piece&apos;s aesthetic.</p>
      </div>

      {products.length ? (
        <div className="hadx-radar-dock relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/25 bg-[#0A0A0A] px-0 py-8 sm:py-12">
          <div className="hadx-radar-arc hadx-radar-arc-left" aria-hidden="true" />
          <div className="hadx-radar-arc hadx-radar-arc-right" aria-hidden="true" />
          <Link href={products[activeIndex] ? `/product/${products[activeIndex].sku}?currency=${currency}` : "#"} className="hadx-radar-core" aria-label={products[activeIndex] ? `Open ${products[activeIndex].title}` : "Open selected pairing"}><span>HADX</span></Link>
          <div ref={railRef} onScroll={syncActive} className="hadx-radar-rail flex snap-x snap-mandatory gap-4 overflow-x-auto px-[calc(50vw-8rem)] pb-3 pt-2 [scrollbar-width:none] sm:gap-6 sm:px-[calc(50%-10rem)]" aria-label="Curated related products">
            {products.map((product, index) => {
              const media = product.media.find((item) => item.type === "image") || product.media[0];
              const imageUrl = media?.type === "image" ? media.url : product.imageUrl;
              const price = regionalPrice(product.priceInCents, product.regionalPrices, currency);
              const focused = activeIndex === index;
              return (
                <Link
                  key={product.id}
                  href={`/product/${product.sku}?currency=${currency}`}
                  data-radar-card
                  aria-label={`Open related product ${product.title}`}
                  className={`hadx-radar-card liquid-ui hadx-tap-reactive hadx-premium-card group relative w-44 shrink-0 snap-center rounded-2xl border p-3 transition-all duration-500 sm:w-56 ${focused ? "is-focused border-[#D4AF37]/85 bg-white/[0.11] shadow-[0_0_38px_rgba(212,175,55,0.24)]" : "border-white/10 bg-black/55 opacity-75"}`}
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-[#D4AF37]/25 bg-zinc-950">
                    {imageUrl ? <img src={imageUrl} alt={product.title} loading="lazy" decoding="async" className="hadx-card-media h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-700">No signal</div>}
                    <span className="absolute left-3 top-3 rounded-full border border-[#D4AF37]/45 bg-black/65 px-2.5 py-1 text-[9px] font-mono tracking-[0.18em] text-[#D4AF37]">0{index + 1}</span>
                    <span className="hadx-signal-line" aria-hidden="true" />
                  </div>
                  <div className="px-1 pb-1 pt-3 text-left">
                    <p className="truncate text-sm font-medium tracking-wide text-zinc-100">{product.title}</p>
                    <p className="mt-1 truncate text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">{product.category || "Atelier"}</p>
                    <p className="mt-3 text-xs font-mono text-[#D4AF37]">{symbol} {price.toLocaleString()}</p>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2" aria-label="Radar dock position">
            {products.map((product, index) => <span key={product.id} className={`h-1 rounded-full transition-all duration-300 ${activeIndex === index ? "w-8 bg-[#D4AF37]" : "w-2 bg-white/25"}`} />)}
          </div>
          <p className="mt-5 text-center text-[9px] font-mono uppercase tracking-[0.28em] text-[#D4AF37]/65">HADX RELAY // PAIRING SIGNAL</p>
        </div>
      ) : (
        <div className="liquid-panel rounded-2xl border border-dashed border-white/15 p-8 text-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500">No curated pairing detected</p>
          <Link href="/#catalog" className="hadx-tap-reactive mt-4 inline-flex rounded-full px-3 py-2 text-xs text-amber-100 underline decoration-amber-200/30 underline-offset-4">Browse the full archive</Link>
        </div>
      )}
    </section>
  );
}
