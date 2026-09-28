"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type SeoPageShellProps = { eyebrow: string; title: string; intro: string; children: ReactNode };
const links = [["SHOP", "/catalog"], ["COLLECTIONS", "/collections"], ["CUSTOM", "/custom-graphics"], ["SIZE GUIDE", "/size-guide"], ["TRACK ORDER", "/track-order"], ["FAQ", "/faq"], ["CONTACT", "/contact"]] as const;

export default function SeoPageShell({ eyebrow, title, intro, children }: SeoPageShellProps) {
  const router = useRouter();
  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent px-6 pb-24 pt-28 text-zinc-100 md:px-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_15%,rgba(212,175,55,.12),transparent_42%)]" />
      <nav className="mx-auto mb-16 flex max-w-6xl flex-wrap items-center justify-between gap-5 border-b border-white/10 pb-5" aria-label="HADX LABS primary navigation">
        <Link href="/" aria-label="HADX LABS home" className="text-sm font-extrabold uppercase tracking-[0.35em] text-white">HADX <span className="font-light text-zinc-500">LABS</span></Link>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400">
          {links.map(([label, href]) => <Link key={href} href={href} className="liquid-ui rounded-full px-3 py-2 transition-colors hover:text-amber-100">{label}</Link>)}
          <button type="button" onClick={goBack} className="liquid-ui rounded-full border border-white/15 px-3 py-2 transition-colors hover:border-amber-100 hover:text-white">← BACK</button>
          <Link href="/" className="liquid-ui rounded-full border border-amber-200/30 px-3 py-2 text-amber-100 transition-colors hover:border-amber-100 hover:text-white">HOME</Link>
        </div>
      </nav>
      <header className="mx-auto max-w-4xl"><p className="mb-4 text-[10px] font-mono uppercase tracking-[0.3em] text-amber-200/75">{eyebrow}</p><h1 className="max-w-4xl text-4xl font-extralight tracking-tight text-white md:text-7xl">{title}</h1><p className="mt-7 max-w-2xl text-base leading-8 text-zinc-400 md:text-lg">{intro}</p></header>
      <section className="mx-auto mt-14 max-w-4xl space-y-6">{children}</section>
      <footer className="mx-auto mt-20 flex max-w-4xl flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-7 text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500"><span>HADX LABS // TRANSPARENT ATELIER</span><div className="flex gap-4"><Link href="/privacy" className="hover:text-amber-100">Privacy</Link><Link href="/terms" className="hover:text-amber-100">Terms</Link><Link href="/shipping" className="hover:text-amber-100">Shipping</Link></div></footer>
    </main>
  );
}

export function SeoPanel({ title, children }: { title: string; children: ReactNode }) { return <article className="liquid-panel rounded-2xl border border-white/10 bg-transparent p-6 md:p-8"><h2 className="text-xl font-light tracking-wide text-amber-100 md:text-2xl">{title}</h2><div className="mt-4 space-y-3 text-sm leading-7 text-zinc-400">{children}</div></article>; }
