import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_request: NextRequest) {
  // Region personalization is optional. Keep this edge middleware passive so
  // a cookie mutation can never crash the entire storefront before render.
  return NextResponse.next();
}

// 4. Very simple matcher to avoid regex errors
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|videos|images|fonts).*)',
  ],
};
