import Link from "next/link";
import type { Metadata } from "next";

import CurrencySwitcher from "@/components/CurrencySwitcher";
import FavoritesView from "@/components/FavoritesView";
import StorefrontSearch from "@/components/StorefrontSearch";

export const metadata: Metadata = {
  title: "Favorites | HADX LABS",
  description: "View your saved HADX LABS drops.",
};

export default function FavoritesPage() {
  return (
    <main className="relative min-h-screen bg-transparent text-white pt-24">
      <nav className="liquid-panel fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-white/10 px-6 py-4">
        <Link href="/" className="text-sm font-extrabold uppercase tracking-[0.35em] text-white">HADX <span className="font-light text-zinc-500">LABS</span></Link>
        <div className="flex items-center gap-3">
          <CurrencySwitcher />
          <StorefrontSearch />
          <Link href="/catalog#catalog" className="liquid-ui rounded-full px-4 py-2 text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:text-white">Collection</Link>
        </div>
      </nav>
      <FavoritesView />
    </main>
  );
}
