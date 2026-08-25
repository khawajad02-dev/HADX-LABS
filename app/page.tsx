import Link from "next/link";
import { headers } from "next/headers";

import type { Product } from "@/components/FeaturedShowcase";
import LiveInventoryHero from "@/components/LiveInventoryHero";
import StorefrontSearch from "@/components/StorefrontSearch";
import CatalogGrid from "@/components/CatalogGrid";
import { prisma } from "@/lib/prisma";
import { regionalPrice, type DisplayCurrency } from "@/lib/currency";
import { serializeProduct } from "@/lib/product-meta";

export const revalidate = 0;

function detectCurrency(): DisplayCurrency {
  const country = (headers().get("x-vercel-ip-country") || headers().get("cf-ipcountry") || "").toUpperCase();
  if (country === "PK") return "PKR";
  if (country === "IN") return "INR";
  return "USD";
}

export default async function HomePage() {
  const displayCurrency = detectCurrency();
  let products: Product[] = [];
  try {
    const rawProducts = await prisma.product.findMany({ where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" } });
    products = rawProducts.map((rawProduct) => {
      const product = serializeProduct(rawProduct);
      const price = regionalPrice(product.priceInCents, product.regionalPrices, displayCurrency);
      return {
        id: product.id,
        sku: product.sku,
        title: product.title,
        price,
        currency: displayCurrency,
        prices: product.regionalPrices,
        imageUrl: product.imageUrl ?? product.media[0]?.url ?? null,
        media: product.media,
        category: product.category ?? "Collection",
      };
    });
  } catch (error) {
    console.error("Database query error:", error);
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-transparent text-zinc-100 selection:bg-white selection:text-black font-sans antialiased">
      <div className="relative z-10">
        <nav className="liquid-panel fixed top-0 w-full z-50 border-b border-white/10 px-6 md:px-12 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /><h1 className="text-sm font-extrabold tracking-[0.35em] text-white uppercase">HADX <span className="text-zinc-500 font-light">LABS</span></h1></div>
          <div className="flex items-center gap-3 text-[11px] font-mono tracking-[0.2em] text-zinc-400 uppercase"><span className="hidden sm:inline text-zinc-500">{displayCurrency === "PKR" ? "Pakistan / PKR" : displayCurrency === "INR" ? "India / INR" : "Global / USD"}</span><StorefrontSearch /><Link href="/catalog#catalog" className="liquid-ui rounded-full px-4 py-2 hover:text-white transition-colors duration-300">COLLECTION</Link></div>
        </nav>

        <LiveInventoryHero initialProducts={products} initialCurrency={displayCurrency} />
        <CatalogGrid products={products} />

        <footer className="liquid-panel relative z-10 border-t border-white/10 py-12 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-mono tracking-[0.25em] text-zinc-500 uppercase"><div className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" /><span>© 2026 HADX LABS // ALL RIGHTS RESERVED</span></div><div className="flex items-center gap-8"><Link href="/catalog" className="liquid-ui rounded-full px-4 py-2 hover:text-amber-400 transition-colors">ARCHIVES</Link><span className="text-zinc-700">/</span><span className="text-zinc-400">{displayCurrency} PRICING ACTIVE</span></div></footer>
      </div>
    </main>
  );
}
