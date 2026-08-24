import type { RegionalPrices } from "@/lib/product-meta";

export type DisplayCurrency = "USD" | "PKR" | "INR";

export function currencyFromRequest(req: Request): DisplayCurrency {
  const requested = new URL(req.url).searchParams.get("currency")?.toUpperCase();
  if (requested === "USD" || requested === "PKR" || requested === "INR") return requested;
  const country = (req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry") || "").toUpperCase();
  if (country === "PK") return "PKR";
  if (country === "IN") return "INR";
  return "USD";
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
