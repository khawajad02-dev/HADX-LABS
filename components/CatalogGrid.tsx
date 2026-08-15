"use client";

import { useState, useMemo, useEffect } from "react";

export interface Product {
  id: string;
  name?: string;
  title?: string;
  price: number | string;
  image_url?: string;
  imageUrl?: string;
  category?: string;
  stock?: number;
}

interface CatalogGridProps {
  products?: Product[];
}

export default function CatalogGrid({ products: initialProducts }: CatalogGridProps) {
  const [productList, setProductList] = useState<Product[]>(initialProducts || []);
  const [loading, setLoading] = useState<boolean>(!initialProducts || initialProducts.length === 0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high">("newest");

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
    if (sortBy === "price-low") list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
    if (sortBy === "price-high") list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
    return list;
  }, [productList, activeCategory, sortBy]);

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
    <section className="bg-transparent text-zinc-100 px-6 md:px-12 pt-20 pb-24 border-t border-white/10 relative z-10">
      <div className="max-w-7xl mx-auto mb-12">
        <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-zinc-500 block mb-3">
          Full_Catalog
        </span>
        <h2 className="text-3xl md:text-5xl font-extralight tracking-tight">Shop All</h2>
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
        <div className="liquid-panel max-w-7xl mx-auto border-dashed border-white/10 rounded-xl p-20 text-center">
          <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">
            No products in this category yet
          </p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {visibleProducts.map((product) => {
            const displayTitle = product.title || product.name || "UNNAMED DROP";
            const displayImg = product.imageUrl || product.image_url;

            return (
              <div
                key={product.id}
                className="liquid-panel group cursor-pointer rounded-2xl p-3 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="aspect-[4/5] bg-zinc-900/45 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                  {displayImg ? (
                    <img
                      src={displayImg}
                      alt={displayTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <span className="text-zinc-700 text-[10px] font-mono uppercase">no image</span>
                  )}
                </div>
                <h3 className="text-xs md:text-sm font-medium tracking-wide mb-1 group-hover:text-white transition-colors">
                  {displayTitle}
                </h3>
                <p className="text-xs font-mono text-zinc-400">
                  PKR {Number(product.price).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
