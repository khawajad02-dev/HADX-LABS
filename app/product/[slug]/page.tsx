import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import InstagramDMButton from "@/components/InstagramDMButton";
import VaultButton from "@/components/VaultButton";
import { Metadata } from "next";

export const revalidate = 0;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { sku: params.slug },
  });

  if (!product || product.status !== "PUBLISHED") {
    return {
      title: "Product Not Found | HADX LABS",
    };
  }

  const title = `${product.title} | Bootleg Vintage Graphics | HADX LABS`;
  const description = product.description || `Get this high-quality bootleg vintage ${product.category} graphic featuring ${product.title}. Optimized for Anime, Marvel, and DC fans.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.imageUrl ? [{ url: product.imageUrl }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.imageUrl ? [product.imageUrl] : [],
    },
    keywords: `vintage graphics, bootleg anime, marvel assets, dc characters, ${product.title}, ${product.category}, custom graphic design`,
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { sku: params.slug },
  });

  if (!product || product.status !== "PUBLISHED") {
    notFound();
  }

  return (
    <main className="relative min-h-screen bg-transparent text-zinc-100 pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-700 font-mono uppercase">
              No Preview Available
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex flex-col">
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-zinc-500 mb-2">
            {product.category || "Collection"} {"//"} {product.sku}
          </span>
          <h1 className="text-4xl md:text-6xl font-extralight tracking-tight mb-6">
            {product.title}
          </h1>
          
          <div className="flex items-center gap-6 mb-8">
            <span className="text-3xl font-mono font-semibold">
              PKR {(product.priceInCents / 100).toLocaleString()}
            </span>
            <VaultButton productId={product.id} />
          </div>

          <div className="prose prose-invert prose-sm mb-10 text-zinc-400">
            <p>{product.description || "No description available for this drop."}</p>
          </div>

          {/* Specs / Price section end */}
          <div className="border-t border-white/10 pt-8 mt-auto">
            {/* Task 1: Custom Design CTA Box */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 backdrop-blur-md">
              <h3 className="text-sm font-mono tracking-wider uppercase text-zinc-300 mb-2">
                Custom Commissions
              </h3>
              <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                Want a custom vintage graphic? Send us your idea on Instagram DM.
              </p>
              <InstagramDMButton label="SEND IDEA" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
