import Link from "next/link";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { Metadata } from "next";

import InstagramDMButton from "@/components/InstagramDMButton";
import ProductVariantExperience from "@/components/ProductVariantExperience";
import RelatedProducts, { type RelatedProduct } from "@/components/RelatedProducts";
import ProductReviews from "@/components/ProductReviews";
import VaultButton from "@/components/VaultButton";
import { currencyFromCookieValue, currencyFromCountry, currencySymbol, regionalPrice } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { serializeProduct } from "@/lib/product-meta";

export const revalidate = 0;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await prisma.product.findFirst({ where: { status: "PUBLISHED", OR: [{ sku: params.slug }, { id: params.slug }] } });
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

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findFirst({ where: { status: "PUBLISHED", OR: [{ sku: params.slug }, { id: params.slug }] } });
  if (!product) notFound();
  const parsed = serializeProduct(product);
  const requestHeaders = headers();
  const currency = currencyFromCookieValue(cookies().get("hadx_currency")?.value) || currencyFromCountry(requestHeaders.get("x-hadx-geo-country") || requestHeaders.get("x-vercel-ip-country") || requestHeaders.get("cf-ipcountry"));
  const amount = regionalPrice(product.priceInCents, parsed.regionalPrices, currency);
  let initialReviews: Array<{ id: string; name: string; rating: number; body: string; createdAt: Date }> = [];
  try {
    initialReviews = await prisma.productReview.findMany({
      where: { productId: product.id, approved: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, name: true, rating: true, body: true, createdAt: true },
    });
  } catch {
    // Keep the product page available while a deployment catches up with the review migration.
    initialReviews = [];
  }
  const candidates = await prisma.product.findMany({
    where: { status: "PUBLISHED", id: { not: product.id } },
    orderBy: { createdAt: "desc" },
    take: 24,
  });
  const currentCategory = product.category?.trim().toLowerCase() || "";
  const currentTitleTokens = product.title.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
  const relatedProducts: RelatedProduct[] = candidates
    .map((candidate) => {
      const candidateParsed = serializeProduct(candidate);
      const candidateCategory = candidate.category?.trim().toLowerCase() || "";
      const candidateTitle = candidate.title.toLowerCase();
      const sharedTitleTokens = currentTitleTokens.filter((token) => candidateTitle.includes(token)).length;
      const score = (currentCategory && candidateCategory === currentCategory ? 100 : 0) + sharedTitleTokens * 10;
      return {
        score,
        item: {
          id: candidate.id,
          sku: candidate.sku,
          title: candidate.title,
          category: candidate.category,
          imageUrl: candidate.imageUrl,
          media: candidateParsed.media,
          priceInCents: candidate.priceInCents,
          regionalPrices: candidateParsed.regionalPrices,
        },
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 6)
    .map(({ item }) => item);
  return (
    <main className="relative min-h-screen overflow-x-clip bg-transparent pt-32 pb-24 px-6 text-zinc-100">
      <div className="mx-auto mb-6 max-w-6xl">
        <Link href="/#catalog" className="liquid-ui inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-white/60 transition-colors hover:border-amber-300/60 hover:text-white">← BACK TO ATELIER</Link>
      </div>
      <div className="mx-auto grid min-w-0 max-w-6xl grid-cols-1 gap-12 md:grid-cols-2">
        <div className="min-w-0 space-y-4"><ProductVariantExperience productId={product.id} sku={product.sku} name={product.title} price={amount} currency={currency} imageUrl={product.imageUrl || parsed.media.find((media) => media.type === "image")?.url || null} media={parsed.media} availableSizes={parsed.availableSizes} stockBySize={parsed.stockBySize} colorVariants={parsed.colorVariants} measurementsBySize={parsed.measurementsBySize} /><div data-liquid-surface className="liquid-panel product-detail-glass flex min-w-0 flex-col rounded-2xl p-6">
          {parsed.drop ? <div className="mb-4 inline-flex w-fit items-center rounded-full border border-amber-200/30 bg-[rgba(15,15,15,0.45)] px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-amber-200">{parsed.drop.text || "LIMITED DROP // LAUNCHING SOON"}</div> : null}<span className="text-[10px] font-mono tracking-[0.3em] uppercase text-zinc-500 mb-2">{product.category || "Collection"}{" // "}{product.sku}</span>
          <h1 className="text-4xl md:text-6xl font-extralight tracking-tight mb-6">{product.title}</h1>
          <div className="flex flex-wrap items-center gap-6 mb-8"><span className="text-3xl font-mono font-semibold">{currencySymbol(currency)} {amount.toLocaleString()}</span><VaultButton productId={product.id} /></div>
          <div className="prose prose-invert prose-sm mb-10 text-zinc-400"><p>{parsed.description || "No description available for this drop."}</p></div>
          <div className="border-t border-white/10 pt-8 mt-auto"><div className="liquid-panel product-detail-glass p-6 rounded-2xl"><h3 className="text-sm font-mono tracking-wider uppercase text-zinc-300 mb-2">Custom Commissions</h3><p className="text-xs text-zinc-500 mb-6 leading-relaxed">Want a custom vintage graphic? Send us your idea on Instagram DM.</p><InstagramDMButton label="SEND IDEA" /></div></div>
        </div></div>
      </div>
      <ProductReviews productId={product.id} initialReviews={initialReviews.map((review) => ({ ...review, createdAt: review.createdAt.toISOString() }))} />
      <RelatedProducts products={relatedProducts} currency={currency} />
    </main>
  );
}
