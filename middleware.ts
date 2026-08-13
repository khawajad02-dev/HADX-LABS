import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const CURRENCY_CONFIG = {
  PK: { currency: "PKR", locale: "en-PK", symbol: "Rs." },
  US: { currency: "USD", locale: "en-US", symbol: "$" },
  GB: { currency: "GBP", locale: "en-GB", symbol: "£" },
  AE: { currency: "AED", locale: "ar-AE", symbol: "AED" },
  DEFAULT: { currency: "USD", locale: "en-US", symbol: "$" },
} as const;

export function middleware(request: NextRequest) {
  // 1. Basic bypass for static assets
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/videos') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Simple Geo Detection
  const geoCountry = request.headers.get("x-vercel-ip-country") || "US";
  const resolvedRegion = (geoCountry in CURRENCY_CONFIG) ? geoCountry : "DEFAULT";
  const regionData = CURRENCY_CONFIG[resolvedRegion as keyof typeof CURRENCY_CONFIG];

  // 3. Set Headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-hadx-region", resolvedRegion);
  requestHeaders.set("x-hadx-currency", regionData.currency);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 4. Set Cookies
  const isProd = process.env.NODE_ENV === "production";
  response.cookies.set("hadx_region", resolvedRegion, {
    path: "/",
    secure: isProd,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
