import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const country = (request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || "").toUpperCase();
  const headers = new Headers(request.headers);
  headers.set("x-hadx-geo-country", country || "US");
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js).*)"],
};
