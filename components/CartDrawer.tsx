"use client";

type CartItem = {
  id: string;
  name: string;
  price: number;
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

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        className={`
          fixed top-0 right-0 z-50 h-full w-full max-w-sm
          bg-black/60 backdrop-blur-md border-l border-hadx-border
          transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-5 border-b border-hadx-border">
            <h2 className="text-xs font-mono tracking-[0.3em] uppercase text-hadx-gold-light">
              Loadout Bag
            </h2>
            <button
              onClick={onClose}
              className="text-hadx-gold hover:text-hadx-gold-light transition-colors text-lg leading-none"
              aria-label="Close cart"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {items.length === 0 ? (
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest text-center mt-12">
                Your loadout is empty
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 border border-hadx-border rounded-lg p-3 bg-hadx-card"
                >
                  <div className="w-16 h-16 rounded-md bg-hadx-black overflow-hidden flex items-center justify-center shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[9px] text-zinc-600 font-mono">no image</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-medium text-zinc-100 truncate mb-1">
                      {item.name}
                    </h3>
                    <p className="text-[11px] font-mono text-hadx-gold mb-2">
                      PKR {item.price.toLocaleString()}
                    </p>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onDecrement(item.id)}
                        className="w-6 h-6 flex items-center justify-center rounded border border-hadx-border text-hadx-gold-light hover:border-hadx-border-glow transition-colors"
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        −
                      </button>
                      <span className="text-xs font-mono text-zinc-200 w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onIncrement(item.id)}
                        className="w-6 h-6 flex items-center justify-center rounded border border-hadx-border text-hadx-gold-light hover:border-hadx-border-glow transition-colors"
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

          <div className="border-t border-hadx-border px-6 py-5 space-y-4">
            <div className="flex justify-between text-xs font-mono uppercase tracking-wide text-zinc-400">
              <span>Total</span>
              <span className="text-hadx-gold-light text-sm">
                PKR {total.toLocaleString()}
              </span>
            </div>

            <button
              onClick={onCheckout}
              disabled={items.length === 0}
              className={`
                w-full rounded-xl py-3.5 text-xs font-bold tracking-[0.25em] uppercase
                border border-hadx-border-glow shadow-gold-glow
                transition-all duration-300
                ${
                  items.length === 0
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:shadow-gold-glow-lg"
                }
              `}
            >
              <span className="bg-clip-text text-transparent bg-gold-gradient">
                [ EXECUTE ORDER ]
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}