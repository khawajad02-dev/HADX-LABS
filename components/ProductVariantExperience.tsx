"use client";

import { useEffect, useState } from "react";
import ProductMediaGallery from "@/components/ProductMediaGallery";
import ProductPurchaseActions from "@/components/ProductPurchaseActions";
import type { ProductColorVariant, ProductMedia } from "@/lib/product-meta";

type ProductVariantExperienceProps = {
  productId: string;
  sku: string;
  name: string;
  price: number;
  currency: "USD" | "PKR" | "INR";
  imageUrl?: string | null;
  media: ProductMedia[];
  availableSizes: string[];
  stockBySize?: Record<string, number>;
  colorVariants: ProductColorVariant[];
};

function variantKey(name: string) {
  return name.trim().toLowerCase();
}

function buildStorefrontVariants(
  colorVariants: ProductColorVariant[],
  imageUrl: string | null | undefined,
  availableSizes: string[],
  stockBySize: Record<string, number>,
) {
  const hasTopLevelImage = Boolean(imageUrl);
  const topLevelImageAlreadyMapped = colorVariants.some((variant) => variant.media?.some((item) => item.url === imageUrl));
  const hasBlackVariant = colorVariants.some((variant) => variantKey(variant.name) === "black");

  // The catalog card uses Product.imageUrl. If Owner metadata has only White but
  // that catalog image is a different asset, expose it as the Black variant.
  if (hasTopLevelImage && !topLevelImageAlreadyMapped && !hasBlackVariant) {
    return [
      { name: "Black", media: [{ url: imageUrl!, type: "image" as const }], sizes: availableSizes, stockBySize },
      ...colorVariants,
    ];
  }
  return colorVariants;
}

function swatchColor(name: string) {
  const colors: Record<string, string> = {
    black: "#050505",
    white: "#ffffff",
    red: "#dc2626",
    blue: "#2563eb",
    green: "#16a34a",
    yellow: "#facc15",
    orange: "#f97316",
    purple: "#9333ea",
    pink: "#ec4899",
    brown: "#92400e",
    gray: "#6b7280",
    grey: "#6b7280",
    beige: "#d6c5a5",
    cream: "#fff7d6",
    navy: "#172554",
  };
  return colors[variantKey(name)] || "#52525b";
}

export default function ProductVariantExperience({
  productId,
  sku,
  name,
  price,
  currency,
  imageUrl,
  media,
  availableSizes,
  stockBySize = {},
  colorVariants,
}: ProductVariantExperienceProps) {
  const storefrontVariants = buildStorefrontVariants(colorVariants, imageUrl, availableSizes, stockBySize);
  const [selectedColor, setSelectedColor] = useState(() => {
    const black = storefrontVariants.find((variant) => variantKey(variant.name) === "black");
    return black?.name || storefrontVariants[0]?.name || "";
  });

  const selectedVariant = storefrontVariants.find((variant) => variantKey(variant.name) === variantKey(selectedColor));
  const selectedImage = selectedVariant?.media?.[0]?.url || imageUrl || null;

  useEffect(() => {
    if (!selectedVariant && storefrontVariants.length) setSelectedColor(storefrontVariants[0].name);
  }, [selectedVariant, storefrontVariants]);

  return (
    <>
      <ProductMediaGallery
        title={name}
        media={media}
        colorVariants={storefrontVariants}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
      />

      {storefrontVariants.length ? (
        <div className="liquid-panel rounded-2xl border border-white/10 bg-[rgba(15,15,15,0.45)] p-4">
          <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">Choose color</div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Choose product color">
            {storefrontVariants.map((variant) => {
              const active = variantKey(selectedColor) === variantKey(variant.name);
              return (
                <button
                  key={variant.name}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelectedColor(variant.name)}
                  className={`rounded-xl border px-4 py-2 text-xs font-mono uppercase tracking-[0.16em] transition-colors ${active ? "border-amber-200 bg-amber-100/15 text-amber-100 shadow-[0_0_18px_rgba(245,158,11,0.14)]" : "border-white/15 bg-black/10 text-zinc-400 hover:border-amber-200/60 hover:text-white"}`}
                >
                  <span className="mr-2 inline-block h-3 w-3 rounded-full border border-white/30 align-middle" style={{ backgroundColor: swatchColor(variant.name) }} />
                  {variant.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <ProductPurchaseActions
        productId={productId}
        sku={sku}
        name={name}
        price={price}
        currency={currency}
        imageUrl={selectedImage}
        availableSizes={selectedVariant?.sizes?.length ? selectedVariant.sizes : availableSizes}
        colorVariants={storefrontVariants}
        stockBySize={stockBySize}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
      />
    </>
  );
}
