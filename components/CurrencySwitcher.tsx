"use client";

import { useEffect, useState } from "react";

type Currency = "USD" | "PKR" | "INR";
const CURRENCIES: Currency[] = ["USD", "PKR", "INR"];

function currentCurrency(): Currency {
  if (typeof window === "undefined") return "USD";
  const value = document.cookie.match(/(?:^|;\s*)hadx_currency=([^;]+)/)?.[1]?.toUpperCase();
  return value === "PKR" || value === "INR" ? value : "USD";
}

export default function CurrencySwitcher() {
  const [active, setActive] = useState<Currency>("USD");

  useEffect(() => setActive(currentCurrency()), []);

  const choose = (currency: Currency) => {
    setActive(currency);
    document.cookie = `hadx_currency=${currency}; Path=/; Max-Age=${60 * 60 * 24 * 180}; SameSite=Lax`;
    window.location.assign(`${window.location.pathname}${window.location.hash || "#catalog"}`);
  };

  return (
    <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-black/20 p-1 sm:flex" aria-label="Choose display currency">
      {CURRENCIES.map((currency) => (
        <button key={currency} type="button" onClick={() => choose(currency)} aria-pressed={active === currency} className={`rounded-full px-2.5 py-1 text-[9px] font-mono tracking-widest transition-colors ${active === currency ? "bg-amber-100/15 text-amber-100" : "text-zinc-500 hover:text-white"}`}>
          {currency}
        </button>
      ))}
    </div>
  );
}
