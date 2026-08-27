"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";
import CheckoutPage from "@/components/CheckoutPage";
import { CheckoutVideoModal, type CheckoutState } from "@/components/CheckoutVideoModal";
import { cartItemKey, type CartItem } from "@/lib/cart";

type Currency = "USD" | "PKR" | "INR";

export default function CheckoutEntry() {
  const { items: cartItems, hydrated, clearCart } = useCart();
  const [directItem, setDirectItem] = useState<CartItem | null>(null);
  const [directLoading, setDirectLoading] = useState(false);
  const [message, setMessage] = useState("Loading secure checkout…");
  const [queryCurrency, setQueryCurrency] = useState<Currency>("USD");
  const [videoState, setVideoState] = useState<CheckoutState>(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const requestedCurrency = (query.get("currency") || "USD").toUpperCase();
    const currency: Currency = requestedCurrency === "PKR" || requestedCurrency === "INR" ? requestedCurrency : "USD";
    const productId = query.get("productId");
    const size = (query.get("size") || "").trim().toUpperCase();
    setQueryCurrency(currency);
    if (query.get("payment") === "failed") setVideoState("payment_failed");
    if (!productId || cartItems.length) return;

    setDirectLoading(true);
    void fetch(`/api/products?currency=${currency}&_=${Date.now()}`, { cache: "no-store", headers: { Accept: "application/json" } })
      .then(async (response) => {
        const data = await response.json();
        const item = Array.isArray(data.products) ? data.products.find((candidate: any) => candidate.id === productId) : null;
        if (!response.ok || !item) throw new Error("This product is not available for checkout. Please return to the live catalog.");
        const availableSizes = Array.isArray(item.availableSizes) && item.availableSizes.length ? item.availableSizes : ["S", "M", "L", "XL", "XXL"];
        const selectedSize = size || availableSizes[0] || "";
        setDirectItem({
          key: cartItemKey(item.id, selectedSize, currency),
          productId: item.id,
          sku: item.sku,
          name: item.title || item.name || "HADX piece",
          price: Number(item.regionalPrices?.[currency] ?? item.price ?? Number(item.priceInCents || 0) / 100),
          currency,
          quantity: 1,
          imageUrl: item.imageUrl ?? item.media?.[0]?.url ?? null,
          availableSizes,
          size: selectedSize,
        });
      })
      .catch((error: Error) => setMessage(error.message || "Checkout could not connect to the live catalog. Please try again."))
      .finally(() => setDirectLoading(false));
  }, [cartItems.length]);

  const items = useMemo(() => cartItems.length ? cartItems : directItem ? [directItem] : [], [cartItems, directItem]);
  const activeCurrency = items[0]?.currency || queryCurrency;
  const initialCountry = activeCurrency === "PKR" ? "Pakistan" : activeCurrency === "INR" ? "India" : "";
  const networkVideo = <CheckoutVideoModal state={videoState} onClose={() => setVideoState(null)} />;

  if (!hydrated || directLoading) {
    return <><main className="min-h-screen bg-transparent px-6 pt-36 text-center text-white"><p className="font-mono text-xs uppercase tracking-widest text-zinc-400">{message}</p></main>{networkVideo}</>;
  }

  if (!items.length) {
    return <><main className="min-h-screen bg-transparent px-6 pt-36 text-center text-white"><p className="font-mono text-xs uppercase tracking-widest text-zinc-400">Your loadout is empty. Add a product and size before checkout.</p><a href="/catalog#catalog" className="liquid-ui mt-8 inline-flex rounded-full px-5 py-3 text-xs font-mono uppercase tracking-widest text-amber-100">Return to catalog</a></main>{networkVideo}</>;
  }

  return <><CheckoutPage items={items} initialCountry={initialCountry} onOrderComplete={clearCart} />{networkVideo}</>;
}
