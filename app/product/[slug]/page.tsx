import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Metadata } from "next";

import InstagramDMButton from "@/components/InstagramDMButton";
import ProductMediaGallery from "@/components/ProductMediaGallery";
import ProductPurchaseActions from "@/components/ProductPurchaseActions";
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
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        <ProductMediaGallery title={product.title} media={parsed.media} />
        <div data-liquid-surface className="liquid-panel product-detail-glass flex flex-col rounded-2xl p-6">
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-zinc-500 mb-2">{product.category || "Collection"}{" // "}{product.sku}</span>
          <h1 className="text-4xl md:text-6xl font-extralight tracking-tight mb-6">{product.title}</h1>
          <div className="flex flex-wrap items-center gap-6 mb-8"><span className="text-3xl font-mono font-semibold">{currencySymbol(currency)} {amount.toLocaleString()}</span><VaultButton productId={product.id} /></div>
          <ProductPurchaseActions productId={product.id} currency={currency} availableSizes={parsed.availableSizes} />
          <div className="prose prose-invert prose-sm mb-10 text-zinc-400"><p>{parsed.description || "No description available for this drop."}</p></div>
          <div className="border-t border-white/10 pt-8 mt-auto"><div className="liquid-panel product-detail-glass p-6 rounded-2xl"><h3 className="text-sm font-mono tracking-wider uppercase text-zinc-300 mb-2">Custom Commissions</h3><p className="text-xs text-zinc-500 mb-6 leading-relaxed">Want a custom vintage graphic? Send us your idea on Instagram DM.</p><InstagramDMButton label="SEND IDEA" /></div></div>
        </div>
      </div>
    </main>
  );
}
