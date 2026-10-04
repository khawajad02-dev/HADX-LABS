import Link from "next/link";
import { cookies, headers } from "next/headers";

import type { Product } from "@/components/FeaturedShowcase";
import LiveInventoryHero from "@/components/LiveInventoryHero";
import CatalogGrid from "@/components/CatalogGrid";
import { prisma } from "@/lib/prisma";
import { currencyFromCookieValue, currencyFromCountry, regionalPrice } from "@/lib/currency";
import { serializeProduct } from "@/lib/product-meta";

export const revalidate = 0;

export default async function HomePage() {
  const requestHeaders = headers();
  const displayCurrency = currencyFromCookieValue(cookies().get("hadx_currency")?.value) || currencyFromCountry(requestHeaders.get("x-hadx-geo-country") || requestHeaders.get("x-vercel-ip-country") || requestHeaders.get("cf-ipcountry"));
  let products: Product[] = [];
  try {
    const rawProducts = await prisma.product.findMany({ where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" }, take: 6 });
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
        availableSizes: product.availableSizes,
      };
    });
  } catch (error) {
    console.error("Database query error:", error);
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-transparent text-zinc-100 selection:bg-white selection:text-black font-sans antialiased">
      <div className="relative z-10">
        <LiveInventoryHero initialProducts={products} initialCurrency={displayCurrency} />
        <CatalogGrid products={products} initialCurrency={displayCurrency} variant="carousel" />

        <footer className="liquid-panel relative z-10 border-t border-white/10 py-12 px-6 md:px-12 flex flex-col gap-8 text-[10px] font-mono tracking-[0.25em] text-zinc-500 uppercase"><div className="flex flex-col md:flex-row items-center justify-between gap-6"><div className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" /><span>© 2026 HADX LABS // ALL RIGHTS RESERVED</span></div><div className="flex items-center gap-8"><Link href="/catalog" className="liquid-ui rounded-full px-4 py-2 hover:text-amber-400 transition-colors">ARCHIVES</Link><span className="text-zinc-700">/</span><span className="text-zinc-400">{displayCurrency} PRICING ACTIVE</span></div></div><nav className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-[9px] tracking-[0.18em] text-zinc-500" aria-label="HADX LABS information"><Link href="/about" className="hover:text-amber-100">ABOUT</Link><Link href="/collections" className="hover:text-amber-100">COLLECTIONS</Link><Link href="/custom-graphics" className="hover:text-amber-100">CUSTOM GRAPHICS</Link><Link href="/faq" className="hover:text-amber-100">FAQ</Link><Link href="/shipping" className="hover:text-amber-100">SHIPPING</Link><Link href="/returns" className="hover:text-amber-100">RETURNS</Link><Link href="/contact" className="hover:text-amber-100">CONTACT</Link><Link href="/privacy" className="hover:text-amber-100">PRIVACY</Link><Link href="/terms" className="hover:text-amber-100">TERMS</Link></nav></footer>
      </div>
    </main>
  );
}
