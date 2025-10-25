import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Only protect API routes that need authentication
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Allow auth routes, setup, and migration routes
    if (
      request.nextUrl.pathname.startsWith('/api/auth/') ||
      request.nextUrl.pathname === '/api/setup' ||
      request.nextUrl.pathname === '/api/migrate-nextauth'
    ) {
      return NextResponse.next();
    }

    // For all other API routes, let them handle authentication internally
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
