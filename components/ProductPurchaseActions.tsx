"use client";
import { useState } from "react";
type Props = { product: { id: string; title: string; priceInCents: number; imageUrl?: string | null } };
export default function ProductPurchaseActions({ product }: Props) {
  const [color, setColor] = useState("Black");
  const [size, setSize] = useState("M");
  const [added, setAdded] = useState(false);
  const addToCart = () => {
    const current = JSON.parse(localStorage.getItem("hadx-cart") || "[]") as Array<Record<string, unknown>>;
    const key = `${product.id}:${color}:${size}`;
    const existing = current.find((item) => item.key === key);
    if (existing) existing.quantity = Number(existing.quantity || 0) + 1;
    else current.push({ key, id: product.id, name: product.title, price: product.priceInCents / 100, quantity: 1, color, size, imageUrl: product.imageUrl || null });
    localStorage.setItem("hadx-cart", JSON.stringify(current));
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };
  return <div className="space-y-5">
    <div><p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500">Color</p><div className="flex gap-2">{["Black", "White"].map((option) => <button type="button" key={option} onClick={() => setColor(option)} className={`rounded-lg border px-4 py-2 text-xs font-mono ${color === option ? "border-amber-400 bg-amber-400/10 text-amber-300" : "border-white/15 text-zinc-400"}`}>{option}</button>)}</div></div>
    <div><p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500">Size</p><div className="flex gap-2">{["S", "M", "L", "XL"].map((option) => <button type="button" key={option} onClick={() => setSize(option)} className={`rounded-lg border px-4 py-2 text-xs font-mono ${size === option ? "border-amber-400 bg-amber-400/10 text-amber-300" : "border-white/15 text-zinc-400"}`}>{option}</button>)}</div></div>
    <button type="button" onClick={addToCart} className="w-full rounded-xl bg-amber-500 px-6 py-3 font-mono text-xs font-bold tracking-widest text-black hover:bg-amber-400">{added ? "ADDED TO LOADOUT" : "ADD TO LOADOUT"}</button>
  </div>;
}
