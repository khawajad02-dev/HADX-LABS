import Link from "next/link";
import FeaturedShowcase, { Product } from "@/components/FeaturedShowcase";
import CatalogGrid from "@/components/CatalogGrid";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

export default async function HomePage() {
  let products: Product[] = [];
  try {
    const rawProducts = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    products = rawProducts.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.priceInCents / 100,
      imageUrl: p.imageUrl ?? null,
      category: p.category ?? "Collection",
    }));
  } catch (error) {
    console.error("Database query error:", error);
  }

  return (
    <main className="min-h-screen bg-[#070707] text-zinc-100 selection:bg-white selection:text-black font-sans antialiased">
      {/* Floating Glass Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/60 border-b border-white/10 px-6 md:px-12 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <h1 className="text-sm font-extrabold tracking-[0.35em] text-white uppercase">
            HADX <span className="text-zinc-500 font-light">LABS</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-8 text-[11px] font-mono tracking-[0.2em] text-zinc-400 uppercase">
          <Link href="/catalog" className="hover:text-white transition-colors duration-300">COLLECTION</Link>
          <Link href="/admin" className="hover:text-white transition-colors duration-300 text-zinc-500 hover:text-zinc-200">ADMIN</Link>
        </div>
      </nav>

      {/* Hero Glassmorphic Featured Showcase */}
      {products.length > 0 ? (
        <FeaturedShowcase products={products} />
      ) : (
        <section className="pt-36 pb-20 px-6 text-center max-w-4xl mx-auto">
          <span className="text-xs font-mono tracking-[0.3em] uppercase text-zinc-500 block mb-3">
            [ Database Connected • No Live Inventory ]
          </span>
          <h2 className="text-3xl md:text-5xl font-light text-zinc-300">
            HADX ATELIER IS CURRENTLY EMPTY
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-4">
            Visit <Link href="/admin" className="underline text-white">/admin</Link> to post products.
          </p>
        </section>
      )}

      {/* Full Glassmorphic Catalog Grid */}
      <CatalogGrid products={products} />

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 text-center text-[10px] font-mono text-zinc-600 tracking-[0.2em] uppercase">
        © HADX LABS — Architecture Terminal // Operational
      </footer>
    </main>
  );
}
