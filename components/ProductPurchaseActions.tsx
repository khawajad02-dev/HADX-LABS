"use client";

import Link from "next/link";

type ProductPurchaseActionsProps = {
  productId: string;
  currency: "USD" | "PKR" | "INR";
};

export default function ProductPurchaseActions({ productId, currency }: ProductPurchaseActionsProps) {
  const checkoutHref = `/checkout?productId=${encodeURIComponent(productId)}&currency=${currency}`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link href={checkoutHref} className="liquid-ui rounded-full border border-amber-200/60 bg-amber-100/10 px-6 py-3 text-xs font-bold tracking-[0.2em] uppercase text-amber-100 shadow-gold-glow transition-transform hover:scale-[1.02]">
        Buy Now
      </Link>
      <Link href={checkoutHref} className="liquid-ui rounded-full border border-white/20 px-5 py-3 text-xs font-mono tracking-[0.15em] uppercase text-zinc-300 transition-colors hover:border-amber-200/60 hover:text-white">
        Open Checkout
      </Link>
    </div>
  );
}
