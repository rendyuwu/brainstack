import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// §V.36, §V.37, §V.38: /editor/*, /admin/*, /settings require admin role
const ADMIN_REQUIRED = ['/editor', '/admin', '/settings'];

export async function middleware(request: NextRequest) {
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
  const path = request.nextUrl.pathname;
  const needsAdmin = ADMIN_REQUIRED.some(
    (prefix) => path === prefix || path.startsWith(prefix + '/')
  );

  if (needsAdmin && token.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/editor/:path*', '/admin/:path*', '/settings/:path*'],
};
