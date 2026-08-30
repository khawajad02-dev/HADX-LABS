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
  colorVariants: ProductColorVariant[];
};

export default function ProductVariantExperience({ productId, sku, name, price, currency, imageUrl, media, availableSizes, colorVariants }: ProductVariantExperienceProps) {
  const [selectedColor, setSelectedColor] = useState(colorVariants[0]?.name || "");
  const selectedVariant = colorVariants.find((variant) => variant.name === selectedColor);
  const selectedImage = selectedVariant?.media?.find((item) => item.type === "image")?.url || imageUrl || null;

  return (
    <>
      <ProductMediaGallery title={name} media={media} colorVariants={colorVariants} selectedColor={selectedColor} onColorChange={setSelectedColor} />
      <ProductPurchaseActions productId={productId} sku={sku} name={name} price={price} currency={currency} imageUrl={selectedImage} availableSizes={selectedVariant?.sizes?.length ? selectedVariant.sizes : availableSizes} colorVariants={colorVariants} selectedColor={selectedColor} onColorChange={setSelectedColor} />
    </>
  );
}
