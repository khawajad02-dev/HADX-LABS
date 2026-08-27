"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";

const FALLBACK_SIZES = ["S", "M", "L", "XL", "XXL"];

type ProductPurchaseActionsProps = {
  productId: string;
  sku?: string;
  name: string;
  price: number;
  currency: "USD" | "PKR" | "INR";
  imageUrl?: string | null;
  availableSizes?: string[];
};

export default function ProductPurchaseActions({ productId, sku, name, price, currency, imageUrl, availableSizes = FALLBACK_SIZES }: ProductPurchaseActionsProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const sizes = availableSizes.length ? availableSizes : FALLBACK_SIZES;
  const [selectedSize, setSelectedSize] = useState("");
  const [notice, setNotice] = useState("");

  const addToCart = (checkoutAfterAdd = false) => {
    if (!selectedSize) {
      setNotice("Select a size before adding this piece.");
      return;
    }
    addItem({ productId, sku, name, price, currency, imageUrl, availableSizes: sizes, size: selectedSize, quantity: 1 });
    setNotice(checkoutAfterAdd ? "Piece added. Opening your loadout…" : "Piece added to your loadout bag.");
    if (checkoutAfterAdd) router.push("/checkout");
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between gap-3"><span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">Choose size</span><span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">Required</span></div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Choose shirt size">
          {sizes.map((size) => {
            const active = selectedSize === size;
            return <button key={size} type="button" role="radio" aria-checked={active} onClick={() => { setSelectedSize(size); setNotice(""); }} className={`min-w-12 rounded-lg border px-4 py-2 text-xs font-mono tracking-widest transition-colors ${active ? "border-amber-200 bg-amber-100/15 text-amber-100 shadow-[0_0_18px_rgba(245,158,11,0.18)]" : "border-white/15 text-zinc-400 hover:border-amber-200/60 hover:text-white"}`}>{size}</button>;
          })}
        </div>
        {notice ? <p role="status" className="mt-2 text-[10px] font-mono uppercase tracking-widest text-amber-200">{notice}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => addToCart(false)} className="liquid-ui rounded-full border border-amber-200/60 bg-amber-100/10 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-amber-100 shadow-gold-glow transition-transform hover:scale-[1.02] active:scale-[0.98]">Add to Cart</button>
        <button type="button" onClick={() => addToCart(true)} className="liquid-ui rounded-full border border-white/20 px-5 py-3 text-xs font-mono uppercase tracking-[0.15em] text-zinc-300 transition-colors hover:border-amber-200/60 hover:text-white active:scale-[0.98]">Checkout Bag</button>
      </div>
    </div>
  );
}
