// ============================================
// HADX LABS - Edge Geo-Middleware & Currency Layer
// ============================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const CURRENCY_CONFIG = Object.freeze({
  PK: { currency: "PKR", locale: "en-PK", symbol: "Rs." },
  US: { currency: "USD", locale: "en-US", symbol: "$" },
  GB: { currency: "GBP", locale: "en-GB", symbol: "£" },
  AE: { currency: "AED", locale: "ar-AE", symbol: "AED" },
  DEFAULT: { currency: "USD", locale: "en-US", symbol: "$" },
} as const);

export type SupportedCountry = Exclude<keyof typeof CURRENCY_CONFIG, "DEFAULT">;

export function sanitizeCountryCode(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 2);
}

export function isSupportedCountry(code: string): code is SupportedCountry {
  return code in CURRENCY_CONFIG && code !== "DEFAULT";
}

export function middleware(request: NextRequest) {
  const geoCountry = request.headers.get("x-vercel-ip-country") || "PK";
  const sanitizedCountry = sanitizeCountryCode(geoCountry);

  const resolvedRegion = isSupportedCountry(sanitizedCountry) ? sanitizedCountry : "DEFAULT";
  const regionData = CURRENCY_CONFIG[resolvedRegion];

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-hadx-visitor-country", sanitizedCountry);
  requestHeaders.set("x-hadx-region", resolvedRegion);
  requestHeaders.set("x-hadx-currency", regionData.currency);
  requestHeaders.set("x-hadx-currency-symbol", regionData.symbol);
  requestHeaders.set("x-hadx-locale", regionData.locale);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const existingVary = response.headers.get("Vary") || "";
  if (!existingVary.includes("x-vercel-ip-country")) {
    response.headers.set(
      "Vary",
      existingVary ? `${existingVary}, x-vercel-ip-country` : "x-vercel-ip-country"
    );
  }

  const isProd = process.env.NODE_ENV === "production";

  response.cookies.set("hadx_region", resolvedRegion, {
    path: "/",
    secure: isProd,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  response.cookies.set("hadx_locale", regionData.locale, {
    path: "/",
    secure: isProd,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

export function getServerGeoContext(headersList: Headers) {
  return {
    visitorCountry: headersList.get("x-hadx-visitor-country") || "PK",
    region: headersList.get("x-hadx-region") || "DEFAULT",
    currency: headersList.get("x-hadx-currency") || "PKR",
    symbol: headersList.get("x-hadx-currency-symbol") || "Rs.",
    locale: headersList.get("x-hadx-locale") || "en-US",
  };
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|images|fonts|videos|sitemap.xml|robots.txt|favicon.ico).*)",
  ],
};
