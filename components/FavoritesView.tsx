"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Product } from "@/components/CatalogGrid";

type DisplayCurrency = "USD" | "PKR" | "INR";

function readFavoriteIds() {
  if (typeof window === "undefined") return [];
  const ids: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith("hadx-vault:") && window.localStorage.getItem(key) === "true") ids.push(key.slice("hadx-vault:".length));
  }
  return ids;
}

function productImage(product: Product) {
  const media = product.media?.[0];
  return media?.type === "image" ? media.url : product.imageUrl || product.image_url || null;
}

export default function FavoritesView() {
  const [currency, setCurrency] = useState<DisplayCurrency>("USD");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const syncIds = useCallback(() => setFavoriteIds(readFavoriteIds()), []);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("currency")?.toUpperCase();
    if (requested === "PKR" || requested === "INR" || requested === "USD") setCurrency(requested);
    syncIds();
    window.addEventListener("hadx:favorites", syncIds);
    window.addEventListener("storage", syncIds);
    return () => {
      window.removeEventListener("hadx:favorites", syncIds);
      window.removeEventListener("storage", syncIds);
    };
  }, [syncIds]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/products?currency=${currency}`, { headers: { Accept: "application/json" } })
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && data.success && Array.isArray(data.products)) setProducts(data.products as Product[]);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currency]);

  const savedProducts = useMemo(() => favoriteIds.map((id) => products.find((product) => product.id === id)).filter(Boolean) as Product[], [favoriteIds, products]);

  const removeFavorite = (productId: string) => {
    window.localStorage.removeItem(`hadx-vault:${productId}`);
    window.dispatchEvent(new Event("hadx:favorites"));
  };

  if (loading) return <section className="mx-auto max-w-6xl px-6 pb-24 pt-40 text-center text-[10px] font-mono uppercase tracking-[0.24em] text-white/45">Loading saved favorites...</section>;

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 pt-40">
      <div className="mb-10 flex flex-col gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="block text-[10px] font-mono uppercase tracking-[0.3em] text-amber-200/65">Your saved drops</span>
          <h1 className="mt-3 text-4xl font-light uppercase tracking-[-0.04em] sm:text-6xl">Favorites</h1>
          <p className="mt-4 max-w-xl text-xs leading-6 text-white/45">Products you save on this device appear here. Open a drop anytime to choose a size and continue to checkout.</p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{savedProducts.length} saved</span>
      </div>

      {savedProducts.length === 0 ? (
        <div className="liquid-panel rounded-2xl border-dashed p-10 text-center">
          <p className="text-sm uppercase tracking-[0.18em] text-white/70">No saved favorites yet</p>
          <p className="mt-3 text-xs text-white/40">Tap Add to Favorites on any product to see it here.</p>
          <Link href="/catalog#catalog" className="liquid-ui mt-7 inline-flex rounded-full px-6 py-3 text-[10px] font-mono uppercase tracking-[0.2em] text-amber-100 transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]">Browse drops</Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {savedProducts.map((product) => {
            const image = productImage(product);
            const price = product.prices?.[currency] ?? product.regionalPrices?.[currency] ?? product.price ?? 0;
            return (
              <article key={product.id} className="liquid-panel overflow-hidden rounded-2xl p-4">
                <Link href={`/product/${product.sku || product.id}?currency=${currency}`} className="group block">
                  <div className="aspect-[4/5] overflow-hidden rounded-xl bg-black/35">
                    {image ? <img src={image} alt={product.title || product.name || "Saved product"} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" /> : <div className="grid h-full place-items-center text-[10px] font-mono uppercase text-white/30">No preview</div>}
                  </div>
                  <div className="flex items-start justify-between gap-4 px-1 pt-4">
                    <h2 className="text-sm uppercase tracking-[0.08em] text-white/80">{product.title || product.name || "Saved drop"}</h2>
                    <span className="shrink-0 font-mono text-xs text-amber-100/75">{currency} {Number(price).toLocaleString()}</span>
                  </div>
                </Link>
                <button type="button" onClick={() => removeFavorite(product.id)} className="liquid-ui mt-4 w-full rounded-full bg-transparent px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white/55 transition-colors hover:text-amber-100">Remove from favorites</button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
