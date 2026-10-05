import type { RegionalPrices } from "@/lib/product-meta";

export type DisplayCurrency = "USD" | "PKR" | "INR";

const supported = new Set<DisplayCurrency>(["USD", "PKR", "INR"]);

function fromCountry(country: string | null | undefined): DisplayCurrency {
  const normalized = (country || "").toUpperCase();
  if (normalized === "PK") return "PKR";
  if (normalized === "IN") return "INR";
  return "USD";
}

export function currencyFromRequest(req: Request): DisplayCurrency {
  const requested = new URL(req.url).searchParams.get("currency")?.toUpperCase() as DisplayCurrency | undefined;
  if (requested && supported.has(requested)) return requested;
  const cookie = req.headers.get("cookie")?.match(/(?:^|;\s*)hadx_currency=([^;]+)/)?.[1]?.toUpperCase() as DisplayCurrency | undefined;
  if (cookie && supported.has(cookie)) return cookie;
  return fromCountry(req.headers.get("x-hadx-geo-country") || req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry"));
}

export function currencyFromClientCookie(): DisplayCurrency {
  if (typeof document === "undefined") return "USD";
  const value = document.cookie.match(/(?:^|;\s*)hadx_currency=([^;]+)/)?.[1]?.toUpperCase() as DisplayCurrency | undefined;
  return value && supported.has(value) ? value : "USD";
}

export function regionalPrice(priceInCents: number, regionalPrices: RegionalPrices | undefined, currency: DisplayCurrency) {
  const selected = regionalPrices?.[currency];
  return selected && selected > 0 ? selected : priceInCents / 100;
}

export function currencySymbol(currency: DisplayCurrency) {
  if (currency === "PKR") return "PKR";
  if (currency === "INR") return "₹";
  return "$";
}

export function formatMoney(amount: number, currency: DisplayCurrency) {
  return `${currencySymbol(currency)} ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
