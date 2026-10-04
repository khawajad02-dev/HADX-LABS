import type { RegionalPrices } from "@/lib/product-meta";

export type DisplayCurrency = "USD" | "PKR" | "INR";

const CURRENCIES = new Set<DisplayCurrency>(["USD", "PKR", "INR"]);

export function currencyFromCountry(country: string | null | undefined): DisplayCurrency {
  const normalized = String(country || "").trim().toUpperCase();
  if (normalized === "PK") return "PKR";
  if (normalized === "IN") return "INR";
  return "USD";
}

export function currencyFromCookieHeader(cookieHeader: string | null | undefined): DisplayCurrency | null {
  const value = String(cookieHeader || "").match(/(?:^|;\s*)hadx_currency=(USD|PKR|INR)(?:;|$)/)?.[1] as DisplayCurrency | undefined;
  return value && CURRENCIES.has(value) ? value : null;
}

export function currencyFromCookieValue(value: string | null | undefined): DisplayCurrency | null {
  return value && CURRENCIES.has(value as DisplayCurrency) ? value as DisplayCurrency : null;
}

export function currencyFromRequest(req: Request): DisplayCurrency {
  return currencyFromCookieHeader(req.headers.get("cookie")) || currencyFromCountry(req.headers.get("x-hadx-geo-country") || req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry"));
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
