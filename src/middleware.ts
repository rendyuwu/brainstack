import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// §V.36, §V.37, §V.38, §V.40: /editor/*, /admin/*, /settings, /ask require admin role
const ADMIN_REQUIRED = ['/editor', '/admin', '/settings', '/ask'];

// §V.45: Methods that mutate state require Origin validation
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// §V.45: Skip CSRF for NextAuth callbacks (need cross-origin for OAuth flows)
const CSRF_EXEMPT = ['/api/auth/'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isApiRoute = path.startsWith('/api/');

  // §V.45: CSRF protection — validate Origin header on state-mutating requests
  // Applies to ALL matched routes including /api/*
  if (MUTATING_METHODS.has(request.method)) {
    const isExempt = CSRF_EXEMPT.some((prefix) => path.startsWith(prefix));
    if (!isExempt) {
      const origin = request.headers.get('origin');
      const expectedOrigin = request.nextUrl.origin;

      if (origin && origin !== expectedOrigin) {
        return NextResponse.json(
          { error: 'Forbidden: origin mismatch' },
          { status: 403 },
        );
      }
    }
  }

  // API routes: CSRF check only, no auth redirect (API routes handle their own auth)
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Page routes: full auth check
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  // No token → redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // §V.36: check admin role for protected routes
  const needsAdmin = ADMIN_REQUIRED.some(
    (prefix) => path === prefix || path.startsWith(prefix + '/')
  );

  if (needsAdmin && token.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/editor/:path*',
    '/admin/:path*',
    '/settings/:path*',
    '/ask/:path*',
    '/api/:path*',
  ],
};
