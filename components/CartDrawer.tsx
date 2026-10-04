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
  onClearCart: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({ isOpen, onClose, items, onIncrement, onDecrement, onRemove, onClearCart, onCheckout }: CartDrawerProps) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const activeCurrency = items[0]?.currency || "USD";
  const currencySymbol = activeCurrency === "PKR" ? "PKR" : activeCurrency === "INR" ? "₹" : "$";

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      <div onClick={onClose} aria-hidden="true" className={`fixed inset-0 z-[99999] bg-black/75 transition-opacity duration-200 ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`} />
      <aside aria-label="Fiber Optic shopping bag" className={`fixed inset-y-0 right-0 z-[100000] flex h-[100dvh] max-h-[100dvh] w-[min(92vw,25rem)] min-w-0 flex-col overflow-hidden rounded-l-2xl border-y border-l border-[#D4AF37]/60 bg-[#080808] pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] shadow-[-24px_0_80px_rgba(0,0,0,0.65),0_0_32px_rgba(212,175,55,0.14)] transition-[transform,opacity] duration-300 ease-out ${isOpen ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-full opacity-0"}`}>
        <div className="flex shrink-0 items-center justify-between border-b border-[#D4AF37]/35 px-5 py-4">
          <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-hadx-gold-light">Fiber Optic [{items.length}]</h2>
          <button type="button" onClick={onClose} className="liquid-ui flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none text-hadx-gold hover:text-hadx-gold-light" aria-label="Close cart">✕</button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-4">
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

        <div className="shrink-0 space-y-4 border-t border-[#D4AF37]/35 bg-[#080808] px-6 py-5">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wide text-zinc-400"><span>Subtotal</span><span className="text-base font-bold text-hadx-gold-light">{currencySymbol} {total.toLocaleString()}</span></div>
          <button type="button" onClick={onClearCart} disabled={items.length === 0} className="mx-auto block text-[9px] font-mono uppercase tracking-[0.18em] text-white/35 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-30">Clear loadout</button>
          <button type="button" onClick={onCheckout} disabled={items.length === 0} className={`liquid-ui w-full rounded-xl border border-hadx-border-glow py-3.5 text-xs font-bold uppercase tracking-[0.25em] shadow-gold-glow ${items.length === 0 ? "cursor-not-allowed opacity-40" : "hover:scale-[1.01] hover:border-amber-400 active:scale-[0.99]"}`}><span className="bg-gold-gradient bg-clip-text text-transparent">[ EXECUTE ORDER ]</span></button>
        </div>
      </aside>
    </>
  );
}
