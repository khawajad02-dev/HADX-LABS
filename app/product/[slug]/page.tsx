import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Metadata } from "next";

import InstagramDMButton from "@/components/InstagramDMButton";
import ProductVariantExperience from "@/components/ProductVariantExperience";
import VaultButton from "@/components/VaultButton";
import { currencySymbol, regionalPrice, type DisplayCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { serializeProduct } from "@/lib/product-meta";

export const revalidate = 0;

function detectCurrency(requested?: string): DisplayCurrency {
  const explicit = requested?.toUpperCase();
  if (explicit === "PKR" || explicit === "INR" || explicit === "USD") return explicit;
  const country = (headers().get("x-vercel-ip-country") || headers().get("cf-ipcountry") || "").toUpperCase();
  if (country === "PK") return "PKR";
  if (country === "IN") return "INR";
  return "USD";
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await prisma.product.findUnique({ where: { sku: params.slug } });
  if (!product || product.status !== "PUBLISHED") return { title: "Product Not Found | HADX LABS" };
  const parsed = serializeProduct(product);
  const title = `${product.title} | HADX LABS`;
  const description = parsed.description || `Discover ${product.title} from the HADX LABS atelier.`;
  const image = parsed.media.find((media) => media.type === "image")?.url || product.imageUrl || undefined;
  return {
    title,
    description,
    openGraph: { title, description, images: image ? [{ url: image }] : [], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : [] },
    keywords: `HADX LABS, ${product.title}, ${product.category || "atelier"}`,
  };
}

export default async function ProductPage({ params, searchParams }: { params: { slug: string }; searchParams?: { currency?: string } }) {
  const product = await prisma.product.findUnique({ where: { sku: params.slug } });
  if (!product || product.status !== "PUBLISHED") notFound();
  const parsed = serializeProduct(product);
  const currency = detectCurrency(searchParams?.currency);
  const amount = regionalPrice(product.priceInCents, parsed.regionalPrices, currency);
  return (
    <main className="relative min-h-screen bg-transparent text-zinc-100 pt-32 pb-24 px-6">
      <div className="mx-auto mb-6 max-w-6xl">
        <Link href="/#catalog" className="liquid-ui inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-white/60 transition-colors hover:border-amber-300/60 hover:text-white">← BACK TO ATELIER</Link>
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-4"><ProductVariantExperience productId={product.id} sku={product.sku} name={product.title} price={amount} currency={currency} imageUrl={parsed.media.find((media) => media.type === "image")?.url || product.imageUrl || null} media={parsed.media} availableSizes={parsed.availableSizes} colorVariants={parsed.colorVariants} /><div data-liquid-surface className="liquid-panel product-detail-glass flex flex-col rounded-2xl p-6">
          {parsed.drop ? <div className="mb-4 inline-flex w-fit items-center rounded-full border border-amber-200/30 bg-[rgba(15,15,15,0.45)] px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-amber-200">{parsed.drop.text || "LIMITED DROP // LAUNCHING SOON"}</div> : null}<span className="text-[10px] font-mono tracking-[0.3em] uppercase text-zinc-500 mb-2">{product.category || "Collection"}{" // "}{product.sku}</span>
          <h1 className="text-4xl md:text-6xl font-extralight tracking-tight mb-6">{product.title}</h1>
          <div className="flex flex-wrap items-center gap-6 mb-8"><span className="text-3xl font-mono font-semibold">{currencySymbol(currency)} {amount.toLocaleString()}</span><VaultButton productId={product.id} /></div>
          <div className="prose prose-invert prose-sm mb-10 text-zinc-400"><p>{parsed.description || "No description available for this drop."}</p></div>
          <div className="border-t border-white/10 pt-8 mt-auto"><div className="liquid-panel product-detail-glass p-6 rounded-2xl"><h3 className="text-sm font-mono tracking-wider uppercase text-zinc-300 mb-2">Custom Commissions</h3><p className="text-xs text-zinc-500 mb-6 leading-relaxed">Want a custom vintage graphic? Send us your idea on Instagram DM.</p><InstagramDMButton label="SEND IDEA" /></div></div>
        </div></div>
      </div>
    </main>
  );
}
