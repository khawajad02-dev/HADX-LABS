"use client";

import { useState } from "react";

type VaultButtonProps = {
  productId?: string;
  userId?: string;
  isActive?: boolean;
  onToggle?: (next: boolean) => void;
};

export default function VaultButton({
  productId,
  userId,
  isActive = false,
  onToggle,
}: VaultButtonProps) {
  const [active, setActive] = useState(isActive);
  const [pulsing, setPulsing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;

    const nextState = !active;
    setActive(nextState);
    setPulsing(true);
    setTimeout(() => setPulsing(false), 400);

    onToggle?.(nextState);

    // Agar productId hai, toh backend API call trigger karo
    if (productId) {
      setLoading(true);
      try {
        const res = await fetch("/api/vault", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: nextState ? "add" : "remove",
            productId,
            userId: userId || null,
          }),
        });

        if (!res.ok) {
          // Revert state if backend request fails
          setActive(!nextState);
          console.error("Vault update failed on server.");
        }
      } catch (err) {
        setActive(!nextState);
        console.error("Vault network error:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-pressed={active}
      disabled={loading}
      className={`
        group relative inline-flex items-center gap-2 rounded-lg px-4 py-2
        backdrop-blur-md border transition-all duration-300
        ${
          active
            ? "bg-hadx-gold/10 border-hadx-border-glow shadow-gold-glow"
            : "bg-black/50 border-hadx-border hover:border-hadx-border-glow"
        }
        ${pulsing ? "scale-105" : "scale-100"}
        ${loading ? "opacity-70 cursor-wait" : ""}
      `}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        className={`transition-colors duration-300 ${
          active ? "fill-hadx-gold-light stroke-hadx-gold-light" : "fill-none stroke-hadx-gold"
        }`}
        strokeWidth="1.8"
      >
        <path d="M12 21s-7.5-4.6-10-9.2C.4 8.1 2.3 4 6.2 4c2 0 3.6 1.1 4.8 2.7C12.2 5.1 13.8 4 15.8 4c3.9 0 5.8 4.1 4.2 7.8C19.5 16.4 12 21 12 21z" />
      </svg>
      <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-hadx-gold-light">
        {active ? "IN VAULT" : "STASH IN VAULT"}
      </span>
    </button>
  );
}
