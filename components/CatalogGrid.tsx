"use client";

import { useState, useMemo, useEffect } from "react";

export interface Product {
  id: string;
  name?: string;
  title?: string;
  sku?: string;
  price: number | string;
  priceInCents?: number;
  currency?: "USD" | "PKR" | "INR";
  prices?: { USD?: number; PKR?: number; INR?: number };
  regionalPrices?: { USD?: number; PKR?: number; INR?: number };
  image_url?: string;
  imageUrl?: string | null;
  media?: Array<{ url: string; type: "image" | "video"; fileName?: string }>;
  category?: string;
  stock?: number;
}

interface CatalogGridProps {
  products?: Product[];
}

function normalizeSearch(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function editDistance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j];
      row[j] = a[i - 1] === b[j - 1] ? previous : Math.min(previous + 1, row[j - 1] + 1, current + 1);
      previous = current;
    }
  }
  return row[b.length];
}

function fuzzyMatches(product: Product, rawQuery: string) {
  const query = normalizeSearch(rawQuery);
  if (!query) return true;
  const fields = [product.title, product.name, product.sku, product.category].filter(Boolean).map((value) => normalizeSearch(String(value)));
  const haystack = fields.join(" ");
  if (haystack.includes(query)) return true;
  return query.split(" ").every((term) => fields.some((field) => field.split(" ").some((word) => word.startsWith(term) || editDistance(term, word) <= Math.max(1, Math.floor(term.length / 4)))));
}

