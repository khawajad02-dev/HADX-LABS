"use client";

import Link from "next/link";

import CylinderProductSlider from "@/components/CylinderProductSlider";
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

type RelatedProductsProps = { products: RelatedProduct[]; currency: DisplayCurrency };

export default function RelatedProducts({ products, currency }: RelatedProductsProps) {
  const items = products.map((product) => ({
    id: product.id,
    sku: product.sku,
    title: product.title,
    category: product.category,
    imageUrl: product.imageUrl,
    media: product.media,
    priceLabel: `${currencySymbol(currency)} ${regionalPrice(product.priceInCents, product.regionalPrices, currency).toLocaleString()}`,
    href: `/product/${product.sku}?currency=${currency}`,
  }));

  return (
    <section className="relative mx-auto mt-20 max-w-6xl border-t border-white/10 pt-10" aria-labelledby="related-products-title">
      {items.length ? <CylinderProductSlider products={items} eyebrow="ARCHIVE_RELAY // CURVED PAIRINGS" title="Complete the Silhouette." description="Drag through curated HADX silhouettes. The center signal stays flat while the archive bends around it." /> : (
        <div className="liquid-panel rounded-2xl border border-dashed border-white/15 p-8 text-center">
          <p id="related-products-title" className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500">No curated pairing detected</p>
          <Link href="/#catalog" className="hadx-tap-reactive mt-4 inline-flex rounded-full px-3 py-2 text-xs text-amber-100 underline decoration-amber-200/30 underline-offset-4">Browse the full archive</Link>
        </div>
      )}
    </section>
  );
}
