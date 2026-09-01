// components/ProductVariantExperience.tsx
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import ProductMediaGallery from "./ProductMediaGallery";
import ProductPurchaseActions from "./ProductPurchaseActions";

type ProductMedia = { url: string; type: "image" | "video"; fileName?: string };

type ColorVariant = {
  name: string;
  media?: ProductMedia[];
  sizes?: string[];
  stockBySize?: Record<string, number>;
};

export default function ProductVariantExperience({
  productId,
  sku,
  name,
  price,
  currency,
  imageUrl,
  media,
  availableSizes,
  stockBySize,
  colorVariants,
}: {
  productId: string;
  sku: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  media: ProductMedia[];
  availableSizes: string[];
  stockBySize: Record<string, number>;
  colorVariants: ColorVariant[];
}) {
  // ===== COLOR SELECTION STATE =====
  const hasColorVariants = colorVariants.length > 0;
  
  // Default to first color variant if available, otherwise null
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(
    hasColorVariants ? 0 : -1
  );

  // ===== DERIVED DATA BASED ON SELECTED COLOR =====
  const activeVariant = hasColorVariants ? colorVariants[selectedColorIndex] : null;

  // Images to show: color-specific > general media > fallback imageUrl
  const displayImages = useMemo(() => {
    if (activeVariant?.media && activeVariant.media.length > 0) {
      return activeVariant.media;
    }
    if (media && media.length > 0) {
      return media;
    }
    if (imageUrl) {
      return [{ url: imageUrl, type: "image" as const }];
    }
    return [];
  }, [activeVariant, media, imageUrl]);

  // Sizes to show: color-specific > general sizes
  const displaySizes = useMemo(() => {
    if (activeVariant?.sizes && activeVariant.sizes.length > 0) {
      return activeVariant.sizes;
    }
    return availableSizes.length > 0 ? availableSizes : ["S", "M", "L", "XL"];
  }, [activeVariant, availableSizes]);

  // Stock to show: color-specific > general stock
  const displayStock = useMemo(() => {
    if (activeVariant?.stockBySize && Object.keys(activeVariant.stockBySize).length > 0) {
      return activeVariant.stockBySize;
    }
    return stockBySize;
  }, [activeVariant, stockBySize]);

  // Total stock for tracker
  const totalStock = useMemo(() => {
    return Object.values(displayStock).reduce((sum, qty) => sum + (qty || 0), 0);
  }, [displayStock]);

  // ===== HANDLERS =====
  const handleColorSelect = (index: number) => {
    setSelectedColorIndex(index);
  };

  return (
    <div className="space-y-6">
      {/* ===== IMAGE GALLERY ===== */}
      <div className="relative">
        <ProductMediaGallery 
          media={displayImages} 
          productName={name} 
        />
        
        {/* Image counter badge */}
        {displayImages.length > 1 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-amber-300 px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-[0.2em]">
            Swipe / Drag 1 / {displayImages.length}
          </div>
        )}
      </div>

      {/* ===== COLOR SELECTOR ===== */}
      {hasColorVariants && (
        <div className="liquid-panel product-detail-glass rounded-2xl p-5 space-y-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">
            Choose Color
          </div>
          <div className="flex flex-wrap gap-3">
            {colorVariants.map((variant, index) => {
              const isActive = selectedColorIndex === index;
              // Determine swatch color
              const colorName = variant.name.toLowerCase();
              const swatchColor = colorName.includes("white") 
                ? "#F5F3EE" 
                : colorName.includes("black") 
                ? "#1a1a1a" 
                : colorName.includes("red")
                ? "#8F2A2A"
                : colorName.includes("blue")
                ? "#2A4A8F"
                : "#333";

              return (
                <button
                  key={`${variant.name}-${index}`}
                  onClick={() => handleColorSelect(index)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full border transition-all duration-200 ${
                    isActive 
                      ? "border-amber-400/60 bg-amber-400/10 text-amber-200" 
                      : "border-white/15 bg-white/5 text-zinc-400 hover:border-white/30"
                  }`}
                >
                  <span 
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: swatchColor }}
                  />
                  <span className="text-xs font-bold tracking-wide uppercase">
                    {variant.name}
                  </span>
                </button>
              );
            })}
          </div>
          
          {/* Color variant stock indicator */}
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
            <span className={`w-2 h-2 rounded-full ${totalStock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {totalStock > 0 ? `${totalStock} units available` : "Out of stock"}
          </div>
        </div>
      )}

      {/* ===== SIZE SELECTOR ===== */}
      <div className="liquid-panel product-detail-glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">
            Choose Size
          </div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600">
            Required
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {displaySizes.map((size) => {
            const stock = displayStock[size] || 0;
            const isOutOfStock = stock === 0;
            
            return (
              <div key={size} className="relative">
                <button
                  disabled={isOutOfStock}
                  className={`min-w-[64px] px-4 py-3 rounded-xl border text-sm font-bold transition-all duration-200 ${
                    isOutOfStock
                      ? "border-white/10 bg-white/5 text-zinc-600 opacity-50 cursor-not-allowed line-through"
                      : "border-white/15 bg-white/5 text-zinc-300 hover:border-amber-400/40 hover:text-amber-200"
                  }`}
                >
                  {size}
                </button>
                {/* Stock badge */}
                {!isOutOfStock && stock > 0 && stock < 10 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                    {stock}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== PURCHASE ACTIONS ===== */}
      <ProductPurchaseActions
        productId={productId}
        sku={sku}
        name={name}
        price={price}
        currency={currency}
        selectedColor={activeVariant?.name || null}
        availableSizes={displaySizes}
        stockBySize={displayStock}
      />
    </div>
  );
}
