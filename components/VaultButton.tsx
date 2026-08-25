"use client";

import { useEffect, useState } from "react";

type VaultButtonProps = {
  productId?: string;
  userId?: string;
  isActive?: boolean;
  onToggle?: (next: boolean) => void;
};

function storageKey(productId: string) {
  return `hadx-vault:${productId}`;
}

export default function VaultButton({ productId, userId, isActive = false, onToggle }: VaultButtonProps) {
  const [active, setActive] = useState(isActive);
  const [pulsing, setPulsing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!productId) return;
    try {
      setActive(window.localStorage.getItem(storageKey(productId)) === "true" || isActive);
    } catch {
      setActive(isActive);
    }
  }, [isActive, productId]);

  const handleClick = async () => {
    if (loading) return;
    if (!productId) {
      setMessage("Open a product to save it");
      return;
    }

    const nextState = !active;
    setActive(nextState);
    setPulsing(true);
    setMessage(nextState ? "Saved on this device" : "Removed from this device");
    window.setTimeout(() => setPulsing(false), 220);
    onToggle?.(nextState);

    try {
      window.localStorage.setItem(storageKey(productId), String(nextState));
      window.dispatchEvent(new Event("hadx:favorites"));
    } catch {
      // The server sync below still works for authenticated users when storage is unavailable.
    }

    if (!userId) return;

    setLoading(true);
    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, productId, active: nextState }),
      });
      if (!res.ok) throw new Error("Vault sync failed");
      setMessage(nextState ? "Saved to Vault" : "Removed from Vault");
    } catch {
      setActive(!nextState);
      try {
        window.localStorage.setItem(storageKey(productId), String(!nextState));
        window.dispatchEvent(new Event("hadx:favorites"));
      } catch {
        // Keep the visible rollback even when browser storage is unavailable.
      }
      setMessage("Could not sync Vault");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={active}
        disabled={loading}
        className={`liquid-ui favorite-glass-control group relative inline-flex items-center gap-2 rounded-lg border bg-transparent px-6 py-3 transition-transform duration-150 ${active ? "border-hadx-border-glow shadow-gold-glow" : "border-hadx-border hover:border-hadx-border-glow"} ${pulsing ? "scale-[1.03]" : "scale-100"} ${loading ? "cursor-wait opacity-70" : ""}`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" className={`transition-colors duration-150 ${active ? "fill-hadx-gold-light stroke-hadx-gold-light" : "fill-none stroke-hadx-gold"}`} strokeWidth="1.8" aria-hidden="true">
          <path d="M12 21s-7.5-4.6-10-9.2C.4 8.1 2.3 4 6.2 4c2 0 3.6 1.1 4.8 2.7C12.2 5.1 13.8 4 15.8 4c3.9 0 5.8 4.1 4.2 7.8C19.5 16.4 12 21 12 21z" />
        </svg>
        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-hadx-gold-light">{active ? "SAVED TO FAVORITES" : "ADD TO FAVORITES"}</span>
      </button>
      {message ? <span role="status" className="px-1 text-[9px] font-mono uppercase tracking-[0.14em] text-white/55">{message.replace("Vault", "Favorites")}</span> : null}
    </div>
  );
}