function CatalogGrid({ products: initialProducts }: CatalogGridProps) {
  const [productList, setProductList] = useState<Product[]>(initialProducts || []);
  const [loading, setLoading] = useState<boolean>(!initialProducts || initialProducts.length === 0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high">("newest");
  const [displayCurrency, setDisplayCurrency] = useState<"USD" | "PKR" | "INR">(initialProducts?.[0]?.currency || "USD");

  // Auto-fetch if products are not passed via props
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProductList(initialProducts);
      setLoading(false);
      return;
    }

    async function loadCatalog() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (res.ok && data.products) {
          setProductList(data.products);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, [initialProducts]);

  const categories = useMemo(() => {
    const set = new Set(productList.map((p) => p.category).filter(Boolean) as string[]);
    return ["All", ...Array.from(set)];
  }, [productList]);

  const visibleProducts = useMemo(() => {
    let list = activeCategory === "All" ? productList : productList.filter((p) => p.category === activeCategory);
    list = list.filter((product) => fuzzyMatches(product, searchQuery));
    if (sortBy === "price-low") list = [...list].sort((a, b) => Number(a.prices?.[displayCurrency] ?? a.regionalPrices?.[displayCurrency] ?? a.price ?? (a.priceInCents || 0) / 100) - Number(b.prices?.[displayCurrency] ?? b.regionalPrices?.[displayCurrency] ?? b.price ?? (b.priceInCents || 0) / 100));
    if (sortBy === "price-high") list = [...list].sort((a, b) => Number(b.prices?.[displayCurrency] ?? b.regionalPrices?.[displayCurrency] ?? b.price ?? (b.priceInCents || 0) / 100) - Number(a.prices?.[displayCurrency] ?? a.regionalPrices?.[displayCurrency] ?? a.price ?? (a.priceInCents || 0) / 100));
    return list;
  }, [productList, activeCategory, searchQuery, sortBy, displayCurrency]);

  if (loading) {
    return (
      <section className="bg-transparent text-zinc-100 px-6 md:px-12 py-24 border-t border-white/10 text-center">
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest animate-pulse">
          [ LOADING HADX ARCHIVE DATA... ]
        </p>
      </section>
    );
  }

  return (
    <section className={`bg-transparent text-zinc-100 px-6 md:px-12 ${productList.length === 0 ? "pt-0" : "pt-20"} pb-24 border-t border-white/10 relative z-10`}>
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-zinc-500 block mb-3">Full_Catalog</span>
            <h2 className="text-3xl md:text-5xl font-extralight tracking-tight">Shop All</h2>
          </div>
          <button type="button" aria-label="Open HADX Smart Search" aria-expanded={searchOpen} onClick={() => setSearchOpen((open) => !open)} className="liquid-ui group w-14 h-14 rounded-2xl border border-amber-200/30 flex items-center justify-center text-amber-100 hover:border-amber-100 hover:shadow-gold-glow transition-all">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true" className="transition-transform duration-300 group-hover:rotate-12">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M16 16L22 22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M7 11h8M11 7v8" stroke="currentColor" strokeWidth="1" opacity=".45" />
              <circle cx="20.5" cy="5.5" r="2" fill="currentColor" opacity=".75" />
            </svg>
          </button>
        </div>
        {searchOpen ? <div className="mt-5 liquid-panel rounded-2xl border border-amber-200/25 p-3 flex items-center gap-3"><span className="text-amber-100 font-mono text-xs tracking-widest">⌕</span><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} autoFocus placeholder="Search title, SKU or category — typos are okay" className="w-full bg-transparent outline-none text-sm text-white placeholder:text-zinc-500" /><button type="button" onClick={() => setSearchQuery("")} className="text-zinc-500 hover:text-white text-xs font-mono">CLEAR</button></div> : null}
      </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10 border-b border-white/10 pb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`liquid-ui px-4 py-1.5 rounded-full text-[11px] font-mono tracking-wide uppercase border transition-colors ${
                activeCategory === cat
                  ? "border-amber-200 text-amber-100 shadow-gold-glow"
                  : "border-white/15 text-zinc-400 hover:border-white/40 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

          <div className="flex flex-wrap gap-2 items-center">
            {["USD", "PKR", "INR"].map((currency) => <button key={currency} onClick={() => setDisplayCurrency(currency as "USD" | "PKR" | "INR")} className={`liquid-ui px-3 py-1.5 rounded-full text-[10px] font-mono uppercase border ${displayCurrency === currency ? "border-amber-200 text-amber-100" : "border-white/15 text-zinc-400"}`}>{currency}</button>)}
          </div>

          <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="liquid-ui border border-white/15 rounded-full px-4 py-1.5 text-[11px] font-mono uppercase text-zinc-300 tracking-wide focus:outline-none focus:border-white/40"
        >
          <option value="newest">Newest</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
      </div>

      {visibleProducts.length === 0 ? (
        <div className="liquid-panel empty-state-liquid max-w-7xl mx-auto overflow-hidden border-dashed border-white/10 rounded-xl p-6 text-center">
          <span aria-hidden="true" className="empty-state-liquid__water-film" />
          <span aria-hidden="true" className="empty-state-liquid__water-drop empty-state-liquid__water-drop--a" />
          <span aria-hidden="true" className="empty-state-liquid__water-drop empty-state-liquid__water-drop--b" />
          <span aria-hidden="true" className="empty-state-liquid__water-drop empty-state-liquid__water-drop--c" />
          <span aria-hidden="true" className="empty-state-liquid__water-drop empty-state-liquid__water-drop--d" />
            <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">{searchQuery ? `No exact match — try a shorter spelling for “${searchQuery}”` : "No products in this category yet"}</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {visibleProducts.map((product) => {
            const displayTitle = product.title || product.name || "UNNAMED DROP";
            const displayMedia = product.media?.[0];
            const displayImg = displayMedia?.type === "image" ? displayMedia.url : product.imageUrl || product.image_url;
            const displayVideo = displayMedia?.type === "video" ? displayMedia.url : undefined;
            const currency = displayCurrency;
            const currencySymbol = currency === "PKR" ? "PKR" : currency === "INR" ? "₹" : "$";
            const displayPrice = product.prices?.[currency] ?? product.regionalPrices?.[currency] ?? product.price ?? (product.priceInCents || 0) / 100;

            return (
              <div
                key={product.id}
                className="liquid-panel group cursor-pointer overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="aspect-[4/5] bg-zinc-900/45 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                  {displayVideo ? (
                    <video src={displayVideo} aria-label={displayTitle} controls muted playsInline className="w-full h-full object-cover" />
                  ) : displayImg ? (
                    <img src={displayImg} alt={displayTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <span className="text-zinc-700 text-[10px] font-mono uppercase">no image</span>
                  )}
                </div>
                <h3 className="text-xs md:text-sm font-medium tracking-wide mb-1 group-hover:text-white transition-colors">
                  {displayTitle}
                </h3>
                <p className="text-xs font-mono text-zinc-400">
                  {currencySymbol} {Number(displayPrice).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default CatalogGrid;
