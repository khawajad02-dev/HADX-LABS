"use client";

import { useEffect } from "react";
import type { CartItem } from "@/lib/cart";

type CartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onIncrement: (key: string) => void;
  onDecrement: (key: string) => void;
  onRemove: (key: string) => void;
  onCheckout: () => void;
};

export default function CartDrawer({ isOpen, onClose, items, onIncrement, onDecrement, onRemove, onCheckout }: CartDrawerProps) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const activeCurrency = items[0]?.currency || "USD";
  const currencySymbol = activeCurrency === "PKR" ? "PKR" : activeCurrency === "INR" ? "₹" : "$";

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      <div onClick={onClose} aria-hidden="true" className={`fixed inset-0 z-40 bg-transparent transition-opacity duration-200 ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`} />
      <aside aria-label="Fiber Optic shopping bag" className={`fixed bottom-4 right-4 z-50 flex h-[min(78vh,46rem)] w-[min(92vw,25rem)] flex-col overflow-hidden rounded-2xl border border-hadx-border bg-[rgba(8,8,8,0.78)] shadow-[0_24px_80px_rgba(0,0,0,0.42),0_0_32px_rgba(212,175,55,0.1)] transition-[transform,opacity] duration-300 ease-out sm:bottom-6 sm:right-6 ${isOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"}`}>
        <div className="flex items-center justify-between border-b border-hadx-border px-5 py-4">
          <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-hadx-gold-light">Fiber Optic [{items.length}]</h2>
          <button type="button" onClick={onClose} className="liquid-ui flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none text-hadx-gold hover:text-hadx-gold-light" aria-label="Close cart">✕</button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-2">
              <p className="text-center text-xs font-mono uppercase tracking-widest text-zinc-500">Your loadout is empty</p>
              <span className="text-[10px] font-mono text-zinc-700">[ 0 ASSETS DETECTED ]</span>
            </div>
          ) : items.map((item) => (
            <div key={item.key} className="liquid-panel flex gap-3 rounded-lg p-3 transition-all hover:border-hadx-border-glow">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-800 bg-neutral-900">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /> : <span className="text-[9px] font-mono uppercase text-zinc-600">no asset</span>}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-xs font-medium text-zinc-100">{item.name}</h3>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-hadx-gold">{item.color ? `${item.color} · ` : ""}Size {item.size}</p>
                    <p className="text-[11px] font-mono text-hadx-gold">{item.currency === "PKR" ? "PKR" : item.currency === "INR" ? "₹" : "$"} {item.price.toLocaleString()}</p>
                  </div>
                  <button type="button" onClick={() => onRemove(item.key)} className="text-[10px] font-mono text-zinc-500 hover:text-amber-200" aria-label={`Remove ${item.name}${item.color ? ` ${item.color}` : ""} size ${item.size}`}>REMOVE</button>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button type="button" onClick={() => onDecrement(item.key)} className="liquid-ui flex h-6 w-6 items-center justify-center rounded border border-hadx-border text-xs font-mono text-hadx-gold-light" aria-label={`Decrease quantity of ${item.name}`}>−</button>
                  <span className="w-4 text-center text-xs font-mono text-zinc-200">{item.quantity}</span>
                  <button type="button" onClick={() => onIncrement(item.key)} className="liquid-ui flex h-6 w-6 items-center justify-center rounded border border-hadx-border text-xs font-mono text-hadx-gold-light" aria-label={`Increase quantity of ${item.name}`}>+</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="liquid-panel space-y-4 border-t border-hadx-border px-6 py-5">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wide text-zinc-400"><span>Subtotal</span><span className="text-base font-bold text-hadx-gold-light">{currencySymbol} {total.toLocaleString()}</span></div>
          <button type="button" onClick={onCheckout} disabled={items.length === 0} className={`liquid-ui w-full rounded-xl border border-hadx-border-glow py-3.5 text-xs font-bold uppercase tracking-[0.25em] shadow-gold-glow ${items.length === 0 ? "cursor-not-allowed opacity-40" : "hover:scale-[1.01] hover:border-amber-400 active:scale-[0.99]"}`}><span className="bg-gold-gradient bg-clip-text text-transparent">[ EXECUTE ORDER ]</span></button>
        </div>
      </aside>
    </>
  );
}
