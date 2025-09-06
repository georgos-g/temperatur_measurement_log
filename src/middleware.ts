import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Only protect API routes that need authentication
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Allow auth routes to be accessed without authentication
    if (request.nextUrl.pathname.startsWith('/api/auth/')) {
      return NextResponse.next();
    }

    // Allow setup route for initial database setup
    if (request.nextUrl.pathname === '/api/setup') {
      return NextResponse.next();
    }

    // Check for user session in cookies
    const userCookie = request.cookies.get('user-session');

    if (!userCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      const userSession = JSON.parse(userCookie.value);

      // Validate session structure
      if (!userSession.id || !userSession.email) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      }

      // Add user info to request headers for use in API routes
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', userSession.id);
      requestHeaders.set('x-user-email', userSession.email);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch {
      return NextResponse.json(
        { error: 'Invalid session format' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
