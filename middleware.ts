import { NextRequest, NextResponse } from "next/server";
import { currencyFromCountry } from "@/lib/currency";

export function middleware(request: NextRequest) {
  const country = (request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || "").toUpperCase();
  const headers = new Headers(request.headers);
  headers.set("x-hadx-geo-country", country || "US");
  const response = NextResponse.next({ request: { headers } });
  const existingCurrency = request.cookies.get("hadx_currency")?.value;
  const currency = country ? currencyFromCountry(country) : existingCurrency === "PKR" || existingCurrency === "INR" ? existingCurrency : "USD";
  response.cookies.set("hadx_currency", currency, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js).*)"],
};
