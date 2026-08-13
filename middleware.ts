import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Get the response
  const response = NextResponse.next();

  // 2. Get country from headers
  const country = request.headers.get('x-vercel-ip-country') || 'US';

  // 3. Set the region cookie
  // Using a simple set to avoid any potential Edge Runtime issues with complex options
  response.cookies.set('hadx_region', country);

  return response;
}

// 4. Very simple matcher to avoid regex errors
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|videos|images|fonts).*)',
  ],
};
