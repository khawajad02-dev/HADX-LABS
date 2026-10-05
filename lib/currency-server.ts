import { cookies, headers } from "next/headers";
import type { DisplayCurrency } from "@/lib/currency";

export function currencyFromServer(): DisplayCurrency {
  const stored = cookies().get("hadx_currency")?.value?.toUpperCase() as DisplayCurrency | undefined;
  if (stored === "USD" || stored === "PKR" || stored === "INR") return stored;
  const country = (headers().get("x-hadx-geo-country") || headers().get("x-vercel-ip-country") || headers().get("cf-ipcountry") || "").toUpperCase();
  if (country === "PK") return "PKR";
  if (country === "IN") return "INR";
  return "USD";
}
