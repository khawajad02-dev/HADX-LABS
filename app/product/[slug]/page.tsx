import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Metadata } from "next";

import InstagramDMButton from "@/components/InstagramDMButton";
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
  const primaryMedia = parsed.media[0];

  return (
    <main className="relative min-h-screen bg-transparent text-zinc-100 pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        <div data-liquid-surface className="liquid-panel relative aspect-[4/5] rounded-2xl overflow-hidden bg-zinc-900/45">
          {primaryMedia?.type === "video" ? <video src={primaryMedia.url} controls playsInline className="w-full h-full object-cover" /> : primaryMedia?.url ? <img src={primaryMedia.url} alt={product.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-700 font-mono uppercase">No Preview Available</div>}
        </div>
        <div data-liquid-surface className="liquid-panel flex flex-col p-6 rounded-2xl">
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-zinc-500 mb-2">{product.category || "Collection"}{" // "}{product.sku}</span>
          <h1 className="text-4xl md:text-6xl font-extralight tracking-tight mb-6">{product.title}</h1>
          <div className="flex flex-wrap items-center gap-6 mb-8"><span className="text-3xl font-mono font-semibold">{currencySymbol(currency)} {amount.toLocaleString()}</span><VaultButton productId={product.id} /></div>
          <ProductPurchaseActions productId={product.id} currency={currency} />
          {parsed.media.length > 1 ? <div className="flex gap-2 mb-8 overflow-x-auto">{parsed.media.slice(1).map((media, index) => <div key={`${media.url}-${index}`} className="w-16 h-20 rounded-lg overflow-hidden border border-white/10 bg-zinc-900/45">{media.type === "video" ? <video src={media.url} muted playsInline className="w-full h-full object-cover" /> : <img src={media.url} alt={`${product.title} media ${index + 2}`} className="w-full h-full object-cover" />}</div>)}</div> : null}
          <div className="prose prose-invert prose-sm mb-10 text-zinc-400"><p>{parsed.description || "No description available for this drop."}</p></div>
          <div className="border-t border-white/10 pt-8 mt-auto"><div className="liquid-panel p-6 rounded-2xl"><h3 className="text-sm font-mono tracking-wider uppercase text-zinc-300 mb-2">Custom Commissions</h3><p className="text-xs text-zinc-500 mb-6 leading-relaxed">Want a custom vintage graphic? Send us your idea on Instagram DM.</p><InstagramDMButton label="SEND IDEA" /></div></div>
        </div>
      </div>
    </main>
  );
}
