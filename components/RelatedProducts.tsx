import Link from "next/link";

import { currencySymbol, regionalPrice, type DisplayCurrency } from "@/lib/currency";

export type RelatedProduct = {
  id: string;
  sku: string;
  title: string;
  category: string | null;
  imageUrl: string | null;
  media: Array<{ url: string; type: "image" | "video" }>;
  priceInCents: number;
  regionalPrices: { USD?: number; PKR?: number; INR?: number };
};

type RelatedProductsProps = {
  products: RelatedProduct[];
  currency: DisplayCurrency;
};

export default function RelatedProducts({ products, currency }: RelatedProductsProps) {
  const symbol = currencySymbol(currency);

  return (
    <section className="relative mx-auto mt-20 max-w-6xl border-t border-white/10 pt-10" aria-labelledby="related-products-title">
      <div className="mb-7 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 text-[10px] font-mono uppercase tracking-[0.32em] text-amber-200/70">Signal_Relay // Adjacent Drops</p>
          <h2 id="related-products-title" className="max-w-xl text-3xl font-extralight tracking-tight text-white md:text-5xl">Continue the transmission.</h2>
          <p className="mt-3 max-w-xl text-xs leading-6 text-zinc-500">A short list of pieces tuned to this product’s collection, mood, and latest release signal.</p>
        </div>
        <Link href="/#catalog" className="liquid-ui inline-flex w-fit items-center rounded-full border border-white/15 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:border-amber-200/60 hover:text-amber-100">Open full archive ↗</Link>
      </div>

      {products.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => {
            const media = product.media.find((item) => item.type === "image") || product.media[0];
            const imageUrl = media?.type === "image" ? media.url : product.imageUrl;
            const price = regionalPrice(product.priceInCents, product.regionalPrices, currency);
            return (
              <Link
                key={product.id}
                href={`/product/${product.sku}?currency=${currency}`}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-3 transition-all duration-300 hover:-translate-y-1 hover:border-amber-200/50 hover:bg-white/[0.06]"
                aria-label={`Open related product ${product.title}`}
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
                  {imageUrl ? <img src={imageUrl} alt={product.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-700">No signal</div>}
                  <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[9px] font-mono tracking-[0.18em] text-amber-100/80">0{index + 1}</span>
                  <span className="absolute bottom-3 right-3 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.16em] text-white/60">View drop</span>
                </div>
                <div className="flex items-start justify-between gap-3 px-1 pb-1 pt-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium tracking-wide text-zinc-100 group-hover:text-white">{product.title}</p>
                    <p className="mt-1 truncate text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">{product.category || "Atelier"}</p>
                  </div>
                  <p className="shrink-0 text-xs font-mono text-amber-100">{symbol} {price.toLocaleString()}</p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="liquid-panel rounded-2xl border border-dashed border-white/15 p-8 text-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500">No adjacent signal detected</p>
          <Link href="/#catalog" className="mt-4 inline-flex text-xs text-amber-100 underline decoration-amber-200/30 underline-offset-4">Browse the full archive</Link>
        </div>
      )}
    </section>
  );
}
