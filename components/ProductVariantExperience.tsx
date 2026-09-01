"use client";

import { useState } from "react";
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

function getInitialColor(colorVariants: ProductColorVariant[], imageUrl?: string | null) {
  const blackVariant = colorVariants.find((variant) => variant.name.trim().toLowerCase() === "black")?.name;
  if (blackVariant) return blackVariant;
  return colorVariants.find((variant) => variant.media?.some((item) => item.url === imageUrl))?.name || colorVariants[0]?.name || "";
}

function getSwatchColor(name: string) {
  const normalized = name.trim().toLowerCase();
  const knownColors: Record<string, string> = {
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
  return knownColors[normalized] || "#52525b";
}

export default function ProductVariantExperience({ productId, sku, name, price, currency, imageUrl, media, availableSizes, stockBySize, colorVariants }: ProductVariantExperienceProps) {
  const [selectedColor, setSelectedColor] = useState(() => getInitialColor(colorVariants, imageUrl));
  const selectedVariant = colorVariants.find((variant) => variant.name === selectedColor);
  const selectedImage = selectedVariant?.media?.[0]?.url || imageUrl || null;

  return (
    <>
      <ProductMediaGallery title={name} media={media} colorVariants={colorVariants} selectedColor={selectedColor} onColorChange={setSelectedColor} />
      {colorVariants.length ? <div className="liquid-panel rounded-2xl border border-white/10 bg-[rgba(15,15,15,0.45)] p-4"><div className="mb-3 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">Choose color</div><div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Choose product color">{colorVariants.map((variant) => <button key={variant.name} type="button" role="radio" aria-checked={selectedColor === variant.name} onClick={() => setSelectedColor(variant.name)} className={`rounded-xl border px-4 py-2 text-xs font-mono uppercase tracking-[0.16em] transition-colors ${selectedColor === variant.name ? "border-amber-200 bg-amber-100/15 text-amber-100 shadow-[0_0_18px_rgba(245,158,11,0.14)]" : "border-white/15 bg-black/10 text-zinc-400 hover:border-amber-200/60 hover:text-white"}`}><span className="mr-2 inline-block h-2 w-2 rounded-full border border-white/30 align-middle" style={{ backgroundColor: getSwatchColor(variant.name) }} />{variant.name}</button>)}</div></div> : null}
      <ProductPurchaseActions productId={productId} sku={sku} name={name} price={price} currency={currency} imageUrl={selectedImage} availableSizes={selectedVariant?.sizes?.length ? selectedVariant.sizes : availableSizes} colorVariants={colorVariants} stockBySize={stockBySize} selectedColor={selectedColor} onColorChange={setSelectedColor} />
    </>
  );
}
