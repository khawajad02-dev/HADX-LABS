"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import FeaturedShowcase, { type Product } from "@/components/FeaturedShowcase";

type DisplayCurrency = "USD" | "PKR" | "INR";

function normalizeProducts(items: Array<Record<string, any>>, currency: DisplayCurrency): Product[] {
  return items.map((item) => ({
    id: item.id,
    sku: item.sku,
    title: item.title || item.name || "UNNAMED DROP",
    price: item.regionalPrices?.[currency] ?? item.price ?? Number(item.priceInCents || 0) / 100,
    currency,
    prices: item.regionalPrices || item.prices,
    imageUrl: item.imageUrl ?? item.media?.[0]?.url ?? null,
    media: item.media,
    category: item.category,
  }));
}

function EmptyInventory({ currency }: { currency: DisplayCurrency }) {
  return (
    <section className="pt-36 pb-8 px-6 text-center max-w-4xl mx-auto">
      <span className="text-xs font-mono tracking-[0.3em] uppercase text-zinc-500 block mb-3">[ Database Connected • No Live Inventory ]</span>
      <h2 className="text-3xl md:text-5xl font-light text-zinc-300">HADX ATELIER IS CURRENTLY EMPTY</h2>
      <p className="text-xs text-zinc-500 font-mono mt-4">Regional pricing is ready in {currency}. The next drop will display the correct local price.</p>
    </section>
  );
}

export default function LiveInventoryHero({ initialProducts, initialCurrency }: { initialProducts: Product[]; initialCurrency: DisplayCurrency }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const lastRefreshAt = useRef(0);

  const refreshInventory = useCallback(async () => {
    const now = Date.now();
    if (now - lastRefreshAt.current < 10000) return;
    lastRefreshAt.current = now;
    try {
      const response = await fetch(`/api/products?currency=${initialCurrency}&_=${now}`, { cache: "no-store", headers: { Accept: "application/json" } });
      const data = await response.json();
      if (response.ok && data.success && Array.isArray(data.products)) setProducts(normalizeProducts(data.products, initialCurrency));
    } catch (error) {
      console.warn("Live catalog refresh unavailable:", error);
    }
  }, [initialCurrency]);

  useEffect(() => {
    const refreshTimer = window.setTimeout(() => void refreshInventory(), 450);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshInventory();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(refreshTimer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshInventory]);

  return products.length > 0 ? <FeaturedShowcase products={products} initialCurrency={initialCurrency} /> : <EmptyInventory currency={initialCurrency} />;
}
