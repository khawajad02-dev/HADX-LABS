import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const country = (request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || "").toUpperCase();
  const requested = request.nextUrl.searchParams.get("currency")?.toUpperCase();
  const stored = request.cookies.get("hadx_currency")?.value?.toUpperCase();
  const currency = requested === "PKR" || requested === "INR" || requested === "USD"
    ? requested
    : stored === "PKR" || stored === "INR" || stored === "USD"
      ? stored
      : country === "PK" ? "PKR" : country === "IN" ? "INR" : "USD";
  const headers = new Headers(request.headers);
  headers.set("x-hadx-geo-country", country || "US");
  const response = NextResponse.next({ request: { headers } });
  response.cookies.set("hadx_currency", currency, { path: "/", maxAge: 60 * 60 * 24 * 180, sameSite: "lax" });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js).*)"],
};
