"use client";

import { useEffect, useState } from "react";

import CheckoutPage from "@/components/CheckoutPage";

type Currency = "USD" | "PKR" | "INR";
type CheckoutProduct = {
  id: string;
  title: string;
  price: number;
  currency: Currency;
  imageUrl?: string | null;
  availableSizes: string[];
};

export default function CheckoutEntry() {
  const [product, setProduct] = useState<CheckoutProduct | null>(null);
  const [message, setMessage] = useState("Loading secure checkout…");
  const [productId, setProductId] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [selectedSize, setSelectedSize] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const requestedCurrency = (query.get("currency") || "USD").toUpperCase();
    setProductId(query.get("productId"));
    setCurrency(requestedCurrency === "PKR" || requestedCurrency === "INR" ? requestedCurrency : "USD");
    setSelectedSize((query.get("size") || "").trim().toUpperCase());
  }, []);

  useEffect(() => {
    if (!productId) {
      setMessage("No product was selected. Return to the catalog and choose a piece first.");
      return;
    }

    const load = async () => {
      try {
        const response = await fetch(`/api/products?currency=${currency}&_=${Date.now()}`, { cache: "no-store", headers: { Accept: "application/json" } });
        const data = await response.json();
        const item = Array.isArray(data.products) ? data.products.find((candidate: any) => candidate.id === productId) : null;
        if (!response.ok || !item) {
          setMessage("This product is not available for checkout. Please return to the live catalog.");
          return;
        }
        setProduct({
          id: item.id,
          title: item.title || item.name || "HADX piece",
          price: Number(item.regionalPrices?.[currency] ?? item.price ?? Number(item.priceInCents || 0) / 100),
          currency,
          imageUrl: item.imageUrl ?? item.media?.[0]?.url ?? null,
          availableSizes: Array.isArray(item.availableSizes) && item.availableSizes.length ? item.availableSizes : ["S", "M", "L", "XL", "XXL"],
        });
      } catch {
        setMessage("Checkout could not connect to the live catalog. Please try again.");
      }
    };

    void load();
  }, [currency, productId]);

  if (!product) {
    return <main className="min-h-screen bg-transparent px-6 pt-36 text-center text-white"><p className="font-mono text-xs uppercase tracking-widest text-zinc-400">{message}</p><a href="/catalog#catalog" className="liquid-ui mt-8 inline-flex rounded-full px-5 py-3 text-xs font-mono uppercase tracking-widest text-amber-100">Return to catalog</a></main>;
  }

  return <CheckoutPage items={[{ id: product.id, name: product.title, price: product.price, currency: product.currency, quantity: 1, imageUrl: product.imageUrl, availableSizes: product.availableSizes, size: selectedSize }]} total={product.price} />;
}
