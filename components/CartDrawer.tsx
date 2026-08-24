"use client";

import { useEffect } from "react";

type CartItem = {
  id: string;
  name: string;
  price: number;
  currency?: "USD" | "PKR" | "INR";
  quantity: number;
  imageUrl?: string | null;
};

type CartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onCheckout: () => void;
};

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onIncrement,
  onDecrement,
  onCheckout,
}: CartDrawerProps) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const activeCurrency = items[0]?.currency || "USD";
  const currencySymbol = activeCurrency === "PKR" ? "PKR" : activeCurrency === "INR" ? "₹" : "$";

  // Lock background scroll and listen for Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        aria-label="Shopping Cart Drawer"
        className={`
          fixed top-0 right-0 z-50 h-full w-full max-w-sm
          liquid-panel border-l border-hadx-border
          transition-transform duration-300 ease-out flex flex-col
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-hadx-border">
          <h2 className="text-xs font-mono tracking-[0.3em] uppercase text-hadx-gold-light">
            Loadout Bag [{items.length}]
          </h2>
          <button
            onClick={onClose}
            className="liquid-ui flex h-8 w-8 items-center justify-center rounded-full text-hadx-gold hover:text-hadx-gold-light text-lg leading-none"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2">
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest text-center">
                Your loadout is empty
              </p>
              <span className="text-[10px] text-zinc-700 font-mono">[ 0 ASSETS DETECTED ]</span>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="liquid-panel flex gap-3 rounded-lg p-3 hover:border-hadx-border-glow transition-all"
              >
                <div className="w-16 h-16 rounded-md bg-neutral-900 border border-neutral-800 overflow-hidden flex items-center justify-center shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[9px] text-zinc-600 font-mono uppercase">no asset</span>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-medium text-zinc-100 truncate">
                      {item.name}
                    </h3>
                    <p className="text-[11px] font-mono text-hadx-gold">
                      {item.currency === "PKR" ? "PKR" : item.currency === "INR" ? "₹" : "$"} {item.price.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => onDecrement(item.id)}
                      className="liquid-ui w-6 h-6 flex items-center justify-center rounded border border-hadx-border text-hadx-gold-light hover:border-hadx-border-glow font-mono text-xs"
                      aria-label={`Decrease quantity of ${item.name}`}
                    >
                      −
                    </button>
                    <span className="text-xs font-mono text-zinc-200 w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onIncrement(item.id)}
                      className="liquid-ui w-6 h-6 flex items-center justify-center rounded border border-hadx-border text-hadx-gold-light hover:border-hadx-border-glow font-mono text-xs"
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Checkout */}
        <div className="liquid-panel border-t border-hadx-border px-6 py-5 space-y-4">
          <div className="flex justify-between items-center text-xs font-mono uppercase tracking-wide text-zinc-400">
            <span>Subtotal</span>
            <span className="text-hadx-gold-light text-base font-bold">
              {currencySymbol} {total.toLocaleString()}
            </span>
          </div>

          <button
            onClick={onCheckout}
            disabled={items.length === 0}
            className={`
              liquid-ui w-full rounded-xl py-3.5 text-xs font-bold tracking-[0.25em] uppercase
              border border-hadx-border-glow shadow-gold-glow
              ${
                items.length === 0
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:scale-[1.01] hover:border-amber-400 active:scale-[0.99]"
              }
            `}
          >
            <span className="bg-clip-text text-transparent bg-gold-gradient">
              [ EXECUTE ORDER ]
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
