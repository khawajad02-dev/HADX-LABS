import Link from "next/link";

import CatalogGrid from "@/components/CatalogGrid";
import StorefrontSearch from "@/components/StorefrontSearch";
import CurrencySwitcher from "@/components/CurrencySwitcher";

export default function CatalogPage() {
  return (
    <main className="relative min-h-screen bg-transparent text-white pt-24">
      <nav className="liquid-panel fixed top-0 left-0 right-0 z-50 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-sm font-extrabold tracking-[0.35em] text-white uppercase">HADX <span className="text-zinc-500 font-light">LABS</span></Link>
        <div className="flex items-center gap-3">
          <CurrencySwitcher />
          <StorefrontSearch />
          <Link href="/" className="liquid-ui rounded-full px-4 py-2 text-[11px] font-mono tracking-[0.2em] text-zinc-400 uppercase hover:text-white transition-colors">Home</Link>
        </div>
      </nav>
      <CatalogGrid products={[]} />
    </main>
  );
}
